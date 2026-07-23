import { projectPortableRow } from "./manifest.ts";
import type { FetchLike, FetchResponse, MigrationProfile, Row, TableManifest } from "./types.ts";

export const DEFAULT_PAGE_SIZE = 500;
export const DEFAULT_UPSERT_BATCH_SIZE = 200;

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
}

function encodedPath(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

export function serviceHeaders(profile: MigrationProfile, profileHeader: "Accept-Profile" | "Content-Profile"): Record<string, string> {
  return {
    apikey: profile.serviceRoleKey,
    Authorization: `Bearer ${profile.serviceRoleKey}`,
    [profileHeader]: profile.schema,
  };
}

export function supabaseRestUrl(profile: MigrationProfile, table: string, parameters: Readonly<Record<string, string>> = {}): string {
  const url = new URL(`${profile.url}/rest/v1/${encodedPath(table)}`);
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  return url.toString();
}

export function parseContentRangeTotal(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function parseRows(response: FetchResponse, context: string): Promise<Row[]> {
  if (!response.ok) throw new Error(`${context} failed with HTTP ${response.status}.`);
  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    throw new Error(`${context} returned invalid JSON.`);
  }
  if (!Array.isArray(payload) || payload.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
    throw new Error(`${context} returned an unexpected row payload.`);
  }
  return payload as Row[];
}

/** Reads all portable source rows through service-role PostgREST pages. */
export async function readAllTableRows(options: {
  readonly profile: MigrationProfile;
  readonly manifest: TableManifest;
  readonly fetch: FetchLike;
  readonly pageSize?: number;
}): Promise<Row[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  assertPositiveInteger("pageSize", pageSize);

  const rows: Row[] = [];
  let offset = 0;
  let expectedTotal: number | null = null;

  while (true) {
    const response = await options.fetch(
      supabaseRestUrl(options.profile, options.manifest.table, {
        select: options.manifest.copyFields.join(","),
        order: `${options.manifest.conflictKey}.asc`,
      }),
      {
        method: "GET",
        headers: {
          ...serviceHeaders(options.profile, "Accept-Profile"),
          Prefer: "count=exact",
          Range: `${offset}-${offset + pageSize - 1}`,
        },
      },
    );
    const page = await parseRows(response, `Read source public.${options.manifest.table}`);
    const total = parseContentRangeTotal(response.headers.get("content-range"));
    if (total !== null) expectedTotal = total;
    rows.push(...page);

    if (page.length === 0 || page.length < pageSize) break;
    offset += page.length;
    if (expectedTotal !== null && offset >= expectedTotal) break;
  }

  return rows;
}

export function chunks<T>(values: readonly T[], size: number): T[][] {
  assertPositiveInteger("batchSize", size);
  const batches: T[][] = [];
  for (let start = 0; start < values.length; start += size) batches.push([...values.slice(start, start + size)]);
  return batches;
}

/**
 * Uses PostgREST merge-duplicates with the manifest's real unique key. The
 * payload is projected again here to guarantee callers cannot accidentally
 * send id, generated columns, or trigger-maintained timestamps.
 */
export async function upsertTableRows(options: {
  readonly profile: MigrationProfile;
  readonly manifest: TableManifest;
  readonly rows: readonly Row[];
  readonly fetch: FetchLike;
  readonly batchSize?: number;
}): Promise<number> {
  const batchSize = options.batchSize ?? DEFAULT_UPSERT_BATCH_SIZE;
  const batches = chunks(options.rows, batchSize);
  let written = 0;

  for (const batch of batches) {
    const payload = batch.map((row) => projectPortableRow(options.manifest, row));
    const response = await options.fetch(
      supabaseRestUrl(options.profile, options.manifest.table, { on_conflict: options.manifest.conflictKey }),
      {
        method: "POST",
        headers: {
          ...serviceHeaders(options.profile, "Content-Profile"),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) throw new Error(`Upsert target public.${options.manifest.table} failed with HTTP ${response.status}.`);
    written += payload.length;
  }

  return written;
}
