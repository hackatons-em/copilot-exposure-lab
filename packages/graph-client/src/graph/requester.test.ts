import { describe, expect, it } from "vitest";
import { GraphError, withRetry } from "./requester.js";

const noSleep = async (): Promise<void> => {};

describe("withRetry", () => {
  it("retries throttled (429) calls and then succeeds", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new GraphError("throttled", 429, 1);
        return "ok";
      },
      { maxRetries: 5, sleep: noSleep },
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("honors Retry-After by sleeping the provided ms", async () => {
    const slept: number[] = [];
    let calls = 0;
    await withRetry(
      async () => {
        calls += 1;
        if (calls < 2) throw new GraphError("throttled", 429, 4000);
        return "ok";
      },
      { maxRetries: 3, sleep: async (ms) => void slept.push(ms) },
    );
    expect(slept).toEqual([4000]);
  });

  it("gives up after maxRetries", async () => {
    await expect(
      withRetry(async () => {
        throw new GraphError("throttled", 429);
      }, { maxRetries: 2, sleep: noSleep }),
    ).rejects.toThrow(GraphError);
  });

  it("does not retry non-retryable errors (404)", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new GraphError("not found", 404);
      }, { maxRetries: 5, sleep: noSleep }),
    ).rejects.toThrow();
    expect(calls).toBe(1);
  });
});
