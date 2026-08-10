/** A5 — permission-aware Evidence/Citation/Conflict/Coverage gate. */
import {
  evaluateEvidence,
  type ContractResult,
  type EvidenceCandidate,
  type VersionRef,
} from "../../src/shared/agent/engineering/index.ts";

const AT = "2026-08-10T06:00:00.000Z";
const EXPIRES = "2026-08-10T06:05:00.000Z";
const version = (id: string, value = "1.0.0"): VersionRef => ({ id, version: value, digest: `${id}-${value}-sha256` });
const unwrap = <T>(result: ContractResult<T>): T => {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};
const principal = { id: "release-reviewer-7", roles: ["release-reviewer"], groups: ["platform"] };
const purpose = "production-change-review";
const evidence = (id: string, claimId: string, value: string, sourceId: string): EvidenceCandidate => ({
  id,
  claimId,
  value,
  excerpt: `${claimId}=${value}`,
  citation: { uri: `artifact://${sourceId}`, locator: "result" },
  provenance: { sourceId, version: "2048", observedAt: AT },
  tenantId: "tenant-acme",
  allowedPrincipalIds: [principal.id],
  allowedPurposes: [purpose],
  authorizationDecisionId: `pdp-${id}`,
  authority: 0.95,
  confidence: 0.98,
  observedAt: AT,
  expiresAt: EXPIRES,
});
const requirements = [
  { claimId: "policy-compliance", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
  { claimId: "ci-health", minIndependentSources: 1, minAuthority: 0.9, minConfidence: 0.9 },
];

try {
  const assessment = unwrap(evaluateEvidence({
    tenantId: "tenant-acme",
    principal,
    purpose,
    policySnapshot: version("permission-policy", "7.0.0"),
    at: AT,
    candidates: [
      evidence("ev-policy", "policy-compliance", "pass", "release-policy"),
      evidence("ev-ci", "ci-health", "pass", "ci"),
    ],
    requirements,
  }));
  const denied = unwrap(evaluateEvidence({
    tenantId: "tenant-acme",
    principal,
    purpose,
    policySnapshot: version("permission-policy", "7.0.0"),
    at: AT,
    candidates: [evidence("ev-other", "ci-health", "pass", "other")].map((entry) => ({ ...entry, tenantId: "tenant-other" })),
    requirements: [requirements[1]!],
  }));
  if (assessment.decision !== "proceed" || denied.decision !== "abstain") throw new Error("A5 gate 未按预期工作");
  console.log(JSON.stringify({
    module: "A5",
    decision: assessment.decision,
    coverage: assessment.coverage,
    citations: assessment.evidence.map((entry) => ({ evidenceId: entry.id, citation: entry.citation })),
    conflicts: assessment.conflicts,
    safetyCounterexample: {
      rejected: denied.decision === "abstain",
      code: "ABSTAIN",
      case: "cross-tenant-evidence-filtered",
      missing: denied.coverage.missingClaimIds,
    },
    boundary: "offline deterministic Evidence Gate; no search engine, reranker, PDP, or model claim validation",
  }));
} catch (cause) {
  console.error(JSON.stringify({ module: "A5", fatal: cause instanceof Error ? cause.message : String(cause) }));
  process.exitCode = 1;
}
