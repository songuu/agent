// 收集编排：sources → 抓取(故障隔离) → 归一+分类 → 去重 → 原文正文抽取 → 可选富化 → 出库。
//
// collectOnce 是纯编排，所有副作用（网络、时钟、Supabase）都可由参数注入，便于离线测试：
// - sources 可传 fixtures 派生的假源
// - fetchFeedImpl 可替换为读 fixtures 的实现
// - fetchArticleContentImpl 可替换为固定正文抽取结果
// - now 注入固定时间保证确定性
// - dryRun 跳过出库

import { classify } from "./classify.ts";
import type { ProviderName } from "../../src/shared/llm/index.ts";
import type { RunConfig, SupabaseConfig } from "./config.ts";
import { dedupe } from "./dedupe.ts";
import { enrichItems } from "./enrich.ts";
import { toNewsItem } from "./normalize.ts";
import { fetchArticleContent, type ArticleContentResult } from "./article-content.ts";
import { fetchFeed, type FeedResult } from "./rss.ts";
import { enabledSources } from "./sources.ts";
import { upsertNewsItems } from "./store.ts";
import type { NewsItem, NewsSource } from "./types.ts";

const ARTICLE_CONTENT_CONCURRENCY = 4;

export interface SourceOutcome {
  readonly key: string;
  readonly name: string;
  readonly ok: boolean;
  readonly fetched: number;
  readonly attempts: number;
  readonly critical?: boolean;
  readonly error?: string;
  readonly diagnostics?: string;
}

export interface CollectReport {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly sources: readonly SourceOutcome[];
  readonly totalFetched: number;
  readonly afterDedupe: number;
  readonly contentFetched: number;
  readonly contentEmpty: number;
  readonly contentFailed: number;
  readonly enriched: number;
  readonly stored: number;
  readonly tableCount: string;
  readonly dryRun: boolean;
  readonly items: readonly NewsItem[];
}

export type FetchFeedImpl = (
  source: NewsSource,
  opts: { timeoutMs?: number },
) => Promise<FeedResult>;

export type FetchArticleContentImpl = (
  url: string,
  opts: { timeoutMs?: number; now?: Date },
) => Promise<ArticleContentResult>;

export interface CollectOptions {
  readonly sources?: readonly NewsSource[];
  readonly now?: Date;
  readonly dryRun?: boolean;
  readonly supabase?: SupabaseConfig | null;
  readonly feedTimeoutMs?: number;
  /** 每源最多保留多少条（按 feed 顺序）；缺省不限。 */
  readonly maxPerSource?: number;
  readonly enrichMax?: number;
  readonly enrichProvider?: ProviderName;
  readonly enrichModel?: string;
  readonly fetchFeedImpl?: FetchFeedImpl;
  readonly articleContentEnabled?: boolean;
  readonly articleContentTimeoutMs?: number;
  readonly articleContentMaxItems?: number;
  readonly fetchArticleContentImpl?: FetchArticleContentImpl;
}

export async function collectOnce(options: CollectOptions = {}): Promise<CollectReport> {
  const start = options.now ?? new Date();
  const sources = options.sources ?? enabledSources();
  const supabase = options.supabase ?? null;
  const dryRun = options.dryRun ?? supabase === null;
  const fetchImpl: FetchFeedImpl = options.fetchFeedImpl ?? fetchFeed;

  // 并行抓取，单源失败被 fetchFeed 隔离为 ok:false，不会 reject。
  const feedResults = await Promise.all(
    sources.map((source) => fetchImpl(source, { timeoutMs: options.feedTimeoutMs })),
  );

  const collected: NewsItem[] = [];
  const sourceOutcomes: SourceOutcome[] = [];
  for (const result of feedResults) {
    if (!result.ok) {
      sourceOutcomes.push({
        key: result.source.key,
        name: result.source.name,
        ok: false,
        fetched: 0,
        attempts: result.attempts,
        critical: result.source.critical,
        error: result.error,
        diagnostics: result.diagnostics,
      });
      continue;
    }
    const capped =
      options.maxPerSource !== undefined
        ? result.items.slice(0, options.maxPerSource)
        : result.items;
    // fetched 报告封顶后实际进入管道的条数，保证与 totalFetched 可对账。
    sourceOutcomes.push({
      key: result.source.key,
      name: result.source.name,
      ok: true,
      fetched: capped.length,
      attempts: result.attempts,
      critical: result.source.critical,
      diagnostics: result.diagnostics,
    });
    for (const rawItem of capped) {
      const classification = classify(
        {
          title: rawItem.title,
          summary: rawItem.contentSnippet ?? rawItem.content ?? rawItem.summary,
        },
        result.source,
      );
      collected.push(toNewsItem({ source: result.source, rawItem, classification, now: start }));
    }
  }

  let items = dedupe(collected);

  if (options.articleContentEnabled) {
    items = await attachArticleContent(items, {
      fetchArticleContentImpl: options.fetchArticleContentImpl ?? ((url, opts) => fetchArticleContent(url, opts)),
      timeoutMs: options.articleContentTimeoutMs,
      maxItems: options.articleContentMaxItems,
      now: start,
    });
  }

  const enrichMax = options.enrichMax ?? 0;
  if (enrichMax > 0) {
    items = await enrichItems(items, {
      maxItems: enrichMax,
      provider: options.enrichProvider,
      model: options.enrichModel,
    });
  }
  const enrichedCount = items.filter((item) => item.enriched).length;
  const contentFetched = items.filter((item) => item.contentStatus === "fetched").length;
  const contentEmpty = items.filter((item) => item.contentStatus === "empty").length;
  const contentFailed = items.filter((item) => item.contentStatus === "failed").length;

  let stored = 0;
  let tableCount = "n/a";
  if (!dryRun && supabase) {
    const result = await upsertNewsItems(items, supabase);
    stored = result.pushed;
    tableCount = result.tableCount;
  }

  const finish = new Date();
  return {
    startedAt: start.toISOString(),
    finishedAt: finish.toISOString(),
    durationMs: Math.max(0, finish.getTime() - start.getTime()),
    sources: sourceOutcomes,
    totalFetched: collected.length,
    afterDedupe: items.length,
    contentFetched,
    contentEmpty,
    contentFailed,
    enriched: enrichedCount,
    stored,
    tableCount,
    dryRun,
    items,
  };
}

interface AttachArticleContentOptions {
  readonly fetchArticleContentImpl: FetchArticleContentImpl;
  readonly timeoutMs?: number;
  readonly maxItems?: number;
  readonly now: Date;
}

async function attachArticleContent(
  items: readonly NewsItem[],
  options: AttachArticleContentOptions,
): Promise<NewsItem[]> {
  const maxItems = options.maxItems ?? items.length;
  const next = [...items];
  let cursor = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= next.length || index >= maxItems) return;
      const item = next[index];
      if (!item) return;
      const result = await options.fetchArticleContentImpl(item.url, {
        timeoutMs: options.timeoutMs,
        now: options.now,
      });
      next[index] = mergeArticleContent(item, result);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(ARTICLE_CONTENT_CONCURRENCY, next.length, maxItems) }, () => worker()),
  );
  return next;
}

function mergeArticleContent(item: NewsItem, result: ArticleContentResult): NewsItem {
  const contentText = result.text || item.contentText;
  const contentExcerpt = result.excerpt || item.contentExcerpt || item.summary;
  return {
    ...item,
    contentText,
    contentExcerpt,
    contentStatus: result.status,
    contentFetchedAt: result.fetchedAt,
    metadata: {
      ...item.metadata,
      articleContent: {
        status: result.status,
        fetchedAt: result.fetchedAt,
        error: result.error ?? null,
      },
    },
  };
}

/** 用 RunConfig 跑一次收集；cli 与 cron 共用此入口。 */
export async function collectFromConfig(
  config: RunConfig,
  overrides: Partial<CollectOptions> = {},
): Promise<CollectReport> {
  return collectOnce({
    dryRun: config.dryRun,
    supabase: config.supabase,
    feedTimeoutMs: config.feedTimeoutMs,
    maxPerSource: config.maxPerSource,
    enrichMax: config.enrichMax,
    enrichProvider: config.enrichProvider,
    enrichModel: config.enrichModel,
    articleContentEnabled: config.articleContentEnabled,
    articleContentTimeoutMs: config.articleContentTimeoutMs,
    articleContentMaxItems: config.articleContentMaxItems,
    ...overrides,
  });
}
