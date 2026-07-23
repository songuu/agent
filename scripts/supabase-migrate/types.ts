/**
 * The migration tool is intentionally scoped to this repository's content
 * data plane. These types avoid importing a Supabase SDK so every network and
 * database boundary can be injected in tests and in constrained runners.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { readonly [key: string]: JsonValue };

export type Row = Record<string, unknown>;

export interface HeaderBag {
  get(name: string): string | null;
}

export interface FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: HeaderBag;
  text(): Promise<string>;
  arrayBuffer?(): Promise<ArrayBuffer>;
}

export interface FetchRequest {
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string | Uint8Array | ArrayBuffer;
}

export type FetchLike = (input: string, init?: FetchRequest) => Promise<FetchResponse>;

export type ProfileName = "source" | "target";

export interface MigrationProfile {
  readonly name: ProfileName;
  /** Service-side API origin. Never include this object's secrets in reports. */
  readonly url: string;
  readonly serviceRoleKey: string;
  readonly schema: "public";
  /** Browser-facing origin used when Notion asset URLs are rewritten. */
  readonly publicUrl: string;
  readonly anonKey: string;
  /** Only required by the target schema stage. */
  readonly databaseUrl: string | null;
  readonly storageBucket: "notion-assets";
}

export interface TableManifest {
  readonly table: string;
  /** Stable identity used by PostgREST's on_conflict parameter and verification ordering. */
  readonly conflictKey: string;
  /**
   * Explicit portable columns. Server identifiers, generated search vectors,
   * and trigger-managed timestamps are deliberately absent.
   */
  readonly copyFields: readonly string[];
  /** A small, user-meaningful subset surfaced by verification reports. */
  readonly keyFields: readonly string[];
}

export interface DbExecutionRequest {
  readonly databaseUrl: string;
  readonly migrationFiles: readonly string[];
}

/** Executes the supplied migrations sequentially and rejects on the first failure. */
export type DbExecutor = (request: DbExecutionRequest) => Promise<void>;

export type MigrationPhase = "preflight" | "stage" | "copy" | "verify" | "all";

export interface ProfilePair {
  readonly source: MigrationProfile;
  readonly target: MigrationProfile;
}
