import assert from "node:assert/strict";
import test from "node:test";

import { loadContentRepositoryConfig } from "../src/data/repository-config.ts";

test("PostgreSQL worker config requires an explicit private write URL", () => {
  assert.deepEqual(
    loadContentRepositoryConfig({
      CONTENT_REPOSITORY_DRIVER: "postgres",
      CONTENT_POSTGRES_WRITE_URL: "postgresql://writer:private-password@127.0.0.1:5432/agent_build",
      CONTENT_POSTGRES_SSL: "false",
    }),
    {
      driver: "postgres",
      postgres: {
        url: "postgresql://writer:private-password@127.0.0.1:5432/agent_build",
        ssl: false,
      },
    },
  );

  assert.throws(
    () => loadContentRepositoryConfig({
      CONTENT_REPOSITORY_DRIVER: "postgres",
      CONTENT_POSTGRES_READ_URL: "postgresql://reader:private-password@127.0.0.1:5432/agent_build",
    }),
    /CONTENT_POSTGRES_WRITE_URL/,
  );
});

test("PostgreSQL config rejects public or incomplete connection URLs", () => {
  assert.throws(
    () => loadContentRepositoryConfig({
      CONTENT_REPOSITORY_DRIVER: "postgres",
      CONTENT_POSTGRES_WRITE_URL: "https://127.0.0.1/agent_build",
    }),
    /must be a postgresql:\/\/ URL/,
  );
  assert.throws(
    () => loadContentRepositoryConfig({
      CONTENT_REPOSITORY_DRIVER: "postgres",
      CONTENT_POSTGRES_WRITE_URL: "postgresql://writer@127.0.0.1:5432/agent_build",
    }),
    /must be a postgresql:\/\/ URL/,
  );
});
