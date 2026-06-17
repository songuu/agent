// 通过 PostgREST 把 GLOSSARY_TERMS upsert 到自托管 Supabase。
//
// 凭据从环境变量读取（配合 `node --env-file=.env` 或已 export 的变量），绝不硬编码：
//   SUPABASE_URL                自托管实例根 URL
//   SUPABASE_SERVICE_ROLE_KEY   service_role key（绕过 RLS 写入）
//   SUPABASE_SCHEMA             可选，默认 public
//
// 前置：`glossary_terms` 表必须已存在（DDL 走 SQL Editor / 直连 Postgres，
// PostgREST 不能建表）。本脚本只负责数据 upsert，幂等（on_conflict=slug）。
//
// 用法：
//   tsx --env-file=.env scripts/push-glossary-to-supabase.ts

import { GLOSSARY_TERMS } from "../knowledge-graph/data/glossary";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const base = requireEnv("SUPABASE_URL").replace(/\/+$/, "");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const schema = process.env.SUPABASE_SCHEMA || "public";

  const rows = GLOSSARY_TERMS.map((term) => ({
    term_id: term.id,
    slug: term.slug,
    topic: term.topic,
    topic_label: term.topicLabel,
    term: term.term,
    definition: term.definition,
    related_chapters: term.relatedChapters,
    aliases: term.aliases,
    sort_order: term.sortOrder,
    tags: term.tags,
    metadata: {
      sourceFile: "knowledge-graph/data/glossary.ts",
      companionDoc: "docs/glossary.md",
      topic: term.topic,
    },
  }));

  const endpoint = `${base}/rest/v1/glossary_terms?on_conflict=slug`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Content-Profile": schema,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Upsert failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
  }

  // 回读核对：count
  const countResp = await fetch(`${base}/rest/v1/glossary_terms?select=slug`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Accept-Profile": schema,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const contentRange = countResp.headers.get("content-range") ?? "?";
  console.log(`Upsert OK (HTTP ${response.status}). pushed=${rows.length}, table count (content-range)=${contentRange}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
