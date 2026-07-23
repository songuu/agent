import assert from "node:assert/strict";
import { test } from "node:test";
import { collectOnce } from "../src/collect.ts";
import { FIXTURE_SOURCES, fixtureFetchFeed } from "../src/fixtures.ts";
import type { FeedResult } from "../src/rss.ts";
import type { NewsSource } from "../src/types.ts";

const FIXED_NOW = new Date("2026-06-17T00:00:00.000Z");

test("invariant #1: a single source failure is isolated, batch survives", async () => {
  const bad: NewsSource = {
    key: "boom",
    name: "Boom",
    url: "https://boom.example/feed",
    kind: "en-media",
    lang: "en",
    enabled: true,
  };
  const impl = async (source: NewsSource): Promise<FeedResult> => {
    if (source.key === "boom") {
      return { source, ok: false, items: [], attempts: 3, error: "simulated 502" };
    }
    return fixtureFetchFeed(source);
  };

  const report = await collectOnce({
    sources: [bad, FIXTURE_SOURCES[0]!],
    fetchFeedImpl: impl,
    now: FIXED_NOW,
    dryRun: true,
  });

  assert.equal(report.sources.find((s) => s.key === "boom")?.ok, false);
  assert.ok(report.afterDedupe >= 3, "good source still produced items");
});

test("full offline pipeline is deterministic across runs", async () => {
  const run = () =>
    collectOnce({
      sources: FIXTURE_SOURCES,
      fetchFeedImpl: fixtureFetchFeed,
      now: FIXED_NOW,
      dryRun: true,
    });
  const a = await run();
  const b = await run();
  assert.deepEqual(
    a.items.map((i) => [i.externalId, i.ecosystemLayer]),
    b.items.map((i) => [i.externalId, i.ecosystemLayer]),
  );
});

test("dryRun does not attempt store; reports counts", async () => {
  const report = await collectOnce({
    sources: FIXTURE_SOURCES,
    fetchFeedImpl: fixtureFetchFeed,
    now: FIXED_NOW,
    dryRun: true,
  });
  assert.equal(report.dryRun, true);
  assert.equal(report.stored, 0);
  assert.equal(report.tableCount, "n/a");
  assert.ok(report.afterDedupe >= 5);
  // 8 fixture 条目应覆盖全部 8 个体系层
  const layers = new Set(report.items.map((i) => i.ecosystemLayer));
  assert.ok(layers.size >= 7, `expected broad layer coverage, got ${layers.size}`);
});

test("article content extraction attaches station-side body fields when enabled", async () => {
  const report = await collectOnce({
    sources: [FIXTURE_SOURCES[0]!],
    fetchFeedImpl: fixtureFetchFeed,
    now: FIXED_NOW,
    dryRun: true,
    maxPerSource: 1,
    articleContentEnabled: true,
    articleContentMaxItems: 1,
    fetchArticleContentImpl: async () => ({
      text: "站内正文第一段。\n\n站内正文第二段。",
      excerpt: "站内正文第一段。",
      status: "fetched",
      fetchedAt: FIXED_NOW.toISOString(),
    }),
  });

  assert.equal(report.contentFetched, 1);
  assert.equal(report.items[0]?.contentStatus, "fetched");
  assert.equal(report.items[0]?.contentText, "站内正文第一段。\n\n站内正文第二段。");
  assert.equal(report.items[0]?.contentExcerpt, "站内正文第一段。");
});

test("feed fetch concurrency is bounded to prevent same-host connection bursts", async () => {
  const sources: NewsSource[] = Array.from({ length: 6 }, (_, index) => ({
    ...FIXTURE_SOURCES[0]!,
    key: `bounded-${index}`,
  }));
  let active = 0;
  let peak = 0;

  const report = await collectOnce({
    sources,
    dryRun: true,
    feedConcurrency: 2,
    fetchFeedImpl: async (source) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { source, ok: true, items: [], attempts: 1 };
    },
  });

  assert.equal(report.sources.length, 6);
  assert.equal(peak, 2);
});

test("content repository receives normalized items and its result drives the report", async () => {
  let calls = 0;
  let received = 0;
  const report = await collectOnce({
    sources: [FIXTURE_SOURCES[0]!],
    fetchFeedImpl: fixtureFetchFeed,
    now: FIXED_NOW,
    dryRun: false,
    maxPerSource: 2,
    contentRepository: {
      async upsertNewsItems(items) {
        calls += 1;
        received = items.length;
        return { attempted: items.length, invalid: 0, pushed: items.length, tableCount: "0-0/42" };
      },
    },
  });

  assert.equal(calls, 1);
  assert.equal(received, report.afterDedupe);
  assert.equal(report.stored, report.afterDedupe);
  assert.equal(report.tableCount, "0-0/42");
  assert.equal(report.dryRun, false);
});

test("dry run never calls an injected content repository", async () => {
  let calls = 0;
  const report = await collectOnce({
    sources: [FIXTURE_SOURCES[0]!],
    fetchFeedImpl: fixtureFetchFeed,
    now: FIXED_NOW,
    dryRun: true,
    contentRepository: {
      async upsertNewsItems(items) {
        calls += 1;
        return { attempted: items.length, invalid: 0, pushed: items.length, tableCount: "1" };
      },
    },
  });

  assert.equal(calls, 0);
  assert.equal(report.stored, 0);
  assert.equal(report.dryRun, true);
});
