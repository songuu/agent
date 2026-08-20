import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import type { ContentPage, ContentReadRepository, ContentReadRequest } from "./contract.ts";
import { createContentApiServer, createNewsCalendarCache, createNewsResponseCache } from "./server.ts";

const allowedHosts = ["content.test"];
const allowedOrigins = ["https://site.test"];

async function withServer(
  repository: ContentReadRepository,
  run: (port: number, seen: ContentReadRequest[]) => Promise<void>,
  options: { allowMissingOrigin?: boolean } = {},
): Promise<void> {
  const seen: ContentReadRequest[] = [];
  const server = createContentApiServer({
    repository: {
      async read(request) {
        seen.push(request);
        return repository.read(request);
      },
      async readNewsCalendar() {
        return repository.readNewsCalendar();
      },
    },
    allowedHosts,
    allowedOrigins,
    allowMissingOrigin: options.allowMissingOrigin ?? false,
  });
  await listen(server);
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await run(address.port, seen);
  } finally {
    await close(server);
  }
}

const successfulRepository: ContentReadRepository = {
  async read() {
    return { items: [{ external_id: "one", title: "One" }], totalCount: 1, hasMore: false };
  },
  async readNewsCalendar() {
    return {
      buckets: [{ date: "2026-07-30", ecosystemLayer: "model-platform", articleCount: 20 }],
      sourceCounts: [
        { ecosystemLayer: "all", sourceCount: 8 },
        { ecosystemLayer: "model-platform", sourceCount: 3 },
      ],
    };
  },
};

test("serves a validated public content page without database details", async () => {
  await withServer(successfulRepository, async (port, seen) => {
    const result = await request(port, "/api/content/v1/news?fields=external_id,title&filter=external_id:eq:one");
    assert.equal(result.status, 200);
    assert.equal(result.headers["cache-control"], "no-store");
    assert.deepEqual(result.json, { items: [{ external_id: "one", title: "One" }], totalCount: 1, hasMore: false });
    assert.deepEqual(seen, [
      {
        resource: "news",
        fields: ["external_id", "title"],
        filters: [{ field: "external_id", operator: "eq", value: "one" }],
        sort: [],
        limit: 100,
        offset: 0,
        includeTotal: true,
      },
    ]);
  });
});

test("serves compact server-aggregated news calendar buckets", async () => {
  await withServer(successfulRepository, async (port) => {
    const result = await request(port, "/api/content/v1/news/calendar");
    assert.equal(result.status, 200);
    assert.deepEqual(result.json, {
      buckets: [{ date: "2026-07-30", ecosystemLayer: "model-platform", articleCount: 20 }],
      sourceCounts: [
        { ecosystemLayer: "all", sourceCount: 8 },
        { ecosystemLayer: "model-platform", sourceCount: 3 },
      ],
    });
    assert.match(result.headers["cache-control"] ?? "", /max-age=300/);

    const invalid = await request(port, "/api/content/v1/news/calendar?limit=1");
    assert.equal(invalid.status, 400);
    assert.equal(invalid.json.error, "unknown_parameter");
  });
});

test("calendar cache coalesces concurrent cold reads and serves the last good value while refreshing", async () => {
  let now = 0;
  let calls = 0;
  let releaseFirst: ((value: Awaited<ReturnType<ContentReadRepository["readNewsCalendar"]>>) => void) | undefined;
  let markFirstStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => { markFirstStarted = resolve; });
  const first = new Promise<Awaited<ReturnType<ContentReadRepository["readNewsCalendar"]>>>((resolve) => {
    releaseFirst = resolve;
  });
  const summary = await successfulRepository.readNewsCalendar();
  const cache = createNewsCalendarCache(
    {
      async readNewsCalendar() {
        calls += 1;
        if (calls === 1) {
          markFirstStarted?.();
          return first;
        }
        return { ...summary, buckets: [] };
      },
    },
    { ttlMs: 100, now: () => now },
  );

  const firstRead = cache.read();
  await started;
  const secondRead = cache.read();
  assert.equal(calls, 1);
  releaseFirst?.(summary);
  assert.deepEqual(await firstRead, summary);
  assert.deepEqual(await secondRead, summary);

  now = 101;
  assert.deepEqual(await cache.read(), summary);
  assert.equal(calls, 2);
});

const newsResponseRequest: ContentReadRequest = {
  resource: "news",
  fields: ["external_id"],
  filters: [],
  sort: [],
  limit: 10,
  offset: 0,
  includeTotal: true,
};
const newsResponseCacheKey = "/api/content/v1/news?fields=external_id&limit=10";

test("news response cache coalesces cold reads, hits, and refreshes stale successes", async () => {
  let now = 0;
  let calls = 0;
  let markFirstStarted: (() => void) | undefined;
  let markRefreshStarted: (() => void) | undefined;
  let releaseFirst: ((value: ContentPage) => void) | undefined;
  let releaseRefresh: ((value: ContentPage) => void) | undefined;
  const firstStarted = new Promise<void>((resolve) => { markFirstStarted = resolve; });
  const refreshStarted = new Promise<void>((resolve) => { markRefreshStarted = resolve; });
  const first = new Promise<ContentPage>((resolve) => { releaseFirst = resolve; });
  const refreshed = new Promise<ContentPage>((resolve) => { releaseRefresh = resolve; });
  const firstPage = { items: [{ external_id: "first" }], totalCount: 1, hasMore: false };
  const refreshedPage = { items: [{ external_id: "refreshed" }], totalCount: 1, hasMore: false };
  const cache = createNewsResponseCache(
    {
      async read() {
        calls += 1;
        if (calls === 1) {
          markFirstStarted?.();
          return first;
        }
        markRefreshStarted?.();
        return refreshed;
      },
    },
    { ttlMs: 100, maxEntries: 2, now: () => now },
  );

  const firstRead = cache.read(newsResponseCacheKey, newsResponseRequest);
  await firstStarted;
  const sameColdRead = cache.read(newsResponseCacheKey, newsResponseRequest);
  assert.equal(calls, 1);
  releaseFirst?.(firstPage);
  assert.deepEqual(await firstRead, firstPage);
  assert.deepEqual(await sameColdRead, firstPage);

  now = 99;
  assert.deepEqual(await cache.read(newsResponseCacheKey, newsResponseRequest), firstPage);
  assert.equal(calls, 1);

  now = 101;
  assert.deepEqual(await cache.read(newsResponseCacheKey, newsResponseRequest), firstPage);
  await refreshStarted;
  assert.equal(calls, 2);
  releaseRefresh?.(refreshedPage);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(await cache.read(newsResponseCacheKey, newsResponseRequest), refreshedPage);
  assert.equal(calls, 2);
});

test("news response cache retains the last success when a stale refresh fails", async () => {
  let now = 0;
  let calls = 0;
  const errors: unknown[] = [];
  const cachedPage = { items: [{ external_id: "cached" }], totalCount: 1, hasMore: false };
  const cache = createNewsResponseCache(
    {
      async read() {
        calls += 1;
        if (calls === 1) return cachedPage;
        throw new Error("temporary database error");
      },
    },
    { ttlMs: 100, now: () => now, onError: (error) => errors.push(error) },
  );

  assert.deepEqual(await cache.read(newsResponseCacheKey, newsResponseRequest), cachedPage);
  now = 101;
  assert.deepEqual(await cache.read(newsResponseCacheKey, newsResponseRequest), cachedPage);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(calls, 2);
  assert.equal(errors.length, 1);

  assert.deepEqual(await cache.read(newsResponseCacheKey, newsResponseRequest), cachedPage);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(calls, 3);
});

test("news response cache bounds retained query keys", async () => {
  let calls = 0;
  const cache = createNewsResponseCache(
    {
      async read() {
        calls += 1;
        return { items: [{ external_id: String(calls) }], totalCount: 1, hasMore: false };
      },
    },
    { maxEntries: 1 },
  );

  await cache.read("/api/content/v1/news?fields=external_id&limit=1", newsResponseRequest);
  await cache.read("/api/content/v1/news?fields=external_id&limit=2", newsResponseRequest);
  await cache.read("/api/content/v1/news?fields=external_id&limit=1", newsResponseRequest);
  assert.equal(calls, 3);
});

test("rejects unsupported methods before reaching the repository", async () => {
  await withServer(successfulRepository, async (port, seen) => {
    const result = await request(port, "/api/content/v1/news?fields=external_id", { method: "POST" });
    assert.equal(result.status, 405);
    assert.equal(result.json.error, "method_not_allowed");
    assert.deepEqual(seen, []);
  });
});

test("rejects a missing Origin when the deployment requires same-origin browser reads", async () => {
  await withServer(successfulRepository, async (port) => {
    const result = await request(port, "/api/content/v1/news?fields=external_id", { origin: undefined });
    assert.equal(result.status, 403);
    assert.equal(result.json.error, "missing_origin");
  });
});

test("rejects a foreign Origin and an unexpected Host", async () => {
  await withServer(successfulRepository, async (port) => {
    const foreignOrigin = await request(port, "/api/content/v1/news?fields=external_id", { origin: "https://evil.test" });
    assert.equal(foreignOrigin.status, 403);
    assert.equal(foreignOrigin.json.error, "forbidden_origin");

    const foreignHost = await request(port, "/api/content/v1/news?fields=external_id", { host: "evil.test" });
    assert.equal(foreignHost.status, 403);
    assert.equal(foreignHost.json.error, "forbidden_host");
  });
});

test("accepts a valid CORS preflight only for the allowlisted origin", async () => {
  await withServer(successfulRepository, async (port) => {
    const result = await request(port, "/api/content/v1/news?fields=external_id", { method: "OPTIONS" });
    assert.equal(result.status, 204);
    assert.equal(result.headers["access-control-allow-origin"], "https://site.test");
  });
});

test("reports invalid client input as a 400 without invoking the repository", async () => {
  await withServer(successfulRepository, async (port, seen) => {
    const result = await request(port, "/api/content/v1/news?fields=password_hash");
    assert.equal(result.status, 400);
    assert.equal(result.json.error, "unsupported_field");
    assert.deepEqual(seen, []);
  });
});

test("returns an opaque availability error for backend failures", async () => {
  await withServer(
    { async read() { throw new Error("mysql://user:secret@db.test was unavailable"); }, async readNewsCalendar() { throw new Error("mysql://user:secret@db.test was unavailable"); } },
    async (port) => {
      const result = await request(port, "/api/content/v1/news?fields=external_id");
      assert.equal(result.status, 503);
      assert.deepEqual(result.json, { ok: false, error: "content_backend_unavailable" });
      assert.doesNotMatch(result.raw, /secret|mysql/);
    },
  );
});

test("health check is host-gated but does not require an Origin", async () => {
  await withServer(successfulRepository, async (port) => {
    const result = await request(port, "/healthz", { origin: undefined });
    assert.equal(result.status, 200);
    assert.deepEqual(result.json, { ok: true });
  });
});

function listen(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

function request(
  port: number,
  path: string,
  options: { method?: string; host?: string; origin?: string | undefined } = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; raw: string; json: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { Host: options.host ?? "content.test" };
    if (options.origin !== undefined) headers.Origin = options.origin ?? "https://site.test";
    else if (!("origin" in options)) headers.Origin = "https://site.test";
    const request = http.request({ host: "127.0.0.1", port, path, method: options.method ?? "GET", headers }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { raw += chunk; });
      response.on("end", () => {
        try {
          resolve({ status: response.statusCode ?? 0, headers: response.headers, raw, json: (raw ? JSON.parse(raw) : {}) as Record<string, unknown> });
        } catch (error) {
          reject(error);
        }
      });
    });
    request.once("error", reject);
    request.end();
  });
}
