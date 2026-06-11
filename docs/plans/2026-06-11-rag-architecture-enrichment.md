---
title: "RAG 架构蓝图补充"
type: sprint
status: completed
created: "2026-06-11"
updated: "2026-06-11"
checkpoints: 0
tasks_total: 5
tasks_completed: 5
tags: [sprint, rag, architecture, documentation]
aliases: ["RAG 架构补充", "rag-architecture"]

invariants:
  - "RAG 学习路径必须保持 08/09 -> rag-advanced -> 架构蓝图 -> rag-system"
  - "架构文档只描述系统边界和落地路径，不重写已完成的 rag-advanced 代码"
  - "docs/navigation.md、docs/curriculum.md、README.md、站点侧边栏必须有同一入口"
  - "文档链接在 VitePress cleanUrls + markdown link normalize 规则下可解析"

invariant_tests:
  - "pnpm typecheck"
  - "pnpm site:build"

deferred: []
deadcode_until: []
---

# RAG 架构蓝图补充

## Phase 1: 需求分析

### 背景

仓库已有第 08/09 章、`rag-advanced` 六章、`src/shared/rag` 共享能力和 `docs/rag-system-project.md`。现有内容能覆盖教学 demo 和进阶模块，但从“课程能力”到“独立 RAG 系统”的架构边界还不够完整。

### Scope

- 新增一份 RAG 完整架构蓝图，覆盖写入路径、查询路径、层级职责、数据模型、API 边界、安全治理、质量闭环、部署拓扑和演进路线。
- 更新 RAG 系统实战项目文档，使路线变成 `08/09 -> rag-advanced -> 架构蓝图 -> songuu/rag-system`。
- 更新 README、curriculum、navigation、VitePress sidebar/nav 入口。
- 记录本 sprint 的 invariant 和验证链。

### Non-scope

- 不改 `src/shared/rag` 代码。
- 不改 `rag-advanced` 章节实现。
- 不接入真实外部 `songuu/rag-system` 仓库。
- 不新增知识图谱节点，避免把架构文档混入课程 CHAPTERS 单一事实源。

### 成功标准

- RAG 架构文档能独立解释生产级 RAG 的系统边界。
- 所有主要入口都能跳到架构蓝图。
- `pnpm typecheck` 通过。
- `pnpm site:build` 通过。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| RAG 学习路径 | `rag-advanced` 是 08/09 后的进阶主线 | 新增架构蓝图放在 `rag-advanced` 和 `rag-system-project` 之间 |
| VitePress | 文档链接经 cleanUrls 与 markdown normalize | 新文档用相对 `.md` 链接，sidebar 用 clean URL |
| shared/rag | 代码能力已完成且有 smoke | 本 sprint 只做文档架构，不动实现 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| `docs/rag-architecture.md` | 用户从 README/nav/curriculum/sidebar 点击 | VitePress docs route | Markdown 文件 | ✅ |
| `docs/rag-system-project.md` | 用户阅读 RAG 实战项目 | 文内链接 | Markdown 文件 | ✅ |
| `.vitepress/config.mts` | `pnpm site:build` | sidebar/nav | 静态站产物 | ✅ |

### 入场扫描 - 债务清单

无本 sprint 继承债务。

### 任务拆解

- [x] T1 新增 `docs/rag-architecture.md`。
- [x] T2 更新 `docs/rag-system-project.md` 路线与入口。
- [x] T3 更新 `docs/navigation.md`、`docs/curriculum.md`、`README.md`。
- [x] T4 更新 `.vitepress/config.mts` 站点入口。
- [x] T5 验证 `pnpm typecheck`、`pnpm site:build` 并收口。

## Phase 3: 变更日志

- 新增 `docs/rag-architecture.md`：完整说明 RAG ingestion、query、layering、domain model、API、deployment、安全治理、质量闭环、演进路线和验收清单。
- 更新 `docs/rag-system-project.md`：把架构蓝图插入课程进阶与独立项目之间。
- 更新 `docs/navigation.md`：快速入口、顺序学习、主题跳转加入 RAG 架构。
- 更新 `docs/curriculum.md`：学习时长、路径图、独立架构章节、学完之后加入 RAG 架构。
- 更新 `README.md`：学习路径图、章节一览、仓库结构、学完之后加入 RAG 架构。
- 更新 `.vitepress/config.mts`：sidebar/nav 的指南区加入 RAG 完整架构。

## Phase 4: 审查结果

### 结论

通过。变更为 L1-L2 文档/导航增强，只有 `.vitepress/config.mts` 属于站点配置接线；未修改 RAG 运行时代码。

### 第 6 视角 - 集成连续性

- 学习路径保持：`08/09 -> rag-advanced -> RAG 架构蓝图 -> rag-system-project`。
- 新增文档入口覆盖 README、navigation、curriculum、RAG 实战文档、VitePress sidebar/nav。
- 未破坏 `src/shared/rag`、`rag-advanced`、KG 单一事实源。
- 已知非本轮改动：`.codex/rules/architecture.md`、`.codex/rules/debugging-gotchas.md`、`docs/solutions/2026-06-11-diagram-zoom-contain-fullscreen.md` 在本轮开始前已是 dirty/untracked，未纳入本 sprint。

### 验证记录

- `pnpm typecheck` -> pass。
- `pnpm site:build` -> sandbox 内 `spawn EPERM`（esbuild child process 环境问题）；按权限升级后沙盒外复跑 -> pass，VitePress build complete in 30.23s。

## Phase 5: 复利记录

### 经验沉淀

1. RAG 课程补足代码能力后，还需要一份系统架构蓝图承接到作品集项目，否则学习路径会从“会写模块”跳到“看外部项目”，中间缺少边界建模。
2. RAG 架构文档应按写入路径和查询路径拆，而不是按技术名词堆列表；这样 ingestion、retrieval、rerank、generation、eval、governance 的责任更清楚。
3. 在本仓库里，新增课程外文档要同时接 README、navigation、curriculum 和 VitePress sidebar/nav，避免站点入口与 Markdown 入口漂移。

### 收尾

本 sprint 完成，无 checkpoint。
