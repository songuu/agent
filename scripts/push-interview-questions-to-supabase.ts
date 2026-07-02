// 通过 PostgREST 把 INTERVIEW_QUESTIONS upsert 到自托管 Supabase。
//
// 凭据从环境变量读取（配合 `node --env-file=.env` 或已 export 的变量），绝不硬编码：
//   SUPABASE_URL                自托管实例根 URL
//   SUPABASE_SERVICE_ROLE_KEY   service_role key（绕过 RLS 写入）
//   SUPABASE_SCHEMA             可选，默认 public
//
// 前置：`interview_questions` 表必须已存在（DDL 走 SQL Editor / 直连 Postgres，
// PostgREST 不能建表）。本脚本只负责数据 upsert，幂等（on_conflict=slug）。
//
// 用法：
//   tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts

import { INTERVIEW_QUESTIONS } from "../knowledge-graph/data/interview-questions.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const base = requireEnv("SUPABASE_URL").replace(/\/+$/, "");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const schema = process.env.SUPABASE_SCHEMA || "public";

  const rows = INTERVIEW_QUESTIONS.map((q) => ({
    question_id: q.id,
    slug: q.slug,
    category: q.category,
    category_label: q.categoryLabel,
    question: q.question,
    related_chapters: q.relatedChapters,
    answer_source: q.answerSource,
    collected_date: q.collectedDate,
    collected_at: q.collectedAt,
    sort_order: q.sortOrder,
    tags: q.tags,
    metadata: {
      sourceFile: "knowledge-graph/data/interview-questions.ts",
      companionDoc: "docs/career-guide.md#四高频面试题清单",
      answerSource: q.answerSource,
      sourceTitles: q.sourceTitles,
      sourceUrls: q.sourceUrls,
      confidence: q.confidence ?? null,
      rationale: q.rationale ?? null,
      plainTextDescription: q.summaryExcerpt ?? null,
      faqList: q.faqList ?? null,
    },
  }));

  const endpoint = `${base}/rest/v1/interview_questions?on_conflict=slug`;
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

  // 回读核对：count + 抽样
  const countResp = await fetch(`${base}/rest/v1/interview_questions?select=slug`, {
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
