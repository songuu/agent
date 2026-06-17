import assert from "node:assert/strict";
import { test } from "node:test";
import {
  availableTags,
  filterArticles,
  matchesQuery,
  tagCounts,
  type NotionArticleView,
} from "./notion-articles-filter.ts";

function view(overrides: Partial<NotionArticleView>): NotionArticleView {
  return {
    notionPageId: "p",
    slug: "s",
    title: "标题",
    summary: "摘要",
    tags: [],
    status: "published",
    publishedDate: "2026-06-17",
    collectedDate: "2026-06-17",
    coverImageUrl: null,
    readCount: 0,
    ...overrides,
  };
}

const ARTICLES: NotionArticleView[] = [
  view({ slug: "a", title: "Agent 架构", tags: ["agent", "arch"] }),
  view({ slug: "b", title: "RAG 检索", summary: "向量召回", tags: ["rag"] }),
  view({ slug: "c", title: "Agent 记忆", tags: ["agent", "memory"] }),
];

test("tag=all + empty query passes everything", () => {
  assert.equal(filterArticles(ARTICLES, { tag: "all", query: "" }).length, 3);
});

test("tag scopes to articles carrying the tag", () => {
  const got = filterArticles(ARTICLES, { tag: "agent", query: "" });
  assert.deepEqual(got.map((a) => a.slug), ["a", "c"]);
});

test("query matches across title, summary, and tags (case-insensitive)", () => {
  assert.equal(matchesQuery(view({ title: "Hello" }), "hello"), true);
  assert.equal(matchesQuery(view({ summary: "向量召回" }), "向量"), true);
  assert.equal(matchesQuery(view({ tags: ["rag"] }), "RAG"), true);
  assert.equal(matchesQuery(view({ title: "x" }), "zzz"), false);
});

test("tag + query compose", () => {
  const got = filterArticles(ARTICLES, { tag: "agent", query: "记忆" });
  assert.deepEqual(got.map((a) => a.slug), ["c"]);
});

test("tagCounts and availableTags rank by frequency then name", () => {
  const counts = tagCounts(ARTICLES);
  assert.equal(counts.get("agent"), 2);
  assert.equal(counts.get("rag"), 1);
  assert.equal(availableTags(ARTICLES)[0], "agent");
});
