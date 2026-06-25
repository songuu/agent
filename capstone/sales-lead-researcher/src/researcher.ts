import { redactPii } from "../../../src/shared/rag/security";
import type { LeadAccount, LeadSignalType } from "./scenario";

export interface LeadScore {
  fit: number;
  urgency: number;
  risk: number;
  total: number;
}

export interface LeadBrief {
  id: string;
  name: string;
  score: LeadScore;
  qualification: "priority" | "nurture" | "disqualify";
  evidence: string[];
  talkTrack: string;
  safeContactNote: string;
  nextAction: string;
}

const FIT_BY_INDUSTRY: Record<LeadAccount["industry"], number> = {
  manufacturing: 28,
  finance: 26,
  education: 18,
  retail: 16,
};

const SIGNAL_URGENCY: Record<LeadSignalType, number> = {
  pain: 18,
  hiring: 10,
  funding: 14,
  "tech-stack": 8,
  compliance: 4,
};

function scoreLead(lead: LeadAccount): LeadScore {
  const fit = FIT_BY_INDUSTRY[lead.industry] + (lead.employees >= 1000 ? 12 : 4);
  const urgency = lead.signals.reduce((sum, signal) => sum + SIGNAL_URGENCY[signal.type], 0);
  const risk = lead.signals.some((signal) => signal.type === "compliance") ? 12 : 4;
  const total = fit + urgency - risk;
  return { fit, urgency, risk, total };
}

function qualify(score: LeadScore): LeadBrief["qualification"] {
  if (score.total >= 58 && score.risk <= 12) return "priority";
  if (score.total >= 40) return "nurture";
  return "disqualify";
}

function buildTalkTrack(lead: LeadAccount): string {
  const pain = lead.signals.find((signal) => signal.type === "pain")?.text ?? "已有知识管理诉求";
  if (lead.industry === "manufacturing") {
    return `围绕售后知识库和客服响应时间切入：先做 2 周 PoC，把 ${pain} 转成可检索、可引用、可评估的 Agent。`;
  }
  if (lead.industry === "finance") {
    return `围绕私有化知识检索、引用核验和审计留痕切入，先从投研报告问答场景做封闭 PoC。`;
  }
  return `围绕资料检索效率切入，先确认权限与数据边界，再做轻量试点。`;
}

function buildNextAction(brief: Pick<LeadBrief, "qualification">, lead: LeadAccount): string {
  if (brief.qualification === "priority") return `本周发起 discovery call，准备 ${lead.industry} 行业版知识库 Agent PoC 提纲。`;
  if (brief.qualification === "nurture") return "进入培育池，先发送案例材料并确认合规边界。";
  return "暂不外呼，仅保留公开资料观察。";
}

export function researchLeads(leads: readonly LeadAccount[]): LeadBrief[] {
  return leads
    .map((lead) => {
      const score = scoreLead(lead);
      const qualification = qualify(score);
      const partial = { qualification };
      return {
        id: lead.id,
        name: lead.name,
        score,
        qualification,
        evidence: lead.signals.map((signal) => `${signal.type}: ${signal.text}`),
        talkTrack: buildTalkTrack(lead),
        safeContactNote: redactPii(lead.contactNote).redacted,
        nextAction: buildNextAction(partial, lead),
      };
    })
    .sort((a, b) => b.score.total - a.score.total || a.name.localeCompare(b.name));
}
