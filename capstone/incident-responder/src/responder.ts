import { approxTokens } from "../../../src/shared/rag/chunk";
import type { IncidentScenario, Runbook, RunbookStep } from "./scenario";

export interface Diagnosis {
  rootCause: string;
  confidence: number;
  evidence: string[];
  impactedServices: string[];
}

export interface ResponseAction extends RunbookStep {
  owner: "on-call" | "dba" | "sre";
  status: "ready" | "approval-required";
}

export interface IncidentReport {
  incidentId: string;
  severity: "SEV1" | "SEV2" | "SEV3";
  summary: string;
  diagnosis: Diagnosis;
  selectedRunbook: string;
  actions: ResponseAction[];
  customerMessage: string;
  postmortemChecklist: string[];
  estimatedCostTokens: number;
}

function selectSeverity(scenario: IncidentScenario): IncidentReport["severity"] {
  const criticalAlerts = scenario.alerts.filter((alert) => alert.severity === "critical");
  const severeRate = scenario.alerts.some((alert) => alert.metric === "5xx_rate" && alert.value >= alert.threshold * 4);
  if (criticalAlerts.length >= 2 || severeRate) return "SEV1";
  if (criticalAlerts.length === 1) return "SEV2";
  return "SEV3";
}

function scoreRunbook(runbook: Runbook, text: string): number {
  return runbook.diagnosisHints.reduce((score, hint) => score + (text.includes(hint.toLowerCase()) ? 1 : 0), 0);
}

function selectRunbook(scenario: IncidentScenario): Runbook {
  const text = scenario.logs.map((line) => line.message.toLowerCase()).join("\n");
  const ranked = scenario.runbooks
    .map((runbook) => ({ runbook, score: scoreRunbook(runbook, text) }))
    .sort((a, b) => b.score - a.score);
  const selected = ranked[0]?.runbook;
  if (!selected) throw new Error(`场景 ${scenario.id} 缺少可用 runbook`);
  return selected;
}

function buildDiagnosis(scenario: IncidentScenario, runbook: Runbook): Diagnosis {
  const evidence = scenario.logs
    .filter((line) => line.level !== "info")
    .map((line) => `${line.service}: ${line.message}`);
  const impactedServices = [...new Set(scenario.alerts.map((alert) => alert.service))];
  const poolEvidence = evidence.filter((item) => /pool|connection|timeout|queue/i.test(item)).length;
  return {
    rootCause:
      runbook.id === "rb-db-pool"
        ? "数据库连接池耗尽导致 checkout-api 超时，支付队列被重试放大"
        : `匹配 runbook: ${runbook.symptom}`,
    confidence: Math.min(0.95, 0.55 + poolEvidence * 0.1),
    evidence,
    impactedServices,
  };
}

function assignOwner(step: RunbookStep): ResponseAction["owner"] {
  if (/db|pool|slow/i.test(step.command)) return "dba";
  if (/scale|pause|backpressure/i.test(step.command)) return "sre";
  return "on-call";
}

function buildActions(runbook: Runbook): ResponseAction[] {
  return runbook.steps.map((step) => ({
    ...step,
    owner: assignOwner(step),
    status: step.risk === "safe" ? "ready" : "approval-required",
  }));
}

export function runIncidentResponder(scenario: IncidentScenario): IncidentReport {
  const severity = selectSeverity(scenario);
  const runbook = selectRunbook(scenario);
  const diagnosis = buildDiagnosis(scenario, runbook);
  const actions = buildActions(runbook);
  const context = JSON.stringify({ alerts: scenario.alerts, logs: scenario.logs, runbook: runbook.id });

  return {
    incidentId: scenario.id,
    severity,
    summary: `${scenario.title}: ${diagnosis.rootCause}`,
    diagnosis,
    selectedRunbook: runbook.id,
    actions,
    customerMessage: "我们正在处理支付链路异常，已启用限流与扩容预案；付款失败订单可稍后重试，已避免重复扣款。",
    postmortemChecklist: [
      "补连接池 saturation 告警与队列积压联动告警",
      "复盘 deploy sha 7f3c2 是否改变连接池使用模式",
      "把批处理暂停动作接入审批系统，保留执行审计",
      "增加压测用例覆盖 3x 流量下的连接池上限",
    ],
    estimatedCostTokens: approxTokens(context),
  };
}
