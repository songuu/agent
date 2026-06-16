---
title: "前沿文章 Supabase 归档与 UI 还原"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, supabase, frontend, agent, ecosystem]
aliases: ["frontier articles supabase ui", "前沿文章归档"]

invariants:
  - "第 19 章文章仍以 knowledge-graph/data/graph.ts 为唯一事实源"
  - "Supabase seed 由脚本从 FRONTIER_ARTICLES 生成,不手写重复数据"
  - "VitePress theme 保持 vanilla TypeScript + DOM,不新增 Vue 组件"
  - "文章标题和来源必须可点击查看原文"

invariant_tests:
  - "npx tsc --noEmit"
  - "node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.ts"

deferred: []
deadcode_until: []
---

# Sprint: 前沿文章 Supabase 归档与 UI 还原

## Phase 1: 需求分析

### Scope

- 将第 19 章“前沿与生态”收集到的 33 篇文章整理成可进入 Supabase 的完整表结构与 seed/upsert SQL。
- 在第 19 章页面新增文章归档 UI，按用户截图还原“详情卡 + 日期时间线列表”的视觉形式。
- 每条文章保留来源、原文 URL、摘要、类型、排序、标签、详情段落等字段。

### Non-scope

- 不伪造远端 Supabase 写入成功；仓库当前没有 Supabase 连接配置。
- 不复制原文全文，只保存课程侧可追溯摘要和原文链接。
- 不引入新的前端框架或 Supabase JS 依赖。

### Success

- [x] 新增 `public.frontier_ecosystem_articles` migration。
- [x] 新增 `supabase/seed/frontier_ecosystem_articles.sql`，包含 33 条 upsert。
- [x] 新增 `FRONTIER_ARTICLES` 数据模块，供 UI 和 seed 共享。
- [x] 第 19 章页面有截图风格的详情卡和时间线，标题/来源可打开原文。
- [x] 关键验证通过；站点 build 的沙盒限制被单独记录。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| knowledge graph | 文章数据从 `ARTICLES` 维护 | `FRONTIER_ARTICLES` 只派生第 19 章数据 |
| site theme | VitePress theme 使用 vanilla DOM | 新增 `.vitepress/theme/frontier-article-archive.ts` |
| Supabase | 不提交密钥 | 只提交 SQL migration/seed，不写远端凭据 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 文章数据 | 修改 `ARTICLES` 后跑 seed 脚本 | `FRONTIER_ARTICLES` | SQL seed | ✅ |
| Supabase 表 | 执行 migration + seed SQL | Postgres/RLS/index | Supabase | ✅ |
| 页面 UI | 打开第 19 章 | Markdown 占位 + theme DOM 渲染 | 静态站构建 | ✅ |

### 任务拆解

| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 抽取第 19 章文章派生数据 | L2 | `knowledge-graph/data/frontier-articles.ts` |
| 2 | 新建 Supabase migration 与 seed 生成器 | L2 | `supabase/migrations/*`、`scripts/generate-frontier-ecosystem-supabase-seed.ts` |
| 3 | 生成 33 条 seed/upsert SQL | L1 | `supabase/seed/frontier_ecosystem_articles.sql` |
| 4 | 按截图接入详情卡 + 时间线 UI | L2 | `.vitepress/theme/frontier-article-archive.ts`、CSS、README 占位 |
| 5 | 验证与审查 | L2 | typecheck、kg、demo、diff check、build 记录 |

## Phase 3: 变更日志

- 新增 `FRONTIER_ARTICLES`，字段覆盖 `slug/source/source_url/kind/summary/read_count/tags/detail_paragraphs/sort_order`。
- 新增 Supabase 表：唯一键、RLS public select、GIN tags/search index、更新时间 trigger。
- 新增 seed 生成脚本和 `package.json` 脚本 `supabase:frontier-seed`。
- 第 19 章新增“前沿文章归档”占位；theme 脚本渲染白底详情卡、元信息、详情段落、左侧虚线时间线、可点击原文标题。
- 修正 tag 推断的 `ui` 误命中，避免 `Building` 被标成 UI。

## Phase 4: 审查结果

- P0: 无。
- P1: 无。
- P2: 远端 Supabase 未实际写入。原因：仓库没有 Supabase 连接配置，且本轮没有用户提供项目凭据；已提供可审计 migration/seed SQL。
- P2: `pnpm site:build` 在沙盒内仍因 VitePress/esbuild `spawn EPERM` 失败；两次沙盒外验证申请超时。已补跑局部 DOM theme typecheck 和模块导入检查。

## Phase 5: 验证记录

- `node node_modules\\tsx\\dist\\cli.mjs scripts\\generate-frontier-ecosystem-supabase-seed.ts` → pass，写出 33 条。
- `node node_modules\\tsx\\dist\\cli.mjs -e "import { FRONTIER_ARTICLES } ..."` → pass，count=33。
- `node node_modules\\tsx\\dist\\cli.mjs lessons\\19-agent-ecosystem-and-frontier\\index.ts` → pass。
- `node node_modules\\tsx\\dist\\cli.mjs knowledge-graph\\generate.ts` → pass，README 注入幂等。
- `npx tsc --noEmit` → pass，仅 npm config warning。
- `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM .vitepress\\theme\\frontier-article-archive.ts knowledge-graph\\data\\frontier-articles.ts` → pass。
- `node node_modules\\tsx\\dist\\cli.mjs -e "import('./.vitepress/theme/frontier-article-archive.ts').then(...)"` → pass。
- `git diff --check` → pass，仅 CRLF warning。
- `pnpm site:build` → fail in sandbox: `spawn EPERM`; sandbox-out rerun approval timed out twice。
