import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNewsDetailParagraphs,
  buildNewsFilters,
  buildPaginationTokens,
  buildReadableNewsSummary,
  cleanNewsSummary,
  currentNewsDate,
  normalizeNewsDate,
} from "./daily-news-feed";

test("buildPaginationTokens returns compact leading window", () => {
  assert.deepEqual(buildPaginationTokens(20, 2), [1, 2, 3, 4, "...", 20]);
});

test("buildPaginationTokens returns compact middle window", () => {
  assert.deepEqual(buildPaginationTokens(20, 8), [1, "...", 7, 8, 9, "...", 20]);
});

test("buildPaginationTokens returns compact trailing window", () => {
  assert.deepEqual(buildPaginationTokens(20, 19), [1, "...", 17, 18, 19, 20]);
});

test("buildNewsFilters uses collected_date so every article captured that day remains queryable", () => {
  assert.deepEqual(buildNewsFilters("runtime", "2026-06-18"), [
    "ecosystem_layer=eq.runtime",
    "collected_date=eq.2026-06-18",
  ]);
});

test("buildNewsFilters omits inactive filters", () => {
  assert.deepEqual(buildNewsFilters("all", null), []);
});

test("normalizeNewsDate preserves date-only values and converts UTC timestamps to China dates", () => {
  assert.equal(normalizeNewsDate("2026-07-29", "fallback"), "2026-07-29");
  assert.equal(normalizeNewsDate("2026-07-29T16:00:00.000Z", "fallback"), "2026-07-30");
  assert.equal(normalizeNewsDate("not-a-date", "fallback"), "fallback");
});

test("currentNewsDate uses the China calendar day", () => {
  assert.equal(currentNewsDate(new Date("2026-07-29T16:00:00.000Z")), "2026-07-30");
});

test("cleanNewsSummary removes link-only Hacker News metadata", () => {
  assert.equal(
    cleanNewsSummary(
      "Article URL: https://example.com/story Comments URL: https://news.ycombinator.com/item?id=1 Points: 2 # Comments: 0",
    ),
    "",
  );
});

test("buildReadableNewsSummary falls back to title when feed summary is metadata only", () => {
  assert.equal(
    buildReadableNewsSummary({
      title: "We built telecom infrastructure for AI agents in emerging markets",
      summary: "Article URL: https://krosai.com/ Comments URL: https://news.ycombinator.com/item?id=48653504 Points: 2 # Comments: 0",
      sourceName: "Hacker News · AI",
      sourceKind: "community",
      ecosystemLayerLabel: "基础综述",
    }),
    "文章主题：We built telecom infrastructure for AI agents in emerging markets",
  );
});

test("buildNewsDetailParagraphs includes cleaned content and context", () => {
  const paragraphs = buildNewsDetailParagraphs({
    title: "Meta launches new smart glasses",
    summary: "Meta introduced lower-cost smart glasses for consumers.",
    sourceName: "Example News",
    sourceKind: "en-media",
    ecosystemLayerLabel: "产品与交互",
    tags: ["agent", "hardware"],
  });

  assert.equal(paragraphs[0], "Meta introduced lower-cost smart glasses for consumers.");
  assert.match(paragraphs.at(-1) ?? "", /来源：Example News/);
  assert.match(paragraphs.at(-1) ?? "", /标签：agent、hardware/);
});
