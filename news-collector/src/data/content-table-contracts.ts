// 五张内容表的数据库无关契约。
//
// 写入端只声明应用拥有的列；id/read_count/created_at/updated_at 等平台生成列不由同步器覆盖。
// 这让 Supabase → MySQL/其他数据库时的主键实现可替换，同时保留业务幂等键。

import { NEWS_ITEM_COLUMNS, NOTION_ARTICLE_COLUMNS } from "./content-mapping.ts";

export const CONTENT_TABLE_NAMES = [
  "frontier_ecosystem_articles",
  "interview_questions",
  "glossary_terms",
  "news_items",
  "notion_articles",
] as const;

export type ContentTableName = (typeof CONTENT_TABLE_NAMES)[number];
export type ContentRow = Readonly<Record<string, unknown>>;

export interface ContentTableContract {
  readonly table: ContentTableName;
  /** PostgreSQL `on conflict` 与 MySQL 幂等更新均以此自然键为准。 */
  readonly conflictKey: string;
  readonly columns: readonly string[];
  readonly jsonColumns: readonly string[];
  readonly timestampColumns: readonly string[];
  readonly booleanColumns?: readonly string[];
  /**
   * PostgreSQL 的其它唯一键。MySQL 的 ON DUPLICATE KEY 会匹配任意唯一键，
   * 实现必须拒绝 natural key 不同的冲突，绝不能把两条内容合并。
   */
  readonly alternateUniqueKeys?: readonly string[];
}

export const CONTENT_TABLE_CONTRACTS: Readonly<Record<ContentTableName, ContentTableContract>> = {
  frontier_ecosystem_articles: {
    table: "frontier_ecosystem_articles",
    conflictKey: "slug",
    columns: [
      "article_id",
      "slug",
      "chapter_id",
      "chapter_slug",
      "title",
      "source",
      "source_url",
      "kind",
      "ecosystem_layer",
      "ecosystem_layer_label",
      "summary",
      "collected_date",
      "collected_at",
      "read_count",
      "sort_order",
      "tags",
      "detail_paragraphs",
      "metadata",
    ],
    jsonColumns: ["tags", "detail_paragraphs", "metadata"],
    timestampColumns: ["collected_at"],
    alternateUniqueKeys: ["source_url"],
  },
  interview_questions: {
    table: "interview_questions",
    conflictKey: "slug",
    columns: [
      "question_id",
      "slug",
      "category",
      "category_label",
      "question",
      "related_chapters",
      "answer_source",
      "collected_date",
      "collected_at",
      "sort_order",
      "tags",
      "metadata",
    ],
    jsonColumns: ["related_chapters", "tags", "metadata"],
    timestampColumns: ["collected_at"],
  },
  glossary_terms: {
    table: "glossary_terms",
    conflictKey: "slug",
    columns: [
      "term_id",
      "slug",
      "topic",
      "topic_label",
      "term",
      "definition",
      "related_chapters",
      "aliases",
      "sort_order",
      "tags",
      "metadata",
    ],
    jsonColumns: ["related_chapters", "aliases", "tags", "metadata"],
    timestampColumns: [],
  },
  news_items: {
    table: "news_items",
    conflictKey: "external_id",
    columns: NEWS_ITEM_COLUMNS,
    jsonColumns: ["tags", "metadata"],
    timestampColumns: ["content_fetched_at", "published_at", "collected_at"],
    booleanColumns: ["enriched"],
  },
  notion_articles: {
    table: "notion_articles",
    conflictKey: "notion_page_id",
    columns: NOTION_ARTICLE_COLUMNS,
    jsonColumns: ["tags", "metadata"],
    timestampColumns: ["published_at", "notion_last_edited_time"],
    alternateUniqueKeys: ["slug"],
  },
};

export function getContentTableContract(table: ContentTableName): ContentTableContract {
  return CONTENT_TABLE_CONTRACTS[table];
}

/** 只允许契约列进入存储层，防止 worker 把 id/read_count 等不属于本次同步的字段意外覆盖。 */
export function pickContentRow(
  contract: ContentTableContract,
  row: ContentRow,
): Readonly<Record<string, unknown>> {
  const output: Record<string, unknown> = {};
  for (const column of contract.columns) {
    if (!Object.hasOwn(row, column)) {
      throw new Error(`${contract.table} row is missing required column: ${column}`);
    }
    output[column] = row[column];
  }
  return output;
}