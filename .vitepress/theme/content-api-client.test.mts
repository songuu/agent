
import assert from "node:assert/strict";
import test from "node:test";
import {
  ContentApiClient,
  adaptPostgrestReadRequest,
  buildContentApiPageUrl,
  getContentApiRuntimeConfig,
  normalizeContentApiRuntimeConfig,
  resetContentApiRuntimeConfigCache,
  type ContentApiRuntimeConfig,
} from "./content-api-client.ts";
import { resetSupabaseRuntimeConfigCache } from "./supabase-runtime-config.ts";

const supabase = {
  url: "https://project.example.supabase.co",
  anonKey: "public-anon-key",
  schema: "public",
};

test("Content runtime config accepts same-origin HTTP primary and Supabase fallback", () => {
  const config = normalizeContentApiRuntimeConfig({
    version: 1,
    contentApi: { baseUrl: "/api/content/v1/" },
    supabase,
  });

  assert.deepEqual(config, {
    version: 1,
    contentApi: { baseUrl: "/api/content/v1" },
    supabase,
  });

  assert.deepEqual(
    normalizeContentApiRuntimeConfig({
      version: 1,
      contentApi: { baseUrl: "https://other.example/api/content/v1" },
      supabase,
    }),
    { version: 1, supabase },
  );
  assert.equal(
    normalizeContentApiRuntimeConfig({ version: 1, contentApi: { baseUrl: "//other.example/api" } }),
    null,
  );
});

test("same-origin Content API uses the v1 query contract and does not send Supabase keys", async () => {
  const runtimeConfig: ContentApiRuntimeConfig = {
    version: 1,
    contentApi: { baseUrl: "/api/content/v1" },
  };
  const request = {
    resource: "news",
    fields: ["external_id", "title", "published_date"],
    filters: [{ field: "published_date", operator: "eq" as const, value: "2026-07-23" }],
    sort: [{ field: "published_date", direction: "desc" as const }],
    pageSize: 2,
    offset: 2,
  };
  const endpoint = new URL(buildContentApiPageUrl(runtimeConfig.contentApi!, request), "https://site.example");
  assert.equal(endpoint.pathname, "/api/content/v1/news");
  assert.equal(endpoint.searchParams.get("fields"), "external_id,title,published_date");
  assert.deepEqual(endpoint.searchParams.getAll("filter"), ["published_date:eq:2026-07-23"]);
  assert.deepEqual(endpoint.searchParams.getAll("sort"), ["published_date:desc"]);
  assert.equal(endpoint.searchParams.get("limit"), "2");
  assert.equal(endpoint.searchParams.get("offset"), "2");

  let fetchInit: RequestInit | undefined;
  const client = new ContentApiClient(runtimeConfig, {
    fetchImpl: async (_input, init) => {
      fetchInit = init;
      return response({ items: [{ external_id: "one" }], totalCount: 3 });
    },
  });
  const result = await client.fetchPage<{ external_id: string }>(request);

  assert.deepEqual(result, {
    rows: [{ external_id: "one" }],
    totalCount: 3,
    hasMore: false,
    source: "http",
  });
  assert.equal(new Headers(fetchInit?.headers).get("apikey"), null);
  assert.equal(fetchInit?.credentials, "same-origin");
});

test("PostgREST compatibility maps table/select/raw eq/order to HTTP, then safely falls back", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = new ContentApiClient(
    { version: 1, contentApi: { baseUrl: "/api/content/v1" }, supabase },
    {
      fetchImpl: async (input, init) => {
        const url = String(input);
        calls.push({ url, init });
        if (url.startsWith("/api/content/v1/")) return response("not deployed", {}, 503);
        return response([{ external_id: "fallback" }], { "content-range": "0-0/1" });
      },
    },
  );

  const result = await client.fetchPostgrestPage<{ external_id: string }>({
    config: supabase,
    table: "news_items",
    select: "external_id,published_date",
    filters: ["published_date=eq.2026-07-23"],
    order: ["published_date.desc"],
    pageSize: 10,
  });

  assert.deepEqual(result, {
    rows: [{ external_id: "fallback" }],
    totalCount: 1,
    hasMore: false,
    source: "supabase",
  });
  assert.equal(calls.length, 2);
  const primary = new URL(calls[0]?.url ?? "", "https://site.example");
  assert.equal(primary.pathname, "/api/content/v1/news");
  assert.deepEqual(primary.searchParams.getAll("filter"), ["published_date:eq:2026-07-23"]);
  assert.deepEqual(primary.searchParams.getAll("sort"), ["published_date:desc"]);
  assert.match(calls[1]?.url ?? "", /rest\/v1\/news_items/);
  assert.deepEqual(calls[1]?.init?.headers, {
    apikey: "public-anon-key",
    Authorization: "Bearer public-anon-key",
    "Accept-Profile": "public",
    Prefer: "count=exact",
  });

  assert.throws(
    () =>
      adaptPostgrestReadRequest({
        config: supabase,
        table: "news_items",
        select: "external_id",
        filters: ["status=neq.published"],
      }),
    /暂不支持的 PostgREST 过滤器/,
  );
});

test("legacy config without Content API keeps the current direct Supabase path", async () => {
  const calls: string[] = [];
  const client = new ContentApiClient(
    { version: 1, supabase },
    {
      fetchImpl: async (input) => {
        calls.push(String(input));
        return response([{ slug: "legacy" }], { "content-range": "0-0/1" });
      },
    },
  );

  const result = await client.fetchPostgrestPage<{ slug: string }>({
    config: supabase,
    table: "interview_questions",
    select: "slug",
    filters: ["slug=eq.legacy"],
  });

  assert.equal(result.source, "supabase");
  assert.deepEqual(result.rows, [{ slug: "legacy" }]);
  assert.equal(calls.length, 1);
  assert.match(calls[0] ?? "", /rest\/v1\/interview_questions/);
});

test("runtime JSON switches primary without rebuilding and is cached per page", async () => {
  const holder = globalThis as unknown as {
    window?: { fetch: typeof fetch };
    __FRONTIER_CONTENT_API_CONFIG__?: unknown;
  };
  const originalWindow = Object.getOwnPropertyDescriptor(holder, "window");
  const originalConfig = Object.getOwnPropertyDescriptor(holder, "__FRONTIER_CONTENT_API_CONFIG__");

  try {
    let requestCount = 0;
    holder.window = {
      fetch: async (input, init) => {
        requestCount += 1;
        assert.match(String(input), /supabase-runtime-config\.json$/);
        assert.equal(init?.cache, "no-store");
        return response({ version: 1, contentApi: { baseUrl: "/api/content/v1" }, supabase });
      },
    };
    resetContentApiRuntimeConfigCache();
    assert.deepEqual(await getContentApiRuntimeConfig(), {
      version: 1,
      contentApi: { baseUrl: "/api/content/v1" },
      supabase,
    });
    assert.deepEqual(await getContentApiRuntimeConfig(), {
      version: 1,
      contentApi: { baseUrl: "/api/content/v1" },
      supabase,
    });
    assert.equal(requestCount, 1);
  } finally {
    resetContentApiRuntimeConfigCache();
    resetSupabaseRuntimeConfigCache();
    if (originalWindow) Object.defineProperty(holder, "window", originalWindow);
    else delete holder.window;
    if (originalConfig) Object.defineProperty(holder, "__FRONTIER_CONTENT_API_CONFIG__", originalConfig);
    else delete holder.__FRONTIER_CONTENT_API_CONFIG__;
  }
});

function response(payload: unknown, headers: Record<string, string> = {}, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? headers[name] ?? null;
      },
    } as Headers,
    text: async () => (typeof payload === "string" ? payload : JSON.stringify(payload)),
    json: async () => payload,
  } as Response;
}


