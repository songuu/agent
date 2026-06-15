import { BM25Index } from "./bm25";

export interface AgenticRagDoc {
  id: string;
  text: string;
}

export type RetrievalGradeDecision = "answer" | "retry" | "refuse";

export interface RetrievalGrade {
  decision: RetrievalGradeDecision;
  matchedRelevantIds: string[];
  reason: string;
}

export interface AgenticRetrievalStep {
  attempt: number;
  query: string;
  retrievedIds: string[];
  grade: RetrievalGrade;
}

export interface AgenticRetrievalResult {
  steps: AgenticRetrievalStep[];
  finalDecision: RetrievalGradeDecision;
  finalQuery: string;
  finalRetrievedIds: string[];
}

export interface RunAgenticRetrievalOptions {
  initialQuery: string;
  expectedRelevantIds: readonly string[];
  retrieve: (query: string) => string[];
  rewrite: (query: string, attempt: number) => string;
  maxAttempts?: number;
}

export function gradeRetrieval(
  retrievedIds: readonly string[],
  expectedRelevantIds: readonly string[],
): RetrievalGrade {
  if (expectedRelevantIds.length === 0) {
    return { decision: "refuse", matchedRelevantIds: [], reason: "golden set 标注为无答案，应拒答。" };
  }

  const expected = new Set(expectedRelevantIds);
  const matchedRelevantIds = retrievedIds.filter((id) => expected.has(id));
  if (matchedRelevantIds.length > 0) {
    return { decision: "answer", matchedRelevantIds, reason: "检索结果包含标注相关证据，可以回答。" };
  }

  return {
    decision: retrievedIds.length === 0 ? "retry" : "retry",
    matchedRelevantIds,
    reason: retrievedIds.length === 0 ? "没有召回候选，需要改写后重试。" : "召回了候选但没有命中相关证据，需要改写后重试。",
  };
}

export function rewriteForAgenticRetrieval(query: string, attempt: number): string {
  const lower = query.toLowerCase();
  if (lower.includes("赔") || lower.includes("坏") || lower.includes("宕机")) {
    return "SLA 可用性 补偿 服务积分 事故 申诉";
  }
  if (lower.includes("登录") || lower.includes("公司账号")) {
    return "SAML 单点登录 SCIM 身份提供商 自动同步";
  }
  if (lower.includes("删") || lower.includes("存多久")) {
    return "数据 生命周期 冷归档 保留期 删除";
  }
  return `${query} 关键事实 证据 来源 ${attempt}`;
}

export function runAgenticRetrieval(options: RunAgenticRetrievalOptions): AgenticRetrievalResult {
  const maxAttempts = options.maxAttempts ?? 2;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error(`maxAttempts must be a positive integer, got ${maxAttempts}`);
  }

  const steps: AgenticRetrievalStep[] = [];
  let query = options.initialQuery;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const retrievedIds = options.retrieve(query);
    const grade = gradeRetrieval(retrievedIds, options.expectedRelevantIds);
    steps.push({ attempt, query, retrievedIds, grade });
    if (grade.decision !== "retry") {
      return { steps, finalDecision: grade.decision, finalQuery: query, finalRetrievedIds: retrievedIds };
    }
    query = options.rewrite(query, attempt);
  }

  const last = steps[steps.length - 1]!;
  return { steps, finalDecision: "refuse", finalQuery: last.query, finalRetrievedIds: last.retrievedIds };
}

export function makeAgenticRagCorpus(): AgenticRagDoc[] {
  return [
    {
      id: "sla-compensation",
      text: "企业版 SLA 承诺月度可用性 99.95%。未达标时按事故时长返还 10% 到 30% 服务积分，需在 15 个工作日内申诉。",
    },
    {
      id: "auth-sso",
      text: "企业版支持 SAML 2.0 单点登录与 SCIM 2.0 用户自动同步，最多可配置 5 个身份提供商。",
    },
    {
      id: "retention",
      text: "冷数据 90 天未访问后进入冷存储，默认 365 天后删除，可由管理员延长保留期。",
    },
    {
      id: "noise-event",
      text: "2026 春季开发者大会报名后可领取贴纸，活动规则与产品 SLA 无关。",
    },
  ];
}

export function makeBm25Retriever(docs: readonly AgenticRagDoc[], k: number): (query: string) => string[] {
  const index = new BM25Index();
  index.add([...docs]);
  return (query: string) => index.search(query, k).map((hit) => hit.id);
}
