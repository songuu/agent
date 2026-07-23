const RETURN_PARAM = "from";
const RETURN_POSITION_STORAGE_PREFIX = "agent-build:list-detail-return:v1:";
export const LIST_DETAIL_RETURN_POSITION_TTL_MS = 12 * 60 * 60 * 1000;

export interface ListDetailReturnPosition {
  readonly version: 1;
  readonly returnPath: string;
  readonly itemKey: string;
  readonly scrollX: number;
  readonly scrollY: number;
  readonly anchorViewportTop: number | null;
  readonly savedAt: number;
}

interface ListDetailReturnPositionInput {
  readonly returnPath: string;
  readonly itemKey: string;
  readonly scrollX: number;
  readonly scrollY: number;
  readonly anchorViewportTop?: number | null;
  readonly savedAt?: number;
}

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

export function createListDetailReturnPosition(
  input: ListDetailReturnPositionInput,
): ListDetailReturnPosition | null {
  const itemKey = input.itemKey.trim();
  const savedAt = input.savedAt ?? Date.now();
  if (!isSafeRelativePath(input.returnPath) || !itemKey) return null;
  if (![input.scrollX, input.scrollY, savedAt].every(Number.isFinite)) return null;
  if (input.anchorViewportTop != null && !Number.isFinite(input.anchorViewportTop)) return null;

  return {
    version: 1,
    returnPath: input.returnPath,
    itemKey,
    scrollX: Math.max(0, input.scrollX),
    scrollY: Math.max(0, input.scrollY),
    anchorViewportTop: input.anchorViewportTop ?? null,
    savedAt,
  };
}

export function parseListDetailReturnPosition(
  raw: string | null,
  expectedReturnPath: string,
  now = Date.now(),
): ListDetailReturnPosition | null {
  if (!raw || !isSafeRelativePath(expectedReturnPath)) return null;
  try {
    const value = JSON.parse(raw) as Partial<ListDetailReturnPosition>;
    const position = createListDetailReturnPosition({
      returnPath: typeof value.returnPath === "string" ? value.returnPath : "",
      itemKey: typeof value.itemKey === "string" ? value.itemKey : "",
      scrollX: typeof value.scrollX === "number" ? value.scrollX : Number.NaN,
      scrollY: typeof value.scrollY === "number" ? value.scrollY : Number.NaN,
      anchorViewportTop:
        value.anchorViewportTop === null || typeof value.anchorViewportTop === "number"
          ? value.anchorViewportTop
          : Number.NaN,
      savedAt: typeof value.savedAt === "number" ? value.savedAt : Number.NaN,
    });
    if (!position || value.version !== 1 || position.returnPath !== expectedReturnPath) return null;
    if (position.savedAt > now || now - position.savedAt > LIST_DETAIL_RETURN_POSITION_TTL_MS) {
      return null;
    }
    return position;
  } catch {
    return null;
  }
}

export function resolveListDetailScrollTop(
  position: ListDetailReturnPosition,
  currentScrollY: number,
  currentAnchorViewportTop: number | null,
): number {
  if (position.anchorViewportTop === null || currentAnchorViewportTop === null) {
    return position.scrollY;
  }
  return Math.max(0, currentScrollY + currentAnchorViewportTop - position.anchorViewportTop);
}

export function rememberListDetailPosition(
  returnPath: string,
  itemKey: string,
  anchor?: HTMLElement | null,
): void {
  if (typeof window === "undefined") return;
  const position = createListDetailReturnPosition({
    returnPath,
    itemKey,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    anchorViewportTop: anchor?.getBoundingClientRect().top ?? null,
  });
  if (!position) return;

  try {
    window.sessionStorage.setItem(returnPositionStorageKey(returnPath), JSON.stringify(position));
  } catch {
    // Navigation must continue when storage is unavailable or full.
  }
}

export function restoreListDetailPosition(
  root: HTMLElement,
  returnPath = currentRelativePath(),
): boolean {
  if (typeof window === "undefined" || !isSafeRelativePath(returnPath)) return false;
  const storageKey = returnPositionStorageKey(returnPath);
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(storageKey);
  } catch {
    return false;
  }

  const position = parseListDetailReturnPosition(raw, returnPath);
  if (!position) {
    if (raw !== null) removeStoredReturnPosition(storageKey);
    return false;
  }

  const anchor = [...root.querySelectorAll<HTMLElement>("[data-list-detail-key]")].find(
    (element) => element.dataset.listDetailKey === position.itemKey,
  );

  const restore = (): void => {
    if (!root.isConnected || currentRelativePath() !== position.returnPath) return;
    const anchorTop = anchor?.isConnected ? anchor.getBoundingClientRect().top : null;
    window.scrollTo({
      left: position.scrollX,
      top: resolveListDetailScrollTop(position, window.scrollY, anchorTop),
      behavior: "auto",
    });
    removeStoredReturnPosition(storageKey);
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(restore));
  } else {
    window.setTimeout(restore, 0);
  }
  return true;
}

function removeStoredReturnPosition(storageKey: string): void {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Scroll restoration must remain best-effort when storage is unavailable.
  }
}

export function shouldRememberListDetailClick(
  event: Pick<MouseEvent, "button" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">,
): boolean {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function returnPositionStorageKey(returnPath: string): string {
  return `${RETURN_POSITION_STORAGE_PREFIX}${encodeURIComponent(returnPath)}`;
}

function isSafeRelativePath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return false;
  try {
    const base = new URL("https://agent-build.local");
    return new URL(value, base).origin === base.origin;
  } catch {
    return false;
  }
}
