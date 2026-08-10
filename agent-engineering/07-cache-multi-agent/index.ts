/** A7 — permission-safe cache and bounded multi-agent evidence reduction. */
import {
  buildEnterpriseContext,
  createContextCacheEntry,
  createWorkerContextPackage,
  createWorkerEvidencePackage,
  evaluateEvidence,
  readContextCache,
  reduceWorkerEvidence,
  type ContextItem,
  type ContextPolicy,
  type ContractResult,
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
const parentAuthority = {
  tools: ["read_ci", "read_change"],
  resources: ["ci:agent-build", "repo:agent-build"],
  actions: ["read"],
};
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
const item = (id: string, kind: ContextItem["kind"], content: string): ContextItem => ({
  id,
  kind,
  role: kind === "instruction" ? "control" : "data",
  content,
  priority: 100,
  mandatory: true,
  trust: kind === "instruction" ? "trusted" : "reviewed",
  sensitivity: "internal",
  audience: ["release-reviewer"],
  stages: ["collect-evidence"],
  stable: kind !== "tool",
  observedAt: AT,
  provenance: { sourceId: `${id}-source`, version: "1", observedAt: AT },
});

try {
  const build = unwrap(buildEnterpriseContext({
    request,
    candidates: [
      item("review-control", "instruction", "只读审查；证据不足必须 abstain。"),
      item("release-policy", "artifact", "发布前必须满足政策门禁。"),
      item("ci-pass", "tool", "typecheck=pass smoke=pass build=pass"),
    ].map((contextItem) => ({
      item: contextItem,
      tenantId: request.tenantId,
      allowedPrincipalIds: [principal.id],
      allowedPurposes: [request.purpose],
      authorizationDecisionId: `pdp-${contextItem.id}`,
    })),
    estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 4)),
  }));
  const cache = unwrap(createContextCacheEntry({ build, createdAt: AT, expiresAt: DEADLINE }));
  const cacheHit = unwrap(readContextCache({ entry: cache, request, at: AT }));
  const cacheMiss = unwrap(readContextCache({ entry: cache, request: { ...request, purpose: "incident-response" }, at: AT }));
  const tamperedCache = JSON.parse(JSON.stringify(cache)) as typeof cache;
  (tamperedCache as { permissionDigest: string }).permissionDigest = "sha256:forged-permission-scope";
  const tamperCode = errorCode(readContextCache({ entry: tamperedCache, request, at: AT }));
  const assessment = unwrap(evaluateEvidence({
    tenantId: request.tenantId,
    principal,
    purpose: request.purpose,
    policySnapshot: request.policySnapshot,
    at: AT,
    candidates: [
      { id: "ev-policy", claimId: "policy", value: "pass", source: "release-policy" },
      { id: "ev-ci", claimId: "ci", value: "pass", source: "ci" },
    ].map(({ id, claimId, value, source }) => ({
      id,
      claimId,
      value,
      excerpt: `${claimId}=${value}`,
      citation: { uri: `artifact://${source}`, locator: "result" },
      provenance: { sourceId: source, version: "2048", observedAt: AT },
      tenantId: request.tenantId,
      allowedPrincipalIds: [principal.id],
      allowedPurposes: [request.purpose],
      authorizationDecisionId: `pdp-${id}`,
      authority: 0.95,
      confidence: 0.98,
      observedAt: AT,
      expiresAt: DEADLINE,
    })),
    requirements: [
      { claimId: "policy", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
      { claimId: "ci", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
    ],
  }));
  const parentBudget = { maxTokens: 200, maxToolCalls: 4 };
  const policyContext = unwrap(createWorkerContextPackage({
    assignmentId: "assignment-policy",
    workerId: "policy-reviewer",
    tenantId: request.tenantId,
    principal,
    purpose: request.purpose,
    policySnapshot: request.policySnapshot,
    parentAuthority,
    authority: { tools: ["read_change"], resources: ["repo:agent-build"], actions: ["read"] },
    parentBudget,
    budget: { maxTokens: 80, maxToolCalls: 1 },
    contextBuildDigest: build.digest,
    visibleItemIds: ["release-policy"],
    evidenceDelegations: [{
      evidenceId: assessment.evidence.find((entry) => entry.id === "ev-policy")!.id,
      evidenceDigest: assessment.evidence.find((entry) => entry.id === "ev-policy")!.digest,
    }],
    at: AT,
  }));
  const ciContext = unwrap(createWorkerContextPackage({
    assignmentId: "assignment-ci",
    workerId: "ci-reviewer",
    tenantId: request.tenantId,
    principal,
    purpose: request.purpose,
    policySnapshot: request.policySnapshot,
    parentAuthority,
    authority: { tools: ["read_ci"], resources: ["ci:agent-build"], actions: ["read"] },
    parentBudget,
    budget: { maxTokens: 80, maxToolCalls: 1 },
    contextBuildDigest: build.digest,
    visibleItemIds: ["ci-pass"],
    evidenceDelegations: [{
      evidenceId: assessment.evidence.find((entry) => entry.id === "ev-ci")!.id,
      evidenceDigest: assessment.evidence.find((entry) => entry.id === "ev-ci")!.digest,
    }],
    at: AT,
  }));
  const policyPackage = unwrap(createWorkerEvidencePackage({
    context: policyContext,
    status: "complete",
    claims: [{ claimId: "release-decision", value: "approve", evidenceIds: ["ev-policy"], confidence: 0.95 }],
    evidence: [assessment.evidence.find((entry) => entry.id === "ev-policy")!],
    uncertainties: [],
    consumed: { tokens: 50, toolCalls: 1 },
    traceId: "trace-policy",
    at: AT,
  }));
  const ciPackage = unwrap(createWorkerEvidencePackage({
    context: ciContext,
    status: "complete",
    claims: [{ claimId: "release-decision", value: "block", evidenceIds: ["ev-ci"], confidence: 0.96 }],
    evidence: [assessment.evidence.find((entry) => entry.id === "ev-ci")!],
    uncertainties: [],
    consumed: { tokens: 60, toolCalls: 1 },
    traceId: "trace-ci",
    at: AT,
  }));
  const reduced = unwrap(reduceWorkerEvidence({
    tenantId: request.tenantId,
    purpose: request.purpose,
    policySnapshot: request.policySnapshot,
    parentAuthority,
    parentBudget,
    packages: [policyPackage, ciPackage],
    at: AT,
  }));
  const expansionCode = errorCode(createWorkerContextPackage({
    assignmentId: "assignment-unsafe",
    workerId: "unsafe-worker",
    tenantId: request.tenantId,
    principal,
    purpose: request.purpose,
    policySnapshot: request.policySnapshot,
    parentAuthority,
    authority: { tools: ["deploy_prod"], resources: ["prod"], actions: ["write"] },
    parentBudget,
    budget: { maxTokens: 80, maxToolCalls: 1 },
    contextBuildDigest: build.digest,
    visibleItemIds: [],
    evidenceDelegations: [],
    at: AT,
  }));
  if (!cacheHit.hit || cacheMiss.hit || reduced.status !== "conflicted") throw new Error("A7 验收断言失败");
  console.log(JSON.stringify({
    module: "A7",
    status: reduced.status,
    claims: reduced.claims,
    conflicts: reduced.conflicts,
    consumed: reduced.consumed,
    permissionFingerprint: reduced.permissionFingerprint,
    cache: {
      hit: cacheHit.hit,
      scopeMiss: !cacheMiss.hit,
      tamperRejected: tamperCode === "INVALID_CONTEXT_CACHE_ENTRY",
      tamperCode,
    },
    safetyCounterexample: {
      rejected: expansionCode === "WORKER_AUTHORITY_EXPANSION",
      code: expansionCode,
      case: "worker-authority-expansion",
    },
    boundary: "in-memory cache and reducer contracts; no distributed cache, worker process, or production authorization service",
  }));
} catch (cause) {
  console.error(JSON.stringify({ module: "A7", fatal: cause instanceof Error ? cause.message : String(cause) }));
  process.exitCode = 1;
}
