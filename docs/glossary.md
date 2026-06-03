# 术语表（Glossary）

> 这份术语表按主题组织，收录了「Agent 开发学习路径」全程会反复出现的核心概念。
> 每条 1–3 句的中文简明定义，必要时附一句例子或对照章节，方便边学边查。
>
> 阅读建议：第一次遇到陌生词，先在这里建立"够用就好"的直觉；真正动手时再回到对应章节深挖。
> 标注的「→ 见 lessons/xx」指向仓库里讲解最透彻的那一章。

## 目录

- [一、大语言模型基础（LLM Basics）](#一大语言模型基础llm-basics)
- [二、提示工程（Prompt Engineering）](#二提示工程prompt-engineering)
- [三、Agent 与推理模式（Agents & Reasoning）](#三agent-与推理模式agents--reasoning)
- [四、工具调用（Tool Use / Function Calling）](#四工具调用tool-use--function-calling)
- [五、检索增强与向量（Embeddings & RAG）](#五检索增强与向量embeddings--rag)
- [六、多智能体协作（Multi-Agent）](#六多智能体协作multi-agent)
- [七、输出、评估与可观测（Output, Eval & Observability）](#七输出评估与可观测output-eval--observability)
- [八、安全与护栏（Safety & Guardrails）](#八安全与护栏safety--guardrails)

---

## 一、大语言模型基础（LLM Basics）

> → 见 lessons/02-first-llm-call

- **LLM（大语言模型，Large Language Model）**
  在海量文本上训练、通过"预测下一个 token"来生成文字的神经网络模型。它是整个 Agent 的"大脑"，负责理解输入并产出回答。例如 GPT、Claude 都是 LLM。

- **Token**
  模型处理文本的最小单位，介于"字"和"词"之间，一个 token 大约对应英文 4 个字符或中文 1–2 个汉字。计费、长度限制、速度都以 token 计量，而不是字数。

- **上下文窗口（Context Window）**
  模型单次调用能"看到"的 token 总量上限，包含你发的提示和它生成的回答。超出窗口的内容会被截断或必须靠记忆/检索补回——这正是后面短期记忆和 RAG 要解决的核心约束。

- **Temperature（温度）**
  控制生成随机性的参数，通常 0–2。值越低输出越确定、越保守（适合代码、结构化数据）；值越高越发散、越有创意（适合头脑风暴）。需要可复现结果时设为 0。

- **Top-p（核采样，Nucleus Sampling）**
  另一种控制随机性的参数：只在累积概率达到 p 的最可能候选 token 中采样。常与 temperature 二选一调节，一般保持默认即可。

- **推理模型（Reasoning Model）**
  在回答前会先生成一段内部"思考过程"再给结论的一类模型，更擅长多步推理和复杂任务，代价是更慢、更贵。使用时往往不需要自己再写思维链提示。

- **Latency / Throughput（延迟 / 吞吐）**
  延迟指从发请求到拿到结果的耗时（首个 token 的延迟尤其影响体验）；吞吐指单位时间能处理的 token 量。流式输出主要优化的是"感知延迟"。

---

## 二、提示工程（Prompt Engineering）

> → 见 lessons/03-prompt-engineering

- **提示工程（Prompt Engineering）**
  通过精心设计输入文本来引导 LLM 产出期望结果的实践，包括给角色、给示例、给约束、给输出格式。它是用好模型成本最低、收益最高的手段。

- **System 提示 / User 提示（System / User Prompt）**
  System 提示设定模型的角色、规则和全局约束（如"你是严谨的代码审查员，只输出 JSON"），User 提示是具体的用户问题或指令。System 优先级更高、更稳定，适合放不变的规则。

- **Few-shot（少样本提示）**
  在提示里塞进几个"输入→输出"的示范例子，让模型照葫芦画瓢，无需训练就能学会格式或风格。对应地，不给例子直接提问叫 zero-shot（零样本）。

- **思维链（CoT，Chain-of-Thought）**
  引导模型"一步一步思考"再给答案的提示技巧（如加一句"让我们逐步推理"），能显著提升数学、逻辑类任务的正确率。代价是输出更长、更慢。

- **幻觉（Hallucination）**
  模型一本正经地编造出看似合理、实则错误或不存在的内容（假引用、假 API、假数据）。这是 LLM 的固有风险，需要靠 RAG（提供真实依据）、结构化校验和评估来抑制。

- **提示模板（Prompt Template）**
  把提示中固定的骨架和可变的占位符分开，用变量动态填充（如 `回答关于 {topic} 的问题`）。便于复用、版本管理和 A/B 测试。

---

## 三、Agent 与推理模式（Agents & Reasoning）

> → 见 lessons/01-what-is-an-agent、lessons/04-the-agent-loop、lessons/10-reasoning-patterns

- **Agent（智能体）**
  能自主感知环境、做决策、调用工具并采取行动以完成目标的程序，核心是"LLM + 工具 + 循环"。和单次问答不同，Agent 会多步骤地朝目标推进，例如自动查资料、调接口、再总结。

- **Agent 循环（Agent Loop）**
  Agent 的核心运行机制：观察当前状态 → 让 LLM 思考下一步 → 执行动作（调工具）→ 把结果喂回 → 再思考，如此循环直到任务完成或达到停止条件。是第 4 章的主线。

- **ReAct（Reasoning + Acting）**
  一种把"推理"和"行动"交织的 Agent 模式：模型轮流输出 Thought（想）、Action（做）、Observation（看结果），边想边做边修正。是最经典、最易上手的 Agent 范式。

- **Plan-and-Execute（先规划后执行）**
  Agent 先一次性制定完整的多步计划，再逐步执行各子任务。相比 ReAct 每步都重新思考，它步骤更可控、更省调用，适合流程清晰的复杂任务。

- **Reflection（反思 / 自我修正）**
  让 Agent 对自己的输出进行批判和复查，发现问题后再修订的模式（生成→自评→改进）。能提升质量，常用于代码生成、写作等需要打磨的场景。

- **停止条件（Stopping Condition / Termination）**
  决定 Agent 循环何时结束的规则，如任务标记完成、达到最大步数/最大 token、或连续无进展。没有它，Agent 可能陷入死循环或无限烧钱。

- **Scratchpad（草稿区 / 中间状态）**
  Agent 在循环中累积的思考、动作和观察记录，作为下一步决策的上下文。它本质上是 Agent 的"工作记忆"，与短期记忆紧密相关。

---

## 四、工具调用（Tool Use / Function Calling）

> → 见 lessons/05-tool-use-basics、lessons/06-building-a-tool-system

- **工具调用 / Function Calling（函数调用）**
  让 LLM 不直接回答，而是输出"要调用哪个函数、传什么参数"的结构化请求，由程序真正执行后把结果返回模型。这是 Agent 能查天气、读文件、调 API 的根本机制。

- **Tool（工具）**
  Agent 可以调用的一个能力单元，本质是一个带名称、描述、参数和实现逻辑的函数（如"搜索网页""读取数据库"）。工具的描述写得好不好，直接决定模型用得对不对。

- **ToolSpec（工具规格 / 工具 Schema）**
  用结构化格式（通常是 JSON Schema）声明一个工具的名称、用途说明和参数类型，模型据此判断何时调用、如何填参。它是模型与代码之间的"接口契约"。

- **工具路由（Tool Routing / Dispatch）**
  根据模型选择的工具名，把调用分发到对应实现函数并执行的逻辑。第 6 章构建工具系统时，注册表 + 路由是核心骨架。

- **参数校验（Argument Validation）**
  执行工具前，对模型生成的参数做类型和取值检查，防止非法或恶意输入导致崩溃。属于系统边界处的必备防御，模型给的参数永远不能无条件信任。

- **并行工具调用（Parallel Tool Calls）**
  模型在一轮里同时请求调用多个互不依赖的工具，程序并发执行以缩短整体耗时。适合"同时查三个数据源"这类场景。

---

## 五、检索增强与向量（Embeddings & RAG）

> → 见 lessons/08-embeddings-and-vector-search、lessons/09-rag-from-scratch、lessons/07-short-term-memory

- **Embedding（嵌入 / 向量化）**
  把文本（或图片等）转换成一串固定长度的浮点数向量，使语义相近的内容在向量空间中距离也相近。它是语义检索、RAG、聚类的基础表示。

- **向量 / 向量数据库（Vector / Vector Database）**
  向量是 embedding 产出的数字数组；向量数据库是专门存储这些向量并支持"按相似度快速查找"的数据库（如 FAISS、Chroma、pgvector）。是 RAG 的检索后端。

- **余弦相似度（Cosine Similarity）**
  通过计算两个向量夹角的余弦值（-1 到 1）来衡量语义相近程度，值越接近 1 越相似。是向量检索中最常用的相似度度量，只看方向不看长度。

- **语义检索（Semantic Search）**
  基于含义而非字面关键词匹配来查找内容：把查询和文档都转成向量，再找最相似的几条。即使用词不同但意思相近也能命中，弥补了传统关键词搜索的不足。

- **RAG（检索增强生成，Retrieval-Augmented Generation）**
  先从知识库检索相关资料，再把资料连同问题一起喂给 LLM 生成答案的架构。让模型基于真实、可更新的外部知识作答，是抑制幻觉、引入私有数据的主流方案。第 9 章带你从零实现。

- **分块（Chunking）**
  把长文档切成若干较小片段后再做 embedding 和检索的过程。块太大会稀释语义、超出上下文，太小会丢失上下文，因此块大小和重叠（overlap）是 RAG 的关键调参点。

- **Top-k 检索（Top-k Retrieval）**
  从向量库中取出与查询最相似的前 k 条结果作为上下文。k 的取值要在"信息够用"和"上下文不超限/不引入噪声"之间权衡。

- **重排序（Re-ranking）**
  在初步向量检索拿到候选后，用更精细的模型对结果重新打分排序，提升真正相关内容排在前面的概率。是进阶 RAG 提升质量的常见一步。

- **短期记忆（Short-term Memory）**
  Agent 在单次会话内保留对话历史和中间状态的机制，让它"记得"前几轮说了什么。受上下文窗口限制，常用截断、摘要等策略压缩。第 7 章主题。

---

## 六、多智能体协作（Multi-Agent）

> → 见 lessons/11-multi-agent-orchestration

- **多智能体（Multi-Agent）**
  由多个各有分工的 Agent 协同完成复杂任务的系统，比如一个负责检索、一个负责写作、一个负责审查。通过分工把大问题拆小，各自专注、互相校验。

- **Supervisor / Worker（主管 / 工人模式）**
  一种常见的多智能体编排结构：Supervisor 负责拆解任务、分派给各 Worker、汇总结果；Worker 各自专注执行一类子任务。本仓库的毕业项目 deep-research-agent 即采用此模式。

- **编排（Orchestration）**
  协调多个 Agent 之间任务流转、消息传递和结果聚合的控制逻辑，决定"谁先做、谁后做、怎么合并"。它是多智能体系统从能跑到好用的关键。

- **Handoff（任务移交）**
  一个 Agent 把控制权或子任务连同必要上下文交给另一个 Agent 继续处理的动作。移交时要传清楚状态，避免下游 Agent 丢失上下文。

---

## 七、输出、评估与可观测（Output, Eval & Observability）

> → 见 lessons/13-structured-output、lessons/14-streaming-and-ux、lessons/15-evaluation-and-testing、lessons/16-observability-and-cost

- **结构化输出（Structured Output）**
  约束 LLM 按预定格式（通常是符合某个 Schema 的 JSON）返回结果，便于程序直接解析使用，而非自由文本。是把模型接入工程系统的关键，第 13 章主题。

- **SSE / 流式（Server-Sent Events / Streaming）**
  让模型生成的内容像打字机一样逐 token 实时推送给前端，而不是等全部生成完才一次返回。SSE 是实现这种单向流式推送的常用 Web 协议，能大幅改善等待体验。第 14 章主题。

- **评估（Eval / Evaluation）**
  用一组测试样例系统化衡量 Agent 或提示效果好坏的过程，输出可量化的指标（准确率、通过率等）。它把"感觉还行"变成"有数据支撑"，是迭代优化的前提。第 15 章主题。

- **LLM-as-judge（用大模型当裁判）**
  让另一个 LLM 按给定标准对模型输出的质量打分或判定对错的评估方法。适合评判摘要、对话等没有唯一标准答案、难以用规则自动判分的任务。

- **黄金数据集（Golden Dataset / Test Set）**
  一组人工确认了正确答案的"输入→期望输出"样例，作为评估的基准。任何提示或模型改动都用它回归测试，确保没有把原来对的改坏。

- **可观测性（Observability）**
  通过日志、指标、追踪等手段让系统内部运行状态变得可见、可诊断的能力。对 Agent 尤其重要——多步、非确定性的执行过程不可观测就几乎无法调试。第 16 章主题。

- **Trace（追踪 / 调用链）**
  一次完整请求中各步骤（每次 LLM 调用、每次工具调用、每段耗时和 token 消耗）的有序记录。看 trace 是排查"Agent 为什么这么做""钱花在哪一步"的主要手段。

- **Token 成本 / 成本控制（Cost / Token Accounting）**
  按输入/输出 token 计量的 API 费用，以及通过缓存、压缩上下文、选小模型等手段控制开销的实践。Agent 多步循环会放大成本，必须在可观测的基础上持续优化。

---

## 八、安全与护栏（Safety & Guardrails）

> → 贯穿全程，重点在工具系统（lesson 06）与生产化阶段（lessons 15–16）

- **提示注入（Prompt Injection）**
  攻击者把恶意指令藏在用户输入或被检索的外部内容里，诱导 Agent 偏离原任务（如泄露密钥、执行危险操作）。是 Agent 特有且高危的安全风险，凡是引入外部数据就要警惕。

- **护栏（Guardrails）**
  在模型输入/输出两侧加的一层安全与合规校验，过滤危险指令、敏感信息和不合规输出，约束 Agent 行为在安全边界内。包括输入清洗、输出审查、工具权限限制等。

- **越狱（Jailbreak）**
  通过特制提示绕过模型的安全限制、诱导其产出本应拒绝内容的行为。属于提示注入的一类，护栏设计需专门防范。

- **最小权限（Least Privilege）**
  只给 Agent 和它的工具完成任务所必需的最小权限（如只读、限定目录、限定 API 范围）。一旦被注入或出错，能把破坏面控制到最小。安全设计的基本原则。

---

## 速查：术语 ↔ 章节对照

| 主题 | 关键术语 | 对应章节 |
|------|----------|----------|
| LLM 基础 | LLM、Token、上下文窗口、Temperature | lessons/02 |
| 提示工程 | System/User 提示、Few-shot、CoT、幻觉 | lessons/03 |
| Agent 与循环 | Agent、Agent 循环 | lessons/01、04 |
| 推理模式 | ReAct、Plan-and-Execute、Reflection | lessons/10 |
| 工具调用 | Function Calling、Tool、ToolSpec | lessons/05、06 |
| 记忆 | 短期记忆、Scratchpad | lessons/07 |
| 向量检索 | Embedding、向量数据库、余弦相似度、语义检索 | lessons/08 |
| RAG | RAG、分块、Top-k、重排序 | lessons/09 |
| 多智能体 | 多智能体、Supervisor/Worker、编排、Handoff | lessons/11、capstone |
| 结构化输出 | 结构化输出 | lessons/13 |
| 流式与 UX | SSE / 流式 | lessons/14 |
| 评估 | 评估、LLM-as-judge、黄金数据集 | lessons/15 |
| 可观测与成本 | 可观测性、Trace、Token 成本 | lessons/16 |
| 安全 | 提示注入、护栏、最小权限 | 贯穿全程 |

> 没找到想查的词？欢迎在学习过程中补充——一份好的术语表是随项目一起长大的。
