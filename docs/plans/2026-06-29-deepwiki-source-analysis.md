---
title: "DeepWiki-style 源码分析"
type: sprint
status: completed
created: "2026-06-29"
updated: "2026-06-29"
tags: [sprint, source-analysis, deepwiki]
invariants:
  - "源码解析必须作为第 21 章的一部分，而不是旁路工具"
  - "静态站点不能依赖后端密钥；指定仓库解析只能使用公开 GitHub 元数据或内置规格"
invariant_tests:
  - node node_modules/typescript/bin/tsc --noEmit
  - node node_modules/tsx/dist/cli.mjs .vitepress/theme/source-analysis-explorer.test.mts
  - node node_modules/tsx/dist/cli.mjs knowledge-graph/data/visuals.test.mts
  - node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.test.mts
---

# DeepWiki-style 源码分析

## Phase 1: 需求分析

Scope:
- 参考 DeepWiki 的仓库入口、Wiki 目录、Relevant source files、架构矩阵形态。
- 在当前第 21 章「源码解析」内提供可交互的仓库解析器。
- 支持输入 GitHub 仓库 URL 或 `owner/repo`，生成仓库矩阵、目录包矩阵、关键文件矩阵、阅读路径。
- 内置 LangChain / LangGraph / LlamaIndex 深度规格，保证离线也能读。

Non-scope:
- 不做服务器端 clone、向量索引、LLM 自动总结。
- 不保存用户输入仓库，不使用 GitHub token。

Success:
- `source-analysis/` 入口能直接操作仓库解析器。
- `repository-matrix.md` 成为模块内正式页面。
- 测试覆盖 repo slug 解析、矩阵分类、fallback。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| source-analysis | 第 21 章承载源码解析 | 所有新增能力挂在 `source-analysis/` |
| VitePress theme | vanilla TS DOM client | 新增 `source-analysis-explorer.ts`，不引 Vue |
| 静态部署 | 无后端密钥进入 bundle | 只用公开 GitHub Contents API，失败走内置样例 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 仓库解析器 | 用户输入 repo 并点击解析 | theme client -> GitHub Contents API / 内置数据 | 无，本地状态 | 是，重新输入即可 |
| 仓库矩阵页 | 用户打开导航 | Markdown + theme client | git 文件 | 是 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-29 source-analysis | 只支持三篇静态解析 | 本 sprint 增加指定仓库解析器 | 2026-06-29 |

## Phase 3: 任务拆解

- [x] T1 建 DeepWiki-style repo analyzer 数据模型与纯函数。
- [x] T2 接入 VitePress vanilla DOM client。
- [x] T3 更新第 21 章 README / 新增仓库矩阵页 / 导航。
- [x] T4 补测试、跑图谱和构建验证。


## Phase 3: 变更日志

- 新增 `.vitepress/theme/source-analysis-engine.ts`：repo 输入归一、preset、动态 tree 分析、仓库矩阵、Relevant Source Files、阅读路径。
- 新增 `.vitepress/theme/source-analysis-explorer.ts`：VitePress vanilla DOM 挂载，支持 GitHub repo tree live fetch + 内置三仓库 fallback。
- 新增 `source-analysis/repository-matrix.md`，并把交互解析器直接嵌入 `source-analysis/README.md`。
- 同步 `.vitepress/config.mts`、`README.md`、`docs/navigation.md`、`docs/curriculum.md`、`docs/agent-learning-guides.md`。
- 更新 `knowledge-graph/data/graph.ts` 并重跑 `knowledge-graph/generate.ts`。

## Phase 4: 审查结果

| 视角 | 结果 | 证据 |
|------|------|------|
| 架构 | 通过 | 静态站点方案：浏览器 GitHub API + 内置 preset，无后端密钥。 |
| 安全 | 通过 | 不保存输入、不使用 token；外链均 target + noreferrer；HTML 由 DOM API textContent 渲染。 |
| 性能 | 通过 | 默认使用内置矩阵；live fetch 只在用户提交时触发。 |
| 测试 | 通过 | 新增 source-analysis-explorer.test 覆盖输入、preset、动态 tree、分类、GitHub URL。 |
| 集成连续性 | 通过 | 第 21 章入口、仓库矩阵页、sidebar、README、curriculum、navigation、knowledge graph 均接入。 |

## Phase 5: 复利记录

- 经验：静态课程站也能实现“指定仓库源码分析”的第一层能力，但应明确边界为 repo tree/matrix 定位，不冒充 LLM 索引结论。
- 经验：DeepWiki-like 体验的最小闭环是 repository input、matrix、relevant files、reading path、source links。
- Validation:
  - `node node_modules/tsx/dist/cli.mjs .vitepress/theme/source-analysis-explorer.test.mts` -> pass
  - `node node_modules/tsx/dist/cli.mjs knowledge-graph/data/visuals.test.mts` -> pass
  - `node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.test.mts` -> pass
  - `node node_modules/typescript/bin/tsc --noEmit` -> pass
  - `node node_modules/vitepress/bin/vitepress.js build` -> pass (chunk size warning only)
  - `curl.exe -I https://api.github.com/repos/langchain-ai/langgraph` -> 200
  - `curl.exe -I https://api.github.com/repos/langchain-ai/langgraph/git/trees/main?recursive=1` -> 200
