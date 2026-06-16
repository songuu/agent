import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availableDates,
  groupByDate,
  pickDefaultDate,
  filterByDate,
  yearMonthOf,
  shiftMonth,
  buildCalendarMonth,
  toDateStr,
  type DatedArticle,
} from "./frontier-date-filter.ts";

const sample: DatedArticle[] = [
  { collectedDate: "2026-06-16" },
  { collectedDate: "2026-06-16T09:00:00+08:00" }, // 带时间，应归一到 2026-06-16
  { collectedDate: "2026-05-20" },
  { collectedDate: "2026-07-01" },
];

test("availableDates 去重 + 降序（最新在前）", () => {
  assert.deepEqual(availableDates(sample), ["2026-07-01", "2026-06-16", "2026-05-20"]);
});

test("groupByDate 按日期分桶，带时间串归一", () => {
  const groups = groupByDate(sample);
  assert.equal(groups.get("2026-06-16")?.length, 2);
  assert.equal(groups.get("2026-05-20")?.length, 1);
  assert.equal(groups.size, 3);
});

test("pickDefaultDate 取最近有内容日；空数组为 null", () => {
  assert.equal(pickDefaultDate(sample), "2026-07-01");
  assert.equal(pickDefaultDate([]), null);
});

test("filterByDate：指定日期只留当天；null 留全部", () => {
  assert.equal(filterByDate(sample, "2026-06-16").length, 2);
  assert.equal(filterByDate(sample, "2026-01-01").length, 0);
  assert.equal(filterByDate(sample, null).length, 4);
});

test("yearMonthOf 解析；非法为 null", () => {
  assert.deepEqual(yearMonthOf("2026-06-16"), { year: 2026, month: 6 });
  assert.equal(yearMonthOf(null), null);
  assert.equal(yearMonthOf("bad"), null);
});

test("shiftMonth 跨年", () => {
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
  assert.deepEqual(shiftMonth(2026, 6, 0), { year: 2026, month: 6 });
});

test("buildCalendarMonth：6×7 网格、周一起始、跨月补格、内容标注", () => {
  const grid = buildCalendarMonth(2026, 6, new Set(["2026-06-16"]));
  assert.equal(grid.length, 6);
  assert.ok(grid.every((row) => row.length === 7));

  // 2026-06-01 是周一 → 第一格就是 6-01，无前导补格。
  const firstCell = grid[0]![0]!;
  assert.equal(firstCell.date, "2026-06-01");
  assert.equal(firstCell.inMonth, true);
  assert.equal(firstCell.day, 1);

  // 有内容日命中
  const flat = grid.flat();
  const june16 = flat.find((c) => c.date === "2026-06-16")!;
  assert.equal(june16.hasContent, true);
  assert.equal(june16.inMonth, true);

  // 非当月补格存在且 inMonth=false（6 月末尾会带 7 月初的格）
  assert.ok(flat.some((c) => !c.inMonth));
  // 补格不应被误标有内容
  const julyCell = flat.find((c) => c.date === "2026-07-01");
  if (julyCell) assert.equal(julyCell.hasContent, false);
});

test("buildCalendarMonth：前导补格场景（2026-07 一号是周三）", () => {
  // 2026-07-01 周三 → 周一起始前应有 2 格补格（周一/周二来自 6 月）。
  const grid = buildCalendarMonth(2026, 7, new Set());
  assert.equal(grid[0]![0]!.date, "2026-06-29"); // 周一
  assert.equal(grid[0]![0]!.inMonth, false);
  assert.equal(grid[0]![2]!.date, "2026-07-01"); // 周三才是当月 1 号
  assert.equal(grid[0]![2]!.inMonth, true);
});

test("toDateStr 零填充", () => {
  assert.equal(toDateStr(2026, 6, 1), "2026-06-01");
  assert.equal(toDateStr(2026, 12, 31), "2026-12-31");
});
