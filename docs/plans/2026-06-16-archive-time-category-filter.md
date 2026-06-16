---
title: "前沿与生态 + 求职指南：归档筛选优化（日历日期 / 分类）"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
mode: "--auto + caveman"
tasks_total: 5
tasks_completed: 5
tags: [sprint, frontend, vitepress, filter, archive]
aliases: ["归档筛选", "前沿日历筛选", "面试题分类筛选"]

invariants:
  - "No-Vue：交互一律 vanilla TS 主题渲染器 + 挂载 div，不引入 Vue SFC"
  - "纯逻辑（日历构造/日期过滤/分类过滤）抽成可离线测的纯函数，配 .test.mts（node:test，npx tsx --test）"
  - "数据 SoT 不改：前沿走 supabase frontier_ecosystem_articles（已含 collected_date）；面试题走 knowledge-graph/data/interview-questions.ts（26 题，已含 category/relatedChapters）"
  - "不编造文章/面试题真实历史日期——无依据的时间数据不补"
  - "custom.css 新增位移/透明度动画必须同步进 prefers-reduced-motion 关停列表（减动镜像守门测试）"
  - "VitePress base 保持 /agent-build/"

invariant_tests:
  - "npx tsx --test .vitepress/theme/frontier-date-filter.test.mts"
  - "npx tsx --test .vitepress/theme/interview-clinic-filter.test.mts"
  - "npx tsx --test .vitepress/theme/reduced-motion.test.mts（既有减动守门）"
  - "npx tsc --noEmit"
  - "pnpm site:build"
---

# 归档筛选优化（前沿日历 + 面试题分类）

## Phase 1: 需求分析
- Scope：① 前沿与生态加日历日期选择器（同参考图）按 collectedDate 筛；② 求职指南面试题清单抽成可筛渲染器（分类+章节，数据源 interview-questions.ts）。
- Non-scope：不补造历史日期；不改 supabase schema / graph.ts SoT；不推远端。
- Success：两组件可用 + 纯逻辑离线测全绿 + tsc 0 + site:build 通过 + 减动守门过。
- 现状基线：`.vitepress/theme/frontier-article-archive.ts`（432 行，体系层 tab + 日期头 + 详情，supabase fetch）；career-guide.md 第四节是静态手写题；`interview-questions.ts` 26 题结构化（category principle/engineering/project + relatedChapters，collectedDate 同为 2026-06-16）。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承
| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| 前沿管线 | graph.ts SoT，frontier 派生不手填；supabase 已含 collected_date | 只读 collected_date 做筛，不改 schema/SoT |
| 面试题管线 | interview-questions.ts 为 SoT，显式 slug 不按下标派生 | 渲染器只读该数据，不改母本 |
| 主题交互 | No-Vue，vanilla TS 渲染器 + 挂载 div | 新渲染器沿用同模式 |
| 减动镜像 | 加动画必同步 reduced-motion 关停 | 新 CSS 动画进关停列表，跑守门测试 |

### 入场扫描 - 集成路径
| 改动点 | 触发 | 中间层 | 持久化 | 刷新可见 |
|--------|------|--------|--------|----------|
| 前沿日历筛选 | 点年/月/日 | frontier-date-filter 纯函数 + 渲染器状态 | ❌ 纯前端筛选（数据仍 supabase） | ✅ 当次会话筛选 |
| 面试题分类筛选 | 点分类/章节 tab | interview-clinic-filter 纯函数 + 渲染器 | ❌ 纯前端筛选（数据=本地 TS bundle） | ✅ 当次会话筛选 |

两条链路均为「读现成数据 → 纯前端筛选渲染」，无持久化诉求，无 ❌ 需收口。

### 入场扫描 - 债务清单
| 来源 | 议题 | 本 sprint 决策 |
|------|------|----------------|
| 前序 supabase sprint | 弱 DB 密码对齐平台值（仅存 .env） | 明确推迟（运维项，与本前端 sprint 无关）|
| interview-questions.ts 注释 | 「未来课程页 UI」共享该数据 | 本 sprint 落地（即此 UI）|
| 时间维度 | 面试题无真实历史日期 | 明确不做时间轴，改分类+章节筛（诚实）|

### 任务表
| Task | 内容 | 风险 |
|------|------|------|
| T1 | `.vitepress/theme/frontier-date-filter.ts` 纯函数（availableDates / groupByDate / buildCalendarMonth(year,month,有内容集) / filterByDate / pickDefaultDate）+ `frontier-date-filter.test.mts` 离线断言 | L2 |
| T2 | 集成日历到 frontier-article-archive.ts：年/月导航 + 日格(空日置灰) + 日期状态，与体系层 tab 复合；默认选最近有内容日 | L3 |
| T3 | `interview-clinic-filter.ts` 纯函数（按 category/chapter 过滤 + 计数）+ `.test.mts`；`interview-clinic.ts` 渲染器（读 interview-questions.ts，分类 tab + 章节下拉）；career-guide.md 挂 `<div data-interview-clinic>` + theme/index 注册 | L2 |
| T4 | custom.css 两组件样式（日历网格/分类 tab）+ 移动端 + 新动画进 reduced-motion 关停列表 | L2 |
| T5 | 终检：2 离线测 + 减动守门 + tsc + site:build 全绿 | L1 |

验证策略：纯逻辑离线 `.test.mts`（node:test）守日历/筛选正确性；tsc 守类型；site:build 守渲染器编译打包；减动守门测试守动画镜像。前沿 UI 依赖浏览器 supabase fetch，无法纯离线 E2E——**不宣称像素级/视觉 1:1**，只保证逻辑正确 + 构建通过。

## Phase 3: 变更日志
- T1 ✅ `.vitepress/theme/frontier-date-filter.ts` 纯函数（availableDates/groupByDate/pickDefaultDate/filterByDate/yearMonthOf/shiftMonth/buildCalendarMonth/toDateStr）+ `.test.mts` 9 断言（周一起始/跨月补格/内容标注/跨年）全绿。
- T2 ✅ frontier-article-archive.ts 集成日历：年月导航 + 6×7 日格（空日置灰 disabled、有内容日高亮可点带圆点、选中蓝底）+ 「全部日期」档；与体系层 tab 复合（date→layer 二级筛）；默认选最近有内容日；空筛选有占位提示。tsc 0。
- T3 ✅ `interview-clinic-filter.ts` 纯函数（filterQuestions/categoryCounts/availableChapters）+ `.test.mts` 6 断言全绿；`interview-clinic.ts` 渲染器（分类 tab + 章节下拉，读 interview-questions.ts 26 题）；career-guide.md 第四节挂 `<div data-interview-clinic>` + 保留静态清单作同源底稿/无 JS 兜底；theme/index 注册。
- T4 ✅ custom.css 两组件样式（日历网格/分类 tab/徽章）+ 移动端断点；只用 transition + 静态 transform，不引 animation 关键帧 → 不触发减动守门。
- T5 ✅ 终检：15 离线断言 + 减动守门 + tsc 0 + `pnpm site:build` 33.86s 通过；dist 核验挂载点/CSS/渲染器 JS 均入包。

## Phase 4: 审查结果（6 视角）
P0: 无。P1: 无。
- 架构：纯逻辑（日期/筛选）抽模块与渲染解耦；No-Vue vanilla TS + 挂载 div 沿用既有模式；数据 SoT 未改（supabase frontier 表 / interview-questions.ts）。
- 安全：无 secret；前沿仍用既有 anon-key supabase fetch（未改）；面试题走本地 bundle 无网络；纯展示无注入面。
- 性能：纯前端筛选 O(n)，n=124/26 极小；日历固定 6×7；无重排隐患。
- 代码质量：显式类型、纯函数、无 dead code（新 export 均被 import）、无 console；CSS 仅 transition/静态 transform。
- 测试覆盖：15 离线断言覆盖日历边界（周一起始/跨月补格/内容标注/跨年）+ 筛选复合/计数/章节排序；减动守门 + tsc + site:build 全绿。前沿 UI 依赖浏览器 supabase fetch，无法纯离线 E2E → **未宣称像素级/视觉 1:1**（诚实）。
- 第6视角（集成连续性）：仅新增 4 文件 + 1 import 行（theme/index）+ 1 挂载 div（career-guide）+ CSS 追加；**未碰 graph.ts/supabase/config.mts**（避开并行会话碰撞）；前沿日历对既有 layer tab 行为保持兼容（selectedDate=null 等价旧"全部"）；interview-questions.ts 母本未动。无破坏既有 invariant。
- P2（记入不展开）：当前前沿数据全同一天（2026-06-16）→ 日历大部分置灰、仅 6-16 可点（默认选中），随后续按不同日补文章自然丰富；面试题无时间轴（数据所限，诚实改用分类+章节）。

## Phase 5: 复利记录
- 新增 1 条本能 [[no-vue-interactive-testable-split]]：No-Vue 交互组件把纯逻辑（日历构造/日期数学/筛选）抽模块配 node:test `.test.mts` 离线测，DOM/网络腿靠 tsc + site:build 守；筛选轴必须匹配真实数据维度（无真实日期就不做时间轴，改分类+章节，不编造）。
- 沿用既有本能：[[teaching-demo-deterministic-payoff]]（确定腿 vs 波动腿的分离思想延伸到前端）、[[kg-data-driven-doc-generation]]（interview-questions.ts 单源驱动 UI）。
- 无新 solution doc（无非平凡 bug）。
- status → completed。

> ⚠️ 提交边界（强制人工 gate，待用户 go）：working tree 仍可能混并行会话改动；提交须仅挑本 sprint 文件 —— `.vitepress/theme/{frontier-date-filter,frontier-date-filter.test,interview-clinic,interview-clinic-filter,interview-clinic-filter.test}.{ts,mts}`、改动的 `frontier-article-archive.ts`/`index.ts`/`custom.css`、`docs/career-guide.md`、本 sprint 文档 + 可选 `.vitepress/dist`（构建产物，按仓库惯例决定是否提交）。勿卷入他人改动。
