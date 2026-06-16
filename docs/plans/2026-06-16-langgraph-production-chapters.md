---
title: "LangGraph 生产化章节收集与课程接线"
type: sprint
status: completed
created: "2026-06-16"
updated: "2026-06-16"
mode: "--auto + caveman"
tasks_total: 4
tasks_completed: 4
tags: [sprint, langgraph, curriculum, production]
aliases: ["LangGraph 生产化扩章", "langgraph production chapter map"]

invariants:
  - "planned 章节不得写入 CHAPTERS，除非目录/demo/smoke/visual 同步落地"
  - "生产化扩章必须来源于官方 LangGraph JS docs 或仓库既有课程缺口"
  - "本 sprint 文档层接线，不碰 graph.ts/visuals.ts，避免并行 RAG/frontier 冲突"
invariant_tests:
  - "pnpm typecheck"
  - "pnpm site:build (blocked: sandbox spawn EPERM; non-sandbox approval timed out twice)"
---

# LangGraph 生产化章节收集与课程接线

## Phase 1: 需求分析

Scope：继续丰富 `langgraph-advanced/` 的生产化章节，先提供可执行扩章地图与课程入口，不一次性实现六个 demo 章。

Non-scope：不新增 `CHAPTERS` 条目；不改 `knowledge-graph/data/graph.ts` / `visuals.ts`；不提交、不部署。

Success：学习者能从课程大纲/导航进入 LangGraph 专题首页，并看到 L6-L11 生产化章节候选、排序、离线 demo 设计和官方来源。

Risk：如果 planned 章节直接进知识图谱，会破坏 demo registry / sidebar 可运行不变量；如果大改 `graph.ts`，会和并行 RAG/frontier sprint 冲突。

✓ auto: phase 1 -> 2, reason=docs-first L1 scope clear.

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 既有 invariant | 本 sprint 如何保持 |
|--------|----------------|--------------------|
| LangGraph 六件套 | 章节进 CHAPTERS 必须目录/demo/smoke/visual 全齐 | 本轮只做 planned map，不写 CHAPTERS |
| 共享知识图谱 | `graph.ts` / `visuals.ts` 是高冲突共享文件 | 不触碰共享数据源 |
| 课程导航 | 入口必须指向真实存在文件 | 新增 `langgraph-advanced/README.md`，再从 docs 链接它 |

### 入场扫描 - 集成路径

| 改动点 | 触发 | 中间层 | 刷新后可见 |
|--------|------|--------|------------|
| `langgraph-advanced/README.md` | 点击专题入口 | VitePress Markdown | ✅ 专题首页 |
| `docs/curriculum.md` / `docs/navigation.md` | 课程总览/导航 | 静态链接 | ✅ 可进入专题首页 |
| `docs/solutions/...chapter-map.md` | 复利查找 | docs/solutions | ✅ 可追溯来源与章节表 |

无断链：所有新增链接指向真实文件或官方 URL。

### 入场扫描 - 债务清单

| 来源 | 议题 | 本 sprint 决策 |
|------|------|----------------|
| 2026-06-15 LangGraph 轨道 | COULD: streaming / LCEL | streaming 升为 L6；LCEL 不列为 LangGraph 生产主线 |
| Phase 4 未决 | `generate.ts` 跨章标签 P3 | 保持推迟，不碰共享生成器 |

### 任务表

| Task | 内容 | 风险 |
|------|------|------|
| T1 | 官方资料收集，确定 L6-L11 章节地图 | L1 |
| T2 | 新增 `langgraph-advanced/README.md` 专题入口 | L1 |
| T3 | 更新 `docs/curriculum.md` / `docs/navigation.md` 课程接线 | L1 |
| T4 | 新增 solution 记录章节地图，跑 site build | L1 |

✓ auto: phase 2 -> 3, reason=4 tasks, docs-only, no L3/L4.

## Phase 3: 变更日志

- T1 ✅ 从 LangGraph JS 官方 docs 收集 production/capability 页面，归纳 L6-L11；发现 L9 fault tolerance 官方 per-node timeout/error handler 要求 `@langchain/langgraph>=1.4.0`，已写入版本 gate。
- T2 ✅ 新增 `langgraph-advanced/README.md`，列已有 L1-L5 与 planned L6-L11。
- T3 ✅ 更新 `docs/curriculum.md` 与 `docs/navigation.md`，加入进阶 LangGraph 专题入口与主题路径。
- T4 ✅ 新增 `docs/solutions/2026-06-16-langgraph-production-chapter-map.md`。
- 验证：`pnpm typecheck` pass；`pnpm site:build` 在沙箱内 `spawn EPERM`，按规则请求非沙箱重跑两次，审批均超时，未获得 build pass 证据。

## Phase 4: 审查结果

P0: 无。P1: 无。

- 架构：planned 与 implemented 分离；未把不存在目录写入 `CHAPTERS`。
- 集成连续性：新增链接指向真实 `langgraph-advanced/README.md`；不碰共享 graph/visuals。
- 内容正确性：章节来源来自 LangGraph JS 官方 docs；每个候选章都绑定生产问题、离线 demo、验收形态；版本差异（0.2.x vs 1.4.x）已显式标注。
- 风险：`pnpm site:build` 是文档链接与 VitePress 集成验证门；当前只拿到 sandbox EPERM 与审批超时证据，需后续非沙箱 build 补验证。

## Phase 5: 复利记录

- Solution：`docs/solutions/2026-06-16-langgraph-production-chapter-map.md`。
- 经验：生产化专题扩章先做 source-backed map，再逐章进入六件套，避免 planned 内容破坏可运行不变量。
- 验证缺口：VitePress build 未能在本轮确认通过；已保留为下一步。
- status: completed。
