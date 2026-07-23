import http from "node:http";

import {
  ContentRequestError,
  parseContentReadRequest,
  type ContentReadRepository,
} from "./contract.ts";

export const CONTENT_API_PATH_PREFIX = "/api/content/v1/";
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
  readonly allowedHosts?: readonly string[];
  readonly allowedOrigins?: readonly string[];
  readonly allowMissingOrigin?: boolean;
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
      const request = parseContentReadRequest(requestUrl);
      const page = await options.repository.read(request);
      sendJson(res, 200, {
        items: page.items,
        totalCount: page.totalCount,
        hasMore: page.hasMore,
      });
    } catch (error) {
      if (error instanceof ContentRequestError) {
        sendJson(res, 400, { ok: false, error: error.code, message: error.message });
        return;
      }
      onError(error);
      sendJson(res, 503, { ok: false, error: "content_backend_unavailable" });
    }
  });
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

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  res.end(`${JSON.stringify(body)}\n`);
}