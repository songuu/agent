import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesPublishRule, slugify, toNotionArticle } from "../src/notion/map.ts";
import { FIXTURE_SOURCE, makeNotionPage } from "../src/notion/fixtures.ts";
import { notionArticleSchema } from "../src/notion/types.ts";

test("title comes from the title property, NOT the body H1", () => {
  const page = makeNotionPage({ title: "属性标题" });
  const article = toNotionArticle({
    page,
    markdown: "# 正文里的不同标题\n\n段落",
    source: FIXTURE_SOURCE,
  });
  assert.equal(article.title, "属性标题");
});

test("missing title falls back to Untitled (schema needs min 1)", () => {
  const page = makeNotionPage({ title: "" });
  const article = toNotionArticle({ page, markdown: "正文", source: FIXTURE_SOURCE });
  assert.equal(article.title, "Untitled");
});

test("tags merge multi_select with source defaults, deduped & ordered", () => {
  const page = makeNotionPage({ tags: ["agent"] });
  const article = toNotionArticle({ page, markdown: "x", source: FIXTURE_SOURCE });
  assert.deepEqual(article.tags, ["agent", "notion"]);
});

test("slug always carries pageId suffix (explicit base or slugify(title))", () => {
  const withSlug = toNotionArticle({
    page: makeNotionPage({ slug: "my-slug" }),
    markdown: "x",
    source: FIXTURE_SOURCE,
  });
  assert.equal(withSlug.slug, "my-slug-be633bf1");

  const derived = toNotionArticle({
    page: makeNotionPage({ id: "aa11bb22-cc33-dd44-ee55-ff6677889900", title: "Hello World" }),
    markdown: "x",
    source: FIXTURE_SOURCE,
  });
  assert.equal(derived.slug, "hello-world-aa11bb22");
});

test("two pages with the SAME explicit slug get DISTINCT slugs (no unique(slug) collision)", () => {
  const a = toNotionArticle({
    page: makeNotionPage({ id: "be633bf1-dfa0-436d-b259-571129a590e5", slug: "dup" }),
    markdown: "x",
    source: FIXTURE_SOURCE,
  });
  const b = toNotionArticle({
    page: makeNotionPage({ id: "aa11bb22-cc33-dd44-ee55-ff6677889900", slug: "dup" }),
    markdown: "x",
    source: FIXTURE_SOURCE,
  });
  assert.notEqual(a.slug, b.slug);
  assert.equal(a.slug, "dup-be633bf1");
  assert.equal(b.slug, "dup-aa11bb22");
});

test("status published when Status matches; draft otherwise", () => {
  const pub = toNotionArticle({ page: makeNotionPage({ status: "Published" }), markdown: "x", source: FIXTURE_SOURCE });
  assert.equal(pub.status, "published");
  const draft = toNotionArticle({ page: makeNotionPage({ status: "Draft" }), markdown: "x", source: FIXTURE_SOURCE });
  assert.equal(draft.status, "draft");
});

test("publishedDate from date property", () => {
  const article = toNotionArticle({ page: makeNotionPage({ date: "2026-05-01" }), markdown: "x", source: FIXTURE_SOURCE });
  assert.equal(article.publishedDate, "2026-05-01");
});

test("cover keeps external url, drops expiring file cover", () => {
  const ext = toNotionArticle({
    page: makeNotionPage({ coverExternalUrl: "https://cdn.example.com/c.png" }),
    markdown: "x",
    source: FIXTURE_SOURCE,
  });
  assert.equal(ext.coverImageUrl, "https://cdn.example.com/c.png");
  const none = toNotionArticle({ page: makeNotionPage(), markdown: "x", source: FIXTURE_SOURCE });
  assert.equal(none.coverImageUrl, null);
});

test("matchesPublishRule handles always/checkbox/select", () => {
  const page = makeNotionPage({ status: "Published" });
  assert.equal(matchesPublishRule(page.properties, { kind: "always" }), true);
  assert.equal(
    matchesPublishRule(page.properties, { kind: "select", property: "Status", value: "Published" }),
    true,
  );
  assert.equal(
    matchesPublishRule(page.properties, { kind: "select", property: "Status", value: "Draft" }),
    false,
  );
});

test("slugify keeps unicode letters, folds the rest", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("Agent 前沿"), "agent-前沿");
});

test("map output satisfies notionArticleSchema (map↔schema contract)", () => {
  const article = toNotionArticle({
    page: makeNotionPage({ coverExternalUrl: "https://cdn.example.com/c.png" }),
    markdown: "# 正文\n\n段落",
    source: FIXTURE_SOURCE,
  });
  // 若 map 产出与 store 出库校验漂移，这里立即失败（store 会静默丢弃非法行）。
  assert.doesNotThrow(() => notionArticleSchema.parse(article));
});
