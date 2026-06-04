---
title: "Agent 课程图文与原理增强"
type: sprint
status: completed
created: "2026-06-03"
updated: "2026-06-03"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, education, agent, curriculum, enrichment]
aliases: ["agent curriculum enrichment", "课程增强"]

invariants:
  - "所有课程代码用 TypeScript + tsx 直接运行,零编译步骤 (npx tsx lessons/NN-xxx/index.ts)"
  - "所有 LLM 调用经 src/shared/llm 的 provider 无关接口,绝不在课程里直接 new Anthropic()"
  - "每个 lesson 目录自包含: README.md(讲解) + 可运行 .ts + 文末练习"
  - "课程导入共享代码一律用显式相对路径 (../../src/shared/...),不用路径别名魔法,保证初学者可追溯"
  - "示例主用 Claude,关键处标注 OpenAI 等价写法;切换厂商只改 .env,不改课程代码"
  - "tsc --noEmit 全仓库零类型错误"

invariant_tests:
  - "npx tsc --noEmit"

deferred: []
deadcode_until: []
---

# Sprint: Agent 课程图文与原理增强

## Phase 1: 需求分析

### Scope

- 增强 18 个 lesson README 的图文表达、流程图、原理性解释。
- 每章新增可视化学习地图,用 Mermaid 表达核心流程或系统结构。
- 每章新增 3 条左右的原理展开,解释机制 WHY,不是只复述代码。
- 保持现有代码和运行入口不变。

### Non-scope

- 不改课程代码行为。
- 不引入图片生成或二进制素材,避免仓库膨胀;本轮用 Markdown + Mermaid 作为可维护图文。
- 不做真实 API key e2e,当前环境无 key;只验证类型与文档结构。

### Success

- [x] 18 章 README 均包含 `## 图解学习地图`。
- [x] Mermaid 图均采用 markdown fence,可被 GitHub / Obsidian 渲染。
- [x] 每章新增原理解释与整条路径关系说明。
- [x] `npx tsc --noEmit` 通过。
- [x] 无 `TODO` / `FIXME` / 直接 new 厂商 SDK 回归。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| lessons | README + 可运行 .ts 自包含 | 只增强 README,不改变代码入口 |
| shared LLM | 课程统一经 provider 无关接口 | 静态扫描 direct SDK usage |
| TypeScript | `tsc --noEmit` 零错误 | 收尾重跑 invariant test |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| README 图解增强 | 用户阅读 lesson | Markdown + Mermaid | git 文件 | ✅ |
| 原理解释增强 | 用户阅读 lesson | README 文本 | git 文件 | ✅ |

### 入场扫描 - 债务清单

无历史 deferred 债务。

### 任务拆解

| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 设计统一增强块结构 | L1 | `图解学习地图` / `原理展开` / `路径关系` |
| 2 | 批量增强 18 章 README | L2 | 每章专属 Mermaid + 原理说明 |
| 3 | 更新课程总览提示 | L1 | README / curriculum 提示图解阅读方式 |
| 4 | 验证与审查 | L2 | tsc + 静态扫描 + 结构检查 |
| 5 | Compound 收口 | L1 | sprint 文档完成 |

## Phase 3: 变更日志

### Task 1 — 统一增强块结构

- 设计每章新增块: `图解学习地图` / `原理展开` / `本章和整条路径的关系`。
- 图解统一使用 Mermaid `flowchart LR`,节点文本用引号包裹,降低渲染歧义。

### Task 2 — 批量增强 18 章 README

- 18 个 lesson README 均新增一张章节专属流程图。
- 每章新增 3 条原理展开,重点解释机制、边界、成本、失败模式与适用条件。
- 每章新增路径关系说明,把当前章节接回 agent loop / tool / memory / RAG / framework / production 主线。

### Task 3 — 更新课程总览提示

- 顶层 `README.md` 新增“先看图,再看代码”的学习方式说明。
- `docs/curriculum.md` 新增“图文阅读法”,解释如何阅读节点、箭头、分支。

### Task 4 — 验证与审查

- 修复课程文档旧目录名断链:
  - 第 10 章前置链接: `04-react-and-tools` → `04-the-agent-loop`, `06-tool-system` → `06-building-a-tool-system`。
  - 第 11 章前置链接: `05-the-agent-loop` / `06-building-tools` → 真实 lesson 目录。
  - 第 14 章前置链接: `04-tool-calling` → 第 04 / 05 章真实路径。
- 修复 `docs/career-guide.md` 中 `Demo 视频](链接)` 占位断链,改为文字提示。

### Task 5 — Compound 收口

- Sprint 文档状态改为 completed。
- 记录验证命令与复利经验。

## Phase 4: 审查结果

### 多视角审查

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | 通过 | 本轮只改文档,不改变课程代码与 shared 契约。 |
| 安全 | 通过 | 无密钥、无危险命令、无直接 SDK 实例化回归。 |
| 教学质量 | 通过 | 18 章均新增可视化流程和原理解释,从“读代码”前移到“先建模型”。 |
| 链接质量 | 通过 | Markdown 相对链接存在性检查通过。 |
| 测试覆盖 | 通过 | `npx tsc --noEmit` 通过; 文档结构检查通过。 |
| 第 6 视角: 集成连续性 | 通过 | 顶层 README、curriculum、lesson README 的学习方法一致; 无半完成债务。 |

### Findings

- P0: 无。
- P1: 无。
- P2: 无。

### 验证记录

- 18 章结构检查: 每章 `图解学习地图` / `mermaid` / `原理展开` / `本章和整条路径的关系` 计数均为 1。
- Markdown 相对链接检查 → pass。
- `npx tsc --noEmit` → pass。
- `rg -n 'TODO|FIXME|new Anthropic|new OpenAI|@anthropic-ai/sdk'` → no matches。

## Phase 5: 复利记录

### 经验沉淀

1. **课程图解要放在代码走读之前**  
   初学者先看流程图,再看代码,更容易把 messages、工具、检索、stream、部署这些抽象放到同一张系统图里。

2. **Mermaid 是教学仓库的轻量图文方案**  
   不引入二进制素材,可 diff、可维护、可在 GitHub / Obsidian 渲染,适合每章持续迭代。

3. **文档增强也要做链接回归**  
   抽样阅读发现旧目录名断链,说明文档 sprint 也需要链接检查,不能只跑 `tsc`。

### 后续建议

- 如果后续继续扩充,优先给 capstone README 增加一张端到端系统架构图。
- 填入 `.env` 后跑关键 e2e,把图中节点与真实输出截图补进文档。
