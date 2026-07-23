import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_NOTION_ARTICLES } from "../src/notion/sample-data.ts";
import type { NewsItem } from "../src/types.ts";
import { loadContentRepositoryConfig } from "../src/data/repository-config.ts";
import { CONTENT_TABLE_CONTRACTS } from "../src/data/content-table-contracts.ts";
import { MYSQL_CONTENT_SCHEMA_SQL } from "../src/data/mysql-schema.ts";
import {
  createMySqlContentRepository,
  createMysql2Executor,
  type MySqlExecutionResult,
  type MySqlExecutor,
} from "../src/data/mysql-content-repository.ts";
import { createSupabaseContentRepository } from "../src/data/supabase-content-repository.ts";

function sampleNewsItem(index = 1): NewsItem {
  return {
    externalId: `external-${index.toString().padStart(8, "0")}`,
    sourceKey: "test-source",
    sourceName: "Test Source",
    sourceKind: "release",
    title: `Test item ${index}`,
    url: `https://example.com/items/${index}`,
    summary: "summary",
    contentText: "content\u0000 with an unmatched surrogate \ud800",
    contentExcerpt: "content",
    contentStatus: "fetched",
    contentFetchedAt: "2026-07-23T01:02:03.456Z",
    ecosystemLayer: "runtime",
    ecosystemLayerLabel: "Runtime",
    tags: ["agent", "runtime"],
    lang: "en",
    publishedAt: "2026-07-22T01:02:03.456Z",
    publishedDate: "2026-07-22",
    collectedAt: "2026-07-23T01:02:03.456Z",
    collectedDate: "2026-07-23",
    enriched: false,
    metadata: { sourceUrl: "https://example.com/feed", nested: { value: "ok\u0000" } },
  };
}

interface SqlCall {
  readonly statement: string;
  readonly values: readonly unknown[];
}

function recordingExecutor(results: readonly MySqlExecutionResult[] = []): {
  readonly executor: MySqlExecutor;
  readonly calls: SqlCall[];
} {
  const calls: SqlCall[] = [];
  let resultIndex = 0;
  return {
    executor: {
      execute: async (statement, values) => {
        calls.push({ statement, values });
        return results[resultIndex++] ?? { affectedRows: 0 };
      },
    },
    calls,
  };
}

test("MySQL repository uses bounded parameterized upserts and keeps the current identity keys", async () => {
  const { executor, calls } = recordingExecutor([
    { affectedRows: 100 },
    { affectedRows: 1 },
    { rows: [{ table_count: 101 }] },
  ]);
  const repository = createMySqlContentRepository({ executor, chunkSize: 100 });
  const items = Array.from({ length: 101 }, (_, index) => sampleNewsItem(index + 1));

  const result = await repository.upsertNewsItems(items);

  assert.deepEqual(result, { attempted: 101, invalid: 0, pushed: 101, tableCount: "101" });
  assert.equal(calls.length, 3);
  assert.match(calls[0]!.statement, /^INSERT INTO `news_items`/);
  assert.match(calls[0]!.statement, /ON DUPLICATE KEY UPDATE/);
  assert.match(calls[0]!.statement, /`source_key` = IF\(`external_id` = new\.`external_id`, new\.`source_key`, NULL\)/);
  assert.equal((calls[0]!.statement.match(/\?/g) ?? []).length, 100 * 21);
  assert.equal(calls[0]!.values.length, 100 * 21);
  assert.equal(calls[1]!.values.length, 21);
  assert.match(calls[2]!.statement, /^SELECT COUNT\(\*\) AS `table_count` FROM `news_items`$/);

  const firstRow = calls[0]!.values.slice(0, 21);
  assert.equal(firstRow[7], "content with an unmatched surrogate ");
  assert.equal(firstRow[10], "2026-07-23 01:02:03.456");
  assert.equal(firstRow[13], '["agent","runtime"]');
  assert.equal(firstRow[19], 0);
  assert.equal(firstRow[20], '{"sourceUrl":"https://example.com/feed","nested":{"value":"ok"}}');
});

test("MySQL repository validates rows before writing and preserves the all-invalid no-op", async () => {
  const { executor, calls } = recordingExecutor();
  const repository = createMySqlContentRepository({ executor });
  const invalid = { ...sampleNewsItem(), externalId: "bad" };

  const result = await repository.upsertNewsItems([invalid]);

  assert.deepEqual(result, { attempted: 1, invalid: 1, pushed: 0, tableCount: "0" });
  assert.equal(calls.length, 0);
});

test("MySQL notion adapter keeps the existing conflict key, cursor, and asset-manifest semantics", async () => {
  const { executor, calls } = recordingExecutor([
    { affectedRows: 2 },
    { rows: [{ table_count: "2" }] },
    { rows: [{ notion_last_edited_time: "2026-07-22 13:14:15.123" }] },
    { rows: [{ metadata: '{"assets":{"block":{"blockId":"block","storageKey":"p/a.png","publicUrl":"https://assets.example/p/a.png","srcHash":"abc"}}}' }] },
  ]);
  const repository = createMySqlContentRepository({ executor });

  const upsert = await repository.upsertNotionArticles(SAMPLE_NOTION_ARTICLES);
  const cursor = await repository.fetchNotionCursor("notion-folder");
  const manifest = await repository.fetchNotionAssetManifest(SAMPLE_NOTION_ARTICLES[0]!.notionPageId);

  assert.equal(upsert.pushed, 2);
  assert.equal(upsert.tableCount, "2");
  assert.match(calls[0]!.statement, /^INSERT INTO `notion_articles`/);
  assert.match(calls[0]!.statement, /`slug` = IF\(`notion_page_id` = new\.`notion_page_id`, new\.`slug`, NULL\)/);
  assert.match(calls[2]!.statement, /MAX\(`notion_last_edited_time`\)/);
  assert.deepEqual(calls[2]!.values, ["notion-folder"]);
  assert.match(calls[3]!.statement, /WHERE `notion_page_id` = \? LIMIT 1$/);
  assert.equal(manifest.block?.publicUrl, "https://assets.example/p/a.png");
  assert.equal(cursor, "2026-07-22T13:14:15.123Z");
});

test("MySQL config requires complete private credentials and never falls back to Supabase implicitly", () => {
  assert.throws(
    () => loadContentRepositoryConfig({ CONTENT_REPOSITORY_DRIVER: "mysql", CONTENT_MYSQL_HOST: "db.internal" }),
    /CONTENT_MYSQL_DATABASE/,
  );

  assert.deepEqual(
    loadContentRepositoryConfig({
      CONTENT_REPOSITORY_DRIVER: "mysql",
      CONTENT_MYSQL_HOST: "db.internal",
      CONTENT_MYSQL_PORT: "3307",
      CONTENT_MYSQL_DATABASE: "agent_build",
      CONTENT_MYSQL_USER: "collector",
      CONTENT_MYSQL_PASSWORD: "private-password",
      CONTENT_MYSQL_SSL: "true",
    }),
    {
      driver: "mysql",
      mysql: {
        host: "db.internal",
        port: 3307,
        database: "agent_build",
        user: "collector",
        password: "private-password",
        ssl: true,
      },
    },
  );
  assert.deepEqual(loadContentRepositoryConfig({}), { driver: "supabase" });
});

test("mysql2 bridge is structural: no mysql2 package is imported by the repository", async () => {
  const calls: Array<{ statement: string; values: readonly unknown[] | undefined }> = [];
  const executor = createMysql2Executor({
    execute: async (statement, values) => {
      calls.push({ statement, values });
      return [[{ table_count: 3 }], []];
    },
  });

  const result = await executor.execute("SELECT COUNT(*) AS table_count FROM news_items", []);

  assert.deepEqual(result.rows, [{ table_count: 3 }]);
  assert.deepEqual(calls, [{ statement: "SELECT COUNT(*) AS table_count FROM news_items", values: [] }]);
});

test("Supabase adapter preserves the current PostgREST write contract without changing callers", async () => {
  const calls: string[] = [];
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${String(url)}`);
    if (init?.method === "POST") return new Response(null, { status: 201 });
    return new Response("[]", { status: 200, headers: { "content-range": "0-0/1" } });
  }) as unknown as typeof fetch;
  const repository = createSupabaseContentRepository({
    config: { url: "https://db.example.com", serviceRoleKey: "service-role", schema: "public" },
    fetchImpl,
  });

  const result = await repository.upsertNewsItems([sampleNewsItem()]);

  assert.equal(repository.provider, "supabase");
  assert.equal(result.pushed, 1);
  assert.deepEqual(calls, [
    "POST https://db.example.com/rest/v1/news_items?on_conflict=external_id",
    "GET https://db.example.com/rest/v1/news_items?select=external_id",
  ]);
});

test("generic table contracts cover all five content tables and preserve their natural keys", async () => {
  assert.deepEqual(Object.keys(CONTENT_TABLE_CONTRACTS), [
    "frontier_ecosystem_articles",
    "interview_questions",
    "glossary_terms",
    "news_items",
    "notion_articles",
  ]);
  assert.equal(CONTENT_TABLE_CONTRACTS.frontier_ecosystem_articles.conflictKey, "slug");
  assert.equal(CONTENT_TABLE_CONTRACTS.interview_questions.conflictKey, "slug");
  assert.equal(CONTENT_TABLE_CONTRACTS.glossary_terms.conflictKey, "slug");
  assert.equal(CONTENT_TABLE_CONTRACTS.news_items.conflictKey, "external_id");
  assert.equal(CONTENT_TABLE_CONTRACTS.notion_articles.conflictKey, "notion_page_id");
  assert.match(MYSQL_CONTENT_SCHEMA_SQL, /UNIQUE KEY frontier_source_url_uq/);
  assert.match(MYSQL_CONTENT_SCHEMA_SQL, /UNIQUE KEY notion_slug_uq/);

  const { executor, calls } = recordingExecutor([{ affectedRows: 1 }, { rows: [{ table_count: 1 }] }]);
  const repository = createMySqlContentRepository({ executor });
  const result = await repository.upsertTableRows("frontier_ecosystem_articles", [{
    article_id: "frontier-1",
    slug: "frontier-one",
    chapter_id: "19",
    chapter_slug: "frontier",
    title: "Frontier",
    source: "Source",
    source_url: "https://example.com/frontier",
    kind: "paper",
    ecosystem_layer: "foundation",
    ecosystem_layer_label: "基础综述",
    summary: "summary",
    collected_date: "2026-07-23",
    collected_at: "2026-07-23T00:00:00.000Z",
    read_count: 0,
    sort_order: 1,
    tags: ["frontier"],
    detail_paragraphs: ["detail"],
    metadata: { confidence: "high" },
  }]);

  assert.equal(result.pushed, 1);
  assert.match(calls[0]!.statement, /`source_url` = IF\(`slug` = new\.`slug`, new\.`source_url`, NULL\)/);
  assert.equal(calls[0]!.values[15], '["frontier"]');
});

test("Supabase adapter batches 101 rows exactly like the legacy news writer", async () => {
  const postBodies: unknown[][] = [];
  const fetchImpl = (async (_url: string | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      postBodies.push(JSON.parse(String(init.body)) as unknown[]);
      return new Response(null, { status: 201 });
    }
    return new Response("[]", { status: 200, headers: { "content-range": "0-0/101" } });
  }) as unknown as typeof fetch;
  const repository = createSupabaseContentRepository({
    config: { url: "https://db.example.com", serviceRoleKey: "service-role", schema: "public" },
    fetchImpl,
  });

  const result = await repository.upsertNewsItems(
    Array.from({ length: 101 }, (_, index) => sampleNewsItem(index + 1)),
  );

  assert.deepEqual(postBodies.map((body) => body.length), [100, 1]);
  assert.deepEqual(result, { attempted: 101, invalid: 0, pushed: 101, tableCount: "0-0/101" });
});
