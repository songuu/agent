import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import type { ContentReadRepository, ContentReadRequest } from "./contract.ts";
import { createContentApiServer } from "./server.ts";

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
};

test("serves a validated public content page without database details", async () => {
  await withServer(successfulRepository, async (port, seen) => {
    const result = await request(port, "/api/content/v1/news?fields=external_id,title&filter=external_id:eq:one");
    assert.equal(result.status, 200);
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
    { async read() { throw new Error("mysql://user:secret@db.test was unavailable"); } },
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