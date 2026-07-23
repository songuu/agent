import { createHash } from "node:crypto";

import type { FetchLike, FetchResponse, MigrationProfile, Row } from "./types.ts";

interface BucketInfo {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly public?: unknown;
}

interface StorageListEntry {
  readonly name?: unknown;
  readonly id?: unknown;
  readonly metadata?: unknown;
}

export interface StorageObject {
  readonly path: string;
  readonly contentType: string | null;
}

export interface StorageCopyResult {
  readonly bucket: "notion-assets";
  readonly sourcePublic: true;
  readonly targetCreated: boolean;
  readonly copiedObjects: number;
}

function encodedPath(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function storageUrl(profile: MigrationProfile, path: string): string {
  return `${profile.url}/storage/v1/${path}`;
}

function storageHeaders(profile: MigrationProfile): Record<string, string> {
  return {
    apikey: profile.serviceRoleKey,
    Authorization: `Bearer ${profile.serviceRoleKey}`,
  };
}

async function parseJson(response: FetchResponse, context: string): Promise<unknown> {
  if (!response.ok) throw new Error(`${context} failed with HTTP ${response.status}.`);
  try {
    return JSON.parse(await response.text());
  } catch {
    throw new Error(`${context} returned invalid JSON.`);
  }
}

async function getBucket(profile: MigrationProfile, fetch: FetchLike): Promise<BucketInfo | null> {
  const response = await fetch(storageUrl(profile, `bucket/${encodeURIComponent(profile.storageBucket)}`), {
    method: "GET",
    headers: storageHeaders(profile),
  });
  if (response.status === 404) return null;
  const payload = await parseJson(response, `Read ${profile.name} Storage bucket ${profile.storageBucket}`);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Read ${profile.name} Storage bucket ${profile.storageBucket} returned an invalid bucket payload.`);
  }
  return payload as BucketInfo;
}

async function ensureTargetBucket(
  source: MigrationProfile,
  target: MigrationProfile,
  fetch: FetchLike,
): Promise<boolean> {
  const sourceBucket = await getBucket(source, fetch);
  if (!sourceBucket) {
    throw new Error(`Source Storage bucket ${source.storageBucket} does not exist; no object copy was attempted.`);
  }
  if (sourceBucket.public !== true) {
    throw new Error(`Source Storage bucket ${source.storageBucket} is not public; cannot preserve its public URL contract.`);
  }

  const targetBucket = await getBucket(target, fetch);
  if (!targetBucket) {
    const response = await fetch(storageUrl(target, "bucket"), {
      method: "POST",
      headers: { ...storageHeaders(target), "Content-Type": "application/json" },
      body: JSON.stringify({ id: target.storageBucket, name: target.storageBucket, public: true }),
    });
    if (!response.ok) throw new Error(`Create target Storage bucket ${target.storageBucket} failed with HTTP ${response.status}.`);
    return true;
  }

  if (targetBucket.public !== true) {
    const response = await fetch(storageUrl(target, `bucket/${encodeURIComponent(target.storageBucket)}`), {
      method: "PUT",
      headers: { ...storageHeaders(target), "Content-Type": "application/json" },
      body: JSON.stringify({ public: true }),
    });
    if (!response.ok) throw new Error(`Make target Storage bucket ${target.storageBucket} public failed with HTTP ${response.status}.`);
  }
  return false;
}

function normalizeStoragePath(value: string): string {
  const path = value.replace(/^\/+|\/+$/g, "");
  const segments = path.split("/");
  if (!path || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Storage list returned an unsafe object path.");
  }
  return path;
}

function joinStoragePath(prefix: string, name: string): string {
  return normalizeStoragePath(prefix ? `${prefix}/${name}` : name);
}

function listEntryIsFolder(entry: StorageListEntry): boolean {
  // Storage's list endpoint represents a folder with no object id. Object
  // metadata may be null for older uploads, so id is the authoritative probe.
  return entry.id === null || (entry.id === undefined && (entry.metadata === null || entry.metadata === undefined));
}

async function listPrefix(options: {
  readonly profile: MigrationProfile;
  readonly fetch: FetchLike;
  readonly prefix: string;
  readonly pageSize: number;
  readonly offset: number;
}): Promise<StorageListEntry[]> {
  const response = await options.fetch(storageUrl(options.profile, `object/list/${encodeURIComponent(options.profile.storageBucket)}`), {
    method: "POST",
    headers: { ...storageHeaders(options.profile), "Content-Type": "application/json" },
    body: JSON.stringify({
      prefix: options.prefix,
      limit: options.pageSize,
      offset: options.offset,
      sortBy: { column: "name", order: "asc" },
    }),
  });
  const payload = await parseJson(response, `List ${options.profile.name} Storage bucket ${options.profile.storageBucket}`);
  if (!Array.isArray(payload)) throw new Error("Storage list returned an invalid object list.");
  return payload as StorageListEntry[];
}

/** Recursive Storage listing; source keys are retained verbatim for idempotent target uploads. */
export async function listStorageObjects(options: {
  readonly profile: MigrationProfile;
  readonly fetch: FetchLike;
  readonly pageSize?: number;
}): Promise<StorageObject[]> {
  const pageSize = options.pageSize ?? 1000;
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error("storage pageSize must be a positive integer.");
  const objects = new Map<string, StorageObject>();
  const visitedPrefixes = new Set<string>();

  const walk = async (prefix: string): Promise<void> => {
    if (visitedPrefixes.has(prefix)) return;
    visitedPrefixes.add(prefix);
    let offset = 0;
    while (true) {
      const entries = await listPrefix({ ...options, prefix, pageSize, offset });
      for (const rawEntry of entries) {
        if (typeof rawEntry.name !== "string" || rawEntry.name.length === 0) {
          throw new Error("Storage list returned an entry without a name.");
        }
        const path = joinStoragePath(prefix, rawEntry.name);
        if (listEntryIsFolder(rawEntry)) {
          await walk(path);
          continue;
        }
        const metadata = rawEntry.metadata && typeof rawEntry.metadata === "object" ? (rawEntry.metadata as Row) : {};
        objects.set(path, {
          path,
          contentType: typeof metadata.mimetype === "string" ? metadata.mimetype : null,
        });
      }
      if (entries.length < pageSize) break;
      offset += entries.length;
    }
  };

  await walk("");
  return [...objects.values()].sort((left, right) => left.path.localeCompare(right.path));
}

async function downloadStorageObject(
  profile: MigrationProfile,
  object: StorageObject,
  fetch: FetchLike,
): Promise<{ readonly bytes: ArrayBuffer; readonly contentType: string }> {
  const response = await fetch(
    storageUrl(profile, `object/${encodeURIComponent(profile.storageBucket)}/${encodedPath(object.path)}`),
    { method: "GET", headers: storageHeaders(profile) },
  );
  if (!response.ok) throw new Error(`Download source Storage object failed with HTTP ${response.status}.`);
  if (!response.arrayBuffer) throw new Error("Download source Storage object did not provide binary data.");
  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? object.contentType ?? "application/octet-stream",
  };
}

async function uploadStorageObject(
  profile: MigrationProfile,
  object: StorageObject,
  bytes: ArrayBuffer,
  contentType: string,
  fetch: FetchLike,
): Promise<void> {
  const response = await fetch(
    storageUrl(profile, `object/${encodeURIComponent(profile.storageBucket)}/${encodedPath(object.path)}`),
    {
      method: "POST",
      headers: {
        ...storageHeaders(profile),
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: bytes,
    },
  );
  if (!response.ok) throw new Error(`Upload target Storage object failed with HTTP ${response.status}.`);
}

/** Ensures public bucket parity, then recursively copies every object with x-upsert for retry safety. */
export async function copyNotionAssets(options: {
  readonly source: MigrationProfile;
  readonly target: MigrationProfile;
  readonly fetch: FetchLike;
  readonly pageSize?: number;
}): Promise<StorageCopyResult> {
  const targetCreated = await ensureTargetBucket(options.source, options.target, options.fetch);
  const objects = await listStorageObjects({
    profile: options.source,
    fetch: options.fetch,
    pageSize: options.pageSize,
  });
  for (const object of objects) {
    const downloaded = await downloadStorageObject(options.source, object, options.fetch);
    await uploadStorageObject(options.target, object, downloaded.bytes, downloaded.contentType, options.fetch);
  }
  return {
    bucket: options.source.storageBucket,
    sourcePublic: true,
    targetCreated,
    copiedObjects: objects.length,
  };
}

function publicStorageUrlPrefixFor(baseUrl: string, bucket: string): string {
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
}

/** Service and browser origins can differ; both exact source public prefixes are portable. */
export function publicStorageUrlPrefixes(profile: MigrationProfile): readonly string[] {
  return [...new Set([profile.url, profile.publicUrl].map((baseUrl) => publicStorageUrlPrefixFor(baseUrl, profile.storageBucket)))];
}

export function publicStorageUrlPrefix(profile: MigrationProfile): string {
  return publicStorageUrlPrefixes(profile)[0]!;
}

/**
 * Only either exact source project's public-object prefix is changed. Similar
 * hostnames, another bucket, and arbitrary external URLs stay byte-for-byte
 * unchanged.
 */
export function rewriteStoragePublicUrl(value: string, source: MigrationProfile, target: MigrationProfile): string {
  const targetPrefix = publicStorageUrlPrefixFor(target.publicUrl, target.storageBucket);
  return publicStorageUrlPrefixes(source).reduce((rewritten, sourcePrefix) => rewritten.split(sourcePrefix).join(targetPrefix), value);
}

export function rewriteStorageUrlsDeep(value: unknown, source: MigrationProfile, target: MigrationProfile): unknown {
  if (typeof value === "string") return rewriteStoragePublicUrl(value, source, target);
  if (Array.isArray(value)) return value.map((item) => rewriteStorageUrlsDeep(item, source, target));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Row).map(([key, nested]) => [key, rewriteStorageUrlsDeep(nested, source, target)]),
    );
  }
  return value;
}

/** Rewrites only fields where Notion stores durable asset links. */
export function rewriteNotionArticleStorageUrls(row: Row, source: MigrationProfile, target: MigrationProfile): Row {
  return {
    ...row,
    body_markdown:
      typeof row.body_markdown === "string" ? rewriteStoragePublicUrl(row.body_markdown, source, target) : row.body_markdown,
    cover_image_url:
      typeof row.cover_image_url === "string" ? rewriteStoragePublicUrl(row.cover_image_url, source, target) : row.cover_image_url,
    metadata: rewriteStorageUrlsDeep(row.metadata, source, target),
  };
}
export interface StorageVerification {
  readonly sourceCount: number;
  readonly targetCount: number;
  /** SHA-256 over the sorted object-key set; detects omitted/extra assets without serializing content. */
  readonly sourcePathHash: string;
  readonly targetPathHash: string;
  readonly passed: boolean;
}

export function stableStoragePathHash(objects: readonly StorageObject[]): string {
  const paths = [...new Set(objects.map((object) => object.path))].sort((left, right) => left.localeCompare(right));
  return createHash("sha256").update(JSON.stringify(paths)).digest("hex");
}

/** Read-only post-copy check for the notion-assets key set on both projects. */
export async function verifyNotionAssets(options: {
  readonly source: MigrationProfile;
  readonly target: MigrationProfile;
  readonly fetch: FetchLike;
  readonly pageSize?: number;
}): Promise<StorageVerification> {
  const [sourceObjects, targetObjects] = await Promise.all([
    listStorageObjects({ profile: options.source, fetch: options.fetch, pageSize: options.pageSize }),
    listStorageObjects({ profile: options.target, fetch: options.fetch, pageSize: options.pageSize }),
  ]);
  const sourcePathHash = stableStoragePathHash(sourceObjects);
  const targetPathHash = stableStoragePathHash(targetObjects);
  return {
    sourceCount: sourceObjects.length,
    targetCount: targetObjects.length,
    sourcePathHash,
    targetPathHash,
    passed: sourceObjects.length === targetObjects.length && sourcePathHash === targetPathHash,
  };
}
