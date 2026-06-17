// 同步编排：sources → 增量游标 → 拉页 → 转 markdown(+图片重托管) → 映射 → 校验 → 幂等 upsert。
//
// syncNotion 是纯编排，所有副作用（Notion API、Storage、Supabase、时钟）都由 deps 注入，便于离线测：
// - iteratePages / renderPage / cursorFor / upsert 可替换为读 fixtures 的实现
// - now 注入固定时间保证确定性
// - dryRun 跳过出库
// 页处理**顺序**进行：天然节流，避开 Notion ~3 req/s 限流；单页失败被隔离（log+skip）不中断整源。

import { fileURLToPath } from "node:url";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { NotionRunConfig } from "./config.ts";
import type { NotionSource } from "./notion-sources.ts";
import type { AssetEntry, AssetManifest } from "./asset-manifest.ts";
import { createImageTransformer } from "./assets.ts";
import { createNotionClient } from "./client.ts";
import { convertPageToMarkdown, createConverter } from "./convert.ts";
import { fetchArticleManifest, fetchMaxLastEdited } from "./cursor.ts";
import { createPublicDirFallback, createStorageUpload, downloadImage } from "./image-io.ts";
import { buildArticleQuery, iterateArticlePages, iterateFolderPages } from "./query.ts";
import { ensureBucket, storageConfigFrom } from "./storage.ts";
import { upsertNotionArticles, type UpsertResult } from "./store.ts";
import { toNotionArticle } from "./map.ts";
import { isFolderSource } from "./notion-sources.ts";
import type { NotionArticle } from "./types.ts";

export interface RenderedPage {
  readonly markdown: string;
  readonly assets: Record<string, AssetEntry>;
}

export interface SourceSyncOutcome {
  readonly key: string;
  readonly name: string;
  readonly ok: boolean;
  /** 成功处理（含将 upsert）的页数。 */
  readonly pages: number;
  /** 单页隔离失败计数。 */
  readonly pageErrors: number;
  readonly error?: string;
}

export interface SyncReport {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly sources: readonly SourceSyncOutcome[];
  readonly totalPages: number;
  readonly upserted: number;
  readonly tableCount: string;
  readonly dryRun: boolean;
  readonly articles: readonly NotionArticle[];
}

export interface SyncDeps {
  readonly sources: readonly NotionSource[];
  readonly now: Date;
  readonly dryRun: boolean;
  /** 每源最多处理多少页；0 = 不限。 */
  readonly maxPages: number;
  /** 忽略增量游标、全量重拉。 */
  readonly fullResync: boolean;
  readonly cursorFor: (source: NotionSource) => Promise<string | null>;
  readonly iteratePages: (
    source: NotionSource,
    sinceIso: string | null,
  ) => AsyncIterable<PageObjectResponse>;
  readonly renderPage: (
    page: PageObjectResponse,
    source: NotionSource,
  ) => Promise<RenderedPage>;
  readonly upsert: (articles: readonly NotionArticle[]) => Promise<UpsertResult>;
}

/** 归一站点 base（mirror .vitepress/config.mts normalizeBase）：空/"/" → "/"；否则 "/sub/"。 */
function normalizeBase(value: string | undefined): string {
  if (!value || value.trim() === "" || value === "/") return "/";
  return `/${value.trim().replace(/^\/+|\/+$/g, "")}/`;
}

/** 把图片 manifest 合并进 article.metadata.assets（仅当非空）。 */
function withAssets(
  article: NotionArticle,
  assets: Record<string, AssetEntry>,
): NotionArticle {
  if (Object.keys(assets).length === 0) return article;
  return {
    ...article,
    metadata: { ...article.metadata, assets },
  };
}

/** 纯编排：遍历来源与页，产出 NotionArticle 并（非 dryRun 时）幂等 upsert。 */
export async function syncNotion(deps: SyncDeps): Promise<SyncReport> {
  const start = deps.now;
  const articles: NotionArticle[] = [];
  const outcomes: SourceSyncOutcome[] = [];

  for (const source of deps.sources) {
    try {
      const since = deps.fullResync ? null : await deps.cursorFor(source);
      let pages = 0;
      let pageErrors = 0;

      for await (const page of deps.iteratePages(source, since)) {
        if (deps.maxPages > 0 && pages >= deps.maxPages) break;
        try {
          const { markdown, assets } = await deps.renderPage(page, source);
          articles.push(withAssets(toNotionArticle({ page, markdown, source }), assets));
          pages += 1;
        } catch {
          // 单页失败隔离：不中断整源（mirror RSS fetchFeed 的故障隔离）。
          pageErrors += 1;
        }
      }

      outcomes.push({ key: source.key, name: source.name, ok: true, pages, pageErrors });
    } catch (error: unknown) {
      outcomes.push({
        key: source.key,
        name: source.name,
        ok: false,
        pages: 0,
        pageErrors: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let upserted = 0;
  let tableCount = "n/a";
  if (!deps.dryRun && articles.length > 0) {
    const result = await deps.upsert(articles);
    upserted = result.pushed;
    tableCount = result.tableCount;
  }

  const finish = new Date();
  return {
    startedAt: start.toISOString(),
    finishedAt: finish.toISOString(),
    durationMs: Math.max(0, finish.getTime() - start.getTime()),
    sources: outcomes,
    totalPages: articles.length,
    upserted,
    tableCount,
    dryRun: deps.dryRun,
    articles,
  };
}

/** 用 NotionRunConfig 跑一次同步；cli 与 cron 共用此入口。 */
export async function syncFromConfig(
  config: NotionRunConfig,
  overrides: Partial<SyncDeps> = {},
): Promise<SyncReport> {
  const now = overrides.now ?? new Date();

  // dryRun（缺 token / 缺 Supabase）：用空实现，纯走 sources 报告，不触网不写库。
  if (config.dryRun || !config.token || !config.supabase) {
    return syncNotion({
      sources: config.sources,
      now,
      dryRun: true,
      maxPages: config.maxPagesPerSync,
      fullResync: config.fullResync,
      cursorFor: async () => null,
      iteratePages: async function* () {},
      renderPage: async () => ({ markdown: "", assets: {} }),
      upsert: async () => ({ attempted: 0, invalid: 0, pushed: 0, tableCount: "0" }),
      ...overrides,
    });
  }

  const client = createNotionClient(config.token);
  const supabase = config.supabase;
  const storageConfig = storageConfigFrom(supabase);

  // 一次性确保 bucket 存在；Storage 不可用时仅告警，单图上传失败会回退 public/。
  try {
    await ensureBucket(storageConfig, config.storageBucket);
  } catch (error: unknown) {
    process.stderr.write(
      `[notion-sync] ensureBucket warning: ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }

  const storageUpload = createStorageUpload(storageConfig, config.storageBucket);
  const publicDir = fileURLToPath(new URL("../../../public", import.meta.url));
  const publicFallback = createPublicDirFallback(publicDir, normalizeBase(process.env.VITEPRESS_BASE));

  const renderPage = async (
    page: PageObjectResponse,
    _source: NotionSource,
  ): Promise<RenderedPage> => {
    const collected: Record<string, AssetEntry> = {};
    // 跨次复用：读该页已存的图片 manifest，srcHash 命中则跳过重新下载/上传（未变图片不重传）。
    const existing: AssetManifest = await fetchArticleManifest(supabase, page.id);
    const transformer = createImageTransformer({
      pageId: page.id,
      existing,
      download: (url) => downloadImage(url),
      upload: storageUpload,
      fallback: publicFallback,
      collected,
    });
    const converter = createConverter(client, { imageTransformer: transformer });
    const markdown = await convertPageToMarkdown(converter, page.id);
    return { markdown, assets: collected };
  };

  return syncNotion({
    sources: config.sources,
    now,
    dryRun: false,
    maxPages: config.maxPagesPerSync,
    fullResync: config.fullResync,
    cursorFor: (source) => fetchMaxLastEdited(supabase, source.key),
    iteratePages: (source, sinceIso) => {
      if (isFolderSource(source)) {
        return iterateFolderPages(client, source, sinceIso);
      }
      return iterateArticlePages(client, buildArticleQuery(source, sinceIso, 100));
    },
    renderPage,
    upsert: (articles) => upsertNotionArticles(articles, supabase),
    ...overrides,
  });
}
