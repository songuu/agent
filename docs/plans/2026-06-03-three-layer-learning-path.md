---
title: "课程三层学习路线优化"
type: sprint
status: completed
created: "2026-06-03"
updated: "2026-06-03"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, education, agent, curriculum, learning-path]
aliases: ["three layer learning path", "极简 进阶 真实实践"]

invariants:
  - "所有课程代码用 TypeScript + tsx 直接运行,零编译步骤 (npx tsx lessons/NN-xxx/index.ts)"
  - "所有 LLM 调用经 src/shared/llm 的 provider 无关接口,绝不在课程里直接 new Anthropic()"
  - "每个 lesson 目录自包含: README.md(讲解) + 可运行 .ts + 文末练习"
  - "课程导入共享代码一律用显式相对路径 (../../src/shared/...),不用路径别名魔法,保证初学者可追溯"
  - "示例主用 Claude,关键处标注 OpenAI 等价写法;切换厂商只改 .env,不改课程代码"
  - "tsc --noEmit 全仓库零类型错误"
  - "每个 lesson README 必须包含且只包含一个 `## 三层学习路线`"

invariant_tests:
  - "npx tsc --noEmit"
  - "Markdown 相对链接检查"
  - "三层学习路线结构检查"

deferred: []
deadcode_until: []
---

# Sprint: 课程三层学习路线优化

## Phase 1: 需求分析

### Scope

- 针对每一章新增统一的三层学习路线: 极简、进阶、真实实践。
- 三层路线必须和本章主题强绑定,不是通用模板。
- 三层路线要组成完整链路: 先跑通最小闭环,再理解关键机制,最后映射到真实项目。
- 更新 README 和课程大纲,让学习者知道整门课如何按三层方法推进。

### Non-scope

- 不改课程代码行为。
- 不新增新依赖。
- 不改历史已完成 sprint 的结论,除非它影响当前课程入口。

### Success

- [ ] 19 个 lesson README 都有且只有一个 `## 三层学习路线`。
- [ ] 每章三层路线包含本章定制化的学习目标与产出。
- [ ] README / docs/curriculum.md 说明三层学习法如何贯穿全课。
- [ ] `npx tsc --noEmit` 通过。
- [ ] Markdown 相对链接检查通过。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 约束 | 本 sprint 如何保持 |
|--------|------|--------------------|
| lessons | README + index.ts 自包含 | 只改 README 教学结构,不改代码运行入口 |
| TypeScript | `tsc --noEmit` 零错误 | 收尾运行 invariant test |
| 链接 | Markdown 相对链接有效 | 收尾跑链接检查 |
| 学习路径 | 从零手写到框架再到生产 | 三层路线按“最小闭环 → 原理机制 → 真实项目”组织 |

### 任务拆解

| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 检查现有章节结构 | L1 | 确认 19 章缺少统一三层路线 |
| 2 | 新增 sprint 文档 | L1 | 当前文件 |
| 3 | 为每章插入三层学习路线 | L2 | 19 个 README 更新 |
| 4 | 更新 README / curriculum | L1 | 全课三层学习法说明 |
| 5 | 验证与复盘 | L2 | 类型、链接、结构检查 |

## Phase 3: 变更日志

### Task 1 — 检查现有章节结构

- 已确认 19 个 lesson README 都没有 `## 三层学习路线`。
- 决策: 统一插在 `## 前置知识` 之后、`## 图解学习地图` 之前,让学习者先知道本章怎么学,再看图。

### Task 2 — 新增 sprint 文档

- 新增本 sprint 文档,记录三层学习法的范围、验收标准和验证策略。

### Task 3 — 为每章插入三层学习路线

- 19 个 lesson README 均新增 `## 三层学习路线`。
- 每章按主题定制三层内容:
  - 极简: 本章最小闭环和直接产出。
  - 进阶: 原理、边界、失败模式和工程取舍。
  - 真实实践: 产品、团队、生产系统或作品集中的迁移方式。
- 第 09 章 RAG 的真实实践层显式连接 `songuu/rag-system`,把课程最小 RAG 和生产级知识库系统连起来。

### Task 4 — 更新 README / curriculum

- `README.md` 新增“三层学习路线”课程取舍,并在学习路径中解释极简、进阶、真实实践三层产出。
- `docs/curriculum.md` 把学习方式升级为“每章三层走 + 每层三步读”,并新增“三层学习法”自检表。

### Task 5 — 验证与复盘

- 完成三层结构检查、类型检查、Markdown 相对链接检查。

## Phase 4: 审查结果

### 多视角审查

| 视角 | 结论 | 证据 |
|------|------|------|
| 教学质量 | 通过 | 每章都明确最小可运行目标、进阶理解目标、真实实践迁移目标。 |
| 链路完整性 | 通过 | README / curriculum / 19 个 lesson 形成统一学习方法。 |
| 工程风险 | 通过 | 只改 Markdown 教学内容,不改运行时代码和依赖。 |
| RAG 连续性 | 通过 | 第 09 章三层路线和 `docs/rag-system-project.md` 一起连接到 `songuu/rag-system`。 |

### Findings

- P0: 无。
- P1: 无。
- P2: 无。

### 验证记录

- 三层学习路线结构检查 → pass,19 个 lesson 均有且只有一个 `## 三层学习路线`。
- `npx tsc --noEmit` → pass。
- Markdown 相对链接检查 → pass。
- 第一次链接检查误扫 `node_modules` 第三方 README 后失败; 使用更严格的 `node_modules` / `.git` 排除条件重跑后通过。

## Phase 5: 复利记录

### 经验沉淀

1. **课程章节要同时给“最小闭环”和“真实落点”**  
   单纯讲原理容易抽象,单纯跑 demo 容易浅。三层路线能把“先跑通、再理解、最后迁移”固定成每章的学习动作。

2. **RAG 章节需要连接生产级项目**  
   最小 RAG 适合教学,但真实项目还需要文档入库、权限、引用、检索服务和观测。把 `songuu/rag-system` 放进真实实践层,能自然承接用户已有项目。

3. **学习法应写进入口页而不是只散落在章节里**  
   README 和 curriculum 是学习者第一入口,必须先解释三层方法,否则每章新增 section 会变成孤立装饰。
