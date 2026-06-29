# LangGraph 源码解析

> 一句话：LangGraph 把 agent loop 变成显式状态图。源码主线是 `StateGraph` 定义图，`compile()` 生成 Pregel-style runtime，再由 checkpoint、stream、interrupt 把长流程变成可恢复系统。

源码入口按 2026-06-29 官方仓库主干核对：

| 入口 | 读什么 |
|------|--------|
| [`libs/langgraph/langgraph/graph/state.py`](https://github.com/langchain-ai/langgraph/blob/main/libs/langgraph/langgraph/graph/state.py) | `StateGraph`、state schema、channel、reducer、node、edge、compile |
| [`libs/langgraph/langgraph/pregel/main.py`](https://github.com/langchain-ai/langgraph/blob/main/libs/langgraph/langgraph/pregel/main.py) | 编译后 runtime 如何按 super-step 执行、stream、checkpoint、resume |
| [`libs/prebuilt/langgraph/prebuilt/chat_agent_executor.py`](https://github.com/langchain-ai/langgraph/blob/main/libs/prebuilt/langgraph/prebuilt/chat_agent_executor.py) | `create_react_agent` 预制 agent 图如何把模型节点和工具节点接成循环 |
| [`libs/prebuilt/langgraph/prebuilt/tool_node.py`](https://github.com/langchain-ai/langgraph/blob/main/libs/prebuilt/langgraph/prebuilt/tool_node.py) | tool node 如何读取 tool calls、执行工具、把结果写回 messages |

## 先抓住三个对象

| 对象 | 心智模型 |
|------|----------|
| `StateGraph` | 图的声明阶段：定义 state、节点、边、条件边。 |
| `CompiledStateGraph` / Pregel runtime | 图的执行阶段：按边推进节点，合并 partial state，处理 stream/checkpoint。 |
| prebuilt agent | 框架帮你预接好的图：模型节点 -> 工具节点 -> 模型节点，直到没有 tool call。 |

这三层不能混在一起。`StateGraph` 不是执行器，它只是 DSL；真正跑起来的是 compile 后的 runtime。

## `StateGraph` 的核心：state + reducer

手写 agent loop 里，状态通常是几个变量：

```ts
let messages = [];
let steps = 0;
let finalAnswer = "";
```

LangGraph 把它提升成 schema 和 channel。每个节点返回 partial update，runtime 决定如何合并：

| channel 行为 | 结果 |
|--------------|------|
| 默认 replace | 后写覆盖先写，适合 `status`、`route`、`finalAnswer`。 |
| reducer append | 多个节点写入时累积，适合 `messages`、`events`、`findings`。 |
| 自定义 reducer | 你定义冲突合并规则，适合分数、投票、并行结果归并。 |

这就是进阶 LangGraph L1 反复强调的边界：节点不该直接改全局对象，而是返回 partial update。

## compile 后进入 Pregel-style runtime

读 `pregel/main.py` 时，用这条线索：

```text
input state
  -> 找到当前可运行节点
  -> 节点读 state，产出 partial update
  -> reducer 合并到下一版 state
  -> checkpoint/stream 输出本 super-step 结果
  -> 根据边和条件边决定下一批节点
  -> 直到 END 或达到 recursion limit
```

为什么叫 super-step？因为一轮里可能有多个节点并行运行，然后统一合并状态。多 agent 并行 team 的“join 顺序无关”就依赖这个模型。

## prebuilt `create_react_agent` 只是预制图

`chat_agent_executor.py` 值得读，因为它能打破一个误解：`create_react_agent` 不是某个神秘 agent，它只是预先搭好的 StateGraph。

```text
START
  -> agent/model node
  -> 如果 AIMessage 有 tool_calls: tools node
  -> tools node 写回 ToolMessage
  -> 回到 agent/model node
  -> 如果没有 tool_calls: END
```

这和第 04 章手写 ReAct loop 是同一个骨架，只是 LangGraph 把“回到哪一步、状态怎么合并、怎么持久化”变成 runtime 规则。

## tool node 是工具执行边界

读 `tool_node.py` 时重点看四件事：

| 步骤 | 为什么重要 |
|------|------------|
| 从最后一条 AI message 取 tool calls | 模型只是请求工具，执行权仍在代码。 |
| 解析工具名和参数 | 参数仍是不可信输入。 |
| 执行工具并捕获异常 | 错误必须变成可回灌状态。 |
| 写回 `ToolMessage` | 下一轮模型节点才能看见 observation。 |

这和第 05/06 章完全对应：模型请求调用，本地代码校验和执行，再把 observation 回灌。

## checkpoint 是长流程的分水岭

没有 checkpoint 的图，只是好看的函数调用。加上 checkpoint 后，图才具备生产 runtime 属性：

| 能力 | 来源 |
|------|------|
| 同一 `thread_id` 跨 invoke 续上 | 每个 super-step 状态落进 checkpointer。 |
| Human-in-the-loop 暂停恢复 | interrupt 暂停点必须能恢复。 |
| time travel / state history | 过去状态可读、可改、可从中间点重放。 |
| 失败后重试 | 失败点附近的状态可被定位。 |

对照课程：L3 checkpoint、L4 HITL、L5 多 agent 都是建立在同一个 runtime 心智模型上。

## 读源码的顺序

1. 从 `state.py` 读 `StateGraph` 的 node / edge / conditional edge / compile。
2. 跳到 `pregel/main.py`，只追执行循环、stream、checkpoint 相关函数。
3. 回到 `chat_agent_executor.py`，看预制 ReAct 图如何使用这些底层能力。
4. 读 `tool_node.py`，确认 tool call -> ToolMessage 的闭环。
5. 对照本仓库 `langgraph-advanced/` 的 L1-L5，每章只证明一个机制。

## 和手写版的对照

| 本课程手写层 | LangGraph 对应层 |
|--------------|------------------|
| `while (steps < maxSteps)` | 条件边 + recursionLimit |
| `messages.push(...)` | messages channel + reducer |
| `toolRegistry.run(...)` | `ToolNode` |
| `onStep` 输出 | stream modes / event stream |
| 手动保存上下文 | checkpointer + thread_id |
| 人工确认 if/else | interrupt + Command(resume) |

## 自检问题

- 一个节点返回 partial update 时，哪些字段会 replace，哪些字段会 append？
- `create_react_agent` 里的循环边在哪里闭合？
- checkpoint 是保存模型回答，还是保存每个 super-step 的状态？
- 并行节点同时写同一个 channel 时，reducer 如何保证结果可预测？
