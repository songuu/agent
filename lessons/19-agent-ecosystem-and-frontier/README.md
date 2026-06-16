# 第 19 章 · Agent 前沿发展与生态拆解

> 所属阶段：**第七部分 · 前沿与生态**
> 预计用时：70 分钟 | 难度：⭐⭐⭐☆☆
> 资料时间：截至 2026-06-03，基于官方文档与公告整理；生态变化很快，选型前请复核官方链接。
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [知识图谱](../../docs/knowledge-graph.md)

## 学习目标

学完本章你能够：

- [ ] 说清 2025–2026 年 agent 发展的主线：从手写 loop 走向 **模型原生工具、标准协议、可观测 runtime、企业治理**。
- [ ] 区分 **模型 API / Agent SDK / 编排 runtime / 工具协议 / 数据层 / UI 层 / 评估治理** 这些生态层。
- [ ] 解释 **MCP** 和 **A2A** 分别解决什么问题：一个偏“agent 连工具/数据”，一个偏“agent 连 agent”。
- [ ] 用一张选型矩阵判断：什么时候该用 Vercel AI SDK、OpenAI Agents SDK、LangGraph、CrewAI、LlamaIndex，什么时候继续手写。
- [ ] 形成“先手写原理，再选生态部件”的判断力，不被框架名词带跑。

## 前置知识

- 已读 [第 04 章 · Agent 循环](../04-the-agent-loop/README.md)，理解 agent loop。
- 已读 [第 06 章 · 工具系统](../06-building-a-tool-system/README.md)，理解 schema、tool registry、运行期校验。
- 已读 [第 09 章 · RAG](../09-rag-from-scratch/README.md)、[第 12 章 · 框架入门](../12-intro-to-frameworks/README.md)、[第 16 章 · 可观测性](../16-observability-and-cost/README.md)。

## 三层学习路线

| 层级 | 学习目标 | 你要完成什么 |
|------|----------|--------------|
| 极简 | 把 agent 生态拆成清晰层级。 | 能区分模型接口、工具协议、Agent SDK、编排 runtime、RAG、UI、观测和安全治理。 |
| 进阶 | 理解 MCP、A2A、SDK、runtime 的边界。 | 解释 MCP 连接工具和数据,A2A 连接 agent,框架负责控制流和持久化。 |
| 真实实践 | 为真实项目做生态选型和迁移路线。 | 根据一个产品需求选择手写、Vercel AI SDK、OpenAI Agents SDK、LangGraph、CrewAI 或 LlamaIndex,并说明取舍。 |

---

## 图解学习地图

> 读图顺序：先从底层模型能力往上看，再从产品需求往下选型。核心焦点：**把 agent 生态拆成可替换的工程层**。

```mermaid
flowchart TB
  A["模型与推理接口\nResponses / chat / multimodal / reasoning"] --> B["工具与上下文协议\nFunction tools / MCP / hosted tools"]
  B --> C["Agent SDK\nloop / handoff / guardrails / sessions"]
  C --> D["编排 runtime\nLangGraph / CrewAI / workflows / durable execution"]
  D --> E["数据与记忆\nRAG / vector DB / long-term memory"]
  E --> F["产品体验\nchat UI / streaming / voice / computer use"]
  F --> G["生产治理\ntracing / eval / cost / policy / human review"]

  H["A2A"] -.-> D
  H -.-> G
  I["MCP"] -.-> B
  I -.-> E
```

### 原理展开

- 当前 agent 生态的核心变化，不是“又多了一个框架”，而是**分层开始标准化**：模型平台提供 hosted tools，MCP 统一工具/数据接入，A2A 尝试统一 agent 间通信，编排 runtime 负责持久化和人类介入。
- 真正生产化的 agent 不只是 `while + tool call`。它需要会恢复、会被观察、能被评估、能限权、能让人插手，还要能和外部工具、内部数据库、其他 agent 协作。
- 生态选型要从约束出发：你要的是前端流式体验、长任务恢复、企业自动化、多 agent 分工、数据问答，还是 hosted tool / computer use。不同目标对应不同栈。

### 本章和整条路径的关系

前 18 章教你从零造出 agent 的每个零件；本章教你看懂真实生态里这些零件被谁封装、谁标准化、谁负责上线风险。学完后你能更冷静地选框架，而不是被“agent 平台”四个字带着走。

---

## 一、最新发展主线：agent 从 demo 走向平台化

截至 2026-06-03，可以把 agent 发展看成 5 条并行主线。

### 1. 模型 API 变成“agent 原生接口”

早期做 agent，开发者要自己管理：

- 多轮上下文；
- 工具调用 schema；
- 工具调用结果回填；
- 流式事件；
- 文件检索、网页搜索、代码执行、电脑操作等外部能力。

现在模型平台正在把这些能力下沉。以 OpenAI 为例，Responses API 已经把文本/图像输入、状态化交互、file search、web search、computer use、function calling 等放进同一个接口族；Agents SDK 又在其上提供 agent、handoff、guardrails、sessions、tracing 等抽象。

这意味着一个趋势：

```text
过去：开发者写完整 loop，模型只负责下一步文本/工具调用
现在：平台提供更多 loop 基础设施，开发者更多负责业务边界、工具权限、评估与治理
```

这不是说手写 loop 过时了。恰好相反：**只有理解手写 loop，才知道平台帮你隐藏了什么，以及什么时候不能交给平台。**

### 2. 工具接入走向 MCP 标准化

MCP（Model Context Protocol）可以理解成“AI 应用的 USB-C”。它试图标准化 AI 应用如何连接外部数据、工具、工作流。

在课程前面，我们自己写了：

```text
ToolSpec + ToolRegistry + zod schema + run(input)
```

MCP 把这件事扩展成跨应用协议：

```text
MCP Client（Claude / ChatGPT / IDE / 自己的 agent）
    ↕
MCP Server（文件、数据库、Figma、GitHub、内部系统）
    ↕
真实工具 / 数据源 / prompt / resource
```

它解决的是：**每个 agent 不要为每个外部系统单独写一套连接器**。但它也带来新的安全问题：工具权限、prompt injection、数据外泄、恶意/仿冒工具、供应链风险，都必须进入设计。

### 3. Agent 间通信开始出现 A2A

MCP 解决“agent 连工具/数据”，A2A（Agent2Agent）解决“agent 连 agent”。

A2A 的核心不是让一个进程里两个函数互相调用，而是让**不同厂商、不同框架、不同组织**的 agent 能互相发现能力、协作任务、交换文本/文件/结构化数据。

一个简化心智模型：

```text
Agent Card：我是谁、会什么、端点在哪、怎么认证
Task / Message：你要我做什么
Artifact：我交付了什么文件或结构化结果
Status：任务在 queued / running / completed / failed 哪一步
```

当 agent 进入企业系统，跨团队、跨供应商、跨工具链协作会越来越重要。A2A 的价值在于减少“每两个 agent 都定一个私有协议”的混乱。

### 4. 编排 runtime 关注“长任务、状态、人类介入”

手写 loop 适合学习和小项目；一旦进入生产，会遇到：

- 任务跑 10 分钟，中途进程挂了怎么办？
- 人类要在第 3 步批准工具调用怎么办？
- 多 agent 分工后，谁负责全局状态？
- 失败后能不能从某一步恢复？
- 怎么 trace 每个节点、每次工具调用、每个状态变更？

这就是 LangGraph 这类 runtime 的价值。它不是帮你写 prompt，而是提供持久化、streaming、human-in-the-loop、memory、debugging、deployment 等长任务基础设施。

CrewAI 则更偏“团队/流程”心智模型：Flows 控制状态和执行，Crews 是完成具体任务的 agent 团队。LlamaIndex 更偏“数据/RAG/知识 agent”，围绕 query planning、tool use、query engines、workflows 构建数据密集型 agent。

### 5. UI、评估、安全成为 agent 的一等部件

agent 不是只在终端里跑。生产场景里，用户要看到：

- 当前 agent 在做哪一步；
- 用了哪些工具；
- 哪些步骤需要批准；
- 结果来自哪些来源；
- 为什么失败，能不能重试；
- 花了多少钱，是否超预算。

Vercel AI SDK 这类工具把重点放在 TypeScript 全栈、chat UI、streaming、tool call、typed messages 上。OpenAI Agents SDK / LangSmith / 各类 eval 平台则把 tracing、guardrails、evaluation、cost tracking 推到前台。

---

## 二、Agent 生态分层拆解

下面这张表比“哪个框架最好”更重要。你要先知道自己缺哪一层。

| 层 | 解决的问题 | 典型能力 | 代表技术 |
|----|------------|----------|----------|
| 模型接口层 | 模型如何接收输入、输出文本/工具调用 | chat、Responses、reasoning、multimodal、parallel tools | OpenAI Responses API、Anthropic Messages API |
| 工具协议层 | agent 如何安全、标准地调用外部能力 | function tools、MCP server、hosted tools、computer use | MCP、OpenAI hosted tools、Function calling |
| Agent SDK 层 | 如何写 agent loop 和多 agent handoff | agent、tool、handoff、guardrail、session、trace | OpenAI Agents SDK、Vercel AI SDK Agent |
| 编排 runtime 层 | 长任务、状态机、恢复、人类介入 | graph、durable execution、interrupt、checkpoint、subgraph | LangGraph、CrewAI Flows |
| 数据/RAG 层 | agent 如何用私有知识 | ingestion、chunk、embedding、retrieval、query planning | LlamaIndex、vector DB、RAG pipeline |
| 产品/UI 层 | 用户如何感知 agent 过程 | chat UI、streaming、voice、step display、approval UI | Vercel AI SDK、Realtime agents、自建前端 |
| 观测评估层 | 如何知道 agent 对不对、贵不贵、为何错 | tracing、eval、dataset、LLM judge、cost | LangSmith、OpenAI tracing/evals、自建 telemetry |
| 安全治理层 | 如何防止 agent 越权或被注入 | guardrails、policy、human review、sandbox、audit | OpenAI guardrails、sandbox execution、MCP security practices |

### 关键判断

如果你只会问“我要不要用 LangGraph / CrewAI / OpenAI Agents SDK”，说明问题还没拆开。更好的问题是：

```text
我缺的是:
1. 模型接口统一?
2. 工具接入标准?
3. 多 agent handoff?
4. 长任务持久化?
5. 数据/RAG 能力?
6. UI streaming?
7. tracing/eval/guardrails?
```

不同答案，对应完全不同的选型。

---

## 三、MCP vs A2A：别把两个协议混在一起

| 对比 | MCP | A2A |
|------|-----|-----|
| 核心问题 | agent / AI app 如何连接工具、数据、prompt、resource | 不同 agent 如何互相发现、通信、协作 |
| 主要对象 | client、server、tools、resources、prompts | agent card、message/task、artifact、status |
| 类比 | USB-C / 插件接口 | 服务发现 + 跨 agent RPC |
| 典型场景 | Claude Code 连 Figma/GitHub/数据库; ChatGPT 连内部工具 | 一个采购 agent 委托供应链 agent; 一个研究 agent 调用法律 agent |
| 风险重点 | 工具权限、数据外泄、prompt injection、恶意 server | 身份认证、能力声明可信度、跨组织授权、结果审计 |

### 什么时候用 MCP

- 你要把内部数据库、业务 API、文件系统、设计工具、搜索工具暴露给多个 AI 客户端。
- 你想“一次写 server，多处接入”。
- 你关注工具 schema、resource、prompt 复用。

### 什么时候关注 A2A

- 你有多个独立部署的 agent，需要跨系统协作。
- 你要让 agent 暴露可发现的能力，而不是只给一个内部函数调用。
- 你关心任务生命周期、artifact、异步协作、跨组织认证。

### 一句话

```text
MCP: 我这个 agent 能用哪些工具和数据?
A2A: 我这个 agent 能找哪个别的 agent 帮忙?
```

---

## 四、主要框架与平台怎么选

| 选择 | 最适合 | 不适合 | 你该先学哪章 |
|------|--------|--------|--------------|
| 继续手写 | 学原理、小 demo、完全控制 loop | 长任务恢复、多团队协作、大量工具治理 | 04–06 |
| Vercel AI SDK | TypeScript 全栈、chat UI、streaming、tool call、前端集成 | 复杂长任务状态机、跨 agent 协议治理 | 14、18 |
| OpenAI Agents SDK | OpenAI 模型栈、handoff、guardrails、tracing、hosted tools | 强多厂商中立或完全自托管需求 | 12、15、16、17 |
| LangGraph | 长任务、状态图、human-in-the-loop、持久化、可恢复执行 | 只做简单聊天 UI 或一次性脚本 | 10、11、16 |
| CrewAI | 企业流程自动化、角色团队、Flows + Crews | 高度底层自定义 runtime 或数据/RAG 专用 | 11、12 |
| LlamaIndex | 数据密集型 agent、RAG、query planning、知识库工具 | 纯 UI agent 或非数据主线任务 | 08、09 |
| MCP | 工具/数据连接标准化 | 单项目内部函数调用足够时 | 05、06、17 |
| A2A | 独立 agent 之间互操作 | 一个进程内的 manager-worker 模式 | 11、18 |

### 选型口诀

```text
先问任务形态:
- UI/流式优先 -> Vercel AI SDK
- OpenAI hosted tools/guardrails/tracing 优先 -> OpenAI Agents SDK
- 长任务状态/恢复/人工插入 -> LangGraph
- 角色团队/业务流程自动化 -> CrewAI
- 数据/RAG/知识工作流 -> LlamaIndex
- 工具接入标准化 -> MCP
- 跨 agent 互操作 -> A2A
- 还在学原理/需求很小 -> 手写
```

---

## 五、前沿趋势：你应该重点关注什么

### 趋势 1：Hosted tools 与 sandbox execution

平台开始把 web search、file search、computer use、code execution、sandbox 等能力内置。好处是上手快、集成少、默认治理更强; 风险是平台绑定、成本模型和可迁移性。

学习建议：

- demo 阶段可以用 hosted tools 快速验证价值；
- 生产阶段要确认权限、日志、数据保留、成本、失败恢复；
- 对关键业务工具，仍要保留自定义 tool wrapper 和审计。

### 趋势 2：Agent loop 从应用代码下沉到 SDK / runtime

Agents SDK、LangGraph、CrewAI 等都在不同层次接管 loop。开发者工作重心从“怎么让模型下一步调工具”转向：

- 工具是否可信；
- 什么时候人要介入；
- 状态如何持久化；
- 失败如何恢复；
- 如何评估质量；
- 如何控制成本。

### 趋势 3：协议层变重要

MCP 和 A2A 都说明：agent 生态开始从“每个产品自己接插件”走向“标准化发现与调用”。

这会改变工程组织方式：

- 内部工具不再只为一个 bot 写 API，而是写成可被多个 agent client 使用的 server。
- agent 不再只暴露 HTTP endpoint，而是暴露能力描述、认证要求、输入输出模式。
- 安全审计要从单个函数扩展到协议和供应链。

### 趋势 4：Human-in-the-loop 从按钮变成流程设计

人类介入不是最后放一个“Approve”按钮，而是要设计在风险节点：

- 高成本调用前；
- 写数据库/发邮件/转账前；
- 低置信度检索后；
- 安全策略冲突时；
- 跨 agent 委托前。

### 趋势 5：评估和可观测从可选项变成上线门槛

agent 的失败往往不是“程序崩了”，而是：

- 做了错误但看似合理的步骤；
- 调了不该调的工具；
- 检索了错误来源；
- 成本超预算；
- 在多轮中慢慢漂移。

没有 trace、eval dataset、成本日志和 replay 机制，就很难定位。

---

## 六、生态地图：从需求倒推架构

```mermaid
flowchart LR
  A["我要做什么?"] --> B{"主要矛盾"}
  B -->|"前端聊天与流式体验"| C["Vercel AI SDK + 自定义 tools"]
  B -->|"OpenAI hosted tools / guardrails"| D["OpenAI Agents SDK"]
  B -->|"长任务/状态/人工介入"| E["LangGraph"]
  B -->|"企业流程/角色团队"| F["CrewAI"]
  B -->|"数据问答/RAG/知识库"| G["LlamaIndex + Vector DB"]
  B -->|"工具生态复用"| H["MCP server/client"]
  B -->|"跨 agent 协作"| I["A2A"]
  B -->|"学习/小 demo"| J["手写 loop"]

  C --> K["tracing/eval/cost"]
  D --> K
  E --> K
  F --> K
  G --> K
  H --> L["security/policy/audit"]
  I --> L
```

---

## 七、代码走读

本章的 `index.ts` 不调用任何真实模型。它做三件事：

1. 打印 agent 生态分层；
2. 根据需求标签给出推荐栈；
3. 输出一个“从手写到生产”的升级路径。

运行它是为了训练一个能力：**先描述约束，再做选型**。

---

## 八、运行

```bash
npx tsx lessons/19-agent-ecosystem-and-frontier/index.ts
```

预期输出：

- Agent ecosystem layers；
- 典型需求到技术栈的映射；
- 从 demo 到 production 的升级 checklist。

本章不需要 `.env`，不消耗 token。

---

## 九、练习

1. **选型题**：你要做一个“企业内部政策问答 + 引用来源 + 人工复核”的 agent。写出你的技术栈，并说明为什么。
2. **协议题**：把“公司内部 CRM 查询能力”设计成 MCP server，列出 3 个 tools、2 个 resources、2 条安全规则。
3. **A2A 题**：设计一个“旅行规划 agent 调用签证政策 agent”的 Agent Card，写出它应该暴露的能力和认证方式。
4. **治理题**：为一个能发邮件的 agent 设计 human-in-the-loop 节点，说明哪些邮件必须人工确认。
5. **迁移题**：把第 04–06 章手写 agent 迁移到 LangGraph 或 OpenAI Agents SDK，你会保留哪些自定义代码？

---

## 十、官方资料来源

本章参考的官方资料：

- [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/)
- [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI: The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Model Context Protocol: What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Model Context Protocol specification repository](https://github.com/modelcontextprotocol/modelcontextprotocol)
- [A2A Protocol specification](https://github.com/a2aproject/A2A/blob/main/docs/specification.md)
- [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [Vercel AI SDK 5 announcement](https://vercel.com/blog/ai-sdk-5)
- [CrewAI introduction](https://docs.crewai.com/en/introduction)
- [LlamaIndex Agents documentation](https://developers.llamaindex.ai/python/framework/use_cases/agents/)

---

## 十一、前沿文章归档

> 下方文章归档由页面直接从 Supabase `frontier_ecosystem_articles` 读取；`knowledge-graph/data/graph.ts` 仍是生成与同步数据的唯一事实源。标题和来源均可点击查看原文。

| 体系层 | 收集重点 |
|--------|----------|
| 基础综述 | agent taxonomy、human-agent、多 agent、computer-use 总览 |
| 模型与托管平台 | Responses API、Agents SDK、Hosted tools、sandbox |
| 协议与互操作 | MCP、A2A、Apps SDK、AAIF、生命周期与兼容性 |
| 编排 Runtime | LangGraph、CrewAI、AutoGen、Semantic Kernel、Bedrock Agents |
| 产品与交互 | Operator、deep research、Codex、ChatGPT agent、GUI agent |
| 数据与记忆 | file search、conversation state、context engineering、agent memory |
| 评测与基准 | WebArena、OSWorld、MacArena、tau-bench、SWE-agent、PaperBench |
| 安全与治理 | OWASP、MCP authorization、prompt injection、identity、secrets |

<div data-frontier-articles></div>

---

## 十二、小结与延伸

你现在可以把 agent 生态拆成 8 层，而不是只记一堆框架名：

```text
模型接口 -> 工具协议 -> Agent SDK -> 编排 runtime -> 数据/RAG -> UI -> 观测评估 -> 安全治理
```

下一步不是追每个新框架，而是训练这个判断：

> 我的业务到底缺哪一层？这一层是买现成的、用开源的、还是继续手写？

当你能回答这个问题，才真正从“会写 agent demo”进入“会设计 agent 系统”。

> 💡 **面试会问**：agent 生态大致分哪几层？面对一个新需求，你怎么判断某一层该买现成的、用开源框架、还是自己手写？MCP 和 A2A 各解决什么问题、有什么区别？为什么说「追每个新框架」不如「判断自己缺哪一层」？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph TB
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_c19_ecosystem_layers["Agent 生态分层"]
  n_c19_mcp["MCP (模型上下文协议)"]
  n_c19_a2a["A2A (Agent2Agent)"]
  n_c19_agent_sdk["Agent SDK"]
  n_c19_orchestration_runtime["编排 runtime"]
  n_c19_hosted_tools["Hosted tools 与 sandbox"]
  n_c19_stack_selection["需求倒推选型"]
  n_c19_governance["可观测与安全治理"]
  n_c12_framework_choice["框架选型决策（第12章）"]
  n_c05_native_tool_use["原生工具调用 (Function Calling)（第05章）"]
  n_c19_ecosystem_layers -->|组成| n_c19_mcp
  n_c19_ecosystem_layers -->|组成| n_c19_agent_sdk
  n_c19_ecosystem_layers -->|组成| n_c19_orchestration_runtime
  n_c19_ecosystem_layers -->|组成| n_c19_governance
  n_c19_mcp -->|对比| n_c19_a2a
  n_c19_agent_sdk -->|深化| n_c19_orchestration_runtime
  n_c19_hosted_tools -->|对比| n_c19_mcp
  n_c19_stack_selection -->|应用| n_c19_ecosystem_layers
  n_c19_stack_selection -->|应用| n_c19_agent_sdk
  n_c19_governance -->|应用| n_c19_orchestration_runtime
  n_c19_ecosystem_layers -->|深化| n_c12_framework_choice
  n_c19_mcp -->|应用| n_c05_native_tool_use
  class n_c19_ecosystem_layers,n_c19_mcp,n_c19_a2a,n_c19_agent_sdk,n_c19_orchestration_runtime,n_c19_hosted_tools,n_c19_stack_selection,n_c19_governance own;
  class n_c12_framework_choice,n_c05_native_tool_use cross;
  linkStyle 0 stroke:#d97706,stroke-width:2px;
  linkStyle 1 stroke:#d97706,stroke-width:2px;
  linkStyle 2 stroke:#d97706,stroke-width:2px;
  linkStyle 3 stroke:#d97706,stroke-width:2px;
  linkStyle 4 stroke:#db2777,stroke-width:2px;
  linkStyle 5 stroke:#7c3aed,stroke-width:2px;
  linkStyle 6 stroke:#db2777,stroke-width:2px;
  linkStyle 7 stroke:#059669,stroke-width:2px;
  linkStyle 8 stroke:#059669,stroke-width:2px;
  linkStyle 9 stroke:#059669,stroke-width:2px;
  linkStyle 10 stroke:#7c3aed,stroke-width:2px;
  linkStyle 11 stroke:#059669,stroke-width:2px;
```

### 与其他章节的关系

- `Agent 生态分层` —**深化**→ `框架选型决策`（第 12 章）
- `MCP (模型上下文协议)` —**应用**→ `原生工具调用 (Function Calling)`（第 05 章）

### 延伸阅读

> 标题可点击查看原文；来源为发布方或官方文档站。

- 来源：Anthropic · [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic 官方工程博客，系统讲解 Agent 的循环、工具与何时该用 Agent，与本章心智模型高度对应 `doc`
- 来源：OpenAI · [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/) — OpenAI 官方 TypeScript Agents SDK 文档，对应 agent、tool、handoff、guardrail、session、tracing、MCP 等 SDK 层能力 `doc`
- 来源：OpenAI · [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses) — OpenAI 官方 Responses API 参考，对应模型原生输入输出、工具调用与状态化交互接口层 `doc`
- 来源：OpenAI · [OpenAI: The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/) — OpenAI 官方产品文章：Agents SDK 向 sandbox execution、long-horizon tasks、durable harness 演进，是前沿趋势来源 `blog`
- 来源：OpenAI · [OpenAI Docs · Sandbox agents](https://developers.openai.com/api/docs/guides/agents/sandboxes) — Agents SDK sandbox 文档，对应 code execution / long-running task 的隔离执行与生产化边界 `doc`
- 来源：OpenAI · [OpenAI Docs · Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agent-evals) — OpenAI 官方 agent workflow eval 指南，对应第 19 章评估治理层 `doc`
- 来源：OpenAI · [OpenAI Docs · MCP and Connectors](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) — OpenAI 官方 MCP/connectors 文档，对应 hosted platform 如何接入远程工具协议 `doc`
- 来源：OpenAI · [OpenAI Docs · Web search](https://developers.openai.com/api/docs/guides/tools-web-search) — OpenAI 官方 web search 工具文档，对应 hosted tools 层的网页检索能力 `doc`
- 来源：OpenAI · [OpenAI Docs · File search](https://developers.openai.com/api/docs/guides/tools-file-search) — OpenAI 官方 file search 工具文档，对应 hosted tools / 私有资料检索能力 `doc`
- 来源：OpenAI · [OpenAI Docs · Computer use](https://developers.openai.com/api/docs/guides/tools-computer-use) — OpenAI 官方 computer use 工具文档，对应 UI/桌面自动化与 sandbox 风险边界 `doc`
- 来源：OpenAI · [OpenAI Docs · Conversation state](https://developers.openai.com/api/docs/guides/conversation-state) — OpenAI 官方 conversation state 文档，对应状态化交互和从手写 message history 到平台托管状态的迁移 `doc`
- 来源：Anthropic · [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Anthropic 官方：上下文是有限资源，需主动裁剪与压缩，与本章窗口预算/摘要思路一致 `blog`
- 来源：OpenAI · [OpenAI Agents SDK · Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) — OpenAI 官方：guardrails 与 human-in-the-loop approvals 控制敏感工具和副作用 `doc`
- 来源：OpenAI · [OpenAI Agents SDK · Integrations and observability](https://developers.openai.com/api/docs/guides/agents/integrations-observability) — OpenAI 官方：tracing 记录 model calls、tool calls、handoffs、guardrails 与 custom spans `doc`
- 来源：Vercel · [Vercel AI SDK 官方文档](https://sdk.vercel.ai/docs) — generateText / streamText / tool / maxSteps 的权威参考 `doc`
- 来源：Model Context Protocol · [Model Context Protocol: What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro) — MCP 官方入门，工具/数据连接标准化的一手来源 `doc`
- 来源：Model Context Protocol · [Model Context Protocol specification repository](https://github.com/modelcontextprotocol/modelcontextprotocol) — MCP 官方 specification 与文档仓库，用于复核协议层术语、版本与实现边界 `doc`
- 来源：A2A Project · [A2A Protocol specification](https://github.com/a2aproject/A2A/blob/main/docs/specification.md) — A2A 官方 specification，对应 agent card、task/message、artifact/status 等跨 agent 协作对象 `doc`
- 来源：Google Developers Blog · [Google Developers Blog · Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) — Google Cloud 官方 A2A 发布文章，解释协议动机、设计原则、Agent Card、task/artifact/status 等生态背景 `blog`
- 来源：Google ADK · [Google Agent Development Kit (ADK) docs](https://adk.dev/) — Google ADK 官方文档，对应 Google 生态里的 agent 开发框架与多 agent 工程实践 `doc`
- 来源：LangChain · [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview) — 编排 runtime 代表，长任务持久化与 human-in-the-loop 官方文档 `doc`
- 来源：LangChain · [LangSmith Observability](https://docs.langchain.com/langsmith/observability) — LangSmith 官方观测文档，对应 agent tracing、调试、线上监控与评估治理层 `doc`
- 来源：Vercel · [Vercel AI SDK 5 announcement](https://vercel.com/blog/ai-sdk-5) — Vercel 官方 AI SDK 5 发布文章，对应前端流式 UI、typed messages、tooling 与产品体验层趋势 `blog`
- 来源：Vercel · [Vercel AI SDK UI · Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) — Vercel AI SDK UI 官方 chatbot 文档，对应产品/UI 层的对话体验与状态管理 `doc`
- 来源：CrewAI · [CrewAI introduction](https://docs.crewai.com/en/introduction) — CrewAI 官方入门，对应企业流程自动化、Flows 与 Crews 的团队/流程 runtime 心智模型 `doc`
- 来源：CrewAI · [CrewAI Flows](https://docs.crewai.com/en/concepts/flows) — CrewAI 官方 Flows 文档，对应事件驱动 workflow、状态管理、条件控制流与长期流程编排 `doc`
- 来源：LlamaIndex · [LlamaIndex Agents documentation](https://developers.llamaindex.ai/python/framework/use_cases/agents/) — LlamaIndex 官方 Agents 用例文档，对应数据密集型 agent、query planning、tools 与 RAG 生态层 `doc`
- 来源：LlamaIndex · [LlamaIndex Workflows](https://developers.llamaindex.ai/python/llamaagents/workflows/) — LlamaIndex 官方 Workflows 文档，对应事件驱动、可观测、可组合的数据/agent 工作流 `doc`
- 来源：Microsoft AutoGen · [Microsoft AutoGen · AgentChat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/index.html) — AutoGen 官方 AgentChat 文档，对应 agents、teams、human-in-the-loop、state、observability 等多 agent 框架能力 `doc`
- 来源：Microsoft Learn · [Microsoft Semantic Kernel Agent Framework](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/) — Semantic Kernel 官方 agent framework 文档，对应企业应用里的 agent 协作、人工参与和流程编排 `doc`
- 来源：AWS · [Amazon Bedrock Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html) — Amazon Bedrock 官方 Agents 文档，对应云平台托管 agent、API action、knowledge base 与企业集成生态 `doc`
- 来源：arXiv · [Testing Agentic Workflows with Structural Coverage Criteria](https://arxiv.org/abs/2605.26521) — 2026 论文：用结构覆盖衡量多 agent workflow 的测试充分性，对应 agent eval 的前沿方向 `paper`
- 来源：arXiv · [Agent-Diff: Benchmarking LLM Agents on Enterprise API Tasks via Code Execution with State-Diff-Based Evaluation](https://arxiv.org/abs/2602.11224) — 2026 论文：用企业 API 任务和 state-diff 合约评估 agent 执行结果，对应生产级 agent benchmark 方向 `paper`
- 来源：arXiv · [A Survey on Large Language Model based Autonomous Agents](https://arxiv.org/abs/2308.11432) — 综述型入口：从 agent 构造、应用到评估梳理 LLM autonomous agents，适合作为第 19 章体系地图的总览来源 `paper`
- 来源：arXiv · [Large Language Model based Multi-Agents: A Survey of Progress and Challenges](https://arxiv.org/abs/2402.01680) — 多 Agent 系统综述，覆盖角色画像、通信、协作机制、环境模拟与常用 benchmark，用于补齐 multi-agent 生态视角 `paper`
- 来源：arXiv · [LLM-Based Human-Agent Collaboration and Interaction Systems: A Survey](https://arxiv.org/abs/2505.00753) — Human-Agent Systems 综述，把人类反馈、控制、协作、profile 与安全风险纳入 agent 体系，而不是只讨论全自动 agent `paper`
- 来源：arXiv · [Memory for Autonomous LLM Agents: Mechanisms, Evaluation, and Emerging Frontiers](https://arxiv.org/abs/2603.07670) — 2026 agent memory 综述：write-manage-read、长期记忆、反思、压缩、隐私治理与评估，为记忆层提供系统分类 `paper`
- 来源：arXiv · [A Comprehensive Survey of Agents for Computer Use: Foundations, Challenges, and Future Directions](https://arxiv.org/abs/2501.16150) — Computer-use agents 综述，按环境、观察空间、动作空间与 agent 学习方式分类 GUI/桌面/浏览器代理 `paper`
- 来源：OpenAI · [OpenAI · Introducing Operator](https://openai.com/index/introducing-operator/) — OpenAI Operator 官方发布文：浏览器 GUI agent、CUA、WebArena/WebVoyager、用户接管与安全确认，是产品化 computer-use agent 的关键来源 `blog`
- 来源：OpenAI · [OpenAI · Introducing deep research](https://openai.com/index/introducing-deep-research/) — OpenAI deep research 官方发布文：长时网页研究、引用报告、文件/PDF/网页综合分析，对应研究型 agent 产品形态 `blog`
- 来源：OpenAI · [OpenAI · Introducing Codex](https://openai.com/index/introducing-codex/) — OpenAI Codex 官方发布文：云端软件工程 agent、隔离 sandbox、并行任务、终端日志与测试证据，对应 coding agent 产品化形态 `blog`
- 来源：OpenAI · [OpenAI · Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) — OpenAI ChatGPT agent 官方发布文：把 Operator、deep research、terminal、connectors 融合为统一 agent mode，展示产品层整合方向 `blog`
- 来源：OpenAI · [OpenAI Apps SDK · MCP Apps compatibility in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt) — OpenAI Apps SDK 文档：MCP Apps 在 ChatGPT 中的兼容与 UI 组件接入，补齐 agent 工具协议到交互界面的桥梁 `doc`
- 来源：Model Context Protocol · [MCP Specification · Lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle) — MCP 官方生命周期规范：初始化、能力协商、运行、关闭，是协议实现和兼容性复核的一手来源 `doc`
- 来源：Model Context Protocol · [MCP Specification · Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) — MCP 官方授权规范：OAuth 2.1、resource 参数、audience binding、token passthrough 禁止等安全边界 `doc`
- 来源：Linux Foundation · [Linux Foundation · Agentic AI Foundation (AAIF) announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) — Linux Foundation 官方公告：AAIF 承接 MCP、goose、AGENTS.md，说明 agent 生态进入中立治理与标准化阶段 `blog`
- 来源：arXiv · [WebArena: A Realistic Web Environment for Building Autonomous Agents](https://arxiv.org/abs/2307.13854) — Web agent 经典 benchmark：真实网站任务、功能正确性评估、长链路网页操作，是浏览器 agent 评测基线 `paper`
- 来源：arXiv · [OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments](https://arxiv.org/abs/2404.07972) — Computer-use agent 代表 benchmark：真实 OS、桌面应用、文件系统与跨应用 workflow，用执行脚本验证任务完成 `paper`
- 来源：arXiv · [MacArena: Benchmarking Computer Use Agents on an Online macOS Environment](https://arxiv.org/abs/2606.06560) — 2026 computer-use 新 benchmark：421 个 macOS 任务、50 个应用，用于观察跨平台 GUI agent 能力差异 `paper`
- 来源：arXiv · [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045) — tool-agent-user 交互 benchmark：零售/航空领域、多轮用户模拟、数据库状态对齐与 pass^k 稳定性指标 `paper`
- 来源：arXiv · [TRAJECT-Bench: A Trajectory-Aware Benchmark for Evaluating Agentic Tool Use](https://arxiv.org/abs/2510.04550) — 轨迹感知工具使用 benchmark：不仅看最终答案，也看工具选择、参数、顺序、依赖链是否正确 `paper`
- 来源：arXiv · [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793) — 软件工程 agent 代表论文，强调 agent-computer interface 对代码浏览、编辑、测试和性能的影响 `paper`
- 来源：arXiv · [SWE-Lancer: Can Frontier LLMs Earn $1 Million from Real-World Freelance Software Engineering?](https://arxiv.org/abs/2502.12115) — OpenAI SWE-Lancer benchmark：把 freelance 软件工程任务映射到真实经济价值，补齐 coding agent 的经济任务评估视角 `paper`
- 来源：arXiv · [PaperBench: Evaluating AI's Ability to Replicate AI Research](https://arxiv.org/abs/2504.01848) — OpenAI PaperBench：以复现 AI 论文为任务，评估 agent 做长周期科研工程的能力、rubric 与 judge 体系 `paper`
- 来源：OWASP · [OWASP · Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/) — OWASP Agentic Security Initiative 指南：以 threat model 方式整理 agentic AI 新威胁与缓解策略 `doc`
- 来源：OWASP · [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/) — OWASP LLM Top 10 2025：生产 LLM/agent 应用的通用风险清单，是第 19 章治理层的安全基线 `doc`
- 来源：arXiv · [Design Patterns for Securing LLM Agents against Prompt Injections](https://arxiv.org/abs/2506.08837) — prompt injection 防御设计模式论文，讨论工具权限、敏感信息和 agent 架构层面的安全/效用取舍 `paper`
- 来源：arXiv · [Identity Management for Agentic AI](https://arxiv.org/abs/2510.25819) — OpenID Foundation 相关白皮书：agent 身份、认证、授权、delegated authority 与访问管理，是企业落地关键议题 `paper`
- 来源：arXiv · [When Agents Handle Secrets: A Survey of Confidential Computing for Agentic AI](https://arxiv.org/abs/2605.03213) — 2026 综述：当 agent 持有密钥、记忆和工具权限时，TEE/远程证明/多跳 attestation 如何进入生产安全架构 `paper`
- 来源：arXiv · [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — Agent 控制流的奠基范式：交错 reasoning trace 与 action，让模型边推理边调用外部工具/环境，是本课程 ReAct 循环与 maxSteps 的源头 `paper`
- 来源：arXiv · [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) — 不更新权重、用语言反思 + episodic memory 让 agent 从试错中改进，是自我批判/重试类控制流（含进阶 RAG 的 self-grade）的理论根 `paper`
- 来源：Lil'Log · [LLM Powered Autonomous Agents (Lilian Weng)](https://lilianweng.github.io/posts/2023-06-23-agent/) — 把 LLM agent 拆成 planning / memory / tool use 三大件的经典体系文，第 19 章生态地图的概念脚手架 `blog`
- 来源：Anthropic · [Anthropic · Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — 把驱动 Claude Code 的 agent loop / 工具执行 / 上下文管理做成 Python、TS 可编程 SDK 的官方文档，平台级 agent primitives 一手来源 `doc`
- 来源：Anthropic · [Anthropic Engineering · Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — 官方工程博客：用 gather context / take action / verify work 三段式讲如何在 SDK 上搭生产 agent，对照本课程手写 loop 的取舍 `blog`
- 来源：AWS · [Amazon Bedrock AgentCore is now generally available](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available) — AWS 把 Runtime（8 小时执行 + 会话隔离 + A2A）、Memory、Identity、Gateway 等托管 agent 基建打包 GA，企业落地的平台层代表 `doc`
- 来源：Microsoft · [Introducing Microsoft Agent Framework](https://devblogs.microsoft.com/foundry/introducing-microsoft-agent-framework-the-open-source-engine-for-agentic-ai-apps/) — 微软把 Semantic Kernel 的企业基座与 AutoGen 的多 agent 编排合并成单一开源 SDK/runtime（原生支持 A2A、MCP），runtime 收敛的标志性事件 `blog`
- 来源：arXiv · [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) — 把 LLM 上下文当虚拟内存分层管理（core/recall/archival），用中断在主体与用户间切换控制流，Letta 的理论原型与长期记忆层基石 `paper`
- 来源：arXiv · [Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory](https://arxiv.org/abs/2504.19413) — 可外挂的记忆层：从对话动态抽取/合并/检索关键信息（含图变体），LOCOMO 上比满上下文省 90%+ token 与延迟，生产记忆的工程权衡样本 `paper`
- 来源：Letta · [Letta · Benchmarking AI Agent Memory](https://www.letta.com/blog/benchmarking-ai-agent-memory/) — Letta（MemGPT 团队）用基准对比文件系统记忆 vs 各类记忆框架，给「agent 记忆到底该怎么存/取」提供可量化对照 `blog`
- 来源：Anthropic · [Anthropic Engineering · Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 长跑 agent 的上下文工程：跨多个 context window 的 compaction、记忆落盘与首窗特殊 prompt，承接 context engineering 的实操篇 `blog`

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
