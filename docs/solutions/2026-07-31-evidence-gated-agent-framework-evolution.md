---
title: "证据门控的 Agent 框架演进与安全事件投影"
date: 2026-07-31
tags: [solution, agent, architecture, evidence, langgraph, streaming]
related_instincts: []
aliases: ["Agent 趋势框架演进", "Agent 五平面架构", "LangGraph 安全事件投影"]
---

# 证据门控的 Agent 框架演进与安全事件投影

## Problem

Agent 生态变化快，课程或工程框架很容易同时出现三类漂移：

- 把厂商新名词直接写成普适架构结论；
- 新协议/SDK 已升级，正文、可运行示例、知识图谱和生成内容却停在不同版本；
- runtime 原始 stream 被前端直接消费，内部 state、调试字段或未来未知事件可能穿透产品边界。

只写一篇趋势报告不能解决这些问题；可靠演进必须同时更新事实源、架构责任、可运行纵切面、公开入口和持续验证门。

## Root Cause

1. **证据与推断混在一起**：厂商工程文章能证明一种实现可行，不能证明它对所有模型、任务和组织都最优。
2. **生态层与生产责任混在一起**：SDK、runtime、协议是选型对象，不等于 session、权限、副作用和结果验收已有 owner。
3. **版本语义没有隔离**：同一 canonical article 同时服务 legacy 课程和 current 趋势页，会让旧 API 冒充当前能力。
4. **框架事件被当成产品事件**：`values / updates / custom` 面向不同受众，直接透传会形成数据泄露与 UI 耦合。
5. **派生消费者缺少合同**：导航、sidebar、课程表、图谱、HTML 和 CI 如果不从事实源重生成并测试，会悄悄漂移。

## Evidence Gate

### 已验证事实

- OpenAI、Anthropic 的长任务工程材料共同支持：harness、session、sandbox、checkpoint、artifact 与验证环境已经成为模型能力能否持续兑现的关键边界。
- MCP 2026-07-28、A2A v1.0 与产品内事件协议解决不同层次的问题；A2A v1.0 是首个 stable/production-ready 版本，但 interaction protocol 有 breaking changes。
- Google 的多 Agent 研究显示收益强依赖任务拓扑；强顺序任务可能退化，不能把 Agent 数量当能力指标。
- NIST agent identity/authorization 当前仍是 Initial Public Draft；OWASP 直接支持的是持久化记忆投毒及跨 session/project/reboot 影响。
- 本仓库仍 pin `ai ^4.0.0`，第 12 章使用 legacy `maxSteps`；AI SDK 7 的 `WorkflowAgent`、sandbox 与 approval 属 current 趋势，二者必须分开记录。
- LangGraph 0.2.74 在 multi-mode stream 中产出 `[mode, payload]`；本地离线合同已验证 `values → custom → updates` 的当前顺序图行为。

### 工程推断

- 生态八层适合回答“选什么”，五平面适合回答“谁负责”；两张图应并存。
- 默认从单 Agent 或确定性 workflow 起步，只有可独立分片、可分别验收并有成本收益证据时才升级多 Agent。
- 模型输出应停在 intent；完成态必须由真实 state diff、artifact、测试或 grader 证据驱动。
- 产品只应消费显式、白名单化事件；完整状态、调试 patch 与未知事件默认留在内部通道。

### 未知项

- 不同模型和任务的最佳 harness、摘要频率、memory 策略与多 Agent 拓扑仍需业务 eval 校准。
- A2A 协议稳定不等于跨组织身份、授权委托和长期信任控制面已经稳定。
- 当前 L6 没有验证并行图、子图、取消、背压、长流或真实副作用节点。

## Solution

### 1. 用五平面冻结生产责任

| 平面 | 主要责任 | 不应承担 |
| --- | --- | --- |
| Intelligence & Context | 模型、skills、RAG、memory、上下文预算 | 宣布真实副作用已完成 |
| Control & Harness | session、workflow、checkpoint、取消、重试、预算 | 绕过执行权限 |
| Execution & Capability | sandbox、tools、credentials、幂等副作用 | 自主扩大权限 |
| Interoperability & Coordination | MCP、A2A、发现、委托、版本协商 | 替代内部工作流和身份治理 |
| Assurance & Experience | UI 投影、HITL、trace/eval、policy、结果验收 | 把“有日志”当“结果正确” |

### 2. 选择最小可运行纵切面

不要先造第二套通用 orchestrator。先选一个同时贯通 runtime、产品体验、观测和安全的问题：把 LangGraph L6 的 raw stream 投影成稳定产品事件。

| Raw mode | 稳定受众 | 规则 |
| --- | --- | --- |
| `custom` | `user` | 只接受合法 progress，并按 `type / stage / message` allowlist 重建 |
| `updates` | `debug` | 只接受单节点 patch，保留节点名 |
| `values` | `audit` | 保留完整快照，但不直接进入用户 UI |
| unknown / malformed | `audit/unknown` | 不抛错、不上屏、保留诊断证据 |

`collectEventStream()` 的第二次 `invoke()` 只用于纯函数 demo 的测试 oracle。工具、LLM、checkpointer 或副作用图不能照搬双执行。

### 3. 把事实版本写进 canonical source

- legacy 教学来源只挂 legacy 章节：AI SDK 4 `maxSteps` → 官方 4→5 migration，并说明 v5+ 改用 `stopWhen / prepareStep`。
- current 趋势来源只挂 current 章节：AI SDK 7 changelog、A2A v1.0 specification + announcement。
- NIST draft、工程完成态、OWASP 投毒分别进入事实、推断和直接归因范围，不互相代替。

### 4. 用派生合同防止再次漂移

- 研究准确性测试锁定协议/SDK 版本、事实桶和来源归因。
- IA 测试锁定 L1–L6、L5→L6 过渡与蓝图 sidebar。
- 图谱只改 `knowledge-graph/data/graph.ts` / `visuals.ts`，再运行生成器；第二次生成必须 0 更新，并对关键产物做 hash 核对。
- scoped LangGraph typecheck 覆盖 shared、demo 与 smoke；CI 同时运行 typecheck、smoke、研究准确性、IA、visuals 和 generator tests。

## Prevention

- 每条易变外部结论都记录来源、日期、版本、适用边界和反证；厂商案例不外推为行业定律。
- 升级 `ai`、LangGraph、MCP 或 A2A 时，先更新版本合同，再改正文和示例；禁止同一 article 混用 legacy/current 语义。
- user 事件必须 canonicalize 后创建新对象；debug/audit 若进入持久存储，还要复制、脱敏、冻结并定义 retention policy。
- 不用“构建成功”代替来源准确性、生成幂等、关键路由和真实运行时合同。
- 多 Agent 先证明任务可并行、子任务可独立验收和单位成功任务收益，再增加角色或通信拓扑。

## Verification

- `pnpm lg:smoke`：72/72。
- `pnpm lg:typecheck`、`pnpm typecheck`：通过。
- `pnpm agent:trends:test`：5/5；VitePress IA：7/7。
- registry / visuals / generator 定向测试：通过。
- KG：66 单元 / 335 概念 / 472 关系 / 257 文章；第二次生成 0 更新，10 个关键产物 hash 不变。
- VitePress 生产构建：通过；蓝图、L6、第 12/19 章 HTML 存在，本轮页面 Markdown/README 路由泄漏 0。

## Related

- [Sprint 计划与完整证据](../plans/2026-07-31-agent-trends-framework-evolution.md)
- [2026 Agent 趋势与五平面架构蓝图](../agent-trends-architecture.md)
- [LangGraph L6 · Event streaming 与前端投影](../../langgraph-advanced/06-event-streaming/README.md)
- [共享事件投影实现](../../src/shared/langgraph/eventStreaming.ts)
- [[2026-06-10-production-runner-streaming-ux]]
