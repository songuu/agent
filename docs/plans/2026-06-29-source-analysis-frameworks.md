---
title: "LangChain/LangGraph/LlamaIndex 源码解析"
type: sprint
status: completed
created: "2026-06-29"
updated: "2026-06-29"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, docs, source-analysis]
goal: "新增 LangChain、LangGraph、LlamaIndex 的源码解析"
goal_max_iter: 3
goal_until: ""
goal_iteration: 0
goal_status: met
invariants:
  - "新增学习内容不重排 00-20 主课编号"
  - "源码路径必须指向官方 GitHub 主干或官方文档"
  - "导航、课程大纲、学习指南、README 至少有一个可点击入口"
invariant_tests:
  - "pnpm kg"
  - "pnpm site:build"
deferred: []
deadcode_until: []
---

# LangChain/LangGraph/LlamaIndex 源码解析

## Phase 1: 需求分析

Scope:

- 新增第 21 章 `source-analysis/`，作为正式章节承载源码解析。以前按专题处理，已根据反馈改为章节。
- 新增 LangChain、LangGraph、LlamaIndex 三篇源码解析。
- 每篇以官方 GitHub 源码路径为入口，并和本课程手写章节做对照。
- 接入 VitePress 侧边栏、全局导航、课程大纲、学习指南、README、知识图谱。

Non-scope:

- 不引入 Python 依赖，不跑外部框架源码测试。
- 不重写已有第 12 章或 `langgraph-advanced` L1-L5。
- 不修改现有未提交的 daily sync / LLM adapter 变更。

Success:

- `source-analysis/README.md`、`langchain.md`、`langgraph.md`、`llamaindex.md` 存在。
- 站点侧边栏和文档入口可发现。
- 知识图谱可生成。
- VitePress build 通过或失败原因可追溯。

Risks:

- 上游源码路径会变化，文档必须标注核对日期。
- `knowledge-graph/data/graph.ts` 当前已有未提交变更，补丁只追加本专题节点。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| 课程导航 | agent-basics 等扩章不重排主课编号 | 新建第 21 章 `source-analysis`，保留 00-20 原顺序 |
| 知识图谱 | 新增图谱章节需配套 visual/reference | 添加第 21 章 chapter、concept、relation、visual/highlights/articles |
| VitePress | README 路由要有 rewrite 或标准目录入口 | 增加 `source-analysis/README.md` rewrite 和 sidebar |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 源码解析页面 | 用户点击 sidebar/nav | VitePress markdown route | git 文件 | 是 |
| 知识图谱节点 | `pnpm kg` | graph.ts -> generated markdown/html | 生成文件 | 是 |
| 大纲/README 入口 | 用户阅读导航页 | markdown links | git 文件 | 是 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-24 agent-learning-guides | 扩展指南需可发现 | 本 sprint 接入导航/大纲/README | 2026-06-29 |

## Phase 3: Task 拆解

- [x] T1 新增源码解析正文。
- [x] T2 接入 VitePress sidebar 和 rewrite。
- [x] T3 更新 navigation/curriculum/agent-learning-guides/README。
- [x] T4 接入 knowledge graph 数据和 visual/reference。
- [x] T5 运行 `pnpm kg` 与 `pnpm site:build` 验证。

## Phase 4: Review

| 视角 | 结果 | 说明 |
|------|------|------|
| 架构 | 通过 | 新增为第 21 章 `source-analysis/`，不重排 00-20 原章节。 |
| 安全 | 通过 | 仅新增/更新静态文档和图谱数据，不引入运行时副作用或依赖。 |
| 性能 | 通过 | `site:build` 仅有既有 chunk size warning，无新增阻塞。 |
| 代码质量 | 通过 | `node node_modules\typescript\bin\tsc --noEmit` 通过。 |
| 测试覆盖 | 通过 | `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts` 和 VitePress build 通过。 |
| 集成连续性 | 通过 | sidebar、navigation、curriculum、agent-learning-guides、README、knowledge graph 均有入口；构建产物确认四个 source-analysis 页面存在。 |

## Phase 5: Compound

- 新增经验：源码解析类内容如果承载主线能力，应作为正式章节，而不是旁路专题。
- 验证记录：`pnpm kg` 在 sandbox/PNPM 层失败，改用脚本真实入口 `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts` 成功。
- 验证记录：`node node_modules\vitepress\bin\vitepress.js build` sandbox 下 `spawn EPERM`，提升权限后通过。
- 验证记录：`node node_modules\typescript\bin\tsc --noEmit` 通过。

Goal loop: iter 0/3, until=n/a, goal-met=yes, decision=stop:met
