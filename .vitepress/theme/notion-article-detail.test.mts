import assert from "node:assert/strict";
import test from "node:test";
import {
  notionArticleHref,
  notionArticleReturnPathFromSearch,
  notionArticleSlugFromSearch,
} from "./notion-article-detail";

test("notionArticleSlugFromSearch extracts and trims slug", () => {
  assert.equal(notionArticleSlugFromSearch("?slug=%20agent-memory%20"), "agent-memory");
  assert.equal(notionArticleSlugFromSearch("?foo=bar"), null);
});

test("notionArticleHref preserves list return path", () => {
  assert.equal(
    notionArticleHref("agent-memory", "/notion/?tag=AI%20Agent&date=all&q=memory"),
    "/notion/article?slug=agent-memory&from=%2Fnotion%2F%3Ftag%3DAI%2520Agent%26date%3Dall%26q%3Dmemory",
  );
});

test("notionArticleReturnPathFromSearch rejects unsafe return paths", () => {
  assert.equal(notionArticleReturnPathFromSearch("?slug=a&from=%2Fnotion%2F%3Ftag%3DAgent"), "/notion/?tag=Agent");
  assert.equal(notionArticleReturnPathFromSearch("?slug=a&from=https%3A%2F%2Fevil.test"), "/notion/");
});
