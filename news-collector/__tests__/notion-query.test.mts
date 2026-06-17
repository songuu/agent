import assert from "node:assert/strict";
import { test } from "node:test";
import type { Client } from "@notionhq/client";
import { buildArticleQuery, iterateFolderPages } from "../src/notion/query.ts";
import { FIXTURE_FOLDER_SOURCE, FIXTURE_SOURCE, makeNotionPage } from "../src/notion/fixtures.ts";
import type { NotionDatabaseSource } from "../src/notion/notion-sources.ts";

const ALWAYS_SOURCE: NotionDatabaseSource = {
  ...FIXTURE_SOURCE,
  mapping: { ...FIXTURE_SOURCE.mapping, publish: { kind: "always" } },
};

test("no since + select publish → single select filter, ascending sort", () => {
  const query = buildArticleQuery(FIXTURE_SOURCE, null);
  assert.equal(query.database_id, FIXTURE_SOURCE.databaseId);
  assert.deepEqual(query.sorts, [{ timestamp: "last_edited_time", direction: "ascending" }]);
  const filter = query.filter as { select?: { equals: string }; property?: string };
  assert.equal(filter.property, "Status");
  assert.equal(filter.select?.equals, "Published");
});

test("since + select publish → and[select, last_edited on_or_after]", () => {
  const since = "2026-06-01T00:00:00.000Z";
  const query = buildArticleQuery(FIXTURE_SOURCE, since);
  const filter = query.filter as { and: Array<Record<string, unknown>> };
  assert.equal(filter.and.length, 2);
  const timestamp = filter.and.find((c) => "timestamp" in c) as
    | { last_edited_time: { on_or_after: string } }
    | undefined;
  assert.equal(timestamp?.last_edited_time.on_or_after, since);
});

test("always publish + no since → no filter", () => {
  const query = buildArticleQuery(ALWAYS_SOURCE, null);
  assert.equal(query.filter, undefined);
});

test("always publish + since → single timestamp filter", () => {
  const query = buildArticleQuery(ALWAYS_SOURCE, "2026-06-01T00:00:00.000Z");
  const filter = query.filter as { timestamp?: string };
  assert.equal(filter.timestamp, "last_edited_time");
});

test("page_size override is honored", () => {
  const query = buildArticleQuery(FIXTURE_SOURCE, null, 50);
  assert.equal(query.page_size, 50);
});

function childPageBlock(id: string) {
  return {
    object: "block",
    id,
    type: "child_page",
    has_children: true,
    child_page: { title: id },
  };
}

function fakeFolderClient(): Client {
  const oldParentId = "11111111-1111-1111-1111-111111111111";
  const changedSiblingId = "22222222-2222-2222-2222-222222222222";
  const changedGrandchildId = "33333333-3333-3333-3333-333333333333";
  const childrenByBlockId: Record<string, unknown[]> = {
    [FIXTURE_FOLDER_SOURCE.rootPageId]: [
      childPageBlock(oldParentId),
      { object: "block", id: "paragraph-1", type: "paragraph" },
      childPageBlock(changedSiblingId),
    ],
    [oldParentId]: [childPageBlock(changedGrandchildId)],
    [changedSiblingId]: [],
    [changedGrandchildId]: [],
  };
  const pages = {
    [oldParentId]: makeNotionPage({
      id: oldParentId,
      title: "old parent",
      lastEditedTime: "2026-05-01T00:00:00.000Z",
    }),
    [changedSiblingId]: makeNotionPage({
      id: changedSiblingId,
      title: "changed sibling",
      lastEditedTime: "2026-06-18T00:00:00.000Z",
    }),
    [changedGrandchildId]: makeNotionPage({
      id: changedGrandchildId,
      title: "changed grandchild",
      lastEditedTime: "2026-06-19T00:00:00.000Z",
    }),
  };
  return {
    pages: {
      retrieve: async ({ page_id }: { page_id: string }) => pages[page_id as keyof typeof pages],
    },
    blocks: {
      children: {
        list: async ({ block_id }: { block_id: string }) => ({
          object: "list",
          results: childrenByBlockId[block_id] ?? [],
          next_cursor: null,
          has_more: false,
          type: "block",
          block: {},
        }),
      },
    },
  } as unknown as Client;
}

test("folder source traverses only child pages under root and filters changed articles", async () => {
  const pages = [];
  for await (const page of iterateFolderPages(
    fakeFolderClient(),
    FIXTURE_FOLDER_SOURCE,
    "2026-06-01T00:00:00.000Z",
  )) {
    pages.push(page.id);
  }

  assert.deepEqual(pages, [
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
  ]);
});
