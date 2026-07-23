import {
  fetchAllPostgrestRows,
  fetchPostgrestPage,
  type PostgrestPagedReadOptions,
  type PostgrestReadConfig,
} from "./postgrest-pagination.ts";
import { getSupabaseRuntimeConfig, type SupabasePublicConfig } from "./supabase-runtime-config.ts";

// 这个声明给将来的 Vite 注入留出入口；当前部署仍可只提供 supabase 配置。
declare const __FRONTIER_CONTENT_API_CONFIG__: unknown;

/**
 * 同源内容 API 的公开运行时配置。
 *
 * baseUrl 必须是以单个 `/` 开头的路径，例如 `/api/content`。不允许跨域 URL，
 * 因而不会把浏览器内容请求或 cookie 发往迁移时误配的第三方地址。
 */
export interface SameOriginContentApiConfig {
  readonly baseUrl: string;
}

/**
 * 与 `supabase-runtime-config.json` 共用的可迁移配置契约。
 *
 * 迁移过渡期同时保留两个字段：contentApi 成为主读源，supabase 是只读回退；
 * 彻底切走 Supabase 后只保留 contentApi 即可。
 */
export interface ContentApiRuntimeConfig {
  readonly version: 1;
  readonly contentApi?: SameOriginContentApiConfig;
  readonly supabase?: SupabasePublicConfig;
}

export type ContentApiSource = "http" | "supabase";
export type ContentCountMode = "exact" | "planned" | "estimated" | "none";
export type ContentScalar = string | number | boolean | null;
export type ContentFilterOperator = "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | "is";

/** Provider-neutral filter syntax. API implementations receive this JSON unchanged. */
export interface ContentFilter {
  readonly field: string;
  readonly operator: ContentFilterOperator;
  readonly value: ContentScalar | readonly Exclude<ContentScalar, null>[];
}

export interface ContentSort {
  readonly field: string;
  readonly direction?: "asc" | "desc";
}

/**
 * Stable browser read contract. `resource` is an application resource name;
 * during the transition it deliberately matches the existing Supabase table name.
 */
export interface ContentReadRequest {
  readonly resource: string;
  readonly fields: readonly string[];
  readonly filters?: readonly ContentFilter[];
  readonly sort?: readonly ContentSort[];
  readonly pageSize?: number;
  readonly offset?: number;
  readonly maxPages?: number;
  readonly count?: ContentCountMode;
  readonly signal?: AbortSignal;
}

export interface PostgrestCompatibleReadRequest {
  readonly config?: PostgrestReadConfig;
  readonly table: string;
  readonly select: string;
  readonly filters?: readonly string[];
  readonly order?: readonly string[];
  readonly pageSize?: number;
  readonly offset?: number;
  readonly maxPages?: number;
  readonly count?: ContentCountMode;
  readonly fetchImpl?: typeof fetch;
}

/** Explicit public resource boundary; arbitrary database tables are never exposed. */
export const CONTENT_RESOURCE_BY_SUPABASE_TABLE = {
  news_items: "news",
  frontier_ecosystem_articles: "frontier",
  interview_questions: "interviews",
  notion_articles: "notion",
  glossary_terms: "glossary",
} as const;

export type ContentResource =
  (typeof CONTENT_RESOURCE_BY_SUPABASE_TABLE)[keyof typeof CONTENT_RESOURCE_BY_SUPABASE_TABLE];

export interface ContentPageResult<T> {
  readonly rows: T[];
  readonly totalCount: number | null;
  readonly hasMore: boolean;
  readonly source: ContentApiSource;
}

export interface ContentRowsResult<T> {
  readonly rows: T[];
  readonly source: ContentApiSource;
}

export interface ContentApiClientOptions {
  /** Omit to resolve the shared static runtime config once in the browser. */
  readonly runtimeConfig?: ContentApiRuntimeConfig | null;
  readonly fetchImpl?: typeof fetch;
}

export interface ContentApiRuntimeConfigRequestOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

const RUNTIME_CONFIG_FILE = "supabase-runtime-config.json";
const DEFAULT_RUNTIME_CONFIG_TIMEOUT_MS = 8_000;
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 1_000;
const DEFAULT_MAX_PAGES = 100;
const RESOURCE_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const FIELD_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const CONTENT_FILTER_OPERATORS = new Set<ContentFilterOperator>([
  "eq",
  "neq",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "is",
]);

let cachedRuntimeConfig: Promise<ContentApiRuntimeConfig | null> | null = null;

/**
 * Reads the existing runtime JSON without requiring a Vite rebuild. The legacy
 * `{ version: 1, supabase: ... }` shape remains valid as a Supabase-only client.
 */
export function getContentApiRuntimeConfig(
  options: ContentApiRuntimeConfigRequestOptions = {},
): Promise<ContentApiRuntimeConfig | null> {
  if (!isBrowserRuntime()) return resolveCompiledOrSupabaseFallback();
  if (options.signal) return loadBrowserRuntimeConfig(options);

  cachedRuntimeConfig ??= loadBrowserRuntimeConfig(options);
  return cachedRuntimeConfig;
}

/** Clears the browser config cache for an explicit retry or focused test. */
export function resetContentApiRuntimeConfigCache(): void {
  cachedRuntimeConfig = null;
}

/**
 * Parses the public JSON contract. Invalid HTTP configuration is ignored when a
 * valid Supabase fallback exists, so a malformed cutover file cannot take the
 * current site offline.
 */
export function normalizeContentApiRuntimeConfig(value: unknown): ContentApiRuntimeConfig | null {
  if (!isRecord(value) || value.version !== 1) return null;

  const contentApi = normalizeSameOriginContentApi(value.contentApi);
  const supabase = normalizeSupabaseConfig(value.supabase);
  if (!contentApi && !supabase) return null;

  return {
    version: 1,
    ...(contentApi ? { contentApi } : {}),
    ...(supabase ? { supabase } : {}),
  };
}

/**
 * Builds the documented same-origin HTTP request:
 * GET /api/content/{resource}?fields=...&filter=[...]&sort=[...]&limit=N&offset=N&count=...
 *
 * A content API responds with `{ items: T[], totalCount?: number, hasMore?: boolean }`.
 */
export function buildContentApiPageUrl(
  config: SameOriginContentApiConfig,
  request: ContentReadRequest,
  pageSize: number = normalizePageSize(request.pageSize),
  offset: number = normalizeOffset(request.offset),
): string {
  const resource = normalizeResource(request.resource);
  const fields = normalizeFields(request.fields);
  const filters = normalizeFilters(request.filters ?? []);
  const sort = normalizeSort(request.sort ?? []);
  const search = new URLSearchParams();
  search.set("fields", fields.join(","));
  for (const filter of filters) search.append("filter", formatHttpFilter(filter));
  for (const item of sort) search.append("sort", item.field + ":" + (item.direction ?? "asc"));
  search.set("limit", String(normalizePageSize(pageSize)));
  search.set("offset", String(normalizeOffset(offset)));
  search.set("count", request.count ?? "exact");

  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  return baseUrl + "/" + encodeURIComponent(resource) + "?" + search.toString();
}

export function adaptPostgrestReadRequest(request: PostgrestCompatibleReadRequest): ContentReadRequest {
  return {
    resource: contentResourceForSupabaseTable(request.table),
    fields: parsePostgrestSelect(request.select),
    filters: (request.filters ?? []).map(parsePostgrestEqFilter),
    sort: (request.order ?? []).map(parsePostgrestSort),
    pageSize: request.pageSize,
    offset: request.offset,
    maxPages: request.maxPages,
    count: request.count,
  };
}

export function contentResourceForSupabaseTable(table: string): ContentResource {
  const normalizedTable = normalizePostgrestTable(table);
  const resource = CONTENT_RESOURCE_BY_SUPABASE_TABLE[
    normalizedTable as keyof typeof CONTENT_RESOURCE_BY_SUPABASE_TABLE
  ];
  if (!resource) throw new Error("未允许通过 Content API 暴露的 Supabase 表：" + table);
  return resource;
}
export class ContentApiClient {
  private readonly fetchImpl: typeof fetch;

  public constructor(
    private readonly runtimeConfig: ContentApiRuntimeConfig,
    options: Pick<ContentApiClientOptions, "fetchImpl"> = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public async fetchPage<T = unknown>(request: ContentReadRequest): Promise<ContentPageResult<T>> {
    return this.fetchPageWithFallback<T>(
      request,
      this.runtimeConfig.supabase,
      supabaseTableForContentResource(request.resource),
      this.fetchImpl,
    );
  }

  public async fetchAll<T = unknown>(request: ContentReadRequest): Promise<ContentRowsResult<T>> {
    return this.fetchAllWithFallback<T>(
      request,
      this.runtimeConfig.supabase,
      supabaseTableForContentResource(request.resource),
      this.fetchImpl,
    );
  }

  public async fetchPostgrestPage<T = unknown>(
    request: PostgrestCompatibleReadRequest,
  ): Promise<ContentPageResult<T>> {
    return this.fetchPageWithFallback<T>(
      adaptPostgrestReadRequest(request),
      this.runtimeConfig.supabase ?? request.config,
      request.table,
      request.fetchImpl ?? this.fetchImpl,
    );
  }

  public async fetchAllPostgrestRows<T = unknown>(
    request: PostgrestCompatibleReadRequest,
  ): Promise<ContentRowsResult<T>> {
    return this.fetchAllWithFallback<T>(
      adaptPostgrestReadRequest(request),
      this.runtimeConfig.supabase ?? request.config,
      request.table,
      request.fetchImpl ?? this.fetchImpl,
    );
  }

  private async fetchPageWithFallback<T>(
    request: ContentReadRequest,
    supabase: PostgrestReadConfig | undefined,
    supabaseTable: string,
    fetchImpl: typeof fetch,
  ): Promise<ContentPageResult<T>> {
    if (this.runtimeConfig.contentApi) {
      try {
        return await this.fetchHttpPage<T>(request, fetchImpl);
      } catch (primaryError) {
        if (!supabase) throw primaryError;
        return this.fetchSupabasePage<T>(request, supabase, supabaseTable, fetchImpl, primaryError);
      }
    }
    return this.fetchSupabasePage<T>(request, supabase, supabaseTable, fetchImpl);
  }

  private async fetchAllWithFallback<T>(
    request: ContentReadRequest,
    supabase: PostgrestReadConfig | undefined,
    supabaseTable: string,
    fetchImpl: typeof fetch,
  ): Promise<ContentRowsResult<T>> {
    if (this.runtimeConfig.contentApi) {
      try {
        return await this.fetchAllHttp<T>(request, fetchImpl);
      } catch (primaryError) {
        if (!supabase) throw primaryError;
        return this.fetchAllSupabase<T>(request, supabase, supabaseTable, fetchImpl, primaryError);
      }
    }
    return this.fetchAllSupabase<T>(request, supabase, supabaseTable, fetchImpl);
  }

  private async fetchHttpPage<T>(
    request: ContentReadRequest,
    fetchImpl: typeof fetch = this.fetchImpl,
  ): Promise<ContentPageResult<T>> {
    const contentApi = this.runtimeConfig.contentApi;
    if (!contentApi) throw new Error("缺少同源 Content API 配置");

    const pageSize = normalizePageSize(request.pageSize);
    const offset = normalizeOffset(request.offset);
    const response = await fetchImpl(buildContentApiPageUrl(contentApi, request, pageSize, offset), {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      signal: request.signal,
    });
    if (!response.ok) throw await httpError(response, "Content API");

    const payload = await response.json();
    return parseContentApiPage<T>(payload, pageSize, offset);
  }

  private async fetchAllHttp<T>(
    request: ContentReadRequest,
    fetchImpl: typeof fetch = this.fetchImpl,
  ): Promise<ContentRowsResult<T>> {
    const pageSize = normalizePageSize(request.pageSize);
    const maxPages = normalizeMaxPages(request.maxPages);
    let offset = normalizeOffset(request.offset);
    const rows: T[] = [];
    const readRequest: ContentReadRequest = { ...request, count: request.count ?? "none" };

    for (let page = 0; page < maxPages; page += 1) {
      const result = await this.fetchHttpPage<T>({ ...readRequest, pageSize, offset }, fetchImpl);
      rows.push(...result.rows);
      if (!result.hasMore) return { rows, source: "http" };
      offset += pageSize;
    }

    throw new Error("分页读取超过 " + maxPages + " 页，请缩小查询范围或提高 maxPages");
  }

  private async fetchSupabasePage<T>(
    request: ContentReadRequest,
    supabase: PostgrestReadConfig | undefined,
    supabaseTable: string,
    fetchImpl: typeof fetch,
    primaryError?: unknown,
  ): Promise<ContentPageResult<T>> {
    try {
      const page = await fetchPostgrestPage<T>({
        ...toPostgrestReadOptions(request, this.requireSupabaseConfig(supabase), supabaseTable),
        offset: normalizeOffset(request.offset),
        fetchImpl,
      });
      return { ...page, source: "supabase" };
    } catch (fallbackError) {
      throw combineProviderErrors(primaryError, fallbackError);
    }
  }

  private async fetchAllSupabase<T>(
    request: ContentReadRequest,
    supabase: PostgrestReadConfig | undefined,
    supabaseTable: string,
    fetchImpl: typeof fetch,
    primaryError?: unknown,
  ): Promise<ContentRowsResult<T>> {
    try {
      const pageSize = normalizePageSize(request.pageSize);
      const maxPages = normalizeMaxPages(request.maxPages);
      let offset = normalizeOffset(request.offset);
      const rows: T[] = [];
      const readRequest: ContentReadRequest = { ...request, count: request.count ?? "none" };

      for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
        const page = await fetchPostgrestPage<T>({
          ...toPostgrestReadOptions(readRequest, this.requireSupabaseConfig(supabase), supabaseTable),
          offset,
          fetchImpl,
        });
        rows.push(...page.rows);
        if (!page.hasMore) return { rows, source: "supabase" };
        offset += pageSize;
      }

      throw new Error("分页读取超过 " + maxPages + " 页，请缩小查询范围或提高 maxPages");
    } catch (fallbackError) {
      throw combineProviderErrors(primaryError, fallbackError);
    }
  }
  private requireSupabaseConfig(supabase: PostgrestReadConfig | undefined): PostgrestReadConfig {
    if (!supabase) throw new Error("Content API 不可用，且未配置 Supabase 回退");
    return supabase;
  }
}
/** Resolves runtime config when needed and creates the provider-neutral client. */
export async function createContentApiClient(
  options: ContentApiClientOptions = {},
): Promise<ContentApiClient> {
  const runtimeConfig =
    options.runtimeConfig === undefined ? await getContentApiRuntimeConfig() : options.runtimeConfig;
  if (!runtimeConfig) {
    throw new Error("缺少 Content API 配置，也没有可用的 Supabase 公开回退配置");
  }
  return new ContentApiClient(runtimeConfig, options);
}

export async function createContentApiClientForPostgrest(
  fallbackConfig: PostgrestReadConfig | undefined,
  options: ContentApiClientOptions = {},
): Promise<ContentApiClient> {
  const runtimeConfig =
    options.runtimeConfig === undefined ? await getContentApiRuntimeConfig() : options.runtimeConfig;
  const supabase = runtimeConfig?.supabase ?? fallbackConfig;
  return new ContentApiClient(
    {
      version: 1,
      ...(runtimeConfig?.contentApi ? { contentApi: runtimeConfig.contentApi } : {}),
      ...(supabase ? { supabase } : {}),
    },
    options,
  );
}
async function loadBrowserRuntimeConfig(
  options: ContentApiRuntimeConfigRequestOptions,
): Promise<ContentApiRuntimeConfig | null> {
  const requestController = new AbortController();
  const abortRequest = (): void => requestController.abort();
  if (options.signal?.aborted) abortRequest();
  else options.signal?.addEventListener("abort", abortRequest, { once: true });

  const timeoutMs =
    Number.isFinite(options.timeoutMs) && (options.timeoutMs ?? 0) > 0
      ? (options.timeoutMs as number)
      : DEFAULT_RUNTIME_CONFIG_TIMEOUT_MS;
  const timeoutId = globalThis.setTimeout(abortRequest, timeoutMs);

  try {
    const response = await window.fetch(runtimeConfigUrl(), {
      cache: "no-store",
      signal: requestController.signal,
    });
    if (!response.ok) return await resolveCompiledOrSupabaseFallback();

    return normalizeContentApiRuntimeConfig(await response.json()) ?? (await resolveCompiledOrSupabaseFallback());
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return resolveCompiledOrSupabaseFallback();
  } finally {
    globalThis.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortRequest);
  }
}

async function resolveCompiledOrSupabaseFallback(): Promise<ContentApiRuntimeConfig | null> {
  const compiled = normalizeContentApiRuntimeConfig(readCompiledContentApiConfig());
  if (compiled) return compiled;

  const supabase = await getSupabaseRuntimeConfig();
  return supabase ? { version: 1, supabase } : null;
}

function readCompiledContentApiConfig(): unknown {
  if (typeof __FRONTIER_CONTENT_API_CONFIG__ !== "undefined") {
    return __FRONTIER_CONTENT_API_CONFIG__;
  }
  return (globalThis as { __FRONTIER_CONTENT_API_CONFIG__?: unknown }).__FRONTIER_CONTENT_API_CONFIG__;
}

function normalizeSameOriginContentApi(value: unknown): SameOriginContentApiConfig | null {
  if (!isRecord(value)) return null;
  const baseUrl = stringField(value.baseUrl);
  if (!baseUrl || !isSameOriginPath(baseUrl)) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, "") || "/" };
}

function normalizeSupabaseConfig(value: unknown): SupabasePublicConfig | null {
  if (!isRecord(value)) return null;
  const url = stringField(value.url);
  const anonKey = stringField(value.anonKey);
  const schema = stringField(value.schema) ?? "public";
  if (!url || !anonKey) return null;

  try {
    const parsed = new URL(url);
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.username || parsed.password) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, anonKey, schema };
}

function isSameOriginPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !/[?#]/.test(value);
}

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined" && typeof window.fetch === "function";
}

function runtimeConfigUrl(): string {
  const viteEnv = (import.meta as ImportMeta & { env?: { BASE_URL?: unknown } }).env;
  const base = typeof viteEnv?.BASE_URL === "string" && viteEnv.BASE_URL.trim() ? viteEnv.BASE_URL : "/";
  return `${base.endsWith("/") ? base : `${base}/`}${RUNTIME_CONFIG_FILE}`;
}

function parseContentApiPage<T>(value: unknown, pageSize: number, offset: number): ContentPageResult<T> {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("Content API 返回格式无效：需要 items 数组");
  }

  const totalCount = finiteNonNegativeInteger(value.totalCount);
  const hasMore =
    typeof value.hasMore === "boolean"
      ? value.hasMore
      : totalCount === null
        ? value.items.length === pageSize
        : offset + value.items.length < totalCount;

  return { rows: value.items as T[], totalCount, hasMore, source: "http" };
}

function toPostgrestReadOptions(
  request: ContentReadRequest,
  config: PostgrestReadConfig,
  table: string,
): Omit<PostgrestPagedReadOptions, "fetchImpl"> {
  const fields = normalizeFields(request.fields);
  return {
    config,
    table: normalizePostgrestTable(table),
    select: fields.join(","),
    filters: normalizeFilters(request.filters ?? []).map(toPostgrestFilter),
    order: normalizeSort(request.sort ?? []).map((sort) => sort.field + "." + (sort.direction ?? "asc")),
    pageSize: normalizePageSize(request.pageSize),
    maxPages: normalizeMaxPages(request.maxPages),
    count: request.count ?? "exact",
  };
}

function toPostgrestFilter(filter: ContentFilter): string {
  switch (filter.operator) {
    case "is":
      if (filter.value !== null && typeof filter.value !== "boolean") {
        throw new Error("is 过滤器只接受 null 或 boolean");
      }
      return filter.field + "=is." + (filter.value === null ? "null" : String(filter.value));
    case "in":
      if (!Array.isArray(filter.value) || filter.value.length === 0) {
        throw new Error("in 过滤器需要非空数组");
      }
      return filter.field + "=in.(" + filter.value.map((value) => postgrestScalar(value as ContentScalar)).join(",") + ")";
    default:
      if (Array.isArray(filter.value)) throw new Error(filter.operator + " 过滤器不接受数组");
      return filter.field + "=" + filter.operator + "." + postgrestScalar(filter.value as ContentScalar);
  }
}

function formatHttpFilter(filter: ContentFilter): string {
  switch (filter.operator) {
    case "is":
      if (filter.value !== null && typeof filter.value !== "boolean") {
        throw new Error("is 过滤器只接受 null 或 boolean");
      }
      return filter.field + ":is:" + (filter.value === null ? "null" : String(filter.value));
    case "in":
      if (!Array.isArray(filter.value) || filter.value.length === 0) {
        throw new Error("in 过滤器需要非空数组");
      }
      return filter.field + ":in:" + JSON.stringify(filter.value);
    default:
      if (Array.isArray(filter.value)) throw new Error(filter.operator + " 过滤器不接受数组");
      return filter.field + ":" + filter.operator + ":" + postgrestScalar(filter.value as ContentScalar);
  }
}

function postgrestScalar(value: ContentScalar): string {
  return value === null ? "null" : String(value);
}

function supabaseTableForContentResource(resource: string): string {
  for (const [table, contentResource] of Object.entries(CONTENT_RESOURCE_BY_SUPABASE_TABLE)) {
    if (contentResource === resource) return table;
  }
  return normalizePostgrestTable(resource);
}

function normalizeResource(value: string): string {
  if (!RESOURCE_NAME_RE.test(value)) throw new Error("无效的内容资源名：" + value);
  return value;
}

function normalizePostgrestTable(value: string): string {
  if (!FIELD_NAME_RE.test(value)) throw new Error("无效的 Supabase 表名：" + value);
  return value;
}

function normalizeFields(value: readonly string[]): string[] {
  if (value.length === 0) throw new Error("Content API 至少需要一个字段");
  return value.map((field) => {
    if (!FIELD_NAME_RE.test(field)) throw new Error("无效的内容字段名：" + field);
    return field;
  });
}

function normalizeFilters(value: readonly ContentFilter[]): ContentFilter[] {
  return value.map((filter) => {
    if (!FIELD_NAME_RE.test(filter.field)) throw new Error("无效的过滤字段名：" + filter.field);
    if (!CONTENT_FILTER_OPERATORS.has(filter.operator)) {
      throw new Error("无效的过滤操作符：" + String(filter.operator));
    }
    return filter;
  });
}

function normalizeSort(value: readonly ContentSort[]): ContentSort[] {
  return value.map((sort) => {
    if (!FIELD_NAME_RE.test(sort.field)) throw new Error("无效的排序字段名：" + sort.field);
    if (sort.direction && sort.direction !== "asc" && sort.direction !== "desc") {
      throw new Error("无效的排序方向：" + sort.direction);
    }
    return sort;
  });
}

function parsePostgrestSelect(value: string): string[] {
  const fields = value.split(",").map((field) => field.trim());
  return normalizeFields(fields);
}

function parsePostgrestEqFilter(value: string): ContentFilter {
  const match = /^([a-zA-Z_][a-zA-Z0-9_]*)=eq\.(.*)$/.exec(value);
  if (!match) {
    throw new Error("暂不支持的 PostgREST 过滤器：" + value + "；请改为结构化 ContentFilter");
  }
  const field = match[1] as string;
  const rawValue = match[2] as string;
  try {
    return { field, operator: "eq", value: decodeURIComponent(rawValue) };
  } catch {
    throw new Error("无效的 URL 编码 PostgREST 过滤器：" + value);
  }
}

function parsePostgrestSort(value: string): ContentSort {
  const match = /^([a-zA-Z_][a-zA-Z0-9_]*)\.(asc|desc)$/.exec(value);
  if (!match) throw new Error("暂不支持的 PostgREST 排序：" + value);
  return { field: match[1] as string, direction: match[2] as "asc" | "desc" };
}

function normalizePageSize(value: number | undefined): number {
  if (!Number.isInteger(value) || (value ?? 0) <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(value as number, MAX_PAGE_SIZE);
}

function normalizeOffset(value: number | undefined): number {
  return Number.isInteger(value) && (value ?? 0) > 0 ? (value as number) : 0;
}

function normalizeMaxPages(value: number | undefined): number {
  return Number.isInteger(value) && (value ?? 0) > 0 ? (value as number) : DEFAULT_MAX_PAGES;
}

function finiteNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

async function httpError(response: Response, provider: string): Promise<Error> {
  const detail = await response.text();
  return new Error(provider + " HTTP " + response.status + " " + detail.slice(0, 180));
}

function combineProviderErrors(primaryError: unknown, fallbackError: unknown): Error {
  if (!primaryError) {
    return fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
  }
  const primary = primaryError instanceof Error ? primaryError.message : String(primaryError);
  const fallback = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
  return new Error("Content API 失败（" + primary + "）；Supabase 回退也失败（" + fallback + "）");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}


