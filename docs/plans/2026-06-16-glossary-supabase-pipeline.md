---
title: "术语表下沉 Supabase + 可筛/可搜渲染器（glossary_terms）"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
mode: "--auto + caveman"
tasks_total: 6
tasks_completed: 6
tags: [sprint, supabase, glossary, vitepress, filter]
aliases: ["术语表建表", "glossary 下沉", "glossary_terms"]

invariants:
  - "单一事实源：术语结构化母本是 knowledge-graph/data/glossary.ts；docs/glossary.md 为同源人读底稿 + 无 JS 兜底"
  - "supabase 只做并行镜像管道（migration + seed 生成器 + push 脚本），不需活连接即可交付可审计 SQL（沿用 README L39 既定模式）"
  - "渲染器读构建期 bundle（GLOSSARY_TERMS），零运行时网络（精确镜像 interview-clinic，而非 frontier live fetch）"
  - "No-Vue：交互一律 vanilla TS 主题渲染器 + 挂载 div，不引入 Vue SFC"
  - "纯逻辑（主题/搜索过滤）抽成可离线测纯函数，配 .test.mts（node:test，npx tsx --test）"
  - "slug 唯一、稳定、人类可读、与数组下标无关（upsert on-conflict 目标，沿用 interview/frontier 教训）"
  - "custom.css 只用 transition/静态 transform，不引 animation 关键帧（避开减动镜像守门）"
  - "VitePress base 保持 /agent-build/；不碰 config.mts（glossary.md 已在 nav）"

invariant_tests:
  - "npx tsx --test .vitepress/theme/glossary-filter.test.mts"
  - "npx tsx --test .vitepress/theme/interview-clinic-filter.test.mts（既有，回归）"
  - "npx tsx --test .vitepress/theme/reduced-motion.test.mts（既有减动守门）"
  - "npx tsc --noEmit"
  - "pnpm site:build"
  - "pnpm supabase:glossary-seed（生成器跑通，产出可审计 SQL）"
---

# 术语表下沉 Supabase + 可筛/可搜渲染器

## Phase 1: 需求分析
- Scope：把 docs/glossary.md（8 主题 ~51 术语，纯手写 md）抽成结构化 TS SoT `knowledge-graph/data/glossary.ts`；建 `glossary_terms` supabase 表（migration + seed 生成器 + push 脚本，可审计 SQL，不需活连接）；新增可筛（按 8 主题）+ 可搜（中/英全文）的 No-Vue 渲染器，挂进 glossary.md。
- Non-scope：不做 live supabase fetch（小数据 + 重离线确定性 → 读 bundle）；不改 config.mts/graph.ts；不推远端（连接已坏 + DDL 是强制人工 gate）；不补造术语（只结构化既有 51 条）。
- Success：glossary.ts 结构化 51 词全绿 + 纯逻辑离线测全绿 + tsc 0 + site:build 通过 + seed 生成器产出 SQL + 减动守门过 + 渲染器挂载入包。
- 现状基线：glossary.md 242 行，8 主题分节，每词「**粗体标题** + 1–3 句定义」，节首有「→ 见 lessons/xx」。已在 nav（config.mts:183）。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承
| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| supabase 管道 | SoT 在 TS，supabase 生成可审计 SQL 不隐式写远端（README L39） | glossary 走同一三件套，不需活连接 |
| interview 镜像 | slug 唯一稳定、question_id 不设 unique、RLS public read、tsvector(simple) | glossary 表逐列镜像 |
| 主题交互 | No-Vue，vanilla TS 渲染器 + 挂载 div，读 bundle 零网络 | glossary-explorer 沿用 interview-clinic 模式 |
| 可测性 | 纯逻辑抽模块配 .test.mts 离线测 | glossary-filter 纯函数 + 离线断言 |
| 减动镜像 | 加动画必同步 reduced-motion 关停 | 只用 transition/静态 transform，不触发 |

### 入场扫描 - 集成路径
| 改动点 | 触发 | 中间层 | 持久化 | 刷新可见 |
|--------|------|--------|--------|----------|
| 术语主题筛 + 搜索 | 点主题 tab / 输入搜索 | glossary-filter 纯函数 + 渲染器状态 | ❌ 纯前端（数据=bundle TS） | ✅ 当次会话筛选 |
| glossary_terms 表 | 运维跑 seed/push | 生成器读 glossary.ts → SQL | ✅ 可审计 SQL（远端写延后，连接坏） | n/a（镜像管道，站点不读它） |

链路均为「读现成数据 → 纯前端渲染」或「TS SoT → 可审计 SQL」，无 ❌ 需本 sprint 收口（远端 push 显式延后，待用户在 AIDAP 控制台恢复密码）。

### 入场扫描 - 债务清单
| 来源 | 议题 | 本 sprint 决策 |
|------|------|----------------|
| 前序 supabase sprint | DB 密码丢失需平台级重置 | 明确推迟（运维项，本 sprint 交付不依赖活连接） |
| glossary.md 尾注 | 「术语表随项目长大」 | 本 sprint 落地结构化 SoT，后续增词只改 glossary.ts |
| 「还有哪些值得建表」分析 | qa_logs/feedback/progress | 明确推迟（需产品意图 + 写入态 RLS，本 sprint 只做 glossary 强候选） |

### 任务表
| Task | 内容 | 风险 |
|------|------|------|
| T1 | `knowledge-graph/data/glossary.ts`：8 主题 + 51 术语结构化 SoT（slug/term/topic/definition/relatedChapters/aliases），map 派生 id/topicLabel/sortOrder/tags + slug 唯一性自检 | L2 |
| T2 | `.vitepress/theme/glossary-filter.ts` 纯函数（filterTerms 按主题+搜索 / topicCounts / matchesQuery / TOPICS）+ `.test.mts` 离线断言 | L2 |
| T3 | `.vitepress/theme/glossary-explorer.ts` 渲染器（主题 tab + 搜索框，读 GLOSSARY_TERMS）；glossary.md 挂 `<div data-glossary>`；theme/index 注册 | L2 |
| T4 | supabase 三件套：`migrations/..._create_glossary_terms.sql`（镜像 interview）+ `scripts/generate-glossary-supabase-seed.ts` + `scripts/push-glossary-to-supabase.ts`；package.json 加 supabase:glossary-seed/push | L2 |
| T5 | custom.css glossary 样式（主题 tab/搜索框/词条卡/移动端，仅 transition/静态 transform）+ supabase/README 加 glossary 段 | L2 |
| T6 | 终检：glossary-filter 离线测 + 既有减动守门 + interview 回归 + tsc + site:build + seed 生成器，全绿；dist 核验挂载点/CSS/渲染器入包 | L1 |

验证策略：纯逻辑离线 `.test.mts` 守主题/搜索过滤正确性；tsc 守类型；site:build 守渲染器编译打包；seed 生成器 exit 0 守 SQL 可生成；减动守门守动画镜像。渲染器读 bundle 无网络 → 可完整离线验证（比 frontier 更强）。不宣称像素级/视觉 1:1。

## Phase 3: 变更日志
- T1 ✅ `knowledge-graph/data/glossary.ts`：8 主题 + 51 术语结构化 SoT（逐字转写 glossary.md 定义，不新增/改写），map 派生 id(gl-NN)/topicLabel/sortOrder/tags，slug 唯一性运行时自检；导出 GLOSSARY_TOPIC_ORDER/glossaryTopicLabel。刻意不 import graph.ts（解耦避并行碰撞）。
- T2 ✅ `.vitepress/theme/glossary-filter.ts` 纯函数（TOPIC_OPTIONS/normalizeQuery/matchesQuery/filterTerms/topicCounts）+ `.test.mts` 10 断言（主题筛/中英大小写搜索/复合/跨主题约束/计数守恒/归一/空词命中全部）全绿。
- T3 ✅ `.vitepress/theme/glossary-explorer.ts` 渲染器（搜索框 + 8 主题 tab，读 GLOSSARY_TERMS bundle 零网络，dl/dt/dd 词条卡 + 章节标签 + 空态）；glossary.md 目录后挂 `<div data-glossary>` + 引导语，保留全量静态分节作无 JS 兜底；theme/index 注册 import。
- T4 ✅ supabase 三件套：`migrations/20260616130000_create_glossary_terms.sql`（逐列镜像 interview：slug unique/term_id 不 unique/topic 8 值 check/tsvector(simple) over term+definition+aliases/4 索引/updated_at 触发器/RLS public read）+ `scripts/generate-glossary-supabase-seed.ts`（产出 51 行幂等 upsert SQL）+ `scripts/push-glossary-to-supabase.ts`（PostgREST，凭据走 env）；package.json 加 supabase:glossary-seed/glossary-push。
- T5 ✅ custom.css 加 .glossary-* 样式（搜索框/主题 tab/词条卡 dl-dt-dd/章节标签/空态/移动端断点），仅 transition + 静态样式，不引 animation 关键帧 → 不触发减动守门；supabase/README 加 Glossary terms 段（apply order + 51 行 + 镜像说明）。
- T6 ✅ 终检：glossary-filter 10 断言 + 减动守门 + interview 回归（合计 17 测）+ tsc 0 + `pnpm site:build` 20.87s + seed 生成器 51 行，全绿；dist 核验 data-glossary 挂载点入 glossary.html、渲染器 JS（搜索框/空态串）入 theme chunk、.glossary-* 入 style.css、术语定义额外进 VitePress 本地搜索索引。
- T7 ✅（追加，用户提供新强密码后）远端真落地：用户给出新 32 字符直连密码 → 写入 .env(gitignored，不回显) → 临时 `pnpm add pg`（建表后 `pnpm remove pg` 还原，不入 manifest）→ 直连建表 + 灌 51 行 + 幂等复跑核验。**修非平凡 bug**：`search_text` 生成列报 `generation expression is not immutable` —— 根因不是 `to_tsvector` 的 regconfig（interview 表证明 `to_tsvector('simple'::regconfig, …)` 可用），而是 **`array_to_string(aliases,' ')` 在 generated column 里非 immutable**（PG 严格判定）。修复：search_text 只覆盖 term+definition（与 interview 一致），aliases 保留为独立 text[] 列。远端核验：ROW_COUNT=51 / DISTINCT_TOPICS=8 / FULLTEXT 'rag' 命中 7 / RLS_ENABLED=true / 幂等复跑仍 51。临时脚本（C:/tmp + 项目根 _apply-glossary.cjs）跑后即删，凭据全程不回显。

## Phase 4: 审查结果（6 视角）
P0: 无。P1: 无。
- 架构：SoT-first（glossary.ts 单源），渲染读 bundle 零网络（精确镜像 interview-clinic，比 frontier live fetch 更稳/可完整离线验证）；supabase 仅可审计 SQL 镜像管道，不需活连接；No-Vue vanilla TS + 挂载 div 沿用；未碰 graph.ts/config.mts（避并行碰撞）。
- 安全：无 secret；push 脚本凭据 SUPABASE_URL/SERVICE_ROLE_KEY 走 env 不硬编码（沿用 interview push）；表 RLS 仅 public read（select using true），写入需 service_role；渲染零网络无注入面；DDL 不在本 sprint 落远端（强制人工 gate + 连接坏）。
- 性能：纯前端筛 O(n) n=51 极小；搜索 substring over term+definition+aliases 微不足道；build 20.87s 与基线持平。
- 代码质量：显式类型、纯函数、无 any、无 console、immutable map、slug 唯一自检抛错；CSS 仅 transition/静态样式。
- 测试覆盖：10 离线断言覆盖主题过滤/中英大小写搜索/主题+搜索复合/跨主题约束剔除/计数守恒/归一/空词命中全部；tsc + site:build + seed 生成器 + 减动守门全绿。渲染读 bundle 无网络 → 可完整离线验证（不依赖浏览器/活连接）。
- 第6视角（集成连续性）：新增 6 文件 + 1 import 行（theme/index）+ 1 挂载 div（glossary.md）+ CSS 追加 + 2 package script + 1 migration + README 段；interview-clinic-filter 回归测绿（未破坏既有 invariant）；无 dead code（glossary.ts 被渲染器/seed/push import；glossary-filter 被渲染器/测 import；渲染器被 index import）；docs/glossary.md 全量静态保留作同源兜底；数据 SoT 单源守住。push-glossary 脚本暂无活连接可实跑，但有 package script 入口 + 文档化 + 同 interview push（亦未实跑）同构，属 deferred-by-design 运维入口非 dead code。
- P2（记入不展开）：glossary.md 静态全量与 glossary.ts 现双份维护，未来增词需两边改。缓解：文件头注释 + README 已声明 SoT=glossary.ts、md 为兜底；可后续加「从 glossary.ts 幂等注入 md 片段」（类似 KG `<!-- KG:START/END -->`），本 sprint YAGNI 不做。远端 push 待用户在 AIDAP 控制台恢复 DB 密码后跑 supabase:glossary-push。

## Phase 5: 复利记录
- 复用并细化既有本能：[[no-vue-interactive-testable-split]]（术语表是第三个 No-Vue 渲染器，纯逻辑离线测 + 筛选轴匹配真实数据维度 topic）、[[kg-data-driven-doc-generation]]（glossary.ts 单源驱动渲染+SQL+本地搜索）、[[supabase-selfhosted-sync]]（DDL 走 SQL Editor、PostgREST 只 DML、凭据走 .env）。
- 新增 1 条本能 [[supabase-worthiness-audit-and-mirror]]：判断「什么值得进 supabase」的框架 + 镜像已验证三件套管道、渲染读 bundle 非 live-fetch、不需活连接即可交付可审计 SQL。
- 无新 solution doc（无非平凡 bug，纯模式复用）。
- status → completed。

> ⚠️ 提交边界（强制人工 gate，待用户 go）：提交须仅挑本 sprint 文件 —— `knowledge-graph/data/glossary.ts`、`.vitepress/theme/{glossary-explorer,glossary-filter,glossary-filter.test}.{ts,mts}`、改动的 `.vitepress/theme/index.ts`/`custom.css`、`docs/glossary.md`、`supabase/migrations/20260616130000_create_glossary_terms.sql`、`supabase/seed/glossary_terms.sql`、`scripts/{generate-glossary-supabase-seed,push-glossary-to-supabase}.ts`、`package.json`、`supabase/README.md`、本 sprint 文档。勿卷入并行会话改动。远端 push（supabase:glossary-push）= DDL/写远端 = 另一道强制人工 gate，待 DB 密码恢复。
