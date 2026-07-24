import {
  createPostgresContentRepository,
  type PostgresExecutor,
  type PostgresExecutionResult,
} from "../news-collector/src/data/postgres-content-repository.ts";
import { loadPostgresConnectionConfig } from "../news-collector/src/data/postgres-config.ts";
import type { PostgresConnectionConfig } from "../news-collector/src/data/repository-config.ts";
import type {
  InterviewQuestionRow,
  StoredCodefatherRow,
} from "./sync-codefather-interview-to-supabase.ts";

export interface CodefatherPostgresSyncResult {
  readonly storedRows: readonly StoredCodefatherRow[];
  readonly duplicatesDeleted: number;
  readonly writerCount: number;
  readonly readerCount: number;
}

export interface CodefatherPostgresSyncOptions {
  readonly rows?: readonly InterviewQuestionRow[];
  readonly findDuplicateSlugs: (rows: readonly StoredCodefatherRow[]) => readonly string[];
  readonly writer: PostgresExecutor;
  readonly reader: PostgresExecutor;
}

function countValue(result: PostgresExecutionResult, context: string): number {
  const value = result.rows[0]?.total_count;
  const count = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error(`${context} returned an invalid count.`);
  }
  return count;
}

async function readStoredRows(executor: PostgresExecutor): Promise<StoredCodefatherRow[]> {
  const result = await executor.query(
    [
      'SELECT "slug", "question", "collected_date", "sort_order", "metadata"',
      'FROM "interview_questions"',
      'WHERE "slug" LIKE $1',
      'ORDER BY "sort_order" ASC',
    ].join(" "),
    ["codefather-interview-%"],
  );
  return result.rows as StoredCodefatherRow[];
}

async function readCount(executor: PostgresExecutor): Promise<number> {
  return countValue(
    await executor.query(
      'SELECT COUNT(*) AS "total_count" FROM "interview_questions" WHERE "slug" LIKE $1',
      ["codefather-interview-%"],
    ),
    "Codefather PostgreSQL readback",
  );
}

/** Shared pure-I/O workflow; tests inject executors, production injects two least-privilege pools. */
export async function synchronizeCodefatherRowsWithPostgres(
  options: CodefatherPostgresSyncOptions,
): Promise<CodefatherPostgresSyncResult> {
  if (options.rows) {
    await createPostgresContentRepository({ executor: options.writer })
      .upsertTableRows("interview_questions", options.rows);
  }

  let storedRows = await readStoredRows(options.writer);
  const duplicates = [...options.findDuplicateSlugs(storedRows)];
  if (duplicates.length > 0) {
    await options.writer.query(
      'DELETE FROM "interview_questions" WHERE "slug" = ANY($1::text[])',
      [duplicates],
    );
    storedRows = await readStoredRows(options.writer);
  }

  const [writerCount, readerCount] = await Promise.all([
    readCount(options.writer),
    readCount(options.reader),
  ]);
  return {
    storedRows,
    duplicatesDeleted: duplicates.length,
    writerCount,
    readerCount,
  };
}

interface PgPool {
  query(statement: string, values?: readonly unknown[]): Promise<{
    readonly rows: readonly Record<string, unknown>[];
    readonly rowCount: number | null;
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

async function openExecutor(
  pg: PgModule,
  config: PostgresConnectionConfig,
  applicationName: string,
): Promise<{ readonly executor: PostgresExecutor; close(): Promise<void> }> {
  const pool = new pg.Pool({
    connectionString: config.url,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    max: 3,
    idleTimeoutMillis: 30_000,
    application_name: applicationName,
  });
  return {
    executor: {
      async query(statement, values) {
        const result = await pool.query(statement, values);
        return { rows: result.rows, rowCount: result.rowCount ?? 0 };
      },
    },
    close: async () => pool.end(),
  };
}

export async function synchronizeCodefatherRowsOnConfiguredPostgres(options: {
  readonly rows?: readonly InterviewQuestionRow[];
  readonly findDuplicateSlugs: (rows: readonly StoredCodefatherRow[]) => readonly string[];
  readonly env?: Readonly<Record<string, string | undefined>>;
}): Promise<CodefatherPostgresSyncResult> {
  const env = options.env ?? process.env;
  const moduleName = "pg";
  let pg: PgModule;
  try {
    pg = await import(moduleName) as unknown as PgModule;
  } catch (error) {
    throw new Error(
      `Codefather PostgreSQL store requires pg: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const writer = await openExecutor(
    pg,
    loadPostgresConnectionConfig(env, "write"),
    "agent-build-codefather-writer",
  );
  let reader: Awaited<ReturnType<typeof openExecutor>> | null = null;
  try {
    reader = await openExecutor(
      pg,
      loadPostgresConnectionConfig(env, "read"),
      "agent-build-codefather-reader",
    );
    return await synchronizeCodefatherRowsWithPostgres({
      rows: options.rows,
      findDuplicateSlugs: options.findDuplicateSlugs,
      writer: writer.executor,
      reader: reader.executor,
    });
  } finally {
    await reader?.close();
    await writer.close();
  }
}
