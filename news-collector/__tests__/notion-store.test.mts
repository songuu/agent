import assert from "node:assert/strict";
import { test } from "node:test";
import { upsertNotionArticles } from "../src/notion/store.ts";
import { SAMPLE_NOTION_ARTICLES } from "../src/notion/sample-data.ts";
import type { NotionArticle } from "../src/notion/types.ts";

const SUPABASE = { url: "https://db.example.com", serviceRoleKey: "svc-role", schema: "public" };

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function fakeFetch(calls: Call[]): typeof fetch {
  return (async (url: string | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({
      url: String(url),
      method,
      headers: (init?.headers as Record<string, string>) ?? {},
      body: typeof init?.body === "string" ? init.body : undefined,
    });
    if (method === "POST") return new Response(null, { status: 201 });
    return new Response("[]", { status: 200, headers: { "content-range": "0-0/2" } });
  }) as unknown as typeof fetch;
}

test("upserts valid articles to notion_articles with conflict key + merge-duplicates", async () => {
  const calls: Call[] = [];
  const result = await upsertNotionArticles(SAMPLE_NOTION_ARTICLES, SUPABASE, fakeFetch(calls));

  assert.equal(result.pushed, SAMPLE_NOTION_ARTICLES.length);
  assert.equal(result.invalid, 0);
  assert.equal(result.tableCount, "0-0/2");

  const post = calls.find((c) => c.method === "POST");
  assert.ok(post);
  assert.match(post.url, /\/rest\/v1\/notion_articles\?on_conflict=notion_page_id$/);
  assert.match(post.headers.Prefer ?? "", /resolution=merge-duplicates/);
  assert.equal(post.headers["Content-Profile"], "public");

  // toRow snake_case mapping present in body
  const rows = JSON.parse(post.body ?? "[]");
  assert.ok(rows[0].notion_page_id && rows[0].body_markdown && rows[0].notion_last_edited_time);
  assert.equal(rows[0].slug, SAMPLE_NOTION_ARTICLES[0]?.slug);
});

test("invalid rows are counted and excluded, valid ones still pushed", async () => {
  const bad: NotionArticle = { ...SAMPLE_NOTION_ARTICLES[0]!, notionPageId: "not-a-uuid" };
  const calls: Call[] = [];
  const result = await upsertNotionArticles([bad, SAMPLE_NOTION_ARTICLES[1]!], SUPABASE, fakeFetch(calls));
  assert.equal(result.invalid, 1);
  assert.equal(result.pushed, 1);
});

test("all-invalid batch makes no POST", async () => {
  const bad: NotionArticle = { ...SAMPLE_NOTION_ARTICLES[0]!, notionPageId: "x" };
  const calls: Call[] = [];
  const result = await upsertNotionArticles([bad], SUPABASE, fakeFetch(calls));
  assert.equal(result.pushed, 0);
  assert.equal(result.invalid, 1);
  assert.equal(calls.filter((c) => c.method === "POST").length, 0);
});
