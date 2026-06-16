/**
 * 前沿文章「按日期筛选」的纯逻辑（无 DOM、无网络，可离线单测）。
 *
 * WHY 抽纯函数：日历构造 + 日期过滤是这次最容易出边界 bug 的部分（跨月补格、周一起始、
 * 空日置灰）。把它和渲染器解耦，用 .test.mts 离线把边界钉死，渲染器只管把结果画出来。
 * 渲染器靠浏览器 fetch supabase，无法纯离线跑，但**逻辑这条腿可以确定可回归**。
 */

/** 操作所需的最小结构（任何带 collectedDate 的文章都适用）。 */
export interface DatedArticle {
  /** 形如 "2026-06-16" 的收录日期。 */
  collectedDate: string;
}

/** 日历里的一个格子。 */
export interface CalendarCell {
  /** 该格代表的日期（YYYY-MM-DD）。 */
  date: string;
  /** 当月第几天（1-31）。 */
  day: number;
  /** 是否属于当前展示的月份（false = 上/下月补格，置灰）。 */
  inMonth: boolean;
  /** 该日是否有文章（用于高亮/可点）。 */
  hasContent: boolean;
}

/** 年月对。 */
export interface YearMonth {
  year: number;
  /** 1-12。 */
  month: number;
}

/** 把 y/m/d 拼成零填充的 YYYY-MM-DD。 */
export function toDateStr(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** 取 collectedDate 的日期部分（容忍带时间的串）。 */
function dateKey(value: string): string {
  return value.slice(0, 10);
}

/** 去重并按降序（最新在前）排列的有内容日期。 */
export function availableDates(articles: readonly DatedArticle[]): string[] {
  const set = new Set<string>();
  for (const article of articles) {
    if (article.collectedDate) set.add(dateKey(article.collectedDate));
  }
  return [...set].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/** 按日期分组（key 为 YYYY-MM-DD）。 */
export function groupByDate<T extends DatedArticle>(articles: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const article of articles) {
    const key = dateKey(article.collectedDate);
    const bucket = map.get(key);
    if (bucket) bucket.push(article);
    else map.set(key, [article]);
  }
  return map;
}

/** 默认选中的日期 = 最近一个有内容的日期；无文章则 null。 */
export function pickDefaultDate(articles: readonly DatedArticle[]): string | null {
  return availableDates(articles)[0] ?? null;
}

/** 只保留指定日期的文章；date 为 null 时返回全部（用于"全部日期"档）。 */
export function filterByDate<T extends DatedArticle>(articles: readonly T[], date: string | null): T[] {
  if (date === null) return [...articles];
  return articles.filter((article) => dateKey(article.collectedDate) === date);
}

/** 从某 YYYY-MM-DD 解析出 YearMonth；非法则 null。 */
export function yearMonthOf(date: string | null): YearMonth | null {
  if (!date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** 月份前后移动（自动跨年）。delta 可正可负。 */
export function shiftMonth(year: number, month: number, delta: number): YearMonth {
  // 用 0-based 月做模运算再还原，天然处理跨年。
  const zeroBased = (month - 1) + delta;
  const nextYear = year + Math.floor(zeroBased / 12);
  const nextMonth = ((zeroBased % 12) + 12) % 12 + 1;
  return { year: nextYear, month: nextMonth };
}

/**
 * 构造某年某月的日历网格：6 行 × 7 列，**周一起始**（表头 一二三四五六日）。
 * 含上/下月补格（inMonth=false，渲染时置灰），每格标注是否有内容。
 */
export function buildCalendarMonth(
  year: number,
  month: number,
  contentDates: ReadonlySet<string>,
): CalendarCell[][] {
  // 当月 1 号是星期几（0=周日..6=周六）→ 转成周一起始的前导空格数。
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (firstWeekday + 6) % 7; // 周一=0

  const weeks: CalendarCell[][] = [];
  // 从「当月 1 号往前 leading 天」开始，连排 42 格。
  for (let week = 0; week < 6; week++) {
    const row: CalendarCell[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const offset = week * 7 + weekday - leading; // 0 => 当月 1 号
      // Date.UTC 会把越界的 day 归一化进相邻月份。
      const cellDate = new Date(Date.UTC(year, month - 1, 1 + offset));
      const cy = cellDate.getUTCFullYear();
      const cm = cellDate.getUTCMonth() + 1;
      const cd = cellDate.getUTCDate();
      const date = toDateStr(cy, cm, cd);
      row.push({
        date,
        day: cd,
        inMonth: cm === month && cy === year,
        hasContent: contentDates.has(date),
      });
    }
    weeks.push(row);
  }
  return weeks;
}
