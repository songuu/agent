import assert from "node:assert/strict";
import test from "node:test";
import {
  getSupabaseRuntimeConfig,
  resetSupabaseRuntimeConfigCache,
} from "./supabase-runtime-config.ts";

type RuntimeTestWindow = {
  fetch: typeof fetch;
};

type RuntimeGlobals = {
  window?: RuntimeTestWindow;
  __FRONTIER_SUPABASE_CONFIG__?: unknown;
};

test("getSupabaseRuntimeConfig：运行时配置优先、缓存、失败回退且 SSR 不请求", async () => {
  const holder = globalThis as unknown as RuntimeGlobals;
  const originalWindow = Object.getOwnPropertyDescriptor(holder, "window");
  const originalConfig = Object.getOwnPropertyDescriptor(holder, "__FRONTIER_SUPABASE_CONFIG__");
  const compiledFallback = {
    url: "https://compiled.example.supabase.co",
    anonKey: "compiled-anon-key",
    schema: "public",
  };
  const runtimeConfig = {
    url: "https://runtime.example.supabase.co",
    anonKey: "runtime-anon-key",
    schema: "migration",
  };

  try {
    holder.__FRONTIER_SUPABASE_CONFIG__ = compiledFallback;
    let requestCount = 0;
    holder.window = {
      fetch: async (input, init) => {
        requestCount += 1;
        assert.match(String(input), /supabase-runtime-config\.json$/);
        assert.equal(init?.cache, "no-store");
        assert.ok(init?.signal instanceof AbortSignal);
        return new Response(JSON.stringify({ version: 1, supabase: runtimeConfig }), { status: 200 });
      },
    };

    resetSupabaseRuntimeConfigCache();
    assert.deepEqual(await getSupabaseRuntimeConfig(), runtimeConfig);
    assert.deepEqual(await getSupabaseRuntimeConfig(), runtimeConfig);
    assert.equal(requestCount, 1, "同一页面只请求一次运行时配置");

    holder.window = {
      fetch: async () => {
        requestCount += 1;
        return new Response(JSON.stringify({ version: 2, supabase: runtimeConfig }), { status: 200 });
      },
    };
    resetSupabaseRuntimeConfigCache();
    assert.deepEqual(await getSupabaseRuntimeConfig(), compiledFallback, "无效运行时 JSON 不覆盖编译期配置");

    holder.window = {
      fetch: async () => {
        requestCount += 1;
        throw new Error("temporary config fetch failure");
      },
    };
    resetSupabaseRuntimeConfigCache();
    assert.deepEqual(await getSupabaseRuntimeConfig(), compiledFallback, "请求失败时回退编译期公开配置");

    delete holder.window;
    resetSupabaseRuntimeConfigCache();
    assert.deepEqual(await getSupabaseRuntimeConfig(), compiledFallback, "SSR 不应请求运行时 JSON");
    assert.equal(requestCount, 3, "无浏览器环境不发起额外请求");
  } finally {
    resetSupabaseRuntimeConfigCache();
    if (originalWindow) Object.defineProperty(holder, "window", originalWindow);
    else delete holder.window;
    if (originalConfig) Object.defineProperty(holder, "__FRONTIER_SUPABASE_CONFIG__", originalConfig);
    else delete holder.__FRONTIER_SUPABASE_CONFIG__;
  }
});
test("getSupabaseRuntimeConfig：外部取消不污染缓存，内部超时回退编译期配置", async () => {
  const holder = globalThis as unknown as RuntimeGlobals;
  const originalWindow = Object.getOwnPropertyDescriptor(holder, "window");
  const originalConfig = Object.getOwnPropertyDescriptor(holder, "__FRONTIER_SUPABASE_CONFIG__");
  const compiledFallback = {
    url: "https://compiled.example.supabase.co",
    anonKey: "compiled-anon-key",
    schema: "public",
  };
  const runtimeConfig = {
    url: "https://runtime.example.supabase.co",
    anonKey: "runtime-anon-key",
    schema: "migration",
  };

  try {
    holder.__FRONTIER_SUPABASE_CONFIG__ = compiledFallback;
    let requestCount = 0;
    holder.window = {
      fetch: async (_input, init) => {
        requestCount += 1;
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("route aborted")), {
            once: true,
          });
        });
      },
    };

    resetSupabaseRuntimeConfigCache();
    const routeRequest = new AbortController();
    const abortedRequest = getSupabaseRuntimeConfig({ signal: routeRequest.signal, timeoutMs: 5_000 });
    routeRequest.abort();
    await assert.rejects(abortedRequest, /route aborted/);

    holder.window = {
      fetch: async () => {
        requestCount += 1;
        return new Response(JSON.stringify({ version: 1, supabase: runtimeConfig }), { status: 200 });
      },
    };
    assert.deepEqual(await getSupabaseRuntimeConfig(), runtimeConfig, "取消的请求不得成为共享缓存");
    assert.equal(requestCount, 2);

    holder.window = {
      fetch: async (_input, init) => {
        requestCount += 1;
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("deadline exceeded")), {
            once: true,
          });
        });
      },
    };
    resetSupabaseRuntimeConfigCache();
    assert.deepEqual(
      await getSupabaseRuntimeConfig({ timeoutMs: 5 }),
      compiledFallback,
      "内部 deadline 应回退，不应永久缓存 pending Promise",
    );
    assert.equal(requestCount, 3);
  } finally {
    resetSupabaseRuntimeConfigCache();
    if (originalWindow) Object.defineProperty(holder, "window", originalWindow);
    else delete holder.window;
    if (originalConfig) Object.defineProperty(holder, "__FRONTIER_SUPABASE_CONFIG__", originalConfig);
    else delete holder.__FRONTIER_SUPABASE_CONFIG__;
  }
});
