// Supabase -> MySQL 的关系型内容迁移器。
//
// 只迁移本仓库拥有的五张内容表；对象存储、认证和公开 API 都是独立关卡。
// 默认 preflight，不会连接或写入 MySQL；stage 需显式 --execute，copy 还需 --writers-paused。

import { CONTENT_TABLES, projectPortableRow, stableTableHash } from "../supabase-migrate/manifest.ts";
import type { FetchLike, Row, TableManifest } from "../supabase-migrate/types.ts";
import { MYSQL_CONTENT_SCHEMA_SQL } from "../../news-collector/src/data/mysql-schema.ts";
import { getContentTableContract } from "../../news-collector/src/data/content-table-contracts.ts";
import {
  fromMysqlUtcDateTime,
  sanitizeJsonForStorage,
  sanitizeTextForStorage,
  toMysqlUtcDateTime,
} from "../../news-collector/src/data/content-mapping.ts";
import {
  loadContentRepositoryConfig,
  type MySqlConnectionConfig,
} from "../../news-collector/src/data/repository-config.ts";

export type ContentMysqlMigrationPhase = "preflight" | "stage" | "copy" | "verify" | "all";

export interface SupabaseContentSource {
  readonly url: string;
  readonly serviceRoleKey: string;
  readonly schema: "public";
}

export interface MysqlMigrationExecutor {
  execute(
    statement: string,
    values?: readonly unknown[],
  ): Promise<readonly Record<string, unknown>[] | Readonly<Record<string, unknown>>>;
  close?(): Promise<void>;
}

export interface MysqlMigrationHandle {
  readonly executor: MysqlMigrationExecutor;
  close(): Promise<void>;
}

export interface MysqlTableCopyReport {
  readonly table: string;
  readonly sourceRows: number;
  readonly upsertedRows: number;
}

export interface MysqlTableVerification {
  readonly table: string;
  readonly conflictKey: string;
  readonly sourceCount: number;
  readonly targetCount: number;
  readonly sourceHash: string;
  readonly targetHash: string;
  readonly passed: boolean;
}

export interface MysqlMigrationRunReport {
  readonly phases: Readonly<Record<string, unknown>>;
}

const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_BATCH_SIZE = 200;

function requiredEnv(source: Readonly<Record<string, string | undefined>>, name: string): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Missing required ${name} for the Supabase migration source.`);
  return value;
}

function normalizeSupabaseSourceUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("SUPABASE_URL must be an absolute http(s) URL.");
  }
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.username || parsed.password) {
    throw new Error("SUPABASE_URL must be a credential-free http(s) URL.");
  }
  parsed.search = "";
  parsed.hash = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return parsed.toString().replace(/\/$/, "");
}

/** Parse the source profile without requiring browser anon credentials or a target Supabase profile. */
export function parseSupabaseContentSource(
  env: Readonly<Record<string, string | undefined>>,
): SupabaseContentSource {
  const schema = (env.SUPABASE_SCHEMA ?? "public").trim();
  if (schema !== "public") throw new Error("SUPABASE_SCHEMA must be public for the owned content-table migration.");
  return {
    url: normalizeSupabaseSourceUrl(requiredEnv(env, "SUPABASE_URL")),
    serviceRoleKey: requiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
    schema: "public",
  };
}

/** Target must be explicitly MySQL; a default Supabase choice is never acceptable for this command. */
export function parseMysqlMigrationTarget(
  env: NodeJS.ProcessEnv,
): MySqlConnectionConfig {
  if (env.CONTENT_REPOSITORY_DRIVER?.trim().toLowerCase() !== "mysql") {
    throw new Error("CONTENT_REPOSITORY_DRIVER=mysql is required for the MySQL migration target.");
  }
  const selected = loadContentRepositoryConfig(env);
  if (selected.driver !== "mysql") {
    throw new Error("CONTENT_REPOSITORY_DRIVER=mysql is required for the MySQL migration target.");
  }
  return selected.mysql;
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
}

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(identifier)) throw new Error(`Unsafe SQL identifier: ${identifier}`);
  return `\`${identifier}\``;
}

function sourceUrl(source: SupabaseContentSource, manifest: TableManifest): URL {
  return new URL(`rest/v1/${manifest.table}`, `${source.url.replace(/\/+$/, "")}/`);
}

function sourceHeaders(source: SupabaseContentSource): Record<string, string> {
  return {
    apikey: source.serviceRoleKey,
    Authorization: `Bearer ${source.serviceRoleKey}`,
    "Accept-Profile": source.schema,
  };
}

async function parseRows(response: Awaited<ReturnType<FetchLike>>, context: string): Promise<Row[]> {
  if (!response.ok) throw new Error(`${context} failed with HTTP ${response.status}.`);
  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    throw new Error(`${context} returned invalid JSON.`);
  }
  if (!Array.isArray(payload) || payload.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
    throw new Error(`${context} returned an unexpected row payload.`);
  }
  return payload as Row[];
}

/** Read every owned source row through server-side PostgREST with a deterministic natural-key order. */
export async function readAllSupabaseContentRows(options: {
  readonly source: SupabaseContentSource;
  readonly manifest: TableManifest;
  readonly fetch: FetchLike;
  readonly pageSize?: number;
}): Promise<Row[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  assertPositiveInteger("pageSize", pageSize);
  const rows: Row[] = [];
  let offset = 0;
  let expectedTotal: number | null = null;

  for (;;) {
    const url = sourceUrl(options.source, options.manifest);
    url.searchParams.set("select", options.manifest.copyFields.join(","));
    url.searchParams.set("order", `${options.manifest.conflictKey}.asc`);
    const response = await options.fetch(url.toString(), {
      method: "GET",
      headers: {
        ...sourceHeaders(options.source),
        // 必须要求精确总数：PostgREST 的 max_rows 可能把一个请求截成短页；
        // 仅凭 page.length < pageSize 会把截断误判为迁移结束。
        Prefer: "count=exact",
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    });
    const page = await parseRows(response, `Read source public.${options.manifest.table}`);
    const range = parseExactContentRange(
      response.headers.get("content-range"),
      `Read source public.${options.manifest.table}`,
    );
    if (expectedTotal === null) expectedTotal = range.total;
    else if (expectedTotal !== range.total) {
      throw new Error(
        `Read source public.${options.manifest.table} changed during migration: Content-Range total moved from ${expectedTotal} to ${range.total}.`,
      );
    }

    if (range.start === null || range.end === null) {
      if (range.total !== 0 || page.length !== 0 || offset !== 0) {
        throw new Error(`Read source public.${options.manifest.table} returned an invalid empty Content-Range.`);
      }
      return rows;
    }
    if (range.start !== offset || range.end - range.start + 1 !== page.length) {
      throw new Error(
        `Read source public.${options.manifest.table} ignored or truncated its requested Range at offset ${offset}; refusing an incomplete migration.`,
      );
    }
    rows.push(...page.map((row) => projectPortableRow(options.manifest, row)));
    offset += page.length;
    if (offset > range.total) {
      throw new Error(`Read source public.${options.manifest.table} returned more rows than its Content-Range total.`);
    }
    if (offset === range.total) return rows;
    if (page.length === 0) {
      throw new Error(`Read source public.${options.manifest.table} ended before its Content-Range total was reached.`);
    }
  }
}

interface ExactContentRange {
  readonly start: number | null;
  readonly end: number | null;
  readonly total: number;
}

/** Require a numeric Content-Range total instead of trusting a short PostgREST page. */
function parseExactContentRange(value: string | null, context: string): ExactContentRange {
  if (!value) throw new Error(`${context} did not return Content-Range with an exact total.`);
  const empty = /^\*\/(\d+)$/.exec(value);
  if (empty) return { start: null, end: null, total: Number(empty[1]) };
  const range = /^(\d+)-(\d+)\/(\d+)$/.exec(value);
  if (!range) throw new Error(`${context} returned a non-exact Content-Range: ${value}.`);
  const start = Number(range[1]);
  const end = Number(range[2]);
  const total = Number(range[3]);
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    !Number.isSafeInteger(total) ||
    start < 0 ||
    end < start ||
    total <= end
  ) {
    throw new Error(`${context} returned an invalid Content-Range: ${value}.`);
  }
  return { start, end, total };
}

function assertUniqueConflictKeys(manifest: TableManifest, rows: readonly Row[]): void {
  const keys = new Set<string>();
  for (const row of rows) {
    const key = String(row[manifest.conflictKey]);
    if (keys.has(key)) throw new Error(`Source public.${manifest.table} contains duplicate ${manifest.conflictKey}: ${key}`);
    keys.add(key);
  }
}

function chunks<T>(values: readonly T[], size: number): readonly T[][] {
  assertPositiveInteger("batchSize", size);
  const output: T[][] = [];
  for (let start = 0; start < values.length; start += size) output.push(values.slice(start, start + size));
  return output;
}

/**
 * Same natural-key guard as the worker MySQL adapter. MySQL can match any unique key,
 * so a collision on source_url/slug with a different natural key becomes an error instead
 * of silently merging unrelated content during a repeatable migration.
 */
export function buildMysqlMigrationUpsertStatement(manifest: TableManifest, rowCount: number): string {
  if (!Number.isInteger(rowCount) || rowCount < 1) throw new Error("rowCount must be a positive integer.");
  const columns = manifest.copyFields.map(quoteIdentifier);
  const placeholderRow = `(${manifest.copyFields.map(() => "?").join(", ")})`;
  const values = Array.from({ length: rowCount }, () => placeholderRow).join(", ");
  const conflictKey = quoteIdentifier(manifest.conflictKey);
  const updates = manifest.copyFields
    .filter((field) => field !== manifest.conflictKey)
    .map((field) => {
      const column = quoteIdentifier(field);
      return `${column} = IF(${conflictKey} = new.${conflictKey}, new.${column}, NULL)`;
    })
    .join(", ");
  return [
    `INSERT INTO ${quoteIdentifier(manifest.table)} (${columns.join(", ")})`,
    `VALUES ${values} AS new`,
    `ON DUPLICATE KEY UPDATE ${updates}`,
  ].join(" ");
}

function jsonValue(value: unknown, context: string): string {
  try {
    const serialized = JSON.stringify(sanitizeJsonForStorage(value));
    if (serialized === undefined) throw new Error("JSON.stringify returned undefined");
    return serialized;
  } catch (error) {
    throw new Error(`${context} cannot be serialized as JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Convert a canonical PostgREST row to the target MySQL scalar representation. */
export function toMysqlMigrationValues(manifest: TableManifest, row: Row): readonly (string | number | null)[] {
  const portable = projectPortableRow(manifest, row);
  const contract = getContentTableContract(manifest.table as Parameters<typeof getContentTableContract>[0]);
  return manifest.copyFields.map((field) => {
    const value = portable[field];
    if (contract.jsonColumns.includes(field)) return jsonValue(value, `${manifest.table}.${field}`);
    if (contract.timestampColumns.includes(field)) {
      if (value === null) return null;
      if (typeof value !== "string") throw new Error(`${manifest.table}.${field} must be an ISO timestamp or null.`);
      return toMysqlUtcDateTime(value, field);
    }
    if (value === null) return null;
    if (typeof value === "string") return sanitizeTextForStorage(value);
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error(`${manifest.table}.${field} must be finite.`);
      return value;
    }
    if (typeof value === "boolean" && contract.booleanColumns?.includes(field)) return value ? 1 : 0;
    throw new Error(`${manifest.table}.${field} must be a supported scalar value.`);
  });
}

/** Upsert all source rows into MySQL using bounded prepared statements. */
export async function upsertMysqlContentRows(options: {
  readonly executor: MysqlMigrationExecutor;
  readonly manifest: TableManifest;
  readonly rows: readonly Row[];
  readonly batchSize?: number;
}): Promise<number> {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  assertUniqueConflictKeys(options.manifest, options.rows);
  let written = 0;
  for (const batch of chunks(options.rows, batchSize)) {
    const statement = buildMysqlMigrationUpsertStatement(options.manifest, batch.length);
    const values = batch.flatMap((row) => toMysqlMigrationValues(options.manifest, row));
    await options.executor.execute(statement, values);
    written += batch.length;
  }
  return written;
}

/** Static DDL is split before execution so target connections never need multipleStatements=true. */
export function splitMysqlSchemaStatements(sql = MYSQL_CONTENT_SCHEMA_SQL): readonly string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

interface MysqlSchemaExpectedColumn {
  readonly name: string;
  readonly dataType: string;
}

interface MysqlSchemaExpectedIndex {
  readonly name: string;
  readonly columns: readonly string[];
  readonly unique: boolean;
  readonly indexType: "BTREE" | "FULLTEXT";
}

export interface MysqlContentSchemaRequirement {
  readonly table: string;
  readonly columns: readonly MysqlSchemaExpectedColumn[];
  readonly indexes: readonly MysqlSchemaExpectedIndex[];
}

export interface MysqlContentSchemaTableValidation {
  readonly table: string;
  readonly passed: boolean;
  readonly errors: readonly string[];
}

export interface MysqlContentSchemaValidation {
  readonly passed: boolean;
  readonly tables: readonly MysqlContentSchemaTableValidation[];
}

/**
 * Extract the target contract from the same static DDL used for stage. This prevents
 * an existing but incomplete table from making COPY/VERIFY appear successful while
 * later worker upserts silently lose their natural-key idempotency.
 */
export function parseMysqlContentSchemaRequirements(
  sql = MYSQL_CONTENT_SCHEMA_SQL,
): readonly MysqlContentSchemaRequirement[] {
  return splitMysqlSchemaStatements(sql).map((statement) => {
    const lines = statement.split(/\r?\n/).map((line) => line.trim().replace(/,$/, ""));
    const tableMatch = /^CREATE TABLE IF NOT EXISTS ([a-z_][a-z0-9_]*) \($/.exec(lines[0] ?? "");
    if (!tableMatch) throw new Error("Unable to parse a MySQL content-schema table name.");

    const columns: MysqlSchemaExpectedColumn[] = [];
    const indexes: MysqlSchemaExpectedIndex[] = [];
    for (const line of lines.slice(1)) {
      const column = /^([a-z_][a-z0-9_]*)\s+([A-Z]+)/.exec(line);
      if (column) {
        columns.push({ name: column[1]!, dataType: column[2]!.toLowerCase() });
        continue;
      }
      const primary = /^PRIMARY KEY \((.+)\)$/.exec(line);
      if (primary) {
        indexes.push({ name: "PRIMARY", columns: parseMysqlIndexColumns(primary[1]!), unique: true, indexType: "BTREE" });
        continue;
      }
      const unique = /^UNIQUE KEY ([a-z_][a-z0-9_]*) \((.+)\)$/.exec(line);
      if (unique) {
        indexes.push({ name: unique[1]!, columns: parseMysqlIndexColumns(unique[2]!), unique: true, indexType: "BTREE" });
        continue;
      }
      const fulltext = /^FULLTEXT KEY ([a-z_][a-z0-9_]*) \((.+)\)$/.exec(line);
      if (fulltext) {
        indexes.push({ name: fulltext[1]!, columns: parseMysqlIndexColumns(fulltext[2]!), unique: false, indexType: "FULLTEXT" });
        continue;
      }
      const index = /^KEY ([a-z_][a-z0-9_]*) \((.+)\)$/.exec(line);
      if (index) {
        indexes.push({ name: index[1]!, columns: parseMysqlIndexColumns(index[2]!), unique: false, indexType: "BTREE" });
      }
    }
    if (columns.length === 0 || indexes.length === 0) {
      throw new Error(`Unable to parse required columns or indexes for ${tableMatch[1]}.`);
    }
    return { table: tableMatch[1]!, columns, indexes };
  });
}

function parseMysqlIndexColumns(value: string): readonly string[] {
  const columns = value.split(",").map((part) => {
    const match = /^`?([a-z_][a-z0-9_]*)/i.exec(part.trim());
    if (!match) throw new Error(`Unable to parse MySQL index column: ${part}.`);
    return match[1]!.toLowerCase();
  });
  if (columns.length === 0) throw new Error("MySQL index must have at least one column.");
  return columns;
}

export const MYSQL_CONTENT_SCHEMA_REQUIREMENTS = parseMysqlContentSchemaRequirements();

function requirementsFor(manifests: readonly TableManifest[]): readonly MysqlContentSchemaRequirement[] {
  const byTable = new Map(MYSQL_CONTENT_SCHEMA_REQUIREMENTS.map((requirement) => [requirement.table, requirement]));
  return manifests.map((manifest) => {
    const requirement = byTable.get(manifest.table);
    if (!requirement) throw new Error(`No MySQL schema requirement exists for ${manifest.table}.`);
    return requirement;
  });
}

function schemaValue(row: Readonly<Record<string, unknown>>, name: string): string {
  const value = row[name];
  return typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
}

function schemaNumber(row: Readonly<Record<string, unknown>>, name: string): number | null {
  const value = Number(row[name]);
  return Number.isSafeInteger(value) ? value : null;
}

/** Pure evaluator kept separate from live INFORMATION_SCHEMA access for contract tests. */
export function evaluateMysqlContentSchema(options: {
  readonly manifests: readonly TableManifest[];
  readonly tables: readonly Record<string, unknown>[];
  readonly columns: readonly Record<string, unknown>[];
  readonly indexes: readonly Record<string, unknown>[];
}): MysqlContentSchemaValidation {
  const tableRows = new Map(options.tables.map((row) => [schemaValue(row, "table_name"), row]));
  const columnRows = new Map<string, Readonly<Record<string, unknown>>>();
  for (const row of options.columns) {
    columnRows.set(`${schemaValue(row, "table_name")}.${schemaValue(row, "column_name")}`, row);
  }
  const indexRows = new Map<string, Readonly<Record<string, unknown>>[]>();
  for (const row of options.indexes) {
    const key = `${schemaValue(row, "table_name")}.${schemaValue(row, "index_name")}`;
    const existing = indexRows.get(key) ?? [];
    indexRows.set(key, [...existing, row]);
  }

  const tables = requirementsFor(options.manifests).map((requirement) => {
    const errors: string[] = [];
    const table = tableRows.get(requirement.table);
    if (!table) {
      errors.push("missing table");
    } else {
      if (schemaValue(table, "engine").toLowerCase() !== "innodb") errors.push("engine must be InnoDB");
      if (!schemaValue(table, "table_collation").toLowerCase().startsWith("utf8mb4_")) {
        errors.push("table collation must use utf8mb4");
      }
    }
    for (const expected of requirement.columns) {
      const actual = columnRows.get(`${requirement.table}.${expected.name}`);
      if (!actual) errors.push(`missing column ${expected.name}`);
      else if (schemaValue(actual, "data_type").toLowerCase() !== expected.dataType) {
        errors.push(`column ${expected.name} must use ${expected.dataType}`);
      }
    }
    for (const expected of requirement.indexes) {
      const actual = [...(indexRows.get(`${requirement.table}.${expected.name}`) ?? [])]
        .sort((left, right) => (schemaNumber(left, "seq_in_index") ?? 0) - (schemaNumber(right, "seq_in_index") ?? 0));
      if (actual.length === 0) {
        errors.push(`missing index ${expected.name}`);
        continue;
      }
      const actualColumns = actual.map((row) => schemaValue(row, "column_name").toLowerCase());
      const actualUnique = schemaNumber(actual[0]!, "non_unique") === 0;
      const actualType = schemaValue(actual[0]!, "index_type").toUpperCase();
      if (actualUnique !== expected.unique) errors.push(`index ${expected.name} unique flag differs`);
      if (actualType !== expected.indexType) errors.push(`index ${expected.name} must use ${expected.indexType}`);
      if (actualColumns.join(",") !== expected.columns.join(",")) {
        errors.push(`index ${expected.name} columns differ`);
      }
    }
    return { table: requirement.table, passed: errors.length === 0, errors };
  });
  return { passed: tables.every((table) => table.passed), tables };
}

async function schemaQuery(
  executor: MysqlMigrationExecutor,
  statement: string,
  values: readonly unknown[],
): Promise<readonly Record<string, unknown>[]> {
  const result = await executor.execute(statement, values);
  if (!Array.isArray(result)) throw new Error("MySQL INFORMATION_SCHEMA query did not return rows.");
  return result;
}

/** Verify table shape and index semantics before COPY/VERIFY can declare migration success. */
export async function validateMysqlContentSchema(options: {
  readonly executor: MysqlMigrationExecutor;
  readonly target: MySqlConnectionConfig;
  readonly manifests: readonly TableManifest[];
}): Promise<MysqlContentSchemaValidation> {
  const requirements = requirementsFor(options.manifests);
  const placeholders = requirements.map(() => "?").join(", ");
  const values = [options.target.database, ...requirements.map((requirement) => requirement.table)];
  const [tables, columns, indexes] = await Promise.all([
    schemaQuery(
      options.executor,
      `SELECT table_name, engine, table_collation FROM information_schema.tables WHERE table_schema = ? AND table_name IN (${placeholders})`,
      values,
    ),
    schemaQuery(
      options.executor,
      `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = ? AND table_name IN (${placeholders})`,
      values,
    ),
    schemaQuery(
      options.executor,
      `SELECT table_name, index_name, non_unique, seq_in_index, column_name, index_type FROM information_schema.statistics WHERE table_schema = ? AND table_name IN (${placeholders})`,
      values,
    ),
  ]);
  return evaluateMysqlContentSchema({ manifests: options.manifests, tables, columns, indexes });
}

function schemaValidationError(validation: MysqlContentSchemaValidation): Error {
  const failures = validation.tables
    .filter((table) => !table.passed)
    .map((table) => `${table.table} (${table.errors.join("; ")})`)
    .join(", ");
  return new Error(`MySQL target schema does not satisfy the content contract: ${failures}.`);
}

export async function stageMysqlContentSchema(executor: MysqlMigrationExecutor): Promise<readonly string[]> {
  const statements = splitMysqlSchemaStatements();
  for (const statement of statements) await executor.execute(statement, []);
  return statements.map((statement) => statement.slice(0, statement.indexOf("(")).trim());
}

export async function readAllMysqlContentRows(options: {
  readonly executor: MysqlMigrationExecutor;
  readonly manifest: TableManifest;
}): Promise<Row[]> {
  const columns = options.manifest.copyFields.map(quoteIdentifier).join(", ");
  const statement = [
    `SELECT ${columns} FROM ${quoteIdentifier(options.manifest.table)}`,
    `ORDER BY ${quoteIdentifier(options.manifest.conflictKey)} ASC`,
  ].join(" ");
  const result = await options.executor.execute(statement, []);
  if (!Array.isArray(result)) throw new Error(`MySQL read public.${options.manifest.table} did not return rows.`);
  return result.map((row) => projectPortableRow(options.manifest, row));
}

function parseMysqlJson(value: unknown, field: string): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`MySQL ${field} contained invalid JSON.`);
  }
}

/** Normalize provider-specific JSON, timestamp, boolean, and string forms before hashing. */
export function normalizeMysqlComparableRow(manifest: TableManifest, row: Row): Row {
  const portable = projectPortableRow(manifest, row);
  const contract = getContentTableContract(manifest.table as Parameters<typeof getContentTableContract>[0]);
  const normalized: Row = {};
  for (const field of manifest.copyFields) {
    const value = portable[field];
    if (contract.jsonColumns.includes(field)) {
      normalized[field] = sanitizeJsonForStorage(parseMysqlJson(value, `${manifest.table}.${field}`));
    } else if (contract.timestampColumns.includes(field)) {
      if (value === null) normalized[field] = null;
      else {
        const timestamp = fromMysqlUtcDateTime(value);
        if (!timestamp) throw new Error(`MySQL ${manifest.table}.${field} contained an invalid timestamp.`);
        normalized[field] = timestamp;
      }
    } else if (typeof value === "boolean" && contract.booleanColumns?.includes(field)) {
      normalized[field] = value;
    } else if (contract.booleanColumns?.includes(field)) {
      normalized[field] = value === 1 || value === "1" || value === true;
    } else if (typeof value === "string") {
      normalized[field] = sanitizeTextForStorage(value);
    } else if (typeof value === "bigint") {
      normalized[field] = value.toString();
    } else {
      normalized[field] = value;
    }
  }
  return normalized;
}

export function verifyMysqlContentTable(options: {
  readonly manifest: TableManifest;
  readonly sourceRows: readonly Row[];
  readonly targetRows: readonly Row[];
}): MysqlTableVerification {
  const sourceRows = options.sourceRows.map((row) => normalizeMysqlComparableRow(options.manifest, row));
  const targetRows = options.targetRows.map((row) => normalizeMysqlComparableRow(options.manifest, row));
  const sourceHash = stableTableHash(options.manifest, sourceRows);
  const targetHash = stableTableHash(options.manifest, targetRows);
  return {
    table: options.manifest.table,
    conflictKey: options.manifest.conflictKey,
    sourceCount: sourceRows.length,
    targetCount: targetRows.length,
    sourceHash,
    targetHash,
    passed: sourceRows.length === targetRows.length && sourceHash === targetHash,
  };
}

function phasesFor(phase: ContentMysqlMigrationPhase): readonly Exclude<ContentMysqlMigrationPhase, "all">[] {
  return phase === "all" ? ["preflight", "stage", "copy", "verify"] : [phase];
}

function assertWriteGates(phases: readonly Exclude<ContentMysqlMigrationPhase, "all">[], execute: boolean, writersPaused: boolean): void {
  const writes = phases.some((phase) => phase === "stage" || phase === "copy");
  if (writes && !execute) throw new Error("Stage/copy writes to MySQL. Re-run with --execute after reviewing preflight.");
  if (phases.includes("copy") && !writersPaused) {
    throw new Error("Copy phase requires --writers-paused to confirm all source and target content writers are paused.");
  }
}

function preflightReport(source: SupabaseContentSource, target: MySqlConnectionConfig): Record<string, unknown> {
  return {
    scope: {
      tables: CONTENT_TABLES.map((manifest) => ({
        table: manifest.table,
        conflictKey: manifest.conflictKey,
        copyFields: manifest.copyFields,
      })),
      excluded: ["Supabase Storage", "Auth", "RLS", "Edge Functions", "Realtime", "browser anon credentials"],
    },
    source: { provider: "supabase", url: source.url, schema: source.schema, serviceRoleConfigured: true },
    target: {
      provider: "mysql",
      host: target.host,
      port: target.port,
      database: target.database,
      user: target.user,
      ssl: target.ssl,
      passwordConfigured: true,
    },
  };
}

export async function runSupabaseToMysqlContentMigration(options: {
  readonly source: SupabaseContentSource;
  readonly target: MySqlConnectionConfig;
  readonly phase: ContentMysqlMigrationPhase;
  readonly execute: boolean;
  readonly writersPaused?: boolean;
  readonly fetch: FetchLike;
  readonly mysqlExecutor?: MysqlMigrationExecutor;
  readonly openMysqlExecutor?: (target: MySqlConnectionConfig) => Promise<MysqlMigrationHandle>;
  readonly manifests?: readonly TableManifest[];
  readonly pageSize?: number;
  readonly batchSize?: number;
  readonly reportPhase?: (phase: Exclude<ContentMysqlMigrationPhase, "all">, report: unknown) => Promise<void> | void;
}): Promise<MysqlMigrationRunReport> {
  const phases = phasesFor(options.phase);
  assertWriteGates(phases, options.execute, Boolean(options.writersPaused));
  const manifests = options.manifests ?? CONTENT_TABLES;
  const reports: Record<string, unknown> = {};
  const needsMysql = phases.some((phase) => phase === "stage" || phase === "copy" || phase === "verify");
  const handle =
    needsMysql && !options.mysqlExecutor
      ? await (options.openMysqlExecutor ?? openMysqlMigrationExecutor)(options.target)
      : null;
  const executor = options.mysqlExecutor ?? handle?.executor;

  try {
    for (const phase of phases) {
      if (phase === "preflight") {
        reports.preflight = preflightReport(options.source, options.target);
      } else if (phase === "stage") {
        if (!executor) throw new Error("MySQL executor is required for schema stage.");
        const appliedStatements = await stageMysqlContentSchema(executor);
        const schema = await validateMysqlContentSchema({ executor, target: options.target, manifests });
        reports.stage = { appliedStatements, schema };
        await options.reportPhase?.(phase, reports.stage);
        if (!schema.passed) throw schemaValidationError(schema);
        continue;
      } else if (phase === "copy") {
        if (!executor) throw new Error("MySQL executor is required for copy.");
        const schema = await validateMysqlContentSchema({ executor, target: options.target, manifests });
        if (!schema.passed) {
          reports.copy = { schema, tables: [] };
          await options.reportPhase?.(phase, reports.copy);
          throw schemaValidationError(schema);
        }
        const tables: MysqlTableCopyReport[] = [];
        for (const manifest of manifests) {
          const rows = await readAllSupabaseContentRows({
            source: options.source,
            manifest,
            fetch: options.fetch,
            pageSize: options.pageSize,
          });
          const upsertedRows = await upsertMysqlContentRows({
            executor,
            manifest,
            rows,
            batchSize: options.batchSize,
          });
          tables.push({ table: manifest.table, sourceRows: rows.length, upsertedRows });
        }
        reports.copy = { schema, tables };
      } else {
        if (!executor) throw new Error("MySQL executor is required for verification.");
        const schema = await validateMysqlContentSchema({ executor, target: options.target, manifests });
        if (!schema.passed) {
          reports.verify = { schema, tables: [], passed: false };
          await options.reportPhase?.(phase, reports.verify);
          throw schemaValidationError(schema);
        }
        const tables: MysqlTableVerification[] = [];
        for (const manifest of manifests) {
          const [sourceRows, targetRows] = await Promise.all([
            readAllSupabaseContentRows({ source: options.source, manifest, fetch: options.fetch, pageSize: options.pageSize }),
            readAllMysqlContentRows({ executor, manifest }),
          ]);
          tables.push(verifyMysqlContentTable({ manifest, sourceRows, targetRows }));
        }
        reports.verify = { schema, tables, passed: tables.every((table) => table.passed) };
        // 校验失败也必须落脱敏 artifact，供人工决定回滚或重跑；不能因为抛错丢掉证据。
        await options.reportPhase?.(phase, reports.verify);
        if (!tables.every((table) => table.passed)) {
          throw new Error(`Verification failed for: ${tables.filter((table) => !table.passed).map((table) => table.table).join(", ")}.`);
        }
        continue;
      }
      await options.reportPhase?.(phase, reports[phase]);
    }
    return { phases: reports };
  } finally {
    await handle?.close();
  }
}

/** Runtime mysql2 adapter; kept out of all pure migration tests. */
export async function openMysqlMigrationExecutor(target: MySqlConnectionConfig): Promise<MysqlMigrationHandle> {
  const moduleName = "mysql2/promise";
  let mysql: {
    createPool(options: {
      readonly host: string;
      readonly port: number;
      readonly database: string;
      readonly user: string;
      readonly password: string;
      readonly ssl?: Record<string, never>;
      readonly connectionLimit: number;
      readonly enableKeepAlive: boolean;
      readonly timezone: "Z";
    }): {
      execute(statement: string, values?: readonly unknown[]): Promise<readonly [unknown, unknown]>;
      end(): Promise<void>;
    };
  };
  try {
    mysql = (await import(moduleName)) as typeof mysql;
  } catch (error) {
    throw new Error(`MySQL migration requires mysql2: ${error instanceof Error ? error.message : String(error)}`);
  }
  const pool = mysql.createPool({
    ...target,
    ssl: target.ssl ? {} : undefined,
    connectionLimit: 5,
    enableKeepAlive: true,
    timezone: "Z",
  });
  return {
    executor: {
      async execute(statement, values = []) {
        const [raw] = await pool.execute(statement, values);
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        if (raw && typeof raw === "object") return raw as Record<string, unknown>;
        return {};
      },
    },
    close: async () => pool.end(),
  };
}