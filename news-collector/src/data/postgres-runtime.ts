import { createPostgresContentRepository } from "./postgres-content-repository.ts";
import type { ContentRepository } from "./content-repository.ts";
import type { PostgresConnectionConfig } from "./repository-config.ts";

export interface PostgresRepositoryHandle {
  readonly repository: ContentRepository;
  close(): Promise<void>;
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

/** Runtime boundary for the optional PostgreSQL driver used by workers. */
export async function openPostgresContentRepository(
  config: PostgresConnectionConfig,
): Promise<PostgresRepositoryHandle> {
  const moduleName = "pg";
  let pg: PgModule;
  try {
    pg = await import(moduleName) as unknown as PgModule;
  } catch (error) {
    throw new Error(
      `PostgreSQL content repository requires pg: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const pool = new pg.Pool({
    connectionString: config.url,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
    application_name: "agent-build-worker",
  });
  return {
    repository: createPostgresContentRepository({
      executor: {
        async query(statement, values) {
          const result = await pool.query(statement, values);
          return { rows: result.rows, rowCount: result.rowCount ?? 0 };
        },
      },
    }),
    close: async () => pool.end(),
  };
}
