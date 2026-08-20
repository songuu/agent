import http from "node:http";

import {
  ContentAssetRequestError,
  parseContentAssetRequest,
  type ContentAssetReadRepository,
} from "./assets.ts";

import {
  ContentRequestError,
  parseContentReadRequest,
  type ContentReadRequest,
  type ContentReadRepository,
} from "./contract.ts";

export const CONTENT_API_PATH_PREFIX = "/api/content/v1/";
export const NEWS_CALENDAR_PATH = "/api/content/v1/news/calendar";
export const DEFAULT_CONTENT_API_HOST = "127.0.0.1";
export const DEFAULT_CONTENT_API_PORT = 5180;
export const DEFAULT_CONTENT_API_ALLOWED_HOSTS = [
  "127.0.0.1:5180",
  "localhost:5180",
] as const;
export const DEFAULT_CONTENT_API_ALLOWED_ORIGINS = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
] as const;

export interface ContentApiServerOptions {
  readonly repository: ContentReadRepository;
  readonly assetRepository?: ContentAssetReadRepository;
  readonly allowedHosts?: readonly string[];
  readonly allowedOrigins?: readonly string[];
  readonly allowMissingOrigin?: boolean;
  /**
   * The calendar is an unparameterized public aggregate. Keep one fresh copy
   * in-process so concurrent browser loads do not all repeat the same three
   * database aggregates while the host is under pressure.
   */
  readonly newsCalendarCacheTtlMs?: number;
  /** Test seam for deterministic calendar-cache expiry. */
  readonly now?: () => number;
  /** Cache only validated public news-list responses for a short server-side TTL. */
  readonly newsResponseCacheTtlMs?: number;
  /** Bounds per-process news-list response cache memory for queryable public URLs. */
  readonly newsResponseCacheMaxEntries?: number;
  readonly onError?: (error: unknown) => void;
}

export interface StartContentApiServerOptions extends ContentApiServerOptions {
  readonly host?: string;
  readonly port?: number;
}

interface GateFailure {
  readonly status: number;
  readonly code: string;
}

/**
 * Content reads are intentionally a separate service from demo-runner. It has no
 * execution routes and accepts only the constrained request parsed in contract.ts.
 */
export function createContentApiServer(options: ContentApiServerOptions): http.Server {
  const allowedHosts = new Set(options.allowedHosts ?? DEFAULT_CONTENT_API_ALLOWED_HOSTS);
  const allowedOrigins = new Set(options.allowedOrigins ?? DEFAULT_CONTENT_API_ALLOWED_ORIGINS);
  const allowMissingOrigin = options.allowMissingOrigin ?? false;
  const onError = options.onError ?? (() => undefined);
  const newsCalendarCache = createNewsCalendarCache(options.repository, {
    ttlMs: options.newsCalendarCacheTtlMs,
    now: options.now,
    onError,
  });
  const newsResponseCache = createNewsResponseCache(options.repository, {
    ttlMs: options.newsResponseCacheTtlMs,
    maxEntries: options.newsResponseCacheMaxEntries,
    now: options.now,
    onError,
  });

  return http.createServer(async (req, res) => {
    const requestUrl = parseRequestUrl(req);
    if (requestUrl.pathname === "/healthz") {
      if (!allowHealthRequest(req, res, allowedHosts)) return;
      sendJson(res, 200, { ok: true });
      return;
    }

    if (!requestUrl.pathname.startsWith(CONTENT_API_PATH_PREFIX)) {
      sendJson(res, 404, { ok: false, error: "not_found" });
      return;
    }

    if (req.method === "OPTIONS") {
      const failure = validateGate(req, allowedHosts, allowedOrigins, false);
      if (failure) {
        sendJson(res, failure.status, { ok: false, error: failure.code });
        return;
      }
      setCorsHeaders(req, res, allowedOrigins);
      res.statusCode = 204;
      res.end();
      return;
    }

    const failure = validateGate(req, allowedHosts, allowedOrigins, allowMissingOrigin);
    if (failure) {
      sendJson(res, failure.status, { ok: false, error: failure.code });
      return;
    }
    setCorsHeaders(req, res, allowedOrigins);

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, OPTIONS");
      sendJson(res, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    try {
      if (requestUrl.pathname === NEWS_CALENDAR_PATH) {
        if ([...requestUrl.searchParams.keys()].length > 0) {
          throw new ContentRequestError("unknown_parameter", "News calendar does not accept query parameters.");
        }
        const calendar = await newsCalendarCache.read();
        sendJson(res, 200, calendar, "public, max-age=300, stale-while-revalidate=300");
        return;
      }
      const assetRequest = parseContentAssetRequest(requestUrl);
      if (assetRequest) {
        if (!options.assetRepository) {
          sendJson(res, 404, { ok: false, error: "not_found" });
          return;
        }
        const asset = await options.assetRepository.readAsset(assetRequest);
        if (!asset) {
          sendJson(res, 404, { ok: false, error: "not_found" });
          return;
        }
        sendAsset(res, asset.contentType, asset.bytes);
        return;
      }
      const request = parseContentReadRequest(requestUrl);
      const page = requestUrl.pathname === "/api/content/v1/news"
        ? await newsResponseCache.read(`${requestUrl.pathname}${requestUrl.search}`, request)
        : await options.repository.read(request);
      sendJson(res, 200, {
        items: page.items,
        totalCount: page.totalCount,
        hasMore: page.hasMore,
      });
    } catch (error) {
      if (error instanceof ContentRequestError || error instanceof ContentAssetRequestError) {
        sendJson(res, 400, { ok: false, error: error.code, message: error.message });
        return;
      }
      onError(error);
      sendJson(res, 503, { ok: false, error: "content_backend_unavailable" });
    }
  });
}

export interface NewsCalendarCacheOptions {
  readonly ttlMs?: number;
  readonly now?: () => number;
  readonly onError?: (error: unknown) => void;
}

interface CachedNewsCalendar {
  readonly value: Awaited<ReturnType<ContentReadRepository["readNewsCalendar"]>>;
  readonly loadedAt: number;
}

const DEFAULT_NEWS_CALENDAR_CACHE_TTL_MS = 300_000;

/**
 * Reuses one public calendar aggregate for the HTTP cache lifetime. A stale
 * successful value is served while one refresh runs in the background, which
 * keeps read availability intact when PostgreSQL is temporarily contended.
 */
export function createNewsCalendarCache(
  repository: Pick<ContentReadRepository, "readNewsCalendar">,
  options: NewsCalendarCacheOptions = {},
): { read(): Promise<Awaited<ReturnType<ContentReadRepository["readNewsCalendar"]>>> } {
  const ttlMs = normalizeCalendarCacheTtl(options.ttlMs);
  const now = options.now ?? Date.now;
  const onError = options.onError ?? (() => undefined);
  let cached: CachedNewsCalendar | null = null;
  let refreshing: Promise<Awaited<ReturnType<ContentReadRepository["readNewsCalendar"]>>> | null = null;

  const refresh = (): Promise<Awaited<ReturnType<ContentReadRepository["readNewsCalendar"]>>> => {
    if (refreshing) return refreshing;
    const activeRefresh = repository.readNewsCalendar()
      .then((value) => {
        cached = { value, loadedAt: now() };
        return value;
      })
      .finally(() => {
        refreshing = null;
      });
    refreshing = activeRefresh;
    return activeRefresh;
  };

  return {
    async read() {
      if (cached && now() - cached.loadedAt < ttlMs) return cached.value;
      if (cached) {
        // The caller gets the last verified aggregate immediately. The error is
        // still observable in server logs, but a transient refresh failure does
        // not turn a previously good public calendar into a 503.
        void refresh().catch(onError);
        return cached.value;
      }
      return refresh();
    },
  };
}

function normalizeCalendarCacheTtl(value: number | undefined): number {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) return DEFAULT_NEWS_CALENDAR_CACHE_TTL_MS;
  return Math.floor(value as number);
}

export interface NewsResponseCacheOptions {
  readonly ttlMs?: number;
  readonly maxEntries?: number;
  readonly now?: () => number;
  readonly onError?: (error: unknown) => void;
}

interface CachedNewsResponse {
  readonly value: Awaited<ReturnType<ContentReadRepository["read"]>>;
  readonly loadedAt: number;
}

interface NewsResponseCacheEntry {
  cached: CachedNewsResponse | null;
  refreshing: Promise<Awaited<ReturnType<ContentReadRepository["read"]>>> | null;
}

const DEFAULT_NEWS_RESPONSE_CACHE_TTL_MS = 300_000;
const DEFAULT_NEWS_RESPONSE_CACHE_MAX_ENTRIES = 100;

/**
 * Caches successful, already-authorized news page reads by their complete URL.
 * An expired successful page remains available while one refresh runs, so a
 * short PostgreSQL stall cannot fan out into identical browser reads.
 */
export function createNewsResponseCache(
  repository: Pick<ContentReadRepository, "read">,
  options: NewsResponseCacheOptions = {},
): { read(key: string, request: ContentReadRequest): Promise<Awaited<ReturnType<ContentReadRepository["read"]>>> } {
  const ttlMs = normalizeCalendarCacheTtl(options.ttlMs);
  const maxEntries = normalizeNewsResponseCacheMaxEntries(options.maxEntries);
  const now = options.now ?? Date.now;
  const onError = options.onError ?? (() => undefined);
  const entries = new Map<string, NewsResponseCacheEntry>();

  const touch = (key: string, entry: NewsResponseCacheEntry): void => {
    if (entries.get(key) !== entry) return;
    entries.delete(key);
    entries.set(key, entry);
  };

  const makeEntry = (key: string): NewsResponseCacheEntry | null => {
    if (entries.size >= maxEntries) {
      for (const [candidateKey, candidate] of entries) {
        if (!candidate.refreshing) {
          entries.delete(candidateKey);
          break;
        }
      }
    }
    if (entries.size >= maxEntries) return null;
    const entry: NewsResponseCacheEntry = { cached: null, refreshing: null };
    entries.set(key, entry);
    return entry;
  };

  const refresh = (
    key: string,
    entry: NewsResponseCacheEntry,
    request: ContentReadRequest,
  ): Promise<Awaited<ReturnType<ContentReadRepository["read"]>>> => {
    if (entry.refreshing) return entry.refreshing;
    const activeRefresh = Promise.resolve()
      .then(() => repository.read(request))
      .then((value) => {
        entry.cached = { value, loadedAt: now() };
        touch(key, entry);
        return value;
      })
      .finally(() => {
        entry.refreshing = null;
        if (!entry.cached && entries.get(key) === entry) entries.delete(key);
      });
    entry.refreshing = activeRefresh;
    return activeRefresh;
  };

  return {
    read(key, request) {
      let entry = entries.get(key);
      if (!entry) {
        const createdEntry = makeEntry(key);
        // All bounded entries are actively refreshing. Preserve the bound and
        // serve this one request directly instead of retaining another key.
        if (!createdEntry) return repository.read(request);
        entry = createdEntry;
      }
      touch(key, entry);
      if (entry.cached && now() - entry.cached.loadedAt < ttlMs) {
        return Promise.resolve(entry.cached.value);
      }
      if (entry.cached) {
        void refresh(key, entry, request).catch(onError);
        return Promise.resolve(entry.cached.value);
      }
      return refresh(key, entry, request);
    },
  };
}

function normalizeNewsResponseCacheMaxEntries(value: number | undefined): number {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) return DEFAULT_NEWS_RESPONSE_CACHE_MAX_ENTRIES;
  return Math.max(1, Math.floor(value as number));
}

export async function startContentApiServer(options: StartContentApiServerOptions): Promise<http.Server> {
  const host = options.host ?? DEFAULT_CONTENT_API_HOST;
  const port = options.port ?? DEFAULT_CONTENT_API_PORT;
  const server = createContentApiServer(options);
  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, host, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
  return server;
}

function allowHealthRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedHosts: ReadonlySet<string>,
): boolean {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return false;
  }
  if (!allowedHosts.has(req.headers.host ?? "")) {
    sendJson(res, 403, { ok: false, error: "forbidden_host" });
    return false;
  }
  return true;
}

function validateGate(
  req: http.IncomingMessage,
  allowedHosts: ReadonlySet<string>,
  allowedOrigins: ReadonlySet<string>,
  allowMissingOrigin: boolean,
): GateFailure | null {
  if (!allowedHosts.has(req.headers.host ?? "")) {
    return { status: 403, code: "forbidden_host" };
  }

  const origin = readSingleHeader(req, "origin");
  if (!origin) {
    return allowMissingOrigin ? null : { status: 403, code: "missing_origin" };
  }
  if (!allowedOrigins.has(origin)) return { status: 403, code: "forbidden_origin" };
  return null;
}

function setCorsHeaders(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedOrigins: ReadonlySet<string>,
): void {
  const origin = readSingleHeader(req, "origin");
  if (!origin || !allowedOrigins.has(origin)) return;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");
  res.setHeader("Vary", "Origin");
}

function parseRequestUrl(req: http.IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? DEFAULT_CONTENT_API_ALLOWED_HOSTS[0]}`);
}

function readSingleHeader(req: http.IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function sendAsset(res: http.ServerResponse, contentType: string, bytes: Uint8Array): void {
  if (res.headersSent) return;
  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(bytes.byteLength));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.end(bytes);
}

function sendJson(res: http.ServerResponse, status: number, body: unknown, cacheControl = "no-store"): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", cacheControl);
  res.end(`${JSON.stringify(body)}\n`);
}
