import { stableTableHash } from "./manifest.ts";
import { parseContentRangeTotal, readAllTableRows, supabaseRestUrl } from "./rest.ts";
import { rewriteNotionArticleStorageUrls, type StorageVerification, verifyNotionAssets } from "./storage.ts";
import type { FetchLike, MigrationProfile, Row, TableManifest } from "./types.ts";

export interface TableVerification {
  readonly table: string;
  readonly conflictKey: string;
  readonly keyFields: readonly string[];
  readonly sourceCount: number;
  readonly targetCount: number;
  readonly sourceHash: string;
  readonly targetHash: string;
  readonly expectedAnonCount: number;
  readonly targetAnonCount: number;
  readonly serviceRoleMatch: boolean;
  readonly anonReadMatch: boolean;
  readonly passed: boolean;
}

export interface MigrationVerification {
  readonly tables: readonly TableVerification[];
  readonly storage: StorageVerification;
  readonly passed: boolean;
}

function anonHeaders(profile: MigrationProfile): Record<string, string> {
  return {
    apikey: profile.anonKey,
    Authorization: `Bearer ${profile.anonKey}`,
    "Accept-Profile": profile.schema,
    Prefer: "count=exact",
    Range: "0-0",
  };
}

/**
 * This deliberately does not reuse service-role reads. It verifies the
 * browser-facing RLS contract through the target anon key for every table.
 */
export async function readTargetAnonCount(options: {
  readonly target: MigrationProfile;
  readonly manifest: TableManifest;
  readonly fetch: FetchLike;
}): Promise<number> {
  const response = await options.fetch(
    supabaseRestUrl(options.target, options.manifest.table, { select: options.manifest.conflictKey }),
    { method: "GET", headers: anonHeaders(options.target) },
  );
  if (!response.ok) {
    throw new Error(`Anon read target public.${options.manifest.table} failed with HTTP ${response.status}.`);
  }
  const total = parseContentRangeTotal(response.headers.get("content-range"));
  if (total === null) throw new Error(`Anon read target public.${options.manifest.table} did not return an exact count.`);
  return total;
}

function expectedAnonCount(manifest: TableManifest, sourceRows: readonly Row[]): number {
  // The repository migration grants anon access to every row in four tables,
  // but intentionally exposes only published Notion articles.
  if (manifest.table === "notion_articles") {
    return sourceRows.filter((row) => row.status === "published").length;
  }
  return sourceRows.length;
}

export async function verifyTable(options: {
  readonly source: MigrationProfile;
  readonly target: MigrationProfile;
  readonly manifest: TableManifest;
  readonly fetch: FetchLike;
  readonly sourceRows?: readonly Row[];
  readonly targetRows?: readonly Row[];
}): Promise<TableVerification> {
  const sourceRows = options.sourceRows
    ? [...options.sourceRows]
    : await readAllTableRows({ profile: options.source, manifest: options.manifest, fetch: options.fetch });
  const targetRows = options.targetRows
    ? [...options.targetRows]
    : await readAllTableRows({ profile: options.target, manifest: options.manifest, fetch: options.fetch });
  const targetAnonCount = await readTargetAnonCount({
    target: options.target,
    manifest: options.manifest,
    fetch: options.fetch,
  });
  // Copy rewrites Notion asset hosts before upsert, so compare target rows to
  // the rewritten source expectation rather than the source's old host names.
  const expectedSourceRows =
    options.manifest.table === "notion_articles"
      ? sourceRows.map((row) => rewriteNotionArticleStorageUrls(row, options.source, options.target))
      : sourceRows;
  const sourceHash = stableTableHash(options.manifest, expectedSourceRows);
  const targetHash = stableTableHash(options.manifest, targetRows);
  const sourceCount = sourceRows.length;
  const targetCount = targetRows.length;
  const expectedVisible = expectedAnonCount(options.manifest, sourceRows);
  const serviceRoleMatch = sourceCount === targetCount && sourceHash === targetHash;
  const anonReadMatch = targetAnonCount === expectedVisible;

  return {
    table: options.manifest.table,
    conflictKey: options.manifest.conflictKey,
    keyFields: options.manifest.keyFields,
    sourceCount,
    targetCount,
    sourceHash,
    targetHash,
    expectedAnonCount: expectedVisible,
    targetAnonCount,
    serviceRoleMatch,
    anonReadMatch,
    passed: serviceRoleMatch && anonReadMatch,
  };
}

export async function verifyMigration(options: {
  readonly source: MigrationProfile;
  readonly target: MigrationProfile;
  readonly manifests: readonly TableManifest[];
  readonly fetch: FetchLike;
}): Promise<MigrationVerification> {
  const tables: TableVerification[] = [];
  for (const manifest of options.manifests) {
    tables.push(
      await verifyTable({
        source: options.source,
        target: options.target,
        manifest,
        fetch: options.fetch,
      }),
    );
  }
  const storage = await verifyNotionAssets({ source: options.source, target: options.target, fetch: options.fetch });
  return { tables, storage, passed: tables.every((table) => table.passed) && storage.passed };
}
