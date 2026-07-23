// Browser compatibility bridge: existing renderers keep their table/select call
// shape while reads first go through the same-origin Content API. The direct
// PostgREST module remains only as a migration fallback inside content-api-client.

import {
  createContentApiClientForPostgrest,
} from "./content-api-client.ts";
import type {
  PostgrestPageResult,
  PostgrestPagedReadOptions,
  PostgrestReadConfig,
} from "./postgrest-pagination.ts";

export interface ContentAwarePostgrestReadOptions extends Omit<PostgrestPagedReadOptions, "config"> {
  readonly config?: PostgrestReadConfig;
}

export async function fetchAllPostgrestRows<T = unknown>(
  options: ContentAwarePostgrestReadOptions,
): Promise<T[]> {
  const client = await createContentApiClientForPostgrest(options.config, {
    fetchImpl: options.fetchImpl,
  });
  const result = await client.fetchAllPostgrestRows<T>(options);
  return result.rows;
}

export async function fetchPostgrestPage<T = unknown>(
  options: ContentAwarePostgrestReadOptions & { readonly offset?: number },
): Promise<PostgrestPageResult<T>> {
  const client = await createContentApiClientForPostgrest(options.config, {
    fetchImpl: options.fetchImpl,
  });
  const result = await client.fetchPostgrestPage<T>(options);
  return {
    rows: result.rows,
    totalCount: result.totalCount,
    hasMore: result.hasMore,
  };
}