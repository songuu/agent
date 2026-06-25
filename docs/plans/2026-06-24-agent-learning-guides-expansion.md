---
title: "Agent 学习指南与分类扩充"
type: sprint
status: completed
created: "2026-06-24"
updated: "2026-06-24"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, education, agent, guides, curriculum]
aliases: ["agent learning guides expansion"]
goal: "继续扩充整个项目，增加更多 agent 相关学习指南、分类和详细分解，并发布成功"
goal_max_iter: 3
goal_until: ""
goal_iteration: 0
goal_status: met

invariants:
  - "课程站仍由 VitePress 构建，新增内容必须能被侧边栏或导航访问"
  - "agent-basics 是第 01-03 章到第 04 章之间的概念补强层，不重排主课编号"
  - "发布使用 scripts/deploy.ps1，成功标准包含生产站公开 HTTPS 验证"

invariant_tests:
  - "pnpm typecheck"
  - "pnpm run site:build"

deferred:
  - sprint: next
    item: "为 B1-B12 每篇补一个免 API key 微型练习"
    deadline: "2026-07-15"
    reason: "本轮先完成指南分类和详细拆解，练习接线需另做代码/测试设计"

deadcode_until: []
---

# Sprint: Agent 学习指南与分类扩充

## Phase 1: 需求分析

### Scope

- 扩充整个课程项目中 agent 相关学习指南。
- 为基础概念补强层增加更多分类和详细拆解。
- 让新增内容可从 README、curriculum、navigation、VitePress sidebar 进入。
- 构建验证并发布到生产站。

### Non-scope

- 不改现有课程 demo 运行逻辑。
- 不改 Supabase / Notion / 新闻采集数据流。
- 不引入新外部依赖。

### Success

- [x] 新增 Agent 学习指南与分类地图。
- [x] `agent-basics` 从候选地图扩成 12 篇详细指南。
- [x] 顶层 README、课程大纲、导航、VitePress sidebar 均可进入新增内容。
- [x] 本地 typecheck / build 通过。
- [x] 生产发布成功并公开验证。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| VitePress | 课程站由 `.vitepress/config.mts` sidebar/nav 暴露入口 | 新增 sidebar 条目和 nav 条目 |
| agent-basics | 作为第 01-03 章之后的概念补强层 | 保持 B 编号，不插入主课 CHAPTERS |
| 发布 | 生产发布使用 `scripts/deploy.ps1` | 收尾执行脚本和公开 URL 验证 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| B1-B12 指南页 | 用户点击 sidebar 或 agent-basics 索引 | VitePress markdown route | git 文件 | 是 |
| Agent 学习指南 | 用户点击 README/navigation/nav | VitePress docs route | git 文件 | 是 |
| 发布 | 执行 `scripts/deploy.ps1` | build -> tar/scp/ssh swap | 远端 web root | 是 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| agent-basics 候选地图 | B1-B12 只是候选，缺少逐篇内容 | 本 sprint 已落地 12 篇指南 | 2026-06-24 |
| 本 sprint | 每篇指南缺少可运行微练习 | 明确推迟到下一 sprint | 2026-07-15 |

### 任务拆解

| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 梳理现有课程结构和发布路径 | L1 | README/curriculum/navigation/deploy runbook 已读取 |
| 2 | 新增全局 Agent 学习指南 | L1 | `docs/agent-learning-guides.md` |
| 3 | 新增 B1-B12 详细指南并接入索引 | L2 | `agent-basics/*.md` + `agent-basics/README.md` |
| 4 | 更新站点入口并验证构建 | L2 | `.vitepress/config.mts` + `pnpm typecheck` / `site:build` |
| 5 | 发布生产并复盘 | L2 | `scripts/deploy.ps1` + 公开 URL 验证 |

## Phase 3: 变更日志

### Task 1 - 结构和发布路径

- 已读取 `README.md`、`docs/curriculum.md`、`docs/navigation.md`、`.vitepress/config.mts`。
- 已确认生产发布入口为 `scripts/deploy.ps1`，生产站为 `https://songuu.top/agent-build/`。

### Task 2 - 全局 Agent 学习指南

- 新增 `docs/agent-learning-guides.md`。
- 按学习阶段、agent 类型、工程能力、角色路线、选型决策拆分项目入口。

### Task 3 - B1-B12 详细指南

- 新增 12 篇 `agent-basics` 指南。
- `agent-basics/README.md` 从候选地图更新为可点击目录 + 扩章地图 + 后续扩充建议。

### Task 4 - 站点入口

- `.vitepress/config.mts` sidebar 展开 B1-B12。
- README、curriculum、navigation 增加 Agent 学习指南入口。

### Task 5 - 发布

- 执行 `pwsh scripts/deploy.ps1 -Provider aliyun`。
- 远端备份：`/opt/agent-build/current/.vitepress/dist.bak.20260624160032`。
- 远端文件数：378。

## Phase 4: 审查结果

### 多视角审查

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | 通过 | 新增内容保持在 docs / agent-basics / VitePress nav 层，不改课程运行代码。 |
| 教学质量 | 通过 | B1-B12 每篇都有目标、边界、工程拆解、误区或练习、自检句。 |
| 集成连续性 | 通过 | README、curriculum、navigation、sidebar 均有入口；`agent-basics` 不重排主课编号。 |
| 测试覆盖 | 通过 | typecheck、VitePress build、发布脚本自带门禁均通过。 |
| 发布 | 通过 | 远端 loopback 关键路径 200，公网 HEAD 覆盖首页和新增页面 200。 |

### Findings

- P0: 无。
- P1: 无。
- P2: 内容级公网拉取验证命令被审批层拒绝，未绕过；已保留 HEAD 200 与远端 loopback 验证作为发布证据。

### 验证记录

- `pnpm typecheck` -> pass。
- `pnpm run site:build` sandbox -> fail: esbuild `spawn EPERM`。
- `pnpm run site:build` escalated -> pass，build complete in 38.34s。
- dist 页面存在：
  - `.vitepress/dist/docs/agent-learning-guides.html` -> True。
  - `.vitepress/dist/agent-basics/01-llm-as-predictor.html` -> True。
  - `.vitepress/dist/agent-basics/12-framework-runtime-map.html` -> True。
- `pwsh scripts/deploy.ps1 -Provider aliyun` -> pass。
  - gates: `pnpm typecheck`、`visuals.test.mts`、`generate.test.mts`、`diagram-zoom.test.mts`、`reduced-motion.test.mts` -> pass。
  - remote loopback: `/agent-build/`、`/lessons/04-the-agent-loop/`、`/lessons/07-short-term-memory/`、`/rag-advanced/02-hybrid-search/` -> 200。
  - `loop_scene=1`。
- public HEAD:
  - `https://songuu.top/agent-build/` -> 200。
  - `https://songuu.top/agent-build/docs/agent-learning-guides` -> 200。
  - `https://songuu.top/agent-build/agent-basics/01-llm-as-predictor` -> 200。
  - `https://songuu.top/agent-build/agent-basics/12-framework-runtime-map` -> 200。

## Phase 5: 复利记录

### 经验沉淀

1. **基础概念层适合先做指南，再做代码练习**
   B1-B12 的主要价值是统一语言和边界；免 API key 微练习可以作为下一轮增量，避免本轮把文档扩展和代码练习混在一起。

2. **分类地图能降低课程入口成本**
   初学者按顺序学，工程师按 agent 类型倒推补课，两种路径需要同一个内容池但不同导航视角。

3. **发布成功要同时看远端和公网**
   deploy 脚本的 remote loopback 证明 Nginx 本机路径可用，公网 HEAD 证明外部域名可达；两者都要保留。

### Goal loop

Goal loop: iter 0/3, until=n/a, goal-met=yes, decision=stop:met
