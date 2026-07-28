// Notion 同步运行配置：全部从环境变量读取并用 zod 校验（mirror ../config.ts）。
//
// 密钥纪律（见 [[secret-never-in-tracked-file]]）：NOTION_TOKEN / PostgreSQL 写连接。
// 只走环境变量（配合 `--env-file=.env`），绝不写入任何 tracked 文件。
// 缺 Notion token 或 PostgreSQL 写入配置时自动退回 dryRun（不拉取/不写库）。

import { z } from "zod";
import {
  loadContentRepositoryConfig,
  type ContentRepositoryConfig,
} from "../data/repository-config.ts";
import { enabledNotionSources, type NotionSource } from "./notion-sources.ts";

const optionalEnvString = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  return value;
}, z.string().min(1).optional());

function boolFromEnv(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === "") return defaultValue;
    if (typeof value === "string") return /^(1|true|yes|on)$/i.test(value);
    return Boolean(value);
  }, z.boolean());
}

const envSchema = z.object({
  NOTION_TOKEN: optionalEnvString,
  CONTENT_ASSET_PUBLIC_BASE_URL: optionalEnvString,
  NEXT_PUBLIC_CONTENT_API_BASE_URL: optionalEnvString,
  // node-cron 表达式；默认每日 08:30，与 news collector 的 08:00 错峰，避免同 tick 争用 PostgREST。
  NOTION_CRON: z.string().min(1).default("30 8 * * *"),
  NOTION_TZ: z.string().min(1).default("Asia/Shanghai"),
  NOTION_RUN_AT_BOOT: boolFromEnv(true),
  NOTION_DRY_RUN: boolFromEnv(false),
  // 每次同步最多处理多少页（按 last_edited 升序）；0 = 不限。防首次全量 backfill 打爆限流。
  // 注意：升序 + 设上限时，超大积压会"最旧优先"分多次 tick 排空，最新编辑会延后若干轮才可见。
  NOTION_MAX_PAGES_PER_SYNC: z.coerce.number().int().min(0).default(0),
  // 忽略增量水位、全量重拉（backfill / 图片整体重托管时用）。
  NOTION_FULL_RESYNC: boolFromEnv(false),
});

export type NotionEnv = z.infer<typeof envSchema>;

export interface NotionRunConfig {
  readonly env: NotionEnv;
  /** 缺 token 或 PostgreSQL 写库配置时为 true：跳过真实拉取/写库。 */
  readonly dryRun: boolean;
  readonly token: string | null;
  /** 同源公开资产路径，形如 /agent-build/api/content/v1/assets。 */
  readonly assetPublicBaseUrl: string;
  readonly contentRepository: ContentRepositoryConfig;
  readonly sources: readonly NotionSource[];
  readonly cron: string;
  readonly timezone: string;
  readonly runAtBoot: boolean;
  readonly maxPagesPerSync: number;
  readonly fullResync: boolean;
}

function assetPublicBaseUrlFor(env: NotionEnv): string {
  const apiBase = (env.NEXT_PUBLIC_CONTENT_API_BASE_URL ?? "/agent-build/api/content/v1").replace(/\/+$/, "");
  const value = (env.CONTENT_ASSET_PUBLIC_BASE_URL ?? `${apiBase}/assets`).trim().replace(/\/+$/, "");
  if (!value.startsWith("/") || value.startsWith("//") || /[?#]/.test(value)) {
    throw new Error("CONTENT_ASSET_PUBLIC_BASE_URL must be a same-origin absolute path.");
  }
  return value;
}

/** 解析并校验环境；正式同步只使用自建 PostgreSQL 内容库与资产表。 */
export function loadNotionConfig(
  source: NodeJS.ProcessEnv = process.env,
): NotionRunConfig {
  const env = envSchema.parse(source);
  const contentRepository = loadContentRepositoryConfig(source);

  const token = env.NOTION_TOKEN ?? null;
  const dryRun = env.NOTION_DRY_RUN || !token || contentRepository.driver !== "postgres";

  return {
    env,
    dryRun,
    token,
    assetPublicBaseUrl: assetPublicBaseUrlFor(env),
    contentRepository,
    sources: enabledNotionSources(),
    cron: env.NOTION_CRON,
    timezone: env.NOTION_TZ,
    runAtBoot: env.NOTION_RUN_AT_BOOT,
    maxPagesPerSync: env.NOTION_MAX_PAGES_PER_SYNC,
    fullResync: env.NOTION_FULL_RESYNC,
  };
}
