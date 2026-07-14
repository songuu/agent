const RETURN_PARAM = "from";

export function currentRelativePath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function safeReturnPathFromSearch(search: string, fallbackPath: string): string {
  const raw = new URLSearchParams(search).get(RETURN_PARAM)?.trim() || "";
  if (!raw) return fallbackPath;
  return isSafeRelativePath(raw) ? raw : fallbackPath;
}

export function withReturnPath(href: string, returnPath: string | null | undefined): string {
  if (!returnPath || !isSafeRelativePath(returnPath)) return href;
  const url = new URL(href, "https://agent-build.local");
  url.searchParams.set(RETURN_PARAM, returnPath);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function replaceCurrentSearch(params: URLSearchParams): void {
  if (typeof window === "undefined") return;
  const search = params.toString();
  const nextPath = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
  if (nextPath === currentRelativePath()) return;
  window.history.replaceState(window.history.state, "", nextPath);
}

export function positiveIntegerParam(params: URLSearchParams, key: string, fallback: number): number {
  const value = Number(params.get(key));
  if (!Number.isInteger(value) || value <= 0) return fallback;
  return value;
}

function isSafeRelativePath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return true;
}
