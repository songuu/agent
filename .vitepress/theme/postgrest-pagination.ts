export interface PostgrestReadConfig {
  url: string;
  anonKey: string;
  schema: string;
}

export interface PostgrestPagedReadOptions {
  config: PostgrestReadConfig;
  table: string;
  select: string;
  filters?: string[];
  order?: string[];
  pageSize?: number;
  maxPages?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 1000;
const DEFAULT_MAX_PAGES = 100;

export function buildPostgrestPageUrl(
  config: Pick<PostgrestReadConfig, "url">,
  table: string,
  select: string,
  filters: readonly string[],
  order: readonly string[],
  pageSize: number,
  offset: number,
): string {
  const baseUrl = config.url.replace(/\/+$/, "");
  const search = new URLSearchParams();
  search.set("select", select);
  for (const filter of filters) appendRawQuery(search, filter);
  for (const orderBy of order) search.append("order", orderBy);
  search.set("limit", String(pageSize));
  search.set("offset", String(offset));
  return `${baseUrl}/rest/v1/${table}?${search.toString()}`;
}

export async function fetchAllPostgrestRows<T = unknown>({
  config,
  table,
  select,
  filters = [],
  order = [],
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
  fetchImpl = fetch,
}: PostgrestPagedReadOptions): Promise<T[]> {
  const normalizedPageSize = normalizePageSize(pageSize);
  const normalizedMaxPages = normalizeMaxPages(maxPages);
  const rows: T[] = [];

  for (let page = 0; page < normalizedMaxPages; page += 1) {
    const endpoint = buildPostgrestPageUrl(
      config,
      table,
      select,
      filters,
      order,
      normalizedPageSize,
      page * normalizedPageSize,
    );
    const response = await fetchImpl(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        "Accept-Profile": config.schema || "public",
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`HTTP ${response.status} ${detail.slice(0, 180)}`);
    }

    const pageRows = (await response.json()) as unknown;
    if (!Array.isArray(pageRows)) {
      throw new Error("返回数据不是数组");
    }

    rows.push(...(pageRows as T[]));
    if (pageRows.length < normalizedPageSize) return rows;
  }

  throw new Error(`分页读取超过 ${normalizedMaxPages} 页，请缩小查询范围或提高 maxPages`);
}

function appendRawQuery(search: URLSearchParams, raw: string): void {
  const separator = raw.indexOf("=");
  if (separator <= 0 || separator === raw.length - 1) {
    throw new Error(`Invalid PostgREST filter: ${raw}`);
  }
  search.append(raw.slice(0, separator), raw.slice(separator + 1));
}

function normalizePageSize(value: number): number {
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(value, MAX_PAGE_SIZE);
}

function normalizeMaxPages(value: number): number {
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_MAX_PAGES;
  return value;
}
