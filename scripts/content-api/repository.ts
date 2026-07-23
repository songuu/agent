import type { MySqlConnectionConfig } from "../../news-collector/src/data/repository-config.ts";
import { loadContentRepositoryConfig } from "../../news-collector/src/data/repository-config.ts";
import type { FetchLike, FetchRequest, FetchResponse } from "../supabase-migrate/types.ts";
import {
  contentTable,
  type ContentPage,
  type ContentReadRepository,
  type ContentReadRequest,
} from "./contract.ts";

export type ContentBackendConfig = SupabaseContentBackendConfig | MysqlContentBackendConfig;

export interface SupabaseContentBackendConfig {
  readonly driver: "supabase";
  readonly url: string;
  readonly serviceRoleKey: string;
  readonly schema: string;
}

export interface MysqlContentBackendConfig {
  readonly driver: "mysql";
  readonly mysql: MySqlConnectionConfig;
}

export interface MysqlQueryExecutor {
  execute(sql: string, values: readonly unknown[]): Promise<readonly Record<string, unknown>[]>;
  close?(): Promise<void>;
}

export interface ContentRepositoryHandle {
  readonly repository: ContentReadRepository;
  close(): Promise<void>;
}

export interface ContentRepositoryDependencies {
  readonly fetch?: FetchLike;
  readonly mysqlExecutor?: MysqlQueryExecutor;
  readonly openMysqlExecutor?: (mysql: MySqlConnectionConfig) => Promise<MysqlQueryExecutor>;
}

const nativeFetch: FetchLike = (input: string, init?: FetchRequest) =>
  globalThis.fetch(input, init as RequestInit) as unknown as Promise<FetchResponse>;

const MYSQL_JSON_FIELDS = new Set([
  "aliases",
  "detail_paragraphs",
  "metadata",
  "related_chapters",
  "tags",
]);

export function loadContentBackendConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): ContentBackendConfig | null {
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const hasMysqlSettings = [
    "CONTENT_MYSQL_URL",
    "CONTENT_MYSQL_HOST",
    "CONTENT_MYSQL_PORT",
    "CONTENT_MYSQL_DATABASE",
    "CONTENT_MYSQL_USER",
    "CONTENT_MYSQL_PASSWORD",
    "CONTENT_MYSQL_SSL",
  ].some((name) => env[name]?.trim());
  if (!env.CONTENT_REPOSITORY_DRIVER?.trim() && !supabaseUrl && !serviceRoleKey && !hasMysqlSettings) {
    return null;
  }

  const selected = loadContentRepositoryConfig(env as NodeJS.ProcessEnv);
  if (selected.driver === "mysql") return { driver: "mysql", mysql: selected.mysql };

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("CONTENT_REPOSITORY_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  const parsed = new URL(supabaseUrl);
  if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("SUPABASE_URL must be a credential-free http(s) URL.");
  }
  return {
    driver: "supabase",
    url: parsed.toString().replace(/\/+$/, ""),
    serviceRoleKey,
    schema: env.SUPABASE_SCHEMA?.trim() || "public",
  };
}

export async function openContentReadRepository(
  config: ContentBackendConfig,
  dependencies: ContentRepositoryDependencies = {},
): Promise<ContentRepositoryHandle> {
  if (config.driver === "supabase") {
    return {
      repository: createSupabaseContentReadRepository(config, dependencies.fetch ?? nativeFetch),
      close: async () => undefined,
    };
  }

  const executor = dependencies.mysqlExecutor ?? (await (dependencies.openMysqlExecutor ?? openMysql2Executor)(config.mysql));
  return {
    repository: createMysqlContentReadRepository(executor),
    close: async () => executor.close?.(),
  };
}

export function createSupabaseContentReadRepository(
  config: SupabaseContentBackendConfig,
  fetchImpl: FetchLike = nativeFetch,
): ContentReadRepository {
  const baseUrl = config.url.replace(/\/+$/, "");
  return {
    async read(request): Promise<ContentPage> {
      const search = new URLSearchParams();
      search.set("select", request.fields.join(","));
      for (const filter of request.filters) search.append(filter.field, `${filter.operator}.${filter.value}`);
      for (const sort of request.sort) search.append("order", `${sort.field}.${sort.direction}`);
      search.set("limit", String(request.limit));
      search.set("offset", String(request.offset));

      const response = await fetchImpl(`${baseUrl}/rest/v1/${contentTable(request.resource)}?${search.toString()}`, {
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Accept-Profile": config.schema,
          ...(request.includeTotal ? { Prefer: "count=exact" } : {}),
        },
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Supabase content read failed: HTTP ${response.status} ${detail.slice(0, 180)}`);
      }

      const rawPayload = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(rawPayload) as unknown;
      } catch {
        throw new Error("Supabase content read returned invalid JSON.");
      }
      if (!Array.isArray(payload)) throw new Error("Supabase content read returned a non-array payload.");
      const totalCount = request.includeTotal ? parseContentRangeTotal(response.headers.get("content-range")) : null;
      return {
        items: payload as Record<string, unknown>[],
        totalCount,
        hasMore:
          totalCount === null ? payload.length === request.limit : request.offset + payload.length < totalCount,
      };
    },
  };
}

export function createMysqlContentReadRepository(executor: MysqlQueryExecutor): ContentReadRepository {
  return {
    async read(request): Promise<ContentPage> {
      const table = contentTable(request.resource);
      const fields = request.fields.map(quoteIdentifier).join(", ");
      const where = request.filters.length
        ? ` WHERE ${request.filters.map((filter) => `${quoteIdentifier(filter.field)} = ?`).join(" AND ")}`
        : "";
      const filterValues = request.filters.map((filter) => filter.value);
      const order = request.sort.length
        ? ` ORDER BY ${request.sort.map((sort) => `${quoteIdentifier(sort.field)} ${sort.direction.toUpperCase()}`).join(", ")}`
        : "";
      const rows = await executor.execute(
        `SELECT ${fields} FROM ${quoteIdentifier(table)}${where}${order} LIMIT ? OFFSET ?`,
        [...filterValues, request.limit, request.offset],
      );

      const totalCount = request.includeTotal
        ? parseMysqlCount(
            await executor.execute(`SELECT COUNT(*) AS total_count FROM ${quoteIdentifier(table)}${where}`, filterValues),
          )
        : null;
      const items = rows.map(normalizeMysqlRow);
      return {
        items,
        totalCount,
        hasMore: totalCount === null ? items.length === request.limit : request.offset + items.length < totalCount,
      };
    },
  };
}

/**
 * The MySQL driver stays behind this runtime boundary so a Supabase-only deployment
 * does not need to load it. mysql2 is intentionally an explicit production dependency.
 */
export async function openMysql2Executor(mysqlConfig: MySqlConnectionConfig): Promise<MysqlQueryExecutor> {
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
      execute(sql: string, values: readonly unknown[]): Promise<[unknown, unknown]>;
      end(): Promise<void>;
    };
  };
  try {
    mysql = (await import(moduleName)) as typeof mysql;
  } catch (error) {
    throw new Error(
      `MySQL content adapter requires mysql2. Install it before setting CONTENT_REPOSITORY_DRIVER=mysql: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const pool = mysql.createPool({
    ...mysqlConfig,
    ssl: mysqlConfig.ssl ? {} : undefined,
    connectionLimit: 5,
    enableKeepAlive: true,
    timezone: "Z",
  });
  return {
    async execute(sql, values) {
      const [rows] = await pool.execute(sql, values);
      if (!Array.isArray(rows)) throw new Error("MySQL content query did not return rows.");
      return rows as Record<string, unknown>[];
    },
    close: async () => pool.end(),
  };
}

function quoteIdentifier(identifier: string): string {
  return `\`${identifier}\``;
}

function normalizeMysqlRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([field, value]) => [field, normalizeMysqlValue(field, value)]),
  );
}

function normalizeMysqlValue(field: string, value: unknown): unknown {
  if (value === null || value === undefined || !MYSQL_JSON_FIELDS.has(field) || typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`MySQL content field ${field} contained invalid JSON.`);
  }
}

function parseMysqlCount(rows: readonly Record<string, unknown>[]): number {
  const value = rows[0]?.total_count;
  const total = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(total) || total < 0) throw new Error("MySQL content count was invalid.");
  return total;
}

function parseContentRangeTotal(value: string | null): number | null {
  if (!value) return null;
  const match = /\/(\d+)$/.exec(value);
  if (!match) return null;
  const total = Number(match[1]);
  return Number.isSafeInteger(total) ? total : null;
}
