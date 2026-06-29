import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(path, search, replacement) {
  const text = readFileSync(path, "utf8");
  if (!text.includes(search)) throw new Error(`Missing marker in ${path}: ${search.slice(0, 60)}`);
  writeFileSync(path, text.replace(search, replacement), "utf8");
}

replaceOnce(
  "knowledge-graph/data/frontier-articles.ts",
  `const FRONTIER_COLLECTED_DATE = "2026-06-25";\nconst FRONTIER_COLLECTED_AT = \`${"${FRONTIER_COLLECTED_DATE}"}T09:00:00+08:00\`;\nconst FRONTIER_DISPLAY_DATE_LABEL = "6月25日 · 星期四";`,
  `const FRONTIER_COLLECTED_DATE = "2026-06-26";\nconst FRONTIER_COLLECTED_AT = \`${"${FRONTIER_COLLECTED_DATE}"}T09:00:00+08:00\`;\nconst FRONTIER_DISPLAY_DATE_LABEL = "6月26日 · 星期五";`
);

replaceOnce(
  "knowledge-graph/data/interview-questions.ts",
  `const COLLECTED_DATE = "2026-06-25";\nconst COLLECTED_AT = \`${"${COLLECTED_DATE}"}T09:00:00+08:00\`;`,
  `const COLLECTED_DATE = "2026-06-26";\nconst COLLECTED_AT = \`${"${COLLECTED_DATE}"}T09:00:00+08:00\`;`
);

const graphInsertMarker = `  { title: "Introducing Contextual Retrieval", url: "https://www.anthropic.com/news/contextual-retrieval", kind: "blog", chapters: ["rag-chunk", "rag-hybrid", "rag-contextual"], note: "Anthropic 官方：上下文化分块 + 向量与 BM25 混合 + 重排的实战配方，进阶 RAG 必读" },`;
const graphInsert = `  {
    title: "OpenAI research: How agents are transforming work",
    url: "https://openai.com/index/how-agents-are-transforming-work",
    kind: "blog",
    source: "OpenAI",
    publishedAt: "2026-06-25",
    institution: "OpenAI",
    chapters: ["19"],
    ecosystemLayer: "evaluation",
    note: "OpenAI 官方研究总结：agent 正在把使用场景从单轮问答推向更长、更复杂、跨角色的工作流，信号不是『聊天更顺』，而是任务边界、过程可见性和生产力衡量口径都在变化。",
    applicableModules: [
      "lessons/11-multi-agent-orchestration",
      "lessons/15-evaluation-and-testing",
      "lessons/16-observability-and-cost",
      "lessons/18-deployment",
      "lessons/20-agent-frontier-news",
    ],
    confidence: "high",
    credibilityNote: "一手 OpenAI 官方新闻/研究摘要；可直接追溯到 OpenAI 发布页。",
  },
  {
    title: "CrewAI 1.15.0 release notes",
    url: "https://github.com/crewAIInc/crewAI/releases/tag/1.15.0",
    kind: "doc",
    source: "CrewAI",
    publishedAt: "2026-06-25",
    institution: "CrewAI",
    chapters: ["19"],
    ecosystemLayer: "runtime",
    note: "官方 release notes：开始系统化追踪 conversational flow turn usage、统一 declarative flow loading，并把 conversational flows 贯通到 CLI/TUI，说明多智能体 workflow 已从『能跑』进入『可观测、可回放、可统一运维』阶段。",
    applicableModules: [
      "lessons/11-multi-agent-orchestration",
      "lessons/16-observability-and-cost",
      "lessons/18-deployment",
      "lessons/20-agent-frontier-news",
    ],
    confidence: "high",
    credibilityNote: "一手 GitHub release；直接来自 CrewAI 官方仓库稳定版。",
  },
  {
    title: "Retrofit, don't rebuild: Agentic overlays for transforming legacy enterprise services",
    url: "https://aws.amazon.com/blogs/machine-learning/retrofit-dont-rebuild-agentic-overlays-for-transforming-legacy-enterprise-services/",
    kind: "blog",
    source: "AWS",
    publishedAt: "2026-06-25",
    institution: "AWS",
    chapters: ["19"],
    ecosystemLayer: "protocol",
    note: "AWS 官方技术实践：提出 agentic overlays，用薄包装层把传统 REST 服务转成 agent 可消费能力，核心不是重写遗留系统，而是把工具接口、权限边界与渐进迁移拆开。",
    applicableModules: [
      "lessons/05-tool-use-basics",
      "lessons/11-multi-agent-orchestration",
      "lessons/17-safety-and-guardrails",
      "lessons/18-deployment",
      "lessons/20-agent-frontier-news",
    ],
    confidence: "high",
    credibilityNote: "一手 AWS 官方技术博客；文章分类为 Amazon Bedrock AgentCore / Technical How-to。",
  },
  {
    title: "Building agentic AI applications with a modern data mesh strategy on AWS",
    url: "https://aws.amazon.com/blogs/machine-learning/building-agentic-ai-applications-with-a-modern-data-mesh-strategy-on-aws/",
    kind: "blog",
    source: "AWS",
    publishedAt: "2026-06-25",
    institution: "AWS",
    chapters: ["19"],
    ecosystemLayer: "data-memory",
    note: "AWS 官方技术实践：把 governed, serverless data mesh 作为 production agentic AI 的数据底座，强调 catalog、IAM、Lake Formation、knowledge base 与 retrieval 层要一起设计，而不是让 agent 直连散落数据源。",
    applicableModules: [
      "lessons/08-embeddings-and-vector-search",
      "lessons/09-rag-from-scratch",
      "lessons/16-observability-and-cost",
      "lessons/17-safety-and-guardrails",
      "lessons/18-deployment",
      "lessons/20-agent-frontier-news",
    ],
    confidence: "high",
    credibilityNote: "一手 AWS 官方技术博客；文章分类覆盖 Bedrock AgentCore、Knowledge Bases、IAM、Lake Formation 等真实生产组件。",
  },
${graphInsertMarker}`;
replaceOnce("knowledge-graph/data/graph.ts", graphInsertMarker, graphInsert);

const iqMarker = `  // C. 项目深挖类`;
const iqInsert = `  {
    slug: "conversational-flow-telemetry-and-unified-loader-boundary",
    category: "engineering",
    question:
      "为什么 agent workflow 一旦进入 conversational flow / declarative flow 阶段，就要单独追踪 turn usage，并统一 CLI、TUI、loader 的入口？如果 telemetry 和运行入口不统一，会让调试、计费和回放出现什么问题？",
    relatedChapters: ["11", "16", "18", "19"],
    sourceTitles: [
      "CrewAI 1.15.0 release notes",
    ],
    sourceUrls: [
      "https://github.com/crewAIInc/crewAI/releases/tag/1.15.0",
    ],
    confidence: "high",
    rationale: "本题来自 CrewAI 1.15.0 对 conversational flow telemetry 和 declarative flow 统一入口的稳定版收敛，适合追问多 agent workflow 的可观测与运维边界。",
  },
  {
    slug: "agentic-overlay-vs-rebuild-for-legacy-enterprise-services",
    category: "engineering",
    question:
      "为什么企业做 agent 改造时常常应该『retrofit, don't rebuild』？agentic overlay 与直接重写遗留系统相比，分别在兜什么集成、权限和发布风险？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Retrofit, don't rebuild: Agentic overlays for transforming legacy enterprise services",
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/retrofit-dont-rebuild-agentic-overlays-for-transforming-legacy-enterprise-services/",
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对 legacy enterprise services 的 agentic overlay 实践，适合补齐工具接口改造、权限壳层和渐进迁移的生产追问。",
  },
  {
    slug: "governed-data-mesh-for-agentic-ai-vs-direct-source-access",
    category: "engineering",
    question:
      "为什么生产级 agentic AI 需要 governed data mesh，而不是让 agent 直接去拉数据库/对象存储/知识库？identity、catalog、policy 和 knowledge base 在 agent 数据底座里分别解决什么问题？",
    relatedChapters: ["08", "09", "16", "17", "18", "19"],
    sourceTitles: [
      "Building agentic AI applications with a modern data mesh strategy on AWS",
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/building-agentic-ai-applications-with-a-modern-data-mesh-strategy-on-aws/",
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对 governed data mesh + Bedrock AgentCore + Knowledge Bases 的组合实践，适合追问 production agent 的数据治理与检索边界。",
  },
${iqMarker}`;
replaceOnce("knowledge-graph/data/interview-questions.ts", iqMarker, iqInsert);

const guideMarker = `### C. 项目深挖类（考你是不是真做过）`;
const guideInsert = `28. 为什么 agent workflow 一旦进入 conversational flow / declarative flow 阶段，就要单独追踪 turn usage，并统一 CLI、TUI、loader 的入口？如果 telemetry 和运行入口不统一，会让调试、计费和回放出现什么问题？（→ 11 / 16 / 18 / 19）
29. 为什么企业做 agent 改造时常常应该“retrofit, don't rebuild”？agentic overlay 与直接重写遗留系统相比，分别在兜什么集成、权限和发布风险？（→ 05 / 11 / 17 / 18 / 19）
30. 为什么生产级 agentic AI 需要 governed data mesh，而不是让 agent 直接去拉数据库 / 对象存储 / 知识库？identity、catalog、policy 和 knowledge base 在 agent 数据底座里分别解决什么问题？（→ 08 / 09 / 16 / 17 / 18 / 19）

${guideMarker}`;
replaceOnce("docs/career-guide.md", guideMarker, guideInsert);