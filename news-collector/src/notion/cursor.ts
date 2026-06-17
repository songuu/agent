// 增量高水位：从 notion_articles 读某来源已存的最大 notion_last_edited_time 当游标。
//
// 无状态——库即真相，不维护任何 state 文件（避免游标漂移/丢失）。首次（无行）返回 null = 全量 backfill。

import type { SupabaseConfig } from "../config.ts";
import { parseManifest, type AssetManifest } from "./asset-manifest.ts";

/** 取该 source_key 下最大的 notion_last_edited_time（ISO）；无则 null。 */
export async function fetchMaxLastEdited(
  config: SupabaseConfig,
  sourceKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const base = config.url.replace(/\/+$/, "");
  const params = new URLSearchParams();
  params.set("select", "notion_last_edited_time");
  params.set("source_key", `eq.${sourceKey}`);
  params.set("order", "notion_last_edited_time.desc");
  params.set("limit", "1");

  const response = await fetchImpl(`${base}/rest/v1/notion_articles?${params.toString()}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Accept-Profile": config.schema,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `fetchMaxLastEdited(${sourceKey}) failed: HTTP ${response.status} ${detail.slice(0, 300)}`,
    );
  }

  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const value = (rows[0] as { notion_last_edited_time?: unknown }).notion_last_edited_time;
  return typeof value === "string" ? value : null;
}

/**
 * 取某页已存的图片 manifest（metadata.assets）；用于跨次同步跳过未变图片的重新上传。
 * 容错：读不到（首次/错误）返回空 manifest，退化为重新上传（稳定 srcHash key 仍防重复对象）。
 */
export async function fetchArticleManifest(
  config: SupabaseConfig,
  notionPageId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AssetManifest> {
  const base = config.url.replace(/\/+$/, "");
  const params = new URLSearchParams();
  params.set("select", "metadata");
  params.set("notion_page_id", `eq.${notionPageId}`);
  params.set("limit", "1");

  try {
    const response = await fetchImpl(`${base}/rest/v1/notion_articles?${params.toString()}`, {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Accept-Profile": config.schema,
      },
    });
    if (!response.ok) return {};
    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows) || !rows[0]) return {};
    const metadata = (rows[0] as { metadata?: { assets?: unknown } }).metadata;
    return parseManifest(metadata?.assets);
  } catch {
    return {};
  }
}
