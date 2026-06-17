import assert from "node:assert/strict";
import { test } from "node:test";
import { loadNotionConfig } from "../src/notion/config.ts";

const FULL_ENV = {
  NOTION_TOKEN: "ntn_test",
  SUPABASE_URL: "https://db.example.com",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
};

test("missing NOTION_TOKEN forces dryRun", () => {
  const config = loadNotionConfig({ ...FULL_ENV, NOTION_TOKEN: "" });
  assert.equal(config.dryRun, true);
  assert.equal(config.token, null);
});

test("missing Supabase creds forces dryRun even with a token", () => {
  const config = loadNotionConfig({ NOTION_TOKEN: "ntn_test" });
  assert.equal(config.dryRun, true);
  assert.equal(config.supabase, null);
});

test("token + supabase enables live mode", () => {
  const config = loadNotionConfig(FULL_ENV);
  assert.equal(config.dryRun, false);
  assert.equal(config.token, "ntn_test");
  assert.ok(config.supabase);
});

test("defaults: cron 08:30 staggered from news, bucket", () => {
  const config = loadNotionConfig(FULL_ENV);
  assert.equal(config.cron, "30 8 * * *");
  assert.equal(config.storageBucket, "notion-assets");
});

test("enabled sources come from the registry", () => {
  const config = loadNotionConfig(FULL_ENV);
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
