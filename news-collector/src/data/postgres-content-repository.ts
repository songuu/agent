// PostgreSQL 内容库实现。连接池只在部署组合根创建；本模块保留可注入的最小 query 契约。

import { parseManifest, type AssetManifest } from "../notion/asset-manifest.ts";
import type { NotionArticle } from "../notion/types.ts";
import type { NewsItem } from "../types.ts";
import {
  fromMysqlUtcDateTime,
  sanitizeJsonForStorage,
  toContentTableSqlValues,
  toNewsItemSqlValues,
  toNotionArticleSqlValues,
  validateNewsItems,
  validateNotionArticles,
  type SqlValue,
} from "./content-mapping.ts";
import {
  getContentTableContract,
  type ContentRow,
  type ContentTableContract,
  type ContentTableName,
} from "./content-table-contracts.ts";
import type { ContentRepository, ContentUpsertResult } from "./content-repository.ts";

export interface PostgresRow {
  readonly [column: string]: unknown;
}

export interface PostgresExecutionResult {
  readonly rows: readonly PostgresRow[];
  readonly rowCount: number;
}

/** 用户内容只能通过 values 参数绑定；表名和列名只能来自仓库内的封闭契约。 */
export interface PostgresExecutor {
  query(statement: string, values: readonly unknown[]): Promise<PostgresExecutionResult>;
}

export interface PostgresContentRepositoryOptions {
  readonly executor: PostgresExecutor;
  readonly chunkSize?: number;
}

const DEFAULT_CHUNK_SIZE = 100;

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

const TRANSLATION_PAYLOAD_COLUMNS = new Set([
  "title_zh",
  "summary_zh",
  "content_text_zh",
  "translated_at",
]);

/** 未启用或失败的翻译不能覆盖数据库里已有的成功译文。 */
function postgresUpdateAssignment(contract: ContentTableContract, column: string): string {
  const quoted = quoteIdentifier(column);
  if (contract.table !== "news_items") return `${quoted} = EXCLUDED.${quoted}`;

  const current = `${quoteIdentifier(contract.table)}.${quoted}`;
  const incomingStatus = `EXCLUDED.${quoteIdentifier("translation_status")}`;
  const currentStatus = `${quoteIdentifier(contract.table)}.${quoteIdentifier("translation_status")}`;
  if (TRANSLATION_PAYLOAD_COLUMNS.has(column)) {
    return `${quoted} = CASE WHEN ${currentStatus} = 'translated' AND ${incomingStatus} <> 'translated' THEN ${current} ELSE EXCLUDED.${quoted} END`;
  }
  if (column === "translation_status") {
    return `${quoted} = CASE WHEN ${incomingStatus} = 'translated' OR ${current} <> 'translated' THEN ${incomingStatus} ELSE ${current} END`;
  }
  return `${quoted} = EXCLUDED.${quoted}`;
}

export function buildPostgresUpsertStatement(
  contract: ContentTableContract,
  rowCount: number,
): string {
  if (!Number.isInteger(rowCount) || rowCount < 1) {
    throw new Error(`rowCount must be a positive integer, got ${rowCount}`);
  }

  let position = 0;
  const rows = Array.from({ length: rowCount }, () =>
    `(${contract.columns.map(() => `$${++position}`).join(", ")})`,
  ).join(", ");
  const updates = contract.columns
    .filter((column) => column !== contract.conflictKey)
    .map((column) => postgresUpdateAssignment(contract, column))
    .join(", ");

  return [
    `INSERT INTO ${quoteIdentifier(contract.table)} (${contract.columns.map(quoteIdentifier).join(", ")})`,
    `VALUES ${rows}`,
    `ON CONFLICT (${quoteIdentifier(contract.conflictKey)}) DO UPDATE SET ${updates}`,
  ].join(" ");
}

function chunks<T>(rows: readonly T[], size: number): readonly T[][] {
  const output: T[][] = [];
  for (let index = 0; index < rows.length; index += size) output.push(rows.slice(index, index + size));
  return output;
}

function parseJsonValue(value: SqlValue, context: string): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`Cannot convert ${context} to a PostgreSQL native value.`);
  }
}

/**
 * 现有共享映射负责清理文本和校验时间；这里仅把 MySQL 传输形态恢复为 PG 原生类型。
 * text[] 必须是数组、jsonb 必须是对象、boolean 不能以 0/1 发送。
 */
function toPostgresValues(
  contract: ContentTableContract,
  values: readonly SqlValue[],
): readonly unknown[] {
  return values.map((value, index) => {
    const column = contract.columns[index]!;
    if (contract.jsonColumns.includes(column)) {
      return sanitizeJsonForStorage(parseJsonValue(value, `${contract.table}.${column}`));
    }
    if (contract.booleanColumns?.includes(column)) return value === 1;
    return value;
  });
}

function countFrom(result: PostgresExecutionResult): string {
  const raw = result.rows[0]?.table_count;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "bigint") return raw.toString();
  if (typeof raw === "string" && /^\d+$/.test(raw)) return raw;
  return "?";
}

async function upsertRows<T>(input: {
  readonly executor: PostgresExecutor;
  readonly contract: ContentTableContract;
  readonly chunkSize: number;
  readonly rows: readonly T[];
  readonly attempted: number;
  readonly invalid: number;
  readonly valuesOf: (row: T) => readonly SqlValue[];
}): Promise<ContentUpsertResult> {
  if (input.rows.length === 0) {
    return { attempted: input.attempted, invalid: input.invalid, pushed: 0, tableCount: "0" };
  }

  let pushed = 0;
  for (const batch of chunks(input.rows, input.chunkSize)) {
    await input.executor.query(
      buildPostgresUpsertStatement(input.contract, batch.length),
      batch.flatMap((row) => toPostgresValues(input.contract, input.valuesOf(row))),
    );
    pushed += batch.length;
  }

  const table = quoteIdentifier(input.contract.table);
  const tableCount = countFrom(
    await input.executor.query(`SELECT COUNT(*) AS "table_count" FROM ${table}`, []),
  );
  return { attempted: input.attempted, invalid: input.invalid, pushed, tableCount };
}

function metadataObject(value: unknown): Readonly<Record<string, unknown>> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Readonly<Record<string, unknown>>;
  }
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Readonly<Record<string, unknown>>
      : null;
  } catch {
    return null;
  }
}

export function createPostgresContentRepository(
  options: PostgresContentRepositoryOptions,
): ContentRepository {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 1000) {
    throw new Error(`chunkSize must be an integer between 1 and 1000, got ${chunkSize}`);
  }

  return {
    provider: "postgres",
    async upsertNewsItems(items) {
      const { valid, invalid } = validateNewsItems(items);
      const contract = getContentTableContract("news_items");
      return upsertRows({
        executor: options.executor,
        contract,
        chunkSize,
        rows: valid,
        attempted: items.length,
        invalid,
        valuesOf: toNewsItemSqlValues,
      });
    },
    async upsertNotionArticles(articles: readonly NotionArticle[]) {
      const { valid, invalid } = validateNotionArticles(articles);
      const contract = getContentTableContract("notion_articles");
      return upsertRows({
        executor: options.executor,
        contract,
        chunkSize,
        rows: valid,
        attempted: articles.length,
        invalid,
        valuesOf: toNotionArticleSqlValues,
      });
    },
    async upsertTableRows(table: ContentTableName, rows: readonly ContentRow[]) {
      const contract = getContentTableContract(table);
      return upsertRows({
        executor: options.executor,
        contract,
        chunkSize,
        rows,
        attempted: rows.length,
        invalid: 0,
        valuesOf: (row) => toContentTableSqlValues(contract, row),
      });
    },
    async fetchNotionCursor(sourceKey: string): Promise<string | null> {
      const result = await options.executor.query(
        'SELECT MAX("notion_last_edited_time") AS "notion_last_edited_time" FROM "notion_articles" WHERE "source_key" = $1',
        [sourceKey],
      );
      return fromMysqlUtcDateTime(result.rows[0]?.notion_last_edited_time);
    },
    async fetchNotionAssetManifest(notionPageId: string): Promise<AssetManifest> {
      try {
        const result = await options.executor.query(
          'SELECT "metadata" FROM "notion_articles" WHERE "notion_page_id" = $1 LIMIT 1',
          [notionPageId],
        );
        return parseManifest(metadataObject(result.rows[0]?.metadata)?.assets);
      } catch {
        // manifest 读取失败时保留既有降级：重新上传图片，但不阻断整篇 Notion 同步。
        return {};
      }
    },
  };
}
