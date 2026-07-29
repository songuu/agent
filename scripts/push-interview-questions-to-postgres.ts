// Write INTERVIEW_QUESTIONS directly to the server PostgreSQL content repository.
// Current production writer policy forbids Supabase/PostgREST writes for scheduled syncs.

import { INTERVIEW_QUESTIONS } from "../knowledge-graph/data/interview-questions.ts";
import { loadContentRepositoryConfig } from "../news-collector/src/data/repository-config.ts";
import { openPostgresContentRepository } from "../news-collector/src/data/postgres-runtime.ts";
import type { ContentRow } from "../news-collector/src/data/content-table-contracts.ts";

function loadPostgresConfig() {
  const config = loadContentRepositoryConfig(process.env);
  if (config.driver !== "postgres") {
    throw new Error("Interview PostgreSQL push requires CONTENT_REPOSITORY_DRIVER=postgres or CONTENT_POSTGRES_WRITE_URL; refusing Supabase writes.");
  }
  return config.postgres;
}

function toRows(): ContentRow[] {
  return INTERVIEW_QUESTIONS.map((q) => ({
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
}

async function main(): Promise<void> {
  const handle = await openPostgresContentRepository(loadPostgresConfig());
  try {
    const rows = toRows();
    const result = await handle.repository.upsertTableRows("interview_questions", rows);
    console.log(`PostgreSQL upsert OK. table=interview_questions pushed=${result.pushed}, attempted=${result.attempted}, table count=${result.tableCount}`);
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});