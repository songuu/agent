---
title: "前沿文章独立第 20 章"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-17"
tasks_total: 4
tasks_completed: 4
tags: [sprint, course, frontier, articles, ui]
aliases: ["frontier news chapter", "第20章文章归档"]
invariants:
  - "frontier articles SoT remains knowledge-graph/data/graph.ts -> FRONTIER_ARTICLES"
  - "frontend only reads public Supabase anon config; service_role never enters client bundle"
  - "VitePress base remains /agent-build/"
invariant_tests:
  - "pnpm typecheck"
  - "node node_modules/tsx/dist/cli.mjs .vitepress/theme/frontier-date-filter.test.mts"
  - "node node_modules/tsx/dist/cli.mjs knowledge-graph/data/visuals.test.mts"
  - "node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.test.mts"
---

# 前沿文章独立第 20 章

## Phase 1: Think

Scope:

- 第七部分新增 `20 Agent 前沿文章库`，专门承载 AI 前沿文章列表、日期筛选与文章详情。
- 第 19 章保留生态拆解教学内容，不再内嵌文章归档 UI。
- 文章归档视觉参考 `https://ai.codefather.cn/news`：资讯列表、日期入口、详情阅读、暗色卡片、可扫描布局。
- Supabase 表仍使用 `frontier_ecosystem_articles`，但前沿文章归档数据归属 `chapter_id=20`。

Non-scope:

- 不新增真实文章来源数量。
- 不改 Supabase schema。
- 不引入 Vue/React 组件；沿用 VitePress theme vanilla DOM。

Success:

- 侧边栏第七部分显示 19 与 20。
- `/lessons/20-agent-frontier-news/` 有独立文章库页面，含列表、日期、详情。
- `/lessons/19-agent-ecosystem-and-frontier/` 不再包含归档组件。
- 生成、类型与相关测试通过。

Risks:

- 迁移 `chapter_id` 会要求重新生成并推送 Supabase seed，否则线上 20 页读不到数据。
- 现有未跟踪 `docs/plans/2026-06-16-glossary-supabase-pipeline.md` 非本 sprint 产物，不能误改。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| frontier articles | `graph.ts` 是唯一编辑点，`frontier-articles.ts` 派生 | 新增 20 后由派生层读 `chapter_id=20`，不手填文章 JSON |
| Supabase client | 页面只读 anon config，service_role 不进 bundle | 只改 `FRONTIER_CHAPTER_ID` 和 UI，不新增服务密钥引用 |
| VitePress deploy | base 固定 `/agent-build/` | 不碰 deploy/base 配置 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 第 20 章入口 | 用户点击侧栏/导航 | VitePress sidebar -> markdown page | 静态页面 | yes |
| 文章数据 | 页面加载 | Supabase PostgREST anon read | `frontier_ecosystem_articles` | yes |
| 日期/分类筛选 | 用户点击 tab/calendar | theme DOM state | 前端内存 | yes, rerender |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| frontier article UI | 文章归档嵌在第 19 章过重 | 本 sprint 拆为第 20 章 | 2026-06-16 |

### Tasks

| Task | 内容 | 风险 |
|------|------|------|
| T1 | 新增第 20 章与 CHAPTERS/sidebar/curriculum/navigation 接线 | L2 |
| T2 | 从第 19 章移除文章归档，迁移到第 20 章 | L2 |
| T3 | 优化文章归档 UI 为资讯页：列表、日期、详情、参考站风格 | L3 |
| T4 | 生成 seed/knowledge graph，跑测试与 review | L2 |

## Phase 3: Work

### Change Log

- T1 completed: `knowledge-graph/data/graph.ts` 新增第 20 章 `20-agent-frontier-news`，并同步 `README.md`、`index.md`、`docs/navigation.md`、`docs/curriculum.md` 的 19-20 章路径。
- T2 completed: 第 19 章移除 `<div data-frontier-articles>` 归档组件，保留生态拆解教学内容，并增加跳转到第 20 章文章库的入口。
- T3 completed: `.vitepress/theme/frontier-article-archive.ts` 改为独立资讯页布局，包含概览、体系层筛选、日期日历、文章列表和右侧详情卡；`.vitepress/theme/custom.css` 增加对应响应式样式。
- T4 completed: `frontier_ecosystem_articles` 派生数据迁移为站点章节 `chapter_id=20`，生成 Supabase seed、知识图谱和第 20 章知识图谱块。

### Files Changed

- `lessons/20-agent-frontier-news/README.md`
- `lessons/19-agent-ecosystem-and-frontier/README.md`
- `.vitepress/theme/frontier-article-archive.ts`
- `.vitepress/theme/custom.css`
- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/visuals.ts`
- `README.md`
- `index.md`
- `docs/navigation.md`
- `docs/curriculum.md`
- `docs/knowledge-graph.md`
- `knowledge-graph/output/index.html`
- `supabase/README.md`
- `supabase/seed/frontier_ecosystem_articles.sql`

### Validation

| 命令 | 结果 | 说明 |
|------|------|------|
| `node node_modules\tsx\dist\cli.mjs scripts\generate-frontier-ecosystem-supabase-seed.ts` | pass | 生成 70 条第 20 章文章 seed |
| `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts` | pass | 40 单元 / 242 概念 / 387 关系 / 124 文章 |
| `pnpm typecheck` | pass | TypeScript 类型检查通过 |
| `node node_modules\tsx\dist\cli.mjs .vitepress\theme\frontier-date-filter.test.mts` | pass | 9 个日期筛选用例通过 |
| `node node_modules\tsx\dist\cli.mjs knowledge-graph\data\visuals.test.mts` | pass | 视觉引用测试通过 |
| `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.test.mts` | pass | 图谱生成测试通过 |
| `pnpm site:build` | sandbox fail | Windows sandbox 下 esbuild `spawn EPERM` |
| `wsl bash -lc 'cmd.exe /c "cd /d C:\project\my\agent-build && pnpm.cmd site:build"'` | pass | VitePress build complete in 75.06s |

### Static Artifact Checks

- `.vitepress\dist\lessons\20-agent-frontier-news\index.html` exists.
- 第 20 章产物包含 `Agent 前沿文章库`、`data-frontier-articles`、`知识图谱与延伸阅读`。
- 主题 bundle 包含 `chapter_id=eq.20` 与 `frontier-news-layout`。
- 第 19 章产物不再包含 `data-frontier-articles` 或 `前沿文章归档`。

## Phase 4: Review

- P0/P1 findings: none.
- Architecture: 第 20 章为文章库承载页，文章事实源仍由 `graph.ts` 派生，避免复制 70 篇资料清单。
- Security: 客户端仍只使用公开 anon 配置读取 Supabase PostgREST；未引入 service_role 或新密钥。
- Integration: 侧栏、课程总览、教学大纲、知识图谱、Supabase seed 均指向 `chapter_id=20`。
- Test coverage: L3 UI/数据接线通过类型检查、日期筛选测试、图谱测试、站点构建与静态产物 grep。
- Workspace note: 工作区已有 Glossary/术语表相关改动与未跟踪文件，本 sprint 未回滚、未清理、未作为第 20 章交付声明。

## Phase 5: Compound

- 经验：文章列表型内容从教学章拆出时，必须同时迁移章节 ID、数据派生层、seed、导航与静态产物校验，否则页面可能构建成功但线上无数据。
- 本能信号：VitePress 在当前 Windows sandbox 中可能因 esbuild `spawn EPERM` 失败；可用 WSL 调 Windows `pnpm.cmd site:build` 作为受限环境下的构建验证 workaround。
- 后续：若要线上发布，需要按部署脚本把新 `.vitepress/dist` 发布，并把 `supabase/seed/frontier_ecosystem_articles.sql` 推到目标 Supabase/AIDAP 数据库。
