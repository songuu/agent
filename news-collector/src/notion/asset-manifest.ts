// 图片资源 manifest：按 blockId 记录已重托管图片，保证跨次同步不重复上传。
//
// 幂等关键：Notion 临时图片 URL 的签名 querystring 每次拉取都变，用整串 hash 会每次重传。
// 故 srcHash 只对 URL 的 path（去 querystring）求 sha256——同一底层资源稳定不变。
// manifest 存进 notion_articles.metadata.assets，下次同步比对 srcHash 命中即跳过上传。

import { createHash } from "node:crypto";
import { extname } from "node:path";
import { z } from "zod";

export const assetEntrySchema = z.object({
  blockId: z.string(),
  storageKey: z.string(),
  publicUrl: z.string(),
  srcHash: z.string(),
});

export type AssetEntry = z.infer<typeof assetEntrySchema>;

/** blockId → AssetEntry。 */
export const assetManifestSchema = z.record(assetEntrySchema);

export type AssetManifest = z.infer<typeof assetManifestSchema>;

/** 从 metadata.assets 容错解析 manifest；非法结构当空。 */
export function parseManifest(raw: unknown): AssetManifest {
  const result = assetManifestSchema.safeParse(raw);
  return result.success ? result.data : {};
}

/** 去掉 querystring 的稳定路径（含 origin+pathname）。 */
function pathWithoutQuery(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl.split("?")[0] ?? rawUrl;
  }
}

/** 资源指纹：对去 querystring 的路径求 sha256 前 16 hex。 */
export function srcHashOf(rawUrl: string): string {
  return createHash("sha256").update(pathWithoutQuery(rawUrl)).digest("hex").slice(0, 16);
}

/** 稳定存储 key：`{pageId}/{blockId}-{srcHash}{.ext}`，重跑同图同 key（x-upsert 覆盖）。 */
export function storageKeyFor(
  pageId: string,
  blockId: string,
  rawUrl: string,
): string {
  const ext = extname(pathWithoutQuery(rawUrl));
  return `${pageId}/${blockId}-${srcHashOf(rawUrl)}${ext}`;
}
