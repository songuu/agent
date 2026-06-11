---
title: "第 11 章多智能体编排实践更新"
type: sprint
status: completed
created: "2026-06-11"
updated: "2026-06-11"
tasks_total: 5
tasks_completed: 5
tags: [sprint, curriculum, multi-agent, codex, claude-code]
---

# Sprint: 第 11 章多智能体编排实践更新

## Phase 1: Think

### 一句话
把第 11 章从基础 supervisor-worker 示例，升级为结合 Claude Code 与 Codex 现状的多智能体编排实践指南。

### Scope
- 更新 `lessons/11-multi-agent-orchestration/README.md`。
- 同步 `knowledge-graph/data/graph.ts` 与 `knowledge-graph/data/visuals.ts` 的第 11 章摘要、外部引用。
- 同步 `docs/curriculum.md` 第 11 章一句话。
- 运行知识图谱生成、类型检查与站点构建。

### Non-scope
- 不改第 11 章 demo 运行逻辑；当前代码仍作为“最小可解释骨架”。
- 不接入真实 Claude Code / Codex CLI 自动执行。
- 不新增生产依赖。

### 成功标准
- 第 11 章能说明：何时单 agent、何时 subagent、何时 agent team、何时 SDK handoff / agent-as-tool。
- 内容包含 Claude Code 和 Codex 的当前实践：subagents、teams、worktrees、AGENTS.md/custom agents、sandbox/approval、guardrails、traces/evals。
- 图谱与页面生成产物一致。
- `pnpm typecheck` 与 `pnpm site:build` 通过，或明确记录阻塞。

## Phase 2: Plan

| # | Task | 风险 | 验证 |
|---|------|------|------|
| 1 | 查官方资料并定位课程源文件 | L1 | 记录来源 URL |
| 2 | 更新第 11 章正文 | L2 | 人工复核章节结构 |
| 3 | 同步图谱/可视化/大纲 | L2 | `pnpm kg` |
| 4 | 构建验证 | L2 | `pnpm typecheck`, `pnpm site:build` |
| 5 | Review + Compound | L1 | diff 复核 |

## Phase 3: Work Log

- Task 1 完成：资料来自 Claude Code 官方 docs 与 OpenAI Codex / Agents SDK 官方 docs。
- Task 2 完成：`lessons/11-multi-agent-orchestration/README.md` 已从基础 supervisor-worker 示例升级为 2026 实战版编排指南。
- Task 3 完成：`knowledge-graph/data/graph.ts`、`knowledge-graph/data/visuals.ts`、`docs/curriculum.md` 已同步第 11 章定位。
- Task 4 完成：已运行 `pnpm kg` 重新生成图谱与章节注入产物。
- Task 5 完成：已复核范围，把第 11 章引用限定回本章，避免不必要更新第 16/17 章。

## Phase 4: Review

- 官方来源覆盖 Claude Code subagents、agent teams、worktrees、hooks，以及 Codex subagents、custom agents、AGENTS.md、sandbox/approval。
- 内容结构按“先选拓扑，再派 worker”组织，避免把多 Agent 简化为“越多越强”。
- 验证已通过：
  - `pnpm kg`
  - `pnpm typecheck`
  - `pnpm site:build`
- `pnpm site:build` 仍有 VitePress chunk size warning，属于既有构建体积提示，不阻塞本次内容更新。

## Phase 5: Compound

- 经验：多智能体课程的关键不是罗列框架名，而是把“任务边界、上下文隔离、权限审批、最终汇总、可观测验证”做成拓扑选择流程。
- 本能候选：遇到“多 agent 编排”主题时，先问是否真的需要拆；若需要，优先按读写隔离和最终责任人来选择 subagent、agent team、worktree、handoff 或 agent-as-tool。
