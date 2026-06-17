// 通过 PostgREST 把样例 Notion 文章 upsert 到自托管 Supabase（demo 用，免 Notion token）。
//
// 凭据从环境变量读取，绝不硬编码：
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SCHEMA(可选,默认 public)
//
// 前置：`notion_articles` 表必须已存在（DDL 走 SQL Editor，PostgREST 不能建表）。
// 真实文章由 notion-sync 写入；本脚本只 upsert 样例数据，幂等（on_conflict=notion_page_id）。
//
//   tsx --env-file=.env scripts/push-notion-articles-to-supabase.ts

import { SAMPLE_NOTION_ARTICLES } from "../news-collector/src/notion/sample-data.ts";
import { upsertNotionArticles } from "../news-collector/src/notion/store.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const config = {
    url: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    schema: process.env.SUPABASE_SCHEMA || "public",
  };

  const result = await upsertNotionArticles(SAMPLE_NOTION_ARTICLES, config);
  process.stdout.write(
    `Upsert OK. attempted=${result.attempted} invalid=${result.invalid} ` +
      `pushed=${result.pushed} table count (content-range)=${result.tableCount}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
