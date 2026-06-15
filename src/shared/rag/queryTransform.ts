/**
 * 查询改写（query transformation）：在「检索之前」先优化查询，提升召回。
 *
 * 用户的问法常常和资料的写法对不上：问得太口语、太短、含指代、或一句话里塞了多个意图。
 * 两个常用手段：
 *  - multiQuery：把一个问题扩成多个不同措辞/角度的查询，多路检索后取并集，降低「漏召回」。
 *  - HyDE（Hypothetical Document Embeddings）：先让模型写一段「假设答案」，用它去检索。
 *    因为「答案」在用词与篇幅上比「问题」更接近真正的资料，常能召回得更准。
 */
import { getLLM } from "../llm";
import type { LLMClient } from "../llm/types";

export interface QueryTransformOptions {
  /** 自定义 LLM；默认 getLLM()。 */
  llm?: LLMClient;
}

export interface QueryRouteDefinition {
  id: string;
  label: string;
  keywords: string[];
  description: string;
}

export interface QueryRouteResult {
  route: QueryRouteDefinition;
  score: number;
  matchedKeywords: string[];
  fallback: boolean;
}

export interface QueryPlan {
  route: QueryRouteResult;
  subQueries: string[];
  stepBackQuery: string;
  expandedQueries: string[];
}

export const DEFAULT_QUERY_ROUTES: readonly QueryRouteDefinition[] = [
  {
    id: "pricing",
    label: "价格 / 计费",
    keywords: ["价格", "费用", "收费", "多少钱", "计费", "月费", "按年", "附加费"],
    description: "价格、套餐、超额计费、补偿金额等商业规则。",
  },
  {
    id: "quota",
    label: "配额 / 限制",
    keywords: ["配额", "上限", "额度", "多少行", "容量", "限制", "并发", "导出"],
    description: "容量、导出额度、并发数、附件大小等硬限制。",
  },
  {
    id: "auth",
    label: "身份 / 权限",
    keywords: ["登录", "单点登录", "SSO", "SAML", "SCIM", "权限", "账号", "IdP"],
    description: "企业身份接入、用户同步、权限与租户隔离。",
  },
  {
    id: "sla",
    label: "SLA / 补偿",
    keywords: ["SLA", "可用性", "宕机", "补偿", "事故", "申诉", "服务积分"],
    description: "可用性承诺、事故补偿、申诉流程。",
  },
  {
    id: "retention",
    label: "保留 / 删除",
    keywords: ["删除", "删", "保留", "归档", "冷存储", "生命周期", "过期", "迁移"],
    description: "数据生命周期、保留期、冷归档与删除规则。",
  },
  {
    id: "general",
    label: "通用检索",
    keywords: [],
    description: "没有明显垂直路由时的兜底检索路径。",
  },
];

function normalized(text: string): string {
  return text.toLowerCase();
}

export function routeQuery(
  query: string,
  routes: readonly QueryRouteDefinition[] = DEFAULT_QUERY_ROUTES,
): QueryRouteResult {
  const lower = normalized(query);
  let best: QueryRouteResult | null = null;
  for (const route of routes) {
    if (route.id === "general") continue;
    const matchedKeywords = route.keywords.filter((keyword) => lower.includes(normalized(keyword)));
    const score = matchedKeywords.length;
    if (!best || score > best.score) best = { route, score, matchedKeywords, fallback: false };
  }

  if (best && best.score > 0) return best;
  const fallback = routes.find((route) => route.id === "general") ?? DEFAULT_QUERY_ROUTES[DEFAULT_QUERY_ROUTES.length - 1]!;
  return { route: fallback, score: 0, matchedKeywords: [], fallback: true };
}

export function decomposeQuery(query: string): string[] {
  const normalizedQuery = query.replace(/[？?。；;]/g, "，");
  const parts = normalizedQuery
    .split(/，|、|以及|并且|同时|另外|还有|和(?=.+(?:吗|么|多少|如何|怎么|是否|能不能))/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return [...new Set(parts.length === 0 ? [query.trim()] : parts)];
}

export function stepBackQuery(query: string): string {
  const route = routeQuery(query).route.id;
  if (route === "pricing") return "产品的计费规则、套餐价格和附加费用是什么？";
  if (route === "quota") return "产品有哪些容量、导出、并发或使用配额限制？";
  if (route === "auth") return "企业身份接入、单点登录和账号同步能力是什么？";
  if (route === "sla") return "服务可用性承诺、故障补偿和申诉规则是什么？";
  if (route === "retention") return "数据生命周期、归档、保留期和删除规则是什么？";
  return "这个问题背后的通用概念、约束和决策原则是什么？";
}

export function planQuery(query: string): QueryPlan {
  const route = routeQuery(query);
  const subQueries = decomposeQuery(query);
  const broader = stepBackQuery(query);
  const expandedQueries = [...new Set([query, broader, ...subQueries])];
  return { route, subQueries, stepBackQuery: broader, expandedQueries };
}

/**
 * 多查询改写：返回「原始查询 + n 个改写」，去重后供多路检索。
 * @param n 期望生成的改写数量（不含原始查询）。
 */
export async function multiQuery(
  query: string,
  n = 3,
  options: QueryTransformOptions = {},
): Promise<string[]> {
  const llm = options.llm ?? getLLM();
  const system = `你是检索查询改写器。把用户问题改写成 ${n} 个语义等价但措辞/角度不同的检索查询，每行一个，不要编号、不要解释、不要多余文字。`;
  const res = await llm.chat({
    system,
    messages: [{ role: "user", content: query }],
    temperature: 0.3,
  });
  const lines = res.text
    .split("\n")
    .map((l) => l.replace(/^[\s\d.、)）\-*]+/, "").trim())
    .filter((l) => l.length > 0);
  // 含原始查询，去重后返回。
  return [...new Set([query, ...lines])].slice(0, n + 1);
}

/** HyDE：生成一段「假设答案」，其向量通常比原问题更贴近真实资料，适合拿去检索。 */
export async function hyde(query: string, options: QueryTransformOptions = {}): Promise<string> {
  const llm = options.llm ?? getLLM();
  const system =
    "你是写作助手。针对用户问题，写一段简洁、信息密度高的假设性答案（2-4 句），就当它来自一篇资料。直接陈述，不要说“我不知道”，不要任何免责声明或客套。";
  const res = await llm.chat({
    system,
    messages: [{ role: "user", content: query }],
    temperature: 0.3,
  });
  return res.text.trim();
}
