import {
  getContentTableContract,
} from "./content-table-contracts.ts";
import {
  createPostgresContentRepository,
} from "./postgres-content-repository.ts";
import { loadContentRepositoryConfig } from "./repository-config.ts";

interface PgClient {
  connect(): Promise<void>;
  query(statement: string, values?: readonly unknown[]): Promise<{
    readonly rows: readonly Record<string, unknown>[];
    readonly rowCount: number | null;
  }>;
  end(): Promise<void>;
}

interface PgModule {
  Client: new (options: {
    readonly connectionString: string;
    readonly ssl?: { readonly rejectUnauthorized: true };
    readonly application_name: string;
  }) => PgClient;
}

const config = loadContentRepositoryConfig();
if (config.driver !== "postgres") {
  throw new Error("PostgreSQL writer smoke requires CONTENT_REPOSITORY_DRIVER=postgres.");
}

const moduleName = "pg";
const pg = await import(moduleName) as unknown as PgModule;
const client = new pg.Client({
  connectionString: config.postgres.url,
  ssl: config.postgres.ssl ? { rejectUnauthorized: true } : undefined,
  application_name: "agent-build-writer-smoke",
});
await client.connect();

let rolledBack = false;
try {
  const contract = getContentTableContract("news_items");
  const fields = contract.columns.map((field) => `"${field}"`).join(", ");
  await client.query("BEGIN");
  const selected = await client.query(
    `SELECT ${fields} FROM "news_items" ORDER BY "external_id" ASC LIMIT 1`,
  );
  const row = selected.rows[0];
  if (!row) throw new Error("Writer smoke requires at least one news row.");

  const repository = createPostgresContentRepository({
    executor: {
      async query(statement, values) {
        const result = await client.query(statement, values);
        return { rows: result.rows, rowCount: result.rowCount ?? 0 };
      },
    },
  });
  const result = await repository.upsertTableRows("news_items", [row]);
  await client.query("ROLLBACK");
  rolledBack = true;
  process.stdout.write(`${JSON.stringify({
    provider: repository.provider,
    attempted: result.attempted,
    pushed: result.pushed,
    tableCount: result.tableCount,
    transaction: "rolled_back",
  })}\n`);
} finally {
  if (!rolledBack) await client.query("ROLLBACK").catch(() => undefined);
  await client.end();
}
