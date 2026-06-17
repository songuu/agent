// Notion 文章同步子系统的核心类型与校验 schema。
//
// 设计要点（对齐 news-collector 既有约定，见 ../types.ts）：
// - NotionArticle 字段一一对应 Supabase `notion_articles` 列，存储层不再做映射歧义。
// - 所有 Notion 原始输入（页面属性、blocks）进入系统边界先归一再 zod 校验。
// - 与 news_items 的关键差异：身份键是 notion_page_id（Notion 页 UUID，跨编辑稳定），
//   不是 URL sha256；且存储**全文** body_markdown（news_items 只存摘要、绝不存正文）。

import { z } from "zod";

/** 文章发布态；anon 只能读 published（RLS 守门），草稿/归档仅 service_role 可见。 */
export type NotionArticleStatus = "draft" | "published" | "archived";

export const NOTION_ARTICLE_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

/**
 * 归一后的最终记录，字段与 `notion_articles` 列一一对应（app 负责的列；
 * id / read_count / search_text / created_at / updated_at 由库默认或触发器管理）。
 */
export interface NotionArticle {
  /** Notion 页 UUID（带连字符）；幂等 upsert 的冲突键，跨标题/正文编辑稳定。 */
  readonly notionPageId: string;
  /** 详情页路由键 /docs/notion/article?slug=<slug>；唯一。 */
  readonly slug: string;
  /** 来源注册键（notion-sources.ts 的 key），用于按源算增量水位与溯源。 */
  readonly sourceKey: string;
  readonly title: string;
  /** 摘要/卡片副本；缺省取正文首段或空串。 */
  readonly summary: string;
  /** 全文 markdown（blocks→markdown 转换 + 图片已重托管成稳定 URL）。 */
  readonly bodyMarkdown: string;
  /** 封面图稳定 URL；无封面为 null。 */
  readonly coverImageUrl: string | null;
  readonly tags: readonly string[];
  readonly status: NotionArticleStatus;
  /** 发布时间 ISO；无日期属性时回退页面创建时间，仍无则 null。 */
  readonly publishedAt: string | null;
  /** 发布日期 YYYY-MM-DD，供列表页日历筛选；publishedAt 缺失时回退 last_edited 日期。 */
  readonly publishedDate: string;
  /** Notion 原页链接（编辑入口/兜底跳转）。 */
  readonly notionUrl: string;
  /** Notion 的 last_edited_time（ISO）；增量同步的高水位，原样保留亚秒精度。 */
  readonly notionLastEditedTime: string;
  /** 杂项：图片 manifest（metadata.assets）、原始属性快照等。 */
  readonly metadata: Readonly<Record<string, unknown>>;
}

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
// Notion 页 UUID 形如 be633bf1-dfa0-436d-b259-571129a590e5。
const notionPageId = z
  .string()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);

/** 出库前的运行时校验，挡住空标题/坏 slug/坏页 id 等脏数据（mirror newsItemSchema）。 */
export const notionArticleSchema = z.object({
  notionPageId,
  slug: z.string().min(1),
  sourceKey: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  bodyMarkdown: z.string(),
  coverImageUrl: z.string().url().nullable(),
  tags: z.array(z.string()),
  status: z.enum(NOTION_ARTICLE_STATUSES),
  publishedAt: z.string().nullable(),
  publishedDate: isoDateString,
  notionUrl: z.string(),
  notionLastEditedTime: z.string().min(1),
  metadata: z.record(z.unknown()),
});

export type ValidatedNotionArticle = z.infer<typeof notionArticleSchema>;

/**
 * 发布判定规则：不同 Notion 库用不同属性表达"已发布"，做成可配置而非写死。
 * - checkbox：勾选即发布
 * - select / status：某属性等于指定值即发布
 * - always：库内全部视为发布（小库 / 离线测试）
 */
export type NotionPublishRule =
  | { readonly kind: "checkbox"; readonly property: string }
  | { readonly kind: "select"; readonly property: string; readonly value: string }
  | { readonly kind: "status"; readonly property: string; readonly value: string }
  | { readonly kind: "always" };

/**
 * Notion 数据库属性 → NotionArticle 字段的映射配置。
 * 留空的属性走兜底：title 自动取 title 类型属性；slug 缺省 slugify(title)+pageId 后缀；
 * 日期缺省回退 created_time / last_edited_time。
 */
export interface NotionPropertyMapping {
  /** title 类型属性键；缺省自动探测页面里 type==='title' 的属性。 */
  readonly titleProperty?: string;
  /** 摘要 rich_text 属性键。 */
  readonly summaryProperty?: string;
  /** 标签 multi_select 属性键。 */
  readonly tagsProperty?: string;
  /** slug rich_text 属性键；缺省由标题派生。 */
  readonly slugProperty?: string;
  /** 发布日期 date 属性键；缺省回退页面时间。 */
  readonly dateProperty?: string;
  /** 发布判定规则。 */
  readonly publish: NotionPublishRule;
}
