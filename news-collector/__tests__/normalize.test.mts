import assert from "node:assert/strict";
import { test } from "node:test";
import { classify } from "../src/classify.ts";
import {
  canonicalUrl,
  cleanFeedSummary,
  externalIdFor,
  parsePublishedAt,
  stripHtml,
  toNewsItem,
  truncate,
} from "../src/normalize.ts";
import type { NewsSource, RawFeedItem } from "../src/types.ts";

test("canonicalUrl strips hash and tracking params", () => {
  assert.equal(
    canonicalUrl("https://a.com/x?utm_source=rss&id=5#frag"),
    "https://a.com/x?id=5",
  );
});

test("canonicalUrl drops trailing '?' when no params remain", () => {
  assert.equal(canonicalUrl("https://a.com/p?utm_source=x"), "https://a.com/p");
});

test("canonicalUrl passes through invalid input trimmed", () => {
  assert.equal(canonicalUrl("  not a url  "), "not a url");
});

test("externalId is stable across tracking-param variants of same url", () => {
  const a = externalIdFor({ title: "t", link: "https://a.com/x?utm_source=rss" } as RawFeedItem);
  const b = externalIdFor({ title: "t", link: "https://a.com/x" } as RawFeedItem);
  assert.equal(a, b);
});

test("externalId differs for different urls", () => {
  assert.notEqual(
    externalIdFor({ title: "t", link: "https://a.com/1" } as RawFeedItem),
    externalIdFor({ title: "t", link: "https://a.com/2" } as RawFeedItem),
  );
});

test("stripHtml removes tags and decodes common entities", () => {
  assert.equal(stripHtml("<p>Hello &amp; <b>world</b></p>"), "Hello & world");
});

test("cleanFeedSummary removes Hacker News metadata links", () => {
  assert.equal(
    cleanFeedSummary(
      "Article URL: https://example.com/story Comments URL: https://news.ycombinator.com/item?id=1 Points: 12 # Comments: 3",
    ),
    "",
  );
});
test("truncate adds ellipsis only when over limit", () => {
  assert.equal(truncate("abcdef", 4), "abc…");
  assert.equal(truncate("abc", 4), "abc");
});

test("parsePublishedAt parses RFC822 and rejects garbage", () => {
  assert.equal(
    parsePublishedAt({ pubDate: "Tue, 16 Jun 2026 13:23:06 +0000" } as RawFeedItem),
    "2026-06-16T13:23:06.000Z",
  );
  assert.equal(parsePublishedAt({ pubDate: "not a date" } as RawFeedItem), null);
  assert.equal(parsePublishedAt({} as RawFeedItem), null);
});

test("toNewsItem maps fields deterministically", () => {
  const source: NewsSource = {
    key: "qbitai",
    name: "量子位",
    url: "https://www.qbitai.com/feed",
    kind: "cn-media",
    lang: "zh",
    enabled: true,
  };
  const rawItem: RawFeedItem = {
    title: "Anthropic 发布 Claude 新模型",
    link: "https://a.com/p?utm_source=x",
    contentSnippet: "<p>摘要内容</p>",
    pubDate: "Tue, 16 Jun 2026 13:23:06 +0000",
    guid: "g1",
  };
  const now = new Date("2026-06-17T08:00:00.000Z");
  const item = toNewsItem({
    source,
    rawItem,
    classification: classify({ title: rawItem.title, summary: rawItem.contentSnippet }, source),
    now,
  });

  assert.equal(item.url, "https://a.com/p");
  assert.equal(item.title, "Anthropic 发布 Claude 新模型");
  assert.equal(item.summary, "摘要内容");
  assert.equal(item.collectedAt, "2026-06-17T08:00:00.000Z");
  assert.equal(item.collectedDate, "2026-06-17");
  assert.equal(item.publishedAt, "2026-06-16T13:23:06.000Z");
  assert.equal(item.publishedDate, "2026-06-16");
  assert.equal(item.lang, "zh");
  assert.equal(item.enriched, false);
  assert.equal(item.ecosystemLayer, "model-platform");
});
