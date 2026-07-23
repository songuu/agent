// 出库：通过 PostgREST 把 NewsItem 幂等 upsert 到自托管 Supabase `news_items`。
//
// 沿用仓库既有 push 脚本约定（见 scripts/push-frontier-ecosystem-to-supabase.ts）：
// service_role 仅在 Node 端使用、绝不进前端 bundle；on_conflict=external_id 保证重复运行幂等。
// 出库前用 newsItemSchema 逐条校验，挡住空标题/坏链接等脏数据。

import type { SupabaseConfig } from "./config.ts";
import { newsItemSchema, type NewsItem } from "./types.ts";

export interface UpsertResult {
  readonly attempted: number;
  readonly invalid: number;
  readonly pushed: number;
  readonly tableCount: string;
}

interface NewsItemRow {
  external_id: string;
  source_key: string;
  source_name: string;
  source_kind: string;
  title: string;
  url: string;
  summary: string;
  content_text: string;
  content_excerpt: string;
  content_status: string;
  content_fetched_at: string | null;
  ecosystem_layer: string;
  ecosystem_layer_label: string;
  tags: readonly string[];
  lang: string;
  published_at: string | null;
  published_date: string;
  collected_at: string;
  collected_date: string;
  enriched: boolean;
  metadata: Readonly<Record<string, unknown>>;
}

const NEWS_ITEM_UPSERT_CHUNK_SIZE = 100;

function toRow(item: NewsItem): NewsItemRow {
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

function chunkRows<T>(rows: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function sanitizeTextForPostgrest(value: string): string {
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

function sanitizeForPostgrest(value: unknown): unknown {
  if (typeof value === "string") return sanitizeTextForPostgrest(value);
  if (Array.isArray(value)) return value.map((entry) => sanitizeForPostgrest(entry));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeForPostgrest(entry)]),
    );
  }
  return value;
}

/** 幂等 upsert；返回尝试/无效/成功条数与表内总量（content-range）。 */
export async function upsertNewsItems(
  items: readonly NewsItem[],
  config: SupabaseConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<UpsertResult> {
  const valid: NewsItem[] = [];
  let invalid = 0;
  for (const item of items) {
    if (newsItemSchema.safeParse(item).success) {
      valid.push(item);
    } else {
      invalid += 1;
    }
  }

  if (valid.length === 0) {
    return { attempted: items.length, invalid, pushed: 0, tableCount: "0" };
  }

  const base = config.url.replace(/\/+$/, "");
  const rows = valid.map((item) => sanitizeForPostgrest(toRow(item)) as NewsItemRow);
  let pushed = 0;

  const rowChunks = chunkRows(rows, NEWS_ITEM_UPSERT_CHUNK_SIZE);
  for (let chunkIndex = 0; chunkIndex < rowChunks.length; chunkIndex += 1) {
    const chunk = rowChunks[chunkIndex]!;
    const response = await fetchImpl(
      `${base}/rest/v1/news_items?on_conflict=external_id`,
      {
        method: "POST",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": "application/json",
          "Content-Profile": config.schema,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      const start = chunkIndex * NEWS_ITEM_UPSERT_CHUNK_SIZE;
      const end = start + chunk.length - 1;
      throw new Error(
        `news_items upsert failed: table=news_items chunk=${chunkIndex + 1}/${rowChunks.length} rows=${start}-${end} HTTP ${response.status} ${detail.slice(0, 500)}`,
      );
    }

    pushed += chunk.length;
  }

  const countResponse = await fetchImpl(
    `${base}/rest/v1/news_items?select=external_id`,
    {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Accept-Profile": config.schema,
        Prefer: "count=exact",
        Range: "0-0",
      },
    },
  );
  const tableCount = countResponse.headers.get("content-range") ?? "?";

  return { attempted: items.length, invalid, pushed, tableCount };
}
