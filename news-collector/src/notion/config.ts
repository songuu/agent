// Notion 同步运行配置：全部从环境变量读取并用 zod 校验（mirror ../config.ts）。
//
// 密钥纪律（见 [[secret-never-in-tracked-file]]）：NOTION_TOKEN / SUPABASE_SERVICE_ROLE_KEY
// 只走环境变量（配合 `--env-file=.env`），绝不写入任何 tracked 文件。
// 缺 NOTION_TOKEN 或 Supabase 凭据时自动退回 dryRun（不拉取/不写库），CI/本地无凭据也不报错。

import { z } from "zod";
import type { SupabaseConfig } from "../config.ts";
import { enabledNotionSources, type NotionSource } from "./notion-sources.ts";

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
  NOTION_TOKEN: optionalEnvString,
  SUPABASE_URL: optionalEnvUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvString,
  SUPABASE_SCHEMA: z.string().min(1).default("public"),
  // node-cron 表达式；默认每日 08:30，与 news collector 的 08:00 错峰，避免同 tick 争用 PostgREST。
  NOTION_CRON: z.string().min(1).default("30 8 * * *"),
  NOTION_TZ: z.string().min(1).default("Asia/Shanghai"),
  NOTION_RUN_AT_BOOT: boolFromEnv(true),
  NOTION_DRY_RUN: boolFromEnv(false),
  // 每次同步最多处理多少页（按 last_edited 升序）；0 = 不限。防首次全量 backfill 打爆限流。
  // 注意：升序 + 设上限时，超大积压会"最旧优先"分多次 tick 排空，最新编辑会延后若干轮才可见。
  NOTION_MAX_PAGES_PER_SYNC: z.coerce.number().int().min(0).default(0),
  // 重托管图片的 Supabase Storage public bucket 名。
  NOTION_STORAGE_BUCKET: z.string().min(1).default("notion-assets"),
  // 忽略增量水位、全量重拉（backfill / 图片整体重托管时用）。
  NOTION_FULL_RESYNC: boolFromEnv(false),
});

export type NotionEnv = z.infer<typeof envSchema>;

export interface NotionRunConfig {
  readonly env: NotionEnv;
  /** 缺 token 或缺 Supabase 时为 true：跳过真实拉取/写库。 */
  readonly dryRun: boolean;
  readonly token: string | null;
  readonly supabase: SupabaseConfig | null;
  readonly sources: readonly NotionSource[];
  readonly cron: string;
  readonly timezone: string;
  readonly runAtBoot: boolean;
  readonly maxPagesPerSync: number;
  readonly storageBucket: string;
  readonly fullResync: boolean;
}

/** 解析并校验环境；缺 NOTION_TOKEN 或 Supabase 凭据时自动退回 dryRun。 */
export function loadNotionConfig(
  source: NodeJS.ProcessEnv = process.env,
): NotionRunConfig {
  const env = envSchema.parse(source);

  const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const token = env.NOTION_TOKEN ?? null;
  const dryRun = env.NOTION_DRY_RUN || !token || !hasSupabase;

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
    token,
    supabase,
    sources: enabledNotionSources(),
    cron: env.NOTION_CRON,
    timezone: env.NOTION_TZ,
    runAtBoot: env.NOTION_RUN_AT_BOOT,
    maxPagesPerSync: env.NOTION_MAX_PAGES_PER_SYNC,
    storageBucket: env.NOTION_STORAGE_BUCKET,
    fullResync: env.NOTION_FULL_RESYNC,
  };
}
