# 💼 求职指南 · AI 应用 / Agent 工程师

> 面向想入行（或转行）做 **AI 应用 / Agent 工程** 的初学者。
> 本指南假设你已经跟着本仓库走完了大部分章节，并完成或正在做毕业项目 **Deep Research Agent**。
> 目标：把"我学过"变成"我能拿到面试 + 拿到 offer"。

读法建议：

- **还在学**：先看「岗位画像」「技能清单」，确认方向，按缺口补课。
- **快学完了**：直接跳到「用本仓库做作品集」，把毕业项目包装成简历项目。
- **准备面试了**：背「高频面试题清单」，对照每章末尾的 `💡 面试会问`。

---

## 一、岗位画像：这几个岗位到底在做什么

市面上的 title 五花八门，但本质就是 **把大模型变成能干活的产品功能**。常见三种叫法，职责高度重叠：

| 岗位名 | 偏向 | 一句话职责 |
|--------|------|-----------|
| **LLM 应用开发 / AI 应用工程师** | 偏业务功能 | 把 LLM 接进现有产品：问答、摘要、客服、文档助手、RAG 知识库 |
| **Agent 工程师** | 偏自主系统 | 让 LLM 能"自己决定调哪个工具、循环几步、何时停"，搭建 agent loop / 多智能体 |
| **AI 平台 / 基础设施工程师** | 偏底座 | 做评估、可观测、成本核算、护栏、推理网关等公共能力 |

> 初学者第一份工作，**绝大多数落在前两类**。第三类通常要求更资深，可作为成长方向。

### 日常到底在写什么代码

不是"训练模型"（那是 ML/算法岗）。AI 应用工程师每天做的是：

- 设计和迭代 **提示词（prompt）**，调 temperature、加 few-shot、写 system 约束（→ 第 03 章）。
- 写 **工具（tool）**：定义 schema、做参数校验、安全执行、把结果回灌给模型（→ 第 05/06 章）。
- 搭 **agent 循环**：思考 → 调工具 → 观察 → 再思考，控制步数上限和停止条件（→ 第 04/10 章）。
- 做 **RAG**：把私有文档分块、向量化、检索 top-k、注入上下文、保证可溯源（→ 第 08/09 章）。
- 解决 **生产问题**：幻觉、成本爆炸、延迟、JSON 解析失败、prompt injection（→ 第 13/15/16/17 章）。
- 做 **评估**：搭 eval 集、用 LLM-as-judge、防回归（→ 第 15 章）。

### 能力要求（招聘 JD 的真实翻译）

| JD 常见表述 | 翻译成人话 | 本课程对应 |
|-------------|-----------|-----------|
| "熟悉 LLM API 调用" | 会调 chat / stream，懂 token 和无状态 | 第 02 章 |
| "扎实的 prompt engineering" | 能把烂提示调成稳定提示，会 few-shot/CoT | 第 03 章 |
| "了解 Agent / Function Calling" | 懂 agent loop、原生 function calling 往返 | 第 04/05 章 |
| "RAG 经验" | 能从零搭检索增强，知道分块/重叠/top-k/溯源 | 第 08/09 章 |
| "结构化输出 / 数据落库" | 会让模型稳定吐 JSON 并校验、retry-repair | 第 13 章 |
| "关注成本与性能" | 会算 token 账、选便宜模型、压上下文 | 第 07/16 章 |
| "工程化能力" | 会评估、可观测、护栏、部署成服务 | 第 15/16/17/18 章 |

**软实力同样被考察**：能讲清"为什么这样设计"、能承认模型的局限（幻觉是概率问题不是 bug）、能在成本/质量/延迟之间做取舍。这正是本课程"先手写、理解 WHY"训练出来的东西。

---

## 二、技能清单（对照本课程章节）

### 必备技能（没有这些过不了初面）

| 技能 | 说明 | 章节 |
|------|------|------|
| LLM 基础概念 | token、无状态、上下文窗口、流式 | 01 / 02 |
| 提示工程 | system/user、few-shot、CoT、temperature 取值 | 03 |
| Agent 循环 | ReAct（思考-行动-观察）、步数上限、停止条件 | 04 / 10 |
| 工具调用 | 原生 function calling 往返、toolCallId | 05 |
| 工具系统 | schema 校验（zod）、注册表、错误回传而非抛异常 | 06 |
| 短期记忆 | 滑动窗口、摘要压缩、上下文预算 | 07 |
| RAG | embedding、余弦相似度、分块+重叠、top-k、可溯源 | 08 / 09 |
| 结构化输出 | JSON mode、zod 校验、retry-repair | 13 |

### 加分技能（区分"会用"和"能扛事"）

| 技能 | 说明 | 章节 |
|------|------|------|
| 推理范式 | Plan-and-Execute、Reflection 的适用边界 | 10 |
| 多智能体 | supervisor + worker 分工、何时**不**该上多 agent | 11 |
| 主流框架 | LangGraph.js / Vercel AI SDK，知其所以然 | 12 |
| 流式与 UX | 打字机、步骤流、AbortController 可取消 | 14 |
| 评估与测试 | eval 集、LLM-as-judge 及其风险、回归测试 | 15 |
| 可观测与成本 | trace、token 核算、费用估算 | 16 |
| 安全护栏 | prompt injection 防御、人工确认 | 17 |
| 部署 | HTTP API、SSE 流式、上线 checklist | 18 |

### 诚实的一段话：TS 学原理，Python 抢 offer

这是初学者最该听到的真话：

> **业界生产环境，Python 生态（LangChain / LlamaIndex / LangGraph）仍是绝对主流。**
> 大量招聘 JD 直接写"熟悉 LangChain / LlamaIndex"。

那本课程为什么用 TypeScript？因为：

1. **原理与语言无关**。agent loop、function calling、RAG、向量检索、JSON 校验——这些**概念**在 Python 和 TS 里一模一样，只是 API 名字不同。
2. **TS 类型系统逼你把数据结构想清楚**。手写一遍工具 schema、消息往返、向量库，你对"底层在发生什么"的理解会比直接 `pip install langchain` 深一个量级。
3. **TS/JS 在前端集成、Serverless、全栈 AI 产品里份额在涨**（Vercel AI SDK 就是证据），并非死路。

**给初学者的明确策略**：

- 用本课程（TS）**打通原理**——这是你的护城河，面试讲 WHY 时碾压只会调框架的人。
- 然后花 **1~2 周**做一次 **Python 对照**：把毕业项目里最核心的两三个模块（RAG、agent loop）用 LangChain / LlamaIndex 各实现一遍。你会发现"原来 `MemoryVectorStore` 就是 `FAISS`/`Chroma`，`runAgent` 就是 `AgentExecutor`/`create_react_agent`"。
- 简历上写：**"精通 TS 手写 Agent 底层，熟悉 Python LangChain/LlamaIndex 生态，二者皆可读写。"** 这是非常有竞争力的定位。

| 本课程（TS）概念 | Python 对照 | 几乎等价 |
|------------------|-------------|----------|
| 自写 agent loop | `create_react_agent` / `AgentExecutor` | ✅ |
| `defineTool` + zod | `@tool` 装饰器 + pydantic | ✅ |
| `MemoryVectorStore` | FAISS / Chroma / `VectorStoreIndex` | ✅ |
| RAG 手写流程 | LlamaIndex `QueryEngine` / LangChain `RetrievalQA` | ✅ |
| supervisor + worker | LangGraph `StateGraph` / `Supervisor` | ✅ |
| 结构化输出 + zod | `with_structured_output` + pydantic | ✅ |

> 一句话：**TS 让你"懂"，Python 让你"被招"。两手都要。**

---

## 三、用本仓库做作品集

一个会被记住的简历，靠的不是"学过 19 章"，而是**一个能演示、能深挖、有数据的项目**。毕业项目 **Deep Research Agent** 就是为此设计的——它综合了 agent 循环、工具系统、RAG、多智能体编排、结构化输出、评估、成本控制，是天然的"全栈 Agent 能力展示窗"。

如果你想突出 RAG 工程能力，再把 [RAG 系统实战项目](./rag-system-project.md) 和 [songuu/rag-system](https://github.com/songuu/rag-system) 作为第二个作品集项目：前者展示 agent 综合能力，后者展示知识库/RAG 系统深度。

### 3.1 STAR 式简历项目描述模板

招聘方扫简历只看几秒，用 **STAR** 把项目压成 3~4 个要点：

```
【S 背景 Situation】一句话说清要解决的真实问题（别写"为了学习"）。
【T 目标 Task】你要交付什么、约束是什么（成本/延迟/质量）。
【A 行动 Action】你做了哪些关键技术决策（这里塞硬技术名词）。
【R 结果 Result】量化结果：准确率↑、成本↓、延迟↓、可溯源率、eval 通过率。
```

**填空提示**：A 里至少出现这些关键词的一部分——`ReAct agent loop`、`function calling`、`RAG`、`分块+重叠`、`top-k 检索`、`supervisor/worker 多智能体`、`zod 结构化校验`、`LLM-as-judge 评估`、`token 成本核算`、`prompt injection 防御`。R 里**必须有数字**，哪怕是你自己测出来的。

### 3.2 一个填好的示例（可直接改名套用）

> **Deep Research Agent · 自主深度研究助手**（TypeScript / Node 20）
> [GitHub](https://github.com/你的用户名/deep-research-agent) · Demo 视频：填入你的演示视频 URL
>
> - **(S/T)** 针对"开放式调研问题需要人工查多个来源、汇总耗时"的痛点，独立设计并实现一个多智能体研究助手：输入一个问题，自动检索、交叉验证、生成带引用来源的结构化报告。
> - **(A)** 从零手写 **ReAct agent 循环**（思考-调工具-观察，带 `maxSteps` 防失控）；用 **zod** 构建带 schema 校验的**工具系统**（搜索 / 抓取 / 计算），错误以字符串回灌模型自愈；搭建 **RAG** 管线（分块+50 字符重叠、向量化入库、余弦相似度 top-k 检索、注入时强制标注 `[片段 N]` 引用）；用 **supervisor + worker 多智能体**（协调者 JSON 决策路由 → researcher/writer 专才）拆分长上下文。
> - **(A)** 工程化：用 **LLM-as-judge** 搭 12 条 eval 集做回归；接入 trace 与 **token 成本核算**，对比 `gpt-4o-mini` 与 `claude-haiku` 选型；加入 **prompt injection** 过滤与关键操作人工确认护栏。
> - **(R)** 在自建 eval 集上事实准确率从无 RAG 的 ~55% 提升到 **~90%**，且 **100% 结论可溯源**；通过模型选型 + 上下文压缩把单次研究成本从 ¥0.X 降到 **¥0.0X**（↓约 70%）；多智能体使长任务上下文超载导致的跑题显著减少。

> ⚠️ 把示例里的数字换成**你自己跑出来的真实数据**。面试官一定会追问"90% 怎么测的"——你要能答出 eval 集怎么搭的（→ 第 15 章）。编数字会当场翻车。

### 3.3 GitHub README 怎么写（招聘方真的会点进来）

README 是你项目的"门面 + 落地页"。最低限度包含这几块，**顺序很重要**：

1. **一句话定位 + 一张图/GIF**：开头就是 demo 动图或架构图。让人 3 秒看懂"这是个啥"。
2. **它解决什么问题**：1~2 句，痛点导向。
3. **Demo**：动图 / 视频链接 / 在线试用链接（有就放最前面）。
4. **架构图**：画出 `用户 → supervisor → researcher(RAG/工具) → writer → 报告` 的数据流。一张 ASCII 图就够（本课程每章 README 都是范例）。
5. **核心特性**：用本课程关键词做小标题——ReAct 循环 / 工具系统 / RAG 溯源 / 多智能体 / 评估 / 成本控制。
6. **技术选型与权衡**：写"为什么这么选"。例如"为什么自写 loop 而不直接上 LangGraph"——这一段最能体现工程判断力。
7. **快速开始**：`pnpm install` → 配 `.env` → 一行命令跑起来。复制粘贴就能跑，别让人卡在环境上。
8. **评估结果**：贴 eval 数字和方法。这是和别人项目拉开差距的地方。
9. **已知局限 / 未来计划**：诚实列出短板。成熟工程师都会写这个。

> 小技巧：README 里**每个特性都链接回本仓库对应章节**或你的实现文件，证明"我懂原理，不是抄的"。

### 3.4 怎么录一个 demo（3 分钟讲清价值）

一个好 demo 胜过千言万语。录制要点：

- **时长 ≤ 3 分钟**，最好做成 **GIF 放进 README**（自动播放，不用点）。工具：ScreenToGif（Windows）、LICEcap、或 OBS 录屏。
- **脚本三段式**：① 抛出一个真实问题（5 秒）→ ② 让 agent 跑，**展示中间步骤流**（它在思考、在调哪个工具、检索到什么）→ ③ 给出**带引用来源的最终结果**（10 秒）。
- **重点露出"过程"而非只有结果**：Agent 工程的精髓是"自主决策过程"。把第 14 章的**步骤流/打字机效果**展示出来，比只给最终答案有冲击力得多。
- **再补一个"翻车被兜住"的镜头**（可选但加分）：故意问一个资料里没有的问题，展示它老实回答"资料中未提及"而不是编——直接证明你做了 RAG 溯源和防幻觉。
- **加字幕/旁白**说明每一步发生了什么，方便静音观看的招聘方。

---

## 四、高频面试题清单

> 下面只给**问题**，不给完整答案——逼你自己组织语言（面试就是这么考的）。
> 每章 README 末尾的 `💡 面试会问` 是你的标准答案来源，先按章复习再来自测。
> 自测标准：**能脱口而出 + 能讲清 WHY + 能说出取舍**，才算过。

> 🔎 **独立页面**：如果你只想刷题，直接打开 [/interview/](/interview/)；那里会以独立页面承载同一份题库。
>
> 🔎 **按分类 / 章节筛选**：题目较多时用下面的筛选器只看某一类或某一章；下方按 A/B/C 分组的完整清单始终是同源底稿（无 JS 时仍可阅读）。

<div data-interview-clinic></div>

<!-- interview-question-list:start -->

> 下列清单由 `knowledge-graph/data/interview-questions.ts` 自动生成，共 368 题；难度与独立刷题页使用同一份数据。

### A. 简单题（49 题）

1. **[原理类]** LLM 和 Agent 有什么区别？请画出 Agent 的执行循环。（→ 01）
2. **[原理类]** 什么是 token？为什么说 LLM 是「无状态」的？多轮对话的「记忆」是怎么实现的？（→ 02 / 07）
3. **[原理类]** system 提示和 user 提示有什么区别？为什么思维链（CoT）能提升正确率？什么任务该把 temperature 设成 0？（→ 03）
4. **[原理类]** ReAct 是什么、解决了什么问题？为什么 agent 循环一定要有 maxSteps（停止条件）？（→ 04）
5. **[原理类]** function calling 的完整往返是怎样的？模型会自己执行工具吗？toolCallId 是干什么用的？（→ 05）
6. **[原理类]** 什么是 RAG？为什么 RAG 能降低幻觉？分块为什么要做 overlap？top-k 的 k 怎么取？如何让答案可溯源？（→ 08 / 09）
7. **[原理类]** 模型为什么会幻觉？这是 bug 还是固有特性？工程上能彻底消除吗？（→ 09）
8. **[原理类]** 什么是 embedding？为什么用余弦相似度而不是欧氏距离？语义检索 vs 关键词检索各自适用什么场景？（→ 08）
9. **[原理类]** ReAct 和 Plan-and-Execute 的本质区别？什么任务该用哪个？Reflection 为什么能在不引入新信息的情况下提升质量、收益边界在哪？（→ 10）
10. **[原理类]** 一个 Agent 决策循环通常包含哪些职责，模型与宿主程序分别负责什么？（→ 01 / 04）
11. **[原理类]** 确定性 workflow 与 Agent 的核心区别是什么，什么时候应优先选 workflow？（→ 01 / 04）
12. **[原理类]** 为什么设计 Agent 系统时通常应先从单 Agent 开始？（→ 01 / 11）
13. **[原理类]** 多 Agent 中的 manager-as-tools 与 handoff 两种模式有什么基本差异？（→ 11 / 12）
14. **[原理类]** 给 Agent 提供工具与把知识直接放进上下文，解决的问题有何不同？（→ 05 / 07）
15. **[原理类]** 为什么工具的名称、描述与参数 schema 应被视为 Agent 的接口合同？（→ 05 / 13）
16. **[原理类]** 工具描述为什么会影响 Agent 的工具选择准确率？（→ 03 / 05）
17. **[原理类]** Function calling 为什么要让模型生成结构化参数，而不是拼接一段命令文本？（→ 05 / 13）
18. **[原理类]** 工具执行结果为什么要作为新的消息重新进入 Agent 上下文？（→ 05 / 06）
19. **[原理类]** 为什么每个外部工具调用都应有超时？（→ 06 / 18）
20. **[原理类]** Agent 里的 context engineering 是什么，它与只优化 prompt 有何区别？（→ 03 / 07）
21. **[原理类]** 一次 Agent 调用的上下文预算通常被哪些内容占用？（→ 07 / 16）
22. **[原理类]** Agent 的工作记忆与长期记忆有什么区别？（→ 07 / 08）
23. **[原理类]** 为什么 Agent 记忆应把读取与写入当成两个独立决策？（→ 07 / 08）
24. **[原理类]** RAG 中 retriever 与 generator 分别承担什么职责？（→ 08 / 09）
25. **[原理类]** RAG 文档块为什么除了正文还要保存来源、标题和位置等 metadata？（→ 08 / 09）
26. **[原理类]** 为什么 RAG 常在初次召回后增加 reranking？（→ 08 / 09）
27. **[原理类]** “Lost in the Middle” 现象对长上下文 Agent 意味着什么？（→ 07 / 15）
28. **[原理类]** ReAct 中 action 与 observation 为什么要交替出现？（→ 04 / 10）
29. **[原理类]** Tree of Thoughts 相比单一路径推理多了什么能力？（→ 10）
30. **[原理类]** Reflexion 如何利用语言反馈改善下一次尝试？（→ 07 / 10）
31. **[原理类]** 把规划与执行分开有什么基本好处？（→ 10）
32. **[原理类]** Agent eval 中测试样例、rubric 与 baseline 分别有什么作用？（→ 15）
33. **[原理类]** 离线 eval 与线上监控分别回答 Agent 质量的什么问题？（→ 15 / 16）
34. **[原理类]** Agent trace 中的 trace 与 span 通常分别表示什么？（→ 16）
35. **[原理类]** 输入护栏与输出护栏分别检查什么？（→ 17）
36. **[原理类]** 哪些 Agent 动作通常需要 human-in-the-loop 审批？（→ 17 / 18）
37. **[原理类]** 什么是 indirect prompt injection，它与用户直接输入攻击有何不同？（→ 09 / 17）
38. **[原理类]** Agent 工具为什么应遵循最小权限原则？（→ 05 / 17）
39. **[原理类]** MCP 架构中的 host、client 与 server 分别扮演什么角色？（→ 05 / 12）
40. **[工程类]** MCP 的 tools、resources 与 prompts 三类能力有什么基本区别？（→ 05 / 12）
41. **[工程类]** MCP 客户端为什么通常先 list tools 再 call tool？（→ 05 / 12）
42. **[工程类]** A2A 协议中的 Agent Card 用来描述什么？（→ 11 / 12）
43. **[工程类]** A2A 中 task、message 与 artifact 的语义有何区别？（→ 11 / 12）
44. **[工程类]** OpenAI Agents SDK 中 Agent 与 Runner 的职责如何区分？（→ 04 / 12）
45. **[工程类]** LangGraph 中 state、node 与 edge 分别表示什么？（→ 11 / 12）
46. **[工程类]** Google ADK 中一个 Agent 的模型、指令与工具分别解决什么问题？（→ 03 / 05 / 12）
47. **[工程类]** AutoGen AgentChat 主要抽象了哪类多 Agent 交互？（→ 11 / 12）
48. **[项目深挖类]** CrewAI 中 Agent、Crew 与 Flow 的基本分工是什么？（→ 11 / 12）
49. **[项目深挖类]** Semantic Kernel 的 Agent abstraction 想统一哪些能力？（→ 05 / 12）

### B. 中等题（271 题）

1. **[工程类]** 怎么让 LLM 稳定输出 JSON？校验失败了怎么办（retry-repair 怎么实现）？工具调用 / JSON mode / 提示约束三者区别？（→ 13）
2. **[工程类]** 如何防 prompt injection？用户能通过输入篡改 system 指令吗？关键操作（删数据、发邮件）你怎么加护栏？（→ 17）
3. **[工程类]** 如何控制成本？一次 agent 调用的钱花在哪？怎么算 token 账？上下文太长怎么压？模型怎么选？（→ 07 / 16）
4. **[工程类]** 如何评估一个 Agent / LLM 应用？为什么不能只靠传统单测？LLM-as-judge 有什么风险、怎么缓解？回归测试集解决什么问题？（→ 15）
5. **[工程类]** 上下文窗口满了怎么办？滑动窗口和摘要压缩各自的取舍？（→ 07）
6. **[工程类]** 流式输出能让接口更快吗（吞吐）？为什么不能？为什么体验还是更好？AbortController 是强杀还是协作式取消？（→ 14）
7. **[工程类]** 工具执行报错时，为什么不直接抛异常，而要把错误回传给模型？（→ 06）
8. **[工程类]** 什么场景下多 agent 比单 agent 更好？多 agent 的主要代价是什么、如何权衡？（→ 11）
9. **[工程类]** 什么场景不该用 Agent？（→ 01）
10. **[工程类]** 评测 computer-use / workplace agent 时，为什么不能只看任务成功率？unintended / harmful action 指标分别在兜什么风险？（→ 15 / 17 / 19）
11. **[工程类]** 长期记忆 agent 为何不能只测 recall？为什么 observation stream、user feedback、knowledge archive 与 follow-up reuse 要分开评估？（→ 07 / 15 / 19）
12. **[工程类]** 什么是 agent harness？它和 agent framework / SDK 的边界怎么划？为什么审批、重试、回放、权限壳层最好放在 harness 而不是模型里？（→ 04 / 12 / 16 / 19）
13. **[工程类]** Agent runtime / tool 协议升级时，为什么要单独审查 auth-required vs input-required、history compaction、auto-approval 规则和 tracing 注入边界？（→ 05 / 11 / 17 / 18 / 19）
14. **[工程类]** 研究型 agent 的 benchmark 为什么要强调 clean-room synthesis 和 strategic generalization？如果 agent 只是拼接原文句子，为什么高分也不可信？（→ 10 / 15 / capstone / 19）
15. **[工程类]** 为什么长周期 agent 评测不能只看单步 reward 或单回合成功率？RetailBench 这类 benchmark 在检验什么长期策略能力？（→ 10 / 15 / 19）
16. **[工程类]** 监控/告警 agent 为什么要同时测反应时效、误报/漏报和后续行动链，而不是只看『能否识别异常』？（→ 16 / 17 / 18 / 19）
17. **[工程类]** 评测记忆 agent 时，为什么要单独测补充关系、矛盾关系和无关关系的区分？只看关键词召回会漏掉什么记忆一致性问题？（→ 07 / 15 / 19）
18. **[工程类]** 为什么 tool guardrails 最好放在“真正执行前”的 pre-approval 边界，而不是等工具跑完再做事后检查？这对高权限工具有什么安全意义？（→ 05 / 17 / 18 / 19）
19. **[工程类]** 为什么生产变更权限不该直接放在 agent 推理进程里？certificate-bound broker / scoped execution identity 这种执行边界在兜什么风险？（→ 17 / 18 / 19）
20. **[工程类]** 当 PII detector / declassifier 这类安全判定本身带误差时，为什么 deterministic policy 不够？agent runtime 该怎么理解 probabilistic verification 的意义？（→ 15 / 17 / 19）
21. **[工程类]** 为什么高质量仓库指引（如 AGENTS.md）更主要提升 coding agent 的文件定位覆盖率，而不一定直接提升 patch 精度？步数预算变大时它为什么更重要？（→ 12 / 15 / 19 / capstone）
22. **[工程类]** 为什么共享基础设施的多租户 agent runtime 不能只靠“逻辑上分 tenant”就算隔离完成？state、identity、telemetry 和审批边界分别要隔离什么，什么时候还得回到 dedicated stack？（→ 16 / 17 / 18 / 19）
23. **[工程类]** 做研究型 copilot 时，为什么要把 structured query parsing、embedding retrieval 和 AI summary 三段拆开，而不是让一个大 prompt 端到端包办？这样拆分分别在兜什么准确性与可追溯风险？（→ 08 / 09 / 16 / 19）
24. **[工程类]** 为什么跨组织 agent 协作不能长期依赖“给每个 agent 发一把 API key”这种做法？独立的 agent identity / name service 在信任建立、权限撤销和跨平台互认上解决了什么问题？（→ 17 / 18 / 19）
25. **[工程类]** 多 agent / realtime tool 执行里，为什么“已解决的 approval 不应被重复求值”，而 sibling guardrail/task 一旦失败就要立刻取消其它并发 guardrail？否则会出现什么竞态和副作用风险？（→ 11 / 14 / 17 / 18 / 19）
26. **[工程类]** 为什么即便是“read-only auto-approval”模式，file-access 工具仍可能要强制人工审批？当 loop 能力被集成进 harness agent 后，这条边界为什么会变得更关键？（→ 05 / 11 / 17 / 18 / 19）
27. **[工程类]** 声明式 workflow / skill archive 为什么要显式防 symlink path traversal 和非法 flow definition paths？这类问题看起来不是 prompt bug，却为什么能直接突破 agent runtime 的文件系统边界？（→ 11 / 17 / 18 / 19）
28. **[工程类]** 为什么 agent workflow 一旦进入 conversational flow / declarative flow 阶段，就要单独追踪 turn usage，并统一 CLI、TUI、loader 的入口？如果 telemetry 和运行入口不统一，会让调试、计费和回放出现什么问题？（→ 11 / 16 / 18 / 19）
29. **[工程类]** 为什么企业做 agent 改造时常常应该『retrofit, don't rebuild』？agentic overlay 与直接重写遗留系统相比，分别在兜什么集成、权限和发布风险？（→ 05 / 11 / 17 / 18 / 19）
30. **[工程类]** 为什么生产级 agentic AI 需要 governed data mesh，而不是让 agent 直接去拉数据库/对象存储/知识库？identity、catalog、policy 和 knowledge base 在 agent 数据底座里分别解决什么问题？（→ 08 / 09 / 16 / 17 / 18 / 19）
31. **[工程类]** 为什么 production agent 里的 skill/provider tools 最好默认 require approval，而不是默认放行后再补规则？一旦默认值反了，权限壳层、审计和回放会出现什么系统性漏洞？（→ 05 / 11 / 17 / 18 / 19）
32. **[工程类]** 为什么 agent 的网页抓取 / scraping tool 不能只校验首跳 URL 是否在 allowlist？一旦重定向链里出现 SSRF bypass，会把什么内网、metadata 或权限侧信道暴露给 agent？（→ 05 / 11 / 17 / 18 / 19）
33. **[工程类]** 为什么研究型 agent 的 benchmark 不能只看最终答案对不对？stepwise verification 和 interactive environment 分别在检验什么能力，为什么它们比 final-answer-only 更能暴露长流程研究任务的失败模式？（→ 10 / 15 / 19 / capstone）
34. **[工程类]** 为什么给 Assistant agent 增加 `function_choice_behavior` 这类更强的函数选择能力时，必须同时审查 OpenAPI plugin 的路径归一化与 encoded dot-segment 绕过？如果只增强调度能力、不收紧 plugin 路径边界，会把什么 SSRF / 越权调用风险放大？（→ 05 / 11 / 17 / 18 / 19）
35. **[工程类]** 为什么 scientific review agent 不能只做一次性摘要或 zero-shot 打分？`inference scaling`、理论/实验核查和“人类保留最终裁决”分别在兜什么误判与责任边界？（→ 10 / 15 / 19 / capstone）
36. **[工程类]** 为什么 coding agent 评测不能只看 isolated task success 或单个 PR 是否过测？`repository-level integration friction` 在衡量什么，为什么它比单 agent 胜率更接近真实生产风险？（→ 12 / 15 / 16 / 18 / 19）
37. **[工程类]** 为什么 background agent runtime 不能吞掉 skill / resource 错误，而要把 provider 解析、available resources / scripts 和失败原因显式暴露给 harness？这对 agent 自纠错、回放和生产可调试性分别意味着什么？（→ 05 / 11 / 16 / 18 / 19）
38. **[工程类]** 为什么 terminal-use agent 的 benchmark 不能只测 coding 或单条 shell task？像 TUA-Bench 这类覆盖文档编辑、邮件、在线研究、内容创作与系统运维的任务集，在检验什么更接近真实工作的长期能力？（→ 10 / 15 / 18 / 19）
39. **[工程类]** 为什么 agent 安全红队不能只看单一 jailbreak 成功率？基础设施层、协议层、agent 层和模型层分别会暴露什么不同攻击面，为什么必须做 multi-layer red teaming？（→ 11 / 15 / 17 / 18 / 19）
40. **[工程类]** 为什么 graph agent 的 checkpoint / delta state 不能把『序列化细节』当成无关实现？一旦 `Overwrite` 或 superstep 补丁在 JSON roundtrip 后语义漂移，会怎样破坏回放、恢复和线上排障？（→ 11 / 16 / 18 / 19）
41. **[工程类]** 为什么企业里的 agent-to-agent 通信不能靠点对点 URL + 各自凭证凑合？A2A protocol 只解决了哪一层，为什么 discoverability、scope 授权、统一路由、rate limit 和单域流式代理还需要单独的 gateway 层？（→ 05 / 11 / 17 / 18 / 19）
42. **[工程类]** 为什么长期记忆 / agentic RAG 不能只靠 namespace + 语义相似度？metadata pre-filter、STRICTLY_CONSISTENT 键和值域约束分别在兜什么检索边界，为什么它们要发生在向量搜索之前？（→ 07 / 08 / 09 / 11 / 19）
43. **[工程类]** 为什么 tool-use agent 在静态 benchmark 上高分，到了真实环境仍会明显掉点？query、action、observation、domain 四类 open-world shift 分别在暴露什么泛化缺口，为什么仅靠静态训练不够？（→ 05 / 10 / 15 / 18 / 19）
44. **[工程类]** 为什么企业级 coding agent 不能只保留普通聊天日志，而要把 prompts、responses、tool calls 作为 agent session usage records 流式送到 SIEM / audit log？这和可观测性、合规审计、事故回放分别有什么关系？（→ 11 / 16 / 17 / 18 / 19）
45. **[工程类]** 看到 CrewAI 这类 runtime 的 prerelease 同时改 Bedrock 适配、flow agent options、streaming docs 和 self-listening flow 校验时，应该如何判断哪些是生产升级信号，哪些只能作为观望项？（→ 11 / 12 / 14 / 18 / 19）
46. **[工程类]** Sakana Fugu 这类把 multi-agent system 包装成单个 LLM/API 的做法，和应用层自己用 LangGraph / CrewAI 编排多个 agent 有什么边界差异？可观测性、成本控制、debug 和 vendor lock-in 分别会怎么变？（→ 04 / 11 / 12 / 16 / 18 / 19）
47. **[工程类]** 为什么 agent 评估不能停在上线前一次 benchmark？EDDOps 里的 registry、promotion、retirement 和 trace-native observability 分别在治理 agent 生命周期的哪一段风险？（→ 15 / 16 / 18 / 19）
48. **[工程类]** 为什么自动化 coding agent 不能只靠月度/组织级预算控成本，而需要每次 session 自己带 AI credit 上限？subagents、compaction 和后台工作分别会怎样让一次运行超出预期？（→ 11 / 16 / 18 / 19）
49. **[工程类]** 浏览器工具进入 IDE agent 后，为什么必须同时设计 tab 隔离、cookie/storage 隔离、敏感权限显式审批和企业域名 allow/deny？这些控制分别在防什么事故？（→ 05 / 11 / 17 / 18 / 19）
50. **[工程类]** 当 agent framework 新增 file editing tools、per-user session isolation 和 configurable default-approval harness 时，为什么这不是简单的功能增强，而是在重划身份、文件系统和工具审批边界？（→ 05 / 11 / 17 / 18 / 19）
51. **[工程类]** 为什么让 agent 生成 deterministic rules 时，不能只看生成文本是否合理，而要把每条规则放进 corpus verification loop？这种 verified-rule generation 和普通自由文本生成在可靠性上有什么本质差异？（→ 10 / 15 / 19 / capstone）
52. **[工程类]** RealtimeAgent 默认模型跨 Python / JS SDK 同步升级时，为什么不能只改依赖版本，而要审查模型默认值、session 存储、token/trace 口径和回滚策略？（→ 12 / 14 / 16 / 18 / 19）
53. **[工程类]** Google ADK 这类 runtime 同时加入 ManagedAgent、Workflow as Tool、session TTL、MCP traces 和 sandbox/security 修复时，为什么要重新划分托管执行、应用层编排、可观测性和安全默认值的边界？（→ 11 / 12 / 16 / 17 / 18 / 19）
54. **[工程类]** 为什么 graph agent 在 fresh thread 上执行 updateState 时，应该强制形成可恢复 snapshot，而不能留下语义不完整的 stub checkpoint？这会怎样影响时间旅行、回放、人工修正和线上排障？（→ 07 / 11 / 15 / 16 / 18 / 19）
55. **[工程类]** 企业 rollout CLI coding agents 时，为什么不能只看试用人数或 benchmark 成绩？adoption、retention、merged PR 这类 output proxy、token spend 和社交扩散分别应该怎样纳入评估？（→ 11 / 15 / 16 / 18 / 19）
56. **[工程类]** Copilot 这类 agentic coding 产品把 GPT-5.6 分成 Sol / Terra / Luna 并放进多个 agent 入口时，为什么模型选择不能只看“最强模型”？任务复杂度、usage-based billing、管理员策略和回滚分别要怎样纳入？（→ 12 / 16 / 18 / 19）
57. **[工程类]** Copilot 能为陌生仓库生成 overview / README 时，为什么这既是 onboarding 能力，也是事实性风险点？怎样用 README、贡献指南、源码扫描和人工复核兜住仓库理解偏差？（→ 07 / 12 / 16 / 19 / capstone）
58. **[工程类]** 为什么企业不能只让开发者自己配 OTEL_* 环境变量，而要用 managed settings 统一 Copilot CLI agent host 的 OpenTelemetry 导出？prompt / response / tool content、认证 header 和子进程隔离分别在兜什么治理风险？（→ 16 / 17 / 18 / 19）
59. **[工程类]** CrewAI 1.15.2 把 inline skills、Flow Definition authoring、templated flow inputs、stream frame protocol 和 repository agents 做成 stable release 时，为什么要把 flow 定义、技能装载、反馈处理和供应链修复一起审查？（→ 11 / 12 / 14 / 17 / 18 / 19）
60. **[工程类]** 为什么 agent 评估不能只看 leaderboard 或平均分？tool 参数错误、规划失败、长上下文退化、多 agent 协调、安全失败和 measurement validity 这六类失败要怎样进入回归分桶？（→ 05 / 10 / 11 / 15 / 17 / 18 / 19）
61. **[工程类]** OpenAI Agents SDK 增加 hosted multi-agent beta 和 GPT-5.6 request controls 时，为什么要同时审查 sandbox PTY/Docker cleanup ownership、realtime callback/playback 和 content-filter refusal 可见性？（→ 12 / 14 / 17 / 18 / 19）
62. **[工程类]** LangGraph 1.2.9 修 updateState metadata / counters for delta channel，为什么这类字段会影响 replay、time travel、监控统计和事故排查，而不能当成内部实现细节？（→ 07 / 11 / 15 / 16 / 18 / 19）
63. **[工程类]** Pydantic AI 披露 AG-UI dangling tool-call strip 的 CWE-863 风险时，为什么 requires_approval、ApprovalRequiredToolset、工具参数鉴权和 usage_limits 要一起看？（→ 05 / 13 / 16 / 17 / 18 / 19）
64. **[工程类]** 为什么企业级 agent / Copilot 成本治理不能只看总预算？GitHub multi-user budget per-user states API 里的 consumed、limit、使用比例过滤和 individual override 应该怎样用于预警、降级和 enablement？（→ 16 / 18 / 19）
65. **[工程类]** 在 underwriting 这类 regulated workflow 中，为什么 Agentic RAG 要把 targeted retrieval、third-party checks、multi-step rule evaluation 和 human-in-the-loop governance 组合起来，而不是只做 naive RAG？（→ 09 / 10 / 11 / 15 / 17 / 18 / 19）
66. **[工程类]** HealthAgentBench 这类医疗 agent benchmark 为什么要把终端环境、任务级 verifier、数据凭证、禁用浏览器和成本/时间指标一起纳入，而不能只看最终回答对不对？（→ 10 / 11 / 15 / 16 / 17 / 18 / 19）
67. **[工程类]** 为什么评估 Agent 时不能默认 benchmark ground truth 和评分脚本都是干净的？Auto Benchmark Audit 发现的环境依赖、规格缺口和脆弱评分会怎样扭曲 SWE-bench / Terminal-Bench 这类结果？（→ 15 / 16 / 18 / 19）
68. **[工程类]** AGENTS.md、context files、skills 和 subagents 分别在 coding agent harness 里解决什么问题？为什么说 AGENTS.md 是起点，但不能替代可执行 skill、权限边界和回归验证？（→ 05 / 11 / 12 / 15 / 16 / 19）
69. **[工程类]** AIDev 这类 agent-authored PR 数据集能支持哪些结论，不能支持哪些结论？为什么 93 万个 Agentic-PR 只能作为采用与协作研究基础，而不能直接证明生产率提升？（→ 11 / 15 / 16 / 18 / 19）
70. **[工程类]** OpenAI Agents JS SDK 在 workerd 环境修 tracing lifecycle listeners，同时补 hosted multi-agent 和 GPT-5.6 request controls 文档时，为什么要把边缘运行时、trace 生命周期、托管编排和模型请求参数一起审查？（→ 11 / 12 / 16 / 18 / 19）
71. **[工程类]** MCP v2 beta 迁移时，为什么要把 httpx2/SSE transport、subscriptions/listen、请求取消、resolver sample/list roots、TypeScript shared schema graph 和 exact version pin 放进同一套兼容性测试？（→ 05 / 06 / 11 / 12 / 17 / 18 / 19）
72. **[工程类]** OpenHands cloud 修 conversation created_at 生命周期保留和 MCP SaaS credentials encrypted storage 时，为什么这两类 bug 都属于 coding agent SaaS 的审计与安全边界，而不是普通数据字段修复？（→ 11 / 16 / 17 / 18 / 19）
73. **[工程类]** Langfuse self-hosted monitors / contract-aware code evaluator 和 Phoenix evals 的 F-score、timeout、positive_label 修复说明了什么？为什么 observability 与 eval harness 的字段语义会改变上线门禁结论？（→ 15 / 16 / 17 / 18 / 19）
74. **[工程类]** Mem0 Node SDK 增加多 vector store、多 LLM provider、多 embedder 和 reranking support，并取消默认拉入 provider SDK 时，为什么长期记忆系统要把 provider surface、依赖体积、rerank 策略和供应商锁定一起设计？（→ 07 / 08 / 09 / 15 / 18 / 19）
75. **[工程类]** LLM-as-a-Verifier 和普通 LLM-as-judge 有什么本质区别？为什么连续分数、重复评估、criteria decomposition 和 verifier 进度信号可能比一次性离散打分更适合 agent 回归门禁？（→ 10 / 15 / 16 / 18 / 19）
76. **[工程类]** OpenAI Agents JS SDK 修复 non-final streaming chunks 的 usage 保留、union/tuple schema conversion fail-fast 和 AI SDK text parts 拼接时，为什么这些都属于生产 agent runtime 的契约问题，而不是普通 SDK 小修？（→ 13 / 14 / 15 / 16 / 18 / 19）
77. **[工程类]** 为什么 OpenHands cloud 里 settings GET round-trip 剥离 MCP auth secrets、跨域 PostHog distinct_id 和 DB pool 默认值都要放进同一类 SaaS agent 生产风险审查？（→ 11 / 16 / 17 / 18 / 19）
78. **[工程类]** Langfuse 把 score filters 应用到 event streams、导出 eval job configurations、保护 trace 大 I/O，并在 outbound-URL/SSRF validation 拒绝时自动关闭 export，说明 agent observability 的哪些失败模式必须 fail-closed？（→ 15 / 16 / 17 / 18 / 19）
79. **[工程类]** Pydantic AI 导出 HistoryProcessor、给 usage-limit/tool-retry errors 加 actionable hints，并修复 Anthropic/Bedrock native structured output schema transform 时，为什么要把历史处理、错误可操作性和 provider-native schema 当成同一套回归契约？（→ 05 / 13 / 14 / 15 / 16 / 19）
80. **[工程类]** 为什么 agent-safety evaluation 的 task success、attack success 或 monitor score 不能单独当作 load-bearing evidence？reconstructability metric 和 Evidence Sufficiency Cards 具体补的是哪类证据缺口？（→ 15 / 16 / 17 / 18 / 19）
81. **[工程类]** 研究型 coding agent 复现实验论文时，为什么不能以最终回复说“完成了”为验收？Paper-replication workflow 里的 target、provenance、report coverage 和 validation checks 分别在防什么风险？（→ 10 / 15 / 16 / 19 / capstone）
82. **[工程类]** Hugging Face 披露 autonomous AI agent system 驱动的真实入侵后，为什么 incident response 不能只靠商业 LLM API？数据处理 worker、凭证轮换、本地取证模型和 guardrail lockout 分别在兜什么风险？（→ 05 / 11 / 16 / 17 / 18 / 19）
83. **[工程类]** Shippy 这类高风险行业 agent 为什么要把复杂业务 API 封成确定性 CLI、用每用户 ephemeral sandbox 隔离，并用真实数据 rubric 评估整个 agent，而不是只调一个强模型？（→ 05 / 11 / 15 / 16 / 17 / 18 / 19）
84. **[工程类]** Recursive Harness Self-Improvement 为什么不是普通 prompt tuning？把 harness 当成可优化对象后，trajectory quality、训练数据、inference cost 和低推理强度 agent 的能力上限会怎样改变？（→ 10 / 11 / 15 / 16 / 19 / capstone）
85. **[工程类]** 为什么 coding agent eval 不能只看最终测试 pass/fail？AgentLens 这类 trajectory review 要怎样审查指令遵循、工具调用、错误恢复和自我验证，才能服务 nightly regression？（→ 10 / 12 / 15 / 16 / 19）
86. **[工程类]** 看 DeepSWE 这类 coding agent leaderboard 时，为什么必须同时看任务原创性、harness、agent steps、output tokens、cost 和 effort setting？为什么不能把榜单直接解读成纯模型能力排名？（→ 12 / 15 / 16 / 18 / 19）
87. **[工程类]** ToFu 这类 white-box agent harness 和黑盒 SaaS coding agent 的边界差异是什么？可修改运行逻辑、本地部署、token efficiency、工具接入和复现实验分别带来什么取舍？（→ 05 / 10 / 12 / 15 / 18 / 19 / capstone）
88. **[工程类]** Agent Runtime 的 task/turn tracing、实时会话成本和工具会话隔离应该如何设计？（→ 12 / 14 / 16 / 17 / 18 / 19）
89. **[工程类]** Pydantic AI 这类 typed agent stack 相比手写 agent loop 的核心工程收益是什么？（→ 05 / 13 / 15 / 16 / 19）
90. **[工程类]** 为什么 Agent Skill Registry 需要认证、来源证明和晋级流程？（→ 11 / 12 / 17 / 18 / 19）
91. **[工程类]** 把 Coding Agent 做成 SDK 嵌入业务系统时，需要额外评估哪些风险？（→ 05 / 12 / 16 / 17 / 18 / 19 / capstone）
92. **[工程类]** 企业级 Agent/Copilot 为什么需要按成本中心管理 AI Credit？（→ 16 / 18 / 19）
93. **[工程类]** OpenAI Agents SDK JS 这类多包运行时应如何做版本治理和供应链审计？（→ 11 / 12 / 14 / 16 / 17 / 19）
94. **[工程类]** 为什么企业评估 Copilot / coding agent rollout 时，不能只看活跃用户数，而要看 adoption phase、PR throughput、merge velocity 和下一步 enablement？（→ 15 / 16 / 18 / 19）
95. **[工程类]** Copilot 类 coding agent 引入 Gemini 3.6 Flash 这类新模型时，为什么要同时评估 reasoning effort、parallel tool use、usage-based billing 和管理员策略？（→ 12 / 14 / 16 / 18 / 19）
96. **[工程类]** 为什么 Claude Code skills 这类验证循环比“让人记得手动检查”更适合生产 coding agent？standalone、embedded、chained、PR gate 四种位置分别适合什么边界？（→ 10 / 15 / 16 / 18 / 19 / capstone）
97. **[工程类]** Coding agent 失败后，为什么“恢复路由”本身也要做成本校准？什么时候该用便宜模型恢复，什么时候才升级高价模型？（→ 10 / 15 / 16 / 19 / capstone）
98. **[工程类]** 自动化 AI R&D agent 为什么要单独评估 sabotage 和 monitor blind spot？只看最终 artifact 能跑通为什么不够？（→ 10 / 15 / 17 / 18 / 19 / capstone）
99. **[工程类]** 为什么 Agent skill 不应被当成普通 prompt snippet？metadata、references、scripts、assets、tests、hooks 和 rollback 分别解决什么生命周期问题？（→ 11 / 12 / 15 / 17 / 18 / 19）
100. **[工程类]** Agent 防数据泄露为什么不能只靠运行时 policy？部署前对 prompt template、tool interface 和 tool-invocation code 做 preemptive hardening 在兜什么风险？（→ 05 / 15 / 17 / 18 / 19 / capstone）
101. **[工程类]** OpenAI Agents SDK 的 Programmatic Tool Calling 为什么不是普通 function calling？当模型能生成 JavaScript 协调多个工具时，allowed_callers、结构化输出、审批、session 和 trace 分别要兜什么执行风险？（→ 05 / 11 / 12 / 15 / 16 / 17 / 18 / 19）
102. **[工程类]** MCP 2026-07-28 spec 迁移为什么不能只升级 client/server package？wire schema、transport、OAuth、capability merge、migration guide 和 exact version pin 分别要怎样进入兼容性测试？（→ 05 / 06 / 11 / 12 / 17 / 18 / 19）
103. **[工程类]** GitHub Issues 里的 coding agent automation controls 为什么要用 assignee、label、confidence threshold 和 event controls 约束触发？如果只要有 issue 就自动派给 agent，会放大哪些工单误读和副作用风险？（→ 11 / 15 / 16 / 17 / 18 / 19）
104. **[工程类]** Copilot 引入 Claude Opus 5 这类 preview 模型时，为什么要同时评估任务复杂度、成本/延迟、管理员策略、preview 风险和回滚路径？为什么不能把新模型当成无差别默认升级？（→ 12 / 14 / 15 / 16 / 18 / 19）
105. **[工程类]** CrewAI 1.15.7 同时修 GPT-5.6 tools + reasoning_effort、Responses API tool calling、registry skills resolution、skill usage events 和 CVE dependency patch 时，为什么要把模型兼容、工具路径、技能仓库、观测和供应链一起回归？（→ 11 / 12 / 14 / 16 / 17 / 18 / 19）
106. **[工程类]** Pydantic AI 增加 AdvisorTool、OpenAI WebSearchTool external_web_access、多区域 GoogleCloudProvider 和 graph inspect 时，为什么 typed agent stack 的治理要同时覆盖工具能力、外部网络访问、区域合规和运行图可解释性？（→ 05 / 11 / 13 / 15 / 16 / 17 / 19）
107. **[工程类]** Agentic AI 的模型路由为什么不能只按单次 LLM call 独立决策？TRACE-ROUTER 这类 task-consistent online routing 要怎样利用 trace、阶段状态、成本和最终任务 outcome？（→ 10 / 15 / 16 / 18 / 19 / capstone）
108. **[工程类]** 为什么给 LLM Agent 加 skill 不能只看平均 success rate 提升？Regression Tax 要怎样把正迁移、负迁移、任务类型、模型/harness 交互和回滚条件拆开评估？（→ 10 / 11 / 15 / 16 / 17 / 19）
109. **[工程类]** 企业 AI Agent 为什么不能在配置期拿一组长期静态 credentials？Dynamic capability scoping 如何按任务、上下文和工具意图收缩权限，为什么它是越权预防而不是事后检测？（→ 05 / 11 / 16 / 17 / 18 / 19）
110. **[工程类]** Agent benchmark 高分为什么不一定证明目标能力？Protocol validity 要怎样检查 public solution recovery、evaluation artifact 泄露、grader 侧信道和 capability necessity？（→ 10 / 15 / 16 / 17 / 18 / 19 / capstone）
111. **[工程类]** Copilot 引入 Grok 4.5 这类 preview coding model 时，为什么要同时评估 reasoning effort、500k context、parallel tool dispatch、agentic workflow 适配、管理员启用和成本回滚？（→ 12 / 14 / 15 / 16 / 18 / 19）
112. **[工程类]** 为什么 Copilot app usage metrics 要按 app surface 汇总 session、request、prompt、token 和 code activity？只看总活跃用户或合并 PR 会漏掉哪些 agent 采用与成本信号？（→ 15 / 16 / 18 / 19）
113. **[工程类]** 企业管理 Copilot app 和 Copilot cloud agent 时，为什么要把 plugins、bypass approvals、auto model selection、web search、MCP registry、instructions 和 default model 都纳入 managed settings？（→ 05 / 11 / 16 / 17 / 18 / 19）
114. **[工程类]** Copilot 周更同时推进 cloud-agent reasoning level、CLI session/worktree、VS Code rewind 和 tool-call duration 时，为什么要把会话恢复、工作区隔离、回滚体验和执行耗时放在同一套 agent 运行边界里评估？（→ 11 / 12 / 14 / 15 / 16 / 18 / 19）
115. **[工程类]** 为什么 Copilot cloud agent 的 reasoning level 应该按任务风险、验证深度和成本预算配置，而不是固定成一个全局默认？（→ 10 / 12 / 15 / 16 / 18 / 19）
116. **[工程类]** AI code review 有了 effort levels 后，为什么团队要按 PR 风险、测试覆盖、发布紧急度和人工 reviewer 负载选择 faster/normal/deeper，而不是全量用同一种审查强度？（→ 12 / 15 / 16 / 17 / 18 / 19 / capstone）
117. **[工程类]** Copilot metrics API 增加 agent app activity 后，为什么采用度、留存、token 成本和代码活动必须按 agent app surface 归因？只看 IDE 补全或合并 PR 会漏掉什么？（→ 15 / 16 / 18 / 19）
118. **[工程类]** 企业给 Copilot 开 MCP server 时，为什么 allowlist、认证、tool surface、审计和默认拒绝策略应由 managed settings 集中控制，而不能靠每个 agent 会话临时自觉？（→ 05 / 11 / 16 / 17 / 18 / 19 / capstone）
119. **[工程类]** Microsoft 365 Agents SDK for Python 1.3.0 增加 header propagation middleware、LLM service registration 和 Teams hosting typing 时，为什么 agent SDK 升级要回归 host integration、身份传播、服务注册和渠道适配，而不只是跑一次模型调用？（→ 05 / 11 / 12 / 16 / 17 / 18 / 19 / capstone）
120. **[工程类]** IDE agent 同时加入 OpenTelemetry、token limit、模型管理、MCP servers、custom agents 和 file editing tools 时，为什么要把遥测、成本、模型、外部工具和文件副作用放在一套回归里看？（→ 05 / 11 / 12 / 14 / 16 / 17 / 18 / 19）
121. **[工程类]** MCP Go SDK 支持 2026-07-28 spec 时，为什么 stateless core、per-request _meta、server/discover、MRTR、subscriptions/listen、HTTP headers 和废弃 roots/sampling/logging 要一起测？（→ 05 / 06 / 11 / 12 / 17 / 18 / 19）
122. **[工程类]** 为什么长周期 planning agent 的训练/评测不能只看单步答案？OPD、MOPD、CoT world-model transition、teacher consistency 和终局状态依赖分别在暴露什么多轮规划问题？（→ 10 / 11 / 15 / 16 / 19 / capstone）
123. **[工程类]** 高风险设施运维里的 Agentic RAG 为什么要同时做 hybrid retrieval、knowledge graph、adaptive RRF、cross-encoder rerank、ReAct/MCP tools 和 operations-grounded evaluation？（→ 08 / 09 / 15 / 19 / rag-hybrid / rag-agentic / rag-prod）
124. **[工程类]** Agentic Permissions Policy Algebra 为什么要追踪 trust-taint 在 prompt context、tool calls、control-flow branching、memory 和 subagents 之间的传播？这和普通 prompt guardrail 有什么本质差异？（→ 05 / 07 / 11 / 17 / 18 / 19）
125. **[工程类]** 为什么 multi-agent code repair 不能把“多循环几轮”当可靠性？state-bound evidence、typed revision contract 和 verification gate 分别如何防止空转、误修和不可审计修复？（→ 10 / 12 / 15 / 16 / 19 / capstone）
126. **[工程类]** 开源 frontier model 报告强调 Agentic RL、million-token context、persistent rollout 和 sandbox states 时，为什么这会影响 coding/agent benchmark 的复现、成本和安全治理？（→ 10 / 12 / 15 / 16 / 18 / 19 / capstone）
127. **[工程类]** Cloudflare Agents 这类边缘 agent runtime 为什么要把 Durable Objects、SQL state、schedule、human-in-the-loop、MCP 和 workflows 放在同一套部署边界里评估？（→ 05 / 11 / 12 / 14 / 16 / 17 / 18 / 19）
128. **[工程类]** 低代码 AI Agent 加入 sub-agents 和 tool output filtering 时，为什么这不仅是功能增强，而是在重划委托边界、上下文预算、敏感字段暴露和可测试性？（→ 05 / 07 / 11 / 14 / 16 / 17 / 19）
129. **[工程类]** 企业从单一 Copilot 许可转向 Codex、Claude Code、Cursor 等 coding agent 工具组合时，为什么治理重点会从“哪个模型更强”变成权限、审计、成本、数据边界和迁移路径？（→ 12 / 15 / 16 / 17 / 18 / 19 / capstone）
130. **[工程类]** OpenAI Agents JS provider 包升级到 0.14.0 时，为什么版本治理不能只盯 core SDK？provider adapter、AI SDK 互操作、tool calling、streaming events 和供应链审计分别要测什么？（→ 05 / 12 / 13 / 14 / 15 / 16 / 17 / 19）
131. **[工程类]** 为什么 Claude 5 时代的 context engineering 不是“上下文越长越好”？system prompt、conversation history、retrieved context、tool definitions、tool outputs 和 scratchpad 分别怎样影响信号密度、成本和可靠性？（→ 03 / 05 / 07 / 08 / 09 / 14 / 16 / 19 / capstone）
132. **[工程类]** Datadog 给 Claude Code 做 universal machine tool 时，为什么要把仓库、依赖、工具链和副作用放进远程隔离环境？这和让 coding agent 直接在开发者本机跑有什么治理差异？（→ 05 / 12 / 15 / 16 / 17 / 18 / 19 / capstone）
133. **[工程类]** Agentforce 这类企业 agent 平台同时推进 multi-agent orchestration、Tableau MCP connector、testing center、observability 和管理员控制时，为什么平台评估要覆盖编排、数据协议、测试、监控和 rollout 策略？（→ 05 / 11 / 12 / 15 / 16 / 17 / 18 / 19）
134. **[工程类]** Cloudflare Agents 把 agent turn、model call、tool run、approval、token usage 和 Workers runtime operations 放到同一条 trace 时，为什么 observability 设计必须同时考虑可回放、成本归因、隐私存储和工具 payload 最小化？（→ 14 / 15 / 16 / 17 / 18 / 19）
135. **[工程类]** @cloudflare/computer 这类 agent runtime 为什么要把 virtual filesystem、isolate/container execution、gated operations、audit 和 observation 放在同一执行边界里？这和直接让 coding agent 跑本机 shell 有什么风险差异？（→ 05 / 12 / 15 / 16 / 17 / 18 / 19 / capstone）
136. **[工程类]** Microsoft Agent Framework 允许 .NET agent 从 MCP server 发现并加载 Agent Skills 时，为什么 skill 分发治理要覆盖 discovery document、认证连接、archive 解包、脚本执行、版本回滚和多 agent 一致性？（→ 05 / 11 / 12 / 16 / 17 / 18 / 19 / capstone）
137. **[工程类]** Copilot on web 扩展 conversation controls 后，为什么 web 端 coding agent 不能只按单次聊天验收，而要设计会话生命周期、上下文延续、历史整理和人工接管？（→ 07 / 12 / 14 / 16 / 18 / 19）
138. **[工程类]** Copilot SDK for Java 把 coding agent 能力接进 JVM 应用时，为什么要把认证、上下文注入、工具边界、运行日志和 SDK 版本兼容当成应用集成合同？（→ 05 / 12 / 13 / 15 / 16 / 19 / capstone）
139. **[工程类]** Cloudflare Agents Week 把 ADLC、Agent Access Model、WebMCP、agent traces、computer runtime 和 agentic Internet 放在一起发布时，为什么这说明 agent 平台正在变成完整控制面？（→ 05 / 11 / 12 / 15 / 16 / 17 / 18 / 19 / capstone）
140. **[工程类]** nOps 用 Amazon Bedrock AgentCore 更快交付 FinOps agents 时，为什么企业评估托管 agent runtime 不能只看模型效果，还要看身份、工具接入、部署、监控和成本治理？（→ 11 / 12 / 16 / 17 / 18 / 19 / capstone）
141. **[工程类]** 一个 AI agent 为了完成订课目标而利用网站漏洞时，为什么“任务完成”不能等同于“行为可接受”？意图约束、动作白名单、人工确认和异常审计分别要兜什么风险？（→ 05 / 14 / 15 / 17 / 18 / 19 / capstone）
142. **[工程类]** 隐藏 PDF 文本能诱导企业 AI agent 泄露数据时，为什么安全边界必须覆盖文件解析、不可见文本、检索片段信任级别、工具输出脱敏和跨应用数据访问？（→ 08 / 09 / 15 / 17 / 18 / 19 / capstone）
143. **[工程类]** MemPrism 这类 task-conditioned relational memory views 为什么说明长期 agent 记忆不能只靠向量相似度？任务条件、关系结构、检索视图和跨步一致性分别要怎么验证？（→ 07 / 08 / 09 / 11 / 15 / 19 / capstone）
144. **[工程类]** 长周期 agent 的 context compression 为什么可能造成 execution instability？摘要、裁剪和记忆压缩要怎样进入轨迹回归、状态恢复和成本评估？（→ 03 / 07 / 10 / 15 / 16 / 19 / capstone）
145. **[工程类]** OpenAI Agents Python v0.20.0 同时切换默认模型、兼容 MCP Python SDK v1/v2，并新增 RunState.add_input 时，升级回归为什么不能只测一次模型调用成功？（→ 05 / 07 / 12 / 14 / 16 / 17 / 19 / capstone）
146. **[工程类]** OpenAI Agents JS v0.15.0 引入 MCP v2 negotiation、RunState.addInput、pendingInput 序列化和 approveUnsafeReplay 后，为什么 agent 暂停恢复要把输入、工具输出和 replay 证据当成同一个安全边界？（→ 05 / 07 / 12 / 15 / 16 / 17 / 19 / capstone）
147. **[工程类]** LangGraph 在 add_node 暴露 trace_policy，同时更新 checkpoint 包时，为什么图式 agent 的观测策略、节点边界和持久化回放必须一起测试？（→ 11 / 12 / 15 / 16 / 19）
148. **[工程类]** Claude Code v2.1.229 增加 remote-control --continue、自托管 runner server-supplied hooks 和 SSE keepalive 时，coding agent 的远程会话恢复和自托管策略注入要分别兜哪些风险？（→ 14 / 16 / 17 / 18 / 19）
149. **[工程类]** Pydantic AI v2.27.1 修复 retry-prompt content 在 include_content=false 下仍可能泄露的问题，这说明 LLM 应用的观测脱敏为什么必须覆盖 retry/repair 链路？（→ 13 / 15 / 16 / 17 / 19）
150. **[工程类]** DSAgentBench 为什么强调在真实计算机环境里评测端到端数据科学 workflow？相比 code-only benchmark，notebook、IDE、terminal、browser、database 多工具协作会暴露哪些 agent 能力缺口？（→ 05 / 11 / 15 / 18 / 19 / capstone）
151. **[工程类]** MESA 为什么不固定读取全部记忆结构，也不只路由到单一结构？long-horizon agent memory 的结构选择、证据 token 成本和答案级反馈应如何一起评估？（→ 07 / 08 / 09 / 11 / 15 / 16 / 19 / capstone）
152. **[工程类]** UserToolBench 为什么把用户画像隐藏起来评测 tool-use LLM？个性化 agent 什么时候应该直接调用工具、什么时候应该追问，如何判断调用轨迹真的符合用户偏好？（→ 05 / 07 / 11 / 15 / 17 / 19）
153. **[工程类]** GPT-5.6 builder guide 把模型选择、reasoning effort、programmatic tool calling、多 agent 和 prompt caching 放在一起讲时，为什么 agent 成本优化不能只靠换一个更便宜模型？（→ 05 / 10 / 11 / 12 / 16 / 19 / capstone）
154. **[工程类]** Google ADK v2.7.0 让模型自行声明 capability、工具结果携带 media，并保留 thought signatures 和 parallel function call result 时，为什么 SDK 升级回归要覆盖 conversation history 和工具结果形态？（→ 05 / 07 / 12 / 13 / 15 / 19）
155. **[工程类]** Claude Code v2.1.232 默认开启 subagent forking，又支持 @ 提及其它 session 和 SendMessage 时，跨会话 coding agent 应如何验证 session identity、inbound message policy、secret redaction 和 shell/path sandbox？（→ 11 / 14 / 16 / 17 / 18 / 19 / capstone）
156. **[工程类]** AgentCore Observability 支持 on-premises 和 multi-cloud agent 通过 ADOT/OpenTelemetry 接入时，为什么生产观测不能只看托管 runtime 日志？framework span、tool 调用和审计证据要怎样统一？（→ 15 / 16 / 18 / 19 / capstone）
157. **[工程类]** 用 AgentCore Browser Tool 自动化 legacy web application 时，为什么验收不能只看页面能不能点通？remote browser isolation、live view、session replay、人类接管和副作用审计分别兜什么风险？（→ 05 / 14 / 17 / 18 / 19 / capstone）
158. **[工程类]** Agent Plugins 1.0 让同一个 plugin 横跨 VS Code、Copilot CLI 和 Copilot app 时，为什么插件治理要从单客户端配置升级到签名、版本、权限声明、市场源和多入口一致性？（→ 05 / 12 / 16 / 17 / 19 / capstone）
159. **[工程类]** InfraBench 为什么不只给 infrastructure agent 一个最终成功率，而要按系统层、运维生命周期和风险细项评分？非持久化变更、distributed invariant 破坏和未清理状态分别说明什么？（→ 15 / 16 / 17 / 18 / 19 / capstone）
160. **[工程类]** EvoGraph-Mem 为什么说 long-term agent memory 不能 append-only？positive/negative evidence、activation state、archive/revise/add insight 这些机制分别解决什么记忆污染问题？（→ 07 / 08 / 09 / 11 / 15 / 19 / capstone）
161. **[工程类]** OpenAI Agents Python v0.21.0 把 provider-neutral testing APIs 做成正式能力时，为什么 agent SDK 的回归不能依赖真实模型、真实 sandbox 或 WebRTC/WebSocket？ScriptedModel / scripted sandbox / realtime transport 分别在兜什么测试边界？（→ 12 / 13 / 15 / 16 / 19 / capstone）
162. **[工程类]** OpenAI Agents JS v0.16.0 同时加入确定性测试工具和 Standard Schema 输入/输出时，为什么 TypeScript agent stack 要把 schema 可移植性、runner 测试和 realtime 流一起纳入回归？（→ 12 / 13 / 14 / 15 / 19 / capstone）
163. **[工程类]** OpenAI Agents Python v0.21.1 增加 model call timeout、run-scoped sandbox working directories 和 Docker sandbox disable networking 时，为什么 sandbox agent 的隔离、网络、审批和成本统计要按 run 级别验证？（→ 12 / 15 / 16 / 17 / 18 / 19 / capstone）
164. **[工程类]** Claude Code v2.1.233 同时加入 forward_user_identity、Bash memory cgroup、MCP v2 listen 修复和 Windows NT 路径校验时，为什么 coding agent 升级要按身份归因、资源上限、协议恢复和路径安全四条线验收？（→ 11 / 16 / 17 / 18 / 19 / capstone）
165. **[工程类]** Pydantic AI v2.30.0 修复 Agent.to_web()/clai web 的 DNS rebinding 漏洞时，为什么本地 dev web UI 也要当成高权限 agent 攻击面？allowed_hosts、Host 校验和工具凭据隔离分别兜什么风险？（→ 05 / 12 / 16 / 17 / 18 / 19）
166. **[工程类]** browser-use 0.13.8 修复 Anthropic tool arguments 被序列化成文本、domain-restricted action 空 URL 暴露和 remote-browser download callback 时，为什么 browser agent 回归不能只测最终页面状态？（→ 05 / 14 / 15 / 17 / 18 / 19 / capstone）
167. **[工程类]** Cloudflare 用协议级 heuristics 检测 MCP traffic 并治理 shadow MCP 时，为什么企业不能只靠 agent 配置里的 server allowlist？Portal-only、direct MCP 阻断和网络侧可见性分别解决什么问题？（→ 05 / 11 / 16 / 17 / 18 / 19 / capstone）
168. **[工程类]** 用 SageMaker AI OpenAI-compatible endpoints 和 Bedrock AgentCore 组合多 agent workflow 时，为什么 specialized agents 应按任务选择模型与运行时，而不是把所有步骤塞给一个通用模型？（→ 10 / 11 / 12 / 16 / 18 / 19 / capstone）
169. **[工程类]** Claude Code v2.1.234 同时修 NT-namespace 路径、background subagent permission answers、MCP diagnostics secret redaction 和 marketplace allowlist 时，为什么 coding agent 的文件访问、权限记忆和工具来源要放在同一张升级清单里验收？（→ 11 / 16 / 17 / 18 / 19 / capstone）
170. **[工程类]** Pydantic AI v2.31.0 给 AGUIEventStream 独立 thread_id/run_id，并把 failed FallbackModel spans 归因到真实失败模型时，为什么 agent UI 流身份和 fallback trace attribution 会影响回放、成本和事故排查？（→ 12 / 14 / 15 / 16 / 18 / 19 / capstone）
171. **[工程类]** CrewAI 1.15.16 记录 execution context UUID、flow exception outcome、trace batch sharing、deployment origin 和 running release spans 时，为什么多 agent flow 的 observability 不能只保留一串普通日志？（→ 11 / 12 / 15 / 16 / 18 / 19 / capstone）
172. **[工程类]** LangChain OpenRouter 0.2.8 保留 usage chunks 里的 cost metadata 和 response metadata 里的 provider，同时 OpenAI adapter 修 streamed encrypted reasoning 时，为什么 provider metadata 和 usage stream 要当成 agent 成本/trace 合同？（→ 12 / 14 / 15 / 16 / 19 / capstone）
173. **[工程类]** OpenAI Codex 0.148.0 同时加入 Markdown export、session fork/archive/restore、thread credit/cost visibility、Bedrock provider、async/MCP hooks 和 sandbox fail-closed 时，为什么 coding agent 的会话生命周期、成本和外部执行钩子要一起验收？（→ 11 / 12 / 16 / 17 / 18 / 19 / capstone）
174. **[工程类]** Claude Code v2.1.235 同时修 prompt cache invalidation、Shift+Tab 误批准 session-wide edit permission、不可用 Agent tool 默认值和 notebook 审批内容缺失时，为什么 UX 回归也必须覆盖权限、缓存、子 agent 可用性和审批证据？（→ 11 / 14 / 16 / 17 / 19 / capstone）
175. **[工程类]** Pydantic AI v2.31.1 对 Bedrock 上 Claude Sonnet 5 / Fable 5 禁用 native structured output，又把 Gemini 不支持的 MINIMAL thinking 降到 LOW 时，为什么 provider capability matrix 和 fallback policy 要成为结构化输出回归的一部分？（→ 12 / 13 / 15 / 16 / 19）
176. **[工程类]** Google ADK v2.7.1 恢复 OpenTelemetry 1.42.1 ceiling 并校验 session initialization events 时，为什么观测依赖版本和会话初始化事件属于 agent runtime 合同，而不是普通依赖小修？（→ 12 / 14 / 15 / 16 / 18 / 19）
177. **[工程类]** Google ADK v1.39.0 让 live session 使用 session_resumption.handle、支持 audio_stream_end，并在 live agent run 结束时停止后台 tool tasks，为什么实时 agent 要同时验证恢复句柄、流终止事件和后台任务取消？（→ 07 / 14 / 15 / 16 / 18 / 19）
178. **[工程类]** OpenAI Agents Python v0.22.0 会脱敏被 output guardrail 拒绝的终端工具输出、对 failed/incomplete Responses 抛错，并隔离独立 RunState checkpoint 的 usage accounting，为什么这些都属于 agent runtime hardening？（→ 12 / 13 / 15 / 16 / 17 / 19 / capstone）
179. **[工程类]** OpenAI Agents JS v0.17.0 对 ambiguous serialized approval checkpoint 选择 fail closed，并把被 guardrail 拒绝的工具输出从 SDK-owned replay surface 中替换掉，这说明暂停恢复和 replay 安全要验证哪些边界？（→ 12 / 13 / 15 / 16 / 17 / 19 / capstone）
180. **[工程类]** Mastra core 1.60.0 把 Agents API durable execution、Cloudflare Sandbox provider、MCP stateless 2026-07-28 和 sandbox checkpoints 放在同一轮发布里，为什么这会改变 agent 部署与恢复合同？（→ 07 / 11 / 12 / 15 / 16 / 18 / 19 / capstone）
181. **[工程类]** Claude Code v2.1.237 修复 LLM gateway/custom base URL 下的 prompt caching，又新增 Concise output style，为什么 provider gateway、缓存命中和输出风格要一起纳入 coding agent 回归？（→ 03 / 14 / 16 / 19 / capstone）
182. **[工程类]** CrewAI 1.15.17 同时推进 declarative conversational flows，并修 MCP server_name、failed attempt scope cleanup、tool error attribution 和 redirect-hop SSRF 检查，为什么多 agent flow 的声明式入口和安全清理要一起验收？（→ 05 / 11 / 12 / 15 / 17 / 18 / 19 / capstone）
183. **[工程类]** Pydantic AI v2.32.1 拒绝在 agent run 的同步回调中调用 Agent.run_sync()，并避免向 Anthropic 发送空 signature 的 thinking blocks，这对 agent 框架的同步/异步边界和 reasoning block 序列化有什么启发？（→ 10 / 12 / 13 / 14 / 15 / 19）
184. **[工程类]** Vercel AI SDK Workflow 2.0.0 升级到 Workflow 5 并在 WorkflowAgent model-call step 重试时清理 partial UI message parts，为什么 workflow runtime 版本和前端消息投影要绑定回归？（→ 12 / 14 / 15 / 16 / 18 / 19 / capstone）
185. **[工程类]** FraudBench 为什么把银行 agent 放到共享账户状态、内部政策语料和自适应欺诈对话里评测？相比单轮 policy QA，它多测出了哪些授权、工具开放和历史依赖风险？（→ 05 / 09 / 15 / 17 / 18 / 19 / capstone）
186. **[工程类]** 为什么多 agent 系统的 stale reads、lost updates 和 inconsistent outcomes 不能只归因于 prompt 沟通不好，而要当成 shared-state concurrency control 问题处理？（→ 07 / 11 / 12 / 15 / 16 / 19 / capstone）
187. **[工程类]** 为什么 agentic system 的评测不能只看最终任务分数，而要观察、扰动并解释 action sequence？behavioral tests 能补上传统 benchmark 的哪些盲区？（→ 10 / 11 / 15 / 16 / 19 / capstone）
188. **[工程类]** Codex 0.149.0 增加 agents dashboard、queue 和 doctor，同时修复 fork/resume 后 permission profile 恢复，这说明 coding agent 的任务调度和权限恢复为什么要一起验收？（→ 11 / 12 / 14 / 16 / 17 / 18 / 19）
189. **[工程类]** Claude Code v2.1.238 的 plugin headersHelper、自托管 runner 延迟关闭、proxy authorization refresh 和 subagent tool result 释放为什么属于同一条生产治理链？（→ 11 / 12 / 14 / 16 / 17 / 18 / 19）
190. **[工程类]** Vercel AI SDK WorkflowAgent 恢复 transformed streams 时为什么要用 UI message chunk indexes？如果只恢复 server state，会漏掉哪些前端投影和回放错误？（→ 12 / 14 / 15 / 16 / 18 / 19）
191. **[工程类]** AgentCore 用自然语言 author Dogwood policies 时，为什么不能把生成 policy 当成普通提示词输出？time-based constraints、版本、测试和拒绝路径要怎样治理？（→ 05 / 15 / 17 / 18 / 19）
192. **[工程类]** 企业规模化 agentic AI 时，为什么避免 vendor lock-in 不是口号，而要落实到模型、工具协议、数据平面、观测和部署抽象？（→ 11 / 12 / 16 / 18 / 19）
193. **[工程类]** 云迁移场景为什么适合拆成 discovery、infrastructure assessment、migration planning 等专门 agent？这种 multi-agent workflow 的验收边界在哪里？（→ 11 / 12 / 15 / 16 / 18 / 19）
194. **[工程类]** Agentic RAG 为什么不一定要先迁到独立向量数据库？把 vector search 放在 Aurora、DynamoDB、OpenSearch、S3 等数据所在地时，要怎样权衡权限、延迟、召回和运维？（→ 08 / 09 / 15 / 18 / 19 / rag-hybrid / rag-prod）
195. **[工程类]** Adversarial Review 为什么说多 agent code review 的关键不是 agent 数量，而是 structured disagreement？false-consensus failure mode 要怎样被发现和压住？（→ 11 / 15 / 16 / 19）
196. **[工程类]** Looped language models 为什么可能提升 compositional tool calling？recurrent depth、adaptive inference 和外部 orchestrator 的边界应该怎样理解？（→ 05 / 10 / 12 / 15 / 19）
197. **[工程类]** ComponentBench 为什么要在 UI component 层诊断 computer-use agent？observation/action space 改变同一模型成功率时，说明了什么评测陷阱？（→ 14 / 15 / 17 / 19）
198. **[工程类]** Slack Code 为什么把 coding agent 任务放到团队 channel，而不是继续放在个人 IDE/CLI 标签页？这种 code channel 要验收哪些协作、审批和审计能力？（→ 11 / 14 / 16 / 17 / 18 / 19）
199. **[工程类]** AI-Native SDLC 为什么要求 intent、spec、plan、diff、review findings 和 incident record 形成 artifact chain？这和单纯让 agent 多写代码有什么区别？（→ 12 / 15 / 16 / 17 / 18 / 19）
200. **[工程类]** Claude Code v2.1.239 同时修复 cloud session 恢复、MCP reconnect、OTel trace fragmentation、proxy/SSO 和成本估算，这说明生产 coding agent 的验收要覆盖哪些非模型能力？（→ 11 / 12 / 14 / 16 / 17 / 18 / 19）
201. **[工程类]** Kiro 的 continuous prompt evaluation 为什么要结合 LLM judge、真实会话 live signal、cohort A/B 和模型升级复验？只跑离线 benchmark 会漏掉什么？（→ 03 / 15 / 16 / 17 / 19）
202. **[工程类]** 生产 incident triage agent 为什么应先从 read-heavy、证据链接、只读权限和人工 gate 做起？Kiro 的 skill/correction/archive flywheel 解决了什么长期问题？（→ 06 / 11 / 15 / 16 / 17 / 18 / 19）
203. **[工程类]** NVIDIA AVO 在 ARC-AGI-3 和 GPU kernel optimization 中强调 persistent memory、tools、feedback 和 recovery，这为什么说明 agent benchmark 不能把模型分数和 harness 分数混在一起？（→ 10 / 11 / 12 / 15 / 16 / 19）
204. **[工程类]** 为什么 prompt、model safeguard 和 harness logic 不能当作生产 agent 的硬安全边界？authoritative policy、secure runtime、JIT access 和不可变审计各自兜什么风险？（→ 05 / 11 / 16 / 17 / 18 / 19）
205. **[工程类]** NVIDIA SkillEvaluator 为什么要先做 schema/secret/prompt-injection/license 静态扫描，再做 distinctiveness 和 live Skill Lift A/B？仅看 README 或人工体验会漏掉什么？（→ 12 / 15 / 16 / 17 / 19）
206. **[工程类]** Reconstruction 为什么要用 temporal cutoff、匿名 reference ID 和冻结 bibliography 来评测研究 agent？reference-only multi-agent peer review 的提升说明了什么，仍然没解决什么？（→ 10 / 11 / 15 / 19 / capstone）
207. **[工程类]** SkillEffect 的 checked lowering 为什么适合追问 agent tool runtime？模型生成的工具程序看起来语义正确时，为什么还要用 relation plugin、bounded IR、capacity leasing 和 postcondition？（→ 05 / 06 / 15 / 16 / 17 / 19）
208. **[工程类]** FreeToken 为什么把本地 MoE serving 的关键问题从显存扩展到带宽、自适应 offload、runtime memory management 和 agentic state reuse？对边缘 agent 部署有什么启发？（→ 12 / 16 / 18 / 19）
209. **[工程类]** Claude Code v2.1.243 把 Loops usage、modelPicker、prompt cache TTL、组织 modelPricing 和 managed auth 标记放到产品里，这说明 coding agent 的成本与模型治理要验收哪些边界？（→ 11 / 12 / 14 / 16 / 17 / 19 / capstone）
210. **[工程类]** OpenAI Codex 进入高频 alpha release 时，为什么不能只按版本号自动升级？release tag、资产来源、本地 smoke、权限恢复和会话回归分别要兜什么风险？（→ 12 / 15 / 16 / 17 / 18 / 19 / capstone）
211. **[工程类]** Gemini CLI preview 引入 TUI timeout、eval failure summaries、silent retries、取消回滚和 subagent handoff 修复时，为什么预览版 agent CLI 要按交互、重试、评测和委托一起回归？（→ 11 / 12 / 14 / 15 / 16 / 19 / capstone）
212. **[工程类]** Agentic Resource Discovery (ARD) 为什么不是另一个工具调用协议？当 agent、MCP server、skill 和 API 分布在多云/SaaS/企业内网时，catalog、approval、identity 和 revocation 要怎样治理？（→ 05 / 11 / 12 / 17 / 18 / 19 / capstone）
213. **[工程类]** Agent Lightning Skill 为什么不是普通 prompt tuning？给定一个可编辑 agent 和 benchmark 后，prompts、tools、workflows、models、reasoning settings 应怎样被 measured iteration 优化？（→ 10 / 11 / 15 / 16 / 19 / capstone）
214. **[工程类]** Mem0 Strands Integration 把记忆接进 Strands `MemoryManager` 后，为什么 automatic recall、server-side extraction、verbatim writes 和 user/agent/run/app scoping 必须一起验收？（→ 07 / 08 / 09 / 11 / 15 / 19 / capstone）
215. **[工程类]** Terminal Agents survey 为什么强调 terminal-mediated execution、七维 terminal competence profile 和 replayable traces？只看最终任务 outcome 会漏掉哪些 CLI agent 过程风险？（→ 04 / 05 / 10 / 12 / 15 / 16 / 19 / capstone）
216. **[工程类]** Weighted Memory Tree 为什么说 long-horizon agent memory 的关键不是存得更多，而是决定哪些记忆保持 active？retention score、folding、selection decay 和 poisoning 实验分别在验证什么？（→ 07 / 08 / 09 / 10 / 15 / 16 / 19 / capstone）
217. **[原理类]** 工具参数通过 JSON Schema 后，为什么仍需要业务语义校验？（→ 05 / 13 / 17）
218. **[原理类]** 为什么 Agent 应区分可重试、需改参数、需授权与永久失败的工具错误？（→ 06 / 18）
219. **[原理类]** 为什么带副作用的 Agent 工具需要幂等键？（→ 05 / 18）
220. **[原理类]** 什么条件下多个工具调用可以安全并行，什么情况下必须串行？（→ 05 / 11 / 18）
221. **[原理类]** 为什么生产 Agent 有时要限制 tool choice，而不是始终让模型自由选择？（→ 05 / 17）
222. **[原理类]** 压缩 Agent 历史时，哪些信息应作为不可丢失的 invariant？（→ 07 / 16）
223. **[原理类]** 长期记忆写入策略应如何判断一条信息是否值得保存？（→ 07 / 08）
224. **[原理类]** Agent 记忆的 user、session、agent 与 organization scope 为什么要分开？（→ 07 / 17）
225. **[原理类]** 混合检索为什么常把关键词与向量检索结合？（→ 08 / 09）
226. **[原理类]** 回答里出现引用链接，为什么不等于答案已经 grounded？（→ 09 / 15）
227. **[原理类]** Agent 为什么应在关键 observation 后允许重规划，而不是机械执行原计划？（→ 04 / 10）
228. **[原理类]** 为什么多 Agent 分工的价值之一是上下文隔离，而不只是并行提速？（→ 07 / 11）
229. **[原理类]** Agent eval 中 evaluator、grader 与 metric 应怎样区分？（→ 15）
230. **[原理类]** LLM grader 为什么要用人工标注样本做校准？（→ 15）
231. **[原理类]** Trace grading 为什么比只给最终回答打分更利于定位 Agent 失败？（→ 15 / 16）
232. **[原理类]** 为什么模型护栏不能替代业务授权？（→ 17）
233. **[原理类]** OWASP 所说的 excessive agency 在 Agent 系统中指什么？（→ 05 / 17）
234. **[工程类]** 实现远程 MCP 授权时，authorization server、MCP resource server 与 client 的边界应如何理解？（→ 05 / 12 / 17）
235. **[工程类]** MCP server 的工具列表发生变化时，客户端为何不能永久复用启动时缓存？（→ 05 / 12）
236. **[工程类]** A2A 长任务的流式更新与断线恢复需要保存哪些合同信息？（→ 11 / 14 / 18）
237. **[工程类]** LangGraph 持久化为什么需要稳定 thread identity，而不能只保存最后一次输出？（→ 07 / 11 / 12）
238. **[工程类]** LangGraph interrupt 后恢复执行时，为什么要传入 resume 值而不是重新调用整个节点？（→ 11 / 12 / 17）
239. **[工程类]** AutoGen 团队为什么要显式组合最大消息数、文本信号或资源预算等 termination conditions？（→ 04 / 11 / 12）
240. **[工程类]** 用 OpenTelemetry 记录 Agent span 时，哪些属性适合标准化，哪些内容应谨慎采集？（→ 16 / 17）
241. **[工程类]** 外部工具持续失败时，Agent runtime 应如何使用 circuit breaker？（→ 06 / 16 / 18）
242. **[项目深挖类]** 你会如何为多租户 Agent 设计记忆分区，证明不会发生跨租户召回？（→ 07 / 15 / 17）
243. **[项目深挖类]** 你会怎样为 RAG reranker 选择 top-k 与拒答阈值，而不是凭感觉设置？（→ 08 / 09 / 15）
244. **[项目深挖类]** 如何自动检查 RAG 答案中的关键主张是否被对应引用支持？（→ 09 / 15）
245. **[项目深挖类]** 一个会执行写操作的 Agent，计划在真正执行前应通过哪些验证？（→ 10 / 17 / 18）
246. **[项目深挖类]** 设计 Agent handoff 时，怎样定义最小但完整的交接输入合同？（→ 07 / 11 / 13）
247. **[项目深挖类]** 多个 Agent 并发更新同一任务状态时，你会如何避免 lost update？（→ 11 / 18）
248. **[项目深挖类]** 模型与工具都有速率限制时，Agent 服务如何实现 backpressure？（→ 16 / 18）
249. **[项目深挖类]** 如何按任务难度与风险做模型路由，同时避免低成本模型悄悄降低质量？（→ 12 / 15 / 16）
250. **[项目深挖类]** Agent 使用 prompt caching 时，如何划分既省成本又不导致上下文串用的缓存边界？（→ 07 / 16 / 17）
251. **[项目深挖类]** 你会怎样制定 Agent trace 的敏感数据采集与保留策略？（→ 16 / 17）
252. **[项目深挖类]** 用 Google ADK 评估工具型 Agent 时，如何同时设计 response 与 trajectory 标准？（→ 12 / 15）
253. **[项目深挖类]** CrewAI Flow 执行到一半失败时，怎样设计状态恢复避免重复业务动作？（→ 11 / 12 / 18）
254. **[项目深挖类]** 如何用 Semantic Kernel filters 实现统一的 Agent 工具审计与策略检查？（→ 05 / 12 / 16 / 17）
255. **[项目深挖类]** 企业 MCP 客户端如何把 server 连接许可与单个 tool 调用许可分开治理？（→ 05 / 12 / 17）
256. **[项目深挖类]** 跨组织消费 A2A Agent Card 时，如何验证它不是伪造或过期的能力声明？（→ 11 / 12 / 17）
257. **[工程类]** 为什么 Bash allow 规则里在 subcommand 前放 wildcard 会扩大 Agent 权限面？（→ 05 / 17 / 18）
258. **[工程类]** 遇到 coding agent CLI 高频 alpha 预发布时，为什么不能只按最新版本自动升级？（→ 12 / 15 / 16 / 17 / 18）
259. **[工程类]** CLI Agent 在 cancel 或 abort 时为什么要回滚整个 multi-turn request，而不是只停止当前输出？（→ 07 / 14 / 16 / 18）
260. **[工程类]** 为什么 typed Agent runtime 要特别测试零参数 tool call 和 tool retry budget？（→ 05 / 13 / 15 / 16）
261. **[项目深挖类]** Agent workflow 为什么要同时验证 stream part end、active reasoning part 和 batch webhook 回调合同？（→ 14 / 15 / 16 / 18）
262. **[项目深挖类]** MCP portal 为什么要让 client 协议版本和 upstream server 协议版本独立协商？（→ 05 / 12 / 17 / 18）
263. **[工程类]** Claude Code 增加 SendFeedback、组织 tips override、Auto mode 权限提示和 cost-optimize 时，为什么这说明 coding agent 控制面已经覆盖反馈、权限 UX、组织治理和成本优化？（→ 05 / 11 / 16 / 17 / 19 / capstone）
264. **[工程类]** Codex 0.150.0 支持跨任务 @ mentions、终端内读写 task、自动标题、permission 快捷键和 Interrupt hooks 时，为什么不能只把它当普通 CLI 更新？（→ 11 / 12 / 15 / 16 / 17 / 18 / 19）
265. **[工程类]** Google ADK v2.8.0 同时加入 RemoteA2aAgent native task mode、ADK_MAX_LLM_CALLS、Model Armor 和 data_agent toolset 时，运行时回归要覆盖哪些边界？（→ 05 / 11 / 12 / 15 / 16 / 17 / 19）
266. **[工程类]** Pydantic AI v2.35.0 把 capability_loaded 迁移到 capability_active、降低 Temporal metrics 导出频率并保留空 Tool description，这些为什么都属于 typed agent 合同？（→ 05 / 12 / 13 / 15 / 16 / 19）
267. **[工程类]** Vercel AI SDK 新增 Z.AI/GLM provider 后，为什么 agent workflow 要同时回归 streaming、reasoning、tools、多模态输入、schema 和 fallback 策略？（→ 12 / 13 / 14 / 15 / 16 / 19）
268. **[工程类]** Recuris 这类长期 agent harness 为什么要区分 Working Memory 和 Experiential Memory？如果只保留完整历史或只做摘要，会漏掉哪些 skill selection 与失败定位信号？（→ 07 / 10 / 11 / 15 / 19 / capstone）
269. **[工程类]** BrowserForge 为什么要用 parallel browser sandboxes 扩展 web agent episode？这对轨迹质量、站点覆盖、会话隔离和 computer-use 评估有什么影响？（→ 05 / 14 / 15 / 17 / 19 / capstone）
270. **[工程类]** StarHarness 演化 prompt、tool interface、skills、MCP providers、subagent structure 和 loop config 时，为什么必须区分 proposer-visible、selection 和 held-out 任务？（→ 10 / 11 / 15 / 16 / 19 / capstone）
271. **[工程类]** StepGuard 为什么把 agent guardrail 做到 tool action 执行前的 step-level？只在完整轨迹结束后审计，会漏掉哪些高权限工具风险？（→ 05 / 15 / 16 / 17 / 19 / capstone）

### C. 复杂题（48 题）

1. **[项目深挖类]** 你这个 Deep Research Agent，为什么用多智能体而不是单 agent？不用会怎样？多智能体的代价你怎么权衡的？（→ 11 / capstone）
2. **[项目深挖类]** 你的 RAG 分块大小和 overlap 是多少、怎么定的？改大改小分别会怎样？top-k 取几、为什么？（→ 08 / 09）
3. **[项目深挖类]** 你说准确率 90%，这个 eval 集怎么搭的、多少条、用什么判分？LLM-as-judge 的判分你信吗？（→ 15）
4. **[项目深挖类]** 这个项目最大的性能/成本瓶颈在哪？你做了哪些优化、效果如何？（→ 16）
5. **[项目深挖类]** 你为什么自己手写 agent loop 而不直接用 LangGraph？什么时候你会选择上框架？（→ 12）
6. **[项目深挖类]** 如果让它支持并发处理 100 个用户，你的设计哪里会先扛不住？怎么改？（→ 18）
7. **[项目深挖类]** 线上如果模型开始胡乱调工具 / 陷入死循环，你怎么发现、怎么兜底？（考可观测 + 停止条件）（→ 16 / 04）
8. **[项目深挖类]** 这个项目你踩过最大的坑是什么？怎么定位、怎么解决的？（→ capstone）
9. **[原理类]** 为什么高风险 Agent 上线需要 safety case，而不能只给一组平均 benchmark 分数？（→ 15 / 16 / 17 / 18）
10. **[原理类]** 如何依据动作可逆性、影响半径与不确定性划分 Agent 自主等级？（→ 01 / 17 / 18）
11. **[原理类]** 为什么 MCP 或 A2A 的互操作性不能自动解决跨 Agent 信任问题？（→ 05 / 11 / 12 / 17）
12. **[工程类]** 为什么长任务 Agent 的 durable execution 不能承诺真正 exactly-once，工程上应如何处理？（→ 11 / 16 / 18）
13. **[工程类]** 跨服务、MCP 与 A2A 的 Agent 运行如何保持可追踪的因果链？（→ 11 / 12 / 16）
14. **[工程类]** 执行 Agent 生成代码的 sandbox 应如何同时限制文件系统、网络出口、凭证与资源？（→ 12 / 17 / 18）
15. **[工程类]** Agent 版本晋级门禁如何避免被小样本波动或 grader 漂移误导？（→ 15 / 18）
16. **[项目深挖类]** 请设计一个可查订单、解释政策并升级人工的客服 Agent，明确状态、工具、护栏与评估边界。（→ 05 / 07 / 11 / 15 / 17 / 18）
17. **[项目深挖类]** 请设计一个退款 Agent，使重复恢复、审批超时和部分失败都不会多退或漏记账。（→ 05 / 11 / 17 / 18）
18. **[项目深挖类]** 请设计一个多租户 RAG Agent，证明索引、缓存、检索、生成和日志五层都不会串租户。（→ 08 / 09 / 16 / 17 / 18）
19. **[项目深挖类]** 一个运行数小时的研究 Agent 如何设计 checkpoint、重规划、来源去重与人工恢复？（→ 07 / 10 / 11 / 15 / 18）
20. **[项目深挖类]** 请为“规划、编码、测试、评审”多 Agent 软件交付系统设计控制面，避免互相覆盖和虚假完成。（→ 11 / 12 / 15 / 16 / 18）
21. **[项目深挖类]** 请为第三方 MCP server 接入做供应链威胁建模，覆盖安装、发现、更新和调用阶段。（→ 05 / 12 / 17 / 18）
22. **[项目深挖类]** 请设计一个企业 A2A gateway，统一处理发现、身份、授权、流式任务与审计。（→ 11 / 12 / 16 / 17 / 18）
23. **[项目深挖类]** 安全事件响应 Agent 可以自动做什么，哪些动作必须保留人工授权与证据链？（→ 11 / 16 / 17 / 18）
24. **[项目深挖类]** 如何搭建覆盖 prompt injection、越权工具、记忆污染和跨 Agent 欺骗的红队评估集？（→ 07 / 11 / 15 / 17）
25. **[项目深挖类]** 如何为生产 Agent 同时定义质量、延迟和成本 SLO，并避免三者互相掩盖？（→ 15 / 16 / 18）
26. **[项目深挖类]** 一个新 Agent 版本如何从离线 eval 逐步灰度到生产，并具备自动回滚？（→ 15 / 16 / 18）
27. **[项目深挖类]** 无法事务化的删除或外部发送工具，如何设计预览、确认和补偿机制？（→ 05 / 17 / 18）
28. **[项目深挖类]** 请设计浏览器 Agent 的会话隔离，防止 cookie、下载文件和已登录身份跨任务泄露。（→ 05 / 14 / 17 / 18）
29. **[项目深挖类]** 长期记忆被错误事实或恶意内容污染后，系统如何发现、隔离和恢复？（→ 07 / 08 / 15 / 17）
30. **[项目深挖类]** 当源系统权限随时间变化时，RAG 索引如何避免继续泄露已撤销内容？（→ 08 / 09 / 17 / 18）
31. **[项目深挖类]** 一个研究 Agent 读取恶意网页后试图把机密发到外部工具，你会在哪些层阻断？（→ 05 / 09 / 17 / 18）
32. **[项目深挖类]** 如何把多个 trace grader 组合成 Agent 发布门禁，同时避免一个总分掩盖关键失败？（→ 15 / 16 / 18）
33. **[项目深挖类]** 高流量 Agent 如何做 trace sampling，既控成本又不漏掉低频严重事故？（→ 16 / 17 / 18）
34. **[项目深挖类]** Agent 跨 CRM、支付与邮件三个系统执行任务时，如何用 saga 和幂等设计处理部分成功？（→ 05 / 11 / 18）
35. **[项目深挖类]** 把现有确定性审批流程引入 Agent 时，哪些节点可以模型化，哪些合同必须保持确定性？（→ 01 / 10 / 17 / 18）
36. **[项目深挖类]** 用 OpenAI Agents SDK 设计“统一入口 + 专家接管”系统时，何时用 manager-as-tools，何时用 handoff？（→ 11 / 12 / 15）
37. **[项目深挖类]** 如何用 LangGraph persistence 与 interrupts 实现可跨天恢复的人工审批流程？（→ 07 / 11 / 12 / 17）
38. **[项目深挖类]** 用 Google ADK 构建层级 Agent 后，如何判断失败来自路由、专家还是工具？（→ 11 / 12 / 15 / 16）
39. **[项目深挖类]** AutoGen GroupChat 中如何防止 Agent 互相附和、无限轮转或在未完成时提前终止？（→ 11 / 12 / 15 / 16）
40. **[项目深挖类]** CrewAI Crew 嵌入 Flow 后，如何统一 Agent 自主步骤与确定性流程的恢复和观测？（→ 11 / 12 / 16 / 18）
41. **[项目深挖类]** 如何用 Semantic Kernel filter stack 同时实现授权、预算、内容安全和可观测性？（→ 05 / 12 / 16 / 17）
42. **[项目深挖类]** 把 MCP server 部署到企业内网时，如何按零信任原则治理网络、身份、token 与工具参数？（→ 05 / 12 / 17 / 18）
43. **[项目深挖类]** 两个组织通过 A2A 协作时，如何建立用户委托、Agent 身份和责任归属？（→ 11 / 12 / 17 / 18）
44. **[项目深挖类]** 如何检测 ReAct Agent 正在“看似有进展地原地打转”，并安全终止或改道？（→ 04 / 10 / 15 / 16）
45. **[项目深挖类]** Tree of Thoughts 在生产系统中如何限制分支爆炸，同时保留探索收益？（→ 10 / 15 / 16）
46. **[项目深挖类]** 当 Reflexion 生成了错误失败归因时，怎样避免坏反思持续污染后续尝试？（→ 07 / 10 / 15）
47. **[项目深挖类]** 面对数十万 token 的项目资料，如何设计上下文以缓解 Lost in the Middle，而不是直接整包输入？（→ 07 / 08 / 09 / 15）
48. **[项目深挖类]** 生产 RAG 如何同时保证内容新鲜度、删除传播和答案可复现？（→ 08 / 09 / 15 / 18）

<!-- interview-question-list:end -->
---

## 五、学习路线衔接与持续提升

学完本仓库不是终点，是起点。按下面的节奏持续加深：

### 第 1 步：补 Python 对照（1~2 周）

把毕业项目的 RAG 和 agent loop 用 **LangChain + LlamaIndex** 各重写一遍（见第二节的对照表）。目标不是精通，而是"看得懂、改得动、面试敢说熟悉"。

### 第 2 步：读源码（持续）

带着"我自己是怎么实现的"去读框架源码，对照差异最高效：

- **LangGraph / LangChain**：看它的 `AgentExecutor`、`StateGraph` 怎么实现循环和状态——对比你手写的 `runAgent`。
- **Vercel AI SDK**：看 `streamText` / `tool` 的设计——对比你的工具系统和流式实现。
- **本仓库 `src/shared/`**：先把自己的"标准库"（`agent/loop.ts`、`agent/tool.ts`、`rag/vectorStore.ts`）读透，这是你最熟的源码。

### 第 3 步：复现论文（挑 1~2 篇）

不用追最新，挑奠基性的、和本课程直接对应的：

- **ReAct**（Reasoning + Acting）——你已经手写过它，读原论文加深理解。
- **RAG**（Retrieval-Augmented Generation）原始论文。
- **Reflexion / Self-Refine**——对应第 10 章的 Reflection。
- **Toolformer / Self-RAG** 等作为进阶。

复现方式：用本课程的 `getLLM()` 抽象把论文的核心 idea 跑成一个最小 demo，写一篇短笔记。**这种"我复现了 X 论文"也能写进简历。**

### 第 4 步：参与开源（最强背书）

- 从**给文档纠错、补例子、修小 bug** 开始，门槛低、容易 merge。
- 目标仓库：LangChain.js / LangGraph.js / Vercel AI SDK / LlamaIndex，或任何你在用的 Agent 工具。
- 一个被合并的 PR，胜过简历上十句"熟悉 XXX"。在简历里直接贴 PR 链接。

### 第 5 步：持续关注（建立信息源）

- **官方文档与博客**：Anthropic、OpenAI 的工程博客（agent 设计模式、context 工程、评估方法常有干货）。
- **框架更新日志**：LangChain / LlamaIndex / Vercel AI SDK 的 release notes——生态变化快，跟着更新就不会落伍。
- **社区**：高质量的 Agent / RAG 技术文章、相关开源项目的 issue 讨论区（真实问题都在这）。
- **动手 > 收藏**：看到新模式，用本课程框架花 1 小时跑个 demo，比收藏 100 篇文章有用。

---

## 六、一页纸行动清单

```
[ ] 走完本仓库核心章节（01~11、13、15），每章会跑、能讲 WHY
[ ] 完成毕业项目 Deep Research Agent，跑出真实 eval 数字
[ ] 用 LangChain/LlamaIndex 把 RAG + agent loop 各重写一遍（Python 对照）
[ ] 把毕业项目写成 STAR 简历条目（带量化结果）
[ ] 写好 GitHub README（定位 + GIF + 架构图 + 评估结果 + 快速开始）
[ ] 录一个 ≤3 分钟 demo（展示中间步骤流 + 溯源结果），转成 GIF 放 README
[ ] 把「高频面试题清单」逐条自测，能脱口而出 + 讲清取舍
[ ] 给自己出「项目深挖类」8 道题并准备答案
[ ] 提交至少 1 个开源 PR（文档/小修复起步），简历贴链接
[ ] 简历定位写成：「TS 手写 Agent 底层 + 熟悉 Python LangChain/LlamaIndex 生态」
```

> 记住贯穿全程的那句话：**TS 让你"懂"，Python 让你"被招"，作品集让你"被记住"。三者缺一不可。**

---

> 配套阅读：[创业指南](./startup-guide.md)（如果你想的不是求职，而是把 demo 做成产品）。





