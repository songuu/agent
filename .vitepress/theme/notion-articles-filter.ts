// Notion 文章列表的纯筛选逻辑（无 DOM/网络，node:test 覆盖）。
// 标签轴 + 全文搜索 + 计数；日期轴复用 frontier-date-filter（view 暴露 collectedDate=publishedDate）。

export interface NotionArticleView {
  readonly notionPageId: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly status: string;
  readonly publishedDate: string;
  /** frontier-date-filter 把此字段当文章日期；来源于 published_date。 */
  readonly collectedDate: string;
  readonly coverImageUrl: string | null;
  readonly readCount: number;
}

export type TagFilter = string | "all";

export interface NotionFilterState {
  readonly tag: TagFilter;
  readonly query: string;
}

/** 标签命中（"all" 放行）。 */
function matchesTag(article: NotionArticleView, tag: TagFilter): boolean {
  return tag === "all" || article.tags.includes(tag);
}

/** 搜索命中：标题/摘要/标签任一包含关键词（大小写不敏感）；空查询放行。 */
export function matchesQuery(article: NotionArticleView, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [article.title, article.summary, ...article.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** 按标签 + 搜索过滤（不含日期轴）。 */
export function filterArticles(
  articles: readonly NotionArticleView[],
  state: NotionFilterState,
): NotionArticleView[] {
  return articles.filter(
    (article) => matchesTag(article, state.tag) && matchesQuery(article, state.query),
  );
}

/** 全部标签（按出现频次降序、同频按字典序），用于渲染标签筛选条。 */
export function availableTags(articles: readonly NotionArticleView[]): string[] {
  const counts = tagCounts(articles);
  return [...counts.keys()].sort((a, b) => {
    const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

/** 每个标签的文章计数。 */
export function tagCounts(
  articles: readonly NotionArticleView[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}
