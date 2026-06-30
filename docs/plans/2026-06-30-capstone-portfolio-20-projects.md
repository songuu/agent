---
title: "新增 20 个实践型毕业项目"
type: sprint
status: completed
created: "2026-06-30"
updated: "2026-06-30"
checkpoints: 0
tasks_total: 6
tasks_completed: 6
tags: [sprint, capstone, portfolio, docs]
goal: "继续新增 20 个毕业项目，必须完整和全面"
goal_status: completed
invariants:
  - "capstone 新增项目必须能从 README/docs/navigation/docs/curriculum/docs/agent-learning-guides 发现"
  - "knowledge-graph/data/graph.ts 是毕业项目发现入口，新增项目必须进入 CHAPTERS"
  - "生成产物由 pnpm kg 维护，不手改 KG 标记区"
invariant_tests:
  - "pnpm capstone:catalog:smoke"
  - "pnpm kg"
  - "pnpm typecheck"
---

# 新增 20 个实践型毕业项目

## Phase 1: Think

### 目标

继续扩充毕业项目区，一次新增 20 个完整、全面、实践性质强的 Agent 项目。项目必须不是空标题，而是能作为作品集选题使用，并接入课程入口、知识图谱和验证脚本。

### Scope

- 新增 `capstone/<slug>/README.md`，覆盖协作、法务、数据、HR、售前、医疗运营、安全、合规、研发效率、质量、客户成功、电商、教育、招聘、科研、供应链、现场服务、隐私合规等场景。
- 新增 `capstone/project-catalog.mjs` 作为 20 个项目的数据源。
- 新增 `scripts/generate-capstone-readmes.mjs` 生成 README 和 `capstone/README.md` 总览。
- 新增 `scripts/verify-capstone-catalog.mjs` 做 catalog smoke。
- 更新 `package.json`、`README.md`、`index.md`、`docs/navigation.md`、`docs/curriculum.md`、`docs/agent-learning-guides.md`、`knowledge-graph/data/graph.ts`。
- 通过 `pnpm kg` 生成知识图谱和 README 注入区。

### Non-scope

- 不接真实 SaaS/API。
- 不写远端数据，不部署。
- 不把每个项目都实现成完整 TypeScript 应用；本轮交付是作品集级 capstone 蓝图 + 可验证目录/索引/图谱闭环。

### 风险

测试等级：L2 标准。

原因：大批量新增文档和索引，涉及知识图谱生成、课程入口和 package 脚本；不触碰生产数据、认证、支付或远端写入。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| Capstone 发现 | capstone 新增不能只改目录，必须接导航和 KG | 新增 README/hub/docs/graph/package smoke |
| 知识图谱 | `knowledge-graph/data/graph.ts` 是 source of truth | 新增 portfolio 常量并重跑 `pnpm kg` |
| 生成产物 | KG 标记区不手改 | 只编辑数据源，README 注入交给生成器 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 20 个项目 | 打开 `capstone/README.md` 或单项目 README | catalog -> generator | 文件系统 | ✅ |
| 导航入口 | 打开 docs/navigation / curriculum / README | 文档链接 | markdown | ✅ |
| 知识图谱 | 执行 `pnpm kg` | graph.ts -> generator | docs/knowledge-graph + README KG 区 | ✅ |
| 验证 | 执行 `pnpm capstone:catalog:smoke` | verifier | exit code | ✅ |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 2026-06-25 practical capstone | 更多实践型毕业项目需要继续扩容 | 本 sprint 新增 20 个并补 discovery/smoke | 2026-06-30 |

### 任务拆解

- [x] Task 1: 盘点既有 capstone、导航、课程大纲、知识图谱结构。
- [x] Task 2: 建立 project catalog、README 生成器、catalog smoke。
- [x] Task 3: 生成 20 个完整项目 README 和 capstone 总览。
- [x] Task 4: 更新 README、首页、导航、课程大纲、学习指南、package 脚本。
- [x] Task 5: 更新 knowledge-graph 数据并运行知识图谱生成器。
- [x] Task 6: 跑 smoke/typecheck，审查 diff，完成复利记录。

## Phase 3: Work Log

- 新增 catalog 数据源，包含 20 个项目的场景、用户、流程、模块、fixture、护栏、里程碑、测试、扩展、简历话术和面试追问。
- 新增 README 生成器并生成 20 个项目目录。
- 新增 catalog smoke，验证 20 个项目数量、README 结构、入口文档、knowledge graph 数据和 package 脚本。
- 更新课程入口文档，使新增项目从首页、README、导航、课程大纲和学习指南可发现。

## Phase 4: Review

### 审查结果

- P0: 无。
- P1: 无。
- 集成连续性：20 个新增项目均从 `capstone/README.md`、`README.md`、`docs/navigation.md`、`docs/curriculum.md`、`docs/agent-learning-guides.md` 和 `knowledge-graph/data/graph.ts` 可发现。
- 测试覆盖：L2 标准，使用 catalog smoke + KG 生成 + TypeScript typecheck + 既有 capstone smoke 入口覆盖主要风险。

### 验证记录

- `node scripts\verify-capstone-catalog.mjs`: 通过，20 projects。
- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts`: 通过，65 单元 / 329 概念 / 457 关系 / 168 文章。
- `node node_modules\typescript\bin\tsc --noEmit`: 通过。
- `node node_modules\tsx\dist\cli.mjs capstone\support-copilot\src\smoke.ts`: 通过。
- `node node_modules\tsx\dist\cli.mjs capstone\code-review-crew\src\smoke.ts`: 通过。
- `node node_modules\tsx\dist\cli.mjs capstone\agent-eval-harness\src\smoke.ts`: 通过。
- `node node_modules\tsx\dist\cli.mjs capstone\incident-responder\src\smoke.ts`: 通过。
- `node node_modules\tsx\dist\cli.mjs capstone\feedback-intelligence\src\smoke.ts`: 通过。
- `node node_modules\tsx\dist\cli.mjs capstone\sales-lead-researcher\src\smoke.ts`: 通过。
- `git diff --check`: 通过，仅有 Git LF/CRLF 警告。

### 已知环境边界

- `pnpm kg` 和 `pnpm typecheck` 在当前 Codex sandbox 下先被 `EPERM unlink _tmp_*` / registry 检查拦截；提升权限后又被 `ERR_PNPM_IGNORED_BUILDS` build-policy 阻断。
- 已使用本地 `node_modules` 入口直接运行同等生成器和 TypeScript 编译器；这是本轮源码验证的有效信号。

## Phase 5: Compound

### 复利记录

- 模式：批量 capstone 扩展用 `project-catalog.mjs` 做数据源，再由生成器产出 README，最后用 catalog smoke 守住数量、结构、入口和图谱挂载。
- 经验：知识图谱不要给每个新项目都加同一个跨章 eval 边，否则会污染第 15 章注入区；新项目内部图谱足够表达结构，跨章关系要克制。
- 后续：如果需要把 20 个蓝图继续升级为可运行 TS 项目，可按 catalog 逐个补 `src/cli.ts`、`src/smoke.ts`，再把脚本加入 `capstone:smoke`。

Goal loop: iter 1/1, until=n/a, goal-met=yes, decision=stop:目标已完成并通过验证

