// Write FRONTIER_ARTICLES directly to the server PostgreSQL content repository.
// Current production writer policy forbids Supabase/PostgREST writes for scheduled syncs.

import { FRONTIER_ARTICLES } from "../knowledge-graph/data/frontier-articles.ts";
import { loadContentRepositoryConfig } from "../news-collector/src/data/repository-config.ts";
import { openPostgresContentRepository } from "../news-collector/src/data/postgres-runtime.ts";
import type { ContentRow } from "../news-collector/src/data/content-table-contracts.ts";

function loadPostgresConfig() {
  const config = loadContentRepositoryConfig(process.env);
  if (config.driver !== "postgres") {
    throw new Error("Frontier PostgreSQL push requires CONTENT_REPOSITORY_DRIVER=postgres or CONTENT_POSTGRES_WRITE_URL; refusing Supabase writes.");
  }
  return config.postgres;
}

function toRows(): ContentRow[] {
  return FRONTIER_ARTICLES.map((article) => ({
    article_id: article.id,
    slug: article.slug,
    chapter_id: article.chapterId,
    chapter_slug: article.chapterSlug,
    title: article.title,
    source: article.source,
    source_url: article.url,
    kind: article.kind,
    ecosystem_layer: article.ecosystemLayer,
    ecosystem_layer_label: article.ecosystemLayerLabel,
    summary: article.summary,
    collected_date: article.collectedDate,
    collected_at: article.collectedAt,
    read_count: article.readCount,
    sort_order: article.sortOrder,
    tags: article.tags,
    detail_paragraphs: article.detailParagraphs,
    metadata: {
      sourceFile: "knowledge-graph/data/graph.ts",
      displayDateLabel: article.displayDateLabel,
      originalKind: article.kind,
      ecosystemLayer: article.ecosystemLayer,
      publishedAt: article.publishedAt ?? null,
      author: article.author ?? null,
      institution: article.institution ?? null,
      applicableModules: article.applicableModules,
      confidence: article.confidence ?? null,
      credibilityNote: article.credibilityNote ?? null,
    },
  }));
}

async function main(): Promise<void> {
  const handle = await openPostgresContentRepository(loadPostgresConfig());
  try {
    const rows = toRows();
    const result = await handle.repository.upsertTableRows("frontier_ecosystem_articles", rows);
    console.log(`PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=${result.pushed}, attempted=${result.attempted}, table count=${result.tableCount}`);
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});