import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMarkdownToSafeHtml, renderNotionMarkdown } from "./notion-markdown.ts";

// 第 1 层（markdown-it html:false + validateLink）无需 DOM，可离线断言。
test("raw <script> is escaped, never executable", () => {
  const html = renderMarkdownToSafeHtml("正文 <script>alert(1)</script> 结束");
  assert.ok(!html.includes("<script>"), "must not emit a live <script> tag");
  assert.ok(html.includes("&lt;script&gt;"), "raw HTML should be escaped");
});

test("raw <img onerror> is escaped, no live element", () => {
  const html = renderMarkdownToSafeHtml("文本\n\n<img src=x onerror=alert(1)>");
  assert.ok(!/<img[^>]*onerror/i.test(html), "no live <img onerror> element");
  assert.ok(html.includes("&lt;img"), "raw HTML img should be escaped");
});

test("javascript: link is rendered inert (no live href), https links work", () => {
  const danger = renderMarkdownToSafeHtml("[click](javascript:alert(1))");
  // markdown-it leaves it as plain text — no anchor with a javascript: href.
  assert.ok(!/href\s*=\s*["']?javascript:/i.test(danger), "no live javascript: href");
  assert.ok(!danger.includes("<a "), "dangerous link must not become an anchor");
  assert.match(renderMarkdownToSafeHtml("[ok](https://x.com)"), /<a href="https:\/\/x\.com">/);
});

test("normal markdown renders to expected HTML", () => {
  assert.match(renderMarkdownToSafeHtml("# 标题"), /<h1[^>]*>标题<\/h1>/);
  assert.match(renderMarkdownToSafeHtml("**粗**"), /<strong>粗<\/strong>/);
  assert.match(renderMarkdownToSafeHtml("```js\nconst x=1\n```"), /language-js/);
});

test("renderNotionMarkdown applies the injected sanitizer (defense-in-depth layer)", async () => {
  let received = "";
  const out = await renderNotionMarkdown("# hi", (html) => {
    received = html;
    return "SANITIZED";
  });
  assert.equal(out, "SANITIZED");
  assert.match(received, /<h1[^>]*>hi<\/h1>/);
});
