import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { parseCutoverArgs, runSupabaseCutover, updateEnvText } from "./supabase-cutover.ts";

test("cutover 只替换 Supabase 配置，保留无关环境变量与注释", () => {
  const updated = updateEnvText(
    "# existing\nOPENAI_API_KEY=keep\nSUPABASE_URL=https://old.example.com\nSUPABASE_SCHEMA=public\n",
    {
      SUPABASE_URL: "https://new.example.com",
      SUPABASE_SERVICE_ROLE_KEY: "new-service-key",
      SUPABASE_SCHEMA: "public",
      NEXT_PUBLIC_SUPABASE_URL: "https://new.example.com",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "new-anon-key",
    },
  );

  assert.match(updated, /^# existing/m);
  assert.match(updated, /^OPENAI_API_KEY=keep$/m);
  assert.match(updated, /^SUPABASE_URL=https:\/\/new\.example\.com$/m);
  assert.match(updated, /^SUPABASE_SERVICE_ROLE_KEY=new-service-key$/m);
  assert.match(updated, /^NEXT_PUBLIC_SUPABASE_ANON_KEY=new-anon-key$/m);
});

test("cutover 写入必须带 migration id 和显式确认", () => {
  const options = parseCutoverArgs([
    "--target-env",
    ".env.supabase-target",
    "--migration-id",
    "20260723-a",
    "--execute",
    "--confirm",
    "20260723-a",
  ]);
  assert.equal(options.execute, true);
  assert.equal(options.confirm, "20260723-a");
  assert.equal(options.activeEnvPaths.length, 0);
});
test("cutover 拒绝工作区外的 target 和 rollback 路径", async () => {
  const base = {
    activeEnvPaths: [".gitignore"],
    runtimeConfigPath: ".vitepress/public/supabase-runtime-config.json",
    artifactRoot: ".supabase-migration",
    migrationId: "20260723-a",
    execute: false,
    confirm: null,
  } as const;

  await assert.rejects(
    runSupabaseCutover({ ...base, targetEnvPath: "../outside.env", rollbackPath: null }),
    /target env must stay within the workspace/,
  );
  await assert.rejects(
    runSupabaseCutover({ ...base, targetEnvPath: "", rollbackPath: "../rollback" }),
    /rollback must stay within the workspace/,
  );
});
test("cutover 写入前必须有同一 migration id 的全量 verify 通过产物", async () => {
  await assert.rejects(
    runSupabaseCutover({
      targetEnvPath: "missing-target.env",
      activeEnvPaths: [".gitignore"],
      runtimeConfigPath: ".vitepress/public/supabase-runtime-config.json",
      artifactRoot: ".supabase-migration",
      migrationId: "20260723-needs-verify",
      execute: true,
      confirm: "20260723-needs-verify",
      rollbackPath: null,
    }),
    /requires a successful verification artifact/,
  );
});
test("显式 active env 不存在时不应静默跳过", async () => {
  await assert.rejects(
    runSupabaseCutover({
      targetEnvPath: ".env.supabase-target",
      activeEnvPaths: ["missing-active.env"],
      runtimeConfigPath: ".vitepress/public/supabase-runtime-config.json",
      artifactRoot: ".supabase-migration",
      migrationId: "20260723-missing-active",
      execute: false,
      confirm: null,
      rollbackPath: null,
    }),
    /Explicit active env file does not exist/,
  );
});
test("cutover 要求 target DB 地址并显式覆盖 Notion bucket", async () => {
  const ignoredRoot = resolve(".supabase-migration");
  await mkdir(ignoredRoot, { recursive: true });
  const artifactRoot = await mkdtemp(join(ignoredRoot, "cutover-test-"));
  const migrationId = "20260723-target-profile";
  const activeEnvPath = join(artifactRoot, "active.env");
  const targetEnvPath = join(artifactRoot, "target.env");
  const runtimeConfigPath = join(artifactRoot, "runtime.json");
  const options = {
    targetEnvPath,
    activeEnvPaths: [activeEnvPath],
    runtimeConfigPath,
    artifactRoot,
    migrationId,
    execute: false,
    confirm: null,
    rollbackPath: null,
  } as const;

  try {
    await writeFile(activeEnvPath, "SUPABASE_DB_URL=postgresql://old-db\nNOTION_STORAGE_BUCKET=old-bucket\n", "utf8");
    await writeFile(
      targetEnvPath,
      [
        "SUPABASE_URL=https://new.example.test",
        "SUPABASE_SERVICE_ROLE_KEY=new-service-key",
        "NEXT_PUBLIC_SUPABASE_URL=https://new.example.test",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=new-anon-key",
      ].join("\n"),
      "utf8",
    );
    await assert.rejects(runSupabaseCutover(options), /Target profile is missing SUPABASE_DB_URL/);

    await writeFile(
      targetEnvPath,
      `${await readFile(targetEnvPath, "utf8")}\nSUPABASE_DB_URL=postgresql://new-db.example.test/postgres\n`,
      "utf8",
    );
    const verifyDirectory = join(artifactRoot, migrationId);
    await mkdir(verifyDirectory, { recursive: true });
    await writeFile(
      join(verifyDirectory, "verify.json"),
      JSON.stringify({
        passed: true,
        tables: [
          "frontier_ecosystem_articles",
          "interview_questions",
          "glossary_terms",
          "news_items",
          "notion_articles",
        ].map((table) => ({ table, passed: true })),
        storage: { passed: true },
      }),
      "utf8",
    );

    const result = await runSupabaseCutover({ ...options, execute: true, confirm: migrationId });
    assert.equal(result.mode, "cutover");
    const activeEnv = await readFile(activeEnvPath, "utf8");
    assert.match(activeEnv, /^SUPABASE_DB_URL=postgresql:\/\/new-db\.example\.test\/postgres$/m);
    assert.match(activeEnv, /^NOTION_STORAGE_BUCKET=notion-assets$/m);
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
});