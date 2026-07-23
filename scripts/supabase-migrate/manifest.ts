import { createHash } from "node:crypto";

import type { Row, TableManifest } from "./types.ts";

/**
 * This is deliberately a closed manifest, rather than a schema crawler.
 * It makes the ownership boundary auditable: Auth, Functions, Realtime,
 * dashboard settings, extensions, and any future unrelated public table are
 * outside this migration.
 */
export const CONTENT_TABLES: readonly TableManifest[] = [
  {
    table: "frontier_ecosystem_articles",
    conflictKey: "slug",
    copyFields: [
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
    keyFields: ["slug", "title", "source_url", "collected_date"],
  },
  {
    table: "interview_questions",
    conflictKey: "slug",
    copyFields: [
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
    keyFields: ["slug", "category", "question", "collected_date"],
  },
  {
    table: "glossary_terms",
    conflictKey: "slug",
    copyFields: [
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
    keyFields: ["slug", "topic", "term", "definition"],
  },
  {
    table: "news_items",
    conflictKey: "external_id",
    copyFields: [
      "external_id",
      "source_key",
      "source_name",
      "source_kind",
      "title",
      "url",
      "summary",
      "content_text",
      "content_excerpt",
      "content_status",
      "content_fetched_at",
      "ecosystem_layer",
      "ecosystem_layer_label",
      "tags",
      "lang",
      "published_at",
      "published_date",
      "collected_at",
      "collected_date",
      "enriched",
      "read_count",
      "metadata",
    ],
    keyFields: ["external_id", "source_key", "url", "published_date"],
  },
  {
    table: "notion_articles",
    conflictKey: "notion_page_id",
    copyFields: [
      "notion_page_id",
      "slug",
      "source_key",
      "title",
      "summary",
      "body_markdown",
      "cover_image_url",
      "tags",
      "status",
      "published_at",
      "published_date",
      "notion_url",
      "notion_last_edited_time",
      "read_count",
      "metadata",
    ],
    keyFields: ["notion_page_id", "slug", "status", "notion_last_edited_time"],
  },
] as const;

export const NOTION_STORAGE_BUCKET = "notion-assets" as const;

export function tableManifest(table: string): TableManifest {
  const manifest = CONTENT_TABLES.find((candidate) => candidate.table === table);
  if (!manifest) throw new Error(`Unsupported public table: ${table}`);
  return manifest;
}

/**
 * Refuse to silently replace a missing source column with a target default.
 * An explicit failure makes source/target schema drift visible before writes.
 */
export function projectPortableRow(manifest: TableManifest, row: Row): Row {
  const portable: Row = {};
  for (const field of manifest.copyFields) {
    if (!Object.prototype.hasOwnProperty.call(row, field)) {
      throw new Error(`Source public.${manifest.table} is missing expected field: ${field}`);
    }
    portable[field] = row[field];
  }

  const conflict = portable[manifest.conflictKey];
  if (typeof conflict !== "string" || conflict.length === 0) {
    throw new Error(`Source public.${manifest.table} has an empty conflict key: ${manifest.conflictKey}`);
  }
  return portable;
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, canonicalValue(object[key])]),
    );
  }
  return value;
}

/** A deterministic content fingerprint, independent of JSON object key order and API row order. */
export function stableTableHash(manifest: TableManifest, rows: readonly Row[]): string {
  const normalized = rows
    .map((row) => projectPortableRow(manifest, row))
    .sort((left, right) => String(left[manifest.conflictKey]).localeCompare(String(right[manifest.conflictKey])))
    .map(canonicalValue);
  const payload = JSON.stringify({ table: manifest.table, fields: manifest.copyFields, rows: normalized });
  return createHash("sha256").update(payload).digest("hex");
}
