// 运行配置：全部从环境变量读取并用 zod 校验。
//
// 密钥纪律（见 [[secret-never-in-tracked-file]]）：SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY
// 只走环境变量（配合 `--env-file=.env`），绝不写入任何 tracked 文件。

import { z } from "zod";

function boolFromEnv(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === "") return defaultValue;
    if (typeof value === "string") return /^(1|true|yes|on)$/i.test(value);
    return Boolean(value);
  }, z.boolean());
}

const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_SCHEMA: z.string().min(1).default("public"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // node-cron 表达式（配合 NEWS_TZ 时区解释）。默认每日 08:00 Asia/Shanghai。
  NEWS_CRON: z.string().min(1).default("0 8 * * *"),
  NEWS_TZ: z.string().min(1).default("Asia/Shanghai"),
  NEWS_RUN_AT_BOOT: boolFromEnv(true),
  NEWS_DRY_RUN: boolFromEnv(false),
  NEWS_FEED_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  // 每源最多取多少条（按 feed 顺序，通常最新在前），防止 arXiv 这类高产源淹没每日 feed。
  NEWS_MAX_PER_SOURCE: z.coerce.number().int().positive().default(30),
  // 富化条数上限；0 = 不富化（即便配了 key 也需显式开，避免默认烧 token）。
  NEWS_ENRICH_MAX: z.coerce.number().int().min(0).default(0),
  NEWS_ENRICH_MODEL: z.string().min(1).default("claude-haiku-4-5-20251001"),
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
  readonly feedTimeoutMs: number;
  readonly maxPerSource: number;
  readonly enrichMax: number;
  readonly enrichModel: string;
  readonly cron: string;
  readonly timezone: string;
  readonly runAtBoot: boolean;
}

/** 解析并校验环境；缺 Supabase 凭据时自动退回 dryRun（不写库）。 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): RunConfig {
  const env = envSchema.parse(source);

  const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const dryRun = env.NEWS_DRY_RUN || !hasSupabase;

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
    feedTimeoutMs: env.NEWS_FEED_TIMEOUT_MS,
    maxPerSource: env.NEWS_MAX_PER_SOURCE,
    enrichMax: env.ANTHROPIC_API_KEY ? env.NEWS_ENRICH_MAX : 0,
    enrichModel: env.NEWS_ENRICH_MODEL,
    cron: env.NEWS_CRON,
    timezone: env.NEWS_TZ,
    runAtBoot: env.NEWS_RUN_AT_BOOT,
  };
}
