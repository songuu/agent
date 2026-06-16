# 进阶 LangGraph 专题

> 从手写 `StateGraph` 到生产化运行时。已实现章节优先讲清机制；后续生产化章节先收集为路线图，等逐章实现时再进入知识图谱六件套。

## 已完成章节

| # | 章节 | 重点 | 运行 |
|---|------|------|------|
| L1 | [手写 StateGraph](./01-stategraph-basics/README.md) | State / reducer / node / edge / compile / invoke | `npx tsx langgraph-advanced/01-stategraph-basics/index.ts` |
| L2 | [条件边与路由](./02-conditional-routing/README.md) | 分支、循环、`recursionLimit`、`Send` 扇出 | `npx tsx langgraph-advanced/02-conditional-routing/index.ts` |
| L3 | [Checkpointer 持久化与时间旅行](./03-checkpointing/README.md) | `thread_id`、`getState`、history、`updateState` | `npx tsx langgraph-advanced/03-checkpointing/index.ts` |
| L4 | [Human-in-the-Loop](./04-human-in-the-loop/README.md) | `interrupt` 暂停、payload、`Command(resume)` | `npx tsx langgraph-advanced/04-human-in-the-loop/index.ts` |
| L5 | [多 Agent 编排](./05-multi-agent-graph/README.md) | supervisor 调度、并行 team、join 聚合 | `npx tsx langgraph-advanced/05-multi-agent-graph/index.ts` |

整体验证：

```bash
npm run lg:smoke
```

## 生产化扩章地图

这些章节暂不进入 `CHAPTERS`，因为还没有对应可运行目录。等逐章实现时，每章必须补齐 README、demo、shared 代码、smoke、知识图谱、概念可视化六件套。

| 优先级 | 候选章节 | 生产问题 | 离线 demo 设计 | 主要来源 |
|--------|----------|----------|----------------|----------|
| MUST | L6 · Event streaming 与前端投影 | 图执行不是一个最终答案，而是一串 state/token/tool/custom 事件；前端要区分哪些给用户看、哪些只给调试/内部状态用 | 用纯函数图发出 `updates` / `values` / `custom`，对比 `streamEvents` 的 messages/state/output 投影；做一个事件归一化器，不接 LLM | [Event streaming](https://docs.langchain.com/oss/javascript/langgraph/event-streaming), [Streaming](https://docs.langchain.com/oss/javascript/langgraph/streaming) |
| MUST | L7 · Store 长期记忆与跨线程状态 | checkpointer 只管单线程短期状态；生产 agent 还需要跨线程的用户偏好、事实、共享知识 | `InMemoryStore` 命名空间写入用户偏好；两条 `thread_id` 共用 store、各自 checkpointer 隔离 | [Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence), [Stores](https://docs.langchain.com/oss/javascript/langgraph/stores) |
| MUST | L8 · Subgraphs 与模块化 agent team | 大图需要拆给不同团队/不同 agent；关键是 parent/subgraph 的 state schema 边界和持久化模式 | 两个子图：一个 wrapper 转换私有 schema，一个共享 state 直接作为节点；演示 per-invocation / per-thread 差异 | [Subgraphs](https://docs.langchain.com/oss/javascript/langgraph/use-subgraphs) |
| SHOULD | L9 · Fault tolerance：重试、超时、恢复 | 外部 API 慢、失败、抛错时，生产图不能直接崩；需要 retry、timeout、error handler、graceful shutdown | 先做版本 gate：官方 per-node timeout/error handler 要求 `@langchain/langgraph>=1.4.0`；若仓库仍停在 0.2.x，则用纯函数 wrapper 仿真 retry/timeout/recover，不直接照抄 API | [Fault tolerance](https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance) |
| SHOULD | L10 · 生产测试与图迁移兼容 | 图上线后会有旧 checkpoint；改 state/schema/topology 就是对历史状态做兼容迁移 | 节点级测试、partial execution、`updateState` 注入中间状态；模拟旧 state 字段缺失并做兼容读取 | [Test](https://docs.langchain.com/oss/javascript/langgraph/test), [Backward compatibility](https://docs.langchain.com/oss/javascript/langgraph/backward-compatibility) |
| SHOULD | L11 · 应用结构、部署与可观测 | 生产不是 `npx tsx`，而是 repo 结构、`langgraph.json`、环境变量、部署、trace、敏感日志边界 | 生成最小 `langgraph.json` 样板和本地检查器；用 fake tracer 记录 run tree、metadata、匿名化字段 | [Application structure](https://docs.langchain.com/oss/javascript/langgraph/application-structure), [LangSmith Deployment](https://docs.langchain.com/oss/javascript/langgraph/deploy), [LangSmith Observability](https://docs.langchain.com/oss/javascript/langgraph/observability) |

## 实现顺序建议

1. 先做 L6：它直接连接第 14 章流式 UX，也是 LangGraph 生产体验的第一层。
2. 再做 L7 / L8：一个补长期记忆，一个补模块化边界，都是 L5 多 agent 后的自然延伸。
3. 最后做 L9-L11：这三章是上线纪律，建议每章都写回归测试，不只写讲义。

## 章节实现不变量

- 仍保持 `needsKey: "none"` 优先；生产机制能用纯函数演示就不用真实 LLM。
- 当前官方 docs 与本仓库 `@langchain/langgraph` 0.2.x API 可能不完全一致；每章开工前先 spike 真实安装版本，尤其 L9 fault tolerance。
- 每条结论必须由 `invariant()` 或 smoke 断言坐实，避免“文档说生产化、代码只是玩具”。
- 不把 planned 章节写入 `knowledge-graph/data/graph.ts`，除非目录、demo、visual、smoke 同步落地。
- 触碰 `graph.ts` / `visuals.ts` 前先重读锚点，避免和并行 RAG/frontier sprint 冲突。
