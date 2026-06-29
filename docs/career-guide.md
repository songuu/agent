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

> 🔎 **按分类 / 章节筛选**：题目较多时用下面的筛选器只看某一类或某一章；下方按 A/B/C 分组的完整清单始终是同源底稿（无 JS 时仍可阅读）。

<div data-interview-clinic></div>

### A. 原理类（考你懂不懂底层）

1. LLM 和 Agent 有什么区别？请画出 Agent 的执行循环。（→ 01）
2. 什么是 token？为什么说 LLM 是"无状态"的？多轮对话的"记忆"是怎么实现的？（→ 02 / 07）
3. system 提示和 user 提示有什么区别？为什么思维链（CoT）能提升正确率？什么任务该把 temperature 设成 0？（→ 03）
4. **ReAct 是什么、解决了什么问题？** 为什么 agent 循环一定要有 `maxSteps`（停止条件）？（→ 04）
5. function calling 的完整往返是怎样的？**模型会自己执行工具吗？**`toolCallId` 是干什么用的？（→ 05）
6. **什么是 RAG？为什么 RAG 能降低幻觉？** 分块为什么要做 overlap？top-k 的 k 怎么取？如何让答案可溯源？（→ 08 / 09）
7. **模型为什么会幻觉？** 这是 bug 还是固有特性？工程上能彻底消除吗？（→ 09，结合你的理解）
8. 什么是 embedding？为什么用余弦相似度而不是欧氏距离？语义检索 vs 关键词检索各自适用什么场景？（→ 08）
9. ReAct 和 Plan-and-Execute 的本质区别？什么任务该用哪个？**Reflection 为什么能在不引入新信息的情况下提升质量、收益边界在哪？**（→ 10）

### B. 工程类（考你能不能扛生产）

1. **怎么让 LLM 稳定输出 JSON？** 校验失败了怎么办（retry-repair 怎么实现）？工具调用 / JSON mode / 提示约束三者区别？（→ 13）
2. **如何防 prompt injection？** 用户能通过输入篡改 system 指令吗？关键操作（删数据、发邮件）你怎么加护栏？（→ 17）
3. **如何控制成本？** 一次 agent 调用的钱花在哪？怎么算 token 账？上下文太长怎么压？模型怎么选？（→ 07 / 16）
4. **如何评估一个 Agent / LLM 应用？** 为什么不能只靠传统单测？LLM-as-judge 有什么风险、怎么缓解？回归测试集解决什么问题？（→ 15）
5. 上下文窗口满了怎么办？滑动窗口和摘要压缩各自的取舍？（→ 07）
6. 流式输出能让接口更快吗（吞吐）？为什么不能？为什么体验还是更好？`AbortController` 是强杀还是协作式取消？（→ 14）
7. 工具执行报错时，为什么**不直接抛异常**，而要把错误回传给模型？（→ 06）
8. 什么场景下多 agent 比单 agent 更好？多 agent 的**主要代价**是什么、如何权衡？（→ 11）
9. 什么场景**不该**用 Agent？（反向考察判断力，→ 01）
10. 评测 computer-use / workplace agent 时，为什么不能只看任务成功率？`unintended / harmful action` 指标分别在兜什么风险？（→ 15 / 17 / 19）
11. 长期记忆 agent 为何不能只测 recall？为什么 `observation stream / user feedback / knowledge archive / follow-up reuse` 要分开评估？（→ 07 / 15 / 19）
12. 什么是 agent harness？它和 agent framework / SDK 的边界怎么划？为什么审批、重试、回放、权限壳层最好放在 harness 而不是模型里？（→ 04 / 12 / 16 / 19）
13. Agent runtime / tool 协议升级时，为什么要单独审查 `auth-required vs input-required`、`history compaction`、`auto-approval` 规则和 tracing 注入边界？（→ 05 / 11 / 17 / 18 / 19）
14. 研究型 agent 的 benchmark 为什么要强调 clean-room synthesis 和 strategic generalization？如果 agent 只是拼接原文句子，为什么高分也不可信？（→ 10 / 15 / capstone / 19）
15. 为什么长周期 agent 评测不能只看单步 reward 或单回合成功率？RetailBench 这类 benchmark 在检验什么长期策略能力？（→ 10 / 15 / 19）
16. 监控/告警 agent 为什么要同时测反应时效、误报/漏报和后续行动链，而不是只看“能否识别异常”？（→ 16 / 17 / 18 / 19）
17. 评测记忆 agent 时，为什么要单独测补充关系、矛盾关系和无关关系的区分？只看关键词召回会漏掉什么记忆一致性问题？（→ 07 / 15 / 19）
18. 为什么 tool guardrails 最好放在“真正执行前”的 pre-approval 边界，而不是等工具跑完再做事后检查？这对高权限工具有什么安全意义？（→ 05 / 17 / 18 / 19）
19. 为什么生产变更权限不该直接放在 agent 推理进程里？`certificate-bound broker / scoped execution identity` 这种执行边界在兜什么风险？（→ 17 / 18 / 19）
20. 当 `PII detector / declassifier` 这类安全判定本身带误差时，为什么 deterministic policy 不够？agent runtime 该怎么理解 probabilistic verification 的意义？（→ 15 / 17 / 19）
21. 为什么高质量仓库指引（如 `AGENTS.md`）更主要提升 coding agent 的文件定位覆盖率，而不一定直接提升 patch 精度？步数预算变大时它为什么更重要？（→ 12 / 15 / 19 / capstone）
22. 为什么共享基础设施的多租户 agent runtime 不能只靠“逻辑上分 tenant”就算隔离完成？state、identity、telemetry 和审批边界分别要隔离什么，什么时候还得回到 dedicated stack？（→ 16 / 17 / 18 / 19）
23. 做研究型 copilot 时，为什么要把 structured query parsing、embedding retrieval 和 AI summary 三段拆开，而不是让一个大 prompt 端到端包办？这样拆分分别在兜什么准确性与可追溯风险？（→ 08 / 09 / 16 / 19）
24. 为什么跨组织 agent 协作不能长期依赖“给每个 agent 发一把 API key”这种做法？独立的 agent identity / name service 在信任建立、权限撤销和跨平台互认上解决了什么问题？（→ 17 / 18 / 19）
25. 多 agent / realtime tool 执行里，为什么“已解决的 approval 不应被重复求值”，而 sibling guardrail/task 一旦失败就要立刻取消其它并发 guardrail？否则会出现什么竞态和副作用风险？（→ 11 / 14 / 17 / 18 / 19）
26. 为什么即便是“read-only auto-approval”模式，file-access 工具仍可能要强制人工审批？当 loop 能力被集成进 harness agent 后，这条边界为什么会变得更关键？（→ 05 / 11 / 17 / 18 / 19）
27. 声明式 workflow / skill archive 为什么要显式防 symlink path traversal 和非法 flow definition paths？这类问题看起来不是 prompt bug，却为什么能直接突破 agent runtime 的文件系统边界？（→ 11 / 17 / 18 / 19）

28. 为什么 agent workflow 一旦进入 conversational flow / declarative flow 阶段，就要单独追踪 turn usage，并统一 CLI、TUI、loader 的入口？如果 telemetry 和运行入口不统一，会让调试、计费和回放出现什么问题？（→ 11 / 16 / 18 / 19）
29. 为什么企业做 agent 改造时常常应该“retrofit, don't rebuild”？agentic overlay 与直接重写遗留系统相比，分别在兜什么集成、权限和发布风险？（→ 05 / 11 / 17 / 18 / 19）
30. 为什么生产级 agentic AI 需要 governed data mesh，而不是让 agent 直接去拉数据库 / 对象存储 / 知识库？identity、catalog、policy 和 knowledge base 在 agent 数据底座里分别解决什么问题？（→ 08 / 09 / 16 / 17 / 18 / 19）
31. 为什么 production agent 里的 skill/provider tools 最好默认 `require approval`，而不是默认放行后再补规则？一旦默认值反了，权限壳层、审计和回放会出现什么系统性漏洞？（→ 05 / 11 / 17 / 18 / 19）
32. 为什么 agent 的网页抓取 / scraping tool 不能只校验首跳 URL 是否在 allowlist？一旦重定向链里出现 SSRF bypass，会把什么内网、metadata 或权限侧信道暴露给 agent？（→ 05 / 11 / 17 / 18 / 19）
33. 为什么研究型 agent 的 benchmark 不能只看最终答案对不对？`stepwise verification` 和 `interactive environment` 分别在检验什么能力，为什么它们比 `final-answer-only` 更能暴露长流程研究任务的失败模式？（→ 10 / 15 / 19 / capstone）

### C. 项目深挖类（考你是不是真做过）

> 这一类没有标准题库，面试官会顺着你的简历项目往下钻。**提前给自己出这些题**：

1. 你这个 Deep Research Agent，**为什么用多智能体而不是单 agent？** 不用会怎样？多智能体的代价你怎么权衡的？
2. 你的 RAG **分块大小和 overlap 是多少、怎么定的？** 改大改小分别会怎样？top-k 取几、为什么？
3. 你说准确率 90%，**这个 eval 集怎么搭的、多少条、用什么判分？** LLM-as-judge 的判分你信吗？
4. 这个项目**最大的性能/成本瓶颈在哪？** 你做了哪些优化、效果如何？
5. 你**为什么自己手写 agent loop 而不直接用 LangGraph？** 什么时候你会选择上框架？
6. 如果让它支持**并发处理 100 个用户**，你的设计哪里会先扛不住？怎么改？
7. 线上如果模型**开始胡乱调工具 / 陷入死循环**，你怎么发现、怎么兜底？（考可观测 + 停止条件）
8. 这个项目你**踩过最大的坑**是什么？怎么定位、怎么解决的？

> 项目深挖类是淘汰率最高的一关。**护身符是：你真的从零写过。** 本课程"先手写后框架"的设计，就是为了让你这一关有话可说、且经得起追问。

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
