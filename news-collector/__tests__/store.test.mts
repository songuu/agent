import assert from "node:assert/strict";
import { test } from "node:test";
import { upsertNewsItems } from "../src/store.ts";
import type { NewsItem } from "../src/types.ts";

const SUPABASE = { url: "https://db.example.com", serviceRoleKey: "svc-role", schema: "public" };

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function sampleNewsItem(index: number): NewsItem {
  return {
    externalId: `external-${index.toString().padStart(3, "0")}`,
    sourceKey: "test-source",
    sourceName: "Test Source",
    sourceKind: "release",
    title: `Test item ${index}`,
    url: `https://example.com/items/${index}`,
    summary: "summary",
    contentText: "content",
    contentExcerpt: "content",
    contentStatus: "fetched",
    contentFetchedAt: "2026-07-13T00:00:00.000Z",
    ecosystemLayer: "runtime",
    ecosystemLayerLabel: "Runtime",
    tags: ["agent", "runtime"],
    lang: "en",
    publishedAt: "2026-07-13T00:00:00.000Z",
    publishedDate: "2026-07-13",
    collectedAt: "2026-07-13T00:00:00.000Z",
    collectedDate: "2026-07-13",
    enriched: false,
    metadata: { sourceUrl: "https://example.com/feed" },
  };
}

function fakeFetch(calls: Call[]): typeof fetch {
  return (async (url: string | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({
      url: String(url),
      method,
      headers: (init?.headers as Record<string, string>) ?? {},
      body: typeof init?.body === "string" ? init.body : undefined,
    });
    if (method === "POST") return new Response(null, { status: 201 });
    return new Response("[]", { status: 200, headers: { "content-range": "0-0/205" } });
  }) as unknown as typeof fetch;
}

test("upserts news_items in bounded chunks", async () => {
  const calls: Call[] = [];
  const items = Array.from({ length: 205 }, (_, index) => sampleNewsItem(index));

  const result = await upsertNewsItems(items, SUPABASE, fakeFetch(calls));

  assert.equal(result.invalid, 0);
  assert.equal(result.pushed, 205);
  assert.equal(result.tableCount, "0-0/205");

  const posts = calls.filter((call) => call.method === "POST");
  assert.equal(posts.length, 3);
  assert.deepEqual(posts.map((post) => JSON.parse(post.body ?? "[]").length), [100, 100, 5]);
  assert.ok(posts.every((post) => post.url.endsWith("/rest/v1/news_items?on_conflict=external_id")));
  assert.ok(posts.every((post) => post.headers["Content-Profile"] === "public"));
});
