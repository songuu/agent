import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPostgrestPageUrl,
  fetchAllPostgrestRows,
  fetchPostgrestPage,
  type PostgrestReadConfig,
} from "./postgrest-pagination";

const config: PostgrestReadConfig = {
  url: "https://supabase.example.com/",
  anonKey: "anon",
  schema: "public",
};

test("buildPostgrestPageUrl preserves select, filters, order, limit and offset", () => {
  const url = buildPostgrestPageUrl(
    config,
    "frontier_ecosystem_articles",
    "slug,title,source",
    ["chapter_id=eq.20"],
    ["sort_order.asc"],
    50,
    100,
  );

  assert.equal(
    url,
    "https://supabase.example.com/rest/v1/frontier_ecosystem_articles?select=slug%2Ctitle%2Csource&chapter_id=eq.20&order=sort_order.asc&limit=50&offset=100",
  );
});

test("fetchAllPostgrestRows requests pages until the final short page", async () => {
  const requested: string[] = [];
  const fetchImpl = async (url: string) => {
    requested.push(url);
    const page = requested.length;
    const rows = page === 1 ? [{ id: 1 }, { id: 2 }] : page === 2 ? [{ id: 3 }] : [];
    return response(rows);
  };

  const rows = await fetchAllPostgrestRows<{ id: number }>({
    config,
    table: "news_items",
    select: "external_id,title",
    order: ["published_date.desc", "published_at.desc"],
    pageSize: 2,
    fetchImpl,
  });

  assert.deepEqual(rows, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.equal(requested.length, 2);
  assert.match(requested[0] ?? "", /limit=2&offset=0$/);
  assert.match(requested[1] ?? "", /limit=2&offset=2$/);
});

test("fetchAllPostgrestRows sends anon headers for every page", async () => {
  const headersSeen: Record<string, string>[] = [];
  const fetchImpl = async (_url: string, init?: RequestInit) => {
    headersSeen.push(init?.headers as Record<string, string>);
    return response([]);
  };

  await fetchAllPostgrestRows({ config, table: "news_items", select: "external_id", fetchImpl });

  assert.deepEqual(headersSeen, [
    {
      apikey: "anon",
      Authorization: "Bearer anon",
      "Accept-Profile": "public",
    },
  ]);
});

test("fetchPostgrestPage returns total count and hasMore from content-range", async () => {
  const result = await fetchPostgrestPage<{ id: number }>({
    config,
    table: "news_items",
    select: "external_id",
    pageSize: 2,
    offset: 2,
    fetchImpl: async () => response([{ id: 3 }, { id: 4 }], { "content-range": "2-3/5" }),
  });

  assert.deepEqual(result.rows, [{ id: 3 }, { id: 4 }]);
  assert.equal(result.totalCount, 5);
  assert.equal(result.hasMore, true);
});

test("fetchAllPostgrestRows fails on non-array payload", async () => {
  await assert.rejects(
    fetchAllPostgrestRows({
      config,
      table: "news_items",
      select: "external_id",
      fetchImpl: async () => response({ id: 1 }),
    }),
    /返回数据不是数组/,
  );
});

test("fetchAllPostgrestRows stops runaway pagination at maxPages", async () => {
  await assert.rejects(
    fetchAllPostgrestRows({
      config,
      table: "news_items",
      select: "external_id",
      pageSize: 1,
      maxPages: 2,
      fetchImpl: async () => response([{ id: 1 }]),
    }),
    /分页读取超过 2 页/,
  );
});

function response(payload: unknown, headers: Record<string, string> = {}): Response {
  return {
    ok: true,
    status: 200,
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? headers[name] ?? null;
      },
    } as Headers,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  } as Response;
}
