/**
 * 术语表筛选/搜索的纯逻辑（无 DOM，可离线单测）。
 *
 * 筛选轴 = 主题（8 个，数据真有的维度 topic）；搜索 = 中/英全文，覆盖 term + definition + aliases。
 * 逻辑抽出来离线测，渲染器（glossary-explorer.ts）只管画。
 */
import {
  GLOSSARY_TOPIC_ORDER,
  glossaryTopicLabel,
  type GlossaryTerm,
  type GlossaryTopic,
} from "../../knowledge-graph/data/glossary";

export type TopicFilter = GlossaryTopic | "all";

export interface TopicOption {
  id: TopicFilter;
  label: string;
}

/** 主题筛选项（含「全部」在首位），顺序与 docs/glossary.md 分节一致。 */
export const TOPIC_OPTIONS: TopicOption[] = [
  { id: "all", label: "全部" },
  ...GLOSSARY_TOPIC_ORDER.map((topic) => ({
    id: topic,
    label: glossaryTopicLabel(topic),
  })),
];

/** 搜索归一：小写 + 去首尾空白。中文不受大小写影响，英文大小写不敏感。 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** 某词条是否命中搜索词（匹配 term / definition / aliases 任一）。空词视为命中。 */
export function matchesQuery(term: GlossaryTerm, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (term.term.toLowerCase().includes(normalizedQuery)) return true;
  if (term.definition.toLowerCase().includes(normalizedQuery)) return true;
  return term.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery));
}

/** 按主题 + 搜索词过滤（主题为 "all" 表示不限；搜索词空表示不限）。 */
export function filterTerms(
  terms: readonly GlossaryTerm[],
  topic: TopicFilter,
  query: string,
): GlossaryTerm[] {
  const normalizedQuery = normalizeQuery(query);
  return terms.filter((term) => {
    const byTopic = topic === "all" || term.topic === topic;
    return byTopic && matchesQuery(term, normalizedQuery);
  });
}

/** 各主题的词量（含 all 总量），用于 tab 上的计数。 */
export function topicCounts(
  terms: readonly GlossaryTerm[],
): Record<TopicFilter, number> {
  const counts = { all: terms.length } as Record<TopicFilter, number>;
  for (const topic of GLOSSARY_TOPIC_ORDER) counts[topic] = 0;
  for (const term of terms) counts[term.topic] += 1;
  return counts;
}
