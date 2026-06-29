# LlamaIndex 源码解析

> 一句话：LlamaIndex 是 data-first 的 agent/RAG 框架。它的主线不是先问“agent 怎么循环”，而是先问“数据如何入索引、如何检索、如何合成答案，再如何接进 workflow/agent”。

用户输入里的 `lamdaIndex` 这里按业界常用项目名 **LlamaIndex** 处理。

源码入口按 2026-06-29 官方仓库主干核对：

| 入口 | 读什么 |
|------|--------|
| [`llama-index-core/llama_index/core/query_engine/retriever_query_engine.py`](https://github.com/run-llama/llama_index/blob/main/llama-index-core/llama_index/core/query_engine/retriever_query_engine.py) | query engine 如何把 retriever、node postprocessor、response synthesizer 串起来 |
| [`llama-index-core/llama_index/core/agent/workflow/base_agent.py`](https://github.com/run-llama/llama_index/blob/main/llama-index-core/llama_index/core/agent/workflow/base_agent.py) | agent workflow 的 base agent、tool、handoff、event 基础 |
| [`llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py`](https://github.com/run-llama/llama_index/blob/main/llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py) | 多 agent workflow 如何围绕 events、handoff 和 current agent 状态推进 |
| [`llama-index-core/llama_index/core/workflow/workflow.py`](https://github.com/run-llama/llama_index/blob/main/llama-index-core/llama_index/core/workflow/workflow.py) | 通用 workflow runtime：step、event、context、run |

## 先用 data-first 心智读它

LangChain 更像“组件组合框架”，LangGraph 更像“状态机 runtime”，LlamaIndex 更像“围绕数据和索引组织的应用框架”。

| 层 | 核心问题 |
|----|----------|
| Document / Node | 原始资料如何被切成可检索单元？ |
| Index | 节点如何进入向量索引、关键词索引或其他存储结构？ |
| Retriever | 查询如何取回相关节点？ |
| QueryEngine | 检索结果如何后处理并合成答案？ |
| Workflow / Agent | 多步检索、工具调用、handoff 如何用事件流组织？ |

所以读 LlamaIndex 源码，最好从 RAG query path 开始，而不是直接跳 agent。

## QueryEngine 主链路

`retriever_query_engine.py` 可以按这条线读：

```text
query
  -> retriever 取回 nodes
  -> node postprocessors 过滤/重排/补 metadata
  -> response synthesizer 合成答案
  -> callback/event 记录过程
  -> response 返回 text + source nodes
```

它和第 09 章手写 RAG 的对应关系非常直接：

| 第 09 章手写 RAG | LlamaIndex |
|------------------|------------|
| `chunk()` | Node parsing / ingestion |
| `MemoryVectorStore.search()` | Retriever |
| `buildContext()` | node postprocessors + synthesizer 输入 |
| `generateAnswer()` | response synthesizer |
| citation/source chunks | source nodes |

关键判断：LlamaIndex 把“检索后上下文怎么处理”作为 query engine 的核心职责，而不是把它藏在 prompt 里。

## Agent workflow：工具也是数据路径的一部分

读 `base_agent.py` 时，不要只找“循环”。重点看 agent 如何声明：

| 对象 | 意义 |
|------|------|
| tools | agent 可以调用的外部能力，也可以是 query engine 封装成的工具。 |
| events | workflow 中的状态推进信号。 |
| handoff | 当前 agent 把控制权交给另一个 agent。 |
| context | 跨 step 共享状态，而不是散落全局变量。 |

这和 LangGraph 的 state channel 很像，但 LlamaIndex 更强调事件和数据工具。

## MultiAgentWorkflow 的读法

`multi_agent_workflow.py` 可以用这条主线：

```text
user input
  -> 当前 agent 接收 context
  -> agent 选择工具或产出回答
  -> 工具结果作为 event 写回
  -> 如果需要 handoff，切换 current agent
  -> 直到产生 final response
```

读它时重点看“current agent”如何被记录和切换。多 agent 的本质不是多个 prompt 放在一起，而是控制权、上下文和事件流要有明确归属。

## Workflow runtime

`workflow.py` 是更底层的事件运行时。它回答三个问题：

| 问题 | 源码里要找 |
|------|------------|
| step 怎么注册？ | step decorator / step config |
| event 怎么推进？ | event dispatch / queue / handler |
| context 怎么共享？ | context object / run state |

如果你已经学了 LangGraph，可以把 LlamaIndex Workflow 理解为另一种控制流表达：LangGraph 更像显式图，LlamaIndex Workflow 更像事件驱动 pipeline。

## 读源码的顺序

1. 先读 `retriever_query_engine.py`，把 RAG 查询链路走通。
2. 找 `BaseRetriever`、node postprocessor、response synthesizer 的接口边界。
3. 再读 `base_agent.py`，看 query engine 如何被包装成 agent 可用工具。
4. 读 `multi_agent_workflow.py`，确认 handoff 和 current agent 状态怎么推进。
5. 最后读 `workflow.py`，理解通用 event runtime。

## 和手写版的对照

| 本课程手写层 | LlamaIndex 对应层 |
|--------------|-------------------|
| 文档切块 | Node parser / ingestion |
| 向量检索 | retriever |
| context builder | postprocessor + synthesizer 输入 |
| RAG 回答 | query engine |
| tool agent | agent workflow tools |
| 多 agent supervisor | multi agent workflow + handoff |

## 自检问题

- QueryEngine 返回的是纯文本，还是同时携带 source nodes？
- Retriever 和 ResponseSynthesizer 之间为什么需要 node postprocessor？
- 一个 query engine 什么时候可以被包装成 tool 给 agent 调用？
- MultiAgentWorkflow 的 handoff 是 prompt 约定，还是 workflow 状态变化？
