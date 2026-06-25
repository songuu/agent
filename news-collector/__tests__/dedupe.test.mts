import assert from "node:assert/strict";
import { test } from "node:test";
import { dedupe } from "../src/dedupe.ts";
import type { NewsItem } from "../src/types.ts";

function item(overrides: Partial<NewsItem>): NewsItem {
  return {
    externalId: "id1",
    sourceKey: "s",
    sourceName: "S",
    sourceKind: "en-media",
    title: "t",
    url: "https://a/1",
    summary: "",
    contentText: "",
    contentExcerpt: "",
    contentStatus: "not_fetched",
    contentFetchedAt: null,
    ecosystemLayer: "foundation",
    ecosystemLayerLabel: "基础综述",
    tags: [],
    lang: "en",
    publishedAt: null,
    publishedDate: "2026-06-17",
    collectedAt: "2026-06-17T00:00:00.000Z",
    collectedDate: "2026-06-17",
    enriched: false,
    metadata: {},
    ...overrides,
  };
}

test("removes duplicate externalId", () => {
  const out = dedupe([
    item({ externalId: "a", url: "https://a/1" }),
    item({ externalId: "a", url: "https://a/2" }),
  ]);
  assert.equal(out.length, 1);
});

test("removes duplicate url even with different externalId", () => {
  const out = dedupe([
    item({ externalId: "a", url: "https://a/x" }),
    item({ externalId: "b", url: "https://a/x" }),
  ]);
  assert.equal(out.length, 1);
});

test("removes same-source same-day same-title duplicates even with different urls", () => {
  const out = dedupe([
    item({ externalId: "a", url: "https://a/1", sourceKey: "techweb-it", publishedDate: "2026-06-24", title: "阿维塔07 L内饰设计图曝光：延续家族化设计" }),
    item({ externalId: "b", url: "https://a/2", sourceKey: "techweb-it", publishedDate: "2026-06-24", title: " 阿维塔07   L内饰设计图曝光：延续家族化设计 " }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.externalId, "a");
});

test("keeps same title when sources differ", () => {
  const out = dedupe([
    item({ externalId: "a", url: "https://a/1", sourceKey: "openai", publishedDate: "2026-06-24", title: "v0.16.0" }),
    item({ externalId: "b", url: "https://a/2", sourceKey: "letta", publishedDate: "2026-06-24", title: "v0.16.0" }),
  ]);
  assert.equal(out.length, 2);
});

test("keeps same-source same-title when published_date differs", () => {
  const out = dedupe([
    item({ externalId: "a", url: "https://a/1", sourceKey: "techweb-it", publishedDate: "2026-06-24", title: "Weekly roundup" }),
    item({ externalId: "b", url: "https://a/2", sourceKey: "techweb-it", publishedDate: "2026-06-25", title: "Weekly roundup" }),
  ]);
  assert.equal(out.length, 2);
});

test("keeps distinct items and preserves first-seen order", () => {
  const out = dedupe([
    item({ externalId: "a", url: "https://a/1", title: "title-a" }),
    item({ externalId: "b", url: "https://a/2", title: "title-b" }),
    item({ externalId: "c", url: "https://a/3", title: "title-c" }),
  ]);
  assert.deepEqual(out.map((i) => i.externalId), ["a", "b", "c"]);
});

test("empty input → empty output", () => {
  assert.deepEqual(dedupe([]), []);
});
