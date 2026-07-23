import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPortalNewsDetailUrl,
  compactPortalSummary,
  fetchPortalNewsPage,
  isPortalPath,
  loadPortalNews,
  normalizePortalNewsRow,
} from "./portal-home";

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

test("fetchPortalNewsPage requests five newest records through the public read contract", async () => {
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  const fakeFetch: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedInit = init;
    return new Response(
      JSON.stringify([
        {
          external_id: "news-1",
          title: "Newest",
          content_excerpt: "Fallback summary",
          source_name: "Source",
          published_at: "2026-07-23T08:30:00Z",
        },
        { external_id: "invalid" },
      ]),
      { status: 200, headers: { "content-range": "0-1/2" } },
    );
  };

  const items = await fetchPortalNewsPage(
    { url: "https://project.supabase.co", anonKey: "public-anon", schema: "public" },
    fakeFetch,
  );

  assert.equal(items.length, 1);
  assert.equal(items[0]?.summary, "Fallback summary");
  assert.match(requestedUrl, /\/rest\/v1\/news_items\?/);
  assert.match(requestedUrl, /order=published_date\.desc/);
  assert.match(requestedUrl, /order=published_at\.desc/);
  assert.match(requestedUrl, /limit=5/);
  assert.equal(new Headers(requestedInit?.headers).get("apikey"), "public-anon");
  assert.equal(new Headers(requestedInit?.headers).get("Prefer"), null);
});
test("loadPortalNews distinguishes unavailable, empty and request-error fallbacks", async () => {
  const config = { url: "https://project.supabase.co", anonKey: "public-anon", schema: "public" };
  let fetchCount = 0;
  const unavailable = await loadPortalNews(null, async () => {
    fetchCount += 1;
    return new Response("[]", { status: 200 });
  });
  assert.deepEqual(unavailable, { state: "unavailable", items: [] });
  assert.equal(fetchCount, 0, "missing configuration must not start a network request");

  const empty = await loadPortalNews(config, async () => new Response("[]", { status: 200 }));
  assert.deepEqual(empty, { state: "empty", items: [] });

  const failed = await loadPortalNews(
    config,
    async () => new Response("upstream unavailable", { status: 503 }),
  );
  assert.deepEqual(failed, { state: "error", items: [] });
});

test("loadPortalNews aborts stalled requests after the bounded timeout", async () => {
  const config = { url: "https://project.supabase.co", anonKey: "public-anon", schema: "public" };
  let aborted = false;
  const result = await loadPortalNews(
    config,
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

test("loadPortalNews accepts an external abort signal for SPA route disposal", async () => {
  const config = { url: "https://project.supabase.co", anonKey: "public-anon", schema: "public" };
  const routeRequest = new AbortController();
  const request = loadPortalNews(
    config,
    async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
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
