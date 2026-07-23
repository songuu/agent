// 内容持久化端口：同步编排只依赖这一组稳定操作，不绑定 PostgREST / MySQL 驱动。
//
// news collector 与 Notion 同步已经通过此端口接线；legacy store 仅保留给旧脚本/直接调用者渐进兼容。
// 不把 Storage 上传放进本接口：对象存储与关系型内容库是两种独立替换边界。

import type { AssetManifest } from "../notion/asset-manifest.ts";
import type { NotionArticle } from "../notion/types.ts";
import type { NewsItem } from "../types.ts";
import type { ContentRow, ContentTableName } from "./content-table-contracts.ts";

export interface ContentUpsertResult {
  readonly attempted: number;
  readonly invalid: number;
  readonly pushed: number;
  /** 与既有 store 保持一致：用于运行报告，不作为事务一致性证明。 */
  readonly tableCount: string;
}

export type ContentRepositoryProvider = "supabase" | "mysql";

/**
 * 内容库的最小能力集合。
 *
 * Notion 的两个读取操作不可省略：前者是增量高水位，后者避免已重托管图片在每次同步时重复上传。
 */
export interface ContentRepository {
  readonly provider: ContentRepositoryProvider;
  upsertNewsItems(items: readonly NewsItem[]): Promise<ContentUpsertResult>;
  upsertNotionArticles(articles: readonly NotionArticle[]): Promise<ContentUpsertResult>;
  /** 为 frontier/interview/glossary 等现有 worker 提供的同一幂等表写入能力。 */
  upsertTableRows(table: ContentTableName, rows: readonly ContentRow[]): Promise<ContentUpsertResult>;
  fetchNotionCursor(sourceKey: string): Promise<string | null>;
  fetchNotionAssetManifest(notionPageId: string): Promise<AssetManifest>;
}
