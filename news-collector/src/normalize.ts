// 归一化：把 rss-parser 的原始条目转成出库用的 NewsItem。
//
// 关键不变量：
// - 收集身份 externalId = canonical URL 的 sha256（去 hash/跟踪参数后），保证跨次运行幂等。
// - 不复制原文：summary 只取 feed 自带摘要并截断，标题/链接保留，正文不入库。
// - 纯转换：时间通过参数注入（now: Date），不在函数内读时钟，便于确定性单测。

import { createHash } from "node:crypto";
import type {
  Classification,
  NewsItem,
  NewsSource,
  RawFeedItem,
} from "./types.ts";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "ref",
  "ref_src",
  "spm",
  "from",
] as const;

/** 规范化 URL：去 fragment 与常见跟踪参数；解析失败原样返回。 */
export function canonicalUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    url.hash = "";
    for (const param of TRACKING_PARAMS) url.searchParams.delete(param);
    let result = url.toString();
    if (result.endsWith("?")) result = result.slice(0, -1);
    return result;
  } catch {
    return trimmed;
  }
}

/** 收集身份：优先用 canonical URL，缺链接才退回 guid。 */
export function externalIdFor(rawItem: RawFeedItem): string {
  const basis = rawItem.link
    ? canonicalUrl(rawItem.link)
    : (rawItem.guid ?? "").trim();
  return createHash("sha256").update(basis).digest("hex").slice(0, 32);
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
};

function safeFromCodePoint(decimal: string): string {
  const code = Number(decimal);
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** 去 HTML 标签、解码常见实体、压缩空白。用于把 feed 摘要清成纯文本。 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, decimal: string) => safeFromCodePoint(decimal))
    .replace(/&[a-z][a-z0-9]*;/gi, (match) => NAMED_ENTITIES[match.toLowerCase()] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 清理 RSS 摘要里混入的外部链接/评论数等元信息。 */
export function cleanFeedSummary(input: string): string {
  return stripHtml(input)
    .replace(/\bArticle URL:\s*https?:\/\/\S+/gi, " ")
    .replace(/\bComments URL:\s*https?:\/\/\S+/gi, " ")
    .replace(/\bPoints:\s*\d+/gi, " ")
    .replace(/#\s*Comments:\s*\d+/gi, " ")
    .replace(/\bComments:\s*\d+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 截断到 max 字符，超出加省略号。 */
export function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** 解析发布时间为 ISO；无有效时间返回 null。 */
export function parsePublishedAt(rawItem: RawFeedItem): string | null {
  const raw = rawItem.isoDate ?? rawItem.pubDate;
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? null : new Date(ts).toISOString();
}

export interface NormalizeArgs {
  readonly source: NewsSource;
  readonly rawItem: RawFeedItem;
  readonly classification: Classification;
  readonly now: Date;
}

/** 把原始条目 + 分类结果合成最终 NewsItem。 */
export function toNewsItem(args: NormalizeArgs): NewsItem {
  const { source, rawItem, classification, now } = args;
  const url = canonicalUrl(rawItem.link);
  const summarySource =
    rawItem.contentSnippet ?? rawItem.content ?? rawItem.summary ?? "";
  const summary = truncate(cleanFeedSummary(summarySource));
  const collectedAt = now.toISOString();
  const collectedDate = collectedAt.slice(0, 10);
  const publishedAt = parsePublishedAt(rawItem);
  const publishedDate = publishedAt?.slice(0, 10) ?? collectedDate;

  return {
    externalId: externalIdFor(rawItem),
    sourceKey: source.key,
    sourceName: source.name,
    sourceKind: source.kind,
    title: stripHtml(rawItem.title).trim(),
    url,
    summary,
    ecosystemLayer: classification.ecosystemLayer,
    ecosystemLayerLabel: classification.ecosystemLayerLabel,
    tags: classification.tags,
    lang: classification.lang,
    publishedAt,
    publishedDate,
    collectedAt,
    collectedDate,
    enriched: false,
    metadata: {
      guid: rawItem.guid ?? null,
      categories: rawItem.categories ?? [],
      sourceUrl: source.url,
    },
  };
}
