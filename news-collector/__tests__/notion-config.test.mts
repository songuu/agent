import assert from "node:assert/strict";
import { test } from "node:test";
import { loadNotionConfig } from "../src/notion/config.ts";

const PG_ENV = {
  NOTION_TOKEN: "ntn_test",
  CONTENT_REPOSITORY_DRIVER: "postgres",
  CONTENT_POSTGRES_WRITE_URL: "postgresql://collector:private-password@127.0.0.1:5432/agent_build",
  CONTENT_POSTGRES_SSL: "false",
  NEXT_PUBLIC_CONTENT_API_BASE_URL: "/agent-build/api/content/v1",
};

test("missing NOTION_TOKEN forces dryRun", () => {
  const config = loadNotionConfig({ ...PG_ENV, NOTION_TOKEN: "" });
  assert.equal(config.dryRun, true);
  assert.equal(config.token, null);
});

test("missing PostgreSQL configuration forces dryRun even with a token", () => {
  const config = loadNotionConfig({ NOTION_TOKEN: "ntn_test" });
  assert.equal(config.dryRun, true);
  assert.equal(config.contentRepository.driver, "supabase");
});

test("token + PostgreSQL enables live mode", () => {
  const config = loadNotionConfig(PG_ENV);
  assert.equal(config.dryRun, false);
  assert.equal(config.token, "ntn_test");
  assert.equal(config.contentRepository.driver, "postgres");
});

test("defaults: cron 08:30 staggered from news, same-origin asset path", () => {
  const config = loadNotionConfig(PG_ENV);
  assert.equal(config.cron, "30 8 * * *");
  assert.equal(config.assetPublicBaseUrl, "/agent-build/api/content/v1/assets");
});

test("enabled sources come from the registry", () => {
  const config = loadNotionConfig(PG_ENV);
  assert.deepEqual(
    config.sources.map((source) => source.key),
    [
      "notion-folder",
      "notion-folder-38275ad6",
      "notion-folder-37975ad6",
      "notion-folder-2d475ad6",
    ],
  );
});

test("MySQL no longer enables a live Notion sync because assets require PostgreSQL", () => {
  const config = loadNotionConfig({
    NOTION_TOKEN: "ntn_test",
    CONTENT_REPOSITORY_DRIVER: "mysql",
    CONTENT_MYSQL_URL: "mysql://collector:private-password@mysql.internal:3306/agent_build",
    CONTENT_MYSQL_SSL: "true",
  });

  assert.equal(config.dryRun, true);
  assert.equal(config.contentRepository.driver, "mysql");
});
