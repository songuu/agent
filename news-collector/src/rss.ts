// RSS/Atom 抓取与解析，基于 rss-parser（同时支持 RSS2.0 与 Atom）。
//
// #1 不变量——单源故障隔离：fetchFeed 永不抛错，任一源 502/超时/返回HTML 只回 ok:false，
// 让 collectOnce 跳过该源而不崩整批。这是真实聚合器最关键的健壮性（已被 HF/OpenAI 间歇 502 验证）。

import Parser from "rss-parser";
import type { NewsSource, RawFeedItem } from "./types.ts";

const DEFAULT_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "agent-build-news-collector/1.0 (+https://github.com/songuu/agent)";
const ACCEPT_FEED =
  "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1";

export interface FeedResult {
  readonly source: NewsSource;
  readonly ok: boolean;
  readonly items: readonly RawFeedItem[];
  readonly error?: string;
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

function usableItems(items: readonly RawFeedItem[]): RawFeedItem[] {
  return items.filter((item) => item.title.length > 0 && item.link.length > 0);
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
  try {
    const feed = await parser.parseURL(source.url);
    return { source, ok: true, items: usableItems((feed.items ?? []).map(toRawItem)) };
  } catch (error: unknown) {
    return { source, ok: false, items: [], error: getErrorMessage(error) };
  }
}
