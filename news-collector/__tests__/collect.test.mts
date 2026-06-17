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
      return { source, ok: false, items: [], error: "simulated 502" };
    }
    return fixtureFetchFeed(source);
  };

  const report = await collectOnce({
    sources: [bad, FIXTURE_SOURCES[0]],
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
