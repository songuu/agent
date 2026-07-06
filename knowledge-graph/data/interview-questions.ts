// 高频面试题结构化收集 —— 与前沿文章并列的第二条 Supabase 同步管道。
//
// 单一事实源：本文件。它是「收集面试题」的结构化母本，供 seed 生成器与（未来）课程页 UI 共享。
// - docs/career-guide.md 第四节「高频面试题清单」是面向读者的同源人读清单；
// - 各章 README 末尾的 `💡 面试会问` 是每道题的「标准答案来源」（answerSource 指向它）。
//
// 设计约束（吸取前沿管道 P2 教训 + 并行会话隔离）：
// - 每题显式 slug（稳定、人类可读、与数组下标无关）；中文题干 slugify 会塌成空串，
//   故不按下标派生 slug，避免「增删/重排即变更身份」的脆弱性。
// - 本模块刻意不 import graph.ts：面试题不是文章，且前沿文章管道正被并行会话改写，
//   解耦可避免共享文件碰撞。relatedChapters 仅作字符串标签。

export type InterviewQuestionCategory = "principle" | "engineering" | "project";

export interface InterviewQuestion {
  id: string;
  slug: string;
  category: InterviewQuestionCategory;
  categoryLabel: string;
  question: string;
  relatedChapters: string[];
  /** 指向「标准答案来源」的人读提示：相关章节 README 的 `💡 面试会问`。 */
  answerSource: string;
  collectedDate: string;
  collectedAt: string;
  sortOrder: number;
  tags: string[];
  sourceTitles: string[];
  sourceUrls: string[];
  confidence?: "high" | "medium" | "low";
  rationale?: string;
  summaryExcerpt?: string;
  faqList?: Array<{ question: string; answer: string }>;
}

const CATEGORY_LABELS: Record<InterviewQuestionCategory, string> = {
  principle: "原理类",
  engineering: "工程类",
  project: "项目深挖类",
};

const COLLECTED_DATE = "2026-07-06";
const COLLECTED_AT = `${COLLECTED_DATE}T09:00:00+08:00`;

interface RawInterviewQuestion {
  slug: string;
  category: InterviewQuestionCategory;
  question: string;
  relatedChapters: string[];
  sourceTitles?: string[];
  sourceUrls?: string[];
  confidence?: "high" | "medium" | "low";
  rationale?: string;
  summaryExcerpt?: string;
}

// 题干与 docs/career-guide.md 第四节保持一致（去掉「（→ 章节）」括注，章节关系由 relatedChapters 承载）。
const RAW_QUESTIONS: RawInterviewQuestion[] = [
  // A. 原理类
  {
    slug: "llm-vs-agent-and-loop",
    category: "principle",
    question: "LLM 和 Agent 有什么区别？请画出 Agent 的执行循环。",
    relatedChapters: ["01"],
  },
  {
    slug: "token-and-statelessness-memory",
    category: "principle",
    question: "什么是 token？为什么说 LLM 是「无状态」的？多轮对话的「记忆」是怎么实现的？",
    relatedChapters: ["02", "07"],
  },
  {
    slug: "system-vs-user-prompt-cot-temperature",
    category: "principle",
    question:
      "system 提示和 user 提示有什么区别？为什么思维链（CoT）能提升正确率？什么任务该把 temperature 设成 0？",
    relatedChapters: ["03"],
  },
  {
    slug: "react-and-maxsteps",
    category: "principle",
    question: "ReAct 是什么、解决了什么问题？为什么 agent 循环一定要有 maxSteps（停止条件）？",
    relatedChapters: ["04"],
  },
  {
    slug: "function-calling-roundtrip",
    category: "principle",
    question:
      "function calling 的完整往返是怎样的？模型会自己执行工具吗？toolCallId 是干什么用的？",
    relatedChapters: ["05"],
  },
  {
    slug: "rag-basics-overlap-topk-traceable",
    category: "principle",
    question:
      "什么是 RAG？为什么 RAG 能降低幻觉？分块为什么要做 overlap？top-k 的 k 怎么取？如何让答案可溯源？",
    relatedChapters: ["08", "09"],
  },
  {
    slug: "why-llm-hallucinate",
    category: "principle",
    question: "模型为什么会幻觉？这是 bug 还是固有特性？工程上能彻底消除吗？",
    relatedChapters: ["09"],
  },
  {
    slug: "embedding-cosine-vs-euclidean",
    category: "principle",
    question:
      "什么是 embedding？为什么用余弦相似度而不是欧氏距离？语义检索 vs 关键词检索各自适用什么场景？",
    relatedChapters: ["08"],
  },
  {
    slug: "react-vs-plan-execute-reflection",
    category: "principle",
    question:
      "ReAct 和 Plan-and-Execute 的本质区别？什么任务该用哪个？Reflection 为什么能在不引入新信息的情况下提升质量、收益边界在哪？",
    relatedChapters: ["10"],
  },
  // B. 工程类
  {
    slug: "stable-json-output-retry-repair",
    category: "engineering",
    question:
      "怎么让 LLM 稳定输出 JSON？校验失败了怎么办（retry-repair 怎么实现）？工具调用 / JSON mode / 提示约束三者区别？",
    relatedChapters: ["13"],
  },
  {
    slug: "prevent-prompt-injection-guardrails",
    category: "engineering",
    question:
      "如何防 prompt injection？用户能通过输入篡改 system 指令吗？关键操作（删数据、发邮件）你怎么加护栏？",
    relatedChapters: ["17"],
  },
  {
    slug: "control-cost-token-accounting",
    category: "engineering",
    question:
      "如何控制成本？一次 agent 调用的钱花在哪？怎么算 token 账？上下文太长怎么压？模型怎么选？",
    relatedChapters: ["07", "16"],
  },
  {
    slug: "evaluate-agent-llm-app",
    category: "engineering",
    question:
      "如何评估一个 Agent / LLM 应用？为什么不能只靠传统单测？LLM-as-judge 有什么风险、怎么缓解？回归测试集解决什么问题？",
    relatedChapters: ["15"],
  },
  {
    slug: "context-window-full-strategies",
    category: "engineering",
    question: "上下文窗口满了怎么办？滑动窗口和摘要压缩各自的取舍？",
    relatedChapters: ["07"],
  },
  {
    slug: "streaming-throughput-vs-ux-abortcontroller",
    category: "engineering",
    question:
      "流式输出能让接口更快吗（吞吐）？为什么不能？为什么体验还是更好？AbortController 是强杀还是协作式取消？",
    relatedChapters: ["14"],
  },
  {
    slug: "tool-error-feedback-not-throw",
    category: "engineering",
    question: "工具执行报错时，为什么不直接抛异常，而要把错误回传给模型？",
    relatedChapters: ["06"],
  },
  {
    slug: "when-multi-agent-and-cost",
    category: "engineering",
    question: "什么场景下多 agent 比单 agent 更好？多 agent 的主要代价是什么、如何权衡？",
    relatedChapters: ["11"],
  },
  {
    slug: "when-not-to-use-agent",
    category: "engineering",
    question: "什么场景不该用 Agent？",
    relatedChapters: ["01"],
  },
  {
    slug: "computer-use-agent-success-vs-harm-metrics",
    category: "engineering",
    question:
      "评测 computer-use / workplace agent 时，为什么不能只看任务成功率？unintended / harmful action 指标分别在兜什么风险？",
    relatedChapters: ["15", "17", "19"],
    sourceTitles: [
      "WorkBench Revisited: Towards a Scalable Benchmark for Evaluating Agents in Realistic Enterprise Workflows",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.13715"],
    confidence: "medium",
    rationale: "本题直接来自 2026 新 benchmark 对 success 与 harmful action 双指标的强调。",
  },
  {
    slug: "memory-agent-recall-vs-reuse-evaluation",
    category: "engineering",
    question:
      "长期记忆 agent 为何不能只测 recall？为什么 observation stream、user feedback、knowledge archive 与 follow-up reuse 要分开评估？",
    relatedChapters: ["07", "15", "19"],
    sourceTitles: [
      "StreamMemBench: Towards Better Long-Context Evaluation for Memory Agents",
    ],
    sourceUrls: ["https://arxiv.org/abs/2509.16490"],
    confidence: "medium",
    rationale: "本题覆盖 2026 新 memory benchmark 的核心口径变化，适合补齐记忆评测高频追问。",
  },
  {
    slug: "harness-vs-framework-boundary",
    category: "engineering",
    question:
      "什么是 agent harness？它和 agent framework / SDK 的边界怎么划？为什么审批、重试、回放、权限壳层最好放在 harness 而不是模型里？",
    relatedChapters: ["04", "12", "16", "19"],
    sourceTitles: [
      "What makes a harness a harness? Model-free foundation for agentic AI",
      "Anthropic Engineering · Effective harnesses for long-running agents",
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.10666",
      "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents",
    ],
    confidence: "medium",
    rationale: "本题对应 2026 对 harness 抽象的集中讨论，兼顾论文观点与工程实操。",
  },
  {
    slug: "runtime-upgrade-auth-compaction-boundaries",
    category: "engineering",
    question:
      "Agent runtime / tool 协议升级时，为什么要单独审查 auth-required vs input-required、history compaction、auto-approval 规则和 tracing 注入边界？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework .NET 1.10.0 release notes",
      "Google ADK Python v1.35.0 release notes",
      "OpenAI Agents Python v0.17.5 release notes",
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.10.0",
      "https://github.com/google/adk-python/releases/tag/v1.35.0",
      "https://github.com/openai/openai-agents-python/releases/tag/v0.17.5",
    ],
    confidence: "high",
    rationale: "本题来自多个官方 release notes 的共同趋势：生产 agent 的问题越来越集中在授权、压缩、审批和可观测边界。",
  },
  {
    slug: "scientific-synthesis-clean-room-generalization",
    category: "engineering",
    question:
      "研究型 agent 的 benchmark 为什么要强调 clean-room synthesis 和 strategic generalization？如果 agent 只是拼接原文句子，为什么高分也不可信？",
    relatedChapters: ["10", "15", "capstone", "19"],
    sourceTitles: [
      "Can AI Agents Synthesize Scientific Conclusions? Understanding Strategic Generalization on SciConBench",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.11337"],
    confidence: "medium",
    rationale: "本题对应 SciConBench 对『跨文献综合』与『避免原句泄露』的双重要求，适合深挖 deep research agent 的真实泛化能力。",
  },
  {
    slug: "long-horizon-agent-benchmark-vs-single-step-score",
    category: "engineering",
    question:
      "为什么长周期 agent 评测不能只看单步 reward 或单回合成功率？RetailBench 这类 benchmark 在检验什么长期策略能力？",
    relatedChapters: ["10", "15", "19"],
    sourceTitles: [
      "RetailBench: A Long-Horizon Benchmark for AI Agents in Retail Management",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.14545"],
    confidence: "medium",
    rationale: "本题来自长周期零售 benchmark 对策略一致性、跨天反馈链和收益稳定性的强调，适合补齐 long-horizon agent 高频追问。",
  },
  {
    slug: "monitoring-agent-timeliness-false-alert-action-chain",
    category: "engineering",
    question:
      "监控/告警 agent 为什么要同时测反应时效、误报/漏报和后续行动链，而不是只看『能否识别异常』？",
    relatedChapters: ["16", "17", "18", "19"],
    sourceTitles: [
      "SentinelBench: Benchmarking Monitoring Agents in Dynamic Environments",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.05342"],
    confidence: "medium",
    rationale: "本题来自 monitoring agent benchmark，对 observability、告警治理和自动处置边界都很贴近生产场景。",
  },
  {
    slug: "memory-agent-relational-consistency-vs-keyword-recall",
    category: "engineering",
    question:
      "评测记忆 agent 时，为什么要单独测补充关系、矛盾关系和无关关系的区分？只看关键词召回会漏掉什么记忆一致性问题？",
    relatedChapters: ["07", "15", "19"],
    sourceTitles: [
      "SubtleMemory: Benchmarking Long-Term Relational Memory in LLM Agents",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.05761"],
    confidence: "medium",
    rationale: "本题覆盖 relational memory benchmark 的核心口径，适合补齐『记住了多少』之外的『记得是否一致』。",
  },
  {
    slug: "pre-approval-tool-input-guardrails-vs-post-hoc-check",
    category: "engineering",
    question:
      "为什么 tool guardrails 最好放在“真正执行前”的 pre-approval 边界，而不是等工具跑完再做事后检查？这对高权限工具有什么安全意义？",
    relatedChapters: ["05", "17", "18", "19"],
    sourceTitles: [
      "OpenAI Agents Python v0.17.6 release notes",
      "OpenAI Agents JS v0.11.8 release notes",
    ],
    sourceUrls: [
      "https://github.com/openai/openai-agents-python/releases/tag/v0.17.6",
      "https://github.com/openai/openai-agents-js/releases/tag/v0.11.8",
    ],
    confidence: "high",
    rationale: "本题来自 OpenAI Agents 最新 py/js release 的共同变更：把 pre-approval tool input guardrails 前移到真实执行边界。",
  },
  {
    slug: "brokered-execution-vs-agent-held-production-authority",
    category: "engineering",
    question:
      "为什么生产变更权限不该直接放在 agent 推理进程里？certificate-bound broker / scoped execution identity 这种执行边界在兜什么风险？",
    relatedChapters: ["17", "18", "19"],
    sourceTitles: [
      "Sovereign Execution Brokers: Enforcing Certificate-Bound Authority in Agentic Control Planes",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.20520"],
    confidence: "medium",
    rationale: "本题对应 2026 新 paper 对“proposal / admission / execution”分层的强调，贴近高权限 agent 落地。",
  },
  {
    slug: "probabilistic-policy-verification-under-ambiguous-detectors",
    category: "engineering",
    question:
      "当 PII detector / declassifier 这类安全判定本身带误差时，为什么 deterministic policy 不够？agent runtime 该怎么理解 probabilistic verification 的意义？",
    relatedChapters: ["15", "17", "19"],
    sourceTitles: [
      "Efficient and Sound Probabilistic Verification for AI Agents",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.20510"],
    confidence: "medium",
    rationale: "本题覆盖安全策略在“检测器有误差”前提下的验证问题，适合补齐 agent security/eval 的高阶追问。",
  },
  {
    slug: "repository-guidance-coverage-vs-precision-for-coding-agents",
    category: "engineering",
    question:
      "为什么高质量仓库指引（如 AGENTS.md）更主要提升 coding agent 的文件定位覆盖率，而不一定直接提升 patch 精度？步数预算变大时它为什么更重要？",
    relatedChapters: ["12", "15", "19", "capstone"],
    sourceTitles: [
      "Probe-and-Refine Tuning of Repository Guidance for Coding Agents",
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.20512"],
    confidence: "medium",
    rationale: "本题直接来自 2026 新 paper 对 repository guidance 的实验结论，和本仓库 AGENTS/课程结构高度相关。",
  },
  {
    slug: "multi-tenant-agent-runtime-isolation-vs-dedicated-stack",
    category: "engineering",
    question:
      "为什么共享基础设施的多租户 agent runtime 不能只靠“逻辑上分 tenant”就算隔离完成？state、identity、telemetry 和审批边界分别要隔离什么，什么时候还得回到 dedicated stack？",
    relatedChapters: ["16", "17", "18", "19"],
    sourceTitles: [
      "Shared infrastructure, isolated tenants: Pool model multi-tenancy with Amazon Bedrock AgentCore",
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/shared-infrastructure-isolated-tenants-pool-model-multi-tenancy-with-amazon-bedrock-agentcore/",
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对生产级多租户 AgentCore 隔离模式的官方实践，适合补齐 runtime / deployment / guardrail 的交叉追问。",
  },
  {
    slug: "scientific-copilot-query-parse-retrieval-summary-boundary",
    category: "engineering",
    question:
      "做研究型 copilot 时，为什么要把 structured query parsing、embedding retrieval 和 AI summary 三段拆开，而不是让一个大 prompt 端到端包办？这样拆分分别在兜什么准确性与可追溯风险？",
    relatedChapters: ["08", "09", "16", "19"],
    sourceTitles: [
      "Build a protein research copilot with Amazon Bedrock AgentCore",
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/build-a-protein-research-copilot-with-amazon-bedrock-agentcore/",
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对 research copilot 的官方实现拆解，直接对应 query parsing / retrieval / summarization 的工程边界。",
  },
  {
    slug: "agent-identity-infrastructure-vs-provider-account-mapping",
    category: "engineering",
    question:
      "为什么跨组织 agent 协作不能长期依赖“给每个 agent 发一把 API key”这种做法？独立的 agent identity / name service 在信任建立、权限撤销和跨平台互认上解决了什么问题？",
    relatedChapters: ["17", "18", "19"],
    sourceTitles: [
      "Linux Foundation Agent Name Service identity infrastructure announcement",
    ],
    sourceUrls: [
      "https://www.linuxfoundation.org/press/linux-foundation-announces-intent-to-launch-agent-name-service-to-establish-trusted-identity-infrastructure-for-ai-agents",
    ],
    confidence: "high",
    rationale: "本题对应 Linux Foundation 新提出的 agent identity 基础设施，适合补齐 protocol / trust / governance 的生产追问。",
  },
  {
    slug: "approval-state-idempotency-and-guardrail-race-cancellation",
    category: "engineering",
    question:
      "多 agent / realtime tool 执行里，为什么“已解决的 approval 不应被重复求值”，而 sibling guardrail/task 一旦失败就要立刻取消其它并发 guardrail？否则会出现什么竞态和副作用风险？",
    relatedChapters: ["11", "14", "17", "18", "19"],
    sourceTitles: [
      "OpenAI Agents Python v0.17.7 release notes",
      "OpenAI Agents JS v0.12.0 release notes",
    ],
    sourceUrls: [
      "https://github.com/openai/openai-agents-python/releases/tag/v0.17.7",
      "https://github.com/openai/openai-agents-js/releases/tag/v0.12.0",
    ],
    confidence: "high",
    rationale: "本题来自 OpenAI 最新 py/js release 对 approval state 与 guardrail 并发收尾的修复，直接对应生产 runtime 的竞态与重复副作用边界。",
  },
  {
    slug: "read-only-file-access-still-needs-explicit-approval",
    category: "engineering",
    question:
      "为什么即便是“read-only auto-approval”模式，file-access 工具仍可能要强制人工审批？当 loop 能力被集成进 harness agent 后，这条边界为什么会变得更关键？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework .NET 1.11.0 release notes",
      "Microsoft Agent Framework Python 1.9.0 release notes",
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.0",
      "https://github.com/microsoft/agent-framework/releases/tag/python-1.9.0",
    ],
    confidence: "high",
    rationale: "本题来自 Microsoft Agent Framework 最新 release：把审批边界前移到 file-access 与 harness loop 结合处，强调“读权限”在长流程里同样可能造成敏感外泄。",
  },
  {
    slug: "declarative-workflow-path-validation-vs-runtime-filesystem-boundary",
    category: "engineering",
    question:
      "声明式 workflow / skill archive 为什么要显式防 symlink path traversal 和非法 flow definition paths？这类问题看起来不是 prompt bug，却为什么能直接突破 agent runtime 的文件系统边界？",
    relatedChapters: ["11", "17", "18", "19"],
    sourceTitles: [
      "CrewAI 1.14.8a4 release notes",
    ],
    sourceUrls: [
      "https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a4",
    ],
    confidence: "high",
    rationale: "本题来自 CrewAI 最新 prerelease 对 skill archive 提取与 declarative flow path 的安全修复，适合补齐 workflow DSL 落地时的本地文件边界追问。",
  },
  {
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
  {
    slug: "approval-by-default-for-agent-skills-and-tools",
    category: "engineering",
    question:
      "为什么 production agent 里的 skill/provider tools 最好默认 require approval，而不是默认放行后再补规则？一旦默认值反了，权限壳层、审计和回放会出现什么系统性漏洞？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework .NET 1.11.1 release notes",
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.1",
    ],
    confidence: "high",
    rationale: "本题来自 Microsoft Agent Framework 1.11.1 的 breaking change：把 AgentSkillsProvider tools 的默认审批策略改成 require approval，适合补齐 agent tool 默认信任边界的高频追问。",
  },
  {
    slug: "redirect-based-ssrf-in-agent-fetch-and-scraping-tools",
    category: "engineering",
    question:
      "为什么 agent 的网页抓取 / scraping tool 不能只校验首跳 URL 是否在 allowlist？一旦重定向链里出现 SSRF bypass，会把什么内网、metadata 或权限侧信道暴露给 agent？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "CrewAI 1.15.1 release notes",
    ],
    sourceUrls: [
      "https://github.com/crewAIInc/crewAI/releases/tag/1.15.1",
    ],
    confidence: "high",
    rationale: "本题来自 CrewAI 1.15.1 对 scraping fetches 中 SSRF redirect bypass 的修复，适合补齐 fetch/search/browser 类工具的网络边界追问。",
  },
  {
    slug: "stepwise-verification-and-interactive-benchmarks-for-research-agents",
    category: "engineering",
    question:
      "为什么研究型 agent 的 benchmark 不能只看最终答案对不对？stepwise verification 和 interactive environment 分别在检验什么能力，为什么它们比 final-answer-only 更能暴露长流程研究任务的失败模式？",
    relatedChapters: ["10", "15", "19", "capstone"],
    sourceTitles: [
      "Benchmarking AI Agents for Addressing Scientific Challenges Across Scales",
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.12736",
    ],
    confidence: "medium",
    rationale: "本题来自 SciAgentArena 论文：约 200 个科学任务使用 stepwise verification 和 interactive environment，适合补齐 deep research / science agent 的评测口径追问。",
  },
  {
    slug: "assistant-function-choice-vs-openapi-path-canonicalization",
    category: "engineering",
    question:
      "为什么给 Assistant agent 增加 `function_choice_behavior` 这类更强的函数选择能力时，必须同时审查 OpenAPI plugin 的路径归一化与 encoded dot-segment 绕过？如果只增强调度能力、不收紧 plugin 路径边界，会把什么 SSRF / 越权调用风险放大？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Semantic Kernel Python 1.43.1 release notes",
    ],
    sourceUrls: [
      "https://github.com/microsoft/semantic-kernel/releases/tag/python-1.43.1",
    ],
    confidence: "high",
    rationale: "本题来自 Semantic Kernel 1.43.1：把 assistant agent 的函数选择能力增强与 OpenAPI plugin 路径规范化修复放在同一次 release，适合追问“能力增强”和“边界收紧”为何必须并行推进。",
  },
  {
    slug: "scientific-review-agent-needs-inference-scaling-and-human-final-say",
    category: "engineering",
    question:
      "为什么 scientific review agent 不能只做一次性摘要或 zero-shot 打分？`inference scaling`、理论/实验核查和“人类保留最终裁决”分别在兜什么误判与责任边界？",
    relatedChapters: ["10", "15", "19", "capstone"],
    sourceTitles: [
      "Towards Automating Scientific Review with Google's Paper Assistant Tool",
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.28277",
    ],
    confidence: "medium",
    rationale: "本题来自 Google PAT 论文：review agent 的核心不是生成评论，而是把验证链拉长、把错误暴露出来，并维持 human-in-the-loop 的最终控制。",
  },
  {
    slug: "repository-level-friction-vs-single-agent-win-rate",
    category: "engineering",
    question:
      "为什么 coding agent 评测不能只看 isolated task success 或单个 PR 是否过测？`repository-level integration friction` 在衡量什么，为什么它比单 agent 胜率更接近真实生产风险？",
    relatedChapters: ["12", "15", "16", "18", "19"],
    sourceTitles: [
      "Govern the Repository, Not the Agent: Measuring Ecosystem-Level Risk in AI-Native Software",
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.28235",
    ],
    confidence: "medium",
    rationale: "本题来自仓库级风险论文：agent 各自过关不代表共享仓库健康，适合补齐 coding agent 在并发集成、仓库摩擦和生态治理上的高频追问。",
  },
  {
    slug: "debuggable-harness-boundary-in-background-agent-runtime",
    category: "engineering",
    question:
      "为什么 background agent runtime 不能吞掉 skill / resource 错误，而要把 provider 解析、available resources / scripts 和失败原因显式暴露给 harness？这对 agent 自纠错、回放和生产可调试性分别意味着什么？",
    relatedChapters: ["05", "11", "16", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework Python 1.10.0 release notes",
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/python-1.10.0",
    ],
    confidence: "high",
    rationale: "本题来自 Microsoft Agent Framework Python 1.10.0：release 直接补了 background agent loop provider 解析、available_resources/scripts 暴露与 skill/resource error 透传，适合追问 runtime 为什么必须让模型和 harness 看见真实失败边界。",
  },
  {
    slug: "terminal-use-agent-benchmark-needs-real-work-breadth",
    category: "engineering",
    question:
      "为什么 terminal-use agent 的 benchmark 不能只测 coding 或单条 shell task？像 TUA-Bench 这类覆盖文档编辑、邮件、在线研究、内容创作与系统运维的任务集，在检验什么更接近真实工作的长期能力？",
    relatedChapters: ["10", "15", "18", "19"],
    sourceTitles: [
      "TUA-Bench: A Benchmark for General-Purpose Terminal-Use Agents",
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2506.17537",
    ],
    confidence: "medium",
    rationale: "本题来自 TUA-Bench：把 terminal-use agent 从单一 coding 场景扩展到 200+ 个跨知识工作任务，适合补齐“真实工作广度”和“长流程工具链编排”两个评测维度。",
  },
  {
    slug: "multi-layer-agent-red-teaming-vs-single-jailbreak-metric",
    category: "engineering",
    question:
      "为什么 agent 安全红队不能只看单一 jailbreak 成功率？基础设施层、协议层、agent 层和模型层分别会暴露什么不同攻击面，为什么必须做 multi-layer red teaming？",
    relatedChapters: ["11", "15", "17", "18", "19"],
    sourceTitles: [
      "Securing the AI Agent: A Unified Framework for Multi-Layer Agent Red Teaming",
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2506.19396",
    ],
    confidence: "medium",
    rationale: "本题来自 AI-Infra-Guard 论文：把 agent 红队拆成 infra / protocol / agent / model 四层，适合补齐生产 agent 为什么不能只做 prompt jailbreak 测试的安全追问。",
  },
  {
    slug: "checkpoint-delta-state-roundtrip-vs-production-replay",
    category: "engineering",
    question:
      "为什么 graph agent 的 checkpoint / delta state 不能把『序列化细节』当成无关实现？一旦 `Overwrite` 或 superstep 补丁在 JSON roundtrip 后语义漂移，会怎样破坏回放、恢复和线上排障？",
    relatedChapters: ["11", "16", "18", "19"],
    sourceTitles: ["LangGraph 1.2.7 release notes"],
    sourceUrls: ["https://github.com/langchain-ai/langgraph/releases/tag/1.2.7"],
    confidence: "high",
    rationale: "本题来自 LangGraph 1.2.7：release 直接修了 DeltaChannel overwrite、Overwrite JSON roundtrip 和 exit-mode task_id 边界，适合追问 state graph 为何会在持久化层翻车。",
  },
  {
    slug: "a2a-gateway-vs-point-to-point-agent-mesh",
    category: "engineering",
    question:
      "为什么企业里的 agent-to-agent 通信不能靠点对点 URL + 各自凭证凑合？A2A protocol 只解决了哪一层，为什么 discoverability、scope 授权、统一路由、rate limit 和单域流式代理还需要单独的 gateway 层？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Building a serverless A2A gateway for agent discovery, routing, and access control",
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/building-a-serverless-a2a-gateway-for-agent-discovery-routing-and-access-control/",
    ],
    confidence: "high",
    rationale: "本题来自 AWS A2A gateway 实践：文章明确把 management / control / execution 三层拆开，适合补齐协议标准化与企业治理层的边界追问。",
  },
  {
    slug: "metadata-prefiltering-vs-pure-semantic-memory-retrieval",
    category: "engineering",
    question:
      "为什么长期记忆 / agentic RAG 不能只靠 namespace + 语义相似度？metadata pre-filter、STRICTLY_CONSISTENT 键和值域约束分别在兜什么检索边界，为什么它们要发生在向量搜索之前？",
    relatedChapters: ["07", "08", "09", "11", "19"],
    sourceTitles: ["Structured memory filtering with metadata in AgentCore Memory"],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/structured-memory-filtering-with-metadata-in-agentcore-memory/",
    ],
    confidence: "high",
    rationale: "本题来自 AgentCore Memory 元数据过滤实践：重点不是记忆更多，而是先按业务/权限/时间边界裁候选集，再做相似度召回。",
  },
  {
    slug: "open-world-tool-use-fragility-vs-static-benchmark-score",
    category: "engineering",
    question:
      "为什么 tool-use agent 在静态 benchmark 上高分，到了真实环境仍会明显掉点？query、action、observation、domain 四类 open-world shift 分别在暴露什么泛化缺口，为什么仅靠静态训练不够？",
    relatedChapters: ["05", "10", "15", "18", "19"],
    sourceTitles: [
      "Can Agents Generalize to the Open World? Unveiling the Fragility of Static Training in Tool Use",
    ],
    sourceUrls: ["https://arxiv.org/abs/2607.01084"],
    confidence: "medium",
    rationale: "本题来自 OpenAgent 论文：把 open-world tool-use shift 拆成四层后，能直接追问为什么离线高分和线上可靠性不是一回事。",
  },
  {
    slug: "copilot-agent-session-streaming-audit-vs-chat-logs",
    category: "engineering",
    question:
      "为什么企业级 coding agent 不能只保留普通聊天日志，而要把 prompts、responses、tool calls 作为 agent session usage records 流式送到 SIEM / audit log？这和可观测性、合规审计、事故回放分别有什么关系？",
    relatedChapters: ["11", "16", "17", "18", "19"],
    sourceTitles: ["Copilot agent session streaming is now in public preview"],
    sourceUrls: [
      "https://github.blog/changelog/2026-07-02-copilot-agent-session-streaming-is-now-in-public-preview/",
    ],
    confidence: "high",
    rationale: "本题来自 GitHub Copilot agent session streaming：官方把 prompts / responses / tool calls 做成企业 usage records，适合追问 coding agent 的审计边界。",
  },
  {
    slug: "flow-agent-runtime-prerelease-signal-vs-stable-baseline",
    category: "engineering",
    question:
      "看到 CrewAI 这类 runtime 的 prerelease 同时改 Bedrock 适配、flow agent options、streaming docs 和 self-listening flow 校验时，应该如何判断哪些是生产升级信号，哪些只能作为观望项？",
    relatedChapters: ["11", "12", "14", "18", "19"],
    sourceTitles: ["CrewAI 1.15.2a2 release notes"],
    sourceUrls: ["https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a2"],
    confidence: "medium",
    rationale: "本题来自 CrewAI 官方 prerelease，考点是 runtime release notes 的工程解读：云模型适配、flow 校验和 streaming 不是同一类风险。",
  },
  {
    slug: "single-api-multi-agent-system-vs-app-level-orchestration",
    category: "engineering",
    question:
      "Sakana Fugu 这类把 multi-agent system 包装成单个 LLM/API 的做法，和应用层自己用 LangGraph / CrewAI 编排多个 agent 有什么边界差异？可观测性、成本控制、debug 和 vendor lock-in 分别会怎么变？",
    relatedChapters: ["04", "11", "12", "16", "18", "19"],
    sourceTitles: ["Sakana Fugu"],
    sourceUrls: ["https://github.com/SakanaAI/fugu"],
    confidence: "medium",
    rationale: "本题来自 Sakana Fugu：多 agent 能力被产品化为单模型接口后，使用门槛降低，但内部编排透明度和治理边界会变化。",
  },
  {
    slug: "eddops-registry-promotion-retirement-vs-one-time-eval",
    category: "engineering",
    question:
      "为什么 agent 评估不能停在上线前一次 benchmark？EDDOps 里的 registry、promotion、retirement 和 trace-native observability 分别在治理 agent 生命周期的哪一段风险？",
    relatedChapters: ["15", "16", "18", "19"],
    sourceTitles: [
      "Registry-Governed Agent Lifecycle: Completing EDDOps with Evaluation-Driven Registration, Promotion, and Retirement on AWS AgentCore",
    ],
    sourceUrls: ["https://arxiv.org/abs/2607.00345"],
    confidence: "medium",
    rationale: "本题来自 EDDOps / AgentCore 论文，适合把 agent eval 从一次性分数扩展到注册、晋升、观测和退休的全生命周期治理。",
  },
  // C. 项目深挖类
  {
    slug: "project-why-multi-agent",
    category: "project",
    question:
      "你这个 Deep Research Agent，为什么用多智能体而不是单 agent？不用会怎样？多智能体的代价你怎么权衡的？",
    relatedChapters: ["11", "capstone"],
  },
  {
    slug: "project-rag-chunk-overlap-topk",
    category: "project",
    question:
      "你的 RAG 分块大小和 overlap 是多少、怎么定的？改大改小分别会怎样？top-k 取几、为什么？",
    relatedChapters: ["08", "09"],
  },
  {
    slug: "project-eval-set-and-judge",
    category: "project",
    question:
      "你说准确率 90%，这个 eval 集怎么搭的、多少条、用什么判分？LLM-as-judge 的判分你信吗？",
    relatedChapters: ["15"],
  },
  {
    slug: "project-perf-cost-bottleneck",
    category: "project",
    question: "这个项目最大的性能/成本瓶颈在哪？你做了哪些优化、效果如何？",
    relatedChapters: ["16"],
  },
  {
    slug: "project-handwrite-vs-langgraph",
    category: "project",
    question: "你为什么自己手写 agent loop 而不直接用 LangGraph？什么时候你会选择上框架？",
    relatedChapters: ["12"],
  },
  {
    slug: "project-scale-100-users",
    category: "project",
    question: "如果让它支持并发处理 100 个用户，你的设计哪里会先扛不住？怎么改？",
    relatedChapters: ["18"],
  },
  {
    slug: "project-runaway-tools-observability",
    category: "project",
    question:
      "线上如果模型开始胡乱调工具 / 陷入死循环，你怎么发现、怎么兜底？（考可观测 + 停止条件）",
    relatedChapters: ["16", "04"],
  },
  {
    slug: "project-biggest-pitfall",
    category: "project",
    question: "这个项目你踩过最大的坑是什么？怎么定位、怎么解决的？",
    relatedChapters: ["capstone"],
  },
];

const LOCAL_ANSWER_SUMMARIES: Partial<Record<string, string>> = {
  "llm-vs-agent-and-loop": "LLM 只负责基于上下文生成下一段文本；Agent 是在 LLM 外面再包一层『目标、状态、工具、停止条件』的执行系统。典型循环是：读取目标 -> 思考下一步 -> 调工具/执行动作 -> 观察结果 -> 再规划，直到完成或触发 maxSteps。",
  "token-and-statelessness-memory": "Token 是模型实际计费和处理的最小文本单元。LLM 本身每次调用都不记得上次发生了什么，所谓多轮记忆其实是应用层把历史消息、摘要或检索结果重新塞回上下文；窗口满了就靠裁剪、摘要或外部记忆解决。",
  "system-vs-user-prompt-cot-temperature": "System 提示定义长期角色、规则和边界，user 提示描述当前任务。CoT 能提升正确率，因为它强迫模型把隐含推理拆成中间步骤；temperature=0 适合抽取、分类、结构化输出这类要稳定复现的任务。",
  "react-and-maxsteps": "ReAct 的核心是让模型在『思考 -> 行动 -> 观察』之间循环，用外部工具补足知识和执行能力。maxSteps 必须存在，因为模型可能反复试错、绕圈或被脏上下文带偏，没有步数上限就会烧时间、烧钱甚至触发危险副作用。",
  "function-calling-roundtrip": "完整往返是：模型先返回要调用的工具名和参数，宿主程序校验并真正执行工具，再把 tool_result 连同 toolCallId 回传给模型，最后模型基于结果继续回答。模型不会自己执行工具，toolCallId 的作用是把某次调用请求和对应结果精确配对。",
  "rag-basics-overlap-topk-traceable": "RAG 本质上是先检索相关知识片段，再让模型在这些片段约束下生成答案，所以比裸答更不容易幻觉。Overlap 用来避免关键信息被分块边界切断；top-k 取值是在召回率和噪声之间折中，通常从 3 到 8 起步调；可溯源的关键是回答时明确引用片段编号或来源链接。",
  "why-llm-hallucinate": "幻觉不是普通代码 bug，而是概率生成模型在上下文不足、训练分布外或指令模糊时的固有风险。工程上不能承诺彻底消除，只能通过检索约束、结构化校验、工具调用、人审和拒答策略把它压到可接受范围。",
  "embedding-cosine-vs-euclidean": "Embedding 是把文本映射到向量空间，让语义相近的内容在几何上更接近。相似度搜索更常用余弦，是因为我们更关心方向上的语义接近，而不是向量绝对长度；语义检索适合同义改写和开放问答，关键词检索更适合精确术语、编号、过滤条件。",
  "react-vs-plan-execute-reflection": "ReAct 是边做边想，适合环境不确定、每一步都要看反馈再决定下一步的任务；Plan-and-Execute 会先产出一个较完整计划，再按计划分步执行，适合目标清晰且拆解成本低的任务。Reflection 的价值在于让模型先审查自己哪里可能错了再修正，但如果没有新证据输入，它提升的是一致性和表达质量，不会无限提高真实性。",
  "stable-json-output-retry-repair": "想要稳定 JSON，先给清晰 schema，再让模型只输出结构化结果，最后在宿主程序里做强校验。校验失败时不要直接崩，应该把错误信息回喂模型做 retry-repair；工具调用最适合『模型决定调用什么能力』，JSON mode 适合受控结构化输出，纯提示约束最脆弱。",
  "prevent-prompt-injection-guardrails": "Prompt injection 的本质是外部输入试图覆盖系统规则或诱导模型泄露/越权，所以不能只靠 system 里一句『别上当』。真正的护栏要落在执行边界：高权限工具最小权限、参数白名单、人工确认、结果校验、敏感操作二次授权。",
  "control-cost-token-accounting": "成本主要花在输入 token、输出 token 和多步循环的重复调用上。控制办法是：压上下文、减少无效历史、用更小模型做简单步骤、把重计算移到工具层，并把每一步 token 和记账都打到 trace 里；上下文太长就优先裁剪、摘要和检索，而不是无脑把所有历史塞进去。",
  "evaluate-agent-llm-app": "LLM 应用不能只靠传统单测，因为输出不是完全确定的，真正风险在『大致对但关键处错』。评估要有代表性样本集、明确评分标准、回归基线和失败分桶；LLM-as-judge 可以提高覆盖率，但必须配人工抽查、双模型交叉和严格 rubric，避免模型互相糊弄。",
  "context-window-full-strategies": "窗口满了时最常见的三招是裁剪、滑动窗口和摘要压缩。滑动窗口保留最近交互，适合短期上下文强依赖；摘要压缩能保住长期信息，但会丢细节且可能引入摘要误差，所以常见做法是最近消息原文保留、远历史摘要化、再配外部检索补细节。",
  "streaming-throughput-vs-ux-abortcontroller": "流式输出并不会让模型真正更快算完，只是把已经生成的 token 提前推给前端，所以改善的是首字时间和用户体感。AbortController 更像协作式取消：宿主发出取消信号，后续请求/流读取停止，但已经发出的外部副作用必须靠业务层自己兜底。",
  "tool-error-feedback-not-throw": "工具报错直接抛异常只会中断当前链路，模型拿不到失败原因，也就没法自我修正。把错误变成可读字符串回传给模型，模型才能补参数、换工具或降级回答，这比宿主一崩到底更接近真实 agent 的闭环。",
  "when-multi-agent-and-cost": "多 agent 适合任务天然可拆成不同角色、不同上下文窗口和不同工具权限的场景，比如研究、写作、审核分工。代价是调用次数更多、调试更难、状态传递更复杂，所以只有当分工真的能减少单 agent 的上下文污染或决策负担时才值得上。",
  "when-not-to-use-agent": "流程固定、规则明确、没有开放式决策空间的任务通常不该上 Agent，普通 workflow、脚本或表单校验更便宜、更稳定。只要答案可以被确定性逻辑直接推出，Agent 往往是在增加成本和不确定性。",
  "project-why-multi-agent": "Deep Research Agent 用多智能体，是因为『检索/证据收集』和『综合写作』对上下文、工具和评价标准不同，拆开后每个角色更专注。单 agent 也能做，但容易把搜索噪声、写作风格和规划状态搅在一起；代价则是链路更长、调试更复杂，所以只在长任务上启用。",
  "project-rag-chunk-overlap-topk": "分块大小通常围绕『一个片段能独立表达一个小主题』来定，overlap 用来保证跨段概念不断裂；块太大噪声多，块太小上下文不完整。top-k 一般从 3 到 5 起步，命不中再扩召回，但不会无限加，因为加太多会把模型注意力稀释掉。",
  "project-eval-set-and-judge": "所谓 90% 不是拍脑袋，要先准备一组覆盖真实问题分布的 eval 集，再定义『事实正确、引用充分、结构完整』这类评分维度。LLM-as-judge 可以做初筛，但我会保留人工抽样复核，并记录模型间分歧，避免把模型偏见当成客观真相。",
  "project-perf-cost-bottleneck": "这类项目最大的成本瓶颈通常不是单次生成，而是多步检索、反复工具调用和冗长上下文带来的累计 token 消耗。优化手段包括裁剪历史、缓存检索结果、把简单步骤下放给小模型，以及对低价值步骤设置更硬的停止条件。",
  "project-handwrite-vs-langgraph": "先手写 agent loop 是为了把消息往返、工具执行、停止条件和错误回灌这些底层机制吃透。等到任务开始需要 checkpoint、复杂状态图、并发分支或人工审批节点时，再上 LangGraph 这类框架，收益才会超过它引入的抽象成本。",
  "project-scale-100-users": "并发到 100 用户时，先扛不住的通常是共享状态、限流和外部依赖，不是页面本身。要改成无状态服务、把会话和任务状态外置、加队列和并发上限、做 token/速率预算隔离，否则一个长任务就可能拖垮整批请求。",
  "project-runaway-tools-observability": "防模型胡乱调工具，第一层是 maxSteps、超时和工具级频率限制，第二层是 trace、日志和告警，把『谁在什么时候调了什么工具』记录清楚。真失控时要能人工熔断会话、降级成只读模式，或者直接切到人工审核。",
  "project-biggest-pitfall": "这种项目最常见的大坑不是功能写不出来，而是边界没先定清：哪些结果必须可追溯、哪些动作必须人工确认、哪些失败可以自动重试。我的处理原则是先把状态、权限和评估口径钉死，再继续堆能力，否则越往后越难补救。",
  "computer-use-agent-success-vs-harm-metrics": "评测 computer-use / workplace agent 不能只看任务成功率，因为 agent 可能在成功完成主任务的同时多做了不该做的动作。unintended action 兜的是『做对主线但顺手乱点、乱改、乱发』的流程偏航风险；harmful action 兜的是数据破坏、误操作、隐私泄露和安全事故这类高代价副作用。",
  "memory-agent-recall-vs-reuse-evaluation": "长期记忆 agent 不能只测 recall，因为『记住了』不等于『会在正确时机把对的记忆拿出来并用对』。observation stream 测原始事件摄入，user feedback 测偏好/纠错更新，knowledge archive 测稳定知识沉淀，follow-up reuse 测后续任务中的真实调用效果；四段混在一起，你就分不清问题出在记忆写入、更新、检索还是使用。",
  "harness-vs-framework-boundary": "Agent framework / SDK 主要提供模型调用、状态图、工具协议和工作流原语；harness 则是把审批、重试、回放、配额、追踪、权限壳层和失败恢复包在外面的运行时外壳。把这些控制面放在 harness 而不是模型里，才能做到可审计、可复现、可回滚，也避免一次 prompt 偏航直接越过系统护栏。",
  "runtime-upgrade-auth-compaction-boundaries": "Runtime / tool 协议升级时要单独审查 auth-required vs input-required，因为它决定『谁来批准、批准什么』；审查 history compaction，是因为压缩可能把关键审批证据、tool result 或安全上下文删掉；审查 auto-approval 和 tracing 注入，是因为它们分别改变默认信任边界和数据暴露边界。生产事故往往不是模型能力问题，而是这些运行时默认值悄悄变了。",
  "scientific-synthesis-clean-room-generalization": "研究型 agent benchmark 强调 clean-room synthesis，是要求 agent 基于证据自己综合结论，而不是把原文句子拼接得像答案；强调 strategic generalization，是看它能否在新组合、新约束和跨文献冲突里给出稳定推理。若 agent 只是检索命中后复读原句，高分证明的只是语料重合和抽取能力，不是科学综合能力。",
  "long-horizon-agent-benchmark-vs-single-step-score": "长周期 agent 评测不能只看单步 reward 或单回合成功率，因为真正难点在跨轮状态保持、延迟反馈下的策略修正和长期收益稳定性。RetailBench 这类 benchmark 检验的是 agent 能否在连续经营/运营情境里维持目标一致、处理中间波动、根据后验结果调策略，而不是某一步答对一个局部动作。",
  "monitoring-agent-timeliness-false-alert-action-chain": "监控/告警 agent 只会识别异常还不够，还要看识别得是否及时、误报/漏报成本是否可接受，以及后续处置链有没有把问题真的推进到解决。只测『能否识别异常』会遗漏两个关键风险：一是发现太慢等于没发现，二是发现之后不会升级、不会止损、不会闭环，系统仍然失控。",
  "memory-agent-relational-consistency-vs-keyword-recall": "关键词召回只能证明 agent 把某些词记住了，不能证明它记住了事实之间的关系。补充关系、矛盾关系和无关关系必须分开测，因为真实记忆系统常见失败不是『完全忘了』，而是把相互冲突的信息一起当真，或把无关细节当成支持证据，最终破坏回答一致性。",
  "pre-approval-tool-input-guardrails-vs-post-hoc-check": "Tool guardrails 放在真正执行前的 pre-approval 边界，本质是在副作用发生前阻断危险参数和越权动作。等工具跑完再做事后检查，很多损失已经不可逆了，例如邮件已发出、数据库已删除、权限已变更；高权限工具必须把参数校验、白名单、人工确认和策略判定前置。",
  "brokered-execution-vs-agent-held-production-authority": "生产变更权限不该直接塞进 agent 推理进程，因为模型一旦被注入、误触发或日志泄露，就等于把生产权限直接暴露给不稳定的推理层。Certificate-bound broker / scoped execution identity 的作用，是把『提出方案』和『真正执行』拆开，用独立身份、短时令牌和集中审计来兜住越权、横向移动和凭证滥用风险。",
  "probabilistic-policy-verification-under-ambiguous-detectors": "当 PII detector / declassifier 本身有误报漏报时，deterministic policy 只会假装这些判定是绝对真理，结果要么过度阻断，要么放过高风险动作。Probabilistic verification 的意义，是把检测器不确定性显式纳入决策，问的是『在当前误差分布下，这个 agent 行为的总体泄露/违规概率是否仍低于可接受阈值』。",
  "repository-guidance-coverage-vs-precision-for-coding-agents": "高质量仓库指引首先提升的是 coverage，也就是 agent 更快找到应该看的目录、命令、约束和边界，少在错误区域乱试。Patch precision 仍取决于模型推理、测试反馈和实现能力；但当步数预算变大时，谁能更稳定定位到正确文件，往往比单次补丁写得漂不漂亮更决定最终成功率。",
  "multi-tenant-agent-runtime-isolation-vs-dedicated-stack": "多租户 agent runtime 不能只靠逻辑 tenant id，因为真正要隔离的是会话状态与记忆、执行身份与凭证、遥测与日志、审批流与配额。只做逻辑分租容易出现跨租户上下文串味、trace 泄露和审批串单；一旦遇到高权限业务、强监管数据或 noisy neighbor 明显场景，就该回到 dedicated stack。",
  "scientific-copilot-query-parse-retrieval-summary-boundary": "研究型 copilot 把 structured query parsing、embedding retrieval 和 AI summary 拆开，是为了把『用户到底问什么』『系统到底拿到了哪些证据』『模型到底怎样组织答案』三类错误分层定位。若让一个大 prompt 端到端包办，你很难判断错在 query 解析、检索召回还是总结幻觉，也很难保留可追溯引用链。",
  "agent-identity-infrastructure-vs-provider-account-mapping": "跨组织 agent 协作不能长期靠『每个 agent 一把 API key』，因为 API key 只表示某个平台上的访问凭证，不解决身份发现、撤销、轮换、跨平台互认和组织级信任。独立的 agent identity / name service 提供的是稳定身份、可验证归属和统一吊销能力，让 agent 之间建立信任时不必把平台账号耦死在一起。",
  "approval-state-idempotency-and-guardrail-race-cancellation": "已解决的 approval 不应被重复求值，因为这会导致同一动作反复弹审批、重复执行甚至让用户误以为系统状态还没落地。Sibling guardrail / task 一旦失败就应立刻取消其它并发 guardrail，是为了阻断竞态窗口，避免某个分支在整体已经判定失败后仍继续写外部系统、留下双重副作用或脏状态。",
  "read-only-file-access-still-needs-explicit-approval": "Read-only 不等于低风险，因为读取本身就可能暴露密钥、客户数据、内部架构和后续可利用线索。尤其当 loop 能力被集成进 harness agent 后，模型可以把多次无害读取串成一次敏感推断或数据外传链路，所以 file-access 即便不写盘，也常常要做显式审批、目录范围限制和目的约束。",
  "declarative-workflow-path-validation-vs-runtime-filesystem-boundary": "声明式 workflow / skill archive 若不防 symlink path traversal 和非法 flow definition paths，攻击者就能把『加载工作流定义』变成『读取或执行本不该碰的文件』。这不是 prompt 层小 bug，而是 runtime 对文件系统边界失守：agent 会在看似合法的配置装载流程里越过目录沙箱。",
  "conversational-flow-telemetry-and-unified-loader-boundary": "Workflow 一旦进入 conversational / declarative flow 阶段，就必须单独追踪 turn usage，因为计费、性能瓶颈和状态膨胀都发生在每一轮交互里。CLI、TUI、loader 入口若不统一，同一条 flow 会在不同入口表现出不同 trace、不同上下文拼装和不同计费口径，最终让调试、回放和审计都失真。",
  "agentic-overlay-vs-rebuild-for-legacy-enterprise-services": "企业做 agent 改造时优先 agentic overlay，而不是推倒重写，是因为旧系统里最难替代的是沉淀多年的权限、事务、流程和集成契约。Overlay 做法是把 agent 放在现有系统外面做编排与辅助决策，既能复用成熟控制面，又能降低一次性替换带来的发布、回归和组织协调风险。",
  "governed-data-mesh-for-agentic-ai-vs-direct-source-access": "生产级 agentic AI 需要 governed data mesh，因为让 agent 直接拉数据库/对象存储等于给了一个会推理的程序过宽的数据面。Identity 解决『以谁身份访问』，catalog 解决『知道有哪些可用数据』，policy 解决『哪些上下文下能怎么用』，knowledge base 解决『把原始数据整理成适合检索和引用的知识层』。",
  "approval-by-default-for-agent-skills-and-tools": "Production agent 的 skill/provider tools 最好默认 require approval，因为默认放行意味着新工具上线的第一天就天然处于过度信任状态。默认值一旦反了，后续再补规则也只能被动堵洞：审计不完整、回放无法复现实验边界、权限壳层也会出现『漏配即放行』的系统性漏洞。",
  "redirect-based-ssrf-in-agent-fetch-and-scraping-tools": "抓取 / scraping tool 只校验首跳 URL 不够，因为重定向链完全可能把请求带到 169.254 metadata、内网控制台、私有 API 或带签名的内部端点。SSRF bypass 一旦成功，agent 不只是『看错网页』，而是会拿到本不该见到的凭证、网络拓扑和内部响应，再把这些信息带回推理链。",
  "stepwise-verification-and-interactive-benchmarks-for-research-agents": "研究型 agent benchmark 不能只看最终答案，因为 final-answer-only 会把幸运猜中、证据伪造和中间推理断裂都藏起来。Stepwise verification 检查的是每一步检索、归纳和推断是否站得住；interactive environment 检查的是 agent 遇到新反馈时会不会重规划、修正和管理证据链。",
  "assistant-function-choice-vs-openapi-path-canonicalization": "增强 Assistant agent 的 function_choice_behavior 会显著扩大工具调用频率和覆盖面，因此必须同时收紧 OpenAPI plugin 的路径归一化。若 encoded dot-segment 绕过仍存在，模型越会主动选函数，就越可能把本来局部的路径逃逸问题放大成 SSRF、越权调用和错误后端访问。",
  "scientific-review-agent-needs-inference-scaling-and-human-final-say": "Scientific review agent 不能只做一次性摘要或 zero-shot 打分，因为论文评审真正难的是核查理论链、实验设计、统计结论和相关工作位置。Inference scaling 让 agent 在高风险样本上花更多计算做交叉核查；而『人类保留最终裁决』是在责任边界上兜底，避免把接受/拒绝决定完全外包给不稳定模型。",
  "repository-level-friction-vs-single-agent-win-rate": "Coding agent 评测不能只看 isolated task success 或单个 PR 过不过测，因为真实仓库风险来自多个变更在共享依赖、测试环境、规范和发布节奏上的相互摩擦。Repository-level integration friction 衡量的是这些系统性阻力：单个 agent 各自都像赢了，但仓库整体可能更难合并、更难回滚、更容易积累隐性破坏。",
  "debuggable-harness-boundary-in-background-agent-runtime": "Background agent runtime 若吞掉 skill 或 resource 错误，模型和运维都只会看到『没成功』，却不知道失败发生在哪一层。把 provider 解析、available resources/scripts 和真实错误原因显式暴露出来，才能让模型自纠错、让 harness 做回放诊断，也才能在生产里区分是权限缺失、资源缺失还是 runtime 自己的调度问题。",
  "terminal-use-agent-benchmark-needs-real-work-breadth": "Terminal-use agent 若只在 coding benchmark 上高分，不代表它能处理真实工作的跨工具、跨格式和长流程任务。TUA-Bench 这类任务集覆盖写作、邮件、研究、运维和文档编辑，检验的是 agent 能否在统一终端环境里持续规划、切换工具、保持状态并交付可用产物，而不是只会修一段代码。",
  "multi-layer-agent-red-teaming-vs-single-jailbreak-metric": "只看 jailbreak 成功率会把 agent 风险错误压缩成单一提示攻击问题，但真实系统里还有基础设施、协议和工具编排层面的巨大攻击面。多层红队的价值是把风险拆开看：基础设施层管环境与凭证，协议层管调用与身份，agent 层管计划和工具使用，模型层才是提示与生成本身；四层混在一起就很难定位真实防线缺口。",
  "checkpoint-delta-state-roundtrip-vs-production-replay": "Checkpoint / delta state 若在 JSON roundtrip 里丢了 `Overwrite` 或 superstep 语义，线上最糟糕的后果不是『某个字段不漂亮』，而是恢复后的状态和真实执行历史分叉。回放无法复现、诊断看见的是假历史、重试可能覆盖错任务，这就是为什么状态补丁协议本身必须被当成生产边界来审查。",
  "a2a-gateway-vs-point-to-point-agent-mesh": "A2A protocol 只规范了 agent 彼此如何通信，不负责企业里『谁能发现谁、谁能访问谁、流量怎么走、速率怎么控、流式连接怎么统一代理』这些治理问题。Point-to-point 连接一多，凭证、路由和发现逻辑会在各后端分叉；gateway 的价值就是把 discoverability、authz 和 routing 抽到单一控制面。",
  "metadata-prefiltering-vs-pure-semantic-memory-retrieval": "长期记忆不能只靠 namespace + 向量相似度，因为语义接近不等于业务边界正确。Metadata pre-filter 先按时间、权限、部门、优先级等维度缩小候选集，STRICTLY_CONSISTENT 保证某些键值在抽取和合并过程中不漂移；两者合起来，才不会把不该混在一起的记忆先召回再交给模型误用。",
  "open-world-tool-use-fragility-vs-static-benchmark-score": "静态 benchmark 往往默认工具集合、用户请求和观察反馈都稳定，所以高分只能证明 agent 学会了一个封闭环境。真实部署里 query、action、observation、domain 都会漂移；一旦 agent 只适应训练分布，就会在新工具、新异常反馈和新任务组合前迅速掉点，这就是 open-world tool-use 的核心脆弱性。",
  "copilot-agent-session-streaming-audit-vs-chat-logs": "企业级 coding agent 的关键证据不只是最终回复，而是 prompt、response、tool call、客户端来源和执行时间线。把 session usage records 流式送到 SIEM / audit log，可以把异常工具调用、越权访问、成本峰值和事故复盘串成可检索证据链；普通聊天日志通常缺少工具调用粒度，无法支撑合规审计和精确回放。",
  "flow-agent-runtime-prerelease-signal-vs-stable-baseline": "Release notes 里的生产信号要分层看：Bedrock extra 说明云模型适配面扩大，flow options 说明编排配置面扩大，streaming docs 说明交互体验进入主路径，self-listening flow reject 则是结构校验补洞。但 prerelease 仍不能当稳定基线，应该先用于兼容性验证和趋势跟踪，而不是直接替换生产 runtime。",
  "single-api-multi-agent-system-vs-app-level-orchestration": "把 multi-agent system 包成单个 API 会降低接入成本：调用者像调一个模型一样获得内部协作能力。但代价是编排策略、子模型选择、失败重试和成本拆分更不透明；应用层自编排虽然更重，却能精确控制状态、审计、预算和工具权限。生产选择要看你更需要可控性还是托管抽象。",
  "eddops-registry-promotion-retirement-vs-one-time-eval": "一次性 eval 只能回答『这一版在这批题上是否过线』，不能管理上线后的漂移、成本变化和安全回归。EDDOps 把评估证据接进 registry、promotion 和 retirement：注册时说明准入条件，晋升时比较质量/成本/时延，运行时用 trace-native observability 捕捉退化，退休则让低质量或不再合规的 agent 有退出路径。"
};

function chapterAnswerLabel(chapter: string): string {
  if (chapter === "capstone") return "毕业项目（capstone）";
  return `第 ${chapter} 章`;
}

function buildAnswerSource(relatedChapters: readonly string[]): string {
  const targets = relatedChapters.map(chapterAnswerLabel).join("、");
  return `标准答案来源：${targets} README 的 “💡 面试会问”。`;
}

function questionTags(raw: RawInterviewQuestion): string[] {
  const text = raw.question.toLowerCase();
  const tags = new Set<string>([raw.category]);
  if (text.includes("rag") || text.includes("检索") || text.includes("分块") || text.includes("embedding")) {
    tags.add("rag");
  }
  if (text.includes("react") || text.includes("maxsteps") || text.includes("agent 循环") || text.includes("plan-and-execute")) {
    tags.add("agent-loop");
  }
  if (text.includes("评估") || text.includes("eval") || text.includes("judge") || text.includes("单测") || text.includes("测试")) {
    tags.add("eval");
  }
  if (text.includes("成本") || text.includes("token") || text.includes("cost")) tags.add("cost");
  if (text.includes("injection") || text.includes("护栏") || text.includes("权限")) tags.add("safety");
  if (text.includes("多 agent") || text.includes("多智能体") || text.includes("multi")) tags.add("multi-agent");
  if (text.includes("流式") || text.includes("streaming") || text.includes("abortcontroller")) tags.add("streaming");
  if (text.includes("json")) tags.add("structured-output");
  if (text.includes("langgraph") || text.includes("框架")) tags.add("framework");
  if (text.includes("幻觉")) tags.add("hallucination");
  if (text.includes("窗口") || text.includes("记忆") || text.includes("上下文")) tags.add("context");
  if (text.includes("computer-use") || text.includes("harmful action") || text.includes("权限")) tags.add("safety");
  if (text.includes("harness") || text.includes("回放") || text.includes("审批")) tags.add("observability");
  if (text.includes("auth-required") || text.includes("auto-approval") || text.includes("compaction")) tags.add("runtime");
  return [...tags];
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = RAW_QUESTIONS.map((raw, index) => ({
  id: `iq-${String(index + 1).padStart(2, "0")}`,
  slug: raw.slug,
  category: raw.category,
  categoryLabel: CATEGORY_LABELS[raw.category],
  question: raw.question,
  relatedChapters: raw.relatedChapters,
  answerSource: buildAnswerSource(raw.relatedChapters),
  collectedDate: COLLECTED_DATE,
  collectedAt: COLLECTED_AT,
  sortOrder: index + 1,
  tags: questionTags(raw),
  sourceTitles: raw.sourceTitles ?? [],
  sourceUrls: raw.sourceUrls ?? [],
  confidence: raw.confidence,
  rationale: raw.rationale,
  summaryExcerpt: LOCAL_ANSWER_SUMMARIES[raw.slug] ?? raw.rationale,
}));

// 身份完整性：slug 必须唯一（它是 Supabase upsert 的 on-conflict 目标）。
const slugs = new Set(INTERVIEW_QUESTIONS.map((q) => q.slug));
if (slugs.size !== INTERVIEW_QUESTIONS.length) {
  throw new Error("Duplicate interview question slug detected in interview-questions.ts");
}



