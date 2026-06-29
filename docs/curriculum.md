# 课程大纲 · 从零到上框架：AI Agent 开发完整学习路径（TypeScript）

> 一句话：**先用纯 TypeScript 手写出 agent 的每一个零件，再衔接主流框架，最后落地成一个能放进简历、能给投资人演示的真实项目。**

---

## 这门课是给谁的

| 你是… | 这门课能帮你… |
|------|---------------|
| 想转行做 AI 应用 / Agent 工程的开发者 | 从底层原理补齐，面试问到 agent loop、RAG、成本不再露怯 |
| 已经会调 API、但只会「堆框架」的人 | 把黑盒打开，理解 LangGraph / AI SDK 每一行背后在做什么 |
| 想做 AI 产品 / 创业的独立开发者 | 拿到一个可演示的 MVP 骨架，知道成本、护栏、部署怎么做 |

**前置要求**：基础 JavaScript / TypeScript（异步、模块、类型）。不需要机器学习背景，不需要数学。

**不适合**：完全没写过代码的零基础；只想要「复制粘贴能跑」而不关心原理的人。

### 这门课的取舍（为什么和别的教程不一样）

- **先手写，后框架**：第二到四部分全部用纯 TS 手写 agent loop、工具系统、记忆、RAG、多智能体——**理解每一行为什么存在**，之后才在第五部分引入框架。
- **每章三层学习路线**：极简先跑通，进阶讲原理和边界，真实实践连接产品、团队和生产系统。
- **每章可直接运行**：`npx tsx lessons/xx/index.ts` 即可，零编译、零环境折腾。
- **厂商无关**：统一的 `getLLM()` 抽象，换 Claude / OpenAI 只改 `.env` 里一行。
- **能写进简历 / 能做 demo**：毕业项目是一个完整可演示的小产品，配套求职与创业指南。

---

## 怎么学（学习方式）

1. **按顺序学**：章节有强依赖（后面的章节会复用前面手写的能力），不建议跳读。第一次学请从第 00 章开始。
2. **每章三层走**：
   - `极简`：先跑通本章最小闭环，知道输入是什么、输出是什么、代码从哪里开始；
   - `进阶`：再追问原理、边界、失败模式和工程取舍，避免只会复制 demo；
   - `真实实践`：最后把本章能力映射到真实产品、团队流程或生产系统，形成可迁移判断。
3. **每层三步读**：
   - 先看 `图解学习地图`，用流程图建立整体心智模型；
   - 再读 `原理展开` 和 `README.md` 主体，理解「为什么」和「怎么做」；
   - `npx tsx` 跑通该章的 `index.ts`，观察真实输出；
   - 动手改一处参数 / 加一个小功能，验证你真的懂了。
4. **手写阶段不要偷懒看 `src/shared/`**：第二、三部分的「从零」章节，先在本章目录里亲手实现，理解后再去看 `src/shared/` 里沉淀的成熟版——这正是真实工程「先理解、再抽象、后复用」的路径。
5. **风险越高、测试越认真**：到了生产化部分（第 15–18 章），把测试 / 评估 / 护栏当成代码的一部分，而不是事后补丁。

> 提示：全程用便宜模型（如 `gpt-4o-mini` / `claude-haiku`）跑完成本很低；第 16 章会专门教你怎么算账和省钱。

想直接跳到任意课程，使用 [全局课程导航](./navigation.md)。想按 agent 类型、岗位目标或生产能力倒推学习路线，使用 [Agent 学习指南与分类地图](./agent-learning-guides.md)。这两页按顺序、按主题整理了第 00–21 章、B1-B12 基础指南、毕业项目、RAG 架构蓝图、企业知识库 Agent 蓝图、企业知识库 Agent Capstone、RAG 系统实战项目和源码解析。

### 三层学习法

| 层级 | 学习重点 | 适合的自检问题 |
|------|----------|----------------|
| 极简 | 先把本章最小路径跑起来,不要一开始追求完整系统 | 我能不能不看讲义,用自己的话复述输入、处理和输出? |
| 进阶 | 解释机制、边界、失败模式、成本和替代方案 | 如果结果错了,我知道应该先查 prompt、工具、检索、上下文还是模型吗? |
| 真实实践 | 对齐真实项目的权限、数据、评估、部署和团队协作 | 这个能力放进一个线上产品时,需要哪些日志、测试、护栏和回滚方案? |

### 图文阅读法

每章新增的 Mermaid 流程图不是装饰，而是学习顺序的一部分：

| 图中元素 | 你要追问的问题 |
|----------|----------------|
| 节点 | 这一步由模型、工具、本地代码还是外部服务负责？ |
| 箭头 | 数据在这里发生了什么转换？消息、schema、向量、工具结果分别流向哪里？ |
| 分支 | 系统什么时候继续、什么时候停止、什么时候降级或报错？ |

读完图后再看代码，会更容易把 `messages`、`ToolRegistry`、`MemoryVectorStore`、`runAgent`、`stream()` 这些抽象放到同一张系统图里。

---

## 总时长估算

| 部分 | 章节 | 预计时长 |
|------|------|----------|
| 第 00 章 · 环境搭建 | 1 章 | ~30 分钟 |
| 第一部分 · 基础概念 | 01–03 | ~2.5 小时 |
| 基础概念扩展专题 | agent-basics ×12 已落地指南 | ~2–3 小时 |
| 第二部分 · 从零手写核心 | 04–07 | ~5 小时 |
| 第三部分 · 知识与检索 | 08–09 | ~3 小时 |
| 第四部分 · 进阶模式 | 10–11 | ~3.5 小时 |
| 第五部分 · 工程化与框架 | 12–14 | ~3.5 小时 |
| 第六部分 · 生产化 | 15–18 | ~5 小时 |
| 第七部分 · 前沿与生态 | 19–20 | ~1.5 小时 |
| 第 21 章 · 源码解析 | source-analysis 章节 + 3 篇深入页 | ~3–4 小时 |
| 🎓 毕业项目（8 个）· Deep Research / 客服 / 评审 / 评测 / 告警响应 / 反馈洞察 / 销售线索 / 企业知识库 | 综合 | ~23–34 小时 |
| 🔬 进阶 RAG 专题 | rag-advanced ×11 | ~7–9 小时 |
| 🧩 进阶 LangGraph 专题 | langgraph-advanced ×5 + 生产化扩章地图 | ~4–6 小时 |
| 🧭 RAG 完整架构蓝图 | 架构阅读 | ~1 小时 |
| 🏢 企业知识库 Agent 蓝图 | 纵向项目设计 | ~1 小时 |
| **合计** | **21 章 + 基础概念扩展 + 8 个毕业项目 + RAG 专题 + LangGraph 专题 + 架构蓝图 + 企业知识库蓝图** | **约 63.5–83.5 小时**（不含动手扩展） |

> 按每天投入 1–1.5 小时算，大约 **3–4 周**可以完整走完一遍。建议分散学、多动手，比一口气刷完更扎实。

---

## 学习路径图

```text
                        ┌─────────────────────────┐
                        │  第 00 章 · 环境搭建      │
                        │  Node / pnpm / API key   │
                        └────────────┬─────────────┘
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第一部分 · 基础概念                                   │
        │  01 什么是 Agent → 02 第一次 LLM 调用 → 03 提示工程    │
        │  + 基础概念扩展专题：messages / token / tool / eval    │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第二部分 · 从零手写核心                               │
        │  04 Agent 循环 → 05 工具调用基础 →                    │
        │  06 工具系统 → 07 短期记忆                            │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第三部分 · 知识与检索                                 │
        │  08 Embedding 与向量检索 → 09 从零实现 RAG            │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第四部分 · 进阶模式                                   │
        │  10 推理范式 → 11 多智能体编排                        │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第五部分 · 工程化与框架                               │
        │  12 上框架 → 13 结构化输出 → 14 流式与 UX             │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第六部分 · 生产化                                     │
        │  15 评估与测试 → 16 可观测与成本 →                    │
        │  17 安全与护栏 → 18 部署                              │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  第七部分 · 前沿与生态                                 │
        │  19 Agent 前沿发展与生态拆解 → 20 前沿文章库            │
        └────────────────────────────┬─────────────────────────┘
                                     ▼
                  ┌──────────────────────────────────┐
                  │  第 21 章 · 源码解析              │
                  │  LangChain/LangGraph/LlamaIndex   │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🎓 毕业项目 · Deep Research Agent │
                  │     综合所有能力的实战            │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🔬 进阶 RAG 专题 (rag-advanced)   │
                  │  分块/混合/精排/改写/评估/生产化   │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🧩 进阶 LangGraph 专题            │
                  │  StateGraph/路由/持久化/HITL/多Agent │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🧭 RAG 完整架构蓝图              │
                  │     写入/查询/eval/治理/部署      │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🏢 企业知识库 Agent 蓝图          │
                  │  记忆/RAG/工具/UI/任务/部署纵向闭环 │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  🎓 企业知识库 Agent Capstone      │
                  │     纵向全栈作品集实战             │
                  └────────────────┬─────────────────┘
                                   ▼
                  ┌──────────────────────────────────┐
                  │  📚 进阶项目 · songuu/rag-system   │
                  │     生产级 RAG 系统连接            │
                  └────────────────┬─────────────────┘
                                   ▼
                       💼 求职指南    🚀 创业指南
```

---

## 章节详解

难度图例：⭐ 入门 · ⭐⭐ 基础 · ⭐⭐⭐ 进阶 · ⭐⭐⭐⭐ 挑战

### 第 00 章 · 环境搭建

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 00 | 环境搭建 | ⭐ | 30 分钟 | 装好 Node/pnpm、配置 API key、跑通第一个例子，确认全链路畅通 | [./setup.md](./setup.md) |

### 第一部分 · 基础概念

> 目标：建立正确的心智模型——知道 Agent 到底是什么、LLM 怎么调、怎么把话说清楚让模型听懂。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 01 | 什么是 Agent | ⭐ | 40 分钟 | 厘清 LLM 与 Agent 的区别，理解「感知-决策-行动」循环这个核心心智模型 | [../lessons/01-what-is-an-agent/README.md](../lessons/01-what-is-an-agent/README.md) |
| 02 | 第一次 LLM 调用 | ⭐ | 50 分钟 | 用 provider 无关的客户端发起第一次对话，理解 chat / stream / token 三件事 | [../lessons/02-first-llm-call/README.md](../lessons/02-first-llm-call/README.md) |
| 03 | 提示工程 | ⭐ | 50 分钟 | system prompt、few-shot、思维链(CoT)、temperature——把模型的能力调出来 | [../lessons/03-prompt-engineering/README.md](../lessons/03-prompt-engineering/README.md) |
| B1-B12 | 基础概念扩展专题 | ⭐⭐ | 2–3 小时 | 12 篇详细指南，补齐 messages、roles、token、sampling、tool calling、workflow vs agent、guardrails、evaluation、framework runtime 等先修词汇 | [../agent-basics/README.md](../agent-basics/README.md) |

### 第二部分 · 从零手写核心

> 目标：不依赖任何框架，亲手写出一个能思考、能调工具、有记忆的 agent。这是整门课的地基。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 04 | Agent 循环 | ⭐⭐ | 75 分钟 | 手写 Thought → Action → Observation 循环，让模型自己决定下一步做什么 | [../lessons/04-the-agent-loop/README.md](../lessons/04-the-agent-loop/README.md) |
| 05 | 工具调用基础 | ⭐⭐ | 60 分钟 | 用原生 function calling 完成一次完整的工具往返，让模型能「动手」 | [../lessons/05-tool-use-basics/README.md](../lessons/05-tool-use-basics/README.md) |
| 06 | 工具系统 | ⭐⭐⭐ | 75 分钟 | 用 zod 定义 schema、建工具注册表、安全地执行——把零散工具变成可扩展系统 | [../lessons/06-building-a-tool-system/README.md](../lessons/06-building-a-tool-system/README.md) |
| 07 | 短期记忆 | ⭐⭐ | 50 分钟 | 滑动窗口、摘要压缩、上下文成本——让 agent 在长对话里不失忆也不爆预算 | [../lessons/07-short-term-memory/README.md](../lessons/07-short-term-memory/README.md) |

### 第三部分 · 知识与检索

> 目标：让 agent 用上「它没见过」的知识——从理解向量，到亲手搭一套 RAG。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 08 | Embedding 与向量检索 | ⭐⭐ | 75 分钟 | 把文本变成向量，用余弦相似度做语义搜索——RAG 的数学基础 | [../lessons/08-embeddings-and-vector-search/README.md](../lessons/08-embeddings-and-vector-search/README.md) |
| 09 | 从零 RAG | ⭐⭐⭐ | 105 分钟 | 分块 → 检索 → 注入 → 引用溯源，手写一条完整的检索增强生成链路 | [../lessons/09-rag-from-scratch/README.md](../lessons/09-rag-from-scratch/README.md) |

### 第四部分 · 进阶模式

> 目标：从「单个 agent 跑一遍」升级到「会规划、会反思、会协作」的高级模式。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 10 | 推理范式 | ⭐⭐⭐ | 90 分钟 | ReAct / Plan-Execute / Reflection 三种范式对比，知道何时该用哪一种 | [../lessons/10-reasoning-patterns/README.md](../lessons/10-reasoning-patterns/README.md) |
| 11 | 多智能体编排 | ⭐⭐⭐⭐ | 120 分钟 | 从手写 supervisor-worker 到 Claude Code / Codex / Agents SDK 的现代多 agent 编排实践 | [../lessons/11-multi-agent-orchestration/README.md](../lessons/11-multi-agent-orchestration/README.md) |

### 第五部分 · 工程化与框架

> 目标：把手写经验迁移到主流框架，并补齐结构化输出、流式 UX 这些「上生产」必备能力。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 12 | 上框架 | ⭐⭐⭐ | 90 分钟 | 引入 LangGraph.js 与 Vercel AI SDK，对照手写版理解框架帮你省了什么 | [../lessons/12-intro-to-frameworks/README.md](../lessons/12-intro-to-frameworks/README.md) |
| 13 | 结构化输出 | ⭐⭐⭐ | 60 分钟 | 让模型稳定吐 JSON：zod 校验 + retry-repair，把不确定的输出变成可靠数据 | [../lessons/13-structured-output/README.md](../lessons/13-structured-output/README.md) |
| 14 | 流式与 UX | ⭐⭐ | 50 分钟 | 打字机效果、步骤流、可取消——让 agent 用起来「像个真产品」 | [../lessons/14-streaming-and-ux/README.md](../lessons/14-streaming-and-ux/README.md) |

### 第六部分 · 生产化

> 目标：从「能跑的 demo」到「敢上线的服务」——评估、成本、安全、部署一个都不能少。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 15 | 评估测试 | ⭐⭐⭐ | 90 分钟 | 建 eval 数据集、用 LLM-as-judge 打分、做回归测试——给 agent 质量上锁 | [../lessons/15-evaluation-and-testing/README.md](../lessons/15-evaluation-and-testing/README.md) |
| 16 | 可观测与成本 | ⭐⭐ | 60 分钟 | 加 trace 追踪每一步、核算 token、估算费用——上线前先把账算明白 | [../lessons/16-observability-and-cost/README.md](../lessons/16-observability-and-cost/README.md) |
| 17 | 安全护栏 | ⭐⭐⭐ | 60 分钟 | 防 prompt injection、敏感操作人工确认、输出过滤——别让 agent 闯祸 | [../lessons/17-safety-and-guardrails/README.md](../lessons/17-safety-and-guardrails/README.md) |
| 18 | 部署 | ⭐⭐⭐ | 75 分钟 | 把 agent 包成 HTTP API、用 SSE 推流、过一遍部署清单——正式变成服务 | [../lessons/18-deployment/README.md](../lessons/18-deployment/README.md) |

### 第七部分 · 前沿与生态

> 目标：把前面学到的 agent 零件放回 2026 年真实生态里，理解 MCP、A2A、Agents SDK、LangGraph、CrewAI、LlamaIndex、Vercel AI SDK 各自解决哪一层问题，并用文章库持续追踪外部资料。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 19 | Agent 前沿发展与生态拆解 | ⭐⭐⭐ | 70 分钟 | 从模型接口、工具协议、Agent SDK、编排 runtime、RAG、UI、观测、安全八层拆解当前生态，并练习按需求选型 | [../lessons/19-agent-ecosystem-and-frontier/README.md](../lessons/19-agent-ecosystem-and-frontier/README.md) |
| 20 | Agent 前沿文章库 | ⭐⭐ | 45 分钟 | 按日期和体系层浏览前沿资料，查看摘要、来源、标签与原文入口 | [../lessons/20-agent-frontier-news/README.md](../lessons/20-agent-frontier-news/README.md) |

### 第 21 章 · 源码解析（source-analysis）

> 目标：把第 12 章“上框架”和进阶 LangGraph 专题继续下沉到源码层，读懂 LangChain、LangGraph、LlamaIndex 如何实现 agent loop、状态图、RAG query engine 和 workflow runtime。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 21 | 源码解析 | ⭐⭐⭐⭐ | 30 分钟 | 建立“入口函数 -> runtime -> 状态/工具/检索 -> 停止条件”的读源码顺序 | [../source-analysis/README.md](../source-analysis/README.md) |
| 21.1 | LangChain 源码解析 | ⭐⭐⭐⭐ | 60 分钟 | 从 `create_agent`、Runnable、middleware、structured output 读懂 agent factory | [../source-analysis/langchain.md](../source-analysis/langchain.md) |
| 21.2 | LangGraph 源码解析 | ⭐⭐⭐⭐ | 75 分钟 | 从 `StateGraph`、Pregel runtime、ToolNode 读懂可恢复状态机 runtime | [../source-analysis/langgraph.md](../source-analysis/langgraph.md) |
| 21.3 | LlamaIndex 源码解析 | ⭐⭐⭐⭐ | 60 分钟 | 从 QueryEngine、Retriever、ResponseSynthesizer、Workflow 读懂 data-first agent/RAG 框架 | [../source-analysis/llamaindex.md](../source-analysis/llamaindex.md) |

### 🎓 毕业项目（8 个综合实战，可直接放进作品集）

> 8 个项目各展示一种完整架构，彼此互补：研究型 agent / 生产客服系统 / 多智能体评审 / Agent 评测 / 告警响应 / 用户反馈洞察 / 销售线索研究 / 企业知识库纵向全栈。新增的告警、反馈、销售三者都偏真实业务流程，**完全离线、零 key 可跑**，`pnpm <name>:smoke` 即可验证。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 🎓 | Deep Research Agent | ⭐⭐⭐⭐ | 6–10 小时 | 综合 agent 循环、工具、RAG、多智能体、评估、护栏；Plan-and-Execute 研究型 agent | [../capstone/deep-research-agent/README.md](../capstone/deep-research-agent/README.md) |
| 🎓 | 客服 Copilot | ⭐⭐⭐⭐ | 3–4 小时 | 记忆 / RAG / 工具 / HITL 审批 / 注入·PII 安全 / 成本可观测，串成单轮纵深防御管线 | [../capstone/support-copilot/README.md](../capstone/support-copilot/README.md) |
| 🎓 | 代码评审团 | ⭐⭐⭐ | 2–3 小时 | 安全/性能/风格多智能体并行评审，结构化发现 + 严重度排序 + critical 即 BLOCK 的评审门 | [../capstone/code-review-crew/README.md](../capstone/code-review-crew/README.md) |
| 🎓 | Agent 评测与回归门 | ⭐⭐⭐ | 2–3 小时 | golden 测试集 + 离线裁判 + 通过率/拒答准确率/成本指标 + CI 回归门，自动拦下退化版本 | [../capstone/agent-eval-harness/README.md](../capstone/agent-eval-harness/README.md) |
| 🎓 | 告警响应 Agent | ⭐⭐⭐⭐ | 2–3 小时 | 告警分级、日志证据链、runbook 匹配、审批分层、客户话术与复盘清单 | [../capstone/incident-responder/README.md](../capstone/incident-responder/README.md) |
| 🎓 | 用户反馈洞察 Agent | ⭐⭐⭐ | 2–3 小时 | 多渠道反馈注入隔离、PII 脱敏、主题聚类、价值加权与 roadmap ticket 生成 | [../capstone/feedback-intelligence/README.md](../capstone/feedback-intelligence/README.md) |
| 🎓 | 销售线索研究 Agent | ⭐⭐⭐ | 2–3 小时 | ICP fit、业务信号、合规风险、销售开场话术与下一步动作 | [../capstone/sales-lead-researcher/README.md](../capstone/sales-lead-researcher/README.md) |
| 🎓 | 企业知识库 Agent | ⭐⭐⭐⭐⭐ | 4–6 小时 | 把 ingestion、ACL、Agentic RAG、事件流、trace/eval、定时巡检拆成企业级纵向作品集路线 | [../capstone/enterprise-knowledge-base-agent/README.md](../capstone/enterprise-knowledge-base-agent/README.md) |

### 🧭 RAG 完整架构蓝图

> 目标：把仓库里的最小 RAG、进阶 RAG 和毕业项目 RAG 工具，整理成可落地到独立知识库产品的系统架构。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 🧭 | RAG 完整架构蓝图 | ⭐⭐⭐⭐ | 60 分钟 | 从 ingestion、retrieval、rerank、context builder、generation、eval、governance 到 deployment，画清生产级 RAG 的边界 | [./rag-architecture.md](./rag-architecture.md) |

### 🏢 企业知识库 Agent 蓝图

> 目标：把 RAG、记忆、工具系统、Agentic RAG、流式事件、定时任务和部署串成一条企业知识库产品路线。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 🏢 | 企业知识库 Agent 蓝图 | ⭐⭐⭐⭐ | 60 分钟 | 从上传资料到 Agentic RAG、记忆分层、事件流、定时任务、基础设施选型和验收清单，设计一个纵向作品集项目 | [./enterprise-knowledge-base-agent.md](./enterprise-knowledge-base-agent.md) |

### 📚 进阶项目 · RAG 系统实战

> 目标：把第 08/09 章的最小 RAG 和毕业项目中的 RAG 工具，连接到独立的生产级 RAG 系统项目。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| 📚 | songuu/rag-system | ⭐⭐⭐⭐ | 持续迭代 | 从课程最小 RAG 走向生产级知识库系统，重点看 ingestion、chunking、embedding、retrieval、rerank、citation、eval 与治理 | [./rag-system-project.md](./rag-system-project.md) |

### 🔬 进阶 RAG 专题（rag-advanced）

> 目标：把第 08/09 章的「最小可解释 RAG」补成**生产级 RAG**。十一章各自可运行，沉淀进 `src/shared/rag/` 复用。建议学完第 09 章后按序深入；其中第 01 章为纯函数 demo，**无需任何 API key** 即可跑通。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| R1 | 进阶分块策略 | ⭐⭐⭐ | 45 分钟 | 字符滑窗 vs 递归语义切分 vs Markdown 标题感知，按 token 控大小 | [../rag-advanced/01-chunking-strategies/README.md](../rag-advanced/01-chunking-strategies/README.md) |
| R2 | 混合检索 | ⭐⭐⭐ | 50 分钟 | 向量 + BM25 双路召回，用 RRF 融合，补齐单路检索的盲区 | [../rag-advanced/02-hybrid-search/README.md](../rag-advanced/02-hybrid-search/README.md) |
| R3 | 召回-精排两段式 | ⭐⭐⭐ | 45 分钟 | 廉价多召回 + LLM 精排到少数最相关，提升上下文信噪比 | [../rag-advanced/03-reranking/README.md](../rag-advanced/03-reranking/README.md) |
| R4 | 查询改写 | ⭐⭐⭐ | 45 分钟 | multi-query 多路改写与 HyDE 假设答案检索，提升召回覆盖 | [../rag-advanced/04-query-transformation/README.md](../rag-advanced/04-query-transformation/README.md) |
| R5 | RAG 评估 | ⭐⭐⭐ | 50 分钟 | 上下文相关性 / 忠实度 / 答案相关性三指标，定位坏在哪一环 | [../rag-advanced/05-rag-evaluation/README.md](../rag-advanced/05-rag-evaluation/README.md) |
| R6 | 生产化 RAG | ⭐⭐⭐⭐ | 60 分钟 | metadata 过滤、持久化、增量 upsert、端到端管线组合 | [../rag-advanced/06-production-rag/README.md](../rag-advanced/06-production-rag/README.md) |

### 🧩 进阶 LangGraph 专题（langgraph-advanced）

> 目标：把第 12 章的 LangGraph 入门继续往下挖，先用纯函数节点讲透状态图机制，再收集生产化章节路线。已完成 L1-L5；L6-L11 是生产化扩章地图，等逐章补齐六件套后再进入知识图谱。

| # | 标题 | 难度 | 预计 | 一句话简介 | 链接 |
|---|------|------|------|------------|------|
| L1 | 手写 StateGraph | ⭐⭐⭐ | 45 分钟 | State、channel reducer、节点 partial、边与 compile/invoke，拆开 `createReactAgent` 的底层骨架 | [../langgraph-advanced/01-stategraph-basics/README.md](../langgraph-advanced/01-stategraph-basics/README.md) |
| L2 | 条件边与路由 | ⭐⭐⭐ | 45 分钟 | 用 `addConditionalEdges` 做分支、循环、`recursionLimit` 安全阀与 `Send` 扇出 | [../langgraph-advanced/02-conditional-routing/README.md](../langgraph-advanced/02-conditional-routing/README.md) |
| L3 | Checkpointer 持久化与时间旅行 | ⭐⭐⭐⭐ | 50 分钟 | 用 `thread_id`、`getState`、history、`updateState` 解释图的可恢复状态线 | [../langgraph-advanced/03-checkpointing/README.md](../langgraph-advanced/03-checkpointing/README.md) |
| L4 | Human-in-the-Loop | ⭐⭐⭐⭐ | 50 分钟 | `interrupt` 暂停、读取 payload、`Command(resume)` 续跑，做危险操作审批门 | [../langgraph-advanced/04-human-in-the-loop/README.md](../langgraph-advanced/04-human-in-the-loop/README.md) |
| L5 | 多 Agent 编排 | ⭐⭐⭐⭐ | 60 分钟 | supervisor 中心调度与并行 team fork/join，两种拓扑串起前四章机制 | [../langgraph-advanced/05-multi-agent-graph/README.md](../langgraph-advanced/05-multi-agent-graph/README.md) |
| L6-L11 | 生产化扩章地图 | ⭐⭐⭐⭐ | 规划中 | event streaming、store、subgraph、fault tolerance、test/migration、deploy/observability 的章节候选与实现顺序 | [../langgraph-advanced/README.md#生产化扩章地图](../langgraph-advanced/README.md#生产化扩章地图) |

---

## 学完之后的下一步

恭喜走到这里——你已经具备从底层原理到生产部署的完整 Agent 工程能力。接下来选一条路：

- 💼 **找工作 / 转行** → 看 [求职指南](./career-guide.md)：岗位画像、技能清单、用本项目（尤其毕业项目）写简历、高频面试题拆解。
- 🚀 **做产品 / 创业** → 看 [创业指南](./startup-guide.md)：怎么判断机会、如何把毕业项目裁剪成 MVP、成本控制、上线 checklist。
- **按 Agent 类型选路线** → 看 [Agent 学习指南与分类地图](./agent-learning-guides.md)：按 Chat、Tool、Workflow、Research、Copilot、Multi-agent、Coding、Monitoring 等类型倒推能力清单。
- 🔬 **进阶 RAG（仓库内）** → 看 [进阶 RAG 专题](../rag-advanced/01-chunking-strategies/README.md)：分块、混合检索、重排、查询改写、评估、生产化、安全、索引与上下文工程，把第 08/09 章的最小 RAG 补成生产级，能力沉淀在 `src/shared/rag/`。
- 🧩 **进阶 LangGraph（仓库内）** → 看 [进阶 LangGraph 专题](../langgraph-advanced/README.md)：从 StateGraph 机制走到 production runtime 的扩章地图。
- **源码解析** → 看 [源码解析路线](../source-analysis/README.md)：顺着 LangChain、LangGraph、LlamaIndex 官方源码入口读懂框架运行时。
- 🧭 **RAG 架构设计** → 看 [RAG 完整架构蓝图](./rag-architecture.md)：把 demo 能力组织成写入路径、查询路径、数据模型、安全治理、质量闭环和部署拓扑。
- 🏢 **企业知识库 Agent** → 看 [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md)：把 RAG、记忆、工具、流式 UX、定时任务和部署串成一个企业级作品集。
- 🎓 **企业知识库 Agent Capstone** → 看 [毕业项目 · 企业知识库 Agent](../capstone/enterprise-knowledge-base-agent/README.md)：把蓝图拆成产品边界、数据模型、API、事件流、测试门和 4 周实现路线。
- 📚 **深挖 RAG（独立项目）** → 看 [RAG 系统实战项目](./rag-system-project.md)：连接到 [songuu/rag-system](https://github.com/songuu/rag-system)，把课程里的 RAG 原理升级成独立系统。

> 不确定走哪条？建议两份都读一遍——求职和创业需要的底层能力是同一套，区别只在你把它用在哪。
