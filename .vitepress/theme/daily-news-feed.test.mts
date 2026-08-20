import assert from "node:assert/strict";
import test from "node:test";
import { adaptPostgrestReadRequest, buildContentApiPageUrl } from "./content-api-client";
import {
  buildNewsDetailParagraphs,
  buildNewsFilters,
  buildNewsPageRequest,
  buildPaginationTokens,
  buildReadableNewsSummary,
  cleanNewsSummary,
  createBoundedNewsRequest,
  currentNewsDate,
  inferNewsListTotalCount,
  normalizeNewsDate,
  preferTranslatedNewsText,
  resolveInitialNewsDate,
  resolveNewsPagination,
  shouldLoadNewsPageAfterCalendar,
  shouldLoadNewsPageAfterCalendarFailure,
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

test("news list requests use count none so cards do not trigger a server COUNT", () => {
  const request = buildNewsPageRequest(20, buildNewsFilters("runtime", "2026-08-18"), 10);
  assert.equal(request.count, "none");

  const url = buildContentApiPageUrl(
    { baseUrl: "/api/content/v1" },
    adaptPostgrestReadRequest(request),
  );
  assert.equal(new URL(url, "https://example.test").searchParams.get("count"), "none");
});

test("calendar buckets derive the total for the current date and layer filters", () => {
  const index = [
    { collectedDate: "2026-08-18", ecosystemLayer: "runtime" as const, articleCount: 3 },
    { collectedDate: "2026-08-18", ecosystemLayer: "foundation" as const, articleCount: 4 },
    { collectedDate: "2026-08-17", ecosystemLayer: "runtime" as const, articleCount: 5 },
  ];

  assert.equal(inferNewsListTotalCount(index, "runtime", "2026-08-18"), 3);
  assert.equal(inferNewsListTotalCount(index, "all", "2026-08-18"), 7);
  assert.equal(inferNewsListTotalCount(index, "runtime", null), 8);
});

test("hasMore fallback exposes only directional pagination while calendar is unavailable", () => {
  assert.deepEqual(resolveNewsPagination(null, 2, 10, true), {
    totalPages: null,
    showControls: true,
    showPageNumbers: false,
    canGoPrevious: true,
    canGoNext: true,
  });
  assert.deepEqual(resolveNewsPagination(null, 1, 10, false), {
    totalPages: null,
    showControls: false,
    showPageNumbers: false,
    canGoPrevious: false,
    canGoNext: false,
  });
});

test("a failed initial calendar still starts the current-date list fallback", () => {
  assert.equal(shouldLoadNewsPageAfterCalendarFailure(false, false), true);
  assert.equal(shouldLoadNewsPageAfterCalendarFailure(true, false), false);
  assert.equal(shouldLoadNewsPageAfterCalendarFailure(false, true), false);
});

test("initial news date moves from an empty current day to the latest calendar bucket", () => {
  const index = [
    { collectedDate: "2026-08-16" },
    { collectedDate: "2026-08-17" },
    { collectedDate: "2026-08-17" },
  ];
  assert.equal(resolveInitialNewsDate("2026-08-18", false, index), "2026-08-17");
  assert.equal(resolveInitialNewsDate("2026-08-18", true, index), "2026-08-18");
  assert.equal(resolveInitialNewsDate("2026-08-18", false, []), "2026-08-18");
});

test("calendar starts an implicit list only after finding data and reloads a corrected explicit date", () => {
  const index = [{ collectedDate: "2026-08-17" }];
  assert.equal(shouldLoadNewsPageAfterCalendar("2026-08-18", "2026-08-17", false, index, false), true);
  assert.equal(shouldLoadNewsPageAfterCalendar("2026-08-18", "2026-08-18", false, [], false), false);
  assert.equal(shouldLoadNewsPageAfterCalendar("2026-08-18", "2026-08-17", true, index, true), true);
  assert.equal(shouldLoadNewsPageAfterCalendar("2026-08-18", "2026-08-18", true, index, true), false);
});

test("bounded news requests abort at their deadline and expose timeout state", async () => {
  const request = createBoundedNewsRequest(
    undefined,
    async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true },
        );
      }),
    10,
  );

  await assert.rejects(() => request.fetchImpl("https://content.test/news"), { name: "AbortError" });
  assert.equal(request.timedOut, true);
  request.dispose();
});

test("bounded news requests cancel when their view lifecycle is aborted", async () => {
  const lifecycle = new AbortController();
  const request = createBoundedNewsRequest(
    lifecycle.signal,
    async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true },
        );
      }),
    1_000,
  );

  const pending = request.fetchImpl("https://content.test/news");
  lifecycle.abort();
  await assert.rejects(() => pending, { name: "AbortError" });
  assert.equal(request.timedOut, false);
  request.dispose();
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

test("translated list text is used only after a successful translation", () => {
  assert.equal(preferTranslatedNewsText("Original", "中文", "translated"), "中文");
  assert.equal(preferTranslatedNewsText("Original", "不应展示", "failed"), "Original");
  assert.equal(preferTranslatedNewsText("Original", "", "translated"), "Original");
});
