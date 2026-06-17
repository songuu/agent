// 纯映射：Notion 页对象 + 已转换 markdown → NotionArticle。
//
// 关键不变量：
// - title 取 Notion **title 类型属性**（page.properties 里 type==='title'），不取正文首个 H1，
//   否则无 H1 的页会丢标题、有 H1 的页会重复渲染标题。
// - 不在此读时钟：发布时间来自 Notion 日期属性 / created_time，保证确定性单测。
// - cover 仅保留 external（永久）URL；file 类型 cover 是会过期的临时 URL，v1 暂不重托管（见 deferred），置 null。

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { NotionSource } from "./notion-sources.ts";
import type {
  NotionArticle,
  NotionArticleStatus,
  NotionPublishRule,
} from "./types.ts";
import { isDatabaseSource, isFolderSource } from "./notion-sources.ts";

type Properties = PageObjectResponse["properties"];

interface RichTextLike {
  readonly plain_text: string;
}

function plainText(items: readonly RichTextLike[] | undefined): string {
  if (!items) return "";
  return items.map((item) => item.plain_text).join("").trim();
}

/** 取 title 类型属性文本：优先指定属性名，否则自动探测第一个 type==='title'。 */
function getTitleText(properties: Properties, titleProperty?: string): string {
  if (titleProperty) {
    const named = properties[titleProperty];
    if (named && named.type === "title") return plainText(named.title);
  }
  for (const value of Object.values(properties)) {
    if (value.type === "title") return plainText(value.title);
  }
  return "";
}

function getRichText(properties: Properties, name?: string): string {
  if (!name) return "";
  const value = properties[name];
  if (value && value.type === "rich_text") return plainText(value.rich_text);
  return "";
}

function getMultiSelect(properties: Properties, name?: string): string[] {
  if (!name) return [];
  const value = properties[name];
  if (value && value.type === "multi_select") {
    return value.multi_select.map((option) => option.name);
  }
  return [];
}

function getDateStart(properties: Properties, name?: string): string | null {
  if (!name) return null;
  const value = properties[name];
  if (value && value.type === "date") return value.date?.start ?? null;
  return null;
}

/** 按发布规则判定该页是否"已发布"。 */
export function matchesPublishRule(
  properties: Properties,
  rule: NotionPublishRule,
): boolean {
  switch (rule.kind) {
    case "always":
      return true;
    case "checkbox": {
      const value = properties[rule.property];
      return Boolean(value && value.type === "checkbox" && value.checkbox);
    }
    case "select": {
      const value = properties[rule.property];
      return Boolean(
        value && value.type === "select" && value.select?.name === rule.value,
      );
    }
    case "status": {
      const value = properties[rule.property];
      return Boolean(
        value && value.type === "status" && value.status?.name === rule.value,
      );
    }
  }
}

/** 去重保序合并标签。 */
function mergeTags(
  fromNotion: readonly string[],
  defaults: readonly string[] | undefined,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of [...fromNotion, ...(defaults ?? [])]) {
    const trimmed = tag.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

/** URL 友好 slug：保留 Unicode 字母/数字（含中文），其余折叠为连字符。 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shortPageId(pageId: string): string {
  return pageId.replace(/-/g, "").slice(0, 8);
}

/** 解析为 ISO instant；失败返回 null。 */
function toIso(raw: string | null): string | null {
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? null : new Date(ts).toISOString();
}

/** 正文兜底摘要：取首个非标题/非图片的文本行，去 md 记号，截断。 */
function deriveSummary(markdown: string, max = 200): string {
  for (const line of markdown.split("\n")) {
    const text = line.trim();
    if (!text || text.startsWith("#") || text.startsWith("![") || text.startsWith("|")) {
      continue;
    }
    const plain = text.replace(/[*_`>#-]/g, "").trim();
    if (plain) return plain.length <= max ? plain : `${plain.slice(0, max - 1).trimEnd()}…`;
  }
  return "";
}

function coverUrl(page: PageObjectResponse): string | null {
  const cover = page.cover;
  if (!cover) return null;
  // 仅 external 永久 URL；file 类型是会过期的临时 URL，v1 不重托管封面（deferred）。
  if (cover.type === "external") return cover.external.url;
  return null;
}

export interface MapArgs {
  readonly page: PageObjectResponse;
  readonly markdown: string;
  readonly source: NotionSource;
}

/** 把 Notion 页 + markdown 合成 NotionArticle（未校验；由 store/sync 出库前 zod 校验）。 */
export function toNotionArticle(args: MapArgs): NotionArticle {
  const { page, markdown, source } = args;
  const { mapping } = source;
  const properties = page.properties;

  const title = getTitleText(properties, mapping.titleProperty) || "Untitled";

  // slug 始终拼接 pageId 短前缀 → 全局唯一：避免两页用同一 explicit Slug 时撞 notion_articles
  // 的 unique(slug) 约束（23505 会让整批 upsert 失败、增量水位永久卡死，详见 sprint Phase 4）。
  const explicitSlug = getRichText(properties, mapping.slugProperty);
  const slugBase = slugify(explicitSlug) || slugify(title);
  const slug = slugBase ? `${slugBase}-${shortPageId(page.id)}` : shortPageId(page.id);

  const summaryProp = getRichText(properties, mapping.summaryProperty);
  const summary = summaryProp || deriveSummary(markdown);

  const tags = mergeTags(
    getMultiSelect(properties, mapping.tagsProperty),
    source.defaultTags,
  );

  const status: NotionArticleStatus = matchesPublishRule(properties, mapping.publish)
    ? "published"
    : "draft";

  const dateStart = getDateStart(properties, mapping.dateProperty);
  const publishedAt = toIso(dateStart) ?? page.created_time;
  const publishedDate = (dateStart ?? page.created_time ?? page.last_edited_time).slice(0, 10);

  const sourceMetadata: Record<string, string> = {};
  if (isDatabaseSource(source)) {
    sourceMetadata.sourceDatabaseId = source.databaseId;
  }
  if (isFolderSource(source)) {
    sourceMetadata.sourceRootPageId = source.rootPageId;
  }

  return {
    notionPageId: page.id,
    slug,
    sourceKey: source.key,
    title,
    summary,
    bodyMarkdown: markdown,
    coverImageUrl: coverUrl(page),
    tags,
    status,
    publishedAt,
    publishedDate,
    notionUrl: page.url,
    notionLastEditedTime: page.last_edited_time,
    metadata: {
      sourceKind: source.kind,
      ...sourceMetadata,
      notionUrl: page.url,
    },
  };
}
