import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  resolvePublicSupabaseRuntimeConfig,
  writeSupabaseRuntimeConfig,
} from "./write-supabase-runtime-config.ts";

test("公开运行时配置只写入 URL、anon key 与 schema", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agent-build-runtime-config-"));
  const outputPath = join(dir, "supabase-runtime-config.json");
  try {
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

    assert.equal(result.status, "written");
    assert.equal(result.publicOrigin, "https://new-db.example.com");
    const payload = JSON.parse(await readFile(outputPath, "utf8")) as Record<string, unknown>;
    assert.deepEqual(payload, {
      version: 1,
      updatedAt: "2026-07-23T00:00:00.000Z",
      supabase: {
        url: "https://new-db.example.com",
        anonKey: "anon-only-key",
        schema: "public",
      },
    });
    assert.doesNotMatch(JSON.stringify(payload), /service-only-key/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("公开 anon key 不能误配为 service role", () => {
  assert.throws(
    () =>
      resolvePublicSupabaseRuntimeConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://new-db.example.com",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "same-secret",
        SUPABASE_SERVICE_ROLE_KEY: "same-secret",
      }),
    /不能等于/,
  );
});
