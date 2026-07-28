import { createHash } from "node:crypto";

import {
  contentAssetPublicUrl,
  isPublicAssetContentType,
  PUBLIC_ASSET_BUCKET,
} from "./content-api/assets.ts";

const CONFIRMATION = "MIGRATE_SUPABASE_STORAGE_TO_POSTGRES";

interface PgResult {
  readonly rows: readonly Record<string, unknown>[];
}

interface PgPool {
  query(statement: string, values?: readonly unknown[]): Promise<PgResult>;
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

interface SourceObject {
  readonly objectKey: string;
  readonly metadata: unknown;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

interface DownloadedObject extends SourceObject {
  readonly contentType: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
}

interface MigrationReport {
  readonly bucket: typeof PUBLIC_ASSET_BUCKET;
  readonly sourceObjects: number;
  readonly migratedObjects: number;
  readonly verifiedObjects: number;
  readonly rewrittenArticles: number;
  readonly rewrittenFields: number;
}

function usage(): string {
  return [
    "Usage: node --experimental-transform-types --env-file=<private-env> scripts/migrate-supabase-storage-to-postgres.ts --execute --confirm " + CONFIRMATION,
    "Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SOURCE_POSTGRES_URL, CONTENT_POSTGRES_WRITE_URL.",
    "Optional env: NEXT_PUBLIC_SUPABASE_URL, CONTENT_ASSET_PUBLIC_BASE_URL, NEXT_PUBLIC_CONTENT_API_BASE_URL, SOURCE_POSTGRES_SSL, CONTENT_POSTGRES_SSL.",
  ].join("\n");
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  if (/^(1|true|yes|on)$/i.test(value)) return true;
  if (/^(0|false|no|off)$/i.test(value)) return false;
  throw new Error(`${name} must be true or false.`);
}

function normalizeHttpOrigin(value: string, name: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute http(s) URL.`);
  }
  if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.username || parsed.password) {
    throw new Error(`${name} must be a credential-free http(s) URL.`);
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function assetPublicBaseUrl(): string {
  const apiBase = (process.env.NEXT_PUBLIC_CONTENT_API_BASE_URL ?? "/agent-build/api/content/v1").trim().replace(/\/+$/, "");
  const value = (process.env.CONTENT_ASSET_PUBLIC_BASE_URL ?? `${apiBase}/assets`).trim().replace(/\/+$/, "");
  if (!value.startsWith("/") || value.startsWith("//") || /[?#]/.test(value)) {
    throw new Error("CONTENT_ASSET_PUBLIC_BASE_URL must be a same-origin absolute path.");
  }
  return value;
}

function sourcePublicPrefixes(sourceOrigin: string): readonly string[] {
  const origins = [sourceOrigin, process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeHttpOrigin(value, "source Supabase URL"));
  return [...new Set(origins)].map((origin) => `${origin}/storage/v1/object/public/${PUBLIC_ASSET_BUCKET}/`);
}

function encodedObjectKey(key: string): string {
  const segments = key.split("/");
  if (!key || segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\"))) {
    throw new Error("Source Storage contains an unsafe object key.");
  }
  return segments.map(encodeURIComponent).join("/");
}

function readTimestamp(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return null;
}

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function loadPg(): Promise<PgModule> {
  try {
    return await import("pg") as unknown as PgModule;
  } catch (error) {
    throw new Error(`This migration requires pg: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function sourceObjects(source: PgPool): Promise<readonly SourceObject[]> {
  const bucket = await source.query(
    'SELECT "id", "public" FROM "storage"."buckets" WHERE "id" = $1 LIMIT 1',
    [PUBLIC_ASSET_BUCKET],
  );
  if (bucket.rows.length !== 1 || bucket.rows[0]?.public !== true) {
    throw new Error(`Source Storage bucket ${PUBLIC_ASSET_BUCKET} must exist and be public.`);
  }
  const result = await source.query(
    [
      'SELECT "name", "metadata", "created_at", "updated_at"',
      'FROM "storage"."objects"',
      'WHERE "bucket_id" = $1',
      'ORDER BY "name" ASC',
    ].join(" "),
    [PUBLIC_ASSET_BUCKET],
  );
  return result.rows.map((row) => {
    if (typeof row.name !== "string" || !row.name) throw new Error("Source Storage returned an invalid object key.");
    encodedObjectKey(row.name);
    return {
      objectKey: row.name,
      metadata: asMetadata(row.metadata),
      createdAt: readTimestamp(row.created_at),
      updatedAt: readTimestamp(row.updated_at),
    };
  });
}

async function downloadObject(options: {
  readonly sourceOrigin: string;
  readonly serviceRoleKey: string;
  readonly object: SourceObject;
}): Promise<DownloadedObject> {
  const response = await fetch(
    `${options.sourceOrigin}/storage/v1/object/${PUBLIC_ASSET_BUCKET}/${encodedObjectKey(options.object.objectKey)}`,
    {
      headers: {
        apikey: options.serviceRoleKey,
        Authorization: `Bearer ${options.serviceRoleKey}`,
      },
    },
  );
  if (!response.ok) throw new Error(`Download ${options.object.objectKey} failed with HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
    ?? (typeof asMetadata(options.object.metadata).mimetype === "string" ? String(asMetadata(options.object.metadata).mimetype) : "");
  if (!isPublicAssetContentType(contentType)) {
    throw new Error(`Source object ${options.object.objectKey} has unsupported content type: ${contentType || "(empty)"}.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return {
    ...options.object,
    contentType,
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function upsertObject(target: PgPool, object: DownloadedObject): Promise<void> {
  await target.query(
    [
      'INSERT INTO "content_assets"',
      '("bucket", "object_key", "content_type", "data", "byte_size", "sha256", "source_metadata", "source_created_at", "source_updated_at", "updated_at")',
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())',
      'ON CONFLICT ("bucket", "object_key") DO UPDATE SET',
      '"content_type" = EXCLUDED."content_type",',
      '"data" = EXCLUDED."data",',
      '"byte_size" = EXCLUDED."byte_size",',
      '"sha256" = EXCLUDED."sha256",',
      '"source_metadata" = EXCLUDED."source_metadata",',
      '"source_created_at" = EXCLUDED."source_created_at",',
      '"source_updated_at" = EXCLUDED."source_updated_at",',
      '"updated_at" = now()',
    ].join(" "),
    [
      PUBLIC_ASSET_BUCKET,
      object.objectKey,
      object.contentType,
      Buffer.from(object.bytes),
      object.bytes.byteLength,
      object.sha256,
      object.metadata,
      object.createdAt,
      object.updatedAt,
    ],
  );
}

async function verifyObjects(target: PgPool, source: readonly DownloadedObject[]): Promise<void> {
  const result = await target.query(
    'SELECT "object_key", "content_type", "data", "byte_size", "sha256" FROM "content_assets" WHERE "bucket" = $1 ORDER BY "object_key" ASC',
    [PUBLIC_ASSET_BUCKET],
  );
  if (result.rows.length !== source.length) throw new Error("Target content_assets object count does not match source.");
  const expected = new Map(source.map((object) => [object.objectKey, object]));
  for (const row of result.rows) {
    const key = row.object_key;
    if (typeof key !== "string" || !expected.has(key)) throw new Error("Target content_assets has an unexpected object key.");
    const sourceObject = expected.get(key)!;
    const data = row.data;
    if (!(data instanceof Uint8Array)) throw new Error(`Target asset ${key} is not binary.`);
    const byteSize = Number(row.byte_size);
    if (!Number.isSafeInteger(byteSize) || byteSize < 0) throw new Error(`Target asset ${key} has an invalid byte size.`);
    const hash = createHash("sha256").update(data).digest("hex");
    if (
      row.content_type !== sourceObject.contentType ||
      byteSize !== sourceObject.bytes.byteLength ||
      row.sha256 !== sourceObject.sha256 ||
      hash !== sourceObject.sha256
    ) {
      throw new Error(`Target asset verification failed for ${key}.`);
    }
  }
}

function rewriteValue(value: unknown, sourcePrefixes: readonly string[], targetPrefix: string): [unknown, number] {
  if (typeof value === "string") {
    let rewritten = value;
    for (const sourcePrefix of sourcePrefixes) rewritten = rewritten.split(sourcePrefix).join(targetPrefix);
    return [rewritten, rewritten === value ? 0 : 1];
  }
  if (Array.isArray(value)) {
    let changed = 0;
    return [value.map((item) => {
      const [rewritten, count] = rewriteValue(item, sourcePrefixes, targetPrefix);
      changed += count;
      return rewritten;
    }), changed];
  }
  if (value && typeof value === "object") {
    let changed = 0;
    return [Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      const [rewritten, count] = rewriteValue(item, sourcePrefixes, targetPrefix);
      changed += count;
      return [key, rewritten];
    })), changed];
  }
  return [value, 0];
}

function collectStoragePublicPrefixes(value: unknown, prefixes: Set<string>): void {
  if (typeof value === "string") {
    for (const match of value.matchAll(/https?:\/\/[^/]+\/storage\/v1\/object\/public\/notion-assets\//g)) {
      prefixes.add(match[0]);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStoragePublicPrefixes(item, prefixes);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) collectStoragePublicPrefixes(item, prefixes);
  }
}

async function rewriteNotionArticles(target: PgPool, sourcePrefixes: readonly string[], publicBaseUrl: string): Promise<{ articles: number; fields: number }> {
  const targetPrefix = contentAssetPublicUrl(publicBaseUrl, PUBLIC_ASSET_BUCKET, "");
  const result = await target.query(
    'SELECT "notion_page_id", "body_markdown", "cover_image_url", "metadata" FROM "notion_articles"',
  );
  // Existing rows can carry a public-domain alias different from the private
  // SUPABASE_URL used by the worker. Discover only this exact bucket's public
  // prefixes so historical assets are not silently left behind.
  const resolvedPrefixes = new Set(sourcePrefixes);
  for (const row of result.rows) {
    collectStoragePublicPrefixes(row.body_markdown, resolvedPrefixes);
    collectStoragePublicPrefixes(row.cover_image_url, resolvedPrefixes);
    collectStoragePublicPrefixes(row.metadata, resolvedPrefixes);
  }
  const prefixes = [...resolvedPrefixes];
  let articles = 0;
  let fields = 0;
  for (const row of result.rows) {
    if (typeof row.notion_page_id !== "string") throw new Error("notion_articles contains an invalid notion_page_id.");
    const [body, bodyCount] = rewriteValue(row.body_markdown, prefixes, targetPrefix);
    const [cover, coverCount] = rewriteValue(row.cover_image_url, prefixes, targetPrefix);
    const [metadata, metadataCount] = rewriteValue(row.metadata, prefixes, targetPrefix);
    const changed = bodyCount + coverCount + metadataCount;
    if (changed === 0) continue;
    await target.query(
      'UPDATE "notion_articles" SET "body_markdown" = $1, "cover_image_url" = $2, "metadata" = $3 WHERE "notion_page_id" = $4',
      [body, cover, metadata, row.notion_page_id],
    );
    articles += 1;
    fields += changed;
  }
  return { articles, fields };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!process.argv.includes("--execute") || process.argv.at(-1) !== CONFIRMATION || !process.argv.includes("--confirm")) {
    throw new Error(`Refusing to write. Use --execute --confirm ${CONFIRMATION}.`);
  }

  const sourceOrigin = normalizeHttpOrigin(requiredEnv("SUPABASE_URL"), "SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const publicBaseUrl = assetPublicBaseUrl();
  const pg = await loadPg();
  const source = new pg.Pool({
    connectionString: requiredEnv("SOURCE_POSTGRES_URL"),
    ssl: booleanEnv("SOURCE_POSTGRES_SSL", true) ? { rejectUnauthorized: true } : undefined,
    max: 2,
    idleTimeoutMillis: 30_000,
    application_name: "agent-build-source-storage-export",
  });
  const target = new pg.Pool({
    connectionString: requiredEnv("CONTENT_POSTGRES_WRITE_URL"),
    ssl: booleanEnv("CONTENT_POSTGRES_SSL", false) ? { rejectUnauthorized: true } : undefined,
    max: 2,
    idleTimeoutMillis: 30_000,
    application_name: "agent-build-storage-to-postgres",
  });

  try {
    const objects = await sourceObjects(source);
    const downloaded: DownloadedObject[] = [];
    for (const object of objects) {
      const value = await downloadObject({ sourceOrigin, serviceRoleKey, object });
      await upsertObject(target, value);
      downloaded.push(value);
    }
    await verifyObjects(target, downloaded);
    const rewritten = await rewriteNotionArticles(target, sourcePublicPrefixes(sourceOrigin), publicBaseUrl);
    const report: MigrationReport = {
      bucket: PUBLIC_ASSET_BUCKET,
      sourceObjects: objects.length,
      migratedObjects: downloaded.length,
      verifiedObjects: downloaded.length,
      rewrittenArticles: rewritten.articles,
      rewrittenFields: rewritten.fields,
    };
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } finally {
    await Promise.allSettled([source.end(), target.end()]);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Storage to PostgreSQL migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
