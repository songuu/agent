// Notion API client 构造 + 限流/退避 + 并发闸。
//
// 所有 Notion 调用都应经 withNotionRetry 包裹、经 createLimiter 限并发：
// Notion 限流约 3 req/s，全文同步每页要多次 blocks.children.list，裸调极易撞 429/529。

import {
  Client,
  APIErrorCode,
  ClientErrorCode,
  isNotionClientError,
} from "@notionhq/client";

/**
 * 版本 pin（必读 WHY）：
 * 本子系统**刻意使用 @notionhq/client@2.x**，不是 v5。原因：v5 默认 Notion-Version
 * "2025-09-03" 并**从 client 上删除了 databases.query 方法**（改 data source 模型
 * dataSources.query，运行时实测 `client.databases.query === undefined`）；而 notion-to-md@3.1.9
 * 与本仓库的 query.ts 都依赖 databases.query。v2.x 原生提供 databases.query 且默认即 2022-06-28，
 * 与 notion-to-md@3.1.9 是经实战验证的组合（Pipedream/Flowise）。
 * 这里显式 pin 2022-06-28 仅为表达意图、并被 notion-client-version.test.mts 守门；
 * 迁移到 @notionhq/client v5 + dataSources.query 见 sprint deferred 字段。
 */
export const NOTION_API_VERSION = "2022-06-28";

export function createNotionClient(token: string): Client {
  return new Client({ auth: token, notionVersion: NOTION_API_VERSION });
}

export type SleepImpl = (ms: number) => Promise<void>;

const defaultSleep: SleepImpl = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  readonly maxRetries?: number;
  readonly baseDelayMs?: number;
  /** 可注入的 sleep，便于离线测试零等待。 */
  readonly sleep?: SleepImpl;
  /** 可注入的可重试判定，缺省 isRetryableNotionError；便于离线测退避循环。 */
  readonly isRetryable?: (error: unknown) => boolean;
}

function networkErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") return code;
  const cause = (error as { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") return null;
  const causeCode = (cause as { code?: unknown }).code;
  return typeof causeCode === "string" ? causeCode : null;
}

/** 429 / 5xx / 请求超时 / Node fetch 网络抖动视为可重试。 */
export function isRetryableNotionError(error: unknown): boolean {
  const code = networkErrorCode(error);
  if (code && ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"].includes(code)) {
    return true;
  }

  if (!isNotionClientError(error)) return false;
  if (error.code === ClientErrorCode.RequestTimeout) return true;
  if (error.code === APIErrorCode.RateLimited) return true;
  // APIResponseError 带 status；网关类 5xx/529 可重试。
  const status = (error as { status?: number }).status;
  return status === 429 || status === 502 || status === 503 || status === 504 || status === 529;
}

/** 从错误的 Retry-After 头读重试间隔（秒→毫秒）；无则 null。 */
function retryAfterMs(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("headers" in error)) return null;
  const headers = (error as { headers?: unknown }).headers;
  if (!headers || typeof (headers as Headers).get !== "function") return null;
  const raw = (headers as Headers).get("retry-after");
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

/** 在限流/网关错误上退避重试；Retry-After 优先，否则指数退避（base·2^n）。 */
export async function withNotionRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const sleep = options.sleep ?? defaultSleep;
  const isRetryable = options.isRetryable ?? isRetryableNotionError;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt += 1;
      if (attempt > maxRetries || !isRetryable(error)) throw error;
      const delay = retryAfterMs(error) ?? baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }
}
