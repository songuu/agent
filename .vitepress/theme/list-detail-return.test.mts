import assert from "node:assert/strict";
import test from "node:test";
import {
  createListDetailReturnPosition,
  LIST_DETAIL_RETURN_POSITION_TTL_MS,
  parseListDetailReturnPosition,
  positiveIntegerParam,
  restoreListDetailPosition,
  resolveListDetailScrollTop,
  safeReturnPathFromSearch,
  shouldRememberListDetailClick,
  withReturnPath,
} from "./list-detail-return";

test("withReturnPath appends encoded same-site return path", () => {
  assert.equal(
    withReturnPath("/news/article?id=a", "/news/?page=3&pageSize=20"),
    "/news/article?id=a&from=%2Fnews%2F%3Fpage%3D3%26pageSize%3D20",
  );
});

test("withReturnPath ignores unsafe return path", () => {
  assert.equal(withReturnPath("/news/article?id=a", "https://evil.test/list"), "/news/article?id=a");
  assert.equal(withReturnPath("/news/article?id=a", "//evil.test/list"), "/news/article?id=a");
  assert.equal(withReturnPath("/news/article?id=a", "/\\evil.test/list"), "/news/article?id=a");
});

test("safeReturnPathFromSearch falls back for missing or unsafe path", () => {
  assert.equal(safeReturnPathFromSearch("?from=%2Fnews%2F%3Fpage%3D3", "/news/"), "/news/?page=3");
  assert.equal(safeReturnPathFromSearch("?from=https%3A%2F%2Fevil.test", "/news/"), "/news/");
  assert.equal(safeReturnPathFromSearch("?from=%2F%5Cevil.test%2Flist", "/news/"), "/news/");
  assert.equal(safeReturnPathFromSearch("", "/news/"), "/news/");
});

test("positiveIntegerParam accepts only positive integers", () => {
  assert.equal(positiveIntegerParam(new URLSearchParams("page=3"), "page", 1), 3);
  assert.equal(positiveIntegerParam(new URLSearchParams("page=0"), "page", 1), 1);
  assert.equal(positiveIntegerParam(new URLSearchParams("page=2.5"), "page", 1), 1);
});

test("list return position keeps path, scroll, and clicked-card offset", () => {
  const position = createListDetailReturnPosition({
    returnPath: "/news/?page=3&pageSize=20",
    itemKey: "article-42",
    scrollX: 0,
    scrollY: 1640,
    anchorViewportTop: 236,
    savedAt: 1000,
  });

  assert.deepEqual(position, {
    version: 1,
    returnPath: "/news/?page=3&pageSize=20",
    itemKey: "article-42",
    scrollX: 0,
    scrollY: 1640,
    anchorViewportTop: 236,
    savedAt: 1000,
  });
});

test("list return position rejects unsafe, mismatched, and expired records", () => {
  const raw = JSON.stringify({
    version: 1,
    returnPath: "/news/?page=3",
    itemKey: "article-42",
    scrollX: 0,
    scrollY: 1640,
    anchorViewportTop: 236,
    savedAt: 1000,
  });

  assert.equal(parseListDetailReturnPosition(raw, "/news/?page=3", 1001)?.itemKey, "article-42");
  assert.equal(parseListDetailReturnPosition(raw, "/news/?page=4", 1001), null);
  assert.equal(parseListDetailReturnPosition(raw, "https://evil.test/news", 1001), null);
  assert.equal(
    parseListDetailReturnPosition(raw, "/news/?page=3", 1000 + LIST_DETAIL_RETURN_POSITION_TTL_MS + 1),
    null,
  );
});

test("list return position aligns the clicked card to its original viewport offset", () => {
  const position = createListDetailReturnPosition({
    returnPath: "/news/",
    itemKey: "article-42",
    scrollX: 0,
    scrollY: 1640,
    anchorViewportTop: 236,
    savedAt: 1000,
  });
  assert.ok(position);
  assert.equal(resolveListDetailScrollTop(position, 0, 2000), 1764);
  assert.equal(resolveListDetailScrollTop(position, 0, null), 1640);
});

test("modified clicks do not overwrite current-tab return position", () => {
  assert.equal(
    shouldRememberListDetailClick({ button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false }),
    true,
  );
  assert.equal(
    shouldRememberListDetailClick({ button: 0, altKey: false, ctrlKey: true, metaKey: false, shiftKey: false }),
    false,
  );
  assert.equal(
    shouldRememberListDetailClick({ button: 1, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false }),
    false,
  );
});

test("restore consumes the matching record and preserves the clicked card viewport offset", () => {
  const scheduledFrames: FrameRequestCallback[] = [];
  const scrollCalls: ScrollToOptions[] = [];
  const returnPath = "/news/?page=3&pageSize=20";
  const raw = JSON.stringify({
    version: 1,
    returnPath,
    itemKey: "article-42",
    scrollX: 0,
    scrollY: 1640,
    anchorViewportTop: 236,
    savedAt: Date.now(),
  });
  let removedKey = "";
  const anchor = {
    dataset: { listDetailKey: "article-42" },
    isConnected: true,
    getBoundingClientRect: () => ({ top: 1876 }),
  };
  const root = {
    isConnected: true,
    querySelectorAll: () => [anchor],
  };
  const fakeWindow = {
    location: { pathname: "/news/", search: "?page=3&pageSize=20", hash: "" },
    sessionStorage: {
      getItem: () => raw,
      removeItem: (key: string) => {
        removedKey = key;
      },
    },
    scrollX: 0,
    scrollY: 0,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      scheduledFrames.push(callback);
      return scheduledFrames.length;
    },
    setTimeout: (callback: TimerHandler) => {
      if (typeof callback === "function") callback();
      return 1;
    },
    scrollTo: (options: ScrollToOptions) => {
      scrollCalls.push(options);
      fakeWindow.scrollX = options.left ?? 0;
      fakeWindow.scrollY = options.top ?? 0;
    },
  };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });

  try {
    assert.equal(restoreListDetailPosition(root as unknown as HTMLElement, returnPath), true);
    while (scheduledFrames.length > 0) scheduledFrames.shift()?.(0);
    assert.equal(scrollCalls.at(-1)?.top, 1640);
    assert.match(removedKey, /page%3D3%26pageSize%3D20$/);
  } finally {
    restoreGlobalWindow(previousWindow);
  }
});

test("restore waits for delayed list rendering before positioning the clicked card", () => {
  const scheduledFrames: FrameRequestCallback[] = [];
  const scrollCalls: ScrollToOptions[] = [];
  const removedKeys: string[] = [];
  const returnPath = "/news/?page=3&pageSize=20";
  const raw = JSON.stringify({
    version: 1,
    returnPath,
    itemKey: "article-42",
    scrollX: 0,
    scrollY: 1640,
    anchorViewportTop: 236,
    savedAt: Date.now(),
  });
  const anchor = {
    dataset: { listDetailKey: "article-42" },
    isConnected: true,
    getBoundingClientRect: () => ({ top: 2000 }),
  };
  let anchorAvailable = false;
  let mutationCallback: MutationCallback | null = null;
  let observerDisconnected = false;
  let observedTarget: unknown = null;
  let observedOptions: MutationObserverInit | null = null;
  const root = {
    isConnected: true,
    querySelectorAll: () => (anchorAvailable ? [anchor] : []),
  };
  const fakeWindow = {
    location: { pathname: "/news/", search: "?page=3&pageSize=20", hash: "" },
    sessionStorage: {
      getItem: () => raw,
      removeItem: (key: string) => removedKeys.push(key),
    },
    scrollX: 0,
    scrollY: 0,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      scheduledFrames.push(callback);
      return scheduledFrames.length;
    },
    setTimeout: () => 1,
    clearTimeout: () => undefined,
    scrollTo: (options: ScrollToOptions) => {
      scrollCalls.push(options);
      fakeWindow.scrollX = options.left ?? 0;
      fakeWindow.scrollY = options.top ?? 0;
    },
  };
  class FakeMutationObserver {
    constructor(callback: MutationCallback) {
      mutationCallback = callback;
    }

    observe(target: Node, options?: MutationObserverInit): void {
      observedTarget = target;
      observedOptions = options ?? null;
    }

    disconnect(): void {
      observerDisconnected = true;
    }

    takeRecords(): MutationRecord[] {
      return [];
    }
  }
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousMutationObserver = Object.getOwnPropertyDescriptor(globalThis, "MutationObserver");
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, "MutationObserver", {
    configurable: true,
    value: FakeMutationObserver,
  });

  try {
    assert.equal(restoreListDetailPosition(root as unknown as HTMLElement, returnPath), true);
    while (scheduledFrames.length > 0) scheduledFrames.shift()?.(0);

    assert.equal(scrollCalls.length, 0);
    assert.equal(removedKeys.length, 0);
    assert.ok(mutationCallback, "missing target should install a DOM observer");
    assert.equal(observedTarget, root);
    assert.deepEqual(observedOptions, { childList: true, subtree: true });

    mutationCallback([], {} as MutationObserver);
    while (scheduledFrames.length > 0) scheduledFrames.shift()?.(0);
    assert.equal(scrollCalls.length, 0);
    assert.equal(removedKeys.length, 0);

    anchorAvailable = true;
    mutationCallback([], {} as MutationObserver);
    while (scheduledFrames.length > 0) scheduledFrames.shift()?.(0);

    assert.equal(scrollCalls.at(-1)?.top, 1764);
    assert.equal(removedKeys.length, 1);
    assert.equal(observerDisconnected, true);
  } finally {
    restoreGlobal("MutationObserver", previousMutationObserver);
    restoreGlobalWindow(previousWindow);
  }
});

test("storage cleanup failure does not interrupt position restoration", () => {
  const returnPath = "/news/?page=2";
  const raw = JSON.stringify({
    version: 1,
    returnPath,
    itemKey: "article-7",
    scrollX: 0,
    scrollY: 900,
    anchorViewportTop: null,
    savedAt: Date.now(),
  });
  let restoredTop = -1;
  const fakeWindow = {
    location: { pathname: "/news/", search: "?page=2", hash: "" },
    sessionStorage: {
      getItem: () => raw,
      removeItem: () => {
        throw new Error("storage denied");
      },
    },
    scrollX: 0,
    scrollY: 0,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
    setTimeout: (callback: TimerHandler) => {
      if (typeof callback === "function") callback();
      return 1;
    },
    scrollTo: (options: ScrollToOptions) => {
      restoredTop = options.top ?? 0;
    },
  };
  const anchor = {
    dataset: { listDetailKey: "article-7" },
    isConnected: true,
    getBoundingClientRect: () => ({ top: 900 }),
  };
  const root = { isConnected: true, querySelectorAll: () => [anchor] };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });

  try {
    assert.equal(restoreListDetailPosition(root as unknown as HTMLElement, returnPath), true);
    assert.equal(restoredTop, 900);
  } finally {
    restoreGlobalWindow(previousWindow);
  }
});

function restoreGlobalWindow(previousWindow: PropertyDescriptor | undefined): void {
  if (previousWindow) {
    Object.defineProperty(globalThis, "window", previousWindow);
    return;
  }
  Reflect.deleteProperty(globalThis, "window");
}

function restoreGlobal(name: string, descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
    return;
  }
  Reflect.deleteProperty(globalThis, name);
}
