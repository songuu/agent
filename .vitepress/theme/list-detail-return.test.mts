import assert from "node:assert/strict";
import test from "node:test";
import { positiveIntegerParam, safeReturnPathFromSearch, withReturnPath } from "./list-detail-return";

test("withReturnPath appends encoded same-site return path", () => {
  assert.equal(
    withReturnPath("/news/article?id=a", "/news/?page=3&pageSize=20"),
    "/news/article?id=a&from=%2Fnews%2F%3Fpage%3D3%26pageSize%3D20",
  );
});

test("withReturnPath ignores unsafe return path", () => {
  assert.equal(withReturnPath("/news/article?id=a", "https://evil.test/list"), "/news/article?id=a");
  assert.equal(withReturnPath("/news/article?id=a", "//evil.test/list"), "/news/article?id=a");
});

test("safeReturnPathFromSearch falls back for missing or unsafe path", () => {
  assert.equal(safeReturnPathFromSearch("?from=%2Fnews%2F%3Fpage%3D3", "/news/"), "/news/?page=3");
  assert.equal(safeReturnPathFromSearch("?from=https%3A%2F%2Fevil.test", "/news/"), "/news/");
  assert.equal(safeReturnPathFromSearch("", "/news/"), "/news/");
});

test("positiveIntegerParam accepts only positive integers", () => {
  assert.equal(positiveIntegerParam(new URLSearchParams("page=3"), "page", 1), 3);
  assert.equal(positiveIntegerParam(new URLSearchParams("page=0"), "page", 1), 1);
  assert.equal(positiveIntegerParam(new URLSearchParams("page=2.5"), "page", 1), 1);
});
