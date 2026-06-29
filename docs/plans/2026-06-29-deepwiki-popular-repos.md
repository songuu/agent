---
title: "DeepWiki 热门库直接解读"
type: sprint
status: completed
created: "2026-06-29"
updated: "2026-06-29"
checkpoints: 0
tasks_total: 6
tasks_completed: 6
tags: [sprint, source-analysis, deepwiki]
aliases: ["热门库直接解读", "DeepWiki popular repos"]
invariants:
  - "源码解析器必须继续支持任意公开 GitHub owner/repo 或 URL 输入"
  - "三套内置仓库在 GitHub 失败时仍回退到本地矩阵"
  - "源码问答只引用已读取 raw source，不编造源码位置"
invariant_tests:
  - "node node_modules/tsx/dist/cli.mjs .vitepress/theme/source-analysis-explorer.test.mts"
  - "node node_modules/tsx/dist/cli.mjs knowledge-graph/generate.test.mts"
---

# DeepWiki 热门库直接解读

## Phase 1: Think

### 需求分析

用户要求参照 `https://deepwiki.com/` 和截图，直接新增“热门库的直接解读”，采用相同形式。截图里的关键形态是：搜索框 + Add repo + 热门仓库卡片网格，点击仓库后进入源码理解路径。

### Scope

- 在现有 `source-analysis` 解析器顶部新增 DeepWiki-style 热门仓库卡片网格。
- 热门卡片点击后复用现有 GitHub repo tree 解析、仓库矩阵、Relevant Source Files、源码问答链路。
- 热门清单覆盖截图里的代表仓库，并补充课程相关的 LangGraph / LlamaIndex。
- 同步文档、导航、知识图谱和测试。

### Non-scope

- 不复制 DeepWiki 的后端 LLM 索引能力。
- 不克隆远端仓库到服务器。
- 不静态生成热门库的伪源码总结。

### 成功标准

- 页面出现“热门库直接解读”卡片网格，包含 Add repo 和热门仓库。
- 点击热门仓库能触发现有解析流程。
- 现有内置矩阵、任意仓库输入、源码问答不回归。
- 测试、typecheck、站点构建通过。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| source-analysis explorer | 任意 GitHub 输入仍是主入口 | 热门卡片只调用 `setRepository(slug)`，不绕过 `loadRepository` |
| source-analysis presets | GitHub 失败回退内置矩阵 | `loadRepository` / `presetForSlug` 保持不改 |
| source QA | 只引用 raw source 行窗口 | 问答模块未改，新增入口只改变仓库选择 |
| KG 生成 | 图谱内容由 `knowledge-graph/data/graph.ts` 驱动 | 只改数据源后重跑生成器 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 热门卡片 | 点击 repo card | `setRepository` -> GitHub API -> `analyzeRepositoryTree` | 静态源码 + 浏览器运行态 | ✅ 构建产物含入口 |
| Add repo | 点击 Add repo card | focus/select 搜索框 | 无 | ✅ UI 可见 |
| 文档导航 | 打开 21.0 | VitePress sidebar / docs links | 静态文档 | ✅ 构建产物含更新 |
| KG 概念 | 运行 KG 生成 | graph.ts -> markdown/html | 生成文件 | ✅ 构建产物含更新 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| deepwiki-source-qa | DeepWiki 首页式热门 repo 入口未实现 | 本 sprint 解决 | 2026-06-29 |

### 任务拆解

- [x] Task 1: 在 engine 中新增热门仓库清单与 lookup helper。
- [x] Task 2: 在 explorer 中渲染 Add repo + 热门仓库卡片网格。
- [x] Task 3: 增加卡片 CSS，保持桌面三列、移动端单列、8px radius。
- [x] Task 4: 增加测试覆盖热门清单、slug 规范化、lookup 大小写。
- [x] Task 5: 同步 README、导航、课程大纲、章节文档。
- [x] Task 6: 同步知识图谱数据源并重生成派生文件。

## Phase 3: Work

### 变更日志

- `.vitepress/theme/source-analysis-engine.ts`
  - 新增 `PopularRepository`、`POPULAR_SOURCE_REPOSITORIES`、`popularRepositoryForSlug`。
  - 热门列表覆盖 `microsoft/vscode`、`huggingface/transformers`、`microsoft/playwright`、`opendatalab/MinerU`、`karpathy/nanochat`、`langchain-ai/langchain`、`openai/openai-python` 等。
- `.vitepress/theme/source-analysis-explorer.ts`
  - 新增 `source-analysis-popular` 区块。
  - 卡片点击复用 `setRepository(slug)`，保持 GitHub live tree / preset fallback 行为。
- `.vitepress/theme/custom.css`
  - 新增热门仓库卡片网格、Add repo 卡片、active/hover、响应式样式。
- `.vitepress/theme/source-analysis-explorer.test.mts`
  - 新增热门清单覆盖、去重、规范化和 lookup 测试。
- `source-analysis/README.md`、`source-analysis/repository-matrix.md`、`README.md`、`docs/navigation.md`、`docs/curriculum.md`、`docs/agent-learning-guides.md`、`.vitepress/config.mts`
  - 将 21.0 更新为“热门仓库与源码问答”。
- `knowledge-graph/data/graph.ts`
  - 新增 `srca-popular-repositories` 概念与关系。
  - DeepWiki 参考说明加入“热门仓库入口”。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`source-analysis/README.md`
  - 由 KG 生成器更新。

## Phase 4: Review

### 五视角审查

| 视角 | 结论 |
|------|------|
| 架构 | 热门入口只作为选择层，不复制解析逻辑；解析仍由现有 `loadRepository` / `analyzeRepositoryTree` 承担。 |
| 安全 | UI 文本均走 `textContent`，无 HTML 注入；网络仍只请求公开 GitHub API/raw source。 |
| 性能 | 初始渲染只渲染静态卡片，不批量请求 GitHub；点击后才读取目标仓库。 |
| 代码质量 | 热门列表集中在 engine，UI 只消费结构化数据。 |
| 测试覆盖 | L2 前端交互/数据源变更，新增 engine 单测并保留既有问答测试。 |
| 集成连续性 | 21.0 导航、README、KG 全部同步；内置矩阵与源码问答未断链。 |

### 风险与边界

- 热门仓库 star 数来自 DeepWiki 截图式入口快照，仅用于卡片展示；真正解析以 GitHub live tree 为准。
- 非内置热门仓库的源码问答依赖 GitHub raw 文件可读取，受 GitHub 限流和仓库大小影响。

## Phase 5: Compound

### 经验沉淀

- DeepWiki-style 功能不要只做“结果页”；首页入口形态也是用户心智的一部分。
- 热门推荐应当是“选择层”，不要把推荐卡片和源码解析核心逻辑耦合。
- 对动态仓库工具，测试更适合锁定数据清单、slug 规范化、候选选择和 citation 行号，而不是依赖 live network。

### 验证记录

- `node node_modules\typescript\bin\tsc --noEmit` -> pass。
- `node node_modules\tsx\dist\cli.mjs .vitepress\theme\source-analysis-explorer.test.mts` -> pass，10/10。
- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.test.mts` -> pass。
- `node node_modules\tsx\dist\cli.mjs knowledge-graph\data\visuals.test.mts` -> pass。
- `node node_modules\tsx\dist\cli.mjs .vitepress\theme\diagram-zoom.test.mts` -> pass。
- `node node_modules\tsx\dist\cli.mjs .vitepress\theme\reduced-motion.test.mts` -> pass。
- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts` -> pass，45 单元 / 268 概念 / 415 关系 / 165 文章。
- `VITEPRESS_BASE=/agent-build/ DEMO_RUNNER_CLIENT_ENABLED=1 DEMO_RUNNER_BASE_URL=/agent-build/api/demo-runner node node_modules\vitepress\bin\vitepress.js build` -> pass，25.19s；仅 chunk size warning。

### 状态

完成。后续执行提交、推送、部署。