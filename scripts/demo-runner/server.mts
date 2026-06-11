import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  normalizeSelectionChatRequest,
  type SelectionChatFrame,
  type SelectionChatHandler,
} from "./selection-chat.mjs";

export const DEFAULT_RUNNER_HOST = "127.0.0.1";
export const DEFAULT_RUNNER_PORT = 5174;
export const DEFAULT_ALLOWED_HOSTS = [
  "127.0.0.1:5174",
  "localhost:5174",
] as const;
export const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
] as const;

const RUNNER_HEADER = "x-demo-runner";
const TOKEN_HEADER = "x-demo-runner-token";
const TOKEN_FILE = ".vitepress/cache/demo-runner.json";
const CORS_ALLOWED_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOWED_HEADERS = "X-Demo-Runner, X-Demo-Runner-Token, Content-Type";
const CORS_ALLOWED_REQUEST_HEADERS = new Set([
  "content-type",
  RUNNER_HEADER,
  TOKEN_HEADER,
]);

type BaseUrlKind = "official" | "localhost" | "custom";
type OllamaReachable = "unknown" | "yes" | "no";

export interface DemoRunnerConfig {
  provider: string;
  model: string;
  hasKey: boolean;
  baseURL: BaseUrlKind;
  ollamaReachable: OllamaReachable;
}

export interface DemoRunFrame {
  type: "stdout" | "stderr" | "thinking" | "done" | "exit";
  data: string | number | Record<string, unknown>;
}

export interface DemoRunContext {
  demoId: string;
  signal: AbortSignal;
  writeFrame: (frame: DemoRunFrame) => void;
}

export type DemoRunHandler = (context: DemoRunContext) => Promise<void>;

export interface DemoRunnerServerOptions {
  token?: string;
  requireToken?: boolean;
  allowMissingOrigin?: boolean;
  allowedHosts?: readonly string[];
  allowedOrigins?: readonly string[];
  env?: NodeJS.ProcessEnv;
  runDemo?: DemoRunHandler;
  selectionChat?: SelectionChatHandler;
}

interface GateFailure {
  ok: false;
  statusCode: number;
  code: string;
}

interface GateSuccess {
  ok: true;
}

type GateResult = GateSuccess | GateFailure;

export function createRunnerToken(): string {
  return randomBytes(32).toString("base64url");
}

export function getDemoRunnerConfig(env: NodeJS.ProcessEnv = process.env): DemoRunnerConfig {
  const provider = env.LLM_PROVIDER?.trim() || "anthropic";
  const model = readModel(provider, env);
  const apiKey = readApiKey(provider, env);
  const baseURL = classifyBaseUrl(readBaseUrl(provider, env));

  return {
    provider,
    model,
    hasKey: Boolean(apiKey && apiKey.trim()),
    baseURL,
    ollamaReachable: "unknown",
  };
}

export function writeRunnerTokenFile(repoRoot: string, token: string): string {
  const target = resolve(repoRoot, TOKEN_FILE);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    `${JSON.stringify({ token, port: DEFAULT_RUNNER_PORT }, null, 2)}\n`,
    "utf8",
  );
  return target;
}

export function createDemoRunnerServer(
  options: DemoRunnerServerOptions = {},
): http.Server {
  const token = options.token ?? createRunnerToken();
  const requireToken = options.requireToken ?? true;
  const allowMissingOrigin = options.allowMissingOrigin ?? false;
  const allowedHosts = new Set(options.allowedHosts ?? DEFAULT_ALLOWED_HOSTS);
  const allowedOrigins = new Set(options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS);
  const env = options.env ?? process.env;

  let activeAbortController: AbortController | undefined;
  let activeSelectionChatAbortController: AbortController | undefined;

  return http.createServer(async (req, res) => {
    try {
      const requestUrl = parseRequestUrl(req);
      if (!requestUrl.pathname.startsWith("/api/")) {
        sendJson(res, 404, { ok: false, error: "not_found" });
        return;
      }

      if (req.method === "OPTIONS") {
        handleCorsPreflight(req, res, allowedHosts, allowedOrigins);
        return;
      }

      const gate = validateGate(req, {
        token,
        requireToken,
        allowMissingOrigin,
        allowedHosts,
        allowedOrigins,
      });
      if (!gate.ok) {
        sendJson(res, gate.statusCode, { ok: false, error: gate.code });
        return;
      }
      setCorsHeaders(req, res, allowedOrigins);

      if (requestUrl.pathname === "/api/health") {
        if (!allowMethod(req, res, "GET")) return;
        sendJson(res, 200, { ok: true });
        return;
      }

      if (requestUrl.pathname === "/api/config") {
        if (!allowMethod(req, res, "GET")) return;
        sendJson(res, 200, { ok: true, config: getDemoRunnerConfig(env) });
        return;
      }

      if (requestUrl.pathname === "/api/stop") {
        if (!allowMethod(req, res, "POST")) return;
        const stopped = Boolean(activeAbortController || activeSelectionChatAbortController);
        activeAbortController?.abort();
        activeAbortController = undefined;
        activeSelectionChatAbortController?.abort();
        activeSelectionChatAbortController = undefined;
        sendJson(res, 200, { ok: true, stopped });
        return;
      }

      if (requestUrl.pathname === "/api/selection-chat") {
        if (!allowMethod(req, res, "POST")) return;
        if (activeSelectionChatAbortController) {
          sendJson(res, 429, { ok: false, error: "selection_chat_busy" });
          return;
        }
        if (!options.selectionChat) {
          sendJson(res, 501, { ok: false, error: "selection_chat_not_implemented" });
          return;
        }

        let chatRequest;
        try {
          chatRequest = normalizeSelectionChatRequest(await readJsonBody(req));
        } catch (error) {
          sendJson(res, 400, {
            ok: false,
            error: error instanceof Error ? error.message : "invalid_request",
          });
          return;
        }

        activeSelectionChatAbortController = new AbortController();
        streamNdjson(res);
        const abortController = activeSelectionChatAbortController;
        const writeFrame = (frame: SelectionChatFrame) => {
          res.write(`${JSON.stringify(frame)}\n`);
        };

        res.on("close", () => {
          if (!res.writableEnded) abortController.abort();
        });

        try {
          await options.selectionChat({
            request: chatRequest,
            signal: abortController.signal,
            writeFrame,
          });
        } catch (error) {
          writeFrame({
            type: "error",
            data: error instanceof Error ? error.message : "selection chat failed",
          });
        } finally {
          if (activeSelectionChatAbortController === abortController) {
            activeSelectionChatAbortController = undefined;
          }
          res.end();
        }
        return;
      }

      if (requestUrl.pathname === "/api/run") {
        if (!allowMethod(req, res, "POST")) return;
        if (activeAbortController) {
          sendJson(res, 429, { ok: false, error: "runner_busy" });
          return;
        }

        const demoId = requestUrl.searchParams.get("demo")?.trim();
        if (!demoId) {
          sendJson(res, 400, { ok: false, error: "missing_demo_id" });
          return;
        }

        if (!options.runDemo) {
          sendJson(res, 501, { ok: false, error: "runner_not_implemented" });
          return;
        }

        activeAbortController = new AbortController();
        streamNdjson(res);
        const abortController = activeAbortController;
        const writeFrame = (frame: DemoRunFrame) => {
          res.write(`${JSON.stringify(frame)}\n`);
        };

        res.on("close", () => {
          if (!res.writableEnded) abortController.abort();
        });

        try {
          await options.runDemo({
            demoId,
            signal: abortController.signal,
            writeFrame,
          });
        } catch {
          writeFrame({ type: "stderr", data: "demo runner failed" });
          writeFrame({ type: "exit", data: 1 });
        } finally {
          if (activeAbortController === abortController) {
            activeAbortController = undefined;
          }
          res.end();
        }
        return;
      }

      sendJson(res, 404, { ok: false, error: "not_found" });
    } catch {
      sendJson(res, 500, { ok: false, error: "internal_error" });
    }
  });
}

export async function startDemoRunnerServer(
  options: {
    repoRoot?: string;
    port?: number;
    token?: string;
    requireToken?: boolean;
    allowMissingOrigin?: boolean;
    allowedHosts?: readonly string[];
    allowedOrigins?: readonly string[];
    writeTokenFile?: boolean;
    runDemo?: DemoRunHandler;
    selectionChat?: SelectionChatHandler;
  } = {},
): Promise<http.Server> {
  const repoRoot = options.repoRoot ?? resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const port = options.port ?? DEFAULT_RUNNER_PORT;
  const token = options.token ?? createRunnerToken();

  const server = createDemoRunnerServer({
    token,
    requireToken: options.requireToken,
    allowMissingOrigin: options.allowMissingOrigin,
    allowedHosts: options.allowedHosts,
    allowedOrigins: options.allowedOrigins,
    runDemo: options.runDemo,
    selectionChat: options.selectionChat,
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, DEFAULT_RUNNER_HOST, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });

  if (options.writeTokenFile ?? true) {
    writeRunnerTokenFile(repoRoot, token);
  }
  return server;
}

function validateGate(
  req: http.IncomingMessage,
  options: {
    token: string;
    requireToken: boolean;
    allowMissingOrigin: boolean;
    allowedHosts: Set<string>;
    allowedOrigins: Set<string>;
  },
): GateResult {
  const host = req.headers.host ?? "";
  if (!options.allowedHosts.has(host)) {
    return { ok: false, statusCode: 403, code: "forbidden_host" };
  }

  const origin = req.headers.origin;
  if ((!origin && !options.allowMissingOrigin) || (origin && !options.allowedOrigins.has(origin))) {
    return { ok: false, statusCode: 403, code: "forbidden_origin" };
  }

  if (readSingleHeader(req, RUNNER_HEADER) !== "1") {
    return { ok: false, statusCode: 403, code: "missing_runner_header" };
  }

  if (options.requireToken && readSingleHeader(req, TOKEN_HEADER) !== options.token) {
    return { ok: false, statusCode: 403, code: "bad_runner_token" };
  }

  return { ok: true };
}

function handleCorsPreflight(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedHosts: Set<string>,
  allowedOrigins: Set<string>,
): void {
  const host = req.headers.host ?? "";
  if (!allowedHosts.has(host)) {
    sendJson(res, 403, { ok: false, error: "forbidden_host" });
    return;
  }

  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) {
    sendJson(res, 403, { ok: false, error: "forbidden_origin" });
    return;
  }

  const requestedMethod = readSingleHeader(req, "access-control-request-method");
  if (requestedMethod && !["GET", "POST"].includes(requestedMethod.toUpperCase())) {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const requestedHeaders = readSingleHeader(req, "access-control-request-headers");
  const hasForbiddenHeader = requestedHeaders
    ?.split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean)
    .some((header) => !CORS_ALLOWED_REQUEST_HEADERS.has(header));
  if (hasForbiddenHeader) {
    sendJson(res, 403, { ok: false, error: "forbidden_header" });
    return;
  }

  setCorsHeaders(req, res, allowedOrigins);
  res.statusCode = 204;
  res.end();
}

function setCorsHeaders(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedOrigins: Set<string>,
): void {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) return;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", CORS_ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", CORS_ALLOWED_HEADERS);
  res.setHeader("Access-Control-Max-Age", "600");
  res.setHeader("Vary", "Origin");
}

function parseRequestUrl(req: http.IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? DEFAULT_ALLOWED_HOSTS[0]}`);
}

function allowMethod(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  method: string,
): boolean {
  if (req.method === method) return true;
  res.setHeader("Allow", method);
  sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  return false;
}

function sendJson(res: http.ServerResponse, statusCode: number, body: unknown): void {
  if (res.headersSent) return;
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(`${JSON.stringify(body)}\n`);
}

function readJsonBody(req: http.IncomingMessage, maxBytes = 32_768): Promise<unknown> {
  return new Promise((resolveRead, rejectRead) => {
    let body = "";
    let tooLarge = false;
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > maxBytes) tooLarge = true;
    });
    req.on("end", () => {
      if (tooLarge) {
        rejectRead(new Error("request body too large"));
        return;
      }
      try {
        resolveRead(body ? JSON.parse(body) : {});
      } catch {
        rejectRead(new Error("request body must be valid JSON"));
      }
    });
    req.on("error", rejectRead);
  });
}

function streamNdjson(res: http.ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-transform");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function readSingleHeader(req: http.IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function readModel(provider: string, env: NodeJS.ProcessEnv): string {
  if (provider === "openai") return env.OPENAI_MODEL?.trim() || "gpt-4o";
  if (provider === "ollama") return env.OLLAMA_MODEL?.trim() || "llama3.2";
  return env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-latest";
}

function readApiKey(provider: string, env: NodeJS.ProcessEnv): string | undefined {
  if (provider === "openai") return env.OPENAI_API_KEY;
  if (provider === "ollama") return env.OLLAMA_API_KEY;
  return env.ANTHROPIC_API_KEY;
}

function readBaseUrl(provider: string, env: NodeJS.ProcessEnv): string | undefined {
  if (provider === "openai") return env.OPENAI_BASE_URL;
  if (provider === "ollama") return env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1";
  return env.ANTHROPIC_BASE_URL;
}

function classifyBaseUrl(baseURL: string | undefined): BaseUrlKind {
  if (!baseURL) return "official";
  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(baseURL)) {
    return "localhost";
  }
  return "custom";
}

function isDirectEntry(metaUrl: string): boolean {
  const entry = process.argv[1];
  return Boolean(entry && pathToFileURL(entry).href === metaUrl);
}

if (isDirectEntry(import.meta.url)) {
  if (process.env.DEMO_RUNNER_ENABLED !== "1") {
    console.error("demo runner is disabled. Set DEMO_RUNNER_ENABLED=1 to start it.");
    process.exitCode = 1;
  } else {
    try {
      const server = await startDemoRunnerServer();
      const closeServer = () => {
        server.close(() => {
          process.exit(0);
        });
        setTimeout(() => process.exit(1), 3000).unref();
      };
      process.once("SIGINT", closeServer);
      process.once("SIGTERM", closeServer);
      const address = server.address();
      const addressLabel =
        typeof address === "object" && address
          ? `${address.address}:${address.port}`
          : `${DEFAULT_RUNNER_HOST}:${DEFAULT_RUNNER_PORT}`;
      console.log(`demo runner listening on ${addressLabel}`);
      console.log("dev-only: do not expose or proxy this server.");
    } catch (error) {
      console.error(error instanceof Error ? error.message : "failed to start demo runner");
      process.exitCode = 1;
    }
  }
}
