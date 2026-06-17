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

function toRow(item: NewsItem): NewsItemRow {
  return {
    external_id: item.externalId,
    source_key: item.sourceKey,
    source_name: item.sourceName,
    source_kind: item.sourceKind,
    title: item.title,
    url: item.url,
    summary: item.summary,
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
  const rows = valid.map(toRow);

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
      body: JSON.stringify(rows),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `news_items upsert failed: HTTP ${response.status} ${detail.slice(0, 500)}`,
    );
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

  return { attempted: items.length, invalid, pushed: rows.length, tableCount };
}
