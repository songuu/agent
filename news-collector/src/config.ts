// 运行配置：全部从环境变量读取并用 zod 校验。
//
// 密钥纪律（见 [[secret-never-in-tracked-file]]）：SUPABASE_SERVICE_ROLE_KEY / LLM API key
// 只走环境变量（配合 `--env-file=.env`），绝不写入任何 tracked 文件。

import type { ProviderName } from "../../src/shared/llm/index.ts";
import { z } from "zod";
import {
  loadContentRepositoryConfig,
  type ContentRepositoryConfig,
} from "./data/repository-config.ts";

const llmProviderSchema = z.enum(["anthropic", "openai", "ollama"]);

const optionalEnvString = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  return value;
}, z.string().min(1).optional());

const optionalEnvUrl = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  return value;
}, z.string().url().optional());

function boolFromEnv(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === "") return defaultValue;
    if (typeof value === "string") return /^(1|true|yes|on)$/i.test(value);
    return Boolean(value);
  }, z.boolean());
}

const envSchema = z.object({
  SUPABASE_URL: optionalEnvUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvString,
  SUPABASE_SCHEMA: z.string().min(1).default("public"),
  LLM_PROVIDER: llmProviderSchema.default("anthropic"),
  ANTHROPIC_API_KEY: optionalEnvString,
  ANTHROPIC_MODEL: optionalEnvString,
  OPENAI_API_KEY: optionalEnvString,
  OPENAI_MODEL: optionalEnvString,
  OPENAI_BASE_URL: optionalEnvString,
  OLLAMA_API_KEY: optionalEnvString,
  OLLAMA_MODEL: optionalEnvString,
  OLLAMA_BASE_URL: optionalEnvString,
  // node-cron 表达式（配合 NEWS_TZ 时区解释）。默认每日 08:00 Asia/Shanghai。
  NEWS_CRON: z.string().min(1).default("0 8 * * *"),
  NEWS_TZ: z.string().min(1).default("Asia/Shanghai"),
  NEWS_RUN_AT_BOOT: boolFromEnv(true),
  NEWS_DRY_RUN: boolFromEnv(false),
  NEWS_FEED_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  // 避免一次并发打满同一供应商（例如 GitHub Atom），触发连接耗尽和批量超时。
  NEWS_FEED_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(4),
  // 每源最多取多少条（按 feed 顺序，通常最新在前），防止 arXiv 这类高产源淹没每日 feed。
  NEWS_MAX_PER_SOURCE: z.coerce.number().int().positive().default(30),
  // 富化条数上限；0 = 不富化（即便配了 key 也需显式开，避免默认烧 token）。
  NEWS_ENRICH_MAX: z.coerce.number().int().min(0).default(0),
  // 是否抓取原文正文并写入 content_text/content_excerpt。
  NEWS_ARTICLE_CONTENT_ENABLED: boolFromEnv(true),
  NEWS_ARTICLE_CONTENT_TIMEOUT_MS: z.coerce.number().int().positive().default(12_000),
  // 每轮最多抓正文的文章数，避免首次/大批量运行拖垮采集。
  NEWS_ARTICLE_CONTENT_MAX_ITEMS: z.coerce.number().int().min(0).default(80),
  // 兼容旧 collector 配置；优先建议使用 ANTHROPIC_MODEL / OPENAI_MODEL。
  NEWS_ENRICH_MODEL: optionalEnvString,
});

export type NewsEnv = z.infer<typeof envSchema>;

export interface SupabaseConfig {
  readonly url: string;
  readonly serviceRoleKey: string;
  readonly schema: string;
}

export interface RunConfig {
  readonly env: NewsEnv;
  readonly dryRun: boolean;
  readonly supabase: SupabaseConfig | null;
  /** 内容写入端口；未显式设置时保持 Supabase 兼容行为。 */
  readonly contentRepository: ContentRepositoryConfig;
  readonly feedTimeoutMs: number;
  readonly feedConcurrency: number;
  readonly maxPerSource: number;
  readonly enrichMax: number;
  readonly enrichProvider: ProviderName;
  readonly enrichModel?: string;
  readonly articleContentEnabled: boolean;
  readonly articleContentTimeoutMs: number;
  readonly articleContentMaxItems: number;
  readonly cron: string;
  readonly timezone: string;
  readonly runAtBoot: boolean;
}

function hasProviderCredential(env: NewsEnv): boolean {
  switch (env.LLM_PROVIDER) {
    case "anthropic":
      return Boolean(env.ANTHROPIC_API_KEY);
    case "openai":
      return Boolean(env.OPENAI_API_KEY);
    case "ollama":
      return true;
  }
}

/** 解析并校验环境；缺选定内容库凭据时自动退回 dryRun（不写库）。 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): RunConfig {
  const env = envSchema.parse(source);
  const contentRepository = loadContentRepositoryConfig(source);

  const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const hasWritableRepository = contentRepository.driver === "mysql" || hasSupabase;
  const dryRun = env.NEWS_DRY_RUN || !hasWritableRepository;

  const supabase: SupabaseConfig | null =
    hasSupabase && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? {
          url: env.SUPABASE_URL,
          serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
          schema: env.SUPABASE_SCHEMA,
        }
      : null;

  return {
    env,
    dryRun,
    supabase,
    contentRepository,
    feedTimeoutMs: env.NEWS_FEED_TIMEOUT_MS,
    feedConcurrency: env.NEWS_FEED_CONCURRENCY,
    maxPerSource: env.NEWS_MAX_PER_SOURCE,
    enrichMax: hasProviderCredential(env) ? env.NEWS_ENRICH_MAX : 0,
    enrichProvider: env.LLM_PROVIDER,
    enrichModel: env.NEWS_ENRICH_MODEL,
    articleContentEnabled: env.NEWS_ARTICLE_CONTENT_ENABLED,
    articleContentTimeoutMs: env.NEWS_ARTICLE_CONTENT_TIMEOUT_MS,
    articleContentMaxItems: env.NEWS_ARTICLE_CONTENT_MAX_ITEMS,
    cron: env.NEWS_CRON,
    timezone: env.NEWS_TZ,
    runAtBoot: env.NEWS_RUN_AT_BOOT,
  };
}
