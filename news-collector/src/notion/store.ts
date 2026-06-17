// 出库：通过 PostgREST 把 NotionArticle 幂等 upsert 到 `notion_articles`。
//
// 沿用 ../store.ts 约定：service_role 仅 Node 端用、绝不进前端 bundle；
// on_conflict=notion_page_id 保证重复运行幂等；出库前逐条 notionArticleSchema 校验挡脏数据。

import type { SupabaseConfig } from "../config.ts";
import { notionArticleSchema, type NotionArticle } from "./types.ts";

export interface UpsertResult {
  readonly attempted: number;
  readonly invalid: number;
  readonly pushed: number;
  readonly tableCount: string;
}

interface NotionArticleRow {
  notion_page_id: string;
  slug: string;
  source_key: string;
  title: string;
  summary: string;
  body_markdown: string;
  cover_image_url: string | null;
  tags: readonly string[];
  status: string;
  published_at: string | null;
  published_date: string;
  notion_url: string;
  notion_last_edited_time: string;
  metadata: Readonly<Record<string, unknown>>;
}

function toRow(article: NotionArticle): NotionArticleRow {
  return {
    notion_page_id: article.notionPageId,
    slug: article.slug,
    source_key: article.sourceKey,
    title: article.title,
    summary: article.summary,
    body_markdown: article.bodyMarkdown,
    cover_image_url: article.coverImageUrl,
    tags: article.tags,
    status: article.status,
    published_at: article.publishedAt,
    published_date: article.publishedDate,
    notion_url: article.notionUrl,
    notion_last_edited_time: article.notionLastEditedTime,
    metadata: article.metadata,
  };
}

/** 幂等 upsert；返回尝试/无效/成功条数与表内总量（content-range）。 */
export async function upsertNotionArticles(
  articles: readonly NotionArticle[],
  config: SupabaseConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<UpsertResult> {
  const valid: NotionArticle[] = [];
  let invalid = 0;
  for (const article of articles) {
    if (notionArticleSchema.safeParse(article).success) {
      valid.push(article);
    } else {
      invalid += 1;
    }
  }

  if (valid.length === 0) {
    return { attempted: articles.length, invalid, pushed: 0, tableCount: "0" };
  }

  const base = config.url.replace(/\/+$/, "");
  const rows = valid.map(toRow);

  const response = await fetchImpl(
    `${base}/rest/v1/notion_articles?on_conflict=notion_page_id`,
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
      `notion_articles upsert failed: HTTP ${response.status} ${detail.slice(0, 500)}`,
    );
  }

  const countResponse = await fetchImpl(
    `${base}/rest/v1/notion_articles?select=notion_page_id`,
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

  return { attempted: articles.length, invalid, pushed: rows.length, tableCount };
}
