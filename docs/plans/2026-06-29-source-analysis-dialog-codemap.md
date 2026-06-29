---
title: "源码解析对话模式与 CodeMap"
type: sprint
status: completed
created: "2026-06-29"
updated: "2026-06-29"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, source-analysis, deepwiki, codemap]
aliases: ["源码对话", "CodeMap 源码地图"]
invariants:
  - "源码解析器必须继续支持任意公开 GitHub owner/repo 或 URL 输入"
  - "回答必须基于可读取 raw source，并提供 GitHub 行号引用；无源码时不能编造实现结论"
  - "CodeMap 节点必须回链到真实 GitHub 源码文件"
invariant_tests:
  - node node_modules/tsx/dist/cli.mjs .vitepress/theme/source-analysis-explorer.test.mts
  - node node_modules/typescript/bin/tsc --noEmit
---

# 源码解析对话模式与 CodeMap

## Phase 1: Think

用户要求在 `source-analysis` 中新增对话模式：支持连续提问，但回答必须基于源码；同时需要支持 CodeMap 模式。该能力应继续放在第 21 章源码解析内，沿 DeepWiki-style 入口、仓库矩阵、Relevant Source Files 和源码引用体验扩展，不另起孤立工具页。

### Scope

- 把旧一次性“源码问答”升级为“源码对话”：同一仓库内可连续提问，保留历史轮次。
- 对话回答必须调用源码检索结果，展示 GitHub 行号、源码片段和解释；读取不到源码时只报告缺证据或候选文件。
- 新增 CodeMap 模式：按职责层展示仓库区域、高信号文件、当前问题焦点和源码链接。
- 同步课程入口、导航、知识图谱和 README 文案。
- 补测试覆盖 CodeMap 与无源码拒答边界。

### Non-Scope

- 不引入服务器 clone、向量库、登录或 GitHub token。
- 不宣称等同 DeepWiki 的 LLM 索引结果。
- 不改三篇 LangChain/LangGraph/LlamaIndex 静态解析正文主线。

### Success Criteria

- 页面出现“源码对话与 CodeMap”双模式。
- 对话支持多轮提问，回答包含源码行号 citation 或明确缺源码证据。
- CodeMap 能按职责层显示文件，并随当前问题高亮候选文件。
- `source-analysis` 文档、导航、知识图谱同步新命名。
- 测试、类型检查、站点构建、公开部署验证通过。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| source-analysis explorer | 任意 GitHub 输入仍是主入口 | 保留 `loadRepository` / `normalizeRepositoryInput` / 热门卡片行为 |
| 源码问答 | raw source + GitHub line citation 是证据边界 | `answerSourceQuestion` 保持无源码 `needs-source`，UI 明示不编造 |
| 知识图谱 | KG 自动生成区不手改 | 修改 `knowledge-graph/data/graph.ts` 后跑生成器 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 源码对话 | 用户提交问题 | `selectQuestionFiles` -> raw source fetch -> `answerSourceQuestion` | 内存会话 | 刷新重置，符合静态站边界 |
| CodeMap | 用户切换 CodeMap | `buildRepositoryCodeMap` 基于当前 analysis / question | 无 | 重新分析仓库后可再生成 |
| 文档/KG | 构建站点 | markdown + KG generator | Git 文件 | 是 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| DeepWiki-style 源码问答 | 只有一次性问答，没有对话/CodeMap | 本 sprint 收口 | 2026-06-29 |

### Tasks

- [x] T1 引擎层新增 CodeMap 模型与 `buildRepositoryCodeMap`。
- [x] T2 UI 层新增“源码对话 / CodeMap”双模式。
- [x] T3 补样式与移动端布局。
- [x] T4 同步文档、导航和知识图谱。
- [x] T5 补测试、构建、部署验证。

## Phase 3: Work Log

- `.vitepress/theme/source-analysis-engine.ts` 新增 `RepositoryCodeMap*` 数据结构和 `buildRepositoryCodeMap()`，把 area、职责层、高信号文件、当前问题焦点映射成可点击源码地图。
- `.vitepress/theme/source-analysis-explorer.ts` 把旧一次性问答面板升级为“源码对话 / CodeMap”双模式；对话保留当前页面内多轮历史，CodeMap 随最后一个问题高亮候选源码文件。
- `.vitepress/theme/custom.css` 新增对话气泡、证据边界说明、CodeMap 卡片和移动端布局。
- `source-analysis/`、课程导航、README、知识图谱数据与派生文档同步“源码对话 + CodeMap”命名。
- `.vitepress/theme/source-analysis-explorer.test.mts` 补 CodeMap 问题聚焦和无源码拒答测试。

## Phase 4: Review

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | 通过 | 引擎仍是纯函数，DOM 层只负责 fetch/render；未引入服务器或新依赖。 |
| 安全 | 通过 | 对话只读取公开 GitHub raw source；无源码时 `needs-source`，不生成伪实现结论。 |
| 性能 | 通过 | 单轮最多读取 8 个候选文件，单文件截断到 160k 字符，沿用现有 cache。 |
| 代码质量 | 通过 | CodeMap、问答选择、引用生成均有测试覆盖；文档由 KG 生成器回写。 |
| 测试覆盖 | 通过 | source-analysis 测试 12/12，`tsc --noEmit` 通过，VitePress build 通过。 |
| 集成连续性 | 通过 | 热门卡片、任意 GitHub 输入、内置矩阵、KG 自动区、导航和构建产物均保留链路。 |

## Phase 5: Compound

### Validation

- `node node_modules/tsx/dist/cli.mjs .vitepress/theme/source-analysis-explorer.test.mts` -> pass，12/12。
- `node node_modules/typescript/bin/tsc --noEmit` -> pass。
- `node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.ts` -> pass，45 单元 / 269 概念 / 417 关系 / 165 文章。
- `VITEPRESS_BASE=/agent-build/ node node_modules/vitepress/bin/vitepress.js build` -> pass；仅保留既有 chunk size warning。
- `rg "/agent-build/assets" .vitepress/dist/source-analysis/repository-matrix.html` -> pass，生产 base 正确。
- `rg "源码对话与 CodeMap|CodeMap 源码地图|源码对话检索" .vitepress/dist ...` -> pass，新 UI 和 KG 文案进入构建产物。

### Learnings

- 对静态站源码问答，最重要边界是“有 raw source line citation 才回答；没有源码只给候选或失败原因”。
- CodeMap 不应伪装成真实调用图；当前实现定位为仓库矩阵 + 问题焦点的源码地图，所有节点回链 GitHub 文件。
- DeepWiki-like 体验需要同时有入口网格、对话证据和代码地图，单独的一次性问答不够完整。