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
}

const CATEGORY_LABELS: Record<InterviewQuestionCategory, string> = {
  principle: "原理类",
  engineering: "工程类",
  project: "项目深挖类",
};

const COLLECTED_DATE = "2026-06-25";
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
}));

// 身份完整性：slug 必须唯一（它是 Supabase upsert 的 on-conflict 目标）。
const slugs = new Set(INTERVIEW_QUESTIONS.map((q) => q.slug));
if (slugs.size !== INTERVIEW_QUESTIONS.length) {
  throw new Error("Duplicate interview question slug detected in interview-questions.ts");
}
