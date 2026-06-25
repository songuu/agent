# 基础概念扩展专题

> 第 01-03 章已经把 Agent、LLM 调用、提示工程打通。本专题把进入第 04 章手写 agent loop 前最容易误解的底层语言补齐：模型接口、上下文、工具、安全、评估和框架 runtime。

## 为什么补这一层

很多初学者不是卡在代码，而是卡在概念边界：

- 把 LLM 当成数据库，期待它稳定返回事实。
- 把 prompt 当成魔法咒语，不知道 messages、上下文、采样参数和工具 schema 才是可控面。
- 一上来写 agent loop，却还没分清 workflow、agent、tool call、memory、RAG、guardrail 各自解决什么问题。
- 学框架时只会照抄，不知道框架把哪些底层部件封装了。

所以基础概念不该只停在「什么是 Agent / 第一次调用 / 提示工程」。它还应该补一组可迁移的工程词汇。

## 已落地指南目录

| # | 指南 | 先解决的问题 | 读完应能说清 |
|---|------|--------------|--------------|
| B1 | [LLM 是预测器，不是数据库](./01-llm-as-predictor.md) | 为什么模型会编造、为什么需要检索和校验 | 模型生成、事实源、拒答和引用的边界 |
| B2 | [Messages、Roles 与上下文窗口](./02-messages-roles-context.md) | system / user / tool 消息到底怎么影响回答 | message array、role 分工、context 装配 |
| B3 | [Token、延迟与成本直觉](./03-token-latency-cost.md) | 为什么长上下文慢、贵、还会稀释重点 | token budget、步骤成本、上下文压缩 |
| B4 | [采样参数与可重复性](./04-sampling-repeatability.md) | temperature / top_p 不是“创意按钮” | 稳定任务和创意任务的参数取舍 |
| B5 | [指令、约束与输出契约](./05-instructions-output-contracts.md) | prompt 如何从文案变成接口协议 | 角色、任务、格式、失败策略、示例 |
| B6 | [Tool Calling 心智模型](./06-tool-calling-mental-model.md) | 模型为什么不会真的执行工具 | 请求/执行职责边界、schema、错误回传 |
| B7 | [Workflow vs Agent](./07-workflow-vs-agent.md) | 什么时候固定流程，什么时候让模型自主 | workflow、agent autonomy、混合模式 |
| B8 | [Memory、RAG 与 Context 不是一回事](./08-memory-rag-context.md) | 聊天历史、长期记忆、知识库检索如何分层 | memory、RAG、context builder 的职责 |
| B9 | [Structured Output 基础](./09-structured-output-basics.md) | 为什么 JSON 也要当不可信输入处理 | parse、validate、repair、fallback |
| B10 | [Guardrails 入门](./10-guardrails-intro.md) | 安全为什么不是最后加过滤词表 | 输入、检索、工具、输出、人审多层护栏 |
| B11 | [Evaluation 先行](./11-evaluation-first.md) | 为什么 agent demo 需要最小 eval 集 | golden set、失败分类、回归门 |
| B12 | [Framework 与 Runtime 地图预备课](./12-framework-runtime-map.md) | 学框架前先知道框架在管什么 | runtime 部件、迁移策略、框架边界 |

如果你想按 agent 类型倒推学习路线，先看 [Agent 学习指南与分类地图](../docs/agent-learning-guides.md)。

## 扩章地图

| # | 指南 | 解决的问题 | 关键概念 | 来源线索 |
|---|------|------------|----------|----------|
| B1 | [LLM 是预测器，不是数据库](./01-llm-as-predictor.md) | 为什么模型会编造、为什么需要检索和校验 | token prediction、训练知识、事实性边界、校准 | OpenAI text generation、Model Spec |
| B2 | [Messages、roles 与上下文窗口](./02-messages-roles-context.md) | 为什么同一句话放在 system / user / developer 位置效果不同 | role hierarchy、message array、context window、conversation state | OpenAI text generation |
| B3 | [Token、延迟与成本直觉](./03-token-latency-cost.md) | 为什么长上下文慢、贵、还可能稀释重点 | token budget、input/output token、latency、截断、摘要 | OpenAI text generation、现有第 16 章 |
| B4 | [采样参数与可重复性](./04-sampling-repeatability.md) | temperature/top_p 不只是“创意按钮” | entropy、determinism、temperature、top_p、seed、eval stability | OpenAI text generation |
| B5 | [指令、约束与输出契约](./05-instructions-output-contracts.md) | prompt 不只是文案，而是接口协议 | instruction hierarchy、format contract、examples、negative constraints | OpenAI prompting、现有第 13 章 |
| B6 | [Tool calling 心智模型](./06-tool-calling-mental-model.md) | 模型不会真的执行工具，它只提出结构化请求 | function schema、tool call、tool result、argument validation | OpenAI function calling、现有第 05/06 章 |
| B7 | [Workflow vs Agent](./07-workflow-vs-agent.md) | 什么时候用固定流程，什么时候允许模型自主决策 | workflow、agent autonomy、routing、planner、control flow | Anthropic building effective agents |
| B8 | [Memory、RAG 与上下文不是一回事](./08-memory-rag-context.md) | 为什么聊天历史、长期记忆、知识库检索要分层 | short-term memory、long-term memory、retrieval、grounding | 现有第 07-09 章、LangChain agents |
| B9 | [Structured Output 基础](./09-structured-output-basics.md) | 为什么 JSON 输出要先当“不可信输入”处理 | schema、parser、retry-repair、validation error、fallback | OpenAI structured outputs、现有第 13 章 |
| B10 | [Guardrails 入门](./10-guardrails-intro.md) | 为什么安全不是最后加一个过滤词表 | prompt injection、permission boundary、confirmation、output filter | OpenAI Agents guardrails、现有第 17 章 |
| B11 | [Evaluation 先行](./11-evaluation-first.md) | 为什么 agent demo 需要最小 eval 集才能继续迭代 | golden set、regression、judge、assertion、failure taxonomy | OpenAI evals、现有第 15 章 |
| B12 | [Framework 地图预备课](./12-framework-runtime-map.md) | 学框架前先知道框架在替你管理哪几件事 | agent runtime、state、tool registry、handoff、observability | OpenAI Agents SDK、LangChain agents、LangGraph |

## 推荐学习顺序

第一批读 B1-B4。它们决定读者是否理解「模型调用」本身。

第二批读 B5-B8。它们直接承接第 03 章提示工程，并为第 04-07 章手写核心铺路。

第三批读 B9-B12。它们提前埋下第 13-17 章生产化能力，防止读者把结构化输出、评估、安全误解成后期补丁。

## 与现有章节的关系

| 现有章节 | 当前承担 | 扩展专题补什么 |
|----------|----------|----------------|
| 01 什么是 Agent | LLM vs Agent、感知-决策-行动 | workflow vs agent、autonomy 边界、框架地图 |
| 02 第一次 LLM 调用 | provider 无关客户端、chat/stream/token | role/message/context/cost/sampling 的底层解释 |
| 03 提示工程 | system/few-shot/CoT/temperature | 指令层级、输出契约、可重复性、结构化失败处理 |
| 04 Agent 循环 | 手写 Thought/Action/Observation | 进入前先理解 tool call 不是 tool execution |
| 05-06 工具 | 原生 function calling 和工具系统 | schema、权限、校验、错误恢复的先修词汇 |
| 07-09 记忆/RAG | 上下文、检索、引用 | memory / RAG / context 的边界语言 |

## 资料来源

- [OpenAI Text generation guide](https://platform.openai.com/docs/guides/text-generation)
- [OpenAI Function calling guide](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-js/)
- [OpenAI Model Spec](https://model-spec.openai.com/)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [LangChain.js agents overview](https://docs.langchain.com/oss/javascript/langchain/agents)
- [Model Context Protocol introduction](https://modelcontextprotocol.io/introduction)

## 后续扩充建议

12 篇基础指南已经落地。下一步更适合沿两条线继续扩：

1. 给每篇指南补一个可运行的微型练习，优先保持免 API key。
2. 把 B6/B9/B10/B11 的练习接到第 05/13/17/15 章测试样例里。
3. 为不同目标读者继续扩展路线：求职、创业、企业知识库、coding agent、monitoring agent。
