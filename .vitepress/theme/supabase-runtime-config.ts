// Compatibility shim for old renderers that used to request browser-side
// Supabase anon config. Project data reads have moved behind the same-origin
// Content API, so this module must not expose PostgREST credentials.

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
  schema: string;
}

export interface SupabaseRuntimeConfigRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Supabase browser reads are disabled. The options are retained only to avoid
 * breaking existing call sites while they migrate to Content API directly.
 */
export function getSupabaseRuntimeConfig(
  _options: SupabaseRuntimeConfigRequestOptions = {},
): Promise<SupabasePublicConfig | null> {
  return Promise.resolve(null);
}

/** Clears the in-memory value for an explicit retry or focused test. */
export function resetSupabaseRuntimeConfigCache(): void {
  // No-op: there is no Supabase browser config cache anymore.
}
