import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { writeSafeArtifact } from "./artifacts.ts";

test("migration artifacts redact credential-shaped fields and embedded known secrets", async () => {
  const root = await mkdtemp(join(process.cwd(), ".supabase-migrate-artifact-"));
  const secret = "credential-that-must-not-persist";
  try {
    const artifact = await writeSafeArtifact({
      artifactRoot: root,
      migrationId: "move-1",
      phase: "preflight",
      value: {
        serviceRoleKey: secret,
        nested: { databaseUrl: `postgresql://user:${secret}@db.test/postgres` },
        message: `operation failed near ${secret}`,
        count: 1,
      },
      knownSecrets: [secret],
    });
    const contents = await readFile(artifact, "utf8");
    assert.doesNotMatch(contents, new RegExp(secret));
    assert.match(contents, /\[redacted\]/);
    assert.match(contents, /"count": 1/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
