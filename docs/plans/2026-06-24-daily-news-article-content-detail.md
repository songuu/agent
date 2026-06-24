---
title: "AI 资讯文章内容与详情展示优化"
type: sprint
status: completed
created: "2026-06-24"
updated: "2026-06-24"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, feature, ai-news]
aliases: ["daily-news-article-content-detail"]
invariants:
  - "前端只能用 Supabase anon key 只读 news_items，service_role 不进浏览器 bundle"
  - "news_items.published_date 仍是日历筛选口径"
  - "文章卡片必须保留可追溯原文入口，但默认交互不直接跳走"
invariant_tests:
  - "pnpm typecheck"
  - "node node_modules/tsx/dist/cli.mjs --test .vitepress/theme/daily-news-feed.test.mts news-collector/__tests__/normalize.test.mts"
deferred: []
deadcode_until: []
---

# AI 资讯文章内容与详情展示优化

## Phase 1: Think

### 范围

- 优化 `/news` 和第 20 章复用的 `data-daily-news` 文章卡片展示。
- 卡片正文显示可读摘要或正文截断，不再暴露 `Article URL / Comments URL / Points` 这类 RSS 元信息。
- 点击卡片进入站内详情渲染，详情显示文章内容摘要、来源、发布时间、体系层和标签。
- 新增明确的「打开原文」按钮，用于跳转外部原文。

### 非范围

- 不抓取或复制外部网站完整正文。
- 不改 Supabase 表结构。
- 不触碰 Notion 文章全文同步链路。

### 验收

- 列表卡片不再直接通过卡片点击跳转原文。
- HN 元信息摘要被清洗，列表和详情都展示可读内容。
- 详情面板内有独立原文按钮。
- 类型检查和相关单测通过，或明确记录环境性失败。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| AI 资讯前端 | anon 只读，service_role 不进浏览器 | 仅改 `.vitepress/theme/daily-news-feed.ts` 读取与渲染，不新增密钥 |
| 文章日历 | `published_date` 是筛选口径 | `buildNewsFilters` 不变，分页查询仍用 `published_date` |
| 外部资料可追溯 | 原文入口必须保留 | 卡片和详情都保留「打开原文」按钮 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 卡片摘要清洗 | 页面加载 Supabase rows | normalizeRow → readable summary | 无新持久化 | 是，运行时渲染 |
| 站内详情 | 点击文章卡片 | selectedItem → detail panel | 无新持久化 | 是，重新加载后默认选中当前页首篇 |
| 原文跳转 | 点击按钮 | anchor target blank | 无 | 是 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 当前需求 | 不复制全文正文 | 本 sprint 保持现有表结构，只展示 feed 摘要/清洗后的截断内容 | 2026-06-24 |

### 任务拆解

- [x] Task 1: `daily-news-feed.ts` 增加摘要清洗、可读摘要生成、详情段落生成。
- [x] Task 2: 卡片点击改为站内详情选择，新增详情面板与「打开原文」按钮。
- [x] Task 3: 补充 CSS，保证桌面双栏、移动端单栏、文本不溢出。
- [x] Task 4: 补回归测试并执行 L2 验证。

## Phase 3: Work

- `.vitepress/theme/daily-news-feed.ts`：新增 `cleanNewsSummary`、`buildReadableNewsSummary`、`buildNewsDetailParagraphs`，列表正文使用可读摘要，详情面板显示站内内容，卡片点击只切换详情。
- `.vitepress/theme/custom.css`：新增资讯详情双栏布局、sticky 详情卡片、移动端单栏样式和原文按钮样式。
- `news-collector/src/normalize.ts`：入库前清洗 feed 摘要里的 HN 元信息，减少后续新数据继续污染展示。
- 相关单测覆盖摘要清洗、元信息-only fallback、详情段落和 normalize 清洗。

## Phase 4: Review

- 安全：前端仍只读 `news_items`，没有引入 `service_role` 或新的浏览器端密钥。
- 行为：卡片默认交互从外跳改为站内详情选择，原文跳转收敛到明确的「打开原文」按钮。
- 数据：不复制外部完整正文，当前详情展示清洗后的 feed 摘要/标题 fallback/来源上下文。
- 风险：历史库里仍可能存在摘要质量不高的旧数据，运行时清洗已覆盖常见 HN 元信息。

## Phase 5: Compound

- 经验：文章列表如果复用 RSS/HN 摘要，展示层和采集层都需要清洗，避免旧数据和新数据的用户体验分裂。
- 经验：外部资料的默认点击不应隐式离站，站内详情和显式原文按钮更符合阅读流。
- 验证：`node node_modules\tsx\dist\cli.mjs --test .vitepress/theme/daily-news-feed.test.mts news-collector/__tests__/normalize.test.mts` 18/18 通过。
- 验证：`pnpm typecheck` 通过。
- 验证：`pnpm site:build` 通过；sandbox 下 esbuild 曾出现 `spawn EPERM`，非沙箱重跑成功。
