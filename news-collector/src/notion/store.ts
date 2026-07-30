// 兼容旧调用入口。内容写入已迁移到服务器 PostgreSQL repository，
// 因此该 PostgREST 路径必须在校验数据或发起网络请求前显式失败。

import type { SupabaseConfig } from "../config.ts";
import { rejectSupabaseDataWrite } from "../data/supabase-write-policy.ts";
import type { NotionArticle } from "./types.ts";

export interface UpsertResult {
  readonly attempted: number;
  readonly invalid: number;
  readonly pushed: number;
  readonly tableCount: string;
}


/** 保留旧 API 签名，但拒绝已禁用的 Supabase/PostgREST 写入。 */
export async function upsertNotionArticles(
  _articles: readonly NotionArticle[],
  _config: SupabaseConfig,
  _fetchImpl: typeof fetch = fetch,
): Promise<UpsertResult> {
  rejectSupabaseDataWrite("notion_articles legacy Supabase upsert");
}
