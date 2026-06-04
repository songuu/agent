/**
 * 第 19 章 · Agent 前沿发展与生态拆解
 *
 * 运行：npx tsx lessons/19-agent-ecosystem-and-frontier/index.ts
 *
 * 本章不调用 LLM，不需要 .env。
 * 目标是把当前 agent 生态拆成工程层，并练习从需求约束倒推技术栈。
 */

interface EcosystemLayer {
  layer: string;
  question: string;
  examples: string[];
}

interface Scenario {
  name: string;
  constraints: string[];
  recommendedStack: string[];
  why: string;
}

const layers: EcosystemLayer[] = [
  {
    layer: "模型接口层",
    question: "模型如何接收输入、输出文本/工具调用/多模态结果?",
    examples: ["Responses API", "Messages API", "reasoning models", "parallel tool calls"],
  },
  {
    layer: "工具协议层",
    question: "agent 如何连接外部工具、数据、prompt 和资源?",
    examples: ["function calling", "MCP", "hosted tools", "computer use"],
  },
  {
    layer: "Agent SDK 层",
    question: "谁负责 loop、handoff、guardrails、session、trace?",
    examples: ["OpenAI Agents SDK", "Vercel AI SDK Agent", "custom runAgent"],
  },
  {
    layer: "编排 runtime 层",
    question: "长任务如何持久化、恢复、插入人工审批?",
    examples: ["LangGraph", "CrewAI Flows", "state machines", "durable execution"],
  },
  {
    layer: "数据/RAG 层",
    question: "agent 如何使用私有知识、检索、引用来源?",
    examples: ["LlamaIndex", "vector DB", "query planning", "RAG pipeline"],
  },
  {
    layer: "产品/UI 层",
    question: "用户如何看见 agent 正在做什么?",
    examples: ["streaming UI", "chat UI", "step timeline", "voice agents"],
  },
  {
    layer: "观测评估层",
    question: "如何知道 agent 对不对、贵不贵、为什么错?",
    examples: ["tracing", "eval datasets", "LLM-as-judge", "cost telemetry"],
  },
  {
    layer: "安全治理层",
    question: "如何防注入、防越权、防误操作?",
    examples: ["guardrails", "sandbox", "human-in-the-loop", "audit log"],
  },
];

const scenarios: Scenario[] = [
  {
    name: "前端聊天产品",
    constraints: ["TypeScript 全栈", "流式体验", "工具调用状态要显示给用户"],
    recommendedStack: ["Vercel AI SDK", "custom tools", "tracing/eval later"],
    why: "主要矛盾在 UI、streaming、类型安全和产品体验，不是复杂长任务恢复。",
  },
  {
    name: "企业长任务审批流",
    constraints: ["任务会跑很久", "中途需要人工审批", "失败后要恢复"],
    recommendedStack: ["LangGraph", "persistent state", "human-in-the-loop", "LangSmith tracing"],
    why: "主要矛盾是状态、恢复、interrupt 和可观测性，适合图式 runtime。",
  },
  {
    name: "内部知识库问答",
    constraints: ["大量私有文档", "需要引用来源", "问题会拆成子问题"],
    recommendedStack: ["LlamaIndex", "vector DB", "RAG eval", "source citation"],
    why: "主要矛盾是 ingestion、retrieval、query planning 和引用质量。",
  },
  {
    name: "多工具桌面自动化",
    constraints: ["需要文件/浏览器/外部系统", "工具要能跨客户端复用", "权限要可审计"],
    recommendedStack: ["MCP servers", "custom policy layer", "agent SDK client"],
    why: "主要矛盾是工具/数据连接标准化和权限治理。",
  },
  {
    name: "跨组织 agent 协作",
    constraints: ["不同系统里的 agent 互相委托", "要声明能力和认证", "任务可能异步完成"],
    recommendedStack: ["A2A", "Agent Card", "artifact/status lifecycle", "audit trail"],
    why: "主要矛盾是 agent-to-agent 发现、协作和任务生命周期。",
  },
  {
    name: "学习原理或小 demo",
    constraints: ["要完全看懂 loop", "依赖越少越好", "功能还不复杂"],
    recommendedStack: ["hand-written loop", "ToolRegistry", "MemoryVectorStore"],
    why: "主要矛盾是学习和控制，不需要一开始就上 runtime。",
  },
];

function printSection(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printLayers(): void {
  printSection("Agent ecosystem layers");
  for (const layer of layers) {
    console.log(`\n${layer.layer}`);
    console.log(`  Question: ${layer.question}`);
    console.log(`  Examples: ${layer.examples.join(", ")}`);
  }
}

function printScenarios(): void {
  printSection("Scenario -> stack recommendations");
  for (const scenario of scenarios) {
    console.log(`\n${scenario.name}`);
    console.log(`  Constraints: ${scenario.constraints.join(" / ")}`);
    console.log(`  Stack: ${scenario.recommendedStack.join(" + ")}`);
    console.log(`  Why: ${scenario.why}`);
  }
}

function printUpgradePath(): void {
  printSection("From demo to production");
  const steps = [
    "1. Hand-write the loop until you can explain messages, tools, memory, and stop conditions.",
    "2. Extract tool schemas and runtime validation into a registry.",
    "3. Add tracing, token/cost accounting, and fixed eval cases.",
    "4. Move long-running state into a graph/runtime only when recovery or HITL is needed.",
    "5. Expose tools through MCP when multiple clients need the same capabilities.",
    "6. Use A2A only when independently deployed agents need to discover and delegate to each other.",
    "7. Treat guardrails, sandboxing, audit logs, and human review as product features, not cleanup work.",
  ];
  for (const step of steps) console.log(step);
}

printLayers();
printScenarios();
printUpgradePath();
