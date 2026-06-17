// 批内去重。
//
// 收集身份是 externalId（canonical URL 的 sha256），但不同源也可能给出同一 url 的不同形态，
// 故同时用 externalId 与 url 双重判定，保留首次出现顺序（稳定、可测）。
// 数据库侧还有 unique(external_id) + on_conflict upsert 作为二道幂等防线。

import type { NewsItem } from "./types.ts";

export function dedupe(items: readonly NewsItem[]): NewsItem[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const result: NewsItem[] = [];

  for (const item of items) {
    if (seenIds.has(item.externalId) || seenUrls.has(item.url)) continue;
    seenIds.add(item.externalId);
    seenUrls.add(item.url);
    result.push(item);
  }

  return result;
}
