// MySQL 内容库实现。
//
// 不直接 import mysql2：部署层负责创建连接/池并把最小 execute 契约注入，
// 因而本模块可在不引入运行时依赖的前提下单测，也便于替换成 TiDB / MariaDB 兼容驱动。

import { parseManifest, type AssetManifest } from "../notion/asset-manifest.ts";
import type { NotionArticle } from "../notion/types.ts";
import type { NewsItem } from "../types.ts";
import {
  fromMysqlUtcDateTime,
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

export interface MySqlRow {
  readonly [column: string]: unknown;
}

export interface MySqlExecutionResult {
  readonly rows?: readonly MySqlRow[];
  readonly affectedRows?: number;
}

/** 最小驱动契约；所有用户内容必须经 values 参数绑定，绝不拼接进 SQL。 */
export interface MySqlExecutor {
  execute(statement: string, values: readonly SqlValue[]): Promise<MySqlExecutionResult>;
}

/** mysql2/promise Connection 的结构子集，避免把 mysql2 变为仓库核心依赖。 */
export interface Mysql2ConnectionLike {
  execute(
    statement: string,
    values?: readonly SqlValue[],
  ): Promise<readonly [unknown, unknown]>;
}

/**
 * 可选桥接：应用安装 mysql2 后，把已创建的连接注入即可。
 * 这个模块本身没有 mysql2 import，也不会在测试/站点构建时尝试连接数据库。
 */
export function createMysql2Executor(connection: Mysql2ConnectionLike): MySqlExecutor {
  return {
    async execute(statement, values) {
      const [raw] = await connection.execute(statement, values);
      if (Array.isArray(raw)) {
        return { rows: raw.filter(isRecord) };
      }
      if (isRecord(raw)) {
        const affectedRows = raw.affectedRows;
        return { affectedRows: typeof affectedRows === "number" ? affectedRows : undefined };
      }
      return {};
    },
  };
}

function isRecord(value: unknown): value is MySqlRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export interface MySqlContentRepositoryOptions {
  readonly executor: MySqlExecutor;
  /** 默认 100，避免大批量 SQL 超过 max_allowed_packet。 */
  readonly chunkSize?: number;
}

const DEFAULT_CHUNK_SIZE = 100;

function quoteIdentifier(identifier: string): string {
  // 表/列只来自本仓库的契约常量；仍保留断言，避免未来配置化时直接扩大 SQL 注入面。
  if (!/^[a-z_][a-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

/**
 * MySQL 8.0.19+ row alias 语法；不使用已弃用的 VALUES(column)。
 *
 * `IF(natural_key = new.natural_key, ..., NULL)` 是关键保护：MySQL 的 ON DUPLICATE KEY
 * 会匹配任意 unique key，而 PostgreSQL on_conflict 只匹配指定键。若命中 frontier.source_url
 * 或 notion.slug 等其它唯一键且 natural key 不同，这里触发 NOT NULL 错误而非错误合并两条内容。
 */
export function buildMySqlUpsertStatement(
  contract: ContentTableContract,
  rowCount: number,
): string {
  if (!Number.isInteger(rowCount) || rowCount < 1) {
    throw new Error(`rowCount must be a positive integer, got ${rowCount}`);
  }

  const columns = contract.columns.map(quoteIdentifier);
  const placeholders = `(${contract.columns.map(() => "?").join(", ")})`;
  const rows = Array.from({ length: rowCount }, () => placeholders).join(", ");
  const conflictKey = quoteIdentifier(contract.conflictKey);
  const updates = contract.columns
    .filter((column) => column !== contract.conflictKey)
    .map((column) => {
      const quoted = quoteIdentifier(column);
      return `${quoted} = IF(${conflictKey} = new.${conflictKey}, new.${quoted}, NULL)`;
    })
    .join(", ");

  return [
    `INSERT INTO ${quoteIdentifier(contract.table)} (${columns.join(", ")})`,
    `VALUES ${rows} AS new`,
    `ON DUPLICATE KEY UPDATE ${updates}`,
  ].join(" ");
}

function chunkRows<T>(rows: readonly T[], chunkSize: number): readonly T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

function countStatement(contract: ContentTableContract): string {
  return `SELECT COUNT(*) AS \`table_count\` FROM ${quoteIdentifier(contract.table)}`;
}

function countFrom(result: MySqlExecutionResult): string {
  const raw = result.rows?.[0]?.table_count;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "bigint") return raw.toString();
  if (typeof raw === "string" && /^\d+$/.test(raw)) return raw;
  return "?";
}

async function upsertPreparedRows<T>(input: {
  readonly executor: MySqlExecutor;
  readonly chunkSize: number;
  readonly contract: ContentTableContract;
  readonly attempted: number;
  readonly invalid: number;
  readonly rows: readonly T[];
  readonly valuesOf: (row: T) => readonly SqlValue[];
}): Promise<ContentUpsertResult> {
  if (input.rows.length === 0) {
    return { attempted: input.attempted, invalid: input.invalid, pushed: 0, tableCount: "0" };
  }

  let pushed = 0;
  for (const rows of chunkRows(input.rows, input.chunkSize)) {
    const statement = buildMySqlUpsertStatement(input.contract, rows.length);
    const values = rows.flatMap((row) => input.valuesOf(row));
    await input.executor.execute(statement, values);
    pushed += rows.length;
  }

  const tableCount = countFrom(await input.executor.execute(countStatement(input.contract), []));
  return { attempted: input.attempted, invalid: input.invalid, pushed, tableCount };
}

function parseJsonObject(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

export function createMySqlContentRepository(
  options: MySqlContentRepositoryOptions,
): ContentRepository {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 1000) {
    throw new Error(`chunkSize must be an integer between 1 and 1000, got ${chunkSize}`);
  }

  return {
    provider: "mysql",
    async upsertNewsItems(items: readonly NewsItem[]): Promise<ContentUpsertResult> {
      const { valid, invalid } = validateNewsItems(items);
      return upsertPreparedRows({
        executor: options.executor,
        chunkSize,
        contract: getContentTableContract("news_items"),
        attempted: items.length,
        invalid,
        rows: valid,
        valuesOf: toNewsItemSqlValues,
      });
    },
    async upsertNotionArticles(articles: readonly NotionArticle[]): Promise<ContentUpsertResult> {
      const { valid, invalid } = validateNotionArticles(articles);
      return upsertPreparedRows({
        executor: options.executor,
        chunkSize,
        contract: getContentTableContract("notion_articles"),
        attempted: articles.length,
        invalid,
        rows: valid,
        valuesOf: toNotionArticleSqlValues,
      });
    },
    async upsertTableRows(
      table: ContentTableName,
      rows: readonly ContentRow[],
    ): Promise<ContentUpsertResult> {
      const contract = getContentTableContract(table);
      return upsertPreparedRows({
        executor: options.executor,
        chunkSize,
        contract,
        attempted: rows.length,
        invalid: 0,
        rows,
        valuesOf: (row) => toContentTableSqlValues(contract, row),
      });
    },
    async fetchNotionCursor(sourceKey: string): Promise<string | null> {
      const statement = [
        "SELECT MAX(`notion_last_edited_time`) AS `notion_last_edited_time`",
        "FROM `notion_articles` WHERE `source_key` = ?",
      ].join(" ");
      const result = await options.executor.execute(statement, [sourceKey]);
      return fromMysqlUtcDateTime(result.rows?.[0]?.notion_last_edited_time);
    },
    async fetchNotionAssetManifest(notionPageId: string): Promise<AssetManifest> {
      try {
        const result = await options.executor.execute(
          "SELECT `metadata` FROM `notion_articles` WHERE `notion_page_id` = ? LIMIT 1",
          [notionPageId],
        );
        const metadata = parseJsonObject(result.rows?.[0]?.metadata);
        const assets = isRecord(metadata) ? metadata.assets : undefined;
        return parseManifest(assets);
      } catch {
        // 与既有 fetchArticleManifest 一致：manifest 读失败时退化为重新上传，不能阻断整篇同步。
        return {};
      }
    },
  };
}
