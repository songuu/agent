export interface SimilarInterviewQuestion {
  slug: string;
  category: string;
  categoryLabel: string;
  question: string;
  relatedChapters: string[];
  tags: string[];
  sortOrder: number;
  rationale?: string;
  summaryExcerpt?: string;
}

export interface SimilarityRankedQuestion {
  question: SimilarInterviewQuestion;
  score: number;
  reasons: string[];
}

interface SimilarityInput {
  slug: string;
  category: string;
  relatedChapters: string[];
  tags: string[];
  concepts: string[];
  intents: string[];
}

interface TopicRule {
  id: string;
  label: string;
  keywords: string[];
}

interface IntentRule {
  id: string;
  label: string;
  patterns: string[];
}

const TOPIC_RULES: TopicRule[] = [
  { id: "agent-loop", label: "Agent 循环", keywords: ["执行循环", "agent loop", "react", "plan-and-execute", "maxsteps", "reflection", "反思"] },
  { id: "memory-context", label: "记忆/上下文", keywords: ["记忆", "无状态", "上下文", "窗口", "长上下文", "compaction", "recall", "reuse"] },
  { id: "rag-retrieval", label: "RAG/检索", keywords: ["rag", "检索", "召回", "embedding", "分块", "overlap", "top-k", "topk"] },
  { id: "tool-runtime", label: "工具调用/运行时", keywords: ["function calling", "工具调用", "tool", "runtime", "harness", "sdk", "协议", "回放"] },
  { id: "prompt-injection", label: "Prompt Injection", keywords: ["prompt injection", "injection", "system 指令", "篡改 system"] },
  { id: "approval-boundary", label: "审批/权限边界", keywords: ["审批", "approval", "auth-required", "input-required", "require approval", "权限", "越权"] },
  { id: "attack-surface", label: "攻击面", keywords: ["ssrf", "harmful action", "敏感", "redirect bypass", "安全"] },
  { id: "eval-observability", label: "评估/观测", keywords: ["评估", "benchmark", "judge", "回归", "成功率", "指标", "trace", "tracing", "telemetry", "observability", "可观测"] },
  { id: "cost-efficiency", label: "成本/效率", keywords: ["成本", "token", "吞吐", "streaming", "压缩", "小模型", "并发"] },
  { id: "multi-agent", label: "多 Agent", keywords: ["多 agent", "多智能体", "workflow", "flow", "协作", "分工"] },
  { id: "framework-governance", label: "框架/治理", keywords: ["framework", "langgraph", "governance", "data mesh", "plugin", "identity", "治理"] },
];

const INTENT_RULES: IntentRule[] = [
  { id: "definition", label: "概念辨析", patterns: ["是什么", "区别", "本质", "为什么说"] },
  { id: "implementation", label: "实现方法", patterns: ["如何", "怎么", "实现", "完整往返", "怎么办", "策略"] },
  { id: "tradeoff", label: "取舍边界", patterns: ["取舍", "权衡", "代价", "边界", "为什么不能只", "收益"] },
  { id: "evaluation", label: "评测口径", patterns: ["评估", "benchmark", "指标", "成功率", "judge"] },
  { id: "safety", label: "风险控制", patterns: ["护栏", "权限", "审批", "越权", "风险", "安全"] },
];

const TOPIC_LABELS = new Map(TOPIC_RULES.map((rule) => [rule.id, rule.label]));
const INTENT_LABELS = new Map(INTENT_RULES.map((rule) => [rule.id, rule.label]));

export function rankSimilarInterviewQuestions(
  questions: SimilarInterviewQuestion[],
  currentQuestion: SimilarInterviewQuestion,
  limit = 3,
): SimilarityRankedQuestion[] {
  const input = buildSimilarityInput(currentQuestion);
  return questions
    .filter((question) => question.slug !== currentQuestion.slug)
    .map((question) => scoreInterviewSimilarity(question, input))
    .filter((entry) => entry.score > 0 && isEligibleSimilarQuestion(entry, input))
    .sort((left, right) => right.score - left.score || left.question.sortOrder - right.question.sortOrder)
    .slice(0, limit);
}

export function scoreInterviewSimilarity(
  question: SimilarInterviewQuestion,
  input: SimilarityInput,
): SimilarityRankedQuestion {
  const reasons: string[] = [];
  let score = 0;

  if (question.category === input.category) {
    score += 6;
    reasons.push("同题型");
  }

  const sharedConcepts = intersect(conceptsForQuestion(question), input.concepts);
  if (sharedConcepts.length > 0) {
    score += Math.min(sharedConcepts.length, 3) * 5;
    reasons.push(`同主题 ${sharedConcepts.slice(0, 2).map(topicLabel).join(" / ")}`);
  }

  const sharedChapters = intersect(question.relatedChapters, input.relatedChapters);
  if (sharedChapters.length > 0) {
    score += Math.min(sharedChapters.length, 2) * 4;
    reasons.push(`同章节 ${sharedChapters.slice(0, 2).join("/")}`);
  } else if (hasNearbyChapter(question.relatedChapters, input.relatedChapters)) {
    score += 2;
    reasons.push("章节相近");
  }

  const sharedTags = intersect(nonGenericTags(question.tags, question.category), nonGenericTags(input.tags, input.category));
  if (sharedTags.length > 0) {
    score += Math.min(sharedTags.length, 2) * 3;
    reasons.push(`同标签 ${sharedTags.slice(0, 2).join(" / ")}`);
  }

  const sharedIntents = intersect(intentsForQuestion(question), input.intents);
  if (sharedIntents.length > 0) {
    score += Math.min(sharedIntents.length, 2) * 2;
    reasons.push(`同问法 ${sharedIntents.slice(0, 1).map(intentLabel).join(" / ")}`);
  }

  if (sharedConcepts.length === 0 && sharedTags.length === 0 && sharedChapters.length === 0) {
    score = Math.max(0, score - 4);
  }

  return { question, score, reasons };
}

function buildSimilarityInput(question: SimilarInterviewQuestion): SimilarityInput {
  return {
    slug: question.slug,
    category: question.category,
    relatedChapters: question.relatedChapters,
    tags: question.tags,
    concepts: conceptsForQuestion(question),
    intents: intentsForQuestion(question),
  };
}

function isEligibleSimilarQuestion(entry: SimilarityRankedQuestion, input: SimilarityInput): boolean {
  const candidate = entry.question;
  const sharedConcepts = intersect(conceptsForQuestion(candidate), input.concepts);
  if (sharedConcepts.length > 0) return true;

  const sharedChapters = intersect(candidate.relatedChapters, input.relatedChapters);
  const sharedTags = intersect(nonGenericTags(candidate.tags, candidate.category), nonGenericTags(input.tags, input.category));
  const sharedIntents = intersect(intentsForQuestion(candidate), input.intents);

  return sharedChapters.length > 0 && sharedTags.length > 0 && sharedIntents.length > 0;
}

function conceptsForQuestion(question: SimilarInterviewQuestion): string[] {
  const text = fullText(question);
  return TOPIC_RULES.filter((rule) => rule.keywords.some((keyword) => text.includes(keyword))).map((rule) => rule.id);
}

function intentsForQuestion(question: SimilarInterviewQuestion): string[] {
  const text = fullText(question);
  return INTENT_RULES.filter((rule) => rule.patterns.some((pattern) => text.includes(pattern))).map((rule) => rule.id);
}

function fullText(question: SimilarInterviewQuestion): string {
  return [question.question, question.summaryExcerpt, question.rationale, ...question.tags].filter(Boolean).join(" ").toLowerCase();
}

function nonGenericTags(tags: string[], category: string): string[] {
  return tags.filter((tag) => tag && tag !== category);
}

function hasNearbyChapter(left: string[], right: string[]): boolean {
  for (const leftChapter of left) {
    for (const rightChapter of right) {
      const distance = chapterDistance(leftChapter, rightChapter);
      if (distance > 0 && distance <= 1) return true;
    }
  }
  return false;
}

function chapterDistance(left: string, right: string): number {
  const leftNumber = Number.parseInt(left, 10);
  const rightNumber = Number.parseInt(right, 10);
  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) return Number.POSITIVE_INFINITY;
  return Math.abs(leftNumber - rightNumber);
}

function intersect(left: string[], right: string[]): string[] {
  if (left.length === 0 || right.length === 0) return [];
  const rightSet = new Set(right);
  return left.filter((item, index) => rightSet.has(item) && left.indexOf(item) === index);
}

function topicLabel(id: string): string {
  return TOPIC_LABELS.get(id) ?? id;
}

function intentLabel(id: string): string {
  return INTENT_LABELS.get(id) ?? id;
}
