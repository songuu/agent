import type { FetchResponse, MigrationProfile, Row, TableManifest } from "./types.ts";

export function profile(
  name: "source" | "target",
  url: string,
  options: Partial<Pick<MigrationProfile, "publicUrl" | "databaseUrl">> = {},
): MigrationProfile {
  return {
    name,
    url,
    serviceRoleKey: `${name}-service-secret`,
    schema: "public",
    publicUrl: options.publicUrl ?? url,
    anonKey: `${name}-anon-secret`,
    databaseUrl: options.databaseUrl ?? (name === "target" ? "postgresql://user:database-secret@target.test/db" : null),
    storageBucket: "notion-assets",
  };
}

export function jsonResponse(
  payload: unknown,
  options: { readonly status?: number; readonly headers?: Record<string, string> } = {},
): FetchResponse {
  const text = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(text);
  const headers = new Map(Object.entries(options.headers ?? {}));
  return {
    ok: (options.status ?? 200) >= 200 && (options.status ?? 200) < 300,
    status: options.status ?? 200,
    headers: { get: (name) => headers.get(name.toLowerCase()) ?? headers.get(name) ?? null },
    text: async () => text,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

export function binaryResponse(
  value: string,
  options: { readonly status?: number; readonly contentType?: string } = {},
): FetchResponse {
  const bytes = new TextEncoder().encode(value);
  return {
    ok: (options.status ?? 200) >= 200 && (options.status ?? 200) < 300,
    status: options.status ?? 200,
    headers: { get: (name) => (name.toLowerCase() === "content-type" ? options.contentType ?? "image/png" : null) },
    text: async () => value,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

export function portableRow(manifest: TableManifest, conflictValue = "row-1"): Row {
  const row: Row = {};
  for (const field of manifest.copyFields) row[field] = `${field}-value`;
  row[manifest.conflictKey] = conflictValue;
  if (manifest.copyFields.includes("metadata")) row.metadata = { z: "last", nested: { source: "fixture" }, a: "first" };
  if (manifest.copyFields.includes("tags")) row.tags = ["agent", "supabase"];
  if (manifest.copyFields.includes("read_count")) row.read_count = 0;
  if (manifest.copyFields.includes("enriched")) row.enriched = false;
  return row;
}
