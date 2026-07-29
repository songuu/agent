import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  resolvePublicSupabaseRuntimeConfig,
  writeSupabaseRuntimeConfig,
} from "./write-supabase-runtime-config.ts";

test("Supabase public env is ignored and stale runtime config is removed", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agent-build-runtime-config-"));
  const outputPath = join(dir, "supabase-runtime-config.json");
  try {
    await writeFile(outputPath, JSON.stringify({ version: 1, supabase: { url: "https://old.example" } }), "utf8");
    const result = await writeSupabaseRuntimeConfig({
      outputPath,
      now: new Date("2026-07-23T00:00:00.000Z"),
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://new-db.example.com/",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-only-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-only-key",
        SUPABASE_SCHEMA: "public",
      },
    });

    assert.equal(result.status, "absent");
    assert.equal(result.publicOrigin, null);
    await assert.rejects(readFile(outputPath, "utf8"), /ENOENT/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Content API-only runtime config does not leak or depend on Supabase", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agent-build-content-api-runtime-config-"));
  const outputPath = join(dir, "supabase-runtime-config.json");
  try {
    const result = await writeSupabaseRuntimeConfig({
      outputPath,
      now: new Date("2026-07-23T00:00:00.000Z"),
      env: {
        NEXT_PUBLIC_CONTENT_API_BASE_URL: "/agent-build/api/content/v1/",
        NEXT_PUBLIC_SUPABASE_URL: "https://ignored.example.com/",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "ignored-anon-key",
      },
    });
    assert.equal(result.status, "written");
    assert.equal(result.publicOrigin, null);
    assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), {
      version: 1,
      updatedAt: "2026-07-23T00:00:00.000Z",
      contentApi: { baseUrl: "/agent-build/api/content/v1" },
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Content API public URL must be a same-origin absolute path", () => {
  assert.throws(
    () => resolvePublicSupabaseRuntimeConfig({ NEXT_PUBLIC_CONTENT_API_BASE_URL: "https://elsewhere.example/api" }),
    /同源绝对路径/,
  );
});
