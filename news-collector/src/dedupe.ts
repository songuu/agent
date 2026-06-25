// 批内去重。
//
// 收集身份是 externalId（canonical URL 的 sha256），但不同源也可能给出同一 url 的不同形态，
// 故同时用 externalId 与 url 双重判定，保留首次出现顺序（稳定、可测）。
// 另外补一条“同源 + 同发布日期 + 同标题归一化”规则，挡住媒体源偶发的同文双链接。
// 该规则故意不跨 source 生效，避免误伤不同项目恰好同名的 release/公告。

import type { NewsItem } from "./types.ts";

function normalizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function dedupe(items: readonly NewsItem[]): NewsItem[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenSourceTitleDays = new Set<string>();
  const result: NewsItem[] = [];

  for (const item of items) {
    const sourceTitleDayKey = [
      item.sourceKey,
      item.publishedDate,
      normalizeTitle(item.title),
    ].join("::");
    if (
      seenIds.has(item.externalId) ||
      seenUrls.has(item.url) ||
      seenSourceTitleDays.has(sourceTitleDayKey)
    ) {
      continue;
    }
    seenIds.add(item.externalId);
    seenUrls.add(item.url);
    seenSourceTitleDays.add(sourceTitleDayKey);
    result.push(item);
  }

  return result;
}
