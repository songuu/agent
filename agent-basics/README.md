# 基础概念扩展专题

> 第 01-03 章已经把 Agent、LLM 调用、提示工程打通。本专题收集后续可以逐章补齐的基础概念，目标是在进入第 04 章手写 agent loop 前，把模型接口、上下文、工具、安全和评估的底层语言讲清楚。

## 为什么补这一层

很多初学者不是卡在代码，而是卡在概念边界：

- 把 LLM 当成数据库，期待它稳定返回事实。
- 把 prompt 当成魔法咒语，不知道消息、上下文、采样参数和工具 schema 才是可控面。
- 一上来写 agent loop，却还没分清 workflow、agent、tool call、memory、RAG、guardrail 各自解决什么问题。
- 学框架时只会照抄，不知道框架把哪些底层部件封装了。

所以基础概念不该只停在「什么是 Agent / 第一次调用 / 提示工程」。它还应该补一组可迁移的工程词汇。

## 建议扩章地图

| # | 候选章节 | 解决的问题 | 关键概念 | 来源线索 |
|---|----------|------------|----------|----------|
| B1 | LLM 是预测器，不是数据库 | 为什么模型会编造、为什么需要检索和校验 | token prediction、训练知识、事实性边界、校准 | OpenAI text generation、Model Spec |
| B2 | Messages、roles 与上下文窗口 | 为什么同一句话放在 system / user / developer 位置效果不同 | role hierarchy、message array、context window、conversation state | OpenAI text generation |
| B3 | Token、延迟与成本直觉 | 为什么长上下文慢、贵、还可能稀释重点 | token budget、input/output token、latency、截断、摘要 | OpenAI text generation、现有第 16 章 |
| B4 | 采样参数与可重复性 | temperature/top_p 不只是“创意按钮” | entropy、determinism、temperature、top_p、seed、eval stability | OpenAI text generation |
| B5 | 指令、约束与输出契约 | prompt 不只是文案，而是接口协议 | instruction hierarchy、format contract、examples、negative constraints | OpenAI prompting、现有第 13 章 |
| B6 | Tool calling 心智模型 | 模型不会真的执行工具，它只提出结构化请求 | function schema、tool call、tool result、argument validation | OpenAI function calling、现有第 05/06 章 |
| B7 | Workflow vs Agent | 什么时候用固定流程，什么时候允许模型自主决策 | workflow、agent autonomy、routing、planner、control flow | Anthropic building effective agents |
| B8 | Memory、RAG 与上下文不是一回事 | 为什么聊天历史、长期记忆、知识库检索要分层 | short-term memory、long-term memory、retrieval、grounding | 现有第 07-09 章、LangChain agents |
| B9 | Structured Output 基础 | 为什么 JSON 输出要先当“不可信输入”处理 | schema、parser、retry-repair、validation error、fallback | OpenAI structured outputs、现有第 13 章 |
| B10 | Guardrails 入门 | 为什么安全不是最后加一个过滤词表 | prompt injection、permission boundary、confirmation、output filter | OpenAI Agents guardrails、现有第 17 章 |
| B11 | Evaluation 先行 | 为什么 agent demo 需要最小 eval 集才能继续迭代 | golden set、regression、judge、assertion、failure taxonomy | OpenAI evals、现有第 15 章 |
| B12 | Framework 地图预备课 | 学框架前先知道框架在替你管理哪几件事 | agent runtime、state、tool registry、handoff、observability | OpenAI Agents SDK、LangChain agents、LangGraph |

## 推荐落地顺序

第一批优先补 B1-B4。它们决定读者是否理解「模型调用」本身。

第二批补 B5-B8。它们直接承接第 03 章提示工程，并为第 04-07 章手写核心铺路。

第三批补 B9-B12。它们提前埋下第 13-17 章生产化能力，防止读者把结构化输出、评估、安全误解成后期补丁。

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

## 下一步拆章建议

先不要一次创建 12 个空章节。更稳的路径：

1. 先把 B1-B4 写成完整 `agent-basics/01-04-*` 四章，每章含图解、概念边界、一个无需 API key 的小练习。
2. 再把 B5-B8 接到现有第 03-07 章，避免重复讲 prompt / tool / memory。
3. 最后把 B9-B12 作为第 13-17 章的预备阅读，形成「基础概念先埋点，生产化再落地」的闭环。
