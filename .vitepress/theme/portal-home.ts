import { fetchPostgrestPage } from "./postgrest-pagination";
import { currentRelativePath, withReturnPath } from "./list-detail-return";
import { getSupabaseRuntimeConfig, type SupabasePublicConfig } from "./supabase-runtime-config";

export interface PortalNewsItem {
  externalId: string;
  title: string;
  summary: string;
  sourceName: string;
  publishedDate: string;
}

export type PortalNewsLoadState = "ready" | "unavailable" | "empty" | "error";

export interface PortalNewsLoadResult {
  state: PortalNewsLoadState;
  items: PortalNewsItem[];
}

const PORTAL_NEWS_COLUMNS = [
  "external_id",
  "title",
  "summary",
  "content_excerpt",
  "source_name",
  "published_date",
  "published_at",
].join(",");
const PORTAL_NEWS_LIMIT = 5;
const PORTAL_SUMMARY_LIMIT = 110;
const PORTAL_NEWS_TIMEOUT_MS = 8_000;
const BASE = (import.meta.env?.BASE_URL ?? "/") as string;
const initialized = new WeakSet<HTMLElement>();
const activeRequests = new Map<HTMLElement, AbortController>();

export function normalizePortalNewsRow(value: unknown): PortalNewsItem | null {
  if (!isRecord(value)) return null;

  const externalId = stringField(value.external_id);
  const title = stringField(value.title);
  if (!externalId || !title) return null;

  const summary = stringField(value.summary) ?? stringField(value.content_excerpt) ?? "";
  const publishedAt = stringField(value.published_at);
  return {
    externalId,
    title,
    summary: compactPortalSummary(summary, PORTAL_SUMMARY_LIMIT),
    sourceName: stringField(value.source_name) ?? "来源待确认",
    publishedDate: stringField(value.published_date) ?? publishedAt?.slice(0, 10) ?? "日期待确认",
  };
}

export function compactPortalSummary(value: string, maxLength = PORTAL_SUMMARY_LIMIT): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "查看完整资讯与来源信息";
  if (!Number.isInteger(maxLength) || maxLength < 2 || normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function fetchPortalNewsPage(
  config: SupabasePublicConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<PortalNewsItem[]> {
  const page = await fetchPostgrestPage<unknown>({
    config,
    table: "news_items",
    select: PORTAL_NEWS_COLUMNS,
    order: ["published_date.desc", "published_at.desc"],
    pageSize: PORTAL_NEWS_LIMIT,
    offset: 0,
    count: "none",
    fetchImpl,
  });

  const items: PortalNewsItem[] = [];
  for (const row of page.rows) {
    const item = normalizePortalNewsRow(row);
    if (item) items.push(item);
  }
  return items;
}

export async function loadPortalNews(
  config: SupabasePublicConfig | null,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = PORTAL_NEWS_TIMEOUT_MS,
  externalSignal?: AbortSignal,
): Promise<PortalNewsLoadResult> {
  if (!config) return { state: "unavailable", items: [] };

  const requestController = new AbortController();
  const abortRequest = (): void => requestController.abort();
  if (externalSignal?.aborted) abortRequest();
  else externalSignal?.addEventListener("abort", abortRequest, { once: true });

  const normalizedTimeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : PORTAL_NEWS_TIMEOUT_MS;
  const timeoutId = globalThis.setTimeout(abortRequest, normalizedTimeout);
  const boundedFetch: typeof fetch = (input, init) =>
    fetchImpl(input, { ...init, signal: requestController.signal });

  try {
    const items = await fetchPortalNewsPage(config, boundedFetch);
    return items.length > 0 ? { state: "ready", items } : { state: "empty", items: [] };
  } catch {
    return { state: "error", items: [] };
  } finally {
    globalThis.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortRequest);
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installPortalNews, { once: true });
  } else {
    installPortalNews();
  }
}

function installPortalNews(): void {
  scanPortalNews();
  const observer = new MutationObserver(scanPortalNews);
  observer.observe(document.body, { childList: true, subtree: true });
}

export function isPortalPath(pathname: string, base = BASE): boolean {
  const normalizedBase = normalizeBasePath(base);
  const withoutIndex = pathname.replace(/\/index\.html$/, "/");
  const normalizedPath =
    withoutIndex === "/" ? "/" : `${withoutIndex.replace(/\/+$/, "")}/`;
  return normalizedPath === normalizedBase;
}

function scanPortalNews(): void {
  const onPortalRoute = isPortalPath(window.location.pathname);
  cancelPortalRequests(!onPortalRoute);
  if (!onPortalRoute) return;

  const root = document.querySelector<HTMLElement>("[data-agent-portal-news]");
  if (!root || initialized.has(root)) return;
  initialized.add(root);
  void enhancePortalNews(root);
}

function cancelPortalRequests(force = false): void {
  for (const [root, controller] of activeRequests) {
    if (!force && root.isConnected) continue;
    controller.abort();
    activeRequests.delete(root);
  }
}

function normalizeBasePath(base: string): string {
  const segment = base.trim().replace(/^\/+|\/+$/g, "");
  return segment ? `/${segment}/` : "/";
}

async function enhancePortalNews(root: HTMLElement): Promise<void> {
  root.dataset.newsState = "loading";
  const lifecycleController = new AbortController();
  const deadlineId = window.setTimeout(() => lifecycleController.abort(), PORTAL_NEWS_TIMEOUT_MS);
  activeRequests.set(root, lifecycleController);

  try {
    const config = await getSupabaseRuntimeConfig({
      signal: lifecycleController.signal,
      timeoutMs: PORTAL_NEWS_TIMEOUT_MS,
    });
    const result = await loadPortalNews(
      config,
      fetch,
      PORTAL_NEWS_TIMEOUT_MS,
      lifecycleController.signal,
    );
    if (!canRenderPortalNews(root)) return;

    if (result.state === "ready") {
      renderPortalNews(root, result.items);
      return;
    }
    if (result.state === "unavailable") {
      renderPortalFallback(
        root,
        "实时情报尚未配置",
        "完整资讯归档与课程内容仍可正常访问。",
        result.state,
      );
      return;
    }
    if (result.state === "empty") {
      renderPortalFallback(root, "暂时没有新情报", "数据源已连接，等待下一次内容同步。", result.state);
      return;
    }
    renderPortalFallback(root, "实时情报暂时不可用", "可以前往资讯归档重试，不影响其他学习内容。", result.state);
  } catch {
    if (canRenderPortalNews(root)) {
      renderPortalFallback(root, "实时情报暂时不可用", "可以前往资讯归档重试，不影响其他学习内容。", "error");
    }
  } finally {
    window.clearTimeout(deadlineId);
    if (activeRequests.get(root) === lifecycleController) activeRequests.delete(root);
  }
}

function canRenderPortalNews(root: HTMLElement): boolean {
  return root.isConnected && isPortalPath(window.location.pathname);
}

function renderPortalNews(root: HTMLElement, items: readonly PortalNewsItem[]): void {
  const list = document.createElement("ol");
  list.className = "agent-portal-news-list";
  for (const item of items) list.append(createPortalNewsItem(item));
  root.replaceChildren(list);
  root.dataset.newsState = "ready";
}

function createPortalNewsItem(item: PortalNewsItem): HTMLLIElement {
  const row = document.createElement("li");
  row.className = "agent-portal-news-item";

  const meta = document.createElement("span");
  meta.className = "agent-portal-news-item__meta";
  meta.textContent = `${formatPortalDate(item.publishedDate)} · ${item.sourceName}`;

  const body = document.createElement("div");
  body.className = "agent-portal-news-item__body";
  const title = document.createElement("strong");
  title.textContent = item.title;
  const summary = document.createElement("p");
  summary.textContent = item.summary;
  body.append(title, summary);

  const link = document.createElement("a");
  link.href = buildPortalNewsDetailUrl(item.externalId, currentRelativePath());
  link.setAttribute("aria-label", `阅读：${item.title}`);
  link.textContent = "↗";

  row.append(meta, body, link);
  return row;
}

function renderPortalFallback(
  root: HTMLElement,
  title: string,
  detail: string,
  state: "unavailable" | "empty" | "error",
): void {
  const shell = document.createElement("div");
  shell.className = "agent-portal-news__fallback";

  const copy = document.createElement("div");
  const heading = document.createElement("p");
  heading.textContent = title;
  const description = document.createElement("span");
  description.textContent = detail;
  copy.append(heading, description);

  const link = document.createElement("a");
  link.href = withBase("news/");
  link.textContent = "打开资讯归档";
  shell.append(copy, link);

  root.replaceChildren(shell);
  root.dataset.newsState = state;
}

export function buildPortalNewsDetailUrl(externalId: string, returnPath: string): string {
  return withReturnPath(
    `${withBase("news/article")}?id=${encodeURIComponent(externalId)}`,
    returnPath,
  );
}

function withBase(path: string): string {
  const normalizedBase = BASE.endsWith("/") ? BASE : `${BASE}/`;
  return `${normalizedBase}${path.replace(/^\/+/, "")}`;
}

function formatPortalDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.replaceAll("-", ".") : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
