---
title: "全课程动图与流程图覆盖门禁"
type: sprint
status: completed
created: "2026-06-10"
updated: "2026-06-10"
tasks_total: 5
tasks_completed: 5
tags: [sprint, auto, website, curriculum, visual-explainer, coverage]
---

# 全课程动图与流程图覆盖门禁

## Phase 1: 需求分析

原始需求：

> `$sprint --auto` 需要检测所有的课程，必须要有动图和流程图。

Scope：

- 以 `knowledge-graph/data/graph.ts` 的 `CHAPTERS` 作为所有课程的单一来源。
- 检测每个课程 README 是否包含 Mermaid `flowchart` / `graph`。
- 检测每个课程是否有一个 `CONCEPT_VISUALS` 动画/示意模块。
- 缺失项直接补齐，并把检测写进自动测试。

Non-scope：

- 不手改每章正文来插 HTML。
- 不新增外部图片资源。
- 不改 demo runner / LLM 运行逻辑。

## Phase 2: 方案

审计结果：

- Mermaid 流程图：26/26 已覆盖。
- 抽象概念可视化模块：12/26 已覆盖，缺 14 个。

缺失 visual 的课程：

- 02、03、05、06、12、15、16、18、19
- capstone
- rag-chunk、rag-rerank、rag-eval、rag-prod

方案：

- 在 `CONCEPT_VISUALS` 为缺失课程补齐 14 条。
- 将 `visuals.test.mts` 升级为全课程门禁：`CONCEPT_VISUALS.length === CHAPTERS.length`、无重复、无未知章节、每个 README 存在且含 Mermaid 流程图。
- README / knowledge-graph README 改成全课程要求。

## Phase 3: Work

- [x] T1 审计所有 `CHAPTERS` 课程 flowchart/visual 覆盖。
- [x] T2 补齐 14 个缺失 visual 模块。
- [x] T3 升级 `visuals.test.mts` 为全课程覆盖门禁。
- [x] T4 更新 README 与知识图谱维护说明。
- [x] T5 跑测试、typecheck、site build、浏览器抽查。

## Phase 4: Review

结果：

- P0/P1：未发现。
- 26/26 课程 README 均有 Mermaid `flowchart` / `graph`。
- 26/26 课程均有一个 `CONCEPT_VISUALS` 动画/示意模块。
- VitePress 产物 26/26 课程页均包含 `concept-visual`。
- 浏览器抽查第 02 章与 R6：Mermaid 在 visual 前，visual 存在，桌面无横向溢出。
- 移动端 390px 抽查第 02 章：无横向溢出。

## Phase 5: Compound

沉淀：

- “所有课程必须有动图和流程图”已下沉为 `knowledge-graph/data/visuals.test.mts` 门禁。
- 后续新增课程时，必须同步补 README Mermaid 流程图和 `CONCEPT_VISUALS` visual 数据。

验证：

- `npx tsx knowledge-graph/data/visuals.test.mts` → pass（沙箱外；沙箱内 `tsx/esbuild spawn EPERM`）
- `pnpm typecheck` → pass
- `pnpm site:build` → pass（沙箱外；沙箱内 `esbuild spawn EPERM`）
- 静态产物覆盖检查 → `dist visual coverage ok: 26/26`
- Browser preview 检查 → pass
