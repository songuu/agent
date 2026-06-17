// 收集编排：sources → 抓取(故障隔离) → 归一+分类 → 去重 → 可选富化 → 出库。
//
// collectOnce 是纯编排，所有副作用（网络、时钟、Supabase）都可由参数注入，便于离线测试：
// - sources 可传 fixtures 派生的假源
// - fetchFeedImpl 可替换为读 fixtures 的实现
// - now 注入固定时间保证确定性
// - dryRun 跳过出库

import { classify } from "./classify.ts";
import type { ProviderName } from "../../src/shared/llm/index.ts";
import type { RunConfig, SupabaseConfig } from "./config.ts";
import { dedupe } from "./dedupe.ts";
import { enrichItems } from "./enrich.ts";
import { toNewsItem } from "./normalize.ts";
import { fetchFeed, type FeedResult } from "./rss.ts";
import { enabledSources } from "./sources.ts";
import { upsertNewsItems } from "./store.ts";
import type { NewsItem, NewsSource } from "./types.ts";

export interface SourceOutcome {
  readonly key: string;
  readonly name: string;
  readonly ok: boolean;
  readonly fetched: number;
  readonly error?: string;
}

export interface CollectReport {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly sources: readonly SourceOutcome[];
  readonly totalFetched: number;
  readonly afterDedupe: number;
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
        error: result.error,
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

  const enrichMax = options.enrichMax ?? 0;
  if (enrichMax > 0) {
    items = await enrichItems(items, {
      maxItems: enrichMax,
      provider: options.enrichProvider,
      model: options.enrichModel,
    });
  }
  const enrichedCount = items.filter((item) => item.enriched).length;

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
    enriched: enrichedCount,
    stored,
    tableCount,
    dryRun,
    items,
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
    ...overrides,
  });
}
