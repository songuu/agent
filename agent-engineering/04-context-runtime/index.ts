/** A4 — provider-neutral ContextRequest -> Package/Manifest/Fingerprint/BudgetReport. */
import {
  buildEnterpriseContext,
  type ContextItem,
  type ContextPolicy,
  type ContractResult,
  type EnterpriseContextCandidate,
  type EnterpriseContextRequest,
  type VersionRef,
} from "../../src/shared/agent/engineering/index.ts";

const AT = "2026-08-10T06:00:00.000Z";
const DEADLINE = "2026-08-10T06:05:00.000Z";
const version = (id: string, value = "1.0.0"): VersionRef => ({ id, version: value, digest: `${id}-${value}-sha256` });
const unwrap = <T>(result: ContractResult<T>): T => {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};
const errorCode = (result: ContractResult<unknown>): string => {
  if (result.ok) throw new Error("安全反例意外通过");
  return result.error.code;
};

const principal = { id: "release-reviewer-7", roles: ["release-reviewer"], groups: ["platform"] };
const policy: ContextPolicy = {
  ref: version("context-policy", "4.0.0"),
  tokenBudget: 200,
  completionReserve: 40,
  allowedKinds: ["instruction", "artifact", "tool"],
  minimumTrust: "reviewed",
  maximumSensitivity: "internal",
  audience: "release-reviewer",
  requiredEvidenceIds: ["release-policy", "ci-pass"],
};
const request: EnterpriseContextRequest = {
  requestId: "ctxreq-change-4821",
  runId: "run-change-4821",
  tenantId: "tenant-acme",
  principal,
  purpose: "production-change-review",
  stage: "collect-evidence",
  query: "change-4821 是否满足人工发布审批前置条件",
  requestedAt: AT,
  deadlineAt: DEADLINE,
  policySnapshot: version("permission-policy", "7.0.0"),
  modelProfile: version("provider-neutral-model-profile"),
  toolset: version("read-only-release-tools", "2.0.0"),
  indexSnapshot: version("release-index", "2048"),
  stateRevision: 3,
  freshnessBucket: "2026-08-10T06:00Z",
  safetyReserve: 16,
  contextPolicy: policy,
};
const contextItem = (id: string, kind: ContextItem["kind"], content: string, mandatory: boolean): ContextItem => ({
  id,
  kind,
  role: kind === "instruction" ? "control" : "data",
  content,
  priority: mandatory ? 100 : 80,
  mandatory,
  trust: kind === "instruction" ? "trusted" : "reviewed",
  sensitivity: "internal",
  audience: ["release-reviewer"],
  stages: ["collect-evidence"],
  stable: kind !== "tool",
  observedAt: AT,
  provenance: { sourceId: `${id}-source`, version: "1", observedAt: AT },
});
const candidate = (item: ContextItem): EnterpriseContextCandidate => ({
  item,
  tenantId: request.tenantId,
  allowedPrincipalIds: [principal.id],
  allowedPurposes: [request.purpose],
  authorizationDecisionId: `pdp-${item.id}`,
});
const candidates = [
  candidate(contextItem("review-control", "instruction", "只读审查；证据不足必须 abstain。", true)),
  candidate(contextItem("release-policy", "artifact", "发布前必须满足政策门禁。", true)),
  candidate(contextItem("ci-pass", "tool", "typecheck=pass smoke=pass build=pass", false)),
];
const estimateTokens = (text: string): number => Math.max(1, Math.ceil(text.length / 4));

try {
  const build = unwrap(buildEnterpriseContext({ request, candidates, estimateTokens }));
  const deniedCode = errorCode(buildEnterpriseContext({
    request,
    candidates: candidates.map((entry, index) => index === 1 ? { ...entry, tenantId: "tenant-other" } : entry),
    estimateTokens,
  }));
  if (build.compiledContext.sufficiency !== "sufficient" || deniedCode !== "MANDATORY_AUTHORIZATION_DENIED") {
    throw new Error("A4 验收断言失败");
  }
  console.log(JSON.stringify({
    module: "A4",
    scenario: "production-change-review",
    packageId: build.package.packageId,
    manifestId: build.manifest.manifestId,
    fingerprint: build.fingerprint.digest,
    budget: build.budget,
    safetyCounterexample: {
      rejected: deniedCode === "MANDATORY_AUTHORIZATION_DENIED",
      code: deniedCode,
      case: "mandatory-cross-tenant-context",
    },
    boundary: "offline pure contract; no provider, PDP service, model, cache, or production I/O",
  }));
} catch (cause) {
  console.error(JSON.stringify({ module: "A4", fatal: cause instanceof Error ? cause.message : String(cause) }));
  process.exitCode = 1;
}
