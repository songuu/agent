import assert from "node:assert/strict";
import { test } from "node:test";
import { upsertNotionArticles } from "../src/notion/store.ts";
import { SAMPLE_NOTION_ARTICLES } from "../src/notion/sample-data.ts";

const SUPABASE = { url: "https://db.example.com", serviceRoleKey: "svc-role", schema: "public" };

test("legacy Supabase notion writer refuses uploads before fetch", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response(null, { status: 201 });
  }) as typeof fetch;

  await assert.rejects(
    () => upsertNotionArticles(SAMPLE_NOTION_ARTICLES, SUPABASE, fetchImpl),
    /Supabase\/PostgREST data uploads are disabled/,
  );
  assert.equal(calls, 0);
});
