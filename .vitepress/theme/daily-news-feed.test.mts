import assert from "node:assert/strict";
import test from "node:test";
import { buildNewsFilters, buildPaginationTokens } from "./daily-news-feed";

test("buildPaginationTokens returns compact leading window", () => {
  assert.deepEqual(buildPaginationTokens(20, 2), [1, 2, 3, 4, "...", 20]);
});

test("buildPaginationTokens returns compact middle window", () => {
  assert.deepEqual(buildPaginationTokens(20, 8), [1, "...", 7, 8, 9, "...", 20]);
});

test("buildPaginationTokens returns compact trailing window", () => {
  assert.deepEqual(buildPaginationTokens(20, 19), [1, "...", 17, 18, 19, 20]);
});

test("buildNewsFilters includes layer and date when both are active", () => {
  assert.deepEqual(buildNewsFilters("runtime", "2026-06-18"), [
    "ecosystem_layer=eq.runtime",
    "published_date=eq.2026-06-18",
  ]);
});

test("buildNewsFilters omits inactive filters", () => {
  assert.deepEqual(buildNewsFilters("all", null), []);
});
