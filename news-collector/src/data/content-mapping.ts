// 领域对象 → 可移植的关系型行。
//
// 列名是本模块内的常量，永远不接受外部输入；值交给驱动参数绑定，避免把内容/URL/metadata 拼进 SQL。

import { notionArticleSchema, type NotionArticle } from "../notion/types.ts";
import { newsItemSchema, type NewsItem } from "../types.ts";
import type { ContentRow, ContentTableContract } from "./content-table-contracts.ts";

export type SqlValue = string | number | null;

export const NEWS_ITEM_COLUMNS = [
  "external_id",
  "source_key",
  "source_name",
  "source_kind",
  "title",
  "url",
  "summary",
  "content_text",
  "content_excerpt",
  "content_status",
  "content_fetched_at",
  "ecosystem_layer",
  "ecosystem_layer_label",
  "tags",
  "lang",
  "published_at",
  "published_date",
  "collected_at",
  "collected_date",
  "enriched",
  "metadata",
] as const;

export const NOTION_ARTICLE_COLUMNS = [
  "notion_page_id",
  "slug",
  "source_key",
  "title",
  "summary",
  "body_markdown",
  "cover_image_url",
  "tags",
  "status",
  "published_at",
  "published_date",
  "notion_url",
  "notion_last_edited_time",
  "metadata",
] as const;

export interface ValidatedRows<T> {
  readonly valid: readonly T[];
  readonly invalid: number;
}

/** 与现有 Supabase store 一致：不让单条脏输入阻断整批同步。 */
export function validateNewsItems(items: readonly NewsItem[]): ValidatedRows<NewsItem> {
  const valid: NewsItem[] = [];
  let invalid = 0;
  for (const item of items) {
    if (newsItemSchema.safeParse(item).success) valid.push(item);
    else invalid += 1;
  }
  return { valid, invalid };
}

/** 与现有 Notion store 一致：按 notion_page_id 保持幂等写入。 */
export function validateNotionArticles(
  articles: readonly NotionArticle[],
): ValidatedRows<NotionArticle> {
  const valid: NotionArticle[] = [];
  let invalid = 0;
  for (const article of articles) {
    if (notionArticleSchema.safeParse(article).success) valid.push(article);
    else invalid += 1;
  }
  return { valid, invalid };
}

/**
 * 清理 NUL 与孤立 UTF-16 surrogate。
 *
 * PostgREST 原实现已这样处理；放到端口共享层可保证 MySQL 切换不会重新引入写入失败数据。
 */
export function sanitizeTextForStorage(value: string): string {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code === 0) continue;

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        output += value[index]! + value[index + 1]!;
        index += 1;
      }
      continue;
    }

    if (code >= 0xdc00 && code <= 0xdfff) continue;
    output += value[index];
  }
  return output;
}

export function sanitizeJsonForStorage(value: unknown): unknown {
  if (typeof value === "string") return sanitizeTextForStorage(value);
  if (Array.isArray(value)) return value.map((entry) => sanitizeJsonForStorage(entry));
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [sanitizeTextForStorage(key), sanitizeJsonForStorage(entry)]),
    );
  }
  return value;
}

function jsonColumn(value: unknown, column: string): string {
  try {
    const encoded = JSON.stringify(sanitizeJsonForStorage(value));
    if (encoded === undefined) {
      throw new Error("JSON.stringify returned undefined");
    }
    return encoded;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot serialize ${column} as JSON: ${detail}`);
  }
}

/** MySQL DATETIME 无时区；统一转成 UTC，避免部署机器时区改变内容时序。 */
export function toMysqlUtcDateTime(value: string, column: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Invalid ${column} timestamp: ${value}`);
  }

  const pad = (part: number, width = 2) => part.toString().padStart(width, "0");
  return [
    `${pad(timestamp.getUTCFullYear(), 4)}-${pad(timestamp.getUTCMonth() + 1)}-${pad(timestamp.getUTCDate())}`,
    `${pad(timestamp.getUTCHours())}:${pad(timestamp.getUTCMinutes())}:${pad(timestamp.getUTCSeconds())}.${pad(timestamp.getUTCMilliseconds(), 3)}`,
  ].join(" ");
}

/** 将 mysql2 默认 DATETIME 字符串明确解释为 UTC ISO，供 Notion 查询 API 使用。 */
export function fromMysqlUtcDateTime(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value !== "string" || value.trim() === "") return null;

  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/.exec(value);
  if (match) {
    const fractional = (match[3] ?? "").slice(0, 3).padEnd(3, "0");
    return `${match[1]}T${match[2]}.${fractional}Z`;
  }

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
}

export function toNewsItemSqlValues(item: NewsItem): readonly SqlValue[] {
  return [
    sanitizeTextForStorage(item.externalId),
    sanitizeTextForStorage(item.sourceKey),
    sanitizeTextForStorage(item.sourceName),
    sanitizeTextForStorage(item.sourceKind),
    sanitizeTextForStorage(item.title),
    sanitizeTextForStorage(item.url),
    sanitizeTextForStorage(item.summary),
    sanitizeTextForStorage(item.contentText),
    sanitizeTextForStorage(item.contentExcerpt),
    sanitizeTextForStorage(item.contentStatus),
    item.contentFetchedAt === null
      ? null
      : toMysqlUtcDateTime(item.contentFetchedAt, "content_fetched_at"),
    sanitizeTextForStorage(item.ecosystemLayer),
    sanitizeTextForStorage(item.ecosystemLayerLabel),
    jsonColumn(item.tags, "news_items.tags"),
    sanitizeTextForStorage(item.lang),
    item.publishedAt === null ? null : toMysqlUtcDateTime(item.publishedAt, "published_at"),
    sanitizeTextForStorage(item.publishedDate),
    toMysqlUtcDateTime(item.collectedAt, "collected_at"),
    sanitizeTextForStorage(item.collectedDate),
    item.enriched ? 1 : 0,
    jsonColumn(item.metadata, "news_items.metadata"),
  ];
}

export function toNotionArticleSqlValues(article: NotionArticle): readonly SqlValue[] {
  return [
    sanitizeTextForStorage(article.notionPageId),
    sanitizeTextForStorage(article.slug),
    sanitizeTextForStorage(article.sourceKey),
    sanitizeTextForStorage(article.title),
    sanitizeTextForStorage(article.summary),
    sanitizeTextForStorage(article.bodyMarkdown),
    article.coverImageUrl === null ? null : sanitizeTextForStorage(article.coverImageUrl),
    jsonColumn(article.tags, "notion_articles.tags"),
    sanitizeTextForStorage(article.status),
    article.publishedAt === null ? null : toMysqlUtcDateTime(article.publishedAt, "published_at"),
    sanitizeTextForStorage(article.publishedDate),
    sanitizeTextForStorage(article.notionUrl),
    toMysqlUtcDateTime(article.notionLastEditedTime, "notion_last_edited_time"),
    jsonColumn(article.metadata, "notion_articles.metadata"),
  ];
}

/**
 * 给其它三张内容表及未来 worker 使用的通用行序列化。
 * 由 ContentTableContract 固定列集合，拒绝缺列和不受支持的标量，避免 schema 漂移时静默丢数据。
 */
export function toContentTableSqlValues(
  contract: ContentTableContract,
  row: ContentRow,
): readonly SqlValue[] {
  return contract.columns.map((column) => {
    if (!Object.hasOwn(row, column)) {
      throw new Error(`${contract.table} row is missing required column: ${column}`);
    }

    const value = row[column];
    if (contract.jsonColumns.includes(column)) return jsonColumn(value, `${contract.table}.${column}`);
    if (contract.timestampColumns.includes(column)) {
      if (value === null) return null;
      if (value instanceof Date) return toMysqlUtcDateTime(value.toISOString(), column);
      if (typeof value === "string") return toMysqlUtcDateTime(value, column);
      throw new Error(`${contract.table}.${column} must be an ISO timestamp or null`);
    }
    if (value === null) return null;
    if (typeof value === "string") return sanitizeTextForStorage(value);
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error(`${contract.table}.${column} must be finite`);
      return value;
    }
    if (typeof value === "boolean" && contract.booleanColumns?.includes(column)) {
      return value ? 1 : 0;
    }
    throw new Error(`${contract.table}.${column} must be a string, number, boolean, or null`);
  });
}