import assert from "node:assert/strict";
import { test } from "node:test";
import { FIXTURE_SOURCES, fixtureFetchFeed, readFixture } from "../src/fixtures.ts";
import {
  fetchFeed,
  parseAIBaseNewsHtml,
  parseFeedString,
  parseGitHubReleasesJson,
  parseHackerNewsAlgoliaJson,
} from "../src/rss.ts";
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

test("parses Hacker News Algolia stories and keeps Ask HN discussion URLs", () => {
  const items = parseHackerNewsAlgoliaJson(
    JSON.stringify({
      hits: [
        {
          objectID: "123",
          title: "Ask HN: How do you evaluate AI agents?",
          story_text: "Looking for evaluation practices.",
          created_at: "2026-07-20T00:00:00Z",
        },
        {
          objectID: "456",
          title: "Agent runtime launch",
          url: "https://example.com/agent-runtime",
          created_at: "2026-07-20T00:01:00Z",
        },
      ],
    }),
  );

  assert.equal(items.length, 2);
  assert.equal(items[0]?.link, "https://news.ycombinator.com/item?id=123");
  assert.equal(items[0]?.guid, "hn-123");
  assert.equal(items[1]?.link, "https://example.com/agent-runtime");
});

test("parses GitHub releases API rows", () => {
  const source: NewsSource = {
    key: "github-api",
    name: "GitHub API",
    url: "https://api.github.com/repos/example/repo/releases?per_page=10",
    format: "github-releases-api",
    kind: "release",
    lang: "en",
    enabled: true,
  };
  const items = parseGitHubReleasesJson(
    JSON.stringify([
      {
        id: 42,
        tag_name: "v1.2.3",
        name: "Release 1.2.3",
        html_url: "https://github.com/example/repo/releases/tag/v1.2.3",
        body: "Fixes agent runtime retries.",
        published_at: "2026-07-21T00:00:00Z",
      },
    ]),
    source,
  );

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, "Release 1.2.3");
  assert.equal(items[0]?.link, "https://github.com/example/repo/releases/tag/v1.2.3");
  assert.equal(items[0]?.guid, "github-api-42");
});

test("fetchFeed uses GitHub releases API before Atom feed for release sources", async () => {
  const source: NewsSource = {
    key: "openai-agents-js-releases",
    name: "OpenAI Agents JS Releases",
    url: "https://github.com/openai/openai-agents-js/releases.atom",
    kind: "release",
    lang: "en",
    enabled: true,
    critical: true,
    retry: { maxAttempts: 5, baseDelayMs: 1 },
  };
  const realFetch = globalThis.fetch;
  const seenUrls: string[] = [];
  globalThis.fetch = (async (input) => {
    seenUrls.push(String(input));
    return new Response(
      JSON.stringify([
        {
          id: 101,
          tag_name: "v0.13.5",
          html_url: "https://github.com/openai/openai-agents-js/releases/tag/v0.13.5",
          published_at: "2026-07-21T00:00:00Z",
        },
      ]),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await fetchFeed(source, { timeoutMs: 15_000 });
    assert.equal(result.ok, true);
    assert.equal(result.attempts, 1);
    assert.equal(result.items[0]?.title, "v0.13.5");
    assert.deepEqual(seenUrls, ["https://api.github.com/repos/openai/openai-agents-js/releases?per_page=10"]);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("fetchFeed caps GitHub release retry attempts to avoid long-tail worker stalls", async () => {
  const source: NewsSource = {
    key: "langgraph-releases",
    name: "LangGraph Releases",
    url: "https://github.com/langchain-ai/langgraph/releases.atom",
    kind: "release",
    lang: "en",
    enabled: true,
    critical: true,
    retry: { maxAttempts: 5, baseDelayMs: 1 },
  };
  const realFetch = globalThis.fetch;
  const realParserParseUrl = (await import("rss-parser")).default.prototype.parseURL;
  const realSetTimeout = globalThis.setTimeout;
  let apiFetchCalls = 0;
  let fallbackFetchCalls = 0;
  let parseUrlCalls = 0;
  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.includes("api.github.com")) apiFetchCalls += 1;
    else fallbackFetchCalls += 1;
    throw new Error("fetch failed");
  }) as typeof fetch;
  (await import("rss-parser")).default.prototype.parseURL = async function () {
    parseUrlCalls += 1;
    throw new Error("Request timed out after 8000ms");
  };
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void) => {
    fn();
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;

  try {
    const result = await fetchFeed(source, { timeoutMs: 15_000 });
    assert.equal(result.ok, false);
    assert.equal(result.attempts, 2);
    assert.equal(apiFetchCalls, 2);
    assert.equal(fallbackFetchCalls, 2);
    assert.equal(parseUrlCalls, 2);
    assert.match(result.diagnostics ?? "", /attempts=2\/2/);
  } finally {
    globalThis.fetch = realFetch;
    (await import("rss-parser")).default.prototype.parseURL = realParserParseUrl;
    globalThis.setTimeout = realSetTimeout;
  }
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


test("fetchFeed recovers Hacker News through RSS when the Algolia API returns 502", async () => {
  const source: NewsSource = {
    key: "hn-fallback",
    name: "Hacker News fallback",
    url: "https://hn.algolia.com/api/v1/search_by_date?query=agent",
    format: "hacker-news-algolia",
    fallbacks: [{ url: "https://hnrss.org/newest?q=agent&count=30", format: "feed" }],
    kind: "community",
    lang: "en",
    enabled: true,
    critical: true,
    retry: { maxAttempts: 1, baseDelayMs: 1 },
  };
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><item><title>Recovered HN item</title><link>https://example.com/recovered</link></item></channel></rss>`;
  const realParserParseUrl = (await import("rss-parser")).default.prototype.parseURL;
  const realFetch = globalThis.fetch;
  (await import("rss-parser")).default.prototype.parseURL = async function () {
    throw new Error("parser transport unavailable");
  };
  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.includes("hn.algolia.com")) return new Response("upstream unavailable", { status: 502 });
    return new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml" } });
  }) as typeof fetch;

  try {
    const result = await fetchFeed(source, { timeoutMs: 10 });
    assert.equal(result.ok, true);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.title, "Recovered HN item");
  } finally {
    (await import("rss-parser")).default.prototype.parseURL = realParserParseUrl;
    globalThis.fetch = realFetch;
  }
});

test("fetchFeed retries transient fetch failures and malformed feed responses", async () => {
  const source: NewsSource = {
    key: "retry-malformed",
    name: "Retry malformed",
    url: "https://retry.example/feed",
    kind: "en-media",
    lang: "en",
    enabled: true,
    retry: { maxAttempts: 2, baseDelayMs: 1 },
  };
  const realParserParseUrl = (await import("rss-parser")).default.prototype.parseURL;
  const realFetch = globalThis.fetch;
  const realSetTimeout = globalThis.setTimeout;
  let parseUrlCalls = 0;
  (await import("rss-parser")).default.prototype.parseURL = async function () {
    parseUrlCalls += 1;
    if (parseUrlCalls === 1) throw new Error("Unexpected close tag");
    return {
      items: [{ title: "Recovered after malformed response", link: "https://example.com/recovered" }],
    } as never;
  };
  globalThis.fetch = (async () => {
    throw new Error("fetch failed");
  }) as typeof fetch;
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void) => {
    fn();
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;

  try {
    const result = await fetchFeed(source, { timeoutMs: 10 });
    assert.equal(result.ok, true);
    assert.equal(result.attempts, 2);
    assert.equal(result.items[0]?.title, "Recovered after malformed response");
  } finally {
    (await import("rss-parser")).default.prototype.parseURL = realParserParseUrl;
    globalThis.fetch = realFetch;
    globalThis.setTimeout = realSetTimeout;
  }
});

