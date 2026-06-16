---
title: "基础概念章节扩展"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, docs, curriculum, agent-basics]
aliases: ["基础概念扩章"]
invariants:
  - "不重排既有 01-19 课程编号"
  - "基础扩章先作为专题地图接入导航，不新增空章节目录"
  - "VitePress base/rewrite 必须保证专题根路径可访问"
invariant_tests:
  - "pnpm typecheck"
  - "pnpm site:build"
deferred:
  - sprint: "next"
    item: "把 B1-B4 拆成完整章节"
    deadline: "2026-06-23"
    reason: "本轮先收集章节池和接入导航，避免一次性生成大量空章节"
---

# Sprint: 基础概念章节扩展

## Phase 1: Think

### Scope

- 丰富“第一部分 · 基础概念”的章节池。
- 收集可追溯资料来源。
- 不破坏现有 01-19 顺序。
- 提供后续逐章扩写路线。

### Non-scope

- 不一次性创建 12 个未完成章节。
- 不重编号现有课程。
- 不修改运行时代码。

### Success

- 有独立基础概念扩展专题页。
- 大纲、导航、首页和 README 都能发现该专题。
- 站点构建能生成 `/agent-basics/`。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| VitePress 站点 | 根 README 专题页需要 rewrite 成 `index.html` | 新增 `agent-basics/README.md` 时同步 rewrite |
| 课程结构 | 不轻易重排既有编号 | 使用专题地图，不改 01-19 |
| 文档证据 | 章节扩张要有来源线索 | 在专题页和 solution doc 写来源 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 基础专题入口 | 用户打开首页/导航/README | VitePress link | repo markdown | 是 |
| 专题根路径 | 用户访问 `/agent-basics/` | rewrite | `.vitepress/dist/agent-basics/index.html` | 是 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| 本轮 | B1-B12 候选章节尚未逐章展开 | 明确推迟，先完成章节池和导航接入 | 2026-06-23 |

### Tasks

- [x] T1 收集基础概念扩章主题与来源。
- [x] T2 新增 `agent-basics/README.md` 专题地图。
- [x] T3 更新课程大纲、导航、首页、README、VitePress rewrite。
- [x] T4 运行类型检查和站点构建。

## Phase 3: Work

### 变更记录

- 新增 `agent-basics/README.md`，列出 B1-B12 候选章节。
- 新增 `docs/solutions/2026-06-16-basic-concepts-chapter-map.md`。
- 更新导航、大纲、首页、README 和 VitePress rewrite。

### 验证

- `pnpm typecheck` -> pass。
- `pnpm site:build` -> fail，Windows sandbox 命中已知 `spawn EPERM`。
- WSL + Windows node/pnpm 复跑 `pnpm site:build` -> pass，`vitepress v1.6.4`，`build complete in 38.69s`。
- `.vitepress/dist/agent-basics/index.html` 存在，产物文件数 279。

## Phase 4: Review

### 结果

- P0: 无。
- P1: 无。
- P2: 后续若拆成实际章节，需要补每章 demo 或概念练习；本轮已写入 deferred。

### 第 6 视角 - 集成连续性

- 不变量保持：未重排 01-19。
- Dead code: 无运行时代码新增。
- 下一 sprint 成本：B1-B4 可直接从专题表拆出四个章节。

## Phase 5: Compound

### 复利记录

- 模式：新增课程专题首页时，同时更新 `docs/navigation.md`、`docs/curriculum.md`、`README.md`、`index.md`、`.vitepress/config.mts` rewrite。
- 经验：扩章先做章节池和来源表，比一次性生成大量空章节更稳。
