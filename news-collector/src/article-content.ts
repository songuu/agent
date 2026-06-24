// 原文正文抽取：从新闻 URL 抓取 HTML，提取可在站内展示的正文截断。
// 只在 Node collector 端运行；前端仍只读 Supabase anon，不跨域抓第三方页面。

export type ArticleContentStatus = "not_fetched" | "fetched" | "empty" | "failed";

export interface ArticleContentResult {
  readonly text: string;
  readonly excerpt: string;
  readonly status: ArticleContentStatus;
  readonly fetchedAt: string | null;
  readonly error?: string;
}

export interface FetchArticleContentOptions {
  readonly timeoutMs?: number;
  readonly now?: Date;
}

const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_CONTENT_TEXT_LENGTH = 6_000;
const MAX_CONTENT_EXCERPT_LENGTH = 260;
const MIN_EXTRACTED_TEXT_LENGTH = 80;
const USER_AGENT = "agent-build-news-collector/1.0 (+https://github.com/songuu/agent)";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const ACCEPT_HTML = "text/html, application/xhtml+xml;q=0.9, */*;q=0.2";
const READER_PREFIX = "https://r.jina.ai/http://";

const ENTITY_MAP: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  hellip: "...",
};

export async function fetchArticleContent(
  url: string,
  options: FetchArticleContentOptions = {},
  fetchImpl: typeof fetch = fetch,
): Promise<ArticleContentResult> {
  const fetchedAt = (options.now ?? new Date()).toISOString();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const directResult = await fetchAndExtractArticle(url, fetchedAt, timeoutMs, fetchImpl, {
    accept: ACCEPT_HTML,
    extractor: extractArticleTextFromHtml,
    userAgent: USER_AGENT,
  });

  if (directResult.status === "fetched") return directResult;

  const readerResult = await fetchAndExtractArticle(toReaderUrl(url), fetchedAt, timeoutMs, fetchImpl, {
    accept: "text/plain, text/markdown;q=0.9, */*;q=0.2",
    extractor: extractArticleTextFromReaderMarkdown,
    userAgent: BROWSER_USER_AGENT,
  });

  if (readerResult.status === "fetched") return readerResult;
  return mergeFallbackErrors(directResult, readerResult);
}

export function extractArticleTextFromHtml(html: string): string {
  const cleaned = stripNonContent(html);
  const candidates = contentCandidates(cleaned);
  const best = candidates
    .map((candidate) => ({ text: extractParagraphText(candidate), score: scoreCandidate(candidate) }))
    .filter((candidate) => candidate.text.length > 0)
    .sort((left, right) => right.score - left.score)[0];

  if (best?.text) return best.text;
  return normalizeParagraphs([decodeHtml(stripTags(cleaned))]);
}

export function extractArticleTextFromReaderMarkdown(markdown: string): string {
  const markerIndex = markdown.indexOf("Markdown Content:");
  const content = markerIndex >= 0 ? markdown.slice(markerIndex + "Markdown Content:".length) : markdown;
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const paragraphs: string[] = [];
  let reachedMainHeading = false;

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    const paragraph = cleanMarkdownBlock(trimmedBlock);
    if (!paragraph) continue;

    if (!reachedMainHeading) {
      if (/^#\s+/.test(trimmedBlock)) {
        reachedMainHeading = true;
      }
      continue;
    }

    if (isReaderFooter(paragraph)) break;
    if (isReaderChrome(paragraph, trimmedBlock)) continue;
    if (isUsefulParagraph(paragraph)) paragraphs.push(paragraph);
  }

  return normalizeParagraphs(dedupeParagraphs(paragraphs));
}

export function buildArticleExcerpt(text: string, max = MAX_CONTENT_EXCERPT_LENGTH): string {
  const firstParagraph = text.split(/\n{2,}/).find((part) => part.trim().length > 0) ?? text;
  return truncatePlainText(firstParagraph, max);
}

export function truncatePlainText(text: string, max: number): string {
  const normalized = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

interface ExtractRequest {
  readonly accept: string;
  readonly extractor: (text: string) => string;
  readonly userAgent: string;
}

async function fetchAndExtractArticle(
  url: string,
  fetchedAt: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
  request: ExtractRequest,
): Promise<ArticleContentResult> {
  try {
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent": request.userAgent,
        Accept: request.accept,
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return emptyResult("failed", fetchedAt, `HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/html|xhtml|text\/plain|markdown/i.test(contentType)) {
      return emptyResult("empty", fetchedAt, `unsupported content-type: ${contentType}`);
    }

    const text = request.extractor(await response.text());
    if (text.length < MIN_EXTRACTED_TEXT_LENGTH) {
      return emptyResult("empty", fetchedAt, "no readable article body");
    }

    const boundedText = truncatePlainText(text, MAX_CONTENT_TEXT_LENGTH);
    return {
      text: boundedText,
      excerpt: buildArticleExcerpt(boundedText),
      status: "fetched",
      fetchedAt,
    };
  } catch (error: unknown) {
    return emptyResult(
      "failed",
      fetchedAt,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function mergeFallbackErrors(
  directResult: ArticleContentResult,
  readerResult: ArticleContentResult,
): ArticleContentResult {
  const directError = directResult.error ? `direct: ${directResult.error}` : `direct: ${directResult.status}`;
  const readerError = readerResult.error ? `reader: ${readerResult.error}` : `reader: ${readerResult.status}`;
  const status = directResult.status === "failed" || readerResult.status === "failed" ? "failed" : "empty";
  return emptyResult(status, directResult.fetchedAt ?? readerResult.fetchedAt ?? new Date().toISOString(), `${directError}; ${readerError}`);
}

function emptyResult(
  status: Exclude<ArticleContentStatus, "not_fetched" | "fetched">,
  fetchedAt: string,
  error: string,
): ArticleContentResult {
  return { text: "", excerpt: "", status, fetchedAt, error };
}

function toReaderUrl(url: string): string {
  if (/^https?:\/\/r\.jina\.ai\//i.test(url)) return url;
  return `${READER_PREFIX}${url}`;
}

function stripNonContent(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<form\b[\s\S]*?<\/form>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, " ")
    .replace(/<figure\b[\s\S]*?<\/figure>/gi, " ");
}

function contentCandidates(html: string): string[] {
  const selectors = [
    /<article\b[^>]*>[\s\S]*?<\/article>/gi,
    /<main\b[^>]*>[\s\S]*?<\/main>/gi,
    /<(?:section|div)\b[^>]*(?:class|id)="[^"]*(?:article|story|post|entry|content|body)[^"]*"[^>]*>[\s\S]*?<\/(?:section|div)>/gi,
  ];

  const matches: string[] = [];
  for (const pattern of selectors) {
    for (const match of html.matchAll(pattern)) {
      if (match[0]) matches.push(match[0]);
    }
  }
  matches.push(html);
  return matches;
}

function extractParagraphText(html: string): string {
  const blocks: string[] = [];
  const blockPattern = /<(p|h2|h3|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of html.matchAll(blockPattern)) {
    const text = cleanText(match[2] ?? "");
    if (isUsefulParagraph(text)) blocks.push(text);
  }

  if (blocks.length === 0) {
    const fallback = cleanText(html);
    if (isUsefulParagraph(fallback)) blocks.push(fallback);
  }

  return normalizeParagraphs(dedupeParagraphs(blocks));
}

function scoreCandidate(html: string): number {
  const paragraphCount = [...html.matchAll(/<p\b/gi)].length;
  const textLength = cleanText(html).length;
  return paragraphCount * 400 + textLength;
}

function cleanText(html: string): string {
  return decodeHtml(stripTags(html))
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

function cleanMarkdownBlock(markdown: string): string {
  if (!markdown) return "";
  if (/^!\[[^\]]*\]\([^)]+\)\s*$/m.test(markdown)) return "";
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|main|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
}

function decodeHtml(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => fromCodePoint(Number(decimal)))
    .replace(/&([a-z][a-z0-9]*);/gi, (_, entity: string) => ENTITY_MAP[entity.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fromCodePoint(codePoint: number): string {
  if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return "";
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return "";
  }
}

function isUsefulParagraph(text: string): boolean {
  if (text.length < 35) return false;
  if (/^(advertisement|subscribe|sign up|listen to this article|share this article|read more|more info)$/i.test(text)) {
    return false;
  }
  if (/^(图片|广告|相关阅读|更多|声明|版权|原文链接)[:：]?/i.test(text)) return false;
  return /[\p{L}\p{N}]/u.test(text);
}

function isReaderChrome(text: string, rawBlock: string): boolean {
  if (/^\[(?:Audio|Video|Image)\s+\d+/i.test(rawBlock)) return true;
  if (/^(expert opinion by|by\s+|jun\s+\d{1,2},\s+\d{4}|share|linkedin facebook|add on google|illustration:)/i.test(text)) {
    return true;
  }
  if (/^(top stories top videos|newsletters|subscribe|apply now|listen to this article|0:00\s*\/)/i.test(text)) {
    return true;
  }
  return false;
}

function isReaderFooter(text: string): boolean {
  return /^(Fast Company & Inc ©|Terms of Use|Inc\.com adheres to|search by queryly|Events Upcoming Events|Subscribe Video Podcasts)/i.test(text);
}

function dedupeParagraphs(paragraphs: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const paragraph of paragraphs) {
    const key = paragraph.toLowerCase().replace(/\W+/g, "").slice(0, 120);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(paragraph);
  }
  return result;
}

function normalizeParagraphs(paragraphs: readonly string[]): string {
  return paragraphs
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
