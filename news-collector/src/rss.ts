// 新闻源抓取与解析：默认基于 rss-parser 支持 RSS2.0/Atom；少数无 feed 站点走专用 HTML 适配。
//
// #1 不变量——单源故障隔离：fetchFeed 永不抛错，任一源 502/超时/返回坏内容只回 ok:false，
// 让 collectOnce 跳过该源而不崩整批。这是真实聚合器最关键的健壮性（已被 HF/OpenAI 间歇 502 验证）。

import Parser from "rss-parser";
import type { NewsSource, RawFeedItem } from "./types.ts";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const CRITICAL_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 750;
const USER_AGENT =
  "agent-build-news-collector/1.0 (+https://github.com/songuu/agent)";
const ACCEPT_FEED =
  "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1";
const ACCEPT_HTML =
  "text/html, application/xhtml+xml;q=0.9, application/xml;q=0.8, */*;q=0.1";

export interface FeedResult {
  readonly source: NewsSource;
  readonly ok: boolean;
  readonly items: readonly RawFeedItem[];
  readonly attempts: number;
  readonly error?: string;
  readonly diagnostics?: string;
}

function createParser(timeoutMs: number): Parser {
  return new Parser({
    timeout: timeoutMs,
    headers: { "User-Agent": USER_AGENT, Accept: ACCEPT_FEED },
  });
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function toRawItem(item: Parser.Item): RawFeedItem {
  const rawCategories = item.categories;
  const categories = Array.isArray(rawCategories)
    ? rawCategories.filter((c): c is string => typeof c === "string")
    : undefined;

  return {
    title: (asString(item.title) ?? "").trim(),
    // 个别 feed 用 guid 充当链接；link 缺失时退回 guid。
    link: (asString(item.link) ?? asString(item.guid) ?? "").trim(),
    contentSnippet: asString(item.contentSnippet),
    content: asString(item.content),
    summary: asString(item.summary),
    isoDate: asString(item.isoDate),
    pubDate: asString(item.pubDate),
    guid: asString(item.guid),
    categories,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFeedError(error: unknown): boolean {
  const message = getErrorMessage(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  if (
    typeof code === "string" &&
    ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"].includes(code)
  ) {
    return true;
  }

  return [
    /\b429\b/,
    /\b500\b/,
    /\b502\b/,
    /\b503\b/,
    /\b504\b/,
    /timed out/i,
    /timeout/i,
    /socket/i,
    /TLS connection/i,
    /temporar/i,
    /network/i,
    /ECONNRESET/i,
    /ETIMEDOUT/i,
    /EAI_AGAIN/i,
  ].some((pattern) => pattern.test(message));
}

function retryConfigFor(source: NewsSource): { maxAttempts: number; baseDelayMs: number } {
  return {
    maxAttempts:
      source.retry?.maxAttempts ??
      (source.critical ? CRITICAL_MAX_ATTEMPTS : DEFAULT_MAX_ATTEMPTS),
    baseDelayMs: source.retry?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS,
  };
}

function summarizeDiagnostics(
  source: NewsSource,
  attempts: number,
  maxAttempts: number,
  errors: readonly string[],
): string {
  const criticalTag = source.critical ? "critical" : "normal";
  const lastError = errors.at(-1) ?? "unknown";
  const retryTag = attempts >= maxAttempts ? "retry-exhausted" : "stopped-early";
  return `${criticalTag}; attempts=${attempts}/${maxAttempts}; ${retryTag}; last=${lastError}`;
}

function usableItems(items: readonly RawFeedItem[]): RawFeedItem[] {
  return items.filter((item) => item.title.length > 0 && item.link.length > 0);
}

async function fetchFeedXml(url: string, timeoutMs: number): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: ACCEPT_FEED },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Status code ${response.status}`);
  }

  return response.text();
}

async function parseFeedUrl(
  parser: Parser,
  source: NewsSource,
  timeoutMs: number,
): Promise<RawFeedItem[]> {
  const urls = [source.url, ...(source.fallbackUrls ?? [])];
  const errors: string[] = [];

  for (const url of urls) {
    try {
      return usableItems((await parser.parseURL(url)).items?.map(toRawItem) ?? []);
    } catch (parseUrlError: unknown) {
      errors.push(`${url} parseURL: ${getErrorMessage(parseUrlError)}`);

      try {
        const xml = await fetchFeedXml(url, timeoutMs);
        return await parseFeedString(xml, timeoutMs);
      } catch (fetchError: unknown) {
        errors.push(`${url} fetch+parseString: ${getErrorMessage(fetchError)}`);
      }
    }
  }

  throw new Error(errors.join(" | "));
}
const HTML_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeHtmlText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, decimal: string) => {
      const codePoint = Number(decimal);
      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        return "";
      }
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return "";
      }
    })
    .replace(/&([a-z][a-z0-9]*);/gi, (_, entity: string) => {
      return HTML_ENTITIES[entity.toLowerCase()] ?? "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(pathOrUrl: string, baseUrl: string): string {
  return new URL(pathOrUrl, baseUrl).toString();
}

/** 解析 AIBase 新闻列表页的 SSR 卡片。AIBase 暂无公开 RSS/Atom，故只取列表摘要，不抓正文。 */
export function parseAIBaseNewsHtml(
  html: string,
  baseUrl = "https://news.aibase.com/zh/news",
): RawFeedItem[] {
  const items: RawFeedItem[] = [];
  const seenLinks = new Set<string>();
  const anchorPattern = /<a\s+href="(\/zh\/news\/\d+)"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of html.matchAll(anchorPattern)) {
    const [, href, block] = match;
    if (!href || !block) continue;

    const titleMatch =
      block.match(/<img\b[^>]*\balt="([^"]+)"/) ??
      block.match(/<div\b[^>]*\bclass="[^"]*\bfont600\b[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const summaryMatch = block.match(
      /<div\b[^>]*\bclass="[^"]*\btipColor\b[^"]*\btruncate2\b[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    );

    const title = decodeHtmlText(titleMatch?.[1] ?? "");
    const summary = decodeHtmlText(summaryMatch?.[1] ?? "");
    const link = absoluteUrl(href, baseUrl);

    if (!title || seenLinks.has(link)) continue;
    seenLinks.add(link);
    items.push({
      title,
      link,
      contentSnippet: summary,
      guid: link,
    });
  }

  return usableItems(items);
}

async function fetchAIBaseHtml(source: NewsSource, timeoutMs: number): Promise<RawFeedItem[]> {
  const response = await fetch(source.url, {
    headers: { "User-Agent": USER_AGENT, Accept: ACCEPT_HTML },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Status code ${response.status}`);
  }

  const items = parseAIBaseNewsHtml(await response.text(), source.url);
  if (items.length === 0) {
    throw new Error("AIBase HTML parser found no usable news cards");
  }
  return items;
}

/** 离线解析 feed 字符串（供 fixtures 单测，不触网）。 */
export async function parseFeedString(
  xml: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<RawFeedItem[]> {
  const parser = createParser(timeoutMs);
  const feed = await parser.parseString(xml);
  return usableItems((feed.items ?? []).map(toRawItem));
}

/** 抓取单源；**永不抛错**——失败返回 ok:false，实现单源故障隔离。 */
export async function fetchFeed(
  source: NewsSource,
  opts: { timeoutMs?: number } = {},
): Promise<FeedResult> {
  const parser = createParser(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const { maxAttempts, baseDelayMs } = retryConfigFor(source);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const items =
        source.format === "aibase-html"
          ? await fetchAIBaseHtml(source, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
          : await parseFeedUrl(parser, source, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      return {
        source,
        ok: true,
        items,
        attempts: attempt,
        diagnostics: summarizeDiagnostics(source, attempt, maxAttempts, errors),
      };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      errors.push(message);

      const shouldRetry = attempt < maxAttempts && isRetryableFeedError(error);
      if (!shouldRetry) {
        return {
          source,
          ok: false,
          items: [],
          attempts: attempt,
          error: message,
          diagnostics: summarizeDiagnostics(source, attempt, maxAttempts, errors),
        };
      }

      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  return {
    source,
    ok: false,
    items: [],
    attempts: maxAttempts,
    error: errors.at(-1) ?? "failed",
    diagnostics: summarizeDiagnostics(source, maxAttempts, maxAttempts, errors),
  };
}

