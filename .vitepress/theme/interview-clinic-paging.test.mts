import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPageIndex,
  nearestPagedIndex,
  nextPagedIndex,
} from "./interview-clinic-paging.ts";

test("clampPageIndex：把索引限制在有效范围内", () => {
  assert.equal(clampPageIndex(-3, 4), 0);
  assert.equal(clampPageIndex(99, 4), 3);
  assert.equal(clampPageIndex(1, 4), 1);
});

test("nextPagedIndex：滚轮向下/向上各翻一页", () => {
  assert.equal(nextPagedIndex(0, 120, 5), 1);
  assert.equal(nextPagedIndex(2, -120, 5), 1);
  assert.equal(nextPagedIndex(4, 120, 5), 4);
  assert.equal(nextPagedIndex(0, -120, 5), 0);
});

test("nearestPagedIndex：按当前 scrollTop 对齐最近一页", () => {
  const tops = [0, 320, 640, 960];
  assert.equal(nearestPagedIndex(12, tops), 0);
  assert.equal(nearestPagedIndex(402, tops), 1);
  assert.equal(nearestPagedIndex(799, tops), 2);
  assert.equal(nearestPagedIndex(1100, tops), 3);
});
