// 资讯收集系统的核心类型与校验 schema。
//
// 设计要点：
// - 8 层生态分类复用第 19/20 章框架，保证分类语义与课程一致。
// - NewsItem 字段一一对应 Supabase `news_items` 列，避免存储层再做映射歧义。
// - 所有外部输入（RSS 原始字段）一律视为 unknown，进入系统边界先归一再校验。

import { z } from "zod";

/** 八层生态框架，复用第 19 章 Agent 生态分层语义。 */
export const ECOSYSTEM_LAYERS = [
  "foundation",
  "model-platform",
  "protocol",
  "runtime",
  "product-ui",
  "data-memory",
  "evaluation",
  "security-governance",
] as const;

export type EcosystemLayer = (typeof ECOSYSTEM_LAYERS)[number];

/** 体系层中文标签，与第 20 章文章库筛选轴保持一致。 */
export const LAYER_LABELS: Readonly<Record<EcosystemLayer, string>> = {
  foundation: "基础综述",
  "model-platform": "模型与托管平台",
  protocol: "协议与互操作",
  runtime: "编排 Runtime",
  "product-ui": "产品与交互",
  "data-memory": "数据与记忆",
  evaluation: "评测与基准",
  "security-governance": "安全与治理",
};

export type SourceLang = "zh" | "en";

/** 源类型，仅用于展示分组与默认权重，不参与去重身份。 */
export type SourceKind =
  | "cn-media"
  | "en-media"
  | "paper"
  | "community"
  | "vendor-blog"
  | "release";

export type SourceFormat = "feed" | "aibase-html";

export type ArticleContentStatus = "not_fetched" | "fetched" | "empty" | "failed";

export interface SourceRetryPolicy {
  /** 总尝试次数（含首次），默认普通源 3，重点源 5。 */
  readonly maxAttempts?: number;
  /** 首次退避毫秒数；后续按指数退避。 */
  readonly baseDelayMs?: number;
}

/** 单个新闻源的注册信息。默认按 RSS/Atom feed 解析。 */
export interface NewsSource {
  /** 稳定的注册键，写入存储用于溯源，改名也不变，例如 "qbitai"。 */
  readonly key: string;
  /** 展示名，例如 "量子位"。 */
  readonly name: string;
  /** 来源地址。默认是 RSS2.0/Atom；少数无 feed 站点可用专用 format 适配。 */
  readonly url: string;
  readonly format?: SourceFormat;
  readonly kind: SourceKind;
  readonly lang: SourceLang;
  /** 分类器无法命中关键词时的兜底体系层；缺省退回 foundation。 */
  readonly layerHint?: EcosystemLayer;
  /** 重点站点：失败时更积极重试，也在日志里单独强调。 */
  readonly critical?: boolean;
  /** 可按源覆盖重试策略。 */
  readonly retry?: SourceRetryPolicy;
  /** 是否参与收集；间歇不稳定的源仍可保留 enabled，由抓取层做故障隔离。 */
  readonly enabled: boolean;
}

/** rss-parser 解析后、尚未归一的原始条目（字段可能缺失，故大量可选）。 */
export interface RawFeedItem {
  readonly title: string;
  readonly link: string;
  readonly contentSnippet?: string;
  readonly content?: string;
  /** Atom <summary> 常映射到这里（无 content 时的摘要来源）。 */
  readonly summary?: string;
  readonly isoDate?: string;
  readonly pubDate?: string;
  readonly guid?: string;
  readonly categories?: readonly string[];
}

/** 规则/LLM 分类的产出。 */
export interface Classification {
  readonly ecosystemLayer: EcosystemLayer;
  readonly ecosystemLayerLabel: string;
  readonly tags: readonly string[];
  readonly lang: SourceLang;
}

/** 归一后的最终记录，字段与 `news_items` 列一一对应。 */
export interface NewsItem {
  /** 收集身份 = canonical URL 的 sha256（前 32 hex）；幂等 upsert 的冲突键。 */
  readonly externalId: string;
  readonly sourceKey: string;
  readonly sourceName: string;
  readonly sourceKind: SourceKind;
  readonly title: string;
  /** 规范化后的原文链接（去 hash 与跟踪参数）。 */
  readonly url: string;
  readonly summary: string;
  /** 站内详情正文：由 collector 从原文抽取并截断；抓取失败时为空。 */
  readonly contentText: string;
  /** 列表摘要：优先取 contentText 首段截断，回退 feed summary。 */
  readonly contentExcerpt: string;
  readonly contentStatus: ArticleContentStatus;
  readonly contentFetchedAt: string | null;
  readonly ecosystemLayer: EcosystemLayer;
  readonly ecosystemLayerLabel: string;
  readonly tags: readonly string[];
  readonly lang: SourceLang;
  /** 原文发布时间 ISO；解析失败为 null。 */
  readonly publishedAt: string | null;
  /** 原文发布日期 YYYY-MM-DD；无发布时间时回退到 collectedDate，供接口/页面按文章日期筛选。 */
  readonly publishedDate: string;
  /** 收集时刻 ISO。 */
  readonly collectedAt: string;
  /** 收集日期 YYYY-MM-DD，用于审计采集批次，不作为文章日历筛选口径。 */
  readonly collectedDate: string;
  /** 是否经过 LLM 富化；规则兜底时为 false。 */
  readonly enriched: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** 出库前的运行时校验，挡住空标题/坏链接等脏数据。 */
export const newsItemSchema = z.object({
  externalId: z.string().min(8),
  sourceKey: z.string().min(1),
  sourceName: z.string().min(1),
  sourceKind: z.enum([
    "cn-media",
    "en-media",
    "paper",
    "community",
    "vendor-blog",
    "release",
  ]),
  title: z.string().min(1),
  url: z.string().url(),
  summary: z.string(),
  contentText: z.string(),
  contentExcerpt: z.string(),
  contentStatus: z.enum(["not_fetched", "fetched", "empty", "failed"]),
  contentFetchedAt: z.string().nullable(),
  ecosystemLayer: z.enum(ECOSYSTEM_LAYERS),
  ecosystemLayerLabel: z.string().min(1),
  tags: z.array(z.string()),
  lang: z.enum(["zh", "en"]),
  publishedAt: z.string().nullable(),
  publishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  collectedAt: z.string(),
  collectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  enriched: z.boolean(),
  metadata: z.record(z.unknown()),
});

export type ValidatedNewsItem = z.infer<typeof newsItemSchema>;
