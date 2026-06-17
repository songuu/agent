// Notion 正文 markdown → 安全 HTML 渲染。
//
// 两层 XSS 防御（正文来自 Notion，多人可编辑）：
// 1. markdown-it html:false —— 转义裸 HTML（<script> 变 &lt;script&gt;），并经 validateLink 拦
//    javascript:/vbscript: 链接。这层无需 DOM、可离线测。
// 2. DOMPurify.sanitize —— 纵深防御，剥离残留事件处理器/危险 URL。DOMPurify 依赖 window，
//    故仅客户端动态 import（SSR 构建期不加载，避免 no-window 崩溃）。

import MarkdownIt from "markdown-it";

let mdSingleton: MarkdownIt | null = null;

function getMarkdownIt(): MarkdownIt {
  if (!mdSingleton) {
    // langPrefix 默认 'language-'：代码块带 language-* class，继承站点 prose 代码样式。
    mdSingleton = new MarkdownIt({ html: false, linkify: true, breaks: false });
  }
  return mdSingleton;
}

/** 第 1 层：markdown→HTML，裸 HTML 已转义、危险链接已拦（无需 DOM，可离线测）。 */
export function renderMarkdownToSafeHtml(markdown: string): string {
  return getMarkdownIt().render(markdown ?? "");
}

export type Sanitizer = (html: string) => string;

let purifier: Sanitizer | null = null;

/** 仅客户端：动态加载 DOMPurify（依赖 window）。 */
async function loadSanitizer(): Promise<Sanitizer> {
  if (purifier) return purifier;
  const mod = await import("dompurify");
  const candidate = (mod.default ?? mod) as { sanitize: (html: string) => string };
  purifier = (html: string) => candidate.sanitize(html);
  return purifier;
}

/**
 * 第 1+2 层组合渲染。sanitize 可注入（测试用）；缺省在浏览器走 DOMPurify，
 * 非浏览器（SSR/headless）退回仅第 1 层（该路径不会在 SSR 真正执行渲染）。
 */
export async function renderNotionMarkdown(
  markdown: string,
  sanitize?: Sanitizer,
): Promise<string> {
  const html = renderMarkdownToSafeHtml(markdown);
  if (sanitize) return sanitize(html);
  if (typeof window === "undefined") return html;
  const dompurify = await loadSanitizer();
  return dompurify(html);
}
