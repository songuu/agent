import assert from "node:assert/strict";
import test from "node:test";

import { resetContentApiRuntimeConfigCache } from "./content-api-client.ts";
import { fetchPostgrestPage } from "./content-pagination.ts";

test("content pagination works with Content API only and never synthesizes a Supabase key", async () => {
  const holder = globalThis as typeof globalThis & { __FRONTIER_CONTENT_API_CONFIG__?: unknown };
  const originalConfig = Object.getOwnPropertyDescriptor(holder, "__FRONTIER_CONTENT_API_CONFIG__");
  try {
    holder.__FRONTIER_CONTENT_API_CONFIG__ = {
      version: 1,
      contentApi: { baseUrl: "/agent-build/api/content/v1" },
    };
    resetContentApiRuntimeConfigCache();
    let requestedUrl = "";
    let headers: Headers | undefined;
    const page = await fetchPostgrestPage<{ external_id: string }>({
      table: "news_items",
      select: "external_id,title",
      filters: ["external_id=eq.news-1"],
      order: ["published_date.desc"],
      pageSize: 10,
      fetchImpl: async (input, init) => {
        requestedUrl = String(input);
        headers = new Headers(init?.headers);
        return new Response(JSON.stringify({ items: [{ external_id: "news-1" }], totalCount: 1, hasMore: false }));
      },
    });

    const url = new URL(requestedUrl, "https://site.example");
    assert.equal(url.pathname, "/agent-build/api/content/v1/news");
    assert.deepEqual(url.searchParams.getAll("filter"), ["external_id:eq:news-1"]);
    assert.equal(headers?.get("apikey"), null);
    assert.deepEqual(page, { rows: [{ external_id: "news-1" }], totalCount: 1, hasMore: false });
  } finally {
    resetContentApiRuntimeConfigCache();
    if (originalConfig) Object.defineProperty(holder, "__FRONTIER_CONTENT_API_CONFIG__", originalConfig);
    else delete holder.__FRONTIER_CONTENT_API_CONFIG__;
  }
});