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
    ecosystemLayer: "foundation",
    ecosystemLayerLabel: "基础综述",
    tags: [],
    lang: "en",
    publishedAt: null,
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

test("keeps distinct items and preserves first-seen order", () => {
  const out = dedupe([
    item({ externalId: "a", url: "https://a/1" }),
    item({ externalId: "b", url: "https://a/2" }),
    item({ externalId: "c", url: "https://a/3" }),
  ]);
  assert.deepEqual(out.map((i) => i.externalId), ["a", "b", "c"]);
});

test("empty input → empty output", () => {
  assert.deepEqual(dedupe([]), []);
});
