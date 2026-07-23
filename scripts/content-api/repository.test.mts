import assert from "node:assert/strict";
import test from "node:test";

import type { ContentReadRequest } from "./contract.ts";
import {
  createMysqlContentReadRepository,
  createSupabaseContentReadRepository,
  loadContentBackendConfig,
  openContentReadRepository,
  openMysql2Executor,
  type MysqlQueryExecutor,
} from "./repository.ts";

const request: ContentReadRequest = {
  resource: "news",
  fields: ["external_id", "title", "tags"],
  filters: [{ field: "ecosystem_layer", operator: "eq", value: "framework" }],
  sort: [{ field: "published_date", direction: "desc" }],
  limit: 2,
  offset: 4,
  includeTotal: true,
};

test("Supabase repository converts only validated request parts to PostgREST", async () => {
  let calledUrl = "";
  let calledHeaders: Record<string, string> = {};
  const repository = createSupabaseContentReadRepository(
    { driver: "supabase", url: "https://supabase.test/", serviceRoleKey: "service-role", schema: "public" },
    async (url, init) => {
      calledUrl = url;
      calledHeaders = init?.headers as Record<string, string>;
      return response([{ external_id: "one", title: "One", tags: ["ai"] }], { "content-range": "4-4/9" });
    },
  );

  const page = await repository.read(request);
  const url = new URL(calledUrl);
  assert.equal(url.pathname, "/rest/v1/news_items");
  assert.equal(url.searchParams.get("select"), "external_id,title,tags");
  assert.equal(url.searchParams.get("ecosystem_layer"), "eq.framework");
  assert.equal(url.searchParams.get("order"), "published_date.desc");
  assert.equal(url.searchParams.get("limit"), "2");
  assert.equal(url.searchParams.get("offset"), "4");
  assert.equal(calledHeaders.apikey, "service-role");
  assert.equal(calledHeaders.Prefer, "count=exact");
  assert.equal(page.totalCount, 9);
  assert.equal(page.hasMore, true);
});

test("Supabase repository omits exact count when requested", async () => {
  let headers: Record<string, string> = {};
  const repository = createSupabaseContentReadRepository(
    { driver: "supabase", url: "https://supabase.test", serviceRoleKey: "service-role", schema: "public" },
    async (_url, init) => {
      headers = init?.headers as Record<string, string>;
      return response([{ external_id: "one" }]);
    },
  );
  const page = await repository.read({ ...request, includeTotal: false });
  assert.equal(headers.Prefer, undefined);
  assert.equal(page.totalCount, null);
  assert.equal(page.hasMore, false);
});

test("Supabase repository rejects a non-array backend payload", async () => {
  const repository = createSupabaseContentReadRepository(
    { driver: "supabase", url: "https://supabase.test", serviceRoleKey: "service-role", schema: "public" },
    async () => response({ external_id: "one" }),
  );
  await assert.rejects(() => repository.read(request), /non-array payload/);
});

test("MySQL repository parameterizes values and normalizes JSON columns", async () => {
  const calls: Array<{ sql: string; values: readonly unknown[] }> = [];
  const executor: MysqlQueryExecutor = {
    async execute(sql, values) {
      calls.push({ sql, values });
      if (sql.startsWith("SELECT COUNT")) return [{ total_count: "9" }];
      return [{ external_id: "one", title: "One", tags: '["ai"]' }];
    },
  };
  const page = await createMysqlContentReadRepository(executor).read(request);

  assert.match(calls[0]?.sql ?? "", /FROM `news_items` WHERE `ecosystem_layer` = \? ORDER BY `published_date` DESC LIMIT \? OFFSET \?/);
  assert.deepEqual(calls[0]?.values, ["framework", 2, 4]);
  assert.match(calls[1]?.sql ?? "", /^SELECT COUNT\(\*\) AS total_count FROM `news_items` WHERE `ecosystem_layer` = \?$/);
  assert.deepEqual(calls[1]?.values, ["framework"]);
  assert.deepEqual(page.items, [{ external_id: "one", title: "One", tags: ["ai"] }]);
  assert.equal(page.totalCount, 9);
  assert.equal(page.hasMore, true);
});

test("MySQL repository does not issue a count query for bounded previews", async () => {
  let count = 0;
  const repository = createMysqlContentReadRepository({
    async execute() {
      count += 1;
      return [];
    },
  });
  const page = await repository.read({ ...request, includeTotal: false });
  assert.equal(count, 1);
  assert.equal(page.totalCount, null);
  assert.equal(page.hasMore, false);
});

test("backend config accepts one MySQL URL for both API and workers, plus the Supabase fallback", () => {
  assert.deepEqual(
    loadContentBackendConfig({ CONTENT_REPOSITORY_DRIVER: "mysql", CONTENT_MYSQL_URL: "mysql://user:pass@db.test:3306/content" }),
    {
      driver: "mysql",
      mysql: { host: "db.test", port: 3306, database: "content", user: "user", password: "pass", ssl: false },
    },
  );
  assert.deepEqual(loadContentBackendConfig({ SUPABASE_URL: "https://supabase.test", SUPABASE_SERVICE_ROLE_KEY: "key" }), {
    driver: "supabase",
    url: "https://supabase.test",
    serviceRoleKey: "key",
    schema: "public",
  });
});

test("backend config fails closed for incomplete credentials", () => {
  assert.throws(
    () => loadContentBackendConfig({ CONTENT_REPOSITORY_DRIVER: "supabase", SUPABASE_URL: "https://supabase.test" }),
    /requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/,
  );
  assert.throws(
    () => loadContentBackendConfig({ CONTENT_REPOSITORY_DRIVER: "mysql", CONTENT_MYSQL_URL: "https://db.test/content" }),
    /must be a mysql:\/\/ URL/,
  );
});

test("mysql2 bridge loads the installed driver without making a database request", async () => {
  const executor = await openMysql2Executor({
    host: "127.0.0.1",
    port: 3306,
    database: "content",
    user: "user",
    password: "pass",
    ssl: false,
  });
  await executor.close?.();
});
test("repository opener accepts an injected MySQL executor without loading the driver", async () => {
  const executor: MysqlQueryExecutor = { async execute() { return []; } };
  const handle = await openContentReadRepository(
    {
      driver: "mysql",
      mysql: { host: "db.test", port: 3306, database: "content", user: "user", password: "pass", ssl: false },
    },
    { mysqlExecutor: executor },
  );
  const page = await handle.repository.read({ ...request, includeTotal: false });
  assert.deepEqual(page.items, []);
  await handle.close();
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