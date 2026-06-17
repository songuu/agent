// 增量查询 Notion 数据库的"已发布且自上次同步后有改动"的页面。
//
// 在 2022-06-28 契约下用 databases.query（见 client.ts 版本 pin 的 WHY）。
// iteratePaginatedAPI 自动处理 start_cursor/has_more/next_cursor，不手写 100 行/页循环。
// 升序排 last_edited_time：高水位单调推进，中途崩溃可从上次水位安全续跑。

import { iteratePaginatedAPI, isFullPage, type Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { withNotionRetry, type RetryOptions } from "./client.ts";
import type { NotionDatabaseSource, NotionFolderSource } from "./notion-sources.ts";

/**
 * 由来源映射 + 增量水位构造 databases.query 参数（纯函数，便于测 filter 形状）。
 * sinceIso 为 null（首次/全量）时不加时间过滤；on_or_after 含界——边界页会被重取，
 * 靠 notion_page_id 幂等 upsert 抵消，不会重复入行。
 *
 * 已知限制（v1，见 sprint deferred）：查询只取"发布态匹配"的页，因此在 Notion 里把已同步页
 * 改回草稿不会被本查询重新抓到 → 站内不会自动下线（需手动改库 status 或后续 prune 任务）。
 */
export function buildArticleQuery(
  source: NotionDatabaseSource,
  sinceIso: string | null,
  pageSize = 100,
): QueryDatabaseParameters {
  const publish = source.mapping.publish;
  const conditions: unknown[] = [];

  if (publish.kind === "checkbox") {
    conditions.push({ property: publish.property, checkbox: { equals: true } });
  } else if (publish.kind === "select") {
    conditions.push({ property: publish.property, select: { equals: publish.value } });
  } else if (publish.kind === "status") {
    conditions.push({ property: publish.property, status: { equals: publish.value } });
  }
  if (sinceIso) {
    conditions.push({
      timestamp: "last_edited_time",
      last_edited_time: { on_or_after: sinceIso },
    });
  }

  let filter: QueryDatabaseParameters["filter"];
  if (conditions.length === 1) {
    filter = conditions[0] as QueryDatabaseParameters["filter"];
  } else if (conditions.length > 1) {
    filter = { and: conditions } as QueryDatabaseParameters["filter"];
  }

  return {
    database_id: source.databaseId,
    ...(filter ? { filter } : {}),
    sorts: [{ timestamp: "last_edited_time", direction: "ascending" }],
    page_size: pageSize,
  };
}

/**
 * 遍历查询结果，只 yield 完整页对象（过滤掉缺属性的 partial 响应）。
 * 每页 query 调用经 withNotionRetry 包裹：限流(429)/网关(5xx) 上退避重试，读 Retry-After 优先。
 */
export async function* iterateArticlePages(
  client: Client,
  query: QueryDatabaseParameters,
  retry?: RetryOptions,
): AsyncGenerator<PageObjectResponse> {
  const queryWithRetry = (
    args: QueryDatabaseParameters,
  ): Promise<QueryDatabaseResponse> =>
    withNotionRetry(() => client.databases.query(args), retry);

  for await (const page of iteratePaginatedAPI(queryWithRetry, query)) {
    if (isFullPage(page)) yield page;
  }
}

function isChildPageBlock(block: unknown): block is BlockObjectResponse & {
  type: "child_page";
  child_page: { title: string };
} {
  return Boolean(
    block &&
      typeof block === "object" &&
      "type" in block &&
      (block as { type?: string }).type === "child_page",
  );
}

function isPageEditedSince(page: PageObjectResponse, sinceIso: string | null): boolean {
  if (!sinceIso) return true;
  return Date.parse(page.last_edited_time) >= Date.parse(sinceIso);
}

async function retrieveFullPage(
  client: Client,
  pageId: string,
  retry?: RetryOptions,
): Promise<PageObjectResponse | null> {
  const page = await withNotionRetry(() => client.pages.retrieve({ page_id: pageId }), retry);
  return isFullPage(page) ? page : null;
}

async function* iterateChildBlocks(
  client: Client,
  blockId: string,
  retry?: RetryOptions,
): AsyncGenerator<BlockObjectResponse> {
  const listWithRetry = (
    args: Parameters<Client["blocks"]["children"]["list"]>[0],
  ): Promise<ListBlockChildrenResponse> =>
    withNotionRetry(() => client.blocks.children.list(args), retry);

  for await (const block of iteratePaginatedAPI(listWithRetry, {
    block_id: blockId,
    page_size: 100,
  })) {
    if (block && typeof block === "object" && "object" in block && block.object === "block") {
      yield block as BlockObjectResponse;
    }
  }
}

/**
 * 递归同步某个 Notion 文件夹/页面下的 child_page。
 * rootPageId 只是作用域边界，不把 root 自身当文章；这样用户可以把一个页面当"文件夹"，
 * 只同步其直接/间接子页面，而不是 search 整个 workspace。
 */
export async function* iterateFolderPages(
  client: Client,
  source: NotionFolderSource,
  sinceIso: string | null,
  retry?: RetryOptions,
): AsyncGenerator<PageObjectResponse> {
  const visited = new Set<string>();
  const queue = [source.rootPageId];

  while (queue.length > 0) {
    const parentId = queue.shift();
    if (!parentId || visited.has(parentId)) continue;
    visited.add(parentId);

    for await (const block of iterateChildBlocks(client, parentId, retry)) {
      if (!isChildPageBlock(block)) continue;

      const page = await retrieveFullPage(client, block.id, retry);
      if (!page) continue;

      // 即使父页没改，也继续递归检查子页；否则旧父页下的新子页会被水位误挡。
      queue.push(page.id);
      if (isPageEditedSince(page, sinceIso)) yield page;
    }
  }
}
