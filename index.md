---
layout: home
title: Agent 从零到上框架 · AI Agent 开发完整学习路径
hero:
  name: "Agent 从零到上框架"
  text: "AI Agent 开发完整学习路径"
  tagline: 纯 TypeScript 手写每一个零件 → 再上主流框架 → 进阶 RAG → 可部署服务。学完能求职，也能创业。
  actions:
    - theme: brand
      text: 🚀 开始学习
      link: /docs/setup
    - theme: alt
      text: 课程总览
      link: /docs/navigation
    - theme: alt
      text: GitHub
      link: https://github.com/songuu/agent
features:
  - icon: 🧱
    title: 第一部分 · 基础概念
    details: 什么是 Agent、第一次 LLM 调用、提示工程，再补 messages、token、tool calling、workflow vs agent 等底层词汇。
    link: /agent-basics/
    linkText: 基础扩展
  - icon: ✍️
    title: 第二部分 · 从零手写核心
    details: 亲手写出 Agent 循环、工具调用、工具系统、短期记忆——整门课的地基。
    link: /lessons/04-the-agent-loop/
    linkText: 04–07 章
  - icon: 📚
    title: 第三部分 · 知识与检索
    details: Embedding、向量检索、从零实现 RAG——让 Agent 用上它没见过的知识。
    link: /lessons/08-embeddings-and-vector-search/
    linkText: 08–09 章
  - icon: 🧠
    title: 第四部分 · 进阶模式
    details: ReAct / Plan-Execute / Reflection 推理范式，与多智能体编排协作。
    link: /lessons/10-reasoning-patterns/
    linkText: 10–11 章
  - icon: 🏗️
    title: 第五部分 · 工程化与框架
    details: LangGraph.js、Vercel AI SDK、结构化输出、流式 UX——把手写经验迁移到框架。
    link: /lessons/12-intro-to-frameworks/
    linkText: 12–14 章
  - icon: 🛡️
    title: 第六部分 · 生产化
    details: 评估测试、可观测与成本、安全护栏、部署成服务——敢上线的全套能力。
    link: /lessons/15-evaluation-and-testing/
    linkText: 15–18 章
  - icon: 🌐
    title: 第七部分 · 前沿与生态
    details: MCP、A2A、Agents SDK、编排 runtime，再用文章库按日期追踪前沿资料。
    link: /lessons/19-agent-ecosystem-and-frontier/
    linkText: 19–20 章
  - icon: 🎓
    title: 毕业项目 · Deep Research Agent
    details: 综合循环、工具、RAG、结构化输出、可观测的实战项目，可直接放进作品集。
    link: /capstone/deep-research-agent/
    linkText: 综合实战
  - icon: 🧰
    title: 实践型毕业项目组
    details: 20 个新增真实业务流程项目，覆盖协作、法务、数据、安全、合规、HR、供应链和隐私等场景。
    link: /capstone/
    linkText: 看 28 个项目
  - icon: 📁
    title: 项目中心
    details: 像 ChatGPT Projects 一样，把课程项目、源码解析、RAG 系统、企业知识库和作品集入口收束到一个工作区。
    link: /docs/projects
    linkText: 打开项目
  - icon: 🧩
    title: Agent 应用入口
    details: 统一进入独立部署的 Agent 子应用；当前包含 SPIFFE mTLS Agent 架构演示，后续子应用沿同一目录扩展。
    link: /docs/agent-apps
    linkText: 打开应用目录
  - icon: ⏱️
    title: 已安排
    details: 集中查看 AI 资讯、Notion、面试题和日报等定时任务的入口、节奏、数据落点和验证边界。
    link: /docs/scheduled
    linkText: 查看任务
  - icon: 🔬
    title: 进阶 RAG 专题
    details: 分块策略、混合检索、召回-精排、查询改写、三指标评估、生产化——把最小 RAG 补成生产级。
    link: /rag-advanced/01-chunking-strategies/
    linkText: R1–R6 六章
  - icon: 🗺️
    title: 知识图谱
    details: 329 个概念、457 条关系的全局图谱与交互式动图，看清概念之间怎么串联。
    link: /docs/knowledge-graph
    linkText: 打开图谱
  - icon: 💼
    title: 求职指南
    details: 岗位画像、技能清单、用本项目写简历、高频面试题拆解。
    link: /docs/career-guide
    linkText: 找工作
  - icon: 🚀
    title: 创业指南
    details: 机会判断、MVP 裁剪、成本控制、上线 checklist——从 demo 到产品。
    link: /docs/startup-guide
    linkText: 做产品
  - icon: 🏢
    title: 企业知识库 Agent 蓝图
    details: 把 RAG、记忆、工具、事件流、定时任务和部署串成一个企业级作品集项目。
    link: /docs/enterprise-knowledge-base-agent
    linkText: 看蓝图
  - icon: 🎓
    title: 企业知识库 Agent Capstone
    details: 把蓝图拆成产品边界、数据模型、API、事件流、测试门和 4 周实现路线。
    link: /capstone/enterprise-knowledge-base-agent/
    linkText: 做项目
---

## 这门课怎么学

```mermaid
flowchart LR
  A["00 环境搭建"] --> B["01–03 基础概念"]
  B --> B2["B1–B12 基础概念扩展"]
  B2 --> C["04–07 从零手写核心"]
  C --> D["08–09 知识与检索"]
  D --> E["10–11 进阶模式"]
  E --> F["12–14 工程化与框架"]
  F --> G["15–18 生产化"]
  G --> H["19 前沿与生态"]
  H --> H2["20 前沿文章库"]
  H2 --> I["🎓 毕业项目"]
  I --> J["🔬 进阶 RAG 专题"]
  J --> K["🏢 企业知识库 Agent 蓝图"]
  K --> K2["🎓 企业知识库 Agent Capstone"]
  K2 --> L["💼 求职 / 🚀 创业"]
```

- **先手写，后框架**：先理解每一行为什么存在，再看框架帮你省了什么。
- **每章可运行**：`npx tsx lessons/NN-xxx/index.ts` 直接跑，零编译。
- **厂商无关**：统一 `getLLM()` 抽象，换 Claude / OpenAI 只改一行 `.env`。
- **三层学习路线**：每章「极简 → 进阶 → 真实实践」，不止看懂，还能用在真实项目。

## 快速开始

```bash
git clone https://github.com/songuu/agent.git
cd agent
pnpm install

# 配置 key（至少一个厂商）
cp .env.example .env   # 填入 ANTHROPIC_API_KEY 或 OPENAI_API_KEY

# 验证环境（不需要 key）
pnpm typecheck

# 跑第一个例子（需要 key）
npx tsx lessons/02-first-llm-call/index.ts
```

详细步骤见 [第 00 章 · 环境搭建](/docs/setup)。
