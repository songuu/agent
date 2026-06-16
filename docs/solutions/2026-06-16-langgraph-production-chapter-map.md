---
title: "进阶 LangGraph 生产化章节地图"
date: 2026-06-16
tags: [solution, langgraph, curriculum, production, chapter-map]
aliases: ["langgraph production chapters", "LangGraph 生产化扩章"]
---

# 进阶 LangGraph 生产化章节地图

## Problem

已有 `langgraph-advanced/` 五章讲清了 StateGraph、条件边、checkpointer、HITL、多 agent 拓扑，但还停在“机制可解释”。要继续走向生产化，需要补齐事件流、长期记忆、子图模块化、容错、测试迁移、部署观测这些真实上线边界。

## Research Basis

官方资料把 LangGraph 的能力分成 capability 与 production 两组：streaming/event streaming、persistence/checkpointers/stores、subgraphs、fault tolerance 属于运行时能力；application structure、test、backward compatibility、deployment、observability 属于生产落地。核心判断：

- Event streaming 是新的 in-process streaming 推荐模型，能把 messages、state、subgraphs、output 等投影分开消费。
- Checkpointer 保存单个 thread 的图状态；store 保存跨 thread 的长期数据，二者通常组合使用。
- Subgraph 既是复用机制，也是多团队/多 agent 模块化边界，必须显式设计 schema 通信与持久化模式。
- Fault tolerance 需要 retry、timeout、error handler、graceful shutdown 组合，而不是只在节点里 catch；但官方 per-node timeout/error handler 文档面向 `@langchain/langgraph>=1.4.0`，本仓库 0.2.x 实现前必须先做版本 spike 或用 wrapper 仿真。
- Backward compatibility 是生产 LangGraph 特有风险：最新代码会作用于旧 checkpoint，图结构和 state 变更都要当 API 兼容看。

## Chapter Map

| 编号 | 章节 | 为什么值得做 | 验收形态 |
|------|------|--------------|----------|
| L6 | Event streaming 与前端投影 | 接第 14 章流式 UX，把图执行拆成可呈现、可过滤、可调试的事件通道 | 离线 graph 同时产生 `updates`/`values`/`custom`；事件归一化器有 smoke |
| L7 | Store 长期记忆与跨线程状态 | 接第 07 章记忆和 L3 checkpointer，区分短期 thread 状态与长期用户事实 | 两个 thread 状态隔离但共享 user store；命名空间/覆盖/查询有断言 |
| L8 | Subgraphs 与模块化 agent team | 接 L5 多 agent，把“大图”拆成可独立实现和测试的子图 | wrapper schema 转换 + shared schema direct node 两种模式都跑通 |
| L9 | Fault tolerance | 生产节点会慢、会失败、会中断；必须有 retry/timeout/recover/drain | 先验证安装版本；0.2.x 下可用 wrapper 仿真，升级 1.4.x 后再讲 per-node timeout/error handler |
| L10 | 生产测试与迁移兼容 | 上线后不能只跑 happy path；旧 checkpoint 遇到新代码必须可解释 | node test、partial execution、旧 state 兼容 smoke |
| L11 | 应用结构、部署与可观测 | 把 demo 图变成可部署应用，补 `langgraph.json`、env、trace、匿名化 | 生成结构样板 + fake trace tree + secret redaction 检查 |

## Implementation Guardrails

1. 不先把 planned 章节加入 `CHAPTERS`，避免 VitePress/sidebar/demo registry 指向不存在目录。
2. 每章仍按六件套原子落地：shared code、README、index demo、smoke、`graph.ts`、`visuals.ts`。
3. 生产主题也要离线优先：事件、store、subgraph、fault tolerance 都能用纯函数/内存实现展示。
4. 官方 docs 版本高于仓库时，先在当前依赖上 spike；不要把 1.x API 直接写进 0.2.x demo。
5. 与 RAG/frontier 并行改动共用 `graph.ts` / `visuals.ts`，实现前必须重读并只做锚点附近追加。

## Source Links

- LangGraph JS Event streaming: https://docs.langchain.com/oss/javascript/langgraph/event-streaming
- LangGraph JS Streaming: https://docs.langchain.com/oss/javascript/langgraph/streaming
- LangGraph JS Persistence: https://docs.langchain.com/oss/javascript/langgraph/persistence
- LangGraph JS Stores: https://docs.langchain.com/oss/javascript/langgraph/stores
- LangGraph JS Subgraphs: https://docs.langchain.com/oss/javascript/langgraph/use-subgraphs
- LangGraph JS Fault tolerance: https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance
- LangGraph JS Test: https://docs.langchain.com/oss/javascript/langgraph/test
- LangGraph JS Backward compatibility: https://docs.langchain.com/oss/javascript/langgraph/backward-compatibility
- LangGraph JS Application structure: https://docs.langchain.com/oss/javascript/langgraph/application-structure
- LangGraph JS Deployment: https://docs.langchain.com/oss/javascript/langgraph/deploy
- LangGraph JS Observability: https://docs.langchain.com/oss/javascript/langgraph/observability
