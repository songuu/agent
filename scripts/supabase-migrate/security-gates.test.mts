import assert from "node:assert/strict";
import test from "node:test";

import { runMigration } from "./runner.ts";
import { createPsqlExecutor } from "./schema.ts";
import { profile } from "./test-helpers.ts";

test("psql executor injects PGDATABASE through child env, never command arguments", async () => {
  const databaseUrl = "postgresql://migration-user:very-secret@db.target.test/postgres";
  let received:
    | { readonly command: string; readonly args: readonly string[]; readonly options: { readonly env: NodeJS.ProcessEnv } }
    | undefined;
  const executor = createPsqlExecutor(async (command, args, options) => {
    received = { command, args, options };
    return 0;
  });

  await executor({ databaseUrl, migrationFiles: ["20260723000100_schema.sql"] });
  assert.equal(received?.command, "psql");
  assert.deepEqual(received?.args, ["--set", "ON_ERROR_STOP=1", "--single-transaction", "--file", "20260723000100_schema.sql"]);
  assert.equal(received?.options.env.PGDATABASE, databaseUrl);
  assert.doesNotMatch((received?.args ?? []).join(" "), /very-secret|postgresql/);
});

test("copy remains blocked after --execute until writers-paused is explicitly confirmed", async () => {
  const source = profile("source", "https://source.test");
  const target = profile("target", "https://target.test");
  await assert.rejects(
    () =>
      runMigration({
        profiles: { source, target },
        phase: "copy",
        execute: true,
        writersPaused: false,
        fetch: async () => {
          throw new Error("network must not be called");
        },
      }),
    /requires --writers-paused/,
  );
});
