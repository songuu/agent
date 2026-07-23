import assert from "node:assert/strict";
import test from "node:test";

import { parseCliArgs } from "./cli.ts";
import { CONTENT_TABLES } from "./manifest.ts";
import { runMigration } from "./runner.ts";
import { createPsqlExecutor, stageTargetSchema } from "./schema.ts";
import { jsonResponse, portableRow, profile } from "./test-helpers.ts";
import { verifyTable } from "./verify.ts";

test("schema stage requires an injected DB executor and applies sorted existing migrations", async () => {
  const target = profile("target", "https://target.test", { databaseUrl: "postgresql://user:secret@db.test/db" });
  await assert.rejects(() => stageTargetSchema({ target }), /requires a database executor/);

  let received: { databaseUrl: string; migrationFiles: readonly string[] } | undefined;
  const result = await stageTargetSchema({
    target,
    migrationsDirectory: "fixture-migrations",
    readDirectory: async () => ["2027_b.sql", "ignore.txt", "2026_a.sql"],
    executor: async (request) => {
      received = request;
    },
  });
  assert.deepEqual(result.appliedMigrations, ["2026_a.sql", "2027_b.sql"]);
  assert.deepEqual(received?.migrationFiles.map((file) => file.replace(/\\/g, "/")).map((file) => file.split("/").pop()), [
    "2026_a.sql",
    "2027_b.sql",
  ]);
});

test("verification compares service data hash separately from an anon RLS count", async () => {
  const manifest = CONTENT_TABLES.find((table) => table.table === "notion_articles")!;
  const sourceRows = [
    { ...portableRow(manifest, "published-page"), status: "published" },
    { ...portableRow(manifest, "draft-page"), status: "draft" },
  ];
  let anonAuthorization = "";
  const report = await verifyTable({
    source: profile("source", "https://source.test"),
    target: profile("target", "https://target.test"),
    manifest,
    sourceRows,
    targetRows: [...sourceRows].reverse(),
    fetch: async (_url, init) => {
      anonAuthorization = init?.headers?.Authorization ?? "";
      return jsonResponse([], { headers: { "content-range": "0-0/1" } });
    },
  });
  assert.equal(anonAuthorization, "Bearer target-anon-secret");
  assert.equal(report.serviceRoleMatch, true);
  assert.equal(report.expectedAnonCount, 1);
  assert.equal(report.targetAnonCount, 1);
  assert.equal(report.anonReadMatch, true);
  assert.equal(report.passed, true);
});

test("runner rejects write phases until --execute is explicit", async () => {
  const source = profile("source", "https://source.test");
  const target = profile("target", "https://target.test");
  await assert.rejects(
    () =>
      runMigration({
        profiles: { source, target },
        phase: "copy",
        execute: false,
        fetch: async () => {
          throw new Error("network must not be called");
        },
      }),
    /Re-run with --execute/,
  );
});

test("CLI defaults to read-only preflight and accepts the one-click phase flags", () => {
  const defaultOptions = parseCliArgs([], new Date("2026-07-23T00:00:00.000Z"));
  assert.equal(defaultOptions.phase, "preflight");
  assert.equal(defaultOptions.execute, false);
  assert.match(defaultOptions.migrationId, /^supabase-2026-07-23T00-00-00-000Z$/);

  const all = parseCliArgs(
    ["--phase", "all", "--execute", "--writers-paused", "--source-env", "src.env", "--target-env", "dst.env", "--migration-id", "move-1"],
    new Date("2026-07-23T00:00:00.000Z"),
  );
  assert.deepEqual(all, {
    phase: "all",
    execute: true,
    writersPaused: true,
    sourceEnv: "src.env",
    targetEnv: "dst.env",
    migrationId: "move-1",
    artifactRoot: ".supabase-migration",
    skipSchema: false,
    help: false,
  });
});
