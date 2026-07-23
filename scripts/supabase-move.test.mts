import assert from "node:assert/strict";
import test from "node:test";

import { parseSupabaseMoveArgs, runSupabaseMove, SUPABASE_MOVE_ARTIFACT_ROOT } from "./supabase-move.ts";
import type { ProfilePair } from "./supabase-migrate/types.ts";

function profiles(): ProfilePair {
  return {
    source: {
      name: "source",
      url: "https://source.test",
      publicUrl: "https://source.test",
      serviceRoleKey: "source-service-secret",
      anonKey: "source-anon-secret",
      databaseUrl: "postgresql://source:secret@db.source.test/postgres",
      schema: "public",
      storageBucket: "notion-assets",
    },
    target: {
      name: "target",
      url: "https://target.test",
      publicUrl: "https://target.test",
      serviceRoleKey: "target-service-secret",
      anonKey: "target-anon-secret",
      databaseUrl: "postgresql://target:secret@db.target.test/postgres",
      schema: "public",
      storageBucket: "notion-assets",
    },
  };
}

test("move defaults to redacted preflight planning", async () => {
  const options = parseSupabaseMoveArgs([], new Date("2026-07-23T00:00:00.000Z"));
  assert.equal(options.execute, false);
  assert.equal(options.artifactRoot, SUPABASE_MOVE_ARTIFACT_ROOT);
  assert.equal(options.migrationId, "supabase-move-2026-07-23T00-00-00-000Z");

  const calls: string[] = [];
  const result = await runSupabaseMove(options, {
    loadProfilePair: async () => profiles(),
    runMigration: async (input) => {
      assert.equal(input.phase, "preflight");
      assert.equal(input.execute, false);
      await input.reportPhase?.("preflight", { source: { serviceRoleKey: "source-service-secret" } });
      return { phases: { preflight: { ok: true } } };
    },
    writeSafeArtifact: async (input) => {
      calls.push(`artifact:${input.phase}`);
      assert.deepEqual(input.knownSecrets, [
        "source-service-secret",
        "source-anon-secret",
        "postgresql://source:secret@db.source.test/postgres",
        "target-service-secret",
        "target-anon-secret",
        "postgresql://target:secret@db.target.test/postgres",
      ]);
      return `${input.artifactRoot}/${input.migrationId}/${input.phase}.json`;
    },
    runSupabaseCutover: async () => {
      calls.push("cutover");
      throw new Error("must not cut over a plan");
    },
  });

  assert.deepEqual(calls, ["artifact:preflight"]);
  assert.equal(result.mode, "plan");
  assert.deepEqual(result.completedPhases, ["preflight"]);
});

test("execute requires exact confirmation and a writer pause acknowledgement", () => {
  assert.throws(
    () => parseSupabaseMoveArgs(["--execute", "--migration-id", "move-1", "--confirm", "move-1"]),
    /requires --writers-paused/,
  );
  assert.throws(
    () =>
      parseSupabaseMoveArgs([
        "--execute",
        "--writers-paused",
        "--migration-id",
        "move-1",
        "--confirm",
        "different",
      ]),
    /exactly match/,
  );
});

test("move writes verification before cutover, forwards all cutover paths, and skips schema when requested", async () => {
  const options = parseSupabaseMoveArgs([
    "--execute",
    "--writers-paused",
    "--migration-id",
    "move-1",
    "--confirm",
    "move-1",
    "--skip-schema",
    "--active-env",
    ".env",
    "--active-env",
    "news-collector/.env",
  ]);
  const calls: string[] = [];

  const result = await runSupabaseMove(options, {
    loadProfilePair: async () => profiles(),
    createPsqlExecutor: () => {
      calls.push("psql-executor");
      return async () => undefined;
    },
    runMigration: async (input) => {
      assert.equal(input.phase, "all");
      assert.equal(input.execute, true);
      assert.equal(input.writersPaused, true);
      assert.equal(input.skipSchema, true);
      for (const phase of ["preflight", "copy", "verify"] as const) {
        const report = phase === "verify" ? { passed: true } : { phase };
        await input.reportPhase?.(phase, report);
      }
      return { phases: { preflight: {}, copy: {}, verify: { passed: true } } };
    },
    writeSafeArtifact: async (input) => {
      calls.push(`artifact:${input.phase}`);
      return `${input.artifactRoot}/${input.migrationId}/${input.phase}.json`;
    },
    runSupabaseCutover: async (input) => {
      calls.push("cutover");
      assert.deepEqual(calls, ["psql-executor", "artifact:preflight", "artifact:copy", "artifact:verify", "cutover"]);
      assert.equal(input.artifactRoot, ".supabase-migration");
      assert.deepEqual(input.activeEnvPaths, [".env", "news-collector/.env"]);
      assert.equal(input.execute, true);
      assert.equal(input.confirm, "move-1");
      return {
        mode: "cutover",
        migrationId: "move-1",
        activeEnvPaths: input.activeEnvPaths,
        publicOrigin: "https://target.test",
      };
    },
  });

  assert.equal(result.mode, "moved");
  assert.deepEqual(result.completedPhases, ["preflight", "copy", "verify"]);
});

test("a failed or missing verification cannot reach cutover", async () => {
  const options = parseSupabaseMoveArgs([
    "--execute",
    "--writers-paused",
    "--migration-id",
    "move-1",
    "--confirm",
    "move-1",
  ]);
  let cutoverCalled = false;

  await assert.rejects(
    () =>
      runSupabaseMove(options, {
        loadProfilePair: async () => profiles(),
        createPsqlExecutor: () => async () => undefined,
        runMigration: async (input) => {
          await input.reportPhase?.("verify", { passed: false });
          return { phases: { verify: { passed: false } } };
        },
        writeSafeArtifact: async (input) => `${input.artifactRoot}/${input.migrationId}/${input.phase}.json`,
        runSupabaseCutover: async () => {
          cutoverCalled = true;
          throw new Error("should not run");
        },
      }),
    /Verification did not pass/,
  );
  assert.equal(cutoverCalled, false);
});
