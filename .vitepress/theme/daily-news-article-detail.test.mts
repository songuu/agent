import assert from "node:assert/strict";
import test from "node:test";
import { buildNewsArticleParagraphs, splitArticleParagraphs } from "./daily-news-article-detail";

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
