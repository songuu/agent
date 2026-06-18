import assert from "node:assert/strict";
import { test } from "node:test";
import { FIXTURE_SOURCES, fixtureFetchFeed, readFixture } from "../src/fixtures.ts";
import { fetchFeed, parseFeedString } from "../src/rss.ts";
import type { NewsSource } from "../src/types.ts";

test("parses an RSS 2.0 fixture", async () => {
  const items = await parseFeedString(readFixture("qbitai-sample.xml"));
  assert.ok(items.length >= 3, "expected >= 3 items");
  assert.ok(items[0].title.length > 0);
  assert.ok(items[0].link.startsWith("http"));
});

test("parses an Atom fixture (link href + id + summary)", async () => {
  const items = await parseFeedString(readFixture("atom-sample.xml"));
  assert.ok(items.length >= 2, "expected >= 2 entries");
  assert.ok(items[0].link.startsWith("http"));
  assert.ok(
    (items[0].contentSnippet ?? items[0].content ?? items[0].summary ?? "").length > 0,
  );
});

test("malformed feed makes parseFeedString reject", async () => {
  await assert.rejects(() => parseFeedString(readFixture("malformed.xml")));
});

test("fixtureFetchFeed never throws; unknown source → ok:false", async () => {
  const unknown: NewsSource = {
    key: "does-not-exist",
    name: "x",
    url: "fixture://x",
    kind: "en-media",
    lang: "en",
    enabled: true,
  };
  const result = await fixtureFetchFeed(unknown);
  assert.equal(result.ok, false);
  assert.equal(result.items.length, 0);
});

test("fixtureFetchFeed parses a known fixture source", async () => {
  const result = await fixtureFetchFeed(FIXTURE_SOURCES[0]);
  assert.equal(result.ok, true);
  assert.ok(result.items.length >= 3);
});

test("fetchFeed retries retryable failures up to source policy", async () => {
  let calls = 0;
  const source: NewsSource = {
    key: "retry-me",
    name: "Retry Me",
    url: "https://retry.example/feed",
    kind: "vendor-blog",
    lang: "en",
    enabled: true,
    critical: true,
    retry: { maxAttempts: 5, baseDelayMs: 1 },
  };

  const original = globalThis.setTimeout;
  const realParserParseUrl = (await import("rss-parser")).default.prototype.parseURL;
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void) => {
    fn();
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;
  (await import("rss-parser")).default.prototype.parseURL = async function () {
    calls += 1;
    throw new Error("Status code 502");
  };

  try {
    const result = await fetchFeed(source, { timeoutMs: 10 });
    assert.equal(result.ok, false);
    assert.equal(result.attempts, 5);
    assert.equal(calls, 5);
    assert.match(result.diagnostics ?? "", /critical/);
    assert.match(result.diagnostics ?? "", /retry-exhausted/);
  } finally {
    globalThis.setTimeout = original;
    (await import("rss-parser")).default.prototype.parseURL = realParserParseUrl;
  }
});
