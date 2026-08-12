import { describe, it, expect } from "vitest";
import { isRateLimitError } from "./utils.js";

describe("isRateLimitError", () => {
  it("should return true for 429 status code in error message", () => {
    expect(isRateLimitError(new Error("Request failed with status code 429"))).toBe(true);
  });

  it("should return true for RATELIMIT_EXCEEDED string", () => {
    expect(isRateLimitError(new Error("Error: RATELIMIT_EXCEEDED for user"))).toBe(true);
  });

  it("should return true for quota string", () => {
    expect(isRateLimitError(new Error("You have exceeded your Quota"))).toBe(true);
    expect(isRateLimitError(new Error("quota exceeded"))).toBe(true);
  });

  it("should return true for rate limit string", () => {
    expect(isRateLimitError(new Error("Rate Limit reached"))).toBe(true);
    expect(isRateLimitError(new Error("rate limit hit"))).toBe(true);
  });

  it("should handle non-Error string objects", () => {
    expect(isRateLimitError("429 error")).toBe(true);
  });

  it("should handle object with toString that includes matching string", () => {
    const errorObj = {
      toString: () => "Some random error that mentions 429"
    };
    expect(isRateLimitError(errorObj)).toBe(true);
  });

  it("should return false for unrelated errors", () => {
    expect(isRateLimitError(new Error("500 Internal Server Error"))).toBe(false);
    expect(isRateLimitError(new Error("Network timeout"))).toBe(false);
    expect(isRateLimitError("Just a regular error")).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
  });
});
