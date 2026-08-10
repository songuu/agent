/**
 * A4-A8 enterprise runtime contracts.
 *
 * Deterministic, offline fixtures only: no provider, database, network, or production side effect.
 */
import {
  buildEnterpriseContext,
  checkpointTaskLedger,
  compactTaskLedger,
  commitTaskLedger,
  createBehaviorBundle,
  createContextCacheEntry,
  createRunManifest,
  createTaskLedger,
  createWorkerContextPackage,
  createWorkerEvidencePackage,
  decideRuntimeRollout,
  deleteGovernedMemory,
  evaluateEvidence,
  proposeGovernedMemory,
  queryGovernedMemory,
  readContextCache,
  reduceWorkerEvidence,
  replayProductionChangeReview,
  runProductionChangeReview,
  stableDigest,
  transitionRun,
  validateEnterpriseRuntimeSnapshot,
  type ContextItem,
  type ContextPolicy,
  type ContractResult,
  type EnterpriseContextCandidate,
  type EnterpriseContextRequest,
  type EvidenceCandidate,
  type GovernedMemoryRecord,
  type VersionRef,
  type WorkerEvidencePackage,
} from "../src/shared/agent/engineering/index";

const AT = "2026-08-10T06:00:00.000Z";
const LATER = "2026-08-10T06:05:00.000Z";
const checks: string[] = [];
const failures: string[] = [];

function check(label: string, condition: boolean): void {
  checks.push(label);
  if (!condition) failures.push(label);
}

function ok<T>(label: string, result: ContractResult<T>): T {
  check(`${label}: ok`, result.ok);
  if (!result.ok) throw new Error(`${label} failed: ${result.error.code}`);
  return result.value;
}

function error(label: string, result: ContractResult<unknown>, code: string): void {
  check(`${label}: rejected`, !result.ok);
  if (!result.ok) check(`${label}: ${code}`, result.error.code === code);
}

function version(id: string, value = "1.0.0"): VersionRef {
  return { id, version: value, digest: `${id}-${value}-sha256` };
}

const principal = { id: "release-reviewer-7", roles: ["release-reviewer"], groups: ["platform"] };
const authority = {
  tools: ["read_ci", "read_change"],
  resources: ["repo:agent-build", "ci:agent-build"],
  actions: ["read"],
};

const policy: ContextPolicy = {
  ref: version("context-policy", "4.0.0"),
  tokenBudget: 240,
  completionReserve: 48,
  allowedKinds: ["instruction", "session", "memory", "artifact", "retrieval", "tool", "handoff"],
  minimumTrust: "untrusted",
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
  deadlineAt: LATER,
  policySnapshot: version("permission-policy", "7.0.0"),
  modelProfile: version("provider-neutral-model-profile", "1.0.0"),
  toolset: version("read-only-release-tools", "2.0.0"),
  indexSnapshot: version("release-evidence-index", "2048"),
  stateRevision: 1,
  freshnessBucket: "2026-08-10T06:00Z",
  safetyReserve: 16,
  contextPolicy: policy,
};

function item(id: string, kind: ContextItem["kind"], content: string, mandatory: boolean): ContextItem {
  return {
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
    stable: kind === "instruction" || kind === "artifact",
    observedAt: AT,
    provenance: { sourceId: `${id}-source`, version: "1", observedAt: AT },
  };
}

const contextCandidates: EnterpriseContextCandidate[] = [
  {
    item: item("review-control", "instruction", "只读审查；证据不足必须 abstain。", true),
    tenantId: "tenant-acme",
    allowedPrincipalIds: [principal.id],
    allowedPurposes: [request.purpose],
    authorizationDecisionId: "pdp-control-1",
  },
  {
    item: item("release-policy", "artifact", "发布前必须有政策与 CI 双证据。", true),
    tenantId: "tenant-acme",
    allowedPrincipalIds: [principal.id],
    allowedPurposes: [request.purpose],
    authorizationDecisionId: "pdp-policy-1",
  },
  {
    item: item("ci-pass", "tool", "typecheck=pass smoke=pass build=pass", false),
    tenantId: "tenant-acme",
    allowedPrincipalIds: [principal.id],
    allowedPurposes: [request.purpose],
    authorizationDecisionId: "pdp-ci-1",
  },
];

const evidenceCandidates: EvidenceCandidate[] = [
  {
    id: "ev-policy",
    claimId: "policy-compliance",
    value: "pass",
    excerpt: "变更满足发布前政策检查。",
    citation: { uri: "artifact://release-policy", locator: "rule-7" },
    provenance: { sourceId: "release-policy", version: "2026-08-01", observedAt: AT },
    tenantId: "tenant-acme",
    allowedPrincipalIds: [principal.id],
    allowedPurposes: [request.purpose],
    authorizationDecisionId: "pdp-ev-policy",
    authority: 0.98,
    confidence: 0.97,
    observedAt: AT,
    expiresAt: LATER,
  },
  {
    id: "ev-ci",
    claimId: "ci-health",
    value: "pass",
    excerpt: "typecheck、smoke、build 均通过。",
    citation: { uri: "ci://agent-build/2048", locator: "checks" },
    provenance: { sourceId: "ci", version: "2048", observedAt: AT },
    tenantId: "tenant-acme",
    allowedPrincipalIds: [principal.id],
    allowedPurposes: [request.purpose],
    authorizationDecisionId: "pdp-ev-ci",
    authority: 0.95,
    confidence: 0.99,
    observedAt: AT,
    expiresAt: LATER,
  },
];

function contextContracts(): void {
  const built = ok(
    "build enterprise context",
    buildEnterpriseContext({ request, candidates: contextCandidates, estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 4)) }),
  );
  check("context result is recursively frozen", Object.isFrozen(built) && Object.isFrozen(built.package.blocks));
  check("manifest explains every candidate", built.manifest.decisions.length === contextCandidates.length);
  check("budget reserves output and safety", built.budget.safetyReserve === 16 && built.budget.remainingInputTokens >= 0);
  check("fingerprint binds permission scope", built.fingerprint.permissionDigest.length > 20);
  check(
    "package is independently scope-bound",
    built.package.tenantId === request.tenantId &&
      built.package.principalId === request.principal.id &&
      built.package.purpose === request.purpose &&
      built.package.permissionDigest === built.fingerprint.permissionDigest,
  );
  const cacheEntry = ok(
    "create permission-safe context cache entry",
    createContextCacheEntry({ build: built, createdAt: AT, expiresAt: LATER }),
  );
  const cacheHit = ok("read matching context cache", readContextCache({ entry: cacheEntry, request, at: AT }));
  check("matching permission scope hits cache", cacheHit.hit && cacheHit.build?.digest === built.digest);
  const purposeMiss = ok(
    "read changed-purpose context cache",
    readContextCache({ entry: cacheEntry, request: { ...request, purpose: "incident-response" }, at: AT }),
  );
  check("purpose change misses context cache", !purposeMiss.hit && purposeMiss.reason === "scope-mismatch");
  const runMiss = ok(
    "read changed-run context cache",
    readContextCache({ entry: cacheEntry, request: { ...request, runId: "run-change-4822" }, at: AT }),
  );
  check("run change misses context cache", !runMiss.hit && runMiss.reason === "scope-mismatch");
  const stageMiss = ok(
    "read changed-stage context cache",
    readContextCache({ entry: cacheEntry, request: { ...request, stage: "deploy" }, at: AT }),
  );
  check("stage change misses context cache", !stageMiss.hit && stageMiss.reason === "scope-mismatch");
  const budgetMiss = ok(
    "read changed-budget context cache",
    readContextCache({
      entry: cacheEntry,
      request: { ...request, contextPolicy: { ...request.contextPolicy, tokenBudget: request.contextPolicy.tokenBudget + 1 } },
      at: AT,
    }),
  );
  check("context policy or budget change misses cache", !budgetMiss.hit && budgetMiss.reason === "scope-mismatch");
  const tamperedCache = JSON.parse(JSON.stringify(cacheEntry));
  tamperedCache.permissionDigest = stableDigest({ expanded: true });
  error(
    "mutated context cache snapshot",
    readContextCache({ entry: tamperedCache, request, at: AT }),
    "INVALID_CONTEXT_CACHE_ENTRY",
  );
  const otherPrincipal = ok(
    "build other principal context",
    buildEnterpriseContext({
      request: { ...request, requestId: "ctxreq-other", principal: { id: "other", roles: ["release-reviewer"], groups: [] } },
      candidates: contextCandidates.map((candidate) => ({ ...candidate, allowedPrincipalIds: ["other"] })),
      estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 4)),
    }),
  );
  check("principal changes fingerprint", otherPrincipal.fingerprint.digest !== built.fingerprint.digest);
  const otherQuery = ok(
    "build other-query context",
    buildEnterpriseContext({
      request: { ...request, requestId: "ctxreq-other-query", query: "完全不同的生产问题" },
      candidates: contextCandidates,
      estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 4)),
    }),
  );
  check("query changes semantic fingerprint", otherQuery.fingerprint.digest !== built.fingerprint.digest);
  error(
    "mandatory cross-tenant candidate",
    buildEnterpriseContext({
      request,
      candidates: contextCandidates.map((candidate, index) => index === 1 ? { ...candidate, tenantId: "tenant-other" } : candidate),
      estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 4)),
    }),
    "MANDATORY_AUTHORIZATION_DENIED",
  );
  const roundTrip = ok("rehydrate context build", validateEnterpriseRuntimeSnapshot(JSON.parse(JSON.stringify(built))));
  check("context round-trip digest", roundTrip.schemaVersion === "enterprise-context-build/v1" && roundTrip.digest === built.digest);

  const optionalDeniedCandidate: EnterpriseContextCandidate = {
    item: item("optional-denied", "retrieval", "不应泄漏到当前租户的可选上下文。", false),
    tenantId: "tenant-other",
    allowedPrincipalIds: [principal.id],
    allowedPurposes: [request.purpose],
    authorizationDecisionId: "pdp-optional-denied",
  };
  const auditedBuild = ok(
    "build context with optional denied audit entry",
    buildEnterpriseContext({
      request,
      candidates: [...contextCandidates, optionalDeniedCandidate],
      estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 4)),
    }),
  );
  const strippedDeniedAudit = JSON.parse(JSON.stringify(auditedBuild));
  strippedDeniedAudit.manifest.decisions = strippedDeniedAudit.manifest.decisions.filter(
    (decision: { itemId: string }) => decision.itemId !== optionalDeniedCandidate.item.id,
  );
  if (Array.isArray(strippedDeniedAudit.manifest.candidateLedger)) {
    strippedDeniedAudit.manifest.candidateLedger = strippedDeniedAudit.manifest.candidateLedger.filter(
      (candidate: { itemId: string }) => candidate.itemId !== optionalDeniedCandidate.item.id,
    );
  }
  strippedDeniedAudit.manifest.manifestId = `ctxman-${stableDigest({
    candidateLedger: strippedDeniedAudit.manifest.candidateLedger,
    decisions: strippedDeniedAudit.manifest.decisions,
  }).slice(7, 23)}`;
  const { digest: _strippedManifestDigest, ...strippedManifestPayload } = strippedDeniedAudit.manifest;
  strippedDeniedAudit.manifest.digest = stableDigest(strippedManifestPayload);
  const { digest: _strippedBuildDigest, ...strippedBuildPayload } = strippedDeniedAudit;
  strippedDeniedAudit.digest = stableDigest(strippedBuildPayload);
  error(
    "trusted digest pin rejects resigned stripped denied audit",
    validateEnterpriseRuntimeSnapshot(strippedDeniedAudit, { expectedDigest: auditedBuild.digest }),
    "INVALID_ENTERPRISE_SNAPSHOT",
  );
}

function evidenceContracts(): ReturnType<typeof evaluateEvidence> extends ContractResult<infer T> ? T : never {
  const assessment = ok(
    "evaluate sufficient evidence",
    evaluateEvidence({
      tenantId: request.tenantId,
      principal: request.principal,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      at: AT,
      candidates: evidenceCandidates,
      requirements: [
        { claimId: "policy-compliance", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
        { claimId: "ci-health", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
      ],
    }),
  );
  check("evidence is sufficient", assessment.decision === "proceed" && assessment.coverage.ratio === 1);
  check("citations stay attached", assessment.evidence.every((entry) => entry.citation.uri.length > 0));
  const denied = ok(
    "evaluate permission-filtered evidence",
    evaluateEvidence({
      tenantId: request.tenantId,
      principal: request.principal,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      at: AT,
      candidates: evidenceCandidates.map((entry) => ({ ...entry, allowedPrincipalIds: ["other"] })),
      requirements: [{ claimId: "ci-health", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 }],
    }),
  );
  check("insufficient evidence abstains", denied.decision === "abstain" && denied.coverage.missingClaimIds.includes("ci-health"));
  const conflicted = ok(
    "evaluate explicit conflict",
    evaluateEvidence({
      tenantId: request.tenantId,
      principal: request.principal,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      at: AT,
      candidates: [
        evidenceCandidates[1]!,
        { ...evidenceCandidates[1]!, id: "ev-ci-fail", value: "fail", provenance: { sourceId: "ci-mirror", version: "2048", observedAt: AT } },
      ],
      requirements: [{ claimId: "ci-health", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 }],
    }),
  );
  check("unresolved conflict abstains", conflicted.decision === "abstain" && conflicted.conflicts.length === 1);
  const lowQuality = ok(
    "evaluate low-quality evidence",
    evaluateEvidence({
      tenantId: request.tenantId,
      principal: request.principal,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      at: AT,
      candidates: [{ ...evidenceCandidates[1]!, authority: 0, confidence: 0 }],
      requirements: [{ claimId: "ci-health", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 }],
    }),
  );
  check("low authority and confidence cannot satisfy coverage", lowQuality.decision === "abstain");
  const aliasedSingleSource = ok(
    "evaluate aliased single-source evidence",
    evaluateEvidence({
      tenantId: request.tenantId,
      principal: request.principal,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      at: AT,
      candidates: [
        evidenceCandidates[1]!,
        {
          ...evidenceCandidates[1]!,
          id: "ev-ci-alias",
          authorizationDecisionId: "pdp-ev-ci-alias",
          excerpt: "同一 CI 报告中的另一处重复陈述。",
          citation: { ...evidenceCandidates[1]!.citation, locator: "summary" },
          provenance: { ...evidenceCandidates[1]!.provenance, sourceId: "ci-alias" },
        },
      ],
      requirements: [{ claimId: "ci-health", minIndependentSources: 2, minAuthority: 0.9, minConfidence: 0.9 }],
    }),
  );
  check("source-id alias cannot fabricate independent evidence", aliasedSingleSource.decision === "abstain");
  const futureProvenance = JSON.parse(JSON.stringify(assessment));
  futureProvenance.evidence[0].provenance.observedAt = LATER;
  const { digest: _futureEvidenceDigest, ...futureEvidencePayload } = futureProvenance.evidence[0];
  futureProvenance.evidence[0].digest = stableDigest(futureEvidencePayload);
  const { digest: _futureAssessmentDigest, ...futureAssessmentPayload } = futureProvenance;
  futureProvenance.digest = stableDigest(futureAssessmentPayload);
  error(
    "rehydration rejects future evidence provenance",
    validateEnterpriseRuntimeSnapshot(futureProvenance),
    "INVALID_ENTERPRISE_SNAPSHOT",
  );
  return assessment;
}

function stateAndMemoryContracts(): { ledger: ReturnType<typeof createTaskLedger> extends ContractResult<infer T> ? T : never; memories: readonly GovernedMemoryRecord[] } {
  const ledger = ok(
    "create task ledger",
    createTaskLedger({
      taskId: "task-change-4821",
      tenantId: request.tenantId,
      goal: "生成带证据的生产变更审查结论",
      successCriteria: ["政策与 CI 证据齐全", "不得执行部署"],
      authority,
      policySnapshot: request.policySnapshot,
      createdAt: AT,
    }),
  );
  const committed = ok(
    "commit ledger",
    commitTaskLedger(ledger, {
      expectedRevision: 0,
      idempotencyKey: "task-change-4821:record-evidence",
      at: AT,
      patch: {
        currentStep: "review",
        verifiedFacts: [{
          claim: "CI 已通过",
          evidenceIds: ["ev-ci"],
          sourceRefs: [{ sourceId: "ci", version: "2048", observedAt: AT }],
        }],
        openQuestions: ["生产审批尚未签署"],
      },
    }),
  );
  check("ledger CAS increments revision", committed.ledger.revision === 1 && !committed.replayed);
  error(
    "ledger stale revision",
    commitTaskLedger(committed.ledger, {
      expectedRevision: 0,
      idempotencyKey: "task-change-4821:stale",
      at: AT,
      patch: { currentStep: "unsafe" },
    }),
    "STALE_TASK_REVISION",
  );
  const checkpointed = ok(
    "checkpoint ledger",
    checkpointTaskLedger(committed.ledger, {
      expectedRevision: 1,
      idempotencyKey: "task-change-4821:checkpoint:1",
      checkpointId: "checkpoint-1",
      at: LATER,
      evidenceIds: ["ev-policy", "ev-ci"],
      artifactRefs: [],
    }),
  );
  const replayed = ok(
    "checkpoint replay",
    checkpointTaskLedger(checkpointed.ledger, {
      expectedRevision: checkpointed.ledger.revision,
      idempotencyKey: "task-change-4821:checkpoint:1",
      checkpointId: "checkpoint-1",
      at: LATER,
      evidenceIds: ["ev-policy", "ev-ci"],
      artifactRefs: [],
    }),
  );
  check("checkpoint replay is idempotent after advance", replayed.replayed && replayed.ledger.revision === checkpointed.ledger.revision);
  const compaction = ok(
    "compact task ledger with recoverable artifact",
    compactTaskLedger(checkpointed.ledger, {
      maxTokens: 120,
      estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 12)),
      artifact: { id: "task-change-4821-ledger", version: "2", digest: "ledger-artifact-sha256", location: "artifact://task-change-4821/ledger-2.json" },
      at: LATER,
    }),
  );
  const compactionRoundTrip = ok(
    "rehydrate task compaction",
    validateEnterpriseRuntimeSnapshot(JSON.parse(JSON.stringify(compaction))),
  );
  check("compaction snapshot round-trip", compactionRoundTrip.schemaVersion === "task-ledger-compaction/v1");
  check(
    "compaction preserves recoverable hard state",
    compaction.summary.goal === checkpointed.ledger.goal &&
      compaction.summary.tenantId === checkpointed.ledger.tenantId &&
      stableDigest(compaction.summary.authority) === stableDigest(checkpointed.ledger.authority) &&
      stableDigest(compaction.summary.policySnapshot) === stableDigest(checkpointed.ledger.policySnapshot) &&
      compaction.summary.status === checkpointed.ledger.status &&
      compaction.summary.successCriteria.length === checkpointed.ledger.successCriteria.length &&
      compaction.summary.openQuestions.length === 1 &&
      compaction.summary.verifiedFacts[0]?.sourceRefs[0]?.sourceId === "ci" &&
      compaction.recoverableArtifact.location?.startsWith("artifact://") === true,
  );
  error(
    "compaction hard state cannot fit",
    compactTaskLedger(checkpointed.ledger, {
      maxTokens: 1,
      estimateTokens: () => 2,
      artifact: { id: "task-change-4821-ledger", version: "2", digest: "ledger-artifact-sha256", location: "artifact://task-change-4821/ledger-2.json" },
      at: LATER,
    }),
    "COMPACTION_BUDGET_EXCEEDED",
  );

  const first = ok(
    "propose governed memory",
    proposeGovernedMemory({
      records: [],
      memoryId: "mem-release-style",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "review-output-style",
      value: "structured-json",
      scope: "user",
      principalId: principal.id,
      allowedPurposes: [request.purpose],
      provenance: [{ sourceId: "user-confirmation", version: "turn-9", observedAt: AT }],
      confidence: 0.99,
      sensitivity: "internal",
      expiresAt: LATER,
      idempotencyKey: "memory:style:v1",
      at: AT,
    }),
  );
  const conflict = ok(
    "propose conflicting memory",
    proposeGovernedMemory({
      records: first.records,
      memoryId: "mem-release-style-2",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "review-output-style",
      value: "free-form",
      scope: "user",
      principalId: principal.id,
      allowedPurposes: [request.purpose],
      provenance: [{ sourceId: "user-confirmation", version: "turn-10", observedAt: AT }],
      confidence: 0.8,
      sensitivity: "internal",
      expiresAt: LATER,
      idempotencyKey: "memory:style:v2",
      at: AT,
    }),
  );
  check("memory conflict is explicit", conflict.record.status === "disputed" && conflict.conflictIds.includes(first.record.memoryId));
  const otherPrincipalMemory = ok(
    "propose same subject for another principal",
    proposeGovernedMemory({
      records: first.records,
      memoryId: "mem-release-style-other-principal",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "review-output-style",
      value: "other-principal-format",
      scope: "user",
      principalId: "release-reviewer-8",
      allowedPurposes: [request.purpose],
      provenance: [{ sourceId: "user-confirmation", version: "turn-11", observedAt: AT }],
      confidence: 0.99,
      sensitivity: "internal",
      expiresAt: LATER,
      idempotencyKey: "memory:style:other-principal",
      at: AT,
    }),
  );
  check("memory conflict domain binds principal", otherPrincipalMemory.record.status === "active" && otherPrincipalMemory.conflictIds.length === 0);
  const otherScopeMemory = ok(
    "propose same subject for another scope",
    proposeGovernedMemory({
      records: first.records,
      memoryId: "mem-release-style-team",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "review-output-style",
      value: "team-format",
      scope: "team",
      principalId: principal.id,
      allowedPurposes: [request.purpose],
      provenance: [{ sourceId: "team-confirmation", version: "turn-11", observedAt: AT }],
      confidence: 0.99,
      sensitivity: "internal",
      expiresAt: LATER,
      idempotencyKey: "memory:style:team",
      at: AT,
    }),
  );
  check("memory conflict domain binds scope", otherScopeMemory.record.status === "active" && otherScopeMemory.conflictIds.length === 0);
  const otherPurposeMemory = ok(
    "propose same subject for another purpose",
    proposeGovernedMemory({
      records: first.records,
      memoryId: "mem-release-style-incident",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "review-output-style",
      value: "incident-format",
      scope: "user",
      principalId: principal.id,
      allowedPurposes: ["incident-response"],
      provenance: [{ sourceId: "incident-confirmation", version: "turn-11", observedAt: AT }],
      confidence: 0.99,
      sensitivity: "internal",
      expiresAt: LATER,
      idempotencyKey: "memory:style:incident",
      at: AT,
    }),
  );
  check("memory conflict domain binds purpose", otherPurposeMemory.record.status === "active" && otherPurposeMemory.conflictIds.length === 0);
  error(
    "memory proposal cannot move state clock backwards",
    proposeGovernedMemory({
      records: first.records,
      memoryId: "mem-release-style-past",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "review-output-style",
      value: "past-format",
      scope: "user",
      principalId: principal.id,
      allowedPurposes: [request.purpose],
      provenance: [{ sourceId: "user-confirmation", version: "turn-8", observedAt: "2026-08-10T05:59:00.000Z" }],
      confidence: 0.99,
      sensitivity: "internal",
      idempotencyKey: "memory:style:past",
      at: "2026-08-10T05:59:00.000Z",
    }),
    "MEMORY_CLOCK_REGRESSION",
  );
  ok(
    "memory conflict group rehydrates through query",
    queryGovernedMemory({ records: conflict.records, tenantId: request.tenantId, principalId: principal.id, purpose: request.purpose, namespacePrefix: ["tenant-acme"], at: AT }),
  );
  const candidateOnly = ok(
    "propose low-confidence candidate memory",
    proposeGovernedMemory({
      records: conflict.records,
      memoryId: "mem-unconfirmed-hypothesis",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "unconfirmed-hypothesis",
      value: "maybe-safe",
      scope: "user",
      principalId: principal.id,
      allowedPurposes: [request.purpose],
      provenance: [{ sourceId: "agent-inference", version: "1", observedAt: AT }],
      confidence: 0.4,
      sensitivity: "internal",
      expiresAt: LATER,
      idempotencyKey: "memory:candidate:v1",
      at: AT,
    }),
  );
  check("low-confidence memory round-trips as candidate", candidateOnly.record.status === "candidate");
  const candidateQuery = ok(
    "query candidate memory",
    queryGovernedMemory({ records: candidateOnly.records, tenantId: request.tenantId, principalId: principal.id, purpose: request.purpose, namespacePrefix: ["tenant-acme"], at: AT }),
  );
  check("candidate memory is not context-visible", !candidateQuery.records.some((entry) => entry.memoryId === candidateOnly.record.memoryId));
  const temporary = ok(
    "propose expiring memory",
    proposeGovernedMemory({
      records: candidateOnly.records,
      memoryId: "mem-temporary-window",
      tenantId: request.tenantId,
      namespace: ["tenant-acme", principal.id],
      subject: "temporary-review-window",
      value: "open",
      scope: "user",
      principalId: principal.id,
      allowedPurposes: [request.purpose],
      provenance: [{ sourceId: "task-ledger", version: "2", observedAt: AT }],
      confidence: 0.99,
      sensitivity: "internal",
      expiresAt: LATER,
      idempotencyKey: "memory:temporary:v1",
      at: AT,
    }),
  );
  const visible = ok(
    "query governed memory",
    queryGovernedMemory({ records: temporary.records, tenantId: request.tenantId, principalId: principal.id, purpose: request.purpose, namespacePrefix: ["tenant-acme"], at: AT }),
  );
  check("only active unexpired memory enters context", visible.records.length === 1 && visible.records[0]?.memoryId === temporary.record.memoryId);
  const expired = ok(
    "query expired governed memory",
    queryGovernedMemory({ records: temporary.records, tenantId: request.tenantId, principalId: principal.id, purpose: request.purpose, namespacePrefix: ["tenant-acme"], at: LATER }),
  );
  check("expired memory is invisible", expired.records.length === 0);
  const wrongTenant = ok(
    "query wrong-tenant governed memory",
    queryGovernedMemory({ records: temporary.records, tenantId: "tenant-other", principalId: principal.id, purpose: request.purpose, namespacePrefix: ["tenant-acme"], at: AT }),
  );
  check("wrong-tenant memory is invisible", wrongTenant.records.length === 0);
  const deleted = ok(
    "delete governed memory",
    deleteGovernedMemory({ records: temporary.records, memoryId: first.record.memoryId, tenantId: request.tenantId, principalId: principal.id, idempotencyKey: "memory:delete:1", at: LATER }),
  );
  check("memory deletion is a tombstone", deleted.record.status === "deleted" && deleted.record.deletedAt === LATER);
  return { ledger: committed.ledger, memories: temporary.records };
}

function multiAgentContracts(assessment: ReturnType<typeof evidenceContracts>): readonly WorkerEvidencePackage[] {
  const roleOnlyEvidence = JSON.parse(JSON.stringify(assessment.evidence[0]!));
  roleOnlyEvidence.id = "ev-policy-role-only";
  roleOnlyEvidence.allowedPrincipalIds = [];
  roleOnlyEvidence.allowedRoles = ["release-reviewer"];
  const { digest: _roleOnlyDigest, ...roleOnlyPayload } = roleOnlyEvidence;
  roleOnlyEvidence.digest = stableDigest(roleOnlyPayload);
  const workerContext = ok(
    "create worker context",
    createWorkerContextPackage({
      assignmentId: "assignment-policy",
      workerId: "policy-reviewer",
      tenantId: request.tenantId,
      principal,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      parentAuthority: authority,
      authority: { tools: ["read_change"], resources: ["repo:agent-build"], actions: ["read"] },
      parentBudget: { maxTokens: 200, maxToolCalls: 4 },
      budget: { maxTokens: 80, maxToolCalls: 1 },
      contextBuildDigest: stableDigest({ context: "policy" }),
      visibleItemIds: ["release-policy"],
      evidenceDelegations: [
        { evidenceId: assessment.evidence[0]!.id, evidenceDigest: assessment.evidence[0]!.digest },
        { evidenceId: roleOnlyEvidence.id, evidenceDigest: roleOnlyEvidence.digest },
      ],
      at: AT,
    }),
  );
  check("worker authority is narrowed", workerContext.authority.tools.length === 1 && workerContext.budget.maxTokens === 80);
  error(
    "worker authority expansion",
    createWorkerContextPackage({
      assignmentId: "assignment-unsafe",
      workerId: "unsafe-worker",
      tenantId: request.tenantId,
      principal,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      parentAuthority: authority,
      authority: { tools: ["deploy_prod"], resources: ["prod"], actions: ["write"] },
      parentBudget: { maxTokens: 200, maxToolCalls: 4 },
      budget: { maxTokens: 80, maxToolCalls: 1 },
      contextBuildDigest: stableDigest({ context: "unsafe" }),
      visibleItemIds: [],
      evidenceDelegations: [],
      at: AT,
    }),
    "WORKER_AUTHORITY_EXPANSION",
  );
  error(
    "worker cannot package same-scope undelegated evidence",
    createWorkerEvidencePackage({
      context: workerContext,
      status: "complete",
      claims: [{ claimId: "ci-health", value: "pass", evidenceIds: [assessment.evidence[1]!.id], confidence: 0.95 }],
      evidence: [assessment.evidence[1]!],
      uncertainties: [],
      consumed: { tokens: 40, toolCalls: 1 },
      traceId: "trace-worker-undelegated",
      at: AT,
    }),
    "WORKER_EVIDENCE_NOT_DELEGATED",
  );
  const policyPackage = ok(
    "create policy evidence package",
    createWorkerEvidencePackage({
      context: workerContext,
      status: "complete",
      claims: [{ claimId: "release-decision", value: "approve", evidenceIds: [assessment.evidence[0]!.id], confidence: 0.95 }],
      evidence: [assessment.evidence[0]!],
      uncertainties: [],
      consumed: { tokens: 50, toolCalls: 1 },
      traceId: "trace-worker-policy",
      at: AT,
    }),
  );
  const futureWorkerEvidence = JSON.parse(JSON.stringify(policyPackage));
  futureWorkerEvidence.evidence[0].provenance.observedAt = LATER;
  const { digest: _futureWorkerEvidenceDigest, ...futureWorkerEvidencePayload } = futureWorkerEvidence.evidence[0];
  futureWorkerEvidence.evidence[0].digest = stableDigest(futureWorkerEvidencePayload);
  futureWorkerEvidence.evidenceDelegations[0].evidenceDigest = futureWorkerEvidence.evidence[0].digest;
  const { digest: _futureWorkerPackageDigest, ...futureWorkerPackagePayload } = futureWorkerEvidence;
  futureWorkerEvidence.digest = stableDigest(futureWorkerPackagePayload);
  error(
    "worker snapshot rejects future delegated evidence",
    validateEnterpriseRuntimeSnapshot(futureWorkerEvidence),
    "INVALID_ENTERPRISE_SNAPSHOT",
  );
  const roleOnlyPackage = ok(
    "worker accepts role-authorized evidence",
    createWorkerEvidencePackage({
      context: workerContext,
      status: "complete",
      claims: [{ claimId: "role-authorization", value: "pass", evidenceIds: [roleOnlyEvidence.id], confidence: 0.95 }],
      evidence: [roleOnlyEvidence],
      uncertainties: [],
      consumed: { tokens: 40, toolCalls: 0 },
      traceId: "trace-worker-role-only",
      at: AT,
    }),
  );
  check("role-only evidence keeps worker scope", roleOnlyPackage.evidence[0]?.allowedRoles?.includes("release-reviewer") === true);
  const crossTenantEvidence = JSON.parse(JSON.stringify(assessment.evidence[0]!));
  crossTenantEvidence.tenantId = "tenant-other";
  const { digest: _crossTenantDigest, ...crossTenantPayload } = crossTenantEvidence;
  crossTenantEvidence.digest = stableDigest(crossTenantPayload);
  error(
    "worker cannot wrap cross-tenant evidence",
    createWorkerEvidencePackage({
      context: workerContext,
      status: "complete",
      claims: [{ claimId: "release-decision", value: "approve", evidenceIds: [crossTenantEvidence.id], confidence: 0.95 }],
      evidence: [crossTenantEvidence],
      uncertainties: [],
      consumed: { tokens: 50, toolCalls: 1 },
      traceId: "trace-worker-cross-tenant",
      at: AT,
    }),
    "WORKER_EVIDENCE_SCOPE_MISMATCH",
  );
  const ciContext = ok(
    "create ci worker context",
    createWorkerContextPackage({
      assignmentId: "assignment-ci",
      workerId: "ci-reviewer",
      tenantId: request.tenantId,
      purpose: request.purpose,
      principal,
      policySnapshot: request.policySnapshot,
      parentAuthority: authority,
      authority: { tools: ["read_ci"], resources: ["ci:agent-build"], actions: ["read"] },
      parentBudget: { maxTokens: 200, maxToolCalls: 4 },
      budget: { maxTokens: 80, maxToolCalls: 1 },
      contextBuildDigest: stableDigest({ context: "ci" }),
      visibleItemIds: ["ci-pass"],
      evidenceDelegations: [
        { evidenceId: assessment.evidence[1]!.id, evidenceDigest: assessment.evidence[1]!.digest },
      ],
      at: AT,
    }),
  );
  const ciPackage = ok(
    "create conflicting ci evidence package",
    createWorkerEvidencePackage({
      context: ciContext,
      status: "complete",
      claims: [{ claimId: "release-decision", value: "block", evidenceIds: [assessment.evidence[1]!.id], confidence: 0.96 }],
      evidence: [assessment.evidence[1]!],
      uncertainties: [],
      consumed: { tokens: 60, toolCalls: 1 },
      traceId: "trace-worker-ci",
      at: AT,
    }),
  );
  const reduced = ok(
    "reduce worker evidence",
    reduceWorkerEvidence({
      tenantId: request.tenantId,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      parentAuthority: authority,
      parentBudget: { maxTokens: 200, maxToolCalls: 4 },
      packages: [policyPackage, ciPackage],
      at: AT,
    }),
  );
  check("reducer preserves explicit conflict", reduced.status === "conflicted" && reduced.conflicts.length === 1);
  check("reducer budget cannot expand", reduced.consumed.tokens === 110 && reduced.consumed.toolCalls === 2);
  error(
    "reducer rejects evidence expired after worker packaging",
    reduceWorkerEvidence({
      tenantId: request.tenantId,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      parentAuthority: authority,
      parentBudget: { maxTokens: 200, maxToolCalls: 4 },
      packages: [policyPackage],
      at: LATER,
    }),
    "WORKER_EVIDENCE_TIME_INVALID",
  );
  const singleWorkerReduction = ok(
    "reduce one worker evidence package",
    reduceWorkerEvidence({
      tenantId: request.tenantId,
      purpose: request.purpose,
      policySnapshot: request.policySnapshot,
      parentAuthority: authority,
      parentBudget: { maxTokens: 200, maxToolCalls: 4 },
      packages: [policyPackage],
      at: AT,
    }),
  );
  const reducedRoundTrip = validateEnterpriseRuntimeSnapshot(JSON.parse(JSON.stringify(singleWorkerReduction)));
  check("non-empty reduced claims rehydrate", reducedRoundTrip.ok);
  const forgedReducedSources = JSON.parse(JSON.stringify(singleWorkerReduction));
  forgedReducedSources.claims[0].sourceIds = ["forged-source"];
  const { digest: _forgedReducedDigest, ...forgedReducedPayload } = forgedReducedSources;
  forgedReducedSources.digest = stableDigest(forgedReducedPayload);
  error(
    "reduced snapshot recomputes claim source ids",
    validateEnterpriseRuntimeSnapshot(forgedReducedSources),
    "INVALID_ENTERPRISE_SNAPSHOT",
  );
  return [policyPackage, ciPackage];
}

function capstoneContracts(
  ledger: ReturnType<typeof stateAndMemoryContracts>["ledger"],
  memories: readonly GovernedMemoryRecord[],
  workerPackages: readonly WorkerEvidencePackage[],
): void {
  const behavior = ok(
    "create capstone behavior bundle",
    createBehaviorBundle({
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
    }),
  );
  const createdRun = ok(
    "create capstone run manifest",
    createRunManifest({
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
      budget: { maxTurns: 8, maxTokens: 4_000, deadline: LATER },
      expectedOutcome: "带证据的人工审批前变更审查结论",
      createdAt: AT,
    }),
  );
  const startedRun = ok(
    "start capstone run",
    transitionRun(createdRun, { type: "start", expectedRevision: 0, at: AT }),
  ).run;
  const input = {
    scenarioId: "production-change-4821",
    at: AT,
    seed: 4821,
    run: startedRun,
    behavior,
    context: { request, candidates: contextCandidates, estimateTokens: (text: string) => Math.max(1, Math.ceil(text.length / 4)) },
    evidence: {
      candidates: evidenceCandidates,
      policySnapshot: request.policySnapshot,
      requirements: [
        { claimId: "policy-compliance", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
        { claimId: "ci-health", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
      ],
    },
    ledger,
    memories,
    multiAgent: {
      parentAuthority: authority,
      parentBudget: { maxTokens: 200, maxToolCalls: 4 },
      packages: workerPackages,
    },
  } as const;
  const review = ok("run capstone host", runProductionChangeReview(input));
  check("conflicting workers force abstention", review.outcome === "ABSTAIN");
  check("capstone binds real A1 and A3 artifacts", review.run.digest === startedRun.digest && review.behavior.digest === behavior.digest);
  check("trace covers run, behavior, and runtime layers", review.trace.spans.length >= 8);
  const replay = ok("replay capstone host", replayProductionChangeReview({ input, expectedDigest: review.digest }));
  check("replay is byte deterministic", replay.matched && replay.actualDigest === review.digest);
  const tampered = JSON.parse(JSON.stringify(review));
  tampered.trace.spans[0].startedAt = 0;
  const { digest: _digest, ...payload } = tampered;
  tampered.digest = stableDigest(payload);
  error("runtime snapshot rejects numeric timestamp", validateEnterpriseRuntimeSnapshot(tampered), "INVALID_ENTERPRISE_SNAPSHOT");
  const forgedTrace = JSON.parse(JSON.stringify(review));
  forgedTrace.trace.spans[0].attributes.status = "forged";
  const { digest: _spanDigest, ...spanPayload } = forgedTrace.trace.spans[0];
  forgedTrace.trace.spans[0].digest = stableDigest(spanPayload);
  const { digest: _traceDigest, ...tracePayload } = forgedTrace.trace;
  forgedTrace.trace.digest = stableDigest(tracePayload);
  const { digest: _reviewDigest, ...reviewPayload } = forgedTrace;
  forgedTrace.digest = stableDigest(reviewPayload);
  error("deterministic trace rejects resigned attributes", validateEnterpriseRuntimeSnapshot(forgedTrace), "INVALID_ENTERPRISE_SNAPSHOT");
  const impossibleTimeline = JSON.parse(JSON.stringify(review));
  impossibleTimeline.run.lastTransitionAt = "2026-08-10T06:01:00.000Z";
  const { digest: _timelineRunDigest, ...timelineRunPayload } = impossibleTimeline.run;
  impossibleTimeline.run.digest = stableDigest(timelineRunPayload);
  impossibleTimeline.trace.spans[0].attributes.digest = impossibleTimeline.run.digest;
  const { digest: _timelineSpanDigest, ...timelineSpanPayload } = impossibleTimeline.trace.spans[0];
  impossibleTimeline.trace.spans[0].digest = stableDigest(timelineSpanPayload);
  const { digest: _timelineTraceDigest, ...timelineTracePayload } = impossibleTimeline.trace;
  impossibleTimeline.trace.digest = stableDigest(timelineTracePayload);
  const { digest: _timelineReviewDigest, ...timelineReviewPayload } = impossibleTimeline;
  impossibleTimeline.digest = stableDigest(timelineReviewPayload);
  error(
    "rehydration rejects review before run transition",
    validateEnterpriseRuntimeSnapshot(impossibleTimeline),
    "INVALID_ENTERPRISE_SNAPSHOT",
  );

  const shadow = ok(
    "safe shadow gate",
    decideRuntimeRollout({
      stage: "shadow",
      baseline: { passRate: 0.95, evidenceCoverage: 0.95, aclViolations: 0, criticalFailures: 0, p95Ms: 1200, costPerTask: 1 },
      candidate: { passRate: 0.98, evidenceCoverage: 1, aclViolations: 0, criticalFailures: 0, p95Ms: 1250, costPerTask: 1.05 },
      thresholds: { minPassRate: 0.95, minEvidenceCoverage: 0.95, maxP95RegressionRatio: 0.2, maxCostRegressionRatio: 0.2 },
      at: AT,
    }),
  );
  check("safe shadow advances to canary", shadow.decision === "advance-to-canary");
  const rolloutRoundTrip = ok(
    "rehydrate rollout decision",
    validateEnterpriseRuntimeSnapshot(JSON.parse(JSON.stringify(shadow))),
  );
  check("rollout snapshot round-trip", rolloutRoundTrip.schemaVersion === "runtime-rollout-decision/v1");
  const blocked = ok(
    "unsafe canary gate",
    decideRuntimeRollout({
      stage: "canary",
      baseline: { passRate: 0.95, evidenceCoverage: 0.95, aclViolations: 0, criticalFailures: 0, p95Ms: 1200, costPerTask: 1 },
      candidate: { passRate: 0.99, evidenceCoverage: 1, aclViolations: 1, criticalFailures: 0, p95Ms: 1100, costPerTask: 0.9 },
      thresholds: { minPassRate: 0.95, minEvidenceCoverage: 0.95, maxP95RegressionRatio: 0.2, maxCostRegressionRatio: 0.2 },
      at: AT,
    }),
  );
  check("ACL violation blocks canary", blocked.decision === "block");
}

function main(): void {
  contextContracts();
  const evidence = evidenceContracts();
  const state = stateAndMemoryContracts();
  const workers = multiAgentContracts(evidence);
  capstoneContracts(state.ledger, state.memories, workers);
  console.log(JSON.stringify({ suite: "agent-engineering-advanced", checks: checks.length, passed: checks.length - failures.length, failed: failures }, null, 2));
  if (failures.length > 0) process.exitCode = 1;
}

try {
  main();
} catch (cause) {
  const message = cause instanceof Error ? cause.message : String(cause);
  console.error(JSON.stringify({ suite: "agent-engineering-advanced", fatal: message, checks: checks.length, failures }, null, 2));
  process.exitCode = 1;
}
