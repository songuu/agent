import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_TABLES } from "../supabase-migrate/manifest.ts";
import { parseMysqlMigrationCliArgs } from "./mysql-cli.ts";
import {
  buildMysqlMigrationUpsertStatement,
  evaluateMysqlContentSchema,
  MYSQL_CONTENT_SCHEMA_REQUIREMENTS,
  normalizeMysqlComparableRow,
  parseMysqlMigrationTarget,
  parseSupabaseContentSource,
  runSupabaseToMysqlContentMigration,
  splitMysqlSchemaStatements,
  toMysqlMigrationValues,
  verifyMysqlContentTable,
  type MysqlMigrationExecutor,
} from "./mysql.ts";

const newsManifest = CONTENT_TABLES.find((manifest) => manifest.table === "news_items")!;
const source = {
  url: "https://source.supabase.test",
  serviceRoleKey: "source-secret",
  schema: "public" as const,
};
const target = {
  host: "mysql.internal",
  port: 3306,
  database: "agent_build",
  user: "migrator",
  password: "target-secret",
  ssl: true,
};

function sourceNewsRow() {
  return {
    external_id: "external-0001",
    source_key: "fixture",
    source_name: "Fixture",
    source_kind: "release",
    title: "Title with parameter-looking text ?; DROP TABLE news_items; --",
    url: "https://example.test/news/1",
    summary: "summary",
    content_text: "content",
    content_excerpt: "excerpt",
    content_status: "fetched",
    content_fetched_at: "2026-07-23T01:02:03.456Z",
    ecosystem_layer: "framework",
    ecosystem_layer_label: "Framework",
    tags: ["agent", "framework"],
    lang: "en",
    published_at: "2026-07-22T01:02:03.456Z",
    published_date: "2026-07-22",
    collected_at: "2026-07-23T01:02:03.456Z",
    collected_date: "2026-07-23",
    enriched: true,
    read_count: 7,
    metadata: { source: "fixture", nested: { ok: true } },
  };
}

function mysqlNewsRow() {
  return {
    ...sourceNewsRow(),
    content_fetched_at: "2026-07-23 01:02:03.456",
    published_at: "2026-07-22 01:02:03.456",
    collected_at: "2026-07-23 01:02:03.456",
    tags: '["agent","framework"]',
    enriched: 1,
    metadata: '{"source":"fixture","nested":{"ok":true}}',
  };
}

function response(rows: readonly Record<string, unknown>[], contentRange?: string) {
  const defaultRange = rows.length === 0 ? "*/0" : `0-${rows.length - 1}/${rows.length}`;
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-range" ? contentRange ?? defaultRange : null),
    },
    text: async () => JSON.stringify(rows),
  };
}

function validSchemaCatalog(manifests: readonly (typeof CONTENT_TABLES)[number][] = [newsManifest]) {
  const requirements = MYSQL_CONTENT_SCHEMA_REQUIREMENTS.filter((requirement) =>
    manifests.some((manifest) => manifest.table === requirement.table),
  );
  return {
    tables: requirements.map((requirement) => ({
      table_name: requirement.table,
      engine: "InnoDB",
      table_collation: "utf8mb4_unicode_ci",
    })),
    columns: requirements.flatMap((requirement) =>
      requirement.columns.map((column) => ({
        table_name: requirement.table,
        column_name: column.name,
        data_type: column.dataType,
      })),
    ),
    indexes: requirements.flatMap((requirement) =>
      requirement.indexes.flatMap((index) =>
        index.columns.map((column, position) => ({
          table_name: requirement.table,
          index_name: index.name,
          non_unique: index.unique ? 0 : 1,
          seq_in_index: position + 1,
          column_name: column,
          index_type: index.indexType,
        })),
      ),
    ),
  };
}

function schemaAwareExecutor(
  fallback: (statement: string, values?: readonly unknown[]) => Promise<readonly Record<string, unknown>[] | Readonly<Record<string, unknown>>>,
  manifests: readonly (typeof CONTENT_TABLES)[number][] = [newsManifest],
): MysqlMigrationExecutor {
  const catalog = validSchemaCatalog(manifests);
  return {
    async execute(statement, values) {
      if (statement.includes("information_schema.tables")) return catalog.tables;
      if (statement.includes("information_schema.columns")) return catalog.columns;
      if (statement.includes("information_schema.statistics")) return catalog.indexes;
      return fallback(statement, values);
    },
  };
}

test("parses one shared source/target config boundary without exposing target credentials", () => {
  assert.deepEqual(
    parseSupabaseContentSource({
      SUPABASE_URL: "https://source.supabase.test/",
      SUPABASE_SERVICE_ROLE_KEY: "source-secret",
    }),
    source,
  );
  assert.deepEqual(
    parseMysqlMigrationTarget({
      CONTENT_REPOSITORY_DRIVER: "mysql",
      CONTENT_MYSQL_URL: "mysql://migrator:target-secret@mysql.internal:3306/agent_build",
      CONTENT_MYSQL_SSL: "true",
    }),
    target,
  );
  assert.throws(
    () => parseMysqlMigrationTarget({ CONTENT_MYSQL_URL: "mysql://migrator:target-secret@mysql.internal:3306/agent_build" }),
    /CONTENT_REPOSITORY_DRIVER=mysql/,
  );
});

test("migration SQL keeps content values parameterized and schema staging has five statements", () => {
  const row = sourceNewsRow();
  const statement = buildMysqlMigrationUpsertStatement(newsManifest, 1);
  const values = toMysqlMigrationValues(newsManifest, row);

  assert.match(statement, /^INSERT INTO `news_items`/);
  assert.match(statement, /ON DUPLICATE KEY UPDATE/);
  assert.equal(statement.includes(row.title), false);
  assert.equal((statement.match(/\?/g) ?? []).length, newsManifest.copyFields.length);
  assert.equal(values.length, newsManifest.copyFields.length);
  assert.equal(values[4], row.title);
  assert.equal(splitMysqlSchemaStatements().length, 5);
});

test("verification canonicalizes MySQL JSON, UTC DATETIME, and booleans before hashing", () => {
  const result = verifyMysqlContentTable({
    manifest: newsManifest,
    sourceRows: [sourceNewsRow()],
    targetRows: [mysqlNewsRow()],
  });

  assert.equal(result.passed, true);
  assert.equal(result.sourceHash, result.targetHash);
  assert.deepEqual(
    normalizeMysqlComparableRow(newsManifest, mysqlNewsRow()),
    normalizeMysqlComparableRow(newsManifest, sourceNewsRow()),
  );
});

test("copy is gated by both execute and writer-pause confirmations", async () => {
  const noOpFetch = async () => response([]);
  const executor: MysqlMigrationExecutor = { async execute() { return []; } };
  await assert.rejects(
    () => runSupabaseToMysqlContentMigration({ source, target, phase: "copy", execute: false, fetch: noOpFetch, mysqlExecutor: executor }),
    /--execute/,
  );
  await assert.rejects(
    () => runSupabaseToMysqlContentMigration({ source, target, phase: "copy", execute: true, fetch: noOpFetch, mysqlExecutor: executor }),
    /--writers-paused/,
  );
});

test("copy reads a bounded source page and writes a prepared MySQL batch", async () => {
  const calls: Array<{ statement: string; values: readonly unknown[] | undefined }> = [];
  const executor = schemaAwareExecutor(async (statement, values) => {
    calls.push({ statement, values });
    return {};
  });
  const report = await runSupabaseToMysqlContentMigration({
    source,
    target,
    phase: "copy",
    execute: true,
    writersPaused: true,
    fetch: async () => response([sourceNewsRow()]),
    mysqlExecutor: executor,
    manifests: [newsManifest],
    pageSize: 2,
  });

  const copy = report.phases.copy as {
    schema: { passed: boolean };
    tables: Array<{ table: string; sourceRows: number; upsertedRows: number }>;
  };
  assert.equal(copy.schema.passed, true);
  assert.deepEqual(copy.tables, [{ table: "news_items", sourceRows: 1, upsertedRows: 1 }]);
  assert.equal(calls.length, 1);
  assert.match(calls[0]!.statement, /^INSERT INTO `news_items`/);
  assert.equal(calls[0]!.values?.includes(sourceNewsRow().title), true);
});

test("copy follows exact Content-Range despite a server page cap and fails closed without it", async () => {
  const cappedRows = ["external-0001", "external-0002", "external-0003"].map((externalId) => ({
    ...sourceNewsRow(),
    external_id: externalId,
  }));
  const executor = schemaAwareExecutor(async () => ({}));
  let fetchCalls = 0;
  const report = await runSupabaseToMysqlContentMigration({
    source,
    target,
    phase: "copy",
    execute: true,
    writersPaused: true,
    mysqlExecutor: executor,
    manifests: [newsManifest],
    pageSize: 500,
    fetch: async (_url, request) => {
      assert.equal(request?.headers?.Prefer, "count=exact");
      assert.equal(request?.headers?.Range, `${fetchCalls}-${fetchCalls + 499}`);
      const row = cappedRows[fetchCalls]!;
      fetchCalls += 1;
      return response([row], `${fetchCalls - 1}-${fetchCalls - 1}/${cappedRows.length}`);
    },
  });

  assert.equal(fetchCalls, 3);
  const copy = report.phases.copy as { tables: Array<{ sourceRows: number }> };
  assert.equal(copy.tables[0]?.sourceRows, 3);

  await assert.rejects(
    () =>
      runSupabaseToMysqlContentMigration({
        source,
        target,
        phase: "copy",
        execute: true,
        writersPaused: true,
        mysqlExecutor: executor,
        manifests: [newsManifest],
        fetch: async () => ({
          ok: true,
          status: 200,
          headers: { get: () => null },
          text: async () => JSON.stringify([sourceNewsRow()]),
        }),
      }),
    /did not return Content-Range with an exact total/,
  );
});

test("schema validation rejects an existing target table missing its natural-key index", () => {
  const catalog = validSchemaCatalog();
  const validation = evaluateMysqlContentSchema({
    manifests: [newsManifest],
    tables: catalog.tables,
    columns: catalog.columns,
    indexes: catalog.indexes.filter((index) => index.index_name !== "news_external_id_uq"),
  });

  assert.equal(validation.passed, false);
  assert.match(validation.tables[0]?.errors.join(" ") ?? "", /missing index news_external_id_uq/);
});

test("CLI defaults to read-only preflight and rejects unknown arguments", () => {
  const options = parseMysqlMigrationCliArgs([], new Date("2026-07-23T00:00:00.000Z"));
  assert.equal(options.phase, "preflight");
  assert.equal(options.execute, false);
  assert.match(options.migrationId, /^content-mysql-2026-07-23T00-00-00-000Z$/);
  assert.throws(() => parseMysqlMigrationCliArgs(["--bad"]), /Unknown argument/);
});

test("failed verification is still reported before the runner rejects", async () => {
  const reported: unknown[] = [];
  const executor = schemaAwareExecutor(async () => [{ ...mysqlNewsRow(), title: "different target title" }]);

  await assert.rejects(
    () =>
      runSupabaseToMysqlContentMigration({
        source,
        target,
        phase: "verify",
        execute: false,
        fetch: async () => response([sourceNewsRow()]),
        mysqlExecutor: executor,
        manifests: [newsManifest],
        pageSize: 2,
        reportPhase: (_phase, report) => {
          reported.push(report);
        },
      }),
    /Verification failed for: news_items/,
  );

  assert.equal(reported.length, 1);
  const verification = reported[0] as { tables: Array<{ table: string; passed: boolean }>; passed: boolean };
  assert.equal(verification.passed, false);
  assert.equal(verification.tables.length, 1);
  assert.equal(verification.tables[0]?.table, "news_items");
  assert.equal(verification.tables[0]?.passed, false);
});
