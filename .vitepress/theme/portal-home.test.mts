import assert from "node:assert/strict";
import { test } from "node:test";
import { resetContentApiRuntimeConfigCache } from "./content-api-client.ts";
import {
  buildPortalNewsDetailUrl,
  compactPortalSummary,
  fetchPortalNewsPage,
  isPortalPath,
  loadPortalNews,
  normalizePortalNewsRow,
} from "./portal-home.ts";

test("normalizePortalNewsRow keeps only traceable, readable news", () => {
  assert.deepEqual(
    normalizePortalNewsRow({
      external_id: "news-42",
      title: "  Agent Runtime 发布新版本  ",
      summary: "  新版加入持久化执行与评估接口。  ",
      source_name: "Example Lab",
      published_date: "2026-07-23",
    }),
    {
      externalId: "news-42",
      title: "Agent Runtime 发布新版本",
      summary: "新版加入持久化执行与评估接口。",
      sourceName: "Example Lab",
      publishedDate: "2026-07-23",
    },
  );

  assert.equal(normalizePortalNewsRow({ external_id: "missing-title" }), null);
  assert.equal(normalizePortalNewsRow({ title: "missing id" }), null);
});

test("compactPortalSummary collapses whitespace and preserves a bounded preview", () => {
  assert.equal(compactPortalSummary("  第一行\n\n第二行  ", 20), "第一行 第二行");
  assert.equal(compactPortalSummary("一二三四五六七八九十", 6), "一二三四五…");
  assert.equal(compactPortalSummary("", 20), "查看完整资讯与来源信息");
});

test("fetchPortalNewsPage requests five newest records through the Content API contract", async () => {
  await withContentApiConfig(async () => {
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const fakeFetch: typeof fetch = async (input, init) => {
      requestedUrl = String(input);
      requestedInit = init;
      return new Response(
        JSON.stringify({
          items: [
            {
              external_id: "news-1",
              title: "Newest",
              content_excerpt: "Fallback summary",
              source_name: "Source",
              published_at: "2026-07-23T08:30:00Z",
            },
            { external_id: "invalid" },
          ],
          totalCount: 2,
          hasMore: false,
        }),
        { status: 200 },
      );
    };

    const items = await fetchPortalNewsPage(undefined, fakeFetch);

    const url = new URL(requestedUrl, "https://site.example");
    assert.equal(items.length, 1);
    assert.equal(items[0]?.summary, "Fallback summary");
    assert.equal(url.pathname, "/agent-build/api/content/v1/news");
    assert.deepEqual(url.searchParams.getAll("sort"), ["published_date:desc", "published_at:desc"]);
    assert.equal(url.searchParams.get("limit"), "5");
    assert.equal(new Headers(requestedInit?.headers).get("apikey"), null);
    assert.equal(requestedInit?.credentials, "same-origin");
  });
});

test("loadPortalNews distinguishes unavailable, empty and request-error fallbacks", async () => {
  clearContentApiConfig();
  let fetchCount = 0;
  const unavailable = await loadPortalNews(null, async () => {
    fetchCount += 1;
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  });
  assert.deepEqual(unavailable, { state: "unavailable", items: [] });
  assert.equal(fetchCount, 0, "missing Content API configuration must not start a network request");

  await withContentApiConfig(async () => {
    const empty = await loadPortalNews(null, async () =>
      new Response(JSON.stringify({ items: [], totalCount: 0, hasMore: false }), { status: 200 }),
    );
    assert.deepEqual(empty, { state: "empty", items: [] });

    const failed = await loadPortalNews(
      null,
      async () => new Response("upstream unavailable", { status: 503 }),
    );
    assert.deepEqual(failed, { state: "error", items: [] });
  });
});

test("loadPortalNews aborts stalled requests after the bounded timeout", async () => {
  await withContentApiConfig(async () => {
    let aborted = false;
    const result = await loadPortalNews(
      null,
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              aborted = true;
              reject(new Error("request aborted"));
            },
            { once: true },
          );
        }),
      5,
    );

    assert.equal(aborted, true);
    assert.deepEqual(result, { state: "error", items: [] });
  });
});

test("loadPortalNews accepts an external abort signal for SPA route disposal", async () => {
  await withContentApiConfig(async () => {
    const routeRequest = new AbortController();
    const request = loadPortalNews(
      null,
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          if (init?.signal?.aborted) {
            reject(new Error("route disposed"));
            return;
          }
          init?.signal?.addEventListener("abort", () => reject(new Error("route disposed")), {
            once: true,
          });
        }),
      5_000,
      routeRequest.signal,
    );
    routeRequest.abort();

    assert.deepEqual(await request, { state: "error", items: [] });
  });
});

test("portal path matching and detail links preserve deployment and return context", () => {
  assert.equal(isPortalPath("/", "/"), true);
  assert.equal(isPortalPath("/index.html", "/"), true);
  assert.equal(isPortalPath("/agent-build/", "/agent-build/"), true);
  assert.equal(isPortalPath("/agent-build", "/agent-build/"), true);
  assert.equal(isPortalPath("/agent-build/news/", "/agent-build/"), false);
  assert.equal(
    buildPortalNewsDetailUrl("news/42", "/agent-build/?theme=light"),
    "/news/article?id=news%2F42&from=%2Fagent-build%2F%3Ftheme%3Dlight",
  );
});

async function withContentApiConfig<T>(fn: () => Promise<T> | T): Promise<T> {
  const holder = globalThis as typeof globalThis & { __FRONTIER_CONTENT_API_CONFIG__?: unknown };
  const original = Object.getOwnPropertyDescriptor(holder, "__FRONTIER_CONTENT_API_CONFIG__");
  try {
    holder.__FRONTIER_CONTENT_API_CONFIG__ = {
      version: 1,
      contentApi: { baseUrl: "/agent-build/api/content/v1" },
    };
    resetContentApiRuntimeConfigCache();
    return await fn();
  } finally {
    resetContentApiRuntimeConfigCache();
    if (original) Object.defineProperty(holder, "__FRONTIER_CONTENT_API_CONFIG__", original);
    else delete holder.__FRONTIER_CONTENT_API_CONFIG__;
  }
}

function clearContentApiConfig(): void {
  const holder = globalThis as typeof globalThis & { __FRONTIER_CONTENT_API_CONFIG__?: unknown };
  delete holder.__FRONTIER_CONTENT_API_CONFIG__;
  resetContentApiRuntimeConfigCache();
}
