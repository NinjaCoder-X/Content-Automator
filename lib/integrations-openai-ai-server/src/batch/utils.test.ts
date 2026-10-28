import { describe, it, expect, vi } from "vitest";
import { isRateLimitError, batchProcess, batchProcessWithSSE } from "./utils";

describe("isRateLimitError", () => {
  it("returns true for errors containing '429'", () => {
    expect(isRateLimitError(new Error("HTTP 429 Too Many Requests"))).toBe(true);
    expect(isRateLimitError("Error code 429")).toBe(true);
  });

  it("returns true for errors containing 'RATELIMIT_EXCEEDED'", () => {
    expect(isRateLimitError(new Error("RATELIMIT_EXCEEDED"))).toBe(true);
  });

  it("returns true for errors containing 'quota' case-insensitively", () => {
    expect(isRateLimitError(new Error("You exceeded your current QUOTA"))).toBe(true);
    expect(isRateLimitError("quota exceeded")).toBe(true);
  });

  it("returns true for errors containing 'rate limit' case-insensitively", () => {
    expect(isRateLimitError(new Error("Rate Limit reached"))).toBe(true);
    expect(isRateLimitError("RATE LIMIT EXCEEDED")).toBe(true);
  });

  it("returns false for non-rate limit errors", () => {
    expect(isRateLimitError(new Error("500 Internal Server Error"))).toBe(false);
    expect(isRateLimitError(new Error("Invalid parameters"))).toBe(false);
    expect(isRateLimitError("Generic failure")).toBe(false);
  });
});

describe("batchProcess", () => {
  it("processes all items and returns results in original order", async () => {
    const items = ["a", "b", "c", "d"];
    const processor = vi.fn(async (item: string, index: number) => {
      return `${item.toUpperCase()}_${index}`;
    });

    const results = await batchProcess(items, processor, {
      concurrency: 2,
      minTimeout: 1,
      maxTimeout: 10,
    });

    expect(results).toEqual(["A_0", "B_1", "C_2", "D_3"]);
    expect(processor).toHaveBeenCalledTimes(4);
  });

  it("handles empty items array", async () => {
    const processor = vi.fn();
    const results = await batchProcess([], processor);
    expect(results).toEqual([]);
    expect(processor).not.toHaveBeenCalled();
  });

  it("respects concurrency option", async () => {
    const items = [1, 2, 3, 4, 5, 6];
    let activeWorkers = 0;
    let maxActiveWorkers = 0;

    const processor = async (item: number) => {
      activeWorkers++;
      maxActiveWorkers = Math.max(maxActiveWorkers, activeWorkers);
      await new Promise((resolve) => globalThis.setTimeout(resolve, 20));
      activeWorkers--;
      return item * 2;
    };

    const results = await batchProcess(items, processor, {
      concurrency: 2,
      minTimeout: 1,
      maxTimeout: 10,
    });

    expect(results).toEqual([2, 4, 6, 8, 10, 12]);
    expect(maxActiveWorkers).toBeLessThanOrEqual(2);
  });

  it("calls onProgress callback as items complete", async () => {
    const items = ["item1", "item2", "item3"];
    const onProgress = vi.fn();

    await batchProcess(
      items,
      async (item) => `processed_${item}`,
      {
        concurrency: 1,
        onProgress,
        minTimeout: 1,
        maxTimeout: 10,
      }
    );

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3, "item1");
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3, "item2");
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3, "item3");
  });

  it("retries on rate limit errors", async () => {
    let attempts = 0;
    const processor = vi.fn(async (item: string) => {
      attempts++;
      if (attempts < 3) {
        throw new Error("429 Too Many Requests");
      }
      return `success_${item}`;
    });

    const results = await batchProcess(["test"], processor, {
      retries: 5,
      minTimeout: 1,
      maxTimeout: 10,
    });

    expect(results).toEqual(["success_test"]);
    expect(attempts).toBe(3);
  });

  it("immediately aborts without retrying on non-rate-limit errors", async () => {
    let attempts = 0;
    const processor = vi.fn(async () => {
      attempts++;
      throw new Error("400 Bad Request");
    });

    await expect(
      batchProcess(["item"], processor, {
        retries: 5,
        minTimeout: 1,
        maxTimeout: 10,
      })
    ).rejects.toThrow("400 Bad Request");

    expect(attempts).toBe(1);
  });

  it("handles non-Error exceptions in processor", async () => {
    const processor = vi.fn(async () => {
      throw "string exception";
    });

    await expect(
      batchProcess(["item"], processor, {
        retries: 3,
        minTimeout: 1,
        maxTimeout: 10,
      })
    ).rejects.toThrow("string exception");
  });
});

describe("batchProcessWithSSE", () => {
  it("emits correct SSE event sequence on success", async () => {
    const items = ["x", "y"];
    const sendEvent = vi.fn();
    const processor = vi.fn(async (item: string, index: number) => `${item}_${index}`);

    const results = await batchProcessWithSSE(items, processor, sendEvent, {
      minTimeout: 1,
      maxTimeout: 10,
    });

    expect(results).toEqual(["x_0", "y_1"]);
    expect(sendEvent).toHaveBeenCalledWith({ type: "started", total: 2 });
    expect(sendEvent).toHaveBeenCalledWith({ type: "processing", index: 0, item: "x" });
    expect(sendEvent).toHaveBeenCalledWith({ type: "progress", index: 0, result: "x_0" });
    expect(sendEvent).toHaveBeenCalledWith({ type: "processing", index: 1, item: "y" });
    expect(sendEvent).toHaveBeenCalledWith({ type: "progress", index: 1, result: "y_1" });
    expect(sendEvent).toHaveBeenCalledWith({ type: "complete", processed: 2, errors: 0 });
  });

  it("retries on rate limit errors in SSE processing", async () => {
    const sendEvent = vi.fn();
    let attempts = 0;

    const processor = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error("429 Rate limit exceeded");
      }
      return "recovered";
    };

    const results = await batchProcessWithSSE(["a"], processor, sendEvent, {
      retries: 3,
      minTimeout: 1,
      maxTimeout: 10,
    });

    expect(results).toEqual(["recovered"]);
    expect(attempts).toBe(2);
    expect(sendEvent).toHaveBeenCalledWith({ type: "complete", processed: 1, errors: 0 });
  });

  it("captures non-rate-limit errors per item without aborting batch", async () => {
    const sendEvent = vi.fn();
    const items = ["good1", "bad", "good2"];

    const processor = async (item: string) => {
      if (item === "bad") {
        throw new Error("Validation failed");
      }
      return `ok_${item}`;
    };

    const results = await batchProcessWithSSE(items, processor, sendEvent, {
      minTimeout: 1,
      maxTimeout: 10,
    });

    expect(results).toEqual(["ok_good1", undefined, "ok_good2"]);
    expect(sendEvent).toHaveBeenCalledWith({
      type: "progress",
      index: 1,
      error: "Validation failed",
    });
    expect(sendEvent).toHaveBeenCalledWith({
      type: "complete",
      processed: 3,
      errors: 1,
    });
  });

  it("handles non-Error throw in SSE processor", async () => {
    const sendEvent = vi.fn();
    const processor = async () => {
      throw "custom error string";
    };

    const results = await batchProcessWithSSE(["item"], processor, sendEvent, {
      minTimeout: 1,
      maxTimeout: 10,
    });

    expect(results).toEqual([undefined]);
    expect(sendEvent).toHaveBeenCalledWith({
      type: "progress",
      index: 0,
      error: "custom error string",
    });
  });
});
