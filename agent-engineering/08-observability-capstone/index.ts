/** A8 — deterministic A1-A8 host, trace/replay, shadow and canary gates. */
import {
  buildEnterpriseContext,
  commitTaskLedger,
  createBehaviorBundle,
  createRunManifest,
  createTaskLedger,
  createWorkerContextPackage,
  createWorkerEvidencePackage,
  decideRuntimeRollout,
  evaluateEvidence,
  replayProductionChangeReview,
  runProductionChangeReview,
  transitionRun,
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
const authority = {
  tools: ["read_ci", "read_change"],
  resources: ["ci:agent-build", "repo:agent-build"],
  actions: ["read"],
};
const contextPolicy: ContextPolicy = {
  ref: version("context-policy", "4.0.0"),
  tokenBudget: 240,
  completionReserve: 48,
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
  modelProfile: version("provider-neutral-model-profile", "1.0.0"),
  toolset: version("read-only-release-tools", "2.0.0"),
  indexSnapshot: version("release-index", "2048"),
  stateRevision: 1,
  freshnessBucket: "2026-08-10T06:00Z",
  safetyReserve: 16,
  contextPolicy,
};
const contextItem = (id: string, kind: ContextItem["kind"], content: string): ContextItem => ({
  id,
  kind,
  role: kind === "instruction" ? "control" : "data",
  content,
  priority: 100,
  mandatory: true,
  trust: kind === "instruction" ? "trusted" : "reviewed",
  sensitivity: "internal",
  audience: [contextPolicy.audience],
  stages: [request.stage],
  stable: kind !== "tool",
  observedAt: AT,
  provenance: { sourceId: `${id}-source`, version: "1", observedAt: AT },
});
const contextInput = {
  request,
  candidates: [
    contextItem("review-control", "instruction", "只读审查；证据不足必须 abstain。"),
    contextItem("release-policy", "artifact", "发布前必须满足政策门禁。"),
    contextItem("ci-pass", "tool", "typecheck=pass smoke=pass build=pass"),
  ].map((item) => ({
    item,
    tenantId: request.tenantId,
    allowedPrincipalIds: [principal.id],
    allowedPurposes: [request.purpose],
    authorizationDecisionId: `pdp-${item.id}`,
  })),
  estimateTokens: (text: string): number => Math.max(1, Math.ceil(text.length / 4)),
};
const evidenceCandidates = [
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
}));
const evidenceRequirements = [
  { claimId: "policy", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
  { claimId: "ci", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
];

try {
  const behavior = unwrap(createBehaviorBundle({
    id: "release-review-behavior",
    version: "2.0.0",
    status: "candidate",
    prompt: version("release-review-prompt", "2.0.0"),
    model: request.modelProfile,
    toolset: request.toolset,
    outputContract: version("release-review-output", "2.0.0"),
    contextPolicy: request.contextPolicy.ref,
    permissionPolicy: request.policySnapshot,
    evalSuite: version("release-review-evals", "2.0.0"),
  }));
  const run = unwrap(transitionRun(unwrap(createRunManifest({
    runId: request.runId,
    sessionId: "session-change-4821",
    owner: "release-review-agent",
    objective: "审查 change-4821 并产出人工审批前决策包",
    stage: request.stage,
    behavior: {
      agent: version("release-review-agent", "2.0.0"),
      harness: version("agent-engineering-harness", "2.0.0"),
      prompt: behavior.prompt,
      model: behavior.model,
      toolset: behavior.toolset,
      outputContract: behavior.outputContract,
      contextPolicy: behavior.contextPolicy,
      permissionPolicy: behavior.permissionPolicy,
      evalSuite: behavior.evalSuite,
    },
    authority,
    budget: { maxTurns: 8, maxTokens: 4_000, deadline: DEADLINE },
    expectedOutcome: "带证据的人工审批前变更审查结论",
    createdAt: AT,
  })), { type: "start", expectedRevision: 0, at: AT })).run;
  const ledger = unwrap(commitTaskLedger(unwrap(createTaskLedger({
    taskId: "task-change-4821",
    tenantId: request.tenantId,
    goal: "生成带证据的生产变更审查结论",
    successCriteria: ["政策与 CI 证据齐全", "不得执行部署"],
    authority,
    policySnapshot: request.policySnapshot,
    createdAt: AT,
  })), {
    expectedRevision: 0,
    idempotencyKey: "task-change-4821:fact:1",
    at: AT,
    patch: {
      currentStep: "review",
      verifiedFacts: [{ claim: "CI 已通过", evidenceIds: ["ev-ci"], sourceRefs: [{ sourceId: "ci", version: "2048", observedAt: AT }] }],
    },
  })).ledger;
  const contextBuild = unwrap(buildEnterpriseContext(contextInput));
  const evidence = unwrap(evaluateEvidence({
    tenantId: request.tenantId,
    principal,
    purpose: request.purpose,
    policySnapshot: request.policySnapshot,
    at: AT,
    candidates: evidenceCandidates,
    requirements: evidenceRequirements,
  }));
  const parentBudget = { maxTokens: 160, maxToolCalls: 2 };
  const workerContext = unwrap(createWorkerContextPackage({
    assignmentId: "assignment-ci",
    workerId: "ci-reviewer",
    tenantId: request.tenantId,
    principal,
    purpose: request.purpose,
    policySnapshot: request.policySnapshot,
    parentAuthority: authority,
    authority: { tools: ["read_ci"], resources: ["ci:agent-build"], actions: ["read"] },
    parentBudget,
    budget: { maxTokens: 80, maxToolCalls: 1 },
    contextBuildDigest: contextBuild.digest,
    visibleItemIds: ["ci-pass"],
    evidenceDelegations: [{
      evidenceId: evidence.evidence.find((entry) => entry.id === "ev-ci")!.id,
      evidenceDigest: evidence.evidence.find((entry) => entry.id === "ev-ci")!.digest,
    }],
    at: AT,
  }));
  const workerPackage = unwrap(createWorkerEvidencePackage({
    context: workerContext,
    status: "complete",
    claims: [{ claimId: "release-decision", value: "ready", evidenceIds: ["ev-ci"], confidence: 0.96 }],
    evidence: [evidence.evidence.find((entry) => entry.id === "ev-ci")!],
    uncertainties: [],
    consumed: { tokens: 50, toolCalls: 1 },
    traceId: "trace-worker-ci",
    at: AT,
  }));
  const reviewInput = {
    scenarioId: "production-change-4821",
    at: AT,
    seed: 4821,
    run,
    behavior,
    context: contextInput,
    evidence: { candidates: evidenceCandidates, policySnapshot: request.policySnapshot, requirements: evidenceRequirements },
    ledger,
    memories: [],
    multiAgent: { parentAuthority: authority, parentBudget, packages: [workerPackage] },
  };
  const review = unwrap(runProductionChangeReview(reviewInput));
  const replay = unwrap(replayProductionChangeReview({ input: reviewInput, expectedDigest: review.digest }));
  const shadow = unwrap(decideRuntimeRollout({
    stage: "shadow",
    baseline: { passRate: 0.95, evidenceCoverage: 0.95, aclViolations: 0, criticalFailures: 0, p95Ms: 1200, costPerTask: 1 },
    candidate: { passRate: 0.98, evidenceCoverage: 1, aclViolations: 0, criticalFailures: 0, p95Ms: 1250, costPerTask: 1.05 },
    thresholds: { minPassRate: 0.95, minEvidenceCoverage: 0.95, maxP95RegressionRatio: 0.2, maxCostRegressionRatio: 0.2 },
    at: AT,
  }));
  const canary = unwrap(decideRuntimeRollout({
    stage: "canary",
    baseline: { passRate: 0.95, evidenceCoverage: 0.95, aclViolations: 0, criticalFailures: 0, p95Ms: 1200, costPerTask: 1 },
    candidate: { passRate: 0.99, evidenceCoverage: 1, aclViolations: 1, criticalFailures: 0, p95Ms: 1100, costPerTask: 0.9 },
    thresholds: { minPassRate: 0.95, minEvidenceCoverage: 0.95, maxP95RegressionRatio: 0.2, maxCostRegressionRatio: 0.2 },
    at: AT,
  }));
  const mismatchedBehavior = unwrap(createBehaviorBundle({
    id: "release-review-behavior",
    version: "2.0.1",
    status: "candidate",
    prompt: behavior.prompt,
    model: version("different-model", "1.0.0"),
    toolset: behavior.toolset,
    outputContract: behavior.outputContract,
    contextPolicy: behavior.contextPolicy,
    permissionPolicy: behavior.permissionPolicy,
    evalSuite: behavior.evalSuite,
  }));
  const mismatchCode = errorCode(runProductionChangeReview({ ...reviewInput, behavior: mismatchedBehavior }));
  if (review.outcome !== "READY_FOR_HUMAN_APPROVAL" || !replay.matched || shadow.decision !== "advance-to-canary" || canary.decision !== "block") {
    throw new Error("A8 验收断言失败");
  }
  console.log(JSON.stringify({
    module: "A8",
    outcome: review.outcome,
    runDigest: review.run.digest,
    behaviorDigest: review.behavior.digest,
    traceDigest: review.trace.digest,
    traceSpans: review.trace.spans.length,
    replayMatched: replay.matched,
    shadowDecision: shadow.decision,
    canaryDecision: canary.decision,
    safetyCounterexample: {
      rejected: mismatchCode === "RUN_BEHAVIOR_MISMATCH",
      code: mismatchCode,
      case: "run-behavior-surface-mismatch",
    },
    boundary: "offline deterministic A1-A8 host; READY means eligible for human approval, not deployed or production-safe",
  }));
} catch (cause) {
  console.error(JSON.stringify({ module: "A8", fatal: cause instanceof Error ? cause.message : String(cause) }));
  process.exitCode = 1;
}
