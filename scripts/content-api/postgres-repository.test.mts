import assert from "node:assert/strict";
import test from "node:test";

import type { ContentReadRequest } from "./contract.ts";
import {
  createPostgresContentReadRepository,
  type PostgresQueryExecutor,
} from "./postgres-repository.ts";
import {
  loadContentBackendConfig,
  openContentReadRepository,
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

test("PostgreSQL Content API uses positional parameters and native values", async () => {
  const calls: Array<{ sql: string; values: readonly unknown[] }> = [];
  const executor: PostgresQueryExecutor = {
    async execute(sql, values) {
      calls.push({ sql, values });
      if (sql.startsWith("SELECT COUNT")) return [{ total_count: "9" }];
      return [{ external_id: "one", title: "One", tags: ["ai"] }];
    },
  };

  const page = await createPostgresContentReadRepository(executor).read(request);

  assert.match(
    calls[0]?.sql ?? "",
    /FROM "news_items" WHERE "ecosystem_layer" = \$1 ORDER BY "published_date" DESC LIMIT \$2 OFFSET \$3/,
  );
  assert.deepEqual(calls[0]?.values, ["framework", 2, 4]);
  assert.match(
    calls[1]?.sql ?? "",
    /^SELECT COUNT\(\*\) AS total_count FROM "news_items" WHERE "ecosystem_layer" = \$1$/,
  );
  assert.deepEqual(page.items, [{ external_id: "one", title: "One", tags: ["ai"] }]);
  assert.equal(page.totalCount, 9);
  assert.equal(page.hasMore, true);
});

test("PostgreSQL news calendar groups date and layer before data leaves the database", async () => {
  const calls: Array<{ sql: string; values: readonly unknown[] }> = [];
  const repository = createPostgresContentReadRepository({
    async execute(sql, values) {
      calls.push({ sql, values });
      if (sql.includes("to_char")) {
        return [{ date: "2026-07-30", ecosystem_layer: "model-platform", article_count: 20 }];
      }
      if (sql.includes('GROUP BY "ecosystem_layer"')) {
        return [{ ecosystem_layer: "model-platform", source_count: 3 }];
      }
      if (sql.includes('COUNT(DISTINCT "source_name")')) return [{ source_count: 8 }];
      return [];
    },
  });

  assert.deepEqual(await repository.readNewsCalendar(), {
    buckets: [{ date: "2026-07-30", ecosystemLayer: "model-platform", articleCount: 20 }],
    sourceCounts: [
      { ecosystemLayer: "all", sourceCount: 8 },
      { ecosystemLayer: "model-platform", sourceCount: 3 },
    ],
  });
  assert.match(calls[0]?.sql ?? "", /to_char\("collected_date", 'YYYY-MM-DD'\)/);
  assert.match(calls[0]?.sql ?? "", /GROUP BY "collected_date", "ecosystem_layer"/);
  assert.deepEqual(calls[0]?.values, []);
});
test("Content API uses PostgreSQL read credentials and accepts an injected executor", async () => {
  const config = loadContentBackendConfig({
    CONTENT_REPOSITORY_DRIVER: "postgres",
    CONTENT_POSTGRES_READ_URL: "postgresql://reader:private-password@127.0.0.1:5432/agent_build",
    CONTENT_POSTGRES_WRITE_URL: "postgresql://writer:different-password@127.0.0.1:5432/agent_build",
  });
  assert.deepEqual(config, {
    driver: "postgres",
    postgres: {
      url: "postgresql://reader:private-password@127.0.0.1:5432/agent_build",
      ssl: false,
    },
  });
  assert.ok(config);

  const executor: PostgresQueryExecutor = { async execute() { return []; } };
  const handle = await openContentReadRepository(config, { postgresExecutor: executor });
  const page = await handle.repository.read({ ...request, includeTotal: false });
  assert.deepEqual(page.items, []);
  await handle.close();
});
