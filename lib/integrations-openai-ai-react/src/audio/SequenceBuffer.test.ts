import { describe, it, expect, beforeEach } from "vitest";
import { SequenceBuffer } from "./useAudioPlayback";

describe("SequenceBuffer", () => {
  let buffer: SequenceBuffer;

  beforeEach(() => {
    buffer = new SequenceBuffer();
  });

  it("should return chunks when pushed in order", () => {
    const res1 = buffer.push(0, "chunk0");
    expect(res1).toEqual(["chunk0"]);

    const res2 = buffer.push(1, "chunk1");
    expect(res2).toEqual(["chunk1"]);

    const res3 = buffer.push(2, "chunk2");
    expect(res3).toEqual(["chunk2"]);
  });

  it("should buffer out-of-order chunks and return them when the missing sequence arrives", () => {
    // Push seq 1 and seq 2 out of order
    const res1 = buffer.push(1, "chunk1");
    expect(res1).toEqual([]);

    const res2 = buffer.push(2, "chunk2");
    expect(res2).toEqual([]);

    // Push seq 0, it should return seq 0, 1, and 2
    const res0 = buffer.push(0, "chunk0");
    expect(res0).toEqual(["chunk0", "chunk1", "chunk2"]);
  });

  it("should handle multiple chunks pushed to the same sequence number correctly", () => {
    // Actually, the current implementation pushes all strings into an array for the sequence number.
    const res1 = buffer.push(1, "chunk1a");
    expect(res1).toEqual([]);

    const res2 = buffer.push(1, "chunk1b");
    expect(res2).toEqual([]);

    const res0 = buffer.push(0, "chunk0");
    expect(res0).toEqual(["chunk0", "chunk1a", "chunk1b"]);
  });

  it("should continue processing correctly after an out-of-order batch is completed", () => {
    buffer.push(1, "chunk1");
    const res0 = buffer.push(0, "chunk0");
    expect(res0).toEqual(["chunk0", "chunk1"]);

    // Next expected is 2
    const res2 = buffer.push(2, "chunk2");
    expect(res2).toEqual(["chunk2"]);

    // Push 4 out of order
    const res4 = buffer.push(4, "chunk4");
    expect(res4).toEqual([]);

    // Push 3, which satisfies the chain for 3 and 4
    const res3 = buffer.push(3, "chunk3");
    expect(res3).toEqual(["chunk3", "chunk4"]);
  });

  it("should clear its state when reset() is called", () => {
    buffer.push(1, "chunk1");
    expect(buffer.push(0, "chunk0")).toEqual(["chunk0", "chunk1"]);

    // nextSeq is now 2
    buffer.reset();

    // After reset, it should expect 0 again
    const res0 = buffer.push(0, "newChunk0");
    expect(res0).toEqual(["newChunk0"]);
  });
});
