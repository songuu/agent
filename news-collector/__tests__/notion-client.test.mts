import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isRetryableNotionError,
  withNotionRetry,
} from "../src/notion/client.ts";

const noSleep = async () => {};

test("retries retryable failures then succeeds", async () => {
  let attempts = 0;
  const result = await withNotionRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("429-ish");
      return "ok";
    },
    { sleep: noSleep, isRetryable: () => true },
  );
  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});

test("gives up after maxRetries and rethrows", async () => {
  let attempts = 0;
  await assert.rejects(
    withNotionRetry(
      async () => {
        attempts += 1;
        throw new Error("always");
      },
      { sleep: noSleep, isRetryable: () => true, maxRetries: 2 },
    ),
    /always/,
  );
  assert.equal(attempts, 3); // initial + 2 retries
});

test("non-retryable error throws immediately (single attempt)", async () => {
  let attempts = 0;
  await assert.rejects(
    withNotionRetry(
      async () => {
        attempts += 1;
        throw new Error("fatal");
      },
      { sleep: noSleep, isRetryable: () => false },
    ),
    /fatal/,
  );
  assert.equal(attempts, 1);
});

test("honors Retry-After header (seconds → ms) before exponential backoff", async () => {
  const delays: number[] = [];
  let attempts = 0;
  const err = { headers: new Headers({ "retry-after": "2" }) };
  await withNotionRetry(
    async () => {
      attempts += 1;
      if (attempts < 2) throw err;
      return "ok";
    },
    { sleep: async (ms) => { delays.push(ms); }, isRetryable: () => true },
  );
  assert.deepEqual(delays, [2000]);
});

test("exponential backoff when no Retry-After header", async () => {
  const delays: number[] = [];
  let attempts = 0;
  await withNotionRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("x");
      return "ok";
    },
    { sleep: async (ms) => { delays.push(ms); }, isRetryable: () => true, baseDelayMs: 100 },
  );
  assert.deepEqual(delays, [100, 200]);
});

test("node fetch network errors are retryable", () => {
  const reset = Object.assign(new Error("request failed"), { cause: { code: "ECONNRESET" } });
  const timeout = Object.assign(new Error("request failed"), { code: "ETIMEDOUT" });
  assert.equal(isRetryableNotionError(reset), true);
  assert.equal(isRetryableNotionError(timeout), true);
});

test("plain errors are not classified as retryable Notion errors", () => {
  assert.equal(isRetryableNotionError(new Error("nope")), false);
  assert.equal(isRetryableNotionError(null), false);
});
