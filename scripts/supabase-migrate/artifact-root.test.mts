import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { writeSafeArtifact } from "./artifacts.ts";

test("artifact writer refuses a root outside the current repository", async () => {
  await assert.rejects(
    () =>
      writeSafeArtifact({
        artifactRoot: resolve(process.cwd(), "..", "outside-artifacts"),
        migrationId: "move-1",
        phase: "preflight",
        value: {},
        knownSecrets: [],
      }),
    /must stay inside the current repository directory/,
  );
});
