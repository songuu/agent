// 当前 Supabase/PostgREST 适配器。
//
// 与 legacy store 使用相同 REST endpoint、幂等键和 service_role 头，但不导入 legacy 调用文件；
// 因此可以先并行验证新端口，再由上层逐步切换，无需修改已有 collector/notion sync。

import { parseManifest, type AssetManifest } from "../notion/asset-manifest.ts";
import type { NotionArticle } from "../notion/types.ts";
import type { SupabaseConfig } from "../config.ts";
import type { NewsItem } from "../types.ts";
import { sanitizeJsonForStorage, validateNewsItems, validateNotionArticles } from "./content-mapping.ts";
import { getContentTableContract, pickContentRow, type ContentRow, type ContentTableName } from "./content-table-contracts.ts";
import type { ContentRepository, ContentUpsertResult } from "./content-repository.ts";

export interface SupabaseContentRepositoryOptions {
  readonly config: SupabaseConfig;
  readonly fetchImpl?: typeof fetch;
}

function serviceHeaders(config: SupabaseConfig): Record<string, string> {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
  };
}

const CONTENT_UPSERT_CHUNK_SIZE = 100;

function chunkRows<T>(rows: readonly T[], size: number): readonly T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function newsRow(item: NewsItem): Record<string, unknown> {
  return {
    external_id: item.externalId,
    source_key: item.sourceKey,
    source_name: item.sourceName,
    source_kind: item.sourceKind,
    title: item.title,
    url: item.url,
    summary: item.summary,
    content_text: item.contentText,
    content_excerpt: item.contentExcerpt,
    content_status: item.contentStatus,
    content_fetched_at: item.contentFetchedAt,
    ecosystem_layer: item.ecosystemLayer,
    ecosystem_layer_label: item.ecosystemLayerLabel,
    tags: item.tags,
    lang: item.lang,
    published_at: item.publishedAt,
    published_date: item.publishedDate,
    collected_at: item.collectedAt,
    collected_date: item.collectedDate,
    enriched: item.enriched,
    metadata: item.metadata,
  };
}

function notionRow(article: NotionArticle): Record<string, unknown> {
  return {
    notion_page_id: article.notionPageId,
    slug: article.slug,
    source_key: article.sourceKey,
    title: article.title,
    summary: article.summary,
    body_markdown: article.bodyMarkdown,
    cover_image_url: article.coverImageUrl,
    tags: article.tags,
    status: article.status,
    published_at: article.publishedAt,
    published_date: article.publishedDate,
    notion_url: article.notionUrl,
    notion_last_edited_time: article.notionLastEditedTime,
    metadata: article.metadata,
  };
}

async function upsertRows(input: {
  readonly table: ContentTableName;
  readonly conflictKey: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly attempted: number;
  readonly invalid: number;
  readonly config: SupabaseConfig;
  readonly fetchImpl: typeof fetch;
}): Promise<ContentUpsertResult> {
  if (input.rows.length === 0) {
    return { attempted: input.attempted, invalid: input.invalid, pushed: 0, tableCount: "0" };
  }

  const base = input.config.url.replace(/\/+$/, "");
  let pushed = 0;
  const chunks = chunkRows(input.rows, CONTENT_UPSERT_CHUNK_SIZE);
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunk = chunks[chunkIndex]!;
    const response = await input.fetchImpl(
      `${base}/rest/v1/${input.table}?on_conflict=${input.conflictKey}`,
      {
        method: "POST",
        headers: {
          ...serviceHeaders(input.config),
          "Content-Type": "application/json",
          "Content-Profile": input.config.schema,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk.map((row) => sanitizeJsonForStorage(row))),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      const start = chunkIndex * CONTENT_UPSERT_CHUNK_SIZE;
      const end = start + chunk.length - 1;
      throw new Error(
        `${input.table} upsert failed: chunk=${chunkIndex + 1}/${chunks.length} rows=${start}-${end} HTTP ${response.status} ${detail.slice(0, 500)}`,
      );
    }
    pushed += chunk.length;
  }

  const countResponse = await input.fetchImpl(
    `${base}/rest/v1/${input.table}?select=${input.conflictKey}`,
    {
      headers: {
        ...serviceHeaders(input.config),
        "Accept-Profile": input.config.schema,
        Prefer: "count=exact",
        Range: "0-0",
      },
    },
  );

  return {
    attempted: input.attempted,
    invalid: input.invalid,
    pushed,
    tableCount: countResponse.headers.get("content-range") ?? "?",
  };
}

function metadataObject(value: unknown): Readonly<Record<string, unknown>> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Readonly<Record<string, unknown>>;
  }
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Readonly<Record<string, unknown>>)
      : null;
  } catch {
    return null;
  }
}

export function createSupabaseContentRepository(
  options: SupabaseContentRepositoryOptions,
): ContentRepository {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    provider: "supabase",
    async upsertNewsItems(items: readonly NewsItem[]): Promise<ContentUpsertResult> {
      const { valid, invalid } = validateNewsItems(items);
      return upsertRows({
        table: "news_items",
        conflictKey: "external_id",
        rows: valid.map(newsRow),
        attempted: items.length,
        invalid,
        config: options.config,
        fetchImpl,
      });
    },
    async upsertNotionArticles(articles: readonly NotionArticle[]): Promise<ContentUpsertResult> {
      const { valid, invalid } = validateNotionArticles(articles);
      return upsertRows({
        table: "notion_articles",
        conflictKey: "notion_page_id",
        rows: valid.map(notionRow),
        attempted: articles.length,
        invalid,
        config: options.config,
        fetchImpl,
      });
    },
    upsertTableRows(table: ContentTableName, rows: readonly ContentRow[]) {
      const contract = getContentTableContract(table);
      return upsertRows({
        table,
        conflictKey: contract.conflictKey,
        rows: rows.map((row) => pickContentRow(contract, row)),
        attempted: rows.length,
        invalid: 0,
        config: options.config,
        fetchImpl,
      });
    },
    async fetchNotionCursor(sourceKey: string): Promise<string | null> {
      const base = options.config.url.replace(/\/+$/, "");
      const params = new URLSearchParams({
        select: "notion_last_edited_time",
        source_key: `eq.${sourceKey}`,
        order: "notion_last_edited_time.desc",
        limit: "1",
      });
      const response = await fetchImpl(`${base}/rest/v1/notion_articles?${params.toString()}`, {
        headers: {
          ...serviceHeaders(options.config),
          "Accept-Profile": options.config.schema,
        },
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`fetchNotionCursor(${sourceKey}) failed: HTTP ${response.status} ${detail.slice(0, 300)}`);
      }
      const rows = (await response.json()) as unknown;
      if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== "object") return null;
      const value = (rows[0] as Record<string, unknown>).notion_last_edited_time;
      return typeof value === "string" ? value : null;
    },
    async fetchNotionAssetManifest(notionPageId: string): Promise<AssetManifest> {
      try {
        const base = options.config.url.replace(/\/+$/, "");
        const params = new URLSearchParams({ select: "metadata", notion_page_id: `eq.${notionPageId}`, limit: "1" });
        const response = await fetchImpl(`${base}/rest/v1/notion_articles?${params.toString()}`, {
          headers: {
            ...serviceHeaders(options.config),
            "Accept-Profile": options.config.schema,
          },
        });
        if (!response.ok) return {};
        const rows = (await response.json()) as unknown;
        if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== "object") return {};
        const metadata = metadataObject((rows[0] as Record<string, unknown>).metadata);
        return parseManifest(metadata?.assets);
      } catch {
        // 与当前 Notion sync 一致：manifest 读失败时退化为重新上传，不阻断整篇同步。
        return {};
      }
    },
  };
}