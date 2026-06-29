# LangChain 源码解析

> 一句话：LangChain 的主线不是“一个 agent 类”，而是 `Runnable` 组合能力、agent factory、middleware、structured output、LangGraph runtime 这几层叠出来的开发体验。

源码入口按 2026-06-29 官方仓库主干核对：

| 入口 | 读什么 |
|------|--------|
| [`libs/langchain_v1/langchain/agents/factory.py`](https://github.com/langchain-ai/langchain/blob/master/libs/langchain_v1/langchain/agents/factory.py) | `create_agent` 如何组装模型、工具、middleware、response format 和图 runtime |
| [`libs/langchain_v1/langchain/agents/middleware/types.py`](https://github.com/langchain-ai/langchain/blob/master/libs/langchain_v1/langchain/agents/middleware/types.py) | middleware 在模型调用、工具调用、状态更新前后插入扩展点 |
| [`libs/langchain_v1/langchain/agents/structured_output.py`](https://github.com/langchain-ai/langchain/blob/master/libs/langchain_v1/langchain/agents/structured_output.py) | provider-native structured output 与 tool-call structured output 的策略分流 |
| [`libs/core/langchain_core/runnables/base.py`](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/runnables/base.py) | `Runnable` 的 `invoke` / `batch` / `stream` / composition 基础协议 |

## 先拆仓库层次

LangChain 现在要分清三层：

| 层 | 作用 | 读源码时的判断 |
|----|------|----------------|
| `langchain_core` | 最底层协议，放 messages、tools、runnables、callbacks 等共用抽象 | 这是稳定心智模型，优先读。 |
| `langchain_v1` | 新 agent 入口与更现代的 agent runtime 包装 | 读 `create_agent` 主线。 |
| `langchain_classic` / 旧链路 | 兼容旧 chains、classic agents、legacy retrievers | 只在维护老项目时回头读。 |

这意味着读 LangChain 不要从“某个 Chain 类”开始，而要从 `Runnable` 和 `create_agent` 开始。

## 主链路：`create_agent` 做了什么

可以把 `create_agent` 理解成一个装配函数：

```text
用户参数
  -> 规范化 model / tools / middleware / response_format
  -> 把模型调用包成 agent node
  -> 把工具执行包成 tool node
  -> 把结构化输出策略接入模型或工具调用
  -> 生成可循环的 graph runtime
  -> 返回一个可 invoke / stream 的 agent
```

关键判断：LangChain agent 的“循环”已经不再只是一个手写 `while`，而是把循环下沉到图 runtime。公开 API 看起来还是 `agent.invoke(...)`，内部要读成“编译好的图在执行”。

## `Runnable` 是底层通用接口

如果你只读 agent 层，会漏掉 LangChain 的真正统一口径：`Runnable`。

| 能力 | 为什么重要 |
|------|------------|
| `invoke` | 单输入单输出，是所有 runnable 的最低执行面。 |
| `batch` | 同一 runnable 批量执行，框架可以统一调度并发。 |
| `stream` | 流式输出不是 agent 特例，而是 runnable 协议的一部分。 |
| composition | prompt、model、parser、retriever 可以组合成链，减少胶水代码。 |

对照本课程：第 02 章的 `LLMClient.chat/stream` 是最小接口；LangChain 把这个接口扩大成所有组件的统一协议。

## middleware 是生产扩展点

middleware 的价值不是“多一个 hook”，而是把生产横切逻辑从业务 prompt 里拿出来：

| hook 类型 | 常见用途 |
|-----------|----------|
| model 前后 | 动态 system prompt、模型选择、token 预算、trace metadata。 |
| tool 前后 | 权限检查、参数改写、错误标准化、敏感工具审批。 |
| state 前后 | 压缩消息、注入上下文、清理中间状态。 |

对照第 06 章：我们手写 `ToolRegistry.run()` 时把校验和错误回传放在本地边界。LangChain middleware 把这些边界做成可组合插件。

## structured output 是两条路

读 `structured_output.py` 时重点看策略分流，而不是背类名：

| 策略 | 适合场景 | 风险 |
|------|----------|------|
| Provider strategy | 模型/厂商原生支持结构化输出 | 依赖 provider 能力，迁移时要重新验证。 |
| Tool strategy | 把 schema 伪装成 tool call | 通用性强，但会占用 tool-call 路径，错误修复要更明确。 |

对照第 13 章：课程里用 zod + retry-repair 把 JSON 变成可测试契约；LangChain 则把“怎么让模型吐结构化对象”抽成策略。

## 读源码的顺序

1. 打开 `factory.py`，先找 `create_agent` 的参数如何被规范化。
2. 找 model node 和 tool node 的创建点，确认工具调用回路在哪里闭合。
3. 跳到 `structured_output.py`，看 response format 如何进入模型调用或工具调用。
4. 跳到 middleware types，看 hook 能插入哪些生命周期位置。
5. 最后读 `Runnable`，把 agent、chain、retriever、parser 都放回统一调用协议。

## 和手写版的对照

| 本课程手写层 | LangChain 对应层 |
|--------------|------------------|
| `runAgent` 的循环 | agent graph runtime |
| `ToolRegistry` | tools + tool node + middleware |
| `LLMClient.chat/stream` | `Runnable.invoke/stream` + chat model |
| JSON schema + retry | structured output strategy |
| `onStep` / console trace | callback / tracing / middleware |

## 自检问题

- `create_agent` 返回的对象为什么能 `invoke`，它背后接的是哪类 runtime？
- 工具执行失败时，错误是在工具层、middleware 层还是模型层被处理？
- structured output 走 provider-native 和 tool-call 两条路时，哪条更容易迁移？
- 如果要加“高风险工具必须审批”，应该改 prompt、改 tool，还是加 middleware？
