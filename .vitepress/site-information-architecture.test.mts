import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONTEXTUAL_SIDEBAR,
  PORTAL_PILLARS,
  PRIMARY_NAVIGATION,
  collectNavigationLinks,
  collectSidebarLinks,
} from "./site-information-architecture";

const CRITICAL_ROUTES = [
  "/docs/navigation",
  "/capstone/",
  "/news/",
  "/interview/",
  "/notion/",
  "/source-analysis/repository-matrix",
  "/docs/knowledge-graph",
  "/knowledge-graph/",
] as const;

test("primary navigation stays task-oriented and keeps every public product reachable", () => {
  assert.deepEqual(
    PRIMARY_NAVIGATION.map((item) => item.text),
    ["首页", "学习", "项目", "情报", "源码", "更多"],
  );

  const links = new Set(collectNavigationLinks(PRIMARY_NAVIGATION));
  for (const route of CRITICAL_ROUTES) {
    assert.ok(links.has(route), `primary navigation must expose ${route}`);
  }
});

test("portal pillars express one learning-build-intelligence product model", () => {
  assert.deepEqual(
    PORTAL_PILLARS.map((pillar) => pillar.id),
    ["learn", "build", "intelligence"],
  );
  assert.equal(new Set(PORTAL_PILLARS.map((pillar) => pillar.href)).size, 3);
});

test("contextual sidebars keep content domains focused", () => {
  const newsLinks = collectSidebarLinks(CONTEXTUAL_SIDEBAR["/news/"]);
  const notionLinks = collectSidebarLinks(CONTEXTUAL_SIDEBAR["/notion/"]);
  const interviewLinks = collectSidebarLinks(CONTEXTUAL_SIDEBAR["/interview/"]);

  for (const links of [newsLinks, notionLinks, interviewLinks]) {
    assert.ok(links.includes("/news/"));
    assert.ok(links.includes("/notion/"));
    assert.ok(links.includes("/interview/"));
    assert.equal(
      links.some((link) => link.startsWith("/lessons/")),
      false,
      "content sidebars must not carry the full course tree",
    );
  }
});

test("knowledge graph routes keep the public guide connected", () => {
  const links = collectSidebarLinks(CONTEXTUAL_SIDEBAR["/knowledge-graph/"]);
  assert.ok(links.includes("/docs/knowledge-graph"));
  assert.ok(links.includes("/knowledge-graph/"));
});

test("chapter-driven domains keep their full catalogs", () => {
  const ragLinks = collectSidebarLinks(CONTEXTUAL_SIDEBAR["/rag-advanced/"]);
  const langGraphLinks = collectSidebarLinks(CONTEXTUAL_SIDEBAR["/langgraph-advanced/"]);
  const capstoneLinks = collectSidebarLinks(CONTEXTUAL_SIDEBAR["/capstone/"]);

  assert.equal(ragLinks.filter((link) => link.startsWith("/rag-advanced/")).length, 11);
  assert.equal(
    langGraphLinks.filter((link) => link.startsWith("/langgraph-advanced/")).length,
    5,
  );
  assert.equal(capstoneLinks.filter((link) => link.startsWith("/capstone/")).length, 28);
});
