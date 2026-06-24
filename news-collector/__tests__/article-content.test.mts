import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildArticleExcerpt,
  extractArticleTextFromHtml,
  extractArticleTextFromReaderMarkdown,
  fetchArticleContent,
  truncatePlainText,
} from "../src/article-content.ts";

test("extractArticleTextFromHtml prefers article paragraphs and drops chrome", () => {
  const html = `
    <html><body>
      <nav>Subscribe now</nav>
      <article>
        <h1>Meta glasses</h1>
        <p>Meta 为新品准备了玳瑁色、黑色和绿色等多种配色，并提供变色、偏光和透明镜片。</p>
        <p>用户可以与 Meta 的 AI 对话，完成翻译或理解眼前事物等操作，并支持拍摄周围环境的照片和视频。</p>
      </article>
      <footer>copyright</footer>
    </body></html>`;

  const text = extractArticleTextFromHtml(html);
  assert.match(text, /Meta 为新品准备/);
  assert.match(text, /用户可以与 Meta 的 AI 对话/);
  assert.doesNotMatch(text, /Subscribe/);
});

test("extractArticleTextFromReaderMarkdown starts after the main title and drops page chrome", () => {
  const markdown = `Title: Inc Article

URL Source: https://www.inc.com/example

Markdown Content:
[Apply Now](https://example.com)

# 'The Worst It's Ever Been': Why Meta's AI Reorg Backfired Spectacularly

A leaked internal memo from CTO Andrew Bosworth reveals how a rushed restructuring left engineers rudderless and tanked morale.

EXPERT OPINION BY [JESSICA STILLMAN](https://www.inc.com/author/jessica-stillman)

[Audio 3](https://audio.example.com/article.mp3)

If you want to find out just how badly Meta bungled the creation of its [new, massive Applied AI division](https://www.wired.com/story/example/), you can hear it straight from the reorg's chief architect.

## Why employees are mad about Meta's AI reorg

What went wrong appears to include bad communication, previous layoffs, and large teams without enough personal attention from managers.

Fast Company & Inc © 2026 Mansueto Ventures, LLC`;

  const text = extractArticleTextFromReaderMarkdown(markdown);
  assert.match(text, /A leaked internal memo/);
  assert.match(text, /If you want to find out/);
  assert.match(text, /Why employees are mad/);
  assert.doesNotMatch(text, /Apply Now/);
  assert.doesNotMatch(text, /EXPERT OPINION/);
  assert.doesNotMatch(text, /Audio 3/);
  assert.doesNotMatch(text, /Fast Company/);
});

test("fetchArticleContent falls back to reader markdown after direct 403", async () => {
  const sourceUrl = "https://www.inc.com/example/91363370";
  const readerMarkdown = `Title: Inc Article

URL Source: ${sourceUrl}

Markdown Content:
# Inc Article

A leaked internal memo from CTO Andrew Bosworth reveals how a rushed restructuring left engineers rudderless and tanked morale.

EXPERT OPINION BY JESSICA STILLMAN

If you want to find out just how badly Meta bungled the creation of its new Applied AI division, you can hear it straight from the reorg's chief architect.`;
  const seenUrls: string[] = [];
  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const requestUrl = String(input);
    seenUrls.push(requestUrl);
    if (requestUrl === sourceUrl) {
      return new Response("blocked", { status: 403, headers: { "content-type": "text/html" } });
    }
    if (requestUrl === `https://r.jina.ai/http://${sourceUrl}`) {
      return new Response(readerMarkdown, { status: 200, headers: { "content-type": "text/plain" } });
    }
    throw new Error(`unexpected URL ${requestUrl}`);
  };

  const result = await fetchArticleContent(
    sourceUrl,
    { now: new Date("2026-06-24T00:00:00.000Z") },
    fetchImpl as typeof fetch,
  );

  assert.deepEqual(seenUrls, [sourceUrl, `https://r.jina.ai/http://${sourceUrl}`]);
  assert.equal(result.status, "fetched");
  assert.match(result.text, /A leaked internal memo/);
  assert.match(result.text, /If you want to find out/);
  assert.doesNotMatch(result.text, /EXPERT OPINION/);
});

test("buildArticleExcerpt uses first readable paragraph", () => {
  assert.equal(
    buildArticleExcerpt("第一段是正文摘要，应该用于列表展示。\n\n第二段只在详情页继续展示。", 30),
    "第一段是正文摘要，应该用于列表展示。",
  );
});

test("truncatePlainText caps long text", () => {
  assert.equal(truncatePlainText("abcdef", 4), "abc…");
  assert.equal(truncatePlainText("abc", 4), "abc");
});
