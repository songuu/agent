import { detectInjection, redactPii } from "../../../src/shared/rag/security";
import type { FeedbackItem } from "./scenario";

export interface ThemeRule {
  id: string;
  label: string;
  keywords: string[];
  owner: "product" | "growth" | "platform";
}

export interface ThemeSummary {
  id: string;
  label: string;
  owner: ThemeRule["owner"];
  count: number;
  weightedScore: number;
  sampleIds: string[];
  recommendation: string;
}

export interface FeedbackReport {
  total: number;
  quarantined: string[];
  sanitizedItems: Array<FeedbackItem & { sanitizedText: string }>;
  themes: ThemeSummary[];
  roadmapTickets: string[];
}

const THEME_RULES: ThemeRule[] = [
  { id: "billing-export", label: "账单与审计导出", keywords: ["导出", "csv", "账单", "审计日志", "部门"], owner: "platform" },
  { id: "onboarding", label: "新手引导与首个 Agent 创建", keywords: ["新手", "引导", "第一", "下一步"], owner: "growth" },
  { id: "integrations", label: "团队集成与 workspace 映射", keywords: ["slack", "集成", "workspace", "映射"], owner: "product" },
];

const SEVERITY_WEIGHT: Record<FeedbackItem["severity"], number> = { low: 1, medium: 3, high: 5 };
const TIER_WEIGHT: Record<FeedbackItem["accountTier"], number> = { free: 1, pro: 2, enterprise: 4 };

function itemScore(item: FeedbackItem): number {
  return SEVERITY_WEIGHT[item.severity] * TIER_WEIGHT[item.accountTier];
}

function matchesTheme(item: FeedbackItem, theme: ThemeRule): boolean {
  const lower = item.text.toLowerCase();
  return theme.keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function buildRecommendation(theme: ThemeRule, count: number): string {
  if (theme.id === "billing-export") return `优先做异步导出 + 部门维度筛选，覆盖 ${count} 条高价值反馈。`;
  if (theme.id === "integrations") return `把 Slack 多 workspace 映射拆成 discovery ticket，先验证权限模型。`;
  return `压缩首个 Agent 创建路径，增加空状态引导与下一步 CTA。`;
}

export function analyzeFeedback(items: readonly FeedbackItem[]): FeedbackReport {
  const quarantined: string[] = [];
  const safeItems: FeedbackItem[] = [];

  for (const item of items) {
    const scan = detectInjection(item.text);
    if (scan.suspicious) {
      quarantined.push(item.id);
    } else {
      safeItems.push(item);
    }
  }

  const sanitizedItems = safeItems.map((item) => ({ ...item, sanitizedText: redactPii(item.text).redacted }));
  const themes = THEME_RULES.map((theme) => {
    const matched = safeItems.filter((item) => matchesTheme(item, theme));
    return {
      id: theme.id,
      label: theme.label,
      owner: theme.owner,
      count: matched.length,
      weightedScore: matched.reduce((sum, item) => sum + itemScore(item), 0),
      sampleIds: matched.map((item) => item.id),
      recommendation: buildRecommendation(theme, matched.length),
    };
  })
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore || b.count - a.count);

  const roadmapTickets = themes.map(
    (theme) => `[${theme.owner}] ${theme.label}: score=${theme.weightedScore}, samples=${theme.sampleIds.join(", ")}`,
  );

  return { total: items.length, quarantined, sanitizedItems, themes, roadmapTickets };
}
