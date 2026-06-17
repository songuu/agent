// 离线测试/smoke 用的确定性 fixtures：构造 Notion 页对象与来源，不触网、无密钥。

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { NotionDatabaseSource, NotionFolderSource } from "./notion-sources.ts";

export interface FakePageInput {
  readonly id?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly tags?: readonly string[];
  readonly status?: string;
  readonly date?: string;
  readonly createdTime?: string;
  readonly lastEditedTime?: string;
  readonly coverExternalUrl?: string;
}

/** 构造一个最小但字段齐全的 Notion 页对象（map 所需字段为真，其余按需 cast）。 */
export function makeNotionPage(input: FakePageInput = {}): PageObjectResponse {
  const id = input.id ?? "be633bf1-dfa0-436d-b259-571129a590e5";
  const properties: Record<string, unknown> = {
    Name: { id: "title", type: "title", title: rich(input.title ?? "示例文章") },
    Summary: { id: "summ", type: "rich_text", rich_text: rich(input.summary ?? "一段摘要") },
    Tags: {
      id: "tags",
      type: "multi_select",
      multi_select: (input.tags ?? ["agent", "notion"]).map((name) => ({ id: name, name, color: "default" })),
    },
    Status: {
      id: "stat",
      type: "select",
      select: { id: "s1", name: input.status ?? "Published", color: "green" },
    },
    "Published Date": {
      id: "date",
      type: "date",
      date: { start: input.date ?? "2026-06-17", end: null, time_zone: null },
    },
    ...(input.slug
      ? { Slug: { id: "slug", type: "rich_text", rich_text: rich(input.slug) } }
      : {}),
  };

  return {
    object: "page",
    id,
    created_time: input.createdTime ?? "2026-06-17T00:00:00.000Z",
    last_edited_time: input.lastEditedTime ?? "2026-06-17T08:30:00.000Z",
    url: `https://www.notion.so/${id.replace(/-/g, "")}`,
    cover: input.coverExternalUrl
      ? { type: "external", external: { url: input.coverExternalUrl } }
      : null,
    properties,
  } as unknown as PageObjectResponse;
}

function rich(text: string): unknown[] {
  return [
    {
      type: "text",
      text: { content: text, link: null },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: "default",
      },
      plain_text: text,
      href: null,
    },
  ];
}

export const FIXTURE_SOURCE: NotionDatabaseSource = {
  kind: "database",
  key: "fixture",
  name: "Fixture 博客",
  databaseId: "11111111111111111111111111111111",
  mapping: {
    summaryProperty: "Summary",
    tagsProperty: "Tags",
    slugProperty: "Slug",
    dateProperty: "Published Date",
    publish: { kind: "select", property: "Status", value: "Published" },
  },
  defaultTags: ["notion"],
  enabled: true,
};

export const FIXTURE_FOLDER_SOURCE: NotionFolderSource = {
  kind: "folder",
  key: "fixture-folder",
  name: "Fixture 文件夹",
  rootPageId: "22222222222222222222222222222222",
  mapping: {
    publish: { kind: "always" },
  },
  defaultTags: ["folder"],
  enabled: true,
};
