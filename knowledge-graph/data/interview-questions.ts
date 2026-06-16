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
}

const CATEGORY_LABELS: Record<InterviewQuestionCategory, string> = {
  principle: "原理类",
  engineering: "工程类",
  project: "项目深挖类",
};

const COLLECTED_DATE = "2026-06-16";
const COLLECTED_AT = `${COLLECTED_DATE}T09:00:00+08:00`;

interface RawInterviewQuestion {
  slug: string;
  category: InterviewQuestionCategory;
  question: string;
  relatedChapters: string[];
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
}));

// 身份完整性：slug 必须唯一（它是 Supabase upsert 的 on-conflict 目标）。
const slugs = new Set(INTERVIEW_QUESTIONS.map((q) => q.slug));
if (slugs.size !== INTERVIEW_QUESTIONS.length) {
  throw new Error("Duplicate interview question slug detected in interview-questions.ts");
}
