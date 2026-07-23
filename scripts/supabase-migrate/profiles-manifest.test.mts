import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_TABLES, projectPortableRow, stableTableHash } from "./manifest.ts";
import {
  assertDistinctProfiles,
  loadProfilePair,
  parseMigrationProfile,
  safeProfileSummary,
} from "./profiles.ts";
import { portableRow, profile } from "./test-helpers.ts";

function env(url: string, secret: string): Record<string, string> {
  return {
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: secret,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: `${secret}-anon`,
    SUPABASE_DB_URL: `postgresql://user:${secret}@db.test/postgres`,
    NOTION_STORAGE_BUCKET: "notion-assets",
  };
}

test("loads two independent profiles and keeps every credential out of summaries", async () => {
  const sourceSecret = "source-secret-never-print";
  const targetSecret = "target-secret-never-print";
  const pair = await loadProfilePair("source.env", "target.env", async (path) =>
    Object.entries(path === "source.env" ? env("https://source.test", sourceSecret) : env("https://target.test", targetSecret))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
  );

  assert.equal(pair.source.name, "source");
  assert.equal(pair.target.name, "target");
  const summary = JSON.stringify([safeProfileSummary(pair.source), safeProfileSummary(pair.target)]);
  assert.doesNotMatch(summary, /source-secret-never-print|target-secret-never-print|postgresql/);
});

test("rejects normalized source and target self-migration without echoing a key", () => {
  const secret = "do-not-echo-this-key";
  const source = parseMigrationProfile("source", env("https://same.test/", secret));
  const target = parseMigrationProfile("target", env("https://same.test", secret));
  let error: Error | undefined;
  try {
    assertDistinctProfiles({ source, target });
  } catch (caught: unknown) {
    error = caught instanceof Error ? caught : new Error(String(caught));
  }
  assert.ok(error);
  assert.match(error.message, /same project/i);
  assert.doesNotMatch(error.message, /do-not-echo-this-key/);
});

test("content manifest explicitly owns exactly five portable tables and omits server fields", () => {
  assert.deepEqual(
    CONTENT_TABLES.map((table) => table.table),
    ["frontier_ecosystem_articles", "interview_questions", "glossary_terms", "news_items", "notion_articles"],
  );
  for (const table of CONTENT_TABLES) {
    assert.ok(table.copyFields.includes(table.conflictKey));
    assert.ok(table.keyFields.length > 0);
    assert.equal(table.copyFields.includes("id"), false);
    assert.equal(table.copyFields.includes("search_text"), false);
    assert.equal(table.copyFields.includes("created_at"), false);
    assert.equal(table.copyFields.includes("updated_at"), false);
  }
});

test("portable row projection and stable hash ignore source ids/generated fields and JSON key order", () => {
  const manifest = CONTENT_TABLES[1]!;
  const first = { ...portableRow(manifest, "a"), id: "source-id", search_text: "generated", metadata: { b: 2, a: 1 } };
  const second = { ...portableRow(manifest, "b"), id: "other-id", search_text: "generated", metadata: { a: 3, b: 4 } };
  const projected = projectPortableRow(manifest, first);
  assert.equal("id" in projected, false);
  assert.equal("search_text" in projected, false);

  const reorderedFirst = { ...first, metadata: { a: 1, b: 2 } };
  const reorderedSecond = { ...second, metadata: { b: 4, a: 3 } };
  assert.equal(stableTableHash(manifest, [first, second]), stableTableHash(manifest, [reorderedSecond, reorderedFirst]));
  assert.equal(profile("source", "https://source.test").storageBucket, "notion-assets");
});
