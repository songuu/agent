import assert from "node:assert/strict";
import test from "node:test";
import { buildNewsArticleParagraphs, resolveArticleNavigation, splitArticleParagraphs } from "./daily-news-article-detail";

test("splitArticleParagraphs keeps paragraph boundaries", () => {
  assert.deepEqual(splitArticleParagraphs("第一段正文。\n\n第二段正文。"), ["第一段正文。", "第二段正文。"]);
});

test("buildNewsArticleParagraphs prefers fetched content text", () => {
  assert.deepEqual(
    buildNewsArticleParagraphs({
      title: "标题",
      contentText: "真实正文第一段。\n\n真实正文第二段。",
      contentExcerpt: "摘要",
      summary: "Point...",
    }),
    ["真实正文第一段。", "真实正文第二段。"],
  );
});

test("buildNewsArticleParagraphs falls back honestly when body missing", () => {
  const paragraphs = buildNewsArticleParagraphs({
    title: "标题",
    contentText: "",
    contentExcerpt: "可读摘要",
    summary: "Point...",
  });
  assert.equal(paragraphs[0], "可读摘要");
  assert.match(paragraphs[1], /暂未抓取/);
});


test("resolveArticleNavigation：首篇仅展示下一篇", () => {
  const navigation = resolveArticleNavigation(
    [
      { external_id: "a", title: "第一篇" },
      { external_id: "b", title: "第二篇" },
    ],
    "a",
  );

  assert.equal(navigation?.previous, null);
  assert.equal(navigation?.next?.externalId, "b");
  assert.equal(navigation?.next?.title, "第二篇");
});

test("resolveArticleNavigation：中间项同时展示前后篇", () => {
  const navigation = resolveArticleNavigation(
    [
      { external_id: "a", title: "第一篇" },
      { external_id: "b", title: "第二篇" },
      { external_id: "c", title: "第三篇" },
    ],
    "b",
  );

  assert.equal(navigation?.previous?.externalId, "a");
  assert.equal(navigation?.next?.externalId, "c");
});

test("resolveArticleNavigation：缺少当前文章时返回 null", () => {
  assert.equal(resolveArticleNavigation([{ external_id: "a", title: "第一篇" }], "x"), null);
});
