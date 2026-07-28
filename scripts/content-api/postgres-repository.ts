import type { PostgresConnectionConfig } from "../../news-collector/src/data/repository-config.ts";
import { isPublicAssetContentType, type ContentAsset, type ContentAssetReadRepository, type ContentAssetRequest } from "./assets.ts";
import {
  contentTable,
  type ContentPage,
  type ContentReadRepository,
} from "./contract.ts";

export interface PostgresQueryExecutor {
  execute(sql: string, values: readonly unknown[]): Promise<readonly Record<string, unknown>[]>;
  close?(): Promise<void>;
}

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function parseCount(rows: readonly Record<string, unknown>[]): number {
  const value = rows[0]?.total_count;
  const total = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(total) || total < 0) throw new Error("PostgreSQL content count was invalid.");
  return total;
}

export function createPostgresContentReadRepository(
  executor: PostgresQueryExecutor,
): ContentReadRepository {
  return {
    async read(request): Promise<ContentPage> {
      const table = contentTable(request.resource);
      const fields = request.fields.map(quoteIdentifier).join(", ");
      const filterValues = request.filters.map((filter) => filter.value);
      const where = request.filters.length
        ? ` WHERE ${request.filters.map((filter, index) =>
          `${quoteIdentifier(filter.field)} = $${index + 1}`
        ).join(" AND ")}`
        : "";
      const order = request.sort.length
        ? ` ORDER BY ${request.sort.map((sort) =>
          `${quoteIdentifier(sort.field)} ${sort.direction.toUpperCase()}`
        ).join(", ")}`
        : "";
      const limitPosition = filterValues.length + 1;
      const rows = await executor.execute(
        `SELECT ${fields} FROM ${quoteIdentifier(table)}${where}${order} LIMIT $${limitPosition} OFFSET $${limitPosition + 1}`,
        [...filterValues, request.limit, request.offset],
      );
      const totalCount = request.includeTotal
        ? parseCount(
          await executor.execute(
            `SELECT COUNT(*) AS total_count FROM ${quoteIdentifier(table)}${where}`,
            filterValues,
          ),
        )
        : null;
      return {
        items: rows,
        totalCount,
        hasMore: totalCount === null
          ? rows.length === request.limit
          : request.offset + rows.length < totalCount,
      };
    },
  };
}

/**
 * Asset reads use parameter binding and a fixed public bucket from the request
 * parser. The database never receives arbitrary identifiers from a URL.
 */
export function createPostgresContentAssetReadRepository(
  executor: PostgresQueryExecutor,
): ContentAssetReadRepository {
  return {
    async readAsset(request: ContentAssetRequest): Promise<ContentAsset | null> {
      const rows = await executor.execute(
        [
          'SELECT "content_type", "data"',
          'FROM "content_assets"',
          'WHERE "bucket" = $1 AND "object_key" = $2',
          'LIMIT 1',
        ].join(" "),
        [request.bucket, request.objectKey],
      );
      const row = rows[0];
      if (!row) return null;
      const contentType = row.content_type;
      if (!isPublicAssetContentType(contentType)) {
        throw new Error("PostgreSQL asset has an unsupported content type.");
      }
      const value = row.data;
      if (!(value instanceof Uint8Array)) {
        throw new Error("PostgreSQL asset payload was not binary.");
      }
      return { contentType, bytes: value };
    },
  };
}

interface PgPool {
  query(sql: string, values?: readonly unknown[]): Promise<{
    readonly rows: readonly Record<string, unknown>[];
  }>;
  end(): Promise<void>;
}

interface PgModule {
  Pool: new (options: {
    readonly connectionString: string;
    readonly ssl?: { readonly rejectUnauthorized: true };
    readonly max: number;
    readonly idleTimeoutMillis: number;
    readonly application_name: string;
  }) => PgPool;
}

/** Runtime driver boundary for the read-only Content API process. */
export async function openPgExecutor(
  config: PostgresConnectionConfig,
): Promise<PostgresQueryExecutor> {
  const moduleName = "pg";
  let pg: PgModule;
  try {
    pg = await import(moduleName) as unknown as PgModule;
  } catch (error) {
    throw new Error(
      `PostgreSQL content adapter requires pg: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const pool = new pg.Pool({
    connectionString: config.url,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
    application_name: "agent-build-content-api",
  });
  return {
    async execute(sql, values) {
      return (await pool.query(sql, values)).rows;
    },
    close: async () => pool.end(),
  };
}
