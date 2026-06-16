---
title: "前沿文章从 Supabase 读取"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, supabase, frontend, agent, ecosystem]
aliases: ["frontier articles supabase read"]

invariants:
  - "第 19 章文章仍以 knowledge-graph/data/graph.ts 为生成与同步事实源"
  - "页面主读取链路必须走 Supabase frontier_ecosystem_articles"
  - "前端只允许注入 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY,绝不注入 service_role"
  - "标题和来源必须可点击查看原文"

invariant_tests:
  - "pnpm typecheck"
  - "pnpm supabase:frontier-read"
---

# Sprint: 前沿文章从 Supabase 读取

## Phase 1: 需求分析

Scope:
- 第 19 章文章归档 UI 从 Supabase `frontier_ecosystem_articles` 读取。
- 保留 `graph.ts -> FRONTIER_ARTICLES -> Supabase` 作为写入与同步源。
- 增加只读 smoke，使用 anon key 模拟浏览器读表。

Non-scope:
- 不把 service_role key 打进前端 bundle。
- 不新增 Supabase JS SDK 依赖；直接用 PostgREST。
- 不改变文章 seed/upsert 事实源。

Success:
- [x] VitePress 构建期注入公开 Supabase config。
- [x] UI 从 PostgREST 拉取文章并按体系层渲染。
- [x] 只读脚本能从 Supabase 读到当前表数据。
- [x] 类型检查通过。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| frontier articles | `graph.ts` 是生成与同步事实源 | 前端只读 Supabase；写入仍走 push/seed 脚本 |
| Supabase | service_role 只用于服务端脚本 | 前端只注入 anon key |
| UI | 1:1 时间线形式 | 保持原 DOM/CSS 结构，只替换数据来源 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 页面读取 | 打开第 19 章 | VitePress theme -> PostgREST | Supabase | ✅ |
| 数据同步 | `pnpm supabase:frontier-push` | service role PostgREST upsert | Supabase | ✅ |

### 任务拆解

| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 拆出体系层常量，避免前端引入静态文章数据 | L2 | `frontier-ecosystem-layers.ts` |
| 2 | VitePress 注入公开 Supabase config | L2 | `.vitepress/config.mts` |
| 3 | archive UI 改为 Supabase-only 读取 | L2 | `.vitepress/theme/frontier-article-archive.ts` |
| 4 | 增加只读 smoke 和验证 | L1 | `scripts/read-frontier-ecosystem-from-supabase.ts` |

## Phase 3: 变更日志

- 新增 `knowledge-graph/data/frontier-ecosystem-layers.ts`，theme 只引入层定义，不再引入静态文章数组。
- `.vitepress/config.mts` 读取 `.env`，只把 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / schema 注入前端。
- `.vitepress/theme/frontier-article-archive.ts` 改为 PostgREST 读取 `frontier_ecosystem_articles`，保留体系筛选、详情卡和时间线。
- 新增 `pnpm supabase:frontier-read`，用 anon key 读表并输出分层计数。
- 第 19 章说明改为“页面直接从 Supabase 读取”。

## Phase 4: 审查结果

- P0: 无。
- P1: 无。
- P2: 客户端读取依赖公开 anon key 与 RLS public select；若 Supabase 不可达，页面会显示读取失败。

## Phase 5: 验证记录

- `node node_modules\\tsx\\dist\\cli.mjs --env-file=.env scripts/read-frontier-ecosystem-from-supabase.ts` -> pass，读到 70 行。
- `pnpm typecheck` -> pass。
- `.\\node_modules\\.bin\\tsc.cmd --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM .vitepress\\theme\\frontier-article-archive.ts knowledge-graph\\data\\frontier-ecosystem-layers.ts` -> pass。
- `node node_modules\\tsx\\dist\\cli.mjs knowledge-graph\\generate.ts` -> pass。
- `wsl -e /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -ExecutionPolicy Bypass -Command "Set-Location C:\\project\\my\\agent-build; pnpm site:build"` -> pass。
- `rg -n "service_role|SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY" .vitepress\\dist\\assets\\chunks\\theme.DaVuPOQp.js .vitepress\\dist\\assets\\lessons_19-agent-ecosystem-and-frontier_index.md.BBGz9EUE.js` -> pass，无匹配。
- `wsl -e /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -ExecutionPolicy Bypass -File C:\\project\\my\\agent-build\\scripts\\deploy.ps1` -> deploy 完成，远端原子换入成功；脚本内 loopback verify 因 SSH/bash 引号问题退出 1。
- `curl.exe -I https://songuu.top/agent-build/` -> 200。
- `curl.exe -I https://songuu.top/agent-build/lessons/19-agent-ecosystem-and-frontier/` -> 200。
- `Invoke-WebRequest https://songuu.top/agent-build/lessons/19-agent-ecosystem-and-frontier/` -> 页面包含 `frontier_ecosystem_articles`。
- `git diff --check` -> pass，仅 CRLF warning。
