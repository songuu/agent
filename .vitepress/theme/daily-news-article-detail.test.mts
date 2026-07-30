import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNewsArticleParagraphs,
  newsArticleHref,
  newsArticleIdFromSearch,
  newsArticleReturnPathFromSearch,
  resolveArticleNavigation,
  resolveNewsArticleLanguageContent,
  shouldRefreshNewsArticleDetail,
  splitArticleParagraphs,
} from "./daily-news-article-detail";

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

test("translated English article defaults to Chinese while preserving original paragraphs", () => {
  const content = resolveNewsArticleLanguageContent({
    title: "Original title",
    titleZh: "中文标题",
    contentText: "First paragraph.\n\nSecond paragraph.",
    contentExcerpt: "Original excerpt",
    summary: "Original summary",
    contentTextZh: "第一段。\n\n第二段。",
    translationStatus: "translated",
  });

  assert.equal(content.title, "中文标题");
  assert.equal(content.defaultLanguage, "zh");
  assert.equal(content.canSwitchLanguage, true);
  assert.deepEqual(content.translatedParagraphs, ["第一段。", "第二段。"]);
  assert.deepEqual(content.originalParagraphs, ["First paragraph.", "Second paragraph."]);
});

test("failed or missing translation renders original only and hides the language switch", () => {
  const content = resolveNewsArticleLanguageContent({
    title: "Original title",
    titleZh: "不应展示的标题",
    contentText: "Original body.",
    contentExcerpt: "",
    summary: "",
    contentTextZh: "不应展示的译文。",
    translationStatus: "failed",
  });

  assert.equal(content.title, "Original title");
  assert.equal(content.defaultLanguage, "original");
  assert.equal(content.canSwitchLanguage, false);
  assert.deepEqual(content.translatedParagraphs, []);
  assert.deepEqual(content.originalParagraphs, ["Original body."]);
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

test("newsArticleHref uses BASE-aware detail path", () => {
  assert.equal(newsArticleHref("abc/123"), "/news/article?id=abc%2F123");
});

test("newsArticleHref preserves list return path", () => {
  assert.equal(
    newsArticleHref("abc/123", "/news/?layer=tooling&date=all&page=3&pageSize=20"),
    "/news/article?id=abc%2F123&from=%2Fnews%2F%3Flayer%3Dtooling%26date%3Dall%26page%3D3%26pageSize%3D20",
  );
});

test("newsArticleReturnPathFromSearch rejects unsafe return paths", () => {
  assert.equal(newsArticleReturnPathFromSearch("?id=abc&from=%2Fnews%2F%3Fpage%3D3"), "/news/?page=3");
  assert.equal(newsArticleReturnPathFromSearch("?id=abc&from=https%3A%2F%2Fevil.test"), "/news/");
});

test("newsArticleIdFromSearch extracts and trims id", () => {
  assert.equal(newsArticleIdFromSearch("?id=%20abc%2F123%20"), "abc/123");
  assert.equal(newsArticleIdFromSearch("?foo=bar"), null);
});

test("shouldRefreshNewsArticleDetail detects query id changes", () => {
  assert.equal(shouldRefreshNewsArticleDetail("abc", "?id=abc"), false);
  assert.equal(shouldRefreshNewsArticleDetail("abc", "?id=def"), true);
  assert.equal(shouldRefreshNewsArticleDetail(null, "?id=def"), true);
});
