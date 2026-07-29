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

test("PostgreSQL-only content repository policy refuses Supabase fallback", () => {
  assert.deepEqual(
    loadContentRepositoryConfig({
      CONTENT_REPOSITORY_POSTGRES_ONLY: "true",
      CONTENT_POSTGRES_WRITE_URL: "postgresql://writer:private-password@127.0.0.1:5432/agent_build",
      CONTENT_POSTGRES_SSL: "true",
    }),
    {
      driver: "postgres",
      postgres: {
        url: "postgresql://writer:private-password@127.0.0.1:5432/agent_build",
        ssl: true,
      },
    },
  );

  assert.throws(
    () =>
      loadContentRepositoryConfig({
        CONTENT_REPOSITORY_POSTGRES_ONLY: "true",
        SUPABASE_URL: "https://supabase.test",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      }),
    /CONTENT_REPOSITORY_POSTGRES_ONLY=true/,
  );

  assert.throws(
    () =>
      loadContentRepositoryConfig({
        CONTENT_REPOSITORY_POSTGRES_ONLY: "true",
        CONTENT_REPOSITORY_DRIVER: "mysql",
        CONTENT_MYSQL_HOST: "mysql.internal",
        CONTENT_MYSQL_DATABASE: "agent_build",
        CONTENT_MYSQL_USER: "collector",
        CONTENT_MYSQL_PASSWORD: "private-password",
      }),
    /CONTENT_REPOSITORY_POSTGRES_ONLY=true/,
  );
});

test("PostgreSQL writer config rejects Supabase backing database URLs", () => {
  assert.throws(
    () =>
      loadContentRepositoryConfig({
        CONTENT_REPOSITORY_DRIVER: "postgres",
        CONTENT_POSTGRES_WRITE_URL: "postgresql://writer:private-password@supabase-db.internal:5432/agent_build",
        SUPABASE_DB_URL: "postgresql://writer:private-password@supabase-db.internal:5432/agent_build?sslmode=require",
      }),
    /not SUPABASE_DB_URL or the Supabase backing database/,
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
