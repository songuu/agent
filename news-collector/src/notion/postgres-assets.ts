import { createHash } from "node:crypto";

import {
  contentAssetPublicUrl,
  isPublicAssetContentType,
  PUBLIC_ASSET_BUCKET,
  type PublicAssetContentType,
} from "../../../scripts/content-api/assets.ts";
import type { PostgresConnectionConfig } from "../data/repository-config.ts";
import type { DownloadedImage } from "./assets.ts";

export interface PostgresAssetStore {
  upload(key: string, image: DownloadedImage): Promise<string>;
  close(): Promise<void>;
}

interface PgPool {
  query(statement: string, values?: readonly unknown[]): Promise<unknown>;
  end(): Promise<void>;
}

interface PgModule {
  Pool: new (options: {
    readonly connectionString: string;
    readonly ssl?: { readonly rejectUnauthorized: true };
    readonly max: number;
    readonly idleTimeoutMillis: number;
    readonly application_name: string;
  }) => PgPool;
}

/**
 * Stores public Notion images in PostgreSQL rather than in an external object
 * service. The stable URL is served by the same-origin Content API.
 */
export async function openPostgresAssetStore(options: {
  readonly postgres: PostgresConnectionConfig;
  readonly publicBaseUrl: string;
}): Promise<PostgresAssetStore> {
  // Validate configuration before creating a pool so a typo cannot make a sync
  // partially write article rows with unusable asset URLs.
  contentAssetPublicUrl(options.publicBaseUrl, PUBLIC_ASSET_BUCKET, "probe");

  const moduleName = "pg";
  let pg: PgModule;
  try {
    pg = await import(moduleName) as unknown as PgModule;
  } catch (error) {
    throw new Error(
      `PostgreSQL Notion asset store requires pg: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const pool = new pg.Pool({
    connectionString: options.postgres.url,
    ssl: options.postgres.ssl ? { rejectUnauthorized: true } : undefined,
    max: 3,
    idleTimeoutMillis: 30_000,
    application_name: "agent-build-notion-assets",
  });

  return {
    async upload(key, image) {
      assertSafeObjectKey(key);
      const contentType = normalizeContentType(image.contentType);
      const data = Buffer.from(image.bytes);
      const sha256 = createHash("sha256").update(data).digest("hex");
      await pool.query(
        [
          'INSERT INTO "content_assets"',
          '("bucket", "object_key", "content_type", "data", "byte_size", "sha256", "updated_at")',
          'VALUES ($1, $2, $3, $4, $5, $6, now())',
          'ON CONFLICT ("bucket", "object_key") DO UPDATE SET',
          '"content_type" = EXCLUDED."content_type",',
          '"data" = EXCLUDED."data",',
          '"byte_size" = EXCLUDED."byte_size",',
          '"sha256" = EXCLUDED."sha256",',
          '"updated_at" = now()',
        ].join(" "),
        [PUBLIC_ASSET_BUCKET, key, contentType, data, data.byteLength, sha256],
      );
      return contentAssetPublicUrl(options.publicBaseUrl, PUBLIC_ASSET_BUCKET, key);
    },
    close: async () => pool.end(),
  };
}

function normalizeContentType(value: string): PublicAssetContentType {
  const normalized = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (!isPublicAssetContentType(normalized)) {
    throw new Error(`Unsupported Notion asset content type: ${normalized || "(empty)"}`);
  }
  return normalized;
}

function assertSafeObjectKey(value: string): void {
  const segments = value.split("/");
  if (
    !value ||
    segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\\u0000-\u001f\u007f]/.test(segment))
  ) {
    throw new Error("Notion asset key is unsafe.");
  }
}
