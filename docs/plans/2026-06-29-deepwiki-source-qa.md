---
title: "DeepWiki-style 源码问答"
type: sprint
status: completed
created: "2026-06-29"
updated: "2026-06-29"
tags: [sprint, source-analysis, deepwiki, source-qa]
invariants:
  - "源码问答必须集成在第 21 章 source-analysis 模块"
  - "静态站点不能依赖后端密钥；问答只能使用公开 GitHub raw source 或本地测试 fixture"
  - "回答必须给源码位置和解释；不能伪造未检索到的源码证据"
invariant_tests:
  - node node_modules/typescript/bin/tsc --noEmit
  - node node_modules/tsx/dist/cli.mjs .vitepress/theme/source-analysis-explorer.test.mts
  - node node_modules/tsx/dist/cli.mjs knowledge-graph/data/visuals.test.mts
  - node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.test.mts
---

# DeepWiki-style 源码问答

## Phase 1: 需求分析

Scope:
- 参考 DeepWiki 的源码提问能力：用户输入问题，系统检索源码，回答中给源码位置和解释。
- 直接集成到现有 `source-analysis` 仓库矩阵解析器，不另起孤立页面。
- 支持公开 GitHub 仓库：从 Relevant Source Files / 矩阵首读文件中选择候选 raw source，返回 GitHub line-range 链接。
- 答案必须区分“已命中源码行”和“未命中，只能给候选文件”。

Non-scope:
- 不做服务器端 clone、embedding 向量库、LLM 总结、登录态 GitHub token。
- 不保存用户问题和源码内容。

Success:
- `source-analysis/` 和 `repository-matrix.md` 的交互组件出现源码问答面板。
- 问答结果包含 summary、文件路径、行号范围、源码片段、解释和 GitHub 行号链接。
- 测试覆盖候选文件选择、源码行引用、解释生成。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| source-analysis | 第 21 章承载源码解析 | 问答面板复用同一个 explorer mount |
| VitePress theme | vanilla TS DOM client | 新增 DOM 面板，不引入 Vue/后端 |
| 静态部署 | 无后端密钥进入 bundle | 只读取公开 GitHub raw source |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 源码问答 | 用户输入问题并提交 | selectQuestionFiles -> raw GitHub -> answerSourceQuestion | 内存 cache only | 刷新后重新检索 |
| 行号引用 | 用户点击 citation | GitHub blob #Lx-Ly | 无 | 是，外链可打开 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-29 DeepWiki-style 源码分析 | 只有矩阵，没有源码问答 | 本 sprint 补源码问答检索闭环 | 2026-06-29 |

## Phase 3: 任务拆解

- [x] T1 扩展源码分析引擎：候选文件选择、问题关键词扩展、源码行窗口检索、line citation。
- [x] T2 扩展 explorer UI：源码问答表单、raw source fetch、citation 渲染。
- [x] T3 更新文档、导航和知识图谱。
- [x] T4 跑测试、typecheck、build，并写 review/compound。

## Phase 3: 变更日志

- `.vitepress/theme/source-analysis-engine.ts` 新增源码问答模型：`selectQuestionFiles`、`answerSourceQuestion`、GitHub line URL、关键词扩展、源码行窗口检索和解释生成。
- `.vitepress/theme/source-analysis-explorer.ts` 新增“源码问答”面板：问题输入、候选文件选择、raw source fetch、内存 cache、citation 渲染。
- `.vitepress/theme/custom.css` 新增问答面板、citation list、源码片段和移动端样式。
- `source-analysis/README.md` / `source-analysis/repository-matrix.md` / 导航 / curriculum / README 同步“仓库矩阵与源码问答”定位。
- `knowledge-graph/data/graph.ts` 新增 `srca-source-qa` 概念并重生成图谱产物。

## Phase 4: 审查结果

| 视角 | 结果 | 证据 |
|------|------|------|
| 架构 | 通过 | 复用现有 source-analysis explorer；引擎纯函数可测试，DOM 层只负责 fetch/render。 |
| 安全 | 通过 | 不使用 token、不保存问题；用户/源码文本用 `textContent` 渲染；外链 `target=_blank rel=noreferrer`。 |
| 性能 | 通过 | 提交问题时才读取最多 8 个候选 raw 文件，内容截断到 160KB 并做内存 cache。 |
| 测试 | 通过 | source-analysis test 扩到 8 条，覆盖候选选择、line citation、解释和 URL anchor。 |
| 集成连续性 | 通过 | 第 21 章入口、repository-matrix、导航、curriculum、README、knowledge graph 均更新。 |

## Phase 5: 复利记录

- 经验：静态站也能实现 DeepWiki-like 源码问答的“可追溯低配版”：公开 raw source + 确定性行窗口检索 + GitHub line citation。
- 边界：这不是 LLM/embedding 索引；回答只能解释已检索源码命中，不能冒充完整语义理解。
- Validation:
  - `node node_modules/tsx/dist/cli.mjs .vitepress/theme/source-analysis-explorer.test.mts` -> pass, 8/8
  - `node node_modules/typescript/bin/tsc --noEmit` -> pass
  - `node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.ts` -> pass, 45 units / 267 concepts / 414 relations
  - `node node_modules/tsx/dist/cli.mjs knowledge-graph/data/visuals.test.mts` -> pass
  - `node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.test.mts` -> pass
  - `node node_modules/tsx/dist/cli.mjs .vitepress/theme/diagram-zoom.test.mts` -> pass
  - `node node_modules/tsx/dist/cli.mjs .vitepress/theme/reduced-motion.test.mts` -> pass
  - `node node_modules/vitepress/bin/vitepress.js build` -> pass (chunk size warning only)
  - `curl.exe -I https://raw.githubusercontent.com/langchain-ai/langgraph/main/libs/prebuilt/langgraph/prebuilt/tool_node.py` -> 200, `Access-Control-Allow-Origin: *`