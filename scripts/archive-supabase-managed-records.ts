#!/usr/bin/env node

import { createHash } from "node:crypto";

const CONFIRMATION = "ARCHIVE_SUPABASE_MANAGED_RECORDS";
const SOURCE_SCHEMAS = ["auth", "storage"] as const;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function recordHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  if (!args.has("--execute") || !args.has("--confirm") || !args.has(CONFIRMATION)) {
    throw new Error(
      `Refusing to run. Use --execute --confirm ${CONFIRMATION}; the target migration_archive.supabase_records table must already exist.`,
    );
  }

  const pg = await import("pg");
  const source = new pg.Pool({
    connectionString: requiredEnv("SOURCE_POSTGRES_URL"),
    ssl: process.env.SOURCE_POSTGRES_SSL === "false" ? false : { rejectUnauthorized: true },
    max: 1,
    application_name: "agent-build-supabase-managed-archive-source",
  });
  const target = new pg.Pool({
    connectionString: requiredEnv("CONTENT_POSTGRES_WRITE_URL"),
    ssl: process.env.CONTENT_POSTGRES_SSL === "true" ? { rejectUnauthorized: true } : false,
    max: 1,
    application_name: "agent-build-supabase-managed-archive-target",
  });

  try {
    const tableResult = await source.query<{ table_schema: string; table_name: string }>(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_type = 'BASE TABLE'
         AND table_schema = ANY($1::text[])
         AND table_name <> 'schema_migrations'
       ORDER BY table_schema, table_name`,
      [SOURCE_SCHEMAS],
    );

    const targetClient = await target.connect();
    try {
      await targetClient.query("BEGIN");
      let total = 0;
      for (const { table_schema: schema, table_name: table } of tableResult.rows) {
        const rows = await source.query<{ source_row_id: string; record: unknown }>(
          `SELECT ctid::text AS source_row_id, to_jsonb(source_row) AS record
           FROM ${quoteIdentifier(schema)}.${quoteIdentifier(table)} AS source_row
           ORDER BY ctid`,
        );
        for (const row of rows.rows) {
          await targetClient.query(
            `INSERT INTO migration_archive.supabase_records
              (source_schema, source_table, source_row_id, record_hash, record)
             VALUES ($1, $2, $3, $4, $5::jsonb)
             ON CONFLICT (source_schema, source_table, source_row_id)
             DO UPDATE SET record_hash = EXCLUDED.record_hash, record = EXCLUDED.record, captured_at = now()`,
            [schema, table, row.source_row_id, recordHash(row.record), JSON.stringify(row.record)],
          );
        }
        total += rows.rowCount ?? rows.rows.length;
        console.log(`${schema}.${table}=${rows.rowCount ?? rows.rows.length}`);
      }
      await targetClient.query("COMMIT");
      console.log(`ARCHIVED_TABLES=${tableResult.rowCount ?? tableResult.rows.length}`);
      console.log(`ARCHIVED_RECORDS=${total}`);
    } catch (error) {
      await targetClient.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      targetClient.release();
    }
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
