// Public Supabase 配置优先从静态运行时 JSON 读取，便于不重建前端切换项目地址。
// 编译期注入值只作为 JSON 缺失、失效或请求失败时的安全回退；service_role 不会进入这里。

declare const __FRONTIER_SUPABASE_CONFIG__: unknown;

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
  schema: string;
}
export interface SupabaseRuntimeConfigRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

const RUNTIME_CONFIG_FILE = "supabase-runtime-config.json";
const DEFAULT_RUNTIME_CONFIG_TIMEOUT_MS = 8_000;

let cachedConfig: Promise<SupabasePublicConfig | null> | null = null;

/**
 * Resolve the public read-only configuration once per page. Runtime JSON wins so
 * a static deployment can move Supabase projects without rebuilding its bundle.
 */
export function getSupabaseRuntimeConfig(
  options: SupabaseRuntimeConfigRequestOptions = {},
): Promise<SupabasePublicConfig | null> {
  if (!isBrowserRuntime()) return Promise.resolve(readCompiledConfig());
  if (options.signal) return loadBrowserSupabaseRuntimeConfig(options);

  cachedConfig ??= loadBrowserSupabaseRuntimeConfig(options);
  return cachedConfig;
}

/** Clears the in-memory value for an explicit retry or focused test. */
export function resetSupabaseRuntimeConfigCache(): void {
  cachedConfig = null;
}

async function loadBrowserSupabaseRuntimeConfig({
  signal: externalSignal,
  timeoutMs = DEFAULT_RUNTIME_CONFIG_TIMEOUT_MS,
}: SupabaseRuntimeConfigRequestOptions = {}): Promise<SupabasePublicConfig | null> {
  const compiledFallback = readCompiledConfig();
  const requestController = new AbortController();
  const abortRequest = (): void => requestController.abort();
  if (externalSignal?.aborted) abortRequest();
  else externalSignal?.addEventListener("abort", abortRequest, { once: true });

  const normalizedTimeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_RUNTIME_CONFIG_TIMEOUT_MS;
  const timeoutId = globalThis.setTimeout(abortRequest, normalizedTimeout);

  try {
    const response = await window.fetch(runtimeConfigUrl(), {
      cache: "no-store",
      signal: requestController.signal,
    });
    if (!response.ok) return compiledFallback;

    return readRuntimeConfig(await response.json()) ?? compiledFallback;
  } catch (error) {
    if (externalSignal?.aborted) throw error;
    return compiledFallback;
  } finally {
    globalThis.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortRequest);
  }
}

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined" && typeof window.fetch === "function";
}

function runtimeConfigUrl(): string {
  const viteEnv = (import.meta as ImportMeta & { env?: { BASE_URL?: unknown } }).env;
  const base = typeof viteEnv?.BASE_URL === "string" && viteEnv.BASE_URL.trim() ? viteEnv.BASE_URL : "/";
  return `${base.endsWith("/") ? base : `${base}/`}${RUNTIME_CONFIG_FILE}`;
}

function readRuntimeConfig(value: unknown): SupabasePublicConfig | null {
  if (!isRecord(value) || value.version !== 1) return null;
  return normalizePublicConfig(value.supabase);
}

function readCompiledConfig(): SupabasePublicConfig | null {
  const injected =
    typeof __FRONTIER_SUPABASE_CONFIG__ !== "undefined"
      ? __FRONTIER_SUPABASE_CONFIG__
      : (globalThis as { __FRONTIER_SUPABASE_CONFIG__?: unknown }).__FRONTIER_SUPABASE_CONFIG__;
  return normalizePublicConfig(injected);
}

function normalizePublicConfig(value: unknown): SupabasePublicConfig | null {
  if (!isRecord(value)) return null;

  const url = stringField(value.url);
  const anonKey = stringField(value.anonKey);
  const schema = stringField(value.schema) ?? "public";
  if (!url || !anonKey) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") return null;
  } catch {
    return null;
  }

  return { url, anonKey, schema };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}