import assert from "node:assert/strict";
import test from "node:test";

import {
  ContentRequestError,
  contentFields,
  contentTable,
  parseContentReadRequest,
} from "./contract.ts";

function read(path: string) {
  return parseContentReadRequest(new URL(`http://content.test${path}`));
}

test("maps public resource names to stable content tables", () => {
  assert.equal(contentTable("news"), "news_items");
  assert.equal(contentTable("frontier"), "frontier_ecosystem_articles");
  assert.ok(contentFields("notion").includes("notion_page_id"));
});

test("parses a bounded semantic content request", () => {
  assert.deepEqual(
    read("/api/content/v1/news?fields=external_id,title&filter=ecosystem_layer:eq:framework&sort=published_date:desc&limit=20&offset=40"),
    {
      resource: "news",
      fields: ["external_id", "title"],
      filters: [{ field: "ecosystem_layer", operator: "eq", value: "framework" }],
      sort: [{ field: "published_date", direction: "desc" }],
      limit: 20,
      offset: 40,
      includeTotal: true,
    },
  );
});

test("keeps colon-containing equality values intact", () => {
  const request = read("/api/content/v1/notion?fields=slug&filter=slug:eq:https%3A%2F%2Fexample.com%2Fa");
  assert.deepEqual(request.filters, [
    { field: "slug", operator: "eq", value: "https://example.com/a" },
    { field: "status", operator: "eq", value: "published" },
  ]);
});

test("uses safe pagination defaults and supports count=none", () => {
  const request = read("/api/content/v1/interviews?fields=slug&count=none");
  assert.equal(request.limit, 100);
  assert.equal(request.offset, 0);
  assert.equal(request.includeTotal, false);
});

test("forces published-only visibility for Notion through the provider-neutral API", () => {
  const request = read("/api/content/v1/notion?fields=slug,title");
  assert.deepEqual(request.filters, [{ field: "status", operator: "eq", value: "published" }]);
  assert.throws(
    () => read("/api/content/v1/notion?fields=slug&filter=status:eq:draft"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "forbidden_filter",
  );
});
test("rejects a resource outside the public allowlist", () => {
  assert.throws(
    () => read("/api/content/v1/users?fields=id"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "unknown_resource",
  );
});

test("rejects an unknown query parameter", () => {
  assert.throws(
    () => read("/api/content/v1/news?fields=external_id&sql=DROP%20TABLE"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "unknown_parameter",
  );
});

test("rejects a field outside the resource manifest", () => {
  assert.throws(
    () => read("/api/content/v1/news?fields=external_id,password_hash"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "unsupported_field",
  );
});

test("rejects duplicate selected fields", () => {
  assert.throws(
    () => read("/api/content/v1/news?fields=external_id,external_id"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "duplicate_field",
  );
});

test("rejects unsupported filter operators", () => {
  assert.throws(
    () => read("/api/content/v1/news?fields=external_id&filter=title:like:%25agent%25"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "invalid_filter",
  );
});

test("rejects malformed sorting and out-of-range paging", () => {
  assert.throws(
    () => read("/api/content/v1/news?fields=external_id&sort=title:sideways"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "invalid_sort",
  );
  assert.throws(
    () => read("/api/content/v1/news?fields=external_id&limit=1001"),
    (error: unknown) => error instanceof ContentRequestError && error.code === "invalid_pagination",
  );
});