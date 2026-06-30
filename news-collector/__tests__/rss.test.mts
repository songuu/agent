import assert from "node:assert/strict";
import { test } from "node:test";
import { FIXTURE_SOURCES, fixtureFetchFeed, readFixture } from "../src/fixtures.ts";
import { fetchFeed, parseAIBaseNewsHtml, parseFeedString } from "../src/rss.ts";
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

test("parses AIBase SSR news list cards", () => {
  const items = parseAIBaseNewsHtml(readFixture("aibase-news-sample.html"));
  assert.equal(items.length, 2);
  assert.equal(
    items[0].title,
    '火山引擎发布豆包音频生成模型1.0：一句话生成影视级音频，角色声音 10 分钟都不"串戏"',
  );
  assert.equal(items[0].link, "https://news.aibase.com/zh/news/29118");
  assert.match(items[0].contentSnippet ?? "", /端到端生成完整音频作品/);
});

test("fetchFeed retries retryable failures up to source policy", async () => {
  let parseUrlCalls = 0;
  let fetchCalls = 0;
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
  const realFetch = globalThis.fetch;
  const realParserParseUrl = (await import("rss-parser")).default.prototype.parseURL;
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void) => {
    fn();
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;
  (await import("rss-parser")).default.prototype.parseURL = async function () {
    parseUrlCalls += 1;
    throw new Error("Status code 502");
  };
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("Status code 502");
  }) as typeof fetch;

  try {
    const result = await fetchFeed(source, { timeoutMs: 10 });
    assert.equal(result.ok, false);
    assert.equal(result.attempts, 5);
    assert.equal(parseUrlCalls, 5);
    assert.equal(fetchCalls, 5);
    assert.match(result.diagnostics ?? "", /critical/);
    assert.match(result.diagnostics ?? "", /retry-exhausted/);
  } finally {
    globalThis.setTimeout = original;
    globalThis.fetch = realFetch;
    (await import("rss-parser")).default.prototype.parseURL = realParserParseUrl;
  }
});
test("fetchFeed falls back to fetch+parseString when parser URL fetch hits TLS errors", async () => {
  const source: NewsSource = {
    key: "google-like",
    name: "Google Like",
    url: "https://example.com/feed",
    kind: "vendor-blog",
    lang: "en",
    enabled: true,
    critical: true,
    retry: { maxAttempts: 5, baseDelayMs: 1 },
  };
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example</title>
    <item>
      <title>Recovered item</title>
      <link>https://example.com/recovered</link>
      <description>Recovered through fetch fallback.</description>
      <pubDate>Tue, 30 Jun 2026 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

  const realParserParseUrl = (await import("rss-parser")).default.prototype.parseURL;
  const realFetch = globalThis.fetch;
  (await import("rss-parser")).default.prototype.parseURL = async function () {
    throw new Error("Client network socket disconnected before secure TLS connection was established");
  };
  globalThis.fetch = (async () => {
    return new Response(xml, {
      status: 200,
      headers: { "content-type": "application/rss+xml" },
    });
  }) as typeof fetch;

  try {
    const result = await fetchFeed(source, { timeoutMs: 10 });
    assert.equal(result.ok, true);
    assert.equal(result.attempts, 1);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].title, "Recovered item");
  } finally {
    (await import("rss-parser")).default.prototype.parseURL = realParserParseUrl;
    globalThis.fetch = realFetch;
  }
});


