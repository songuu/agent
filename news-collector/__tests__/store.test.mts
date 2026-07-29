import assert from "node:assert/strict";
import { test } from "node:test";
import { upsertNewsItems } from "../src/store.ts";
import type { NewsItem } from "../src/types.ts";

const SUPABASE = { url: "https://db.example.com", serviceRoleKey: "svc-role", schema: "public" };

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

test("legacy Supabase news writer refuses uploads before fetch", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response(null, { status: 201 });
  }) as typeof fetch;

  await assert.rejects(
    () => upsertNewsItems([sampleNewsItem(1)], SUPABASE, fetchImpl),
    /Supabase\/PostgREST data uploads are disabled/,
  );
  assert.equal(calls, 0);
});
