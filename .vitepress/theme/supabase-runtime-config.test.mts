import assert from "node:assert/strict";
import test from "node:test";
import {
  getSupabaseRuntimeConfig,
  resetSupabaseRuntimeConfigCache,
} from "./supabase-runtime-config.ts";

test("getSupabaseRuntimeConfig always returns null because browser Supabase reads are disabled", async () => {
  const holder = globalThis as unknown as {
    window?: { fetch: typeof fetch };
    __FRONTIER_SUPABASE_CONFIG__?: unknown;
  };
  const originalWindow = Object.getOwnPropertyDescriptor(holder, "window");
  const originalConfig = Object.getOwnPropertyDescriptor(holder, "__FRONTIER_SUPABASE_CONFIG__");

  try {
    let requestCount = 0;
    holder.__FRONTIER_SUPABASE_CONFIG__ = {
      url: "https://compiled.example.supabase.co",
      anonKey: "compiled-anon-key",
      schema: "public",
    };
    holder.window = {
      fetch: async () => {
        requestCount += 1;
        return new Response(JSON.stringify({ version: 1, supabase: holder.__FRONTIER_SUPABASE_CONFIG__ }), {
          status: 200,
        });
      },
    };

    resetSupabaseRuntimeConfigCache();
    assert.equal(await getSupabaseRuntimeConfig(), null);
    assert.equal(await getSupabaseRuntimeConfig({ timeoutMs: 1 }), null);
    assert.equal(requestCount, 0, "禁用后不应读取 runtime JSON 或触发 Supabase 配置回退");
  } finally {
    resetSupabaseRuntimeConfigCache();
    if (originalWindow) Object.defineProperty(holder, "window", originalWindow);
    else delete holder.window;
    if (originalConfig) Object.defineProperty(holder, "__FRONTIER_SUPABASE_CONFIG__", originalConfig);
    else delete holder.__FRONTIER_SUPABASE_CONFIG__;
  }
});
