// Notion 来源注册表（mirror ../sources.ts）。
//
// 只放**非密钥**结构：同步哪个 Notion 文件夹/数据库、属性映射与默认标签。
// 密钥（NOTION_TOKEN）走 .env。推荐 v1 只配一个 folder source：
// 填 rootPageId，置 enabled:true，并把该页面/文件夹共享给 Notion integration。
//
// rootPageId 是目标文件夹/页面 URL 里的 32 位十六进制（可带或不带连字符）：
//   https://www.notion.so/<workspace>/<pageId>?pvs=...
// databaseId 是 Notion 数据库 URL 里的 32 位十六进制（可带或不带连字符）：
//   https://www.notion.so/<workspace>/<databaseId>?v=...

import type { NotionPropertyMapping } from "./types.ts";

interface BaseNotionSource {
  /** 稳定注册键，写入 notion_articles.source_key 用于按源算增量水位与溯源。 */
  readonly key: string;
  /** 展示名。 */
  readonly name: string;
  /** 属性 → 字段映射 + 发布判定。 */
  readonly mapping: NotionPropertyMapping;
  /** 该源所有文章附加的默认标签（与 Notion Tags 合并去重）。 */
  readonly defaultTags?: readonly string[];
  /** 是否参与同步。 */
  readonly enabled: boolean;
}

export interface NotionDatabaseSource extends BaseNotionSource {
  readonly kind: "database";
  /** Notion 数据库 id（32 hex，带/不带连字符均可）。 */
  readonly databaseId: string;
}

export interface NotionFolderSource extends BaseNotionSource {
  readonly kind: "folder";
  /** 目标 Notion 文件夹/页面 id；只递归同步它下面的 child_page。 */
  readonly rootPageId: string;
}

export type NotionSource = NotionDatabaseSource | NotionFolderSource;

const FOLDER_MAPPING: NotionPropertyMapping = {
  // 文件夹内普通 page 通常没有数据库属性；全部视为可同步文章。
  publish: { kind: "always" },
};

export const NOTION_SOURCES: readonly NotionSource[] = [
  // —— 每日同步的 Notion 文件夹/页面 child_page 子树 ——
  {
    kind: "folder",
    key: "notion-folder",
    name: "Notion 文件夹",
    rootPageId: "37675ad642258045bf3cd1b5aaac846b",
    mapping: FOLDER_MAPPING,
    defaultTags: [],
    enabled: true,
  },
  {
    kind: "folder",
    key: "notion-folder-38275ad6",
    name: "Notion 文件夹 38275ad6",
    rootPageId: "38275ad64225801db8c1e09e93319754",
    mapping: FOLDER_MAPPING,
    defaultTags: [],
    enabled: true,
  },
  {
    kind: "folder",
    key: "notion-folder-37975ad6",
    name: "Notion 文件夹 37975ad6",
    rootPageId: "37975ad6422580379e85cf442cbb0698",
    mapping: FOLDER_MAPPING,
    defaultTags: [],
    enabled: true,
  },
  {
    kind: "folder",
    key: "notion-folder-2d475ad6",
    name: "Notion 文件夹 2d475ad6",
    rootPageId: "2d475ad6422580ebaad7f06e31207730",
    mapping: FOLDER_MAPPING,
    defaultTags: [],
    enabled: true,
  },
  // —— 可选：如果你明确要同步某个 database，再启用这个模板 ——
  {
    kind: "database",
    key: "notion-database",
    name: "Notion 数据库",
    databaseId: "37675ad642258045bf3cd1b5aaac846b",
    mapping: {
      // 留空 titleProperty 则自动探测 type==='title' 的属性。
      summaryProperty: "Summary",
      tagsProperty: "Tags",
      slugProperty: "Slug",
      dateProperty: "Published Date",
      // 默认：Status(select) 等于 'Published' 视为已发布；按你库的实际字段改。
      publish: { kind: "select", property: "Status", value: "Published" },
    },
    defaultTags: [],
    enabled: false,
  },
];

/** 仅取启用且 databaseId 非占位的源；sync/cron/cli 都走这个入口。 */
export function enabledNotionSources(): readonly NotionSource[] {
  return NOTION_SOURCES.filter((source) => {
    if (!source.enabled) return false;
    if (source.kind === "folder") return !/^0+$/.test(source.rootPageId);
    return !/^0+$/.test(source.databaseId);
  });
}

export function findNotionSource(key: string): NotionSource | undefined {
  return NOTION_SOURCES.find((source) => source.key === key);
}

export function isDatabaseSource(source: NotionSource): source is NotionDatabaseSource {
  return source.kind === "database";
}

export function isFolderSource(source: NotionSource): source is NotionFolderSource {
  return source.kind === "folder";
}
