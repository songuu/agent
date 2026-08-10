import {
  copyProvenanceRef,
  copyVersionRef,
  deepFreeze,
  isDenseArray,
  reject,
  stableDigest,
  stableSerialize,
  succeed,
  validateArtifactRef,
  validateProvenanceRef,
  validateVersionRef,
  type ArtifactRef,
  type ContractResult,
  type ProvenanceRef,
  type VersionRef,
} from "./contracts";
import {
  compileContext,
  validateCompiledContextSnapshot,
  type CompiledContext,
  type CompiledContextBlock,
  type ContextExclusionReason,
  type ContextItem,
  type ContextKind,
  type ContextPolicy,
  type ContextSensitivity,
} from "./contextCompiler";
import {
  validateBehaviorBundleSnapshot,
  type BehaviorBundle,
} from "./promptRelease";
import {
  validateRunManifestSnapshot,
  type AuthorityScope,
  type RunManifest,
} from "./runLifecycle";

type JsonRecord = Record<string, unknown>;

const CONTEXT_KINDS = new Set<ContextKind>([
  "instruction",
  "session",
  "memory",
  "artifact",
  "retrieval",
  "tool",
  "handoff",
]);
const CONTEXT_ROLES = new Set(["control", "data"]);
const CONTEXT_TRUST = new Set(["untrusted", "reviewed", "trusted"]);
const CONTEXT_SENSITIVITY = new Set<ContextSensitivity>(["public", "internal", "restricted", "secret"]);
const MEMORY_SCOPES = new Set<MemoryScope>(["user", "team", "task", "org"]);
const MEMORY_STATUSES = new Set<MemoryStatus>(["candidate", "active", "disputed", "superseded", "deleted"]);

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function finiteTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function finiteUnit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function exactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function denseUniqueStrings(value: unknown, allowEmpty = true): value is readonly string[] {
  return (
    isDenseArray(value) &&
    (allowEmpty || value.length > 0) &&
    value.every(nonEmpty) &&
    new Set(value).size === value.length
  );
}

function copyJson<T>(value: T): T {
  return JSON.parse(stableSerialize(value)) as T;
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function isSubset(child: readonly string[], parent: readonly string[]): boolean {
  const allowed = new Set(parent);
  return child.every((entry) => allowed.has(entry));
}

function validateAuthority(value: unknown): value is AuthorityScope {
  if (!isRecord(value)) return false;
  return (
    exactKeys(value, ["tools", "resources", "actions"]) &&
    denseUniqueStrings(value.tools) &&
    denseUniqueStrings(value.resources) &&
    denseUniqueStrings(value.actions)
  );
}

function copyAuthority(value: AuthorityScope): AuthorityScope {
  return { tools: [...value.tools], resources: [...value.resources], actions: [...value.actions] };
}

function copyArtifact(value: ArtifactRef): ArtifactRef {
  return {
    id: value.id,
    version: value.version,
    digest: value.digest,
    ...(value.location ? { location: value.location } : {}),
  };
}

function authoritySubset(child: AuthorityScope, parent: AuthorityScope): boolean {
  return (
    isSubset(child.tools, parent.tools) &&
    isSubset(child.resources, parent.resources) &&
    isSubset(child.actions, parent.actions)
  );
}

function validateDigest(payload: JsonRecord, digest: unknown): boolean {
  return nonEmpty(digest) && stableDigest(payload) === digest;
}

function permissionDigest(input: {
  tenantId: string;
  principal: EnterprisePrincipal;
  purpose: string;
  policySnapshot: VersionRef;
}): string {
  return stableDigest({
    tenantId: input.tenantId,
    principal: {
      id: input.principal.id,
      roles: sorted(input.principal.roles),
      groups: sorted(input.principal.groups),
    },
    purpose: input.purpose,
    policySnapshot: input.policySnapshot,
  });
}

export interface EnterprisePrincipal {
  id: string;
  roles: readonly string[];
  groups: readonly string[];
}

export interface EnterpriseContextRequest {
  requestId: string;
  runId: string;
  tenantId: string;
  principal: EnterprisePrincipal;
  purpose: string;
  stage: string;
  query: string;
  requestedAt: string;
  deadlineAt: string;
  policySnapshot: VersionRef;
  modelProfile: VersionRef;
  toolset: VersionRef;
  indexSnapshot: VersionRef;
  stateRevision: number;
  freshnessBucket: string;
  safetyReserve: number;
  contextPolicy: ContextPolicy;
}

export interface EnterpriseContextCandidate {
  item: ContextItem;
  tenantId: string;
  allowedPrincipalIds: readonly string[];
  allowedRoles?: readonly string[];
  allowedPurposes: readonly string[];
  authorizationDecisionId: string;
}

export type EnterpriseAuthorizationReason =
  | "allowed"
  | "tenant-mismatch"
  | "principal-denied"
  | "purpose-denied";

export interface EnterpriseContextDecision {
  itemId: string;
  authorized: boolean;
  authorizationDecisionId: string;
  authorizationReason: EnterpriseAuthorizationReason;
  selected: boolean;
  selectionReason: ContextExclusionReason | "authorization-denied";
  source: ProvenanceRef;
}

export interface EnterpriseBudgetReport {
  maxInputTokens: number;
  completionReserve: number;
  safetyReserve: number;
  availableInputTokens: number;
  usedInputTokens: number;
  remainingInputTokens: number;
  byKind: Readonly<Partial<Record<ContextKind, number>>>;
  digest: string;
}

export interface EnterpriseContextFingerprint {
  permissionDigest: string;
  semanticDigest: string;
  digest: string;
}

export interface EnterpriseContextPackage {
  packageId: string;
  requestId: string;
  tenantId: string;
  principalId: string;
  purpose: string;
  permissionDigest: string;
  policySnapshot: VersionRef;
  fingerprintDigest: string;
  blocks: readonly CompiledContextBlock[];
  expiresAt: string;
  digest: string;
}

export interface EnterpriseContextManifest {
  manifestId: string;
  requestId: string;
  policySnapshot: VersionRef;
  candidateLedger: readonly {
    itemId: string;
    candidateDigest: string;
  }[];
  decisions: readonly EnterpriseContextDecision[];
  compiledContextDigest: string;
  budgetDigest: string;
  fingerprintDigest: string;
  digest: string;
}

export interface EnterpriseContextBuild {
  schemaVersion: "enterprise-context-build/v1";
  request: EnterpriseContextRequest;
  compiledContext: CompiledContext;
  package: EnterpriseContextPackage;
  manifest: EnterpriseContextManifest;
  fingerprint: EnterpriseContextFingerprint;
  budget: EnterpriseBudgetReport;
  digest: string;
}

export interface BuildEnterpriseContextInput {
  request: EnterpriseContextRequest;
  candidates: readonly EnterpriseContextCandidate[];
  estimateTokens: (content: string) => number;
}

function validatePrincipal(value: unknown): value is EnterprisePrincipal {
  if (!isRecord(value)) return false;
  return (
    exactKeys(value, ["id", "roles", "groups"]) &&
    nonEmpty(value.id) &&
    denseUniqueStrings(value.roles) &&
    denseUniqueStrings(value.groups)
  );
}

function validateContextPolicyEnvelope(value: unknown): value is ContextPolicy {
  if (!isRecord(value)) return false;
  const allowedKeys = new Set([
    "ref",
    "tokenBudget",
    "completionReserve",
    "allowedKinds",
    "minimumTrust",
    "maximumSensitivity",
    "audience",
    "requiredEvidenceIds",
    "sourcePrecedence",
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;
  return (
    isRecord(value.ref) &&
    Number.isSafeInteger(value.tokenBudget) &&
    (value.tokenBudget as number) > 0 &&
    Number.isSafeInteger(value.completionReserve) &&
    (value.completionReserve as number) >= 0 &&
    denseUniqueStrings(value.allowedKinds, false) &&
    value.allowedKinds.every((kind) => CONTEXT_KINDS.has(kind as ContextKind)) &&
    CONTEXT_TRUST.has(value.minimumTrust as string) &&
    CONTEXT_SENSITIVITY.has(value.maximumSensitivity as ContextSensitivity) &&
    nonEmpty(value.audience) &&
    denseUniqueStrings(value.requiredEvidenceIds) &&
    (value.sourcePrecedence === undefined || denseUniqueStrings(value.sourcePrecedence))
  );
}

function validateContextRequest(value: unknown): ContractResult<EnterpriseContextRequest> {
  if (!isRecord(value) || !exactKeys(value, [
    "requestId",
    "runId",
    "tenantId",
    "principal",
    "purpose",
    "stage",
    "query",
    "requestedAt",
    "deadlineAt",
    "policySnapshot",
    "modelProfile",
    "toolset",
    "indexSnapshot",
    "stateRevision",
    "freshnessBucket",
    "safetyReserve",
    "contextPolicy",
  ])) {
    return reject("INVALID_ENTERPRISE_CONTEXT_REQUEST", "enterprise context request has an invalid schema");
  }
  if (
    !nonEmpty(value.requestId) ||
    !nonEmpty(value.runId) ||
    !nonEmpty(value.tenantId) ||
    !validatePrincipal(value.principal) ||
    !nonEmpty(value.purpose) ||
    !nonEmpty(value.stage) ||
    !nonEmpty(value.query) ||
    !finiteTimestamp(value.requestedAt) ||
    !finiteTimestamp(value.deadlineAt) ||
    Date.parse(value.deadlineAt) <= Date.parse(value.requestedAt) ||
    !Number.isSafeInteger(value.stateRevision) ||
    (value.stateRevision as number) < 0 ||
    !nonEmpty(value.freshnessBucket) ||
    !Number.isSafeInteger(value.safetyReserve) ||
    (value.safetyReserve as number) < 0 ||
    !validateContextPolicyEnvelope(value.contextPolicy)
  ) {
    return reject("INVALID_ENTERPRISE_CONTEXT_REQUEST", "enterprise context request contains invalid runtime values");
  }
  for (const [field, ref] of [
    ["policySnapshot", value.policySnapshot],
    ["modelProfile", value.modelProfile],
    ["toolset", value.toolset],
    ["indexSnapshot", value.indexSnapshot],
    ["contextPolicy.ref", (value.contextPolicy as ContextPolicy).ref],
  ] as const) {
    const validation = validateVersionRef(ref, `enterpriseContextRequest.${field}`);
    if (!validation.ok) return reject("INVALID_ENTERPRISE_CONTEXT_REQUEST", `invalid ${field}`, { cause: validation.error.code });
  }
  const policy = value.contextPolicy as ContextPolicy;
  if ((value.safetyReserve as number) + policy.completionReserve >= policy.tokenBudget) {
    return reject("INVALID_ENTERPRISE_CONTEXT_REQUEST", "completion and safety reserves must leave positive input capacity");
  }
  return succeed(value as unknown as EnterpriseContextRequest);
}

function validateContextItemEnvelope(value: unknown): value is ContextItem {
  if (!isRecord(value)) return false;
  const allowedKeys = new Set([
    "id", "kind", "role", "content", "priority", "mandatory", "trust", "sensitivity", "audience",
    "stages", "stable", "observedAt", "expiresAt", "dedupeKey", "provenance",
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;
  return (
    nonEmpty(value.id) &&
    CONTEXT_KINDS.has(value.kind as ContextKind) &&
    CONTEXT_ROLES.has(value.role as string) &&
    typeof value.content === "string" &&
    typeof value.priority === "number" &&
    Number.isFinite(value.priority) &&
    typeof value.mandatory === "boolean" &&
    CONTEXT_TRUST.has(value.trust as string) &&
    CONTEXT_SENSITIVITY.has(value.sensitivity as ContextSensitivity) &&
    denseUniqueStrings(value.audience) &&
    denseUniqueStrings(value.stages) &&
    typeof value.stable === "boolean" &&
    finiteTimestamp(value.observedAt) &&
    (value.expiresAt === undefined || finiteTimestamp(value.expiresAt)) &&
    (value.dedupeKey === undefined || nonEmpty(value.dedupeKey)) &&
    validateProvenanceRef(value.provenance, "enterpriseContextCandidate.item.provenance").ok
  );
}

function validateContextCandidate(value: unknown): value is EnterpriseContextCandidate {
  if (!isRecord(value)) return false;
  const keys = ["item", "tenantId", "allowedPrincipalIds", "allowedPurposes", "authorizationDecisionId"];
  if (value.allowedRoles !== undefined) keys.push("allowedRoles");
  return (
    exactKeys(value, keys) &&
    validateContextItemEnvelope(value.item) &&
    nonEmpty(value.tenantId) &&
    denseUniqueStrings(value.allowedPrincipalIds) &&
    (value.allowedRoles === undefined || denseUniqueStrings(value.allowedRoles)) &&
    denseUniqueStrings(value.allowedPurposes, false) &&
    nonEmpty(value.authorizationDecisionId)
  );
}

function authorizationFor(
  request: EnterpriseContextRequest,
  candidate: EnterpriseContextCandidate,
): EnterpriseAuthorizationReason {
  if (candidate.tenantId !== request.tenantId) return "tenant-mismatch";
  const roleAllowed = candidate.allowedRoles?.some((role) => request.principal.roles.includes(role)) ?? false;
  if (!candidate.allowedPrincipalIds.includes(request.principal.id) && !roleAllowed) return "principal-denied";
  if (!candidate.allowedPurposes.includes(request.purpose)) return "purpose-denied";
  return "allowed";
}

function fingerprintPayload(request: EnterpriseContextRequest, compiled: CompiledContext): JsonRecord {
  return {
    tenantId: request.tenantId,
    permissionDigest: permissionDigest(request),
    purpose: request.purpose,
    query: request.query,
    policySnapshot: request.policySnapshot,
    contextPolicy: request.contextPolicy.ref,
    modelProfile: request.modelProfile,
    toolset: request.toolset,
    indexSnapshot: request.indexSnapshot,
    stateRevision: request.stateRevision,
    freshnessBucket: request.freshnessBucket,
    budget: {
      tokenBudget: request.contextPolicy.tokenBudget,
      completionReserve: request.contextPolicy.completionReserve,
      safetyReserve: request.safetyReserve,
    },
    sources: compiled.blocks
      .map((block) => ({
        itemId: block.id,
        sourceId: block.provenance.sourceId,
        version: block.provenance.version,
      }))
      .sort((left, right) => left.itemId.localeCompare(right.itemId)),
    compiledContextDigest: compiled.digest,
  };
}

function makeBudgetReport(request: EnterpriseContextRequest, compiled: CompiledContext): EnterpriseBudgetReport {
  const byKind: Partial<Record<ContextKind, number>> = {};
  for (const block of compiled.blocks) byKind[block.kind] = (byKind[block.kind] ?? 0) + block.tokenEstimate;
  const payload = {
    maxInputTokens: request.contextPolicy.tokenBudget,
    completionReserve: request.contextPolicy.completionReserve,
    safetyReserve: request.safetyReserve,
    availableInputTokens:
      request.contextPolicy.tokenBudget - request.contextPolicy.completionReserve - request.safetyReserve,
    usedInputTokens: compiled.usedTokens,
    remainingInputTokens:
      request.contextPolicy.tokenBudget -
      request.contextPolicy.completionReserve -
      request.safetyReserve -
      compiled.usedTokens,
    byKind,
  };
  return { ...payload, digest: stableDigest(payload) };
}

export function buildEnterpriseContext(
  input: BuildEnterpriseContextInput,
): ContractResult<EnterpriseContextBuild> {
  if (!isRecord(input) || !exactKeys(input, ["request", "candidates", "estimateTokens"])) {
    return reject("INVALID_ENTERPRISE_CONTEXT_INPUT", "context build input has an invalid schema");
  }
  const requestValidation = validateContextRequest(input.request);
  if (!requestValidation.ok) return requestValidation;
  const request = requestValidation.value;
  if (!isDenseArray(input.candidates) || !input.candidates.every(validateContextCandidate)) {
    return reject("INVALID_ENTERPRISE_CONTEXT_CANDIDATE", "context candidates require exact runtime-validated envelopes");
  }
  if (typeof input.estimateTokens !== "function") {
    return reject("INVALID_ENTERPRISE_CONTEXT_INPUT", "context build requires an injected tokenizer");
  }
  const ids = input.candidates.map((candidate) => candidate.item.id);
  if (new Set(ids).size !== ids.length) {
    return reject("DUPLICATE_ENTERPRISE_CONTEXT_ID", "enterprise context candidate ids must be unique");
  }
  const authorized: EnterpriseContextCandidate[] = [];
  const authDecisions = new Map<string, { reason: EnterpriseAuthorizationReason; candidate: EnterpriseContextCandidate }>();
  for (const candidate of input.candidates) {
    if (Date.parse(candidate.item.observedAt) > Date.parse(request.requestedAt)) {
      return reject("INVALID_ENTERPRISE_CONTEXT_CANDIDATE", `candidate ${candidate.item.id} is from the future`);
    }
    const reason = authorizationFor(request, candidate);
    authDecisions.set(candidate.item.id, { reason, candidate });
    if (reason === "allowed") authorized.push(candidate);
    else if (candidate.item.mandatory) {
      return reject("MANDATORY_AUTHORIZATION_DENIED", `mandatory context ${candidate.item.id} is not authorized`, {
        itemId: candidate.item.id,
        reason,
        decisionId: candidate.authorizationDecisionId,
      });
    }
  }
  const compilerPolicy: ContextPolicy = {
    ...request.contextPolicy,
    tokenBudget: request.contextPolicy.tokenBudget - request.safetyReserve,
    allowedKinds: [...request.contextPolicy.allowedKinds],
    requiredEvidenceIds: [...request.contextPolicy.requiredEvidenceIds],
    ...(request.contextPolicy.sourcePrecedence ? { sourcePrecedence: [...request.contextPolicy.sourcePrecedence] } : {}),
  };
  const compiledResult = compileContext({
    runId: request.runId,
    stage: request.stage,
    now: request.requestedAt,
    items: authorized.map((candidate) => candidate.item),
    policy: compilerPolicy,
    estimateTokens: input.estimateTokens,
  });
  if (!compiledResult.ok) return compiledResult;
  const compiledContext = compiledResult.value;
  const ledgerById = new Map(compiledContext.ledger.map((entry) => [entry.itemId, entry]));
  const decisions: EnterpriseContextDecision[] = input.candidates.map((candidate) => {
    const auth = authDecisions.get(candidate.item.id)!;
    const ledger = ledgerById.get(candidate.item.id);
    return {
      itemId: candidate.item.id,
      authorized: auth.reason === "allowed",
      authorizationDecisionId: candidate.authorizationDecisionId,
      authorizationReason: auth.reason,
      selected: ledger?.included ?? false,
      selectionReason: ledger?.reason ?? "authorization-denied",
      source: copyProvenanceRef(candidate.item.provenance),
    };
  });
  const semanticPayload = fingerprintPayload(request, compiledContext);
  const semanticDigest = stableDigest(semanticPayload);
  const fingerprintPayloadValue = {
    permissionDigest: permissionDigest(request),
    semanticDigest,
  };
  const fingerprint: EnterpriseContextFingerprint = {
    ...fingerprintPayloadValue,
    digest: stableDigest(fingerprintPayloadValue),
  };
  const budget = makeBudgetReport(request, compiledContext);
  if (budget.remainingInputTokens < 0) {
    return reject("CONTEXT_BUDGET_EXCEEDED", "compiled context consumed the safety reserve");
  }
  const packagePayload = {
    packageId: `ctxpkg-${fingerprint.digest.slice(7, 23)}`,
    requestId: request.requestId,
    tenantId: request.tenantId,
    principalId: request.principal.id,
    purpose: request.purpose,
    permissionDigest: fingerprint.permissionDigest,
    policySnapshot: copyVersionRef(request.policySnapshot),
    fingerprintDigest: fingerprint.digest,
    blocks: compiledContext.blocks.map(copyJson),
    expiresAt: request.deadlineAt,
  };
  const contextPackage: EnterpriseContextPackage = {
    ...packagePayload,
    digest: stableDigest(packagePayload),
  };
  const candidateLedger = input.candidates.map((candidate) => ({
    itemId: candidate.item.id,
    candidateDigest: stableDigest(candidate),
  }));
  const manifestPayload = {
    manifestId: `ctxman-${stableDigest({ candidateLedger, decisions }).slice(7, 23)}`,
    requestId: request.requestId,
    policySnapshot: copyVersionRef(request.policySnapshot),
    candidateLedger,
    decisions,
    compiledContextDigest: compiledContext.digest,
    budgetDigest: budget.digest,
    fingerprintDigest: fingerprint.digest,
  };
  const manifest: EnterpriseContextManifest = {
    ...manifestPayload,
    digest: stableDigest(manifestPayload),
  };
  const payload = {
    schemaVersion: "enterprise-context-build/v1" as const,
    request: copyJson(request),
    compiledContext,
    package: contextPackage,
    manifest,
    fingerprint,
    budget,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

export interface EvidenceCitation {
  uri: string;
  locator: string;
}

export interface EvidenceCandidate {
  id: string;
  claimId: string;
  value: string;
  excerpt: string;
  citation: EvidenceCitation;
  provenance: ProvenanceRef;
  tenantId: string;
  allowedPrincipalIds: readonly string[];
  allowedRoles?: readonly string[];
  allowedPurposes: readonly string[];
  authorizationDecisionId: string;
  authority: number;
  confidence: number;
  observedAt: string;
  expiresAt?: string;
}

export interface EvidenceRequirement {
  claimId: string;
  minIndependentSources: number;
  minAuthority: number;
  minConfidence: number;
}

export interface VerifiedEvidence extends EvidenceCandidate {
  permissionDigest: string;
  digest: string;
}

export interface EvidenceConflict {
  claimId: string;
  values: readonly string[];
  evidenceIds: readonly string[];
}

export interface EvidenceCoverage {
  requiredClaimIds: readonly string[];
  coveredClaimIds: readonly string[];
  missingClaimIds: readonly string[];
  ratio: number;
}

export interface EvidenceAssessment {
  schemaVersion: "evidence-assessment/v1";
  tenantId: string;
  principal: EnterprisePrincipal;
  principalId: string;
  purpose: string;
  policySnapshot: VersionRef;
  permissionDigest: string;
  evaluatedAt: string;
  decision: "proceed" | "abstain";
  evidence: readonly VerifiedEvidence[];
  denied: readonly {
    candidateId: string;
    authorizationDecisionId: string;
    reason: "tenant-mismatch" | "principal-denied" | "purpose-denied" | "expired";
  }[];
  conflicts: readonly EvidenceConflict[];
  requirements: readonly EvidenceRequirement[];
  coverage: EvidenceCoverage;
  digest: string;
}

export interface EvaluateEvidenceInput {
  tenantId: string;
  principal: EnterprisePrincipal;
  purpose: string;
  policySnapshot: VersionRef;
  at: string;
  candidates: readonly EvidenceCandidate[];
  requirements: readonly EvidenceRequirement[];
}

function validateEvidenceCandidate(value: unknown): value is EvidenceCandidate {
  if (!isRecord(value)) return false;
  const keys = [
    "id", "claimId", "value", "excerpt", "citation", "provenance", "tenantId", "allowedPrincipalIds",
    "allowedPurposes", "authorizationDecisionId", "authority", "confidence", "observedAt",
  ];
  if (value.allowedRoles !== undefined) keys.push("allowedRoles");
  if (value.expiresAt !== undefined) keys.push("expiresAt");
  return (
    exactKeys(value, keys) &&
    nonEmpty(value.id) &&
    nonEmpty(value.claimId) &&
    nonEmpty(value.value) &&
    nonEmpty(value.excerpt) &&
    isRecord(value.citation) &&
    exactKeys(value.citation, ["uri", "locator"]) &&
    nonEmpty(value.citation.uri) &&
    nonEmpty(value.citation.locator) &&
    validateProvenanceRef(value.provenance, "evidenceCandidate.provenance").ok &&
    nonEmpty(value.tenantId) &&
    denseUniqueStrings(value.allowedPrincipalIds) &&
    (value.allowedRoles === undefined || denseUniqueStrings(value.allowedRoles)) &&
    denseUniqueStrings(value.allowedPurposes, false) &&
    nonEmpty(value.authorizationDecisionId) &&
    finiteUnit(value.authority) &&
    finiteUnit(value.confidence) &&
    finiteTimestamp(value.observedAt) &&
    (value.expiresAt === undefined || finiteTimestamp(value.expiresAt))
  );
}

function evidenceIndependenceIdentity(entry: EvidenceCandidate): {
  lineageKey: string;
  citationRootKey: string;
  citationContentKey: string;
} {
  const citationRoot = entry.citation.uri.split(/[?#]/u, 1)[0]!.replace(/\/+$/u, "");
  return {
    lineageKey: stableDigest({ sourceId: entry.provenance.sourceId }),
    citationRootKey: stableDigest({ uri: citationRoot }),
    citationContentKey: stableDigest({
      content: {
        claimId: entry.claimId,
        value: entry.value,
        excerpt: entry.excerpt,
      },
    }),
  };
}

/**
 * Conservatively counts connected provenance groups. Sharing either the declared
 * lineage or the same cited content makes two records dependent; changing only a
 * caller-controlled source alias therefore cannot fabricate corroboration.
 */
function independentEvidenceCount(entries: readonly VerifiedEvidence[]): number {
  const identities = entries.map(evidenceIndependenceIdentity);
  const parents = identities.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root]!;
    while (parents[index] !== index) {
      const next = parents[index]!;
      parents[index] = root;
      index = next;
    }
    return root;
  };
  const join = (left: number, right: number): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };
  for (let left = 0; left < identities.length; left += 1) {
    for (let right = left + 1; right < identities.length; right += 1) {
      const leftIdentity = identities[left]!;
      const rightIdentity = identities[right]!;
      if (
        leftIdentity.lineageKey === rightIdentity.lineageKey ||
        leftIdentity.citationRootKey === rightIdentity.citationRootKey ||
        leftIdentity.citationContentKey === rightIdentity.citationContentKey
      ) {
        join(left, right);
      }
    }
  }
  return new Set(identities.map((_, index) => find(index))).size;
}

function evidenceAuthorizationReason(
  input: EvaluateEvidenceInput,
  candidate: EvidenceCandidate,
): "allowed" | "tenant-mismatch" | "principal-denied" | "purpose-denied" | "expired" {
  if (candidate.tenantId !== input.tenantId) return "tenant-mismatch";
  const roleAllowed = candidate.allowedRoles?.some((role) => input.principal.roles.includes(role)) ?? false;
  if (!candidate.allowedPrincipalIds.includes(input.principal.id) && !roleAllowed) return "principal-denied";
  if (!candidate.allowedPurposes.includes(input.purpose)) return "purpose-denied";
  if (candidate.expiresAt && Date.parse(candidate.expiresAt) <= Date.parse(input.at)) return "expired";
  return "allowed";
}

export function evaluateEvidence(input: EvaluateEvidenceInput): ContractResult<EvidenceAssessment> {
  if (!isRecord(input) || !exactKeys(input, ["tenantId", "principal", "purpose", "policySnapshot", "at", "candidates", "requirements"])) {
    return reject("INVALID_EVIDENCE_INPUT", "evidence evaluation input has an invalid schema");
  }
  if (
    !nonEmpty(input.tenantId) ||
    !validatePrincipal(input.principal) ||
    !nonEmpty(input.purpose) ||
    !validateVersionRef(input.policySnapshot, "evaluateEvidence.policySnapshot").ok ||
    !finiteTimestamp(input.at) ||
    !isDenseArray(input.candidates) ||
    !input.candidates.every(validateEvidenceCandidate) ||
    !isDenseArray(input.requirements) ||
    !input.requirements.every(
      (requirement) =>
        isRecord(requirement) &&
        exactKeys(requirement, ["claimId", "minIndependentSources", "minAuthority", "minConfidence"]) &&
        nonEmpty(requirement.claimId) &&
        Number.isSafeInteger(requirement.minIndependentSources) &&
        requirement.minIndependentSources > 0 &&
        finiteUnit(requirement.minAuthority) &&
        finiteUnit(requirement.minConfidence),
    )
  ) {
    return reject("INVALID_EVIDENCE_INPUT", "evidence evaluation contains invalid runtime values");
  }
  const candidateIds = input.candidates.map((candidate) => candidate.id);
  const claimIds = input.requirements.map((requirement) => requirement.claimId);
  if (claimIds.length === 0 || new Set(candidateIds).size !== candidateIds.length || new Set(claimIds).size !== claimIds.length) {
    return reject("INVALID_EVIDENCE_INPUT", "evidence candidate and requirement ids must be unique");
  }
  const denied: EvidenceAssessment["denied"] extends readonly (infer T)[] ? T[] : never = [];
  const evidence: VerifiedEvidence[] = [];
  const scopeDigest = permissionDigest({
    tenantId: input.tenantId,
    principal: input.principal,
    purpose: input.purpose,
    policySnapshot: input.policySnapshot,
  });
  for (const candidate of input.candidates) {
    if (Date.parse(candidate.observedAt) > Date.parse(input.at) || Date.parse(candidate.provenance.observedAt) > Date.parse(input.at)) {
      return reject("INVALID_EVIDENCE_TIME", `evidence ${candidate.id} is from the future`, { candidateId: candidate.id });
    }
    const reason = evidenceAuthorizationReason(input, candidate);
    if (reason !== "allowed") {
      denied.push({
        candidateId: candidate.id,
        authorizationDecisionId: candidate.authorizationDecisionId,
        reason,
      });
      continue;
    }
    const copied = {
      ...copyJson(candidate),
      permissionDigest: scopeDigest,
    };
    evidence.push({ ...copied, digest: stableDigest(copied) });
  }
  evidence.sort(
    (left, right) =>
      right.authority - left.authority ||
      right.confidence - left.confidence ||
      left.id.localeCompare(right.id),
  );
  const conflicts: EvidenceConflict[] = [];
  const claimGroups = new Map<string, VerifiedEvidence[]>();
  for (const entry of evidence) {
    const group = claimGroups.get(entry.claimId) ?? [];
    group.push(entry);
    claimGroups.set(entry.claimId, group);
  }
  for (const [claimId, group] of claimGroups) {
    const values = [...new Set(group.map((entry) => entry.value))].sort();
    if (values.length > 1) {
      conflicts.push({
        claimId,
        values,
        evidenceIds: group.map((entry) => entry.id).sort(),
      });
    }
  }
  conflicts.sort((left, right) => left.claimId.localeCompare(right.claimId));
  const conflictIds = new Set(conflicts.map((conflict) => conflict.claimId));
  const coveredClaimIds: string[] = [];
  const missingClaimIds: string[] = [];
  for (const requirement of input.requirements) {
    const group = (claimGroups.get(requirement.claimId) ?? []).filter(
      (entry) => entry.authority >= requirement.minAuthority && entry.confidence >= requirement.minConfidence,
    );
    if (!conflictIds.has(requirement.claimId) && independentEvidenceCount(group) >= requirement.minIndependentSources) {
      coveredClaimIds.push(requirement.claimId);
    } else {
      missingClaimIds.push(requirement.claimId);
    }
  }
  const coverage: EvidenceCoverage = {
    requiredClaimIds: [...claimIds],
    coveredClaimIds,
    missingClaimIds,
    ratio: claimIds.length === 0 ? 1 : coveredClaimIds.length / claimIds.length,
  };
  const payload = {
    schemaVersion: "evidence-assessment/v1" as const,
    tenantId: input.tenantId,
    principal: copyJson(input.principal),
    principalId: input.principal.id,
    purpose: input.purpose,
    policySnapshot: copyVersionRef(input.policySnapshot),
    permissionDigest: scopeDigest,
    evaluatedAt: input.at,
    decision: (missingClaimIds.length === 0 && conflicts.length === 0 ? "proceed" : "abstain") as
      | "proceed"
      | "abstain",
    evidence,
    denied,
    conflicts,
    requirements: input.requirements.map(copyJson),
    coverage,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

export interface TaskVerifiedFact {
  claim: string;
  evidenceIds: readonly string[];
  sourceRefs: readonly ProvenanceRef[];
}

export interface TaskDecision {
  decision: string;
  reason: string;
  actor: string;
  at: string;
}

export interface TaskCheckpoint {
  checkpointId: string;
  revision: number;
  evidenceIds: readonly string[];
  artifactRefs: readonly ArtifactRef[];
  createdAt: string;
}

export interface TaskIdempotencyRecord {
  key: string;
  operation: "commit" | "checkpoint";
  payloadDigest: string;
  appliedRevision: number;
}

export type TaskLedgerStatus = "created" | "running" | "waiting" | "blocked" | "completed";

export interface TaskLedger {
  schemaVersion: "task-ledger/v1";
  taskId: string;
  tenantId: string;
  goal: string;
  successCriteria: readonly string[];
  authority: AuthorityScope;
  policySnapshot: VersionRef;
  revision: number;
  status: TaskLedgerStatus;
  currentStep: string;
  verifiedFacts: readonly TaskVerifiedFact[];
  decisions: readonly TaskDecision[];
  openQuestions: readonly string[];
  checkpoints: readonly TaskCheckpoint[];
  idempotency: readonly TaskIdempotencyRecord[];
  createdAt: string;
  updatedAt: string;
  digest: string;
}

export interface CreateTaskLedgerInput {
  taskId: string;
  tenantId: string;
  goal: string;
  successCriteria: readonly string[];
  authority: AuthorityScope;
  policySnapshot: VersionRef;
  createdAt: string;
}

export interface TaskLedgerPatch {
  status?: TaskLedgerStatus;
  currentStep?: string;
  verifiedFacts?: readonly TaskVerifiedFact[];
  decisions?: readonly TaskDecision[];
  openQuestions?: readonly string[];
}

export interface CommitTaskLedgerInput {
  expectedRevision: number;
  idempotencyKey: string;
  at: string;
  patch: TaskLedgerPatch;
}

export interface CheckpointTaskLedgerInput {
  expectedRevision: number;
  idempotencyKey: string;
  checkpointId: string;
  at: string;
  evidenceIds: readonly string[];
  artifactRefs: readonly ArtifactRef[];
}

export interface TaskLedgerMutation {
  ledger: TaskLedger;
  replayed: boolean;
}

function validateVerifiedFact(value: unknown, at: string): value is TaskVerifiedFact {
  if (!isRecord(value) || !exactKeys(value, ["claim", "evidenceIds", "sourceRefs"])) return false;
  if (!nonEmpty(value.claim) || !denseUniqueStrings(value.evidenceIds, false) || !isDenseArray(value.sourceRefs) || value.sourceRefs.length === 0) {
    return false;
  }
  return value.sourceRefs.every((source) => {
    const result = validateProvenanceRef(source, "taskLedger.verifiedFact.sourceRef");
    return result.ok && Date.parse(result.value.observedAt) <= Date.parse(at);
  });
}

function validateTaskDecision(value: unknown, at: string): value is TaskDecision {
  return (
    isRecord(value) &&
    exactKeys(value, ["decision", "reason", "actor", "at"]) &&
    nonEmpty(value.decision) &&
    nonEmpty(value.reason) &&
    nonEmpty(value.actor) &&
    finiteTimestamp(value.at) &&
    Date.parse(value.at) <= Date.parse(at)
  );
}

function validateTaskLedger(value: unknown): ContractResult<TaskLedger> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "taskId", "tenantId", "goal", "successCriteria", "authority", "policySnapshot", "revision", "status",
    "currentStep", "verifiedFacts", "decisions", "openQuestions", "checkpoints", "idempotency", "createdAt",
    "updatedAt", "digest",
  ])) {
    return reject("INVALID_TASK_LEDGER", "task ledger has an invalid schema");
  }
  if (
    value.schemaVersion !== "task-ledger/v1" ||
    !nonEmpty(value.taskId) ||
    !nonEmpty(value.tenantId) ||
    !nonEmpty(value.goal) ||
    !denseUniqueStrings(value.successCriteria, false) ||
    !validateAuthority(value.authority) ||
    !validateVersionRef(value.policySnapshot, "taskLedger.policySnapshot").ok ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 0 ||
    !["created", "running", "waiting", "blocked", "completed"].includes(value.status as string) ||
    !nonEmpty(value.currentStep) ||
    !isDenseArray(value.verifiedFacts) ||
    !isDenseArray(value.decisions) ||
    !denseUniqueStrings(value.openQuestions) ||
    !isDenseArray(value.checkpoints) ||
    !isDenseArray(value.idempotency) ||
    !finiteTimestamp(value.createdAt) ||
    !finiteTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)
  ) {
    return reject("INVALID_TASK_LEDGER", "task ledger contains invalid runtime values");
  }
  const updatedAt = value.updatedAt as string;
  if (!value.verifiedFacts.every((fact) => validateVerifiedFact(fact, updatedAt))) {
    return reject("INVALID_TASK_LEDGER", "task ledger contains an invalid verified fact");
  }
  if (!value.decisions.every((decision) => validateTaskDecision(decision, updatedAt))) {
    return reject("INVALID_TASK_LEDGER", "task ledger contains an invalid decision");
  }
  const checkpointIds = new Set<string>();
  for (const checkpoint of value.checkpoints) {
    if (
      !isRecord(checkpoint) ||
      !exactKeys(checkpoint, ["checkpointId", "revision", "evidenceIds", "artifactRefs", "createdAt"]) ||
      !nonEmpty(checkpoint.checkpointId) ||
      checkpointIds.has(checkpoint.checkpointId) ||
      !Number.isSafeInteger(checkpoint.revision) ||
      (checkpoint.revision as number) <= 0 ||
      (checkpoint.revision as number) > (value.revision as number) ||
      !denseUniqueStrings(checkpoint.evidenceIds) ||
      !isDenseArray(checkpoint.artifactRefs) ||
      !finiteTimestamp(checkpoint.createdAt) ||
      Date.parse(checkpoint.createdAt) > Date.parse(updatedAt)
    ) {
      return reject("INVALID_TASK_LEDGER", "task ledger contains an invalid checkpoint");
    }
    checkpointIds.add(checkpoint.checkpointId);
    for (const artifact of checkpoint.artifactRefs) {
      if (!validateArtifactRef(artifact, "taskLedger.checkpoint.artifact").ok) {
        return reject("INVALID_TASK_LEDGER", "task ledger checkpoint has an invalid artifact");
      }
    }
  }
  const idempotencyKeys = new Set<string>();
  for (const entry of value.idempotency) {
    if (
      !isRecord(entry) ||
      !exactKeys(entry, ["key", "operation", "payloadDigest", "appliedRevision"]) ||
      !nonEmpty(entry.key) ||
      idempotencyKeys.has(entry.key) ||
      !["commit", "checkpoint"].includes(entry.operation as string) ||
      !nonEmpty(entry.payloadDigest) ||
      !Number.isSafeInteger(entry.appliedRevision) ||
      (entry.appliedRevision as number) <= 0 ||
      (entry.appliedRevision as number) > (value.revision as number)
    ) {
      return reject("INVALID_TASK_LEDGER", "task ledger contains an invalid idempotency record");
    }
    idempotencyKeys.add(entry.key as string);
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_TASK_LEDGER", "task ledger digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as TaskLedger)));
}

export function createTaskLedger(input: CreateTaskLedgerInput): ContractResult<TaskLedger> {
  if (!isRecord(input) || !exactKeys(input, ["taskId", "tenantId", "goal", "successCriteria", "authority", "policySnapshot", "createdAt"])) {
    return reject("INVALID_TASK_LEDGER_INPUT", "task ledger input has an invalid schema");
  }
  if (
    !nonEmpty(input.taskId) ||
    !nonEmpty(input.tenantId) ||
    !nonEmpty(input.goal) ||
    !denseUniqueStrings(input.successCriteria, false) ||
    !validateAuthority(input.authority) ||
    !validateVersionRef(input.policySnapshot, "createTaskLedger.policySnapshot").ok ||
    !finiteTimestamp(input.createdAt)
  ) {
    return reject("INVALID_TASK_LEDGER_INPUT", "task ledger input contains invalid runtime values");
  }
  const payload = {
    schemaVersion: "task-ledger/v1" as const,
    taskId: input.taskId,
    tenantId: input.tenantId,
    goal: input.goal,
    successCriteria: [...input.successCriteria],
    authority: copyAuthority(input.authority),
    policySnapshot: copyVersionRef(input.policySnapshot),
    revision: 0,
    status: "created" as const,
    currentStep: "created",
    verifiedFacts: [] as TaskVerifiedFact[],
    decisions: [] as TaskDecision[],
    openQuestions: [] as string[],
    checkpoints: [] as TaskCheckpoint[],
    idempotency: [] as TaskIdempotencyRecord[],
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

function validateLedgerPatch(value: unknown, at: string): value is TaskLedgerPatch {
  if (!isRecord(value)) return false;
  const allowed = new Set(["status", "currentStep", "verifiedFacts", "decisions", "openQuestions"]);
  if (Object.keys(value).length === 0 || Object.keys(value).some((key) => !allowed.has(key))) return false;
  return (
    (value.status === undefined || ["created", "running", "waiting", "blocked", "completed"].includes(value.status as string)) &&
    (value.currentStep === undefined || nonEmpty(value.currentStep)) &&
    (value.verifiedFacts === undefined || (isDenseArray(value.verifiedFacts) && value.verifiedFacts.every((fact) => validateVerifiedFact(fact, at)))) &&
    (value.decisions === undefined || (isDenseArray(value.decisions) && value.decisions.every((decision) => validateTaskDecision(decision, at)))) &&
    (value.openQuestions === undefined || denseUniqueStrings(value.openQuestions))
  );
}

function replayLedgerMutation(
  ledger: TaskLedger,
  key: string,
  payloadDigest: string,
): ContractResult<TaskLedgerMutation> | undefined {
  const prior = ledger.idempotency.find((entry) => entry.key === key);
  if (!prior) return undefined;
  if (prior.payloadDigest !== payloadDigest) {
    return reject("IDEMPOTENCY_KEY_REUSE", `idempotency key ${key} was reused with a different payload`);
  }
  return succeed(deepFreeze({ ledger, replayed: true }));
}

export function commitTaskLedger(
  ledgerInput: unknown,
  input: CommitTaskLedgerInput,
): ContractResult<TaskLedgerMutation> {
  const ledgerValidation = validateTaskLedger(ledgerInput);
  if (!ledgerValidation.ok) return ledgerValidation;
  const ledger = ledgerValidation.value;
  if (!isRecord(input) || !exactKeys(input, ["expectedRevision", "idempotencyKey", "at", "patch"])) {
    return reject("INVALID_TASK_COMMIT", "task ledger commit has an invalid schema");
  }
  if (
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision < 0 ||
    !nonEmpty(input.idempotencyKey) ||
    !finiteTimestamp(input.at) ||
    Date.parse(input.at) < Date.parse(ledger.updatedAt) ||
    !validateLedgerPatch(input.patch, input.at)
  ) {
    return reject("INVALID_TASK_COMMIT", "task ledger commit contains invalid runtime values");
  }
  const operationPayload = { operation: "commit", at: input.at, patch: input.patch };
  const operationDigest = stableDigest(operationPayload);
  const replay = replayLedgerMutation(ledger, input.idempotencyKey, operationDigest);
  if (replay) return replay;
  if (input.expectedRevision !== ledger.revision) {
    return reject("STALE_TASK_REVISION", "task ledger expected revision does not match current revision", {
      expectedRevision: input.expectedRevision,
      actualRevision: ledger.revision,
    });
  }
  const revision = ledger.revision + 1;
  const { digest: _ledgerDigest, ...base } = ledger;
  const nextPayload = {
    ...copyJson(base),
    revision,
    status: input.patch.status ?? (ledger.status === "created" ? "running" : ledger.status),
    currentStep: input.patch.currentStep ?? ledger.currentStep,
    verifiedFacts: [...ledger.verifiedFacts, ...(input.patch.verifiedFacts ?? []).map(copyJson)],
    decisions: [...ledger.decisions, ...(input.patch.decisions ?? []).map(copyJson)],
    openQuestions: input.patch.openQuestions ? [...input.patch.openQuestions] : [...ledger.openQuestions],
    idempotency: [
      ...ledger.idempotency.map(copyJson),
      { key: input.idempotencyKey, operation: "commit" as const, payloadDigest: operationDigest, appliedRevision: revision },
    ],
    updatedAt: input.at,
  };
  const next = deepFreeze({ ...nextPayload, digest: stableDigest(nextPayload) });
  return succeed(deepFreeze({ ledger: next, replayed: false }));
}

export function checkpointTaskLedger(
  ledgerInput: unknown,
  input: CheckpointTaskLedgerInput,
): ContractResult<TaskLedgerMutation> {
  const ledgerValidation = validateTaskLedger(ledgerInput);
  if (!ledgerValidation.ok) return ledgerValidation;
  const ledger = ledgerValidation.value;
  if (!isRecord(input) || !exactKeys(input, ["expectedRevision", "idempotencyKey", "checkpointId", "at", "evidenceIds", "artifactRefs"])) {
    return reject("INVALID_TASK_CHECKPOINT", "task checkpoint has an invalid schema");
  }
  if (
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision < 0 ||
    !nonEmpty(input.idempotencyKey) ||
    !nonEmpty(input.checkpointId) ||
    !finiteTimestamp(input.at) ||
    Date.parse(input.at) < Date.parse(ledger.updatedAt) ||
    !denseUniqueStrings(input.evidenceIds) ||
    !isDenseArray(input.artifactRefs)
  ) {
    return reject("INVALID_TASK_CHECKPOINT", "task checkpoint contains invalid runtime values");
  }
  for (const artifact of input.artifactRefs) {
    const validation = validateArtifactRef(artifact, "taskCheckpoint.artifactRefs");
    if (!validation.ok) return reject("INVALID_TASK_CHECKPOINT", "task checkpoint contains an invalid artifact");
  }
  const operationPayload = {
    operation: "checkpoint",
    checkpointId: input.checkpointId,
    at: input.at,
    evidenceIds: input.evidenceIds,
    artifactRefs: input.artifactRefs,
  };
  const operationDigest = stableDigest(operationPayload);
  const replay = replayLedgerMutation(ledger, input.idempotencyKey, operationDigest);
  if (replay) return replay;
  if (input.expectedRevision !== ledger.revision) {
    return reject("STALE_TASK_REVISION", "task checkpoint expected revision does not match current revision");
  }
  if (ledger.checkpoints.some((checkpoint) => checkpoint.checkpointId === input.checkpointId)) {
    return reject("DUPLICATE_CHECKPOINT", `checkpoint ${input.checkpointId} already exists`);
  }
  const revision = ledger.revision + 1;
  const checkpoint: TaskCheckpoint = {
    checkpointId: input.checkpointId,
    revision,
    evidenceIds: [...input.evidenceIds],
    artifactRefs: input.artifactRefs.map(copyArtifact),
    createdAt: input.at,
  };
  const { digest: _ledgerDigest, ...base } = ledger;
  const nextPayload = {
    ...copyJson(base),
    revision,
    checkpoints: [...ledger.checkpoints.map(copyJson), checkpoint],
    idempotency: [
      ...ledger.idempotency.map(copyJson),
      { key: input.idempotencyKey, operation: "checkpoint" as const, payloadDigest: operationDigest, appliedRevision: revision },
    ],
    updatedAt: input.at,
  };
  const next = deepFreeze({ ...nextPayload, digest: stableDigest(nextPayload) });
  return succeed(deepFreeze({ ledger: next, replayed: false }));
}

export interface CompactTaskLedgerInput {
  maxTokens: number;
  estimateTokens: (content: string) => number;
  artifact: ArtifactRef;
  at: string;
}

export interface TaskLedgerCompaction {
  schemaVersion: "task-ledger-compaction/v1";
  taskId: string;
  revision: number;
  summary: {
    tenantId: string;
    policySnapshot: VersionRef;
    authority: AuthorityScope;
    status: TaskLedgerStatus;
    goal: string;
    successCriteria: readonly string[];
    currentStep: string;
    verifiedFacts: readonly TaskVerifiedFact[];
    decisions: readonly TaskDecision[];
    openQuestions: readonly string[];
    latestCheckpointId?: string;
  };
  tokenEstimate: number;
  dropped: readonly string[];
  lossRisk: "low" | "medium";
  recoverableArtifact: ArtifactRef;
  sourceLedgerDigest: string;
  compactedAt: string;
  digest: string;
}

export function compactTaskLedger(
  ledgerInput: unknown,
  input: CompactTaskLedgerInput,
): ContractResult<TaskLedgerCompaction> {
  const ledgerValidation = validateTaskLedger(ledgerInput);
  if (!ledgerValidation.ok) return ledgerValidation;
  const ledger = ledgerValidation.value;
  if (!isRecord(input) || !exactKeys(input, ["maxTokens", "estimateTokens", "artifact", "at"])) {
    return reject("INVALID_TASK_COMPACTION", "task compaction has an invalid schema");
  }
  const artifactValidation = validateArtifactRef(input.artifact, "taskCompaction.artifact");
  if (
    !Number.isSafeInteger(input.maxTokens) ||
    input.maxTokens <= 0 ||
    typeof input.estimateTokens !== "function" ||
    !artifactValidation.ok ||
    !artifactValidation.value.location ||
    !finiteTimestamp(input.at) ||
    Date.parse(input.at) < Date.parse(ledger.updatedAt)
  ) {
    return reject("INVALID_TASK_COMPACTION", "task compaction requires a budget, clock, and recoverable artifact location");
  }
  const latestCheckpoint = ledger.checkpoints.at(-1);
  const summary = {
    tenantId: ledger.tenantId,
    policySnapshot: copyVersionRef(ledger.policySnapshot),
    authority: copyAuthority(ledger.authority),
    status: ledger.status,
    goal: ledger.goal,
    successCriteria: [...ledger.successCriteria],
    currentStep: ledger.currentStep,
    verifiedFacts: ledger.verifiedFacts.map(copyJson),
    decisions: ledger.decisions.map(copyJson),
    openQuestions: [...ledger.openQuestions],
    ...(latestCheckpoint ? { latestCheckpointId: latestCheckpoint.checkpointId } : {}),
  };
  let tokenEstimate: number;
  try {
    tokenEstimate = input.estimateTokens(stableSerialize(summary));
  } catch (cause) {
    return reject("INVALID_TOKEN_ESTIMATE", "task compaction tokenizer failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
    });
  }
  if (!Number.isSafeInteger(tokenEstimate) || tokenEstimate <= 0) {
    return reject("INVALID_TOKEN_ESTIMATE", "task compaction tokenizer must return a positive safe integer");
  }
  if (tokenEstimate > input.maxTokens) {
    return reject("COMPACTION_BUDGET_EXCEEDED", "hard task state cannot fit the compaction budget", {
      requiredTokens: tokenEstimate,
      maxTokens: input.maxTokens,
    });
  }
  const dropped = ["idempotency-history", ...(ledger.checkpoints.length > 1 ? ["historical-checkpoints"] : [])];
  const payload = {
    schemaVersion: "task-ledger-compaction/v1" as const,
    taskId: ledger.taskId,
    revision: ledger.revision,
    summary,
    tokenEstimate,
    dropped,
    lossRisk: (ledger.checkpoints.length > 1 ? "medium" : "low") as "low" | "medium",
    recoverableArtifact: copyArtifact(artifactValidation.value),
    sourceLedgerDigest: ledger.digest,
    compactedAt: input.at,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

export type MemoryScope = "user" | "team" | "task" | "org";
export type MemoryStatus = "candidate" | "active" | "disputed" | "superseded" | "deleted";

export interface GovernedMemoryRecord {
  schemaVersion: "governed-memory/v1";
  memoryId: string;
  tenantId: string;
  namespace: readonly string[];
  subject: string;
  value: string;
  scope: MemoryScope;
  principalId: string;
  allowedPurposes: readonly string[];
  provenance: readonly ProvenanceRef[];
  confidence: number;
  sensitivity: Exclude<ContextSensitivity, "secret">;
  status: MemoryStatus;
  conflictIds: readonly string[];
  expiresAt?: string;
  deletedAt?: string;
  idempotencyKey: string;
  operationDigest: string;
  createdAt: string;
  updatedAt: string;
  digest: string;
}

export interface ProposeGovernedMemoryInput {
  records: readonly GovernedMemoryRecord[];
  memoryId: string;
  tenantId: string;
  namespace: readonly string[];
  subject: string;
  value: string;
  scope: MemoryScope;
  principalId: string;
  allowedPurposes: readonly string[];
  provenance: readonly ProvenanceRef[];
  confidence: number;
  sensitivity: Exclude<ContextSensitivity, "secret">;
  expiresAt?: string;
  idempotencyKey: string;
  at: string;
}

export interface MemoryMutation {
  records: readonly GovernedMemoryRecord[];
  record: GovernedMemoryRecord;
  replayed: boolean;
  conflictIds: readonly string[];
}

function memoryPayload(record: GovernedMemoryRecord): Omit<GovernedMemoryRecord, "digest"> {
  const { digest: _digest, ...payload } = record;
  return payload;
}

function validateMemoryRecord(value: unknown): ContractResult<GovernedMemoryRecord> {
  if (!isRecord(value)) return reject("INVALID_MEMORY_RECORD", "memory record must be an object");
  const keys = [
    "schemaVersion", "memoryId", "tenantId", "namespace", "subject", "value", "scope", "principalId",
    "allowedPurposes", "provenance", "confidence", "sensitivity", "status", "conflictIds", "idempotencyKey",
    "operationDigest", "createdAt", "updatedAt", "digest",
  ];
  if (value.expiresAt !== undefined) keys.push("expiresAt");
  if (value.deletedAt !== undefined) keys.push("deletedAt");
  if (!exactKeys(value, keys)) return reject("INVALID_MEMORY_RECORD", "memory record has an invalid schema");
  if (
    value.schemaVersion !== "governed-memory/v1" ||
    !nonEmpty(value.memoryId) ||
    !nonEmpty(value.tenantId) ||
    !denseUniqueStrings(value.namespace, false) ||
    !nonEmpty(value.subject) ||
    !nonEmpty(value.value) ||
    !MEMORY_SCOPES.has(value.scope as MemoryScope) ||
    !nonEmpty(value.principalId) ||
    !denseUniqueStrings(value.allowedPurposes, false) ||
    !isDenseArray(value.provenance) ||
    value.provenance.length === 0 ||
    !finiteUnit(value.confidence) ||
    !["public", "internal", "restricted"].includes(value.sensitivity as string) ||
    !MEMORY_STATUSES.has(value.status as MemoryStatus) ||
    !denseUniqueStrings(value.conflictIds) ||
    !nonEmpty(value.idempotencyKey) ||
    !nonEmpty(value.operationDigest) ||
    !finiteTimestamp(value.createdAt) ||
    !finiteTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt) ||
    (value.expiresAt !== undefined && (!finiteTimestamp(value.expiresAt) || Date.parse(value.expiresAt) <= Date.parse(value.createdAt))) ||
    (value.deletedAt !== undefined && (!finiteTimestamp(value.deletedAt) || Date.parse(value.deletedAt) < Date.parse(value.createdAt))) ||
    ((value.status === "deleted") !== (value.deletedAt !== undefined))
  ) {
    return reject("INVALID_MEMORY_RECORD", "memory record contains invalid runtime values");
  }
  if (!value.provenance.every((source) => {
    const validation = validateProvenanceRef(source, "memoryRecord.provenance");
    return validation.ok && Date.parse(validation.value.observedAt) <= Date.parse(value.createdAt as string);
  })) {
    return reject("INVALID_MEMORY_RECORD", "memory record contains invalid provenance");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_MEMORY_RECORD", "memory record digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as GovernedMemoryRecord)));
}

function validateMemoryRecords(value: unknown): ContractResult<readonly GovernedMemoryRecord[]> {
  if (!isDenseArray(value)) return reject("INVALID_MEMORY_RECORD", "memory records must be a dense array");
  const records: GovernedMemoryRecord[] = [];
  const ids = new Set<string>();
  const keys = new Set<string>();
  for (const candidate of value) {
    const validation = validateMemoryRecord(candidate);
    if (!validation.ok) return validation;
    if (ids.has(validation.value.memoryId) || keys.has(validation.value.idempotencyKey)) {
      return reject("INVALID_MEMORY_RECORD", "memory ids and idempotency keys must be unique");
    }
    ids.add(validation.value.memoryId);
    keys.add(validation.value.idempotencyKey);
    records.push(validation.value);
  }
  const recordsById = new Map(records.map((record) => [record.memoryId, record]));
  for (const record of records) {
    if (
      (record.status === "disputed" && record.conflictIds.length === 0) ||
      (["active", "candidate"].includes(record.status) && record.conflictIds.length > 0)
    ) {
      return reject("INVALID_MEMORY_RECORD", "memory status does not match its conflict group");
    }
    for (const conflictId of record.conflictIds) {
      const peer = recordsById.get(conflictId);
      if (
        !peer ||
        peer.memoryId === record.memoryId ||
        peer.value === record.value ||
        !sameMemoryConflictDomain(record, peer) ||
        !peer.conflictIds.includes(record.memoryId)
      ) {
        return reject("INVALID_MEMORY_RECORD", "memory conflict group is incomplete or crosses a governance domain");
      }
    }
  }
  return succeed(records);
}

function sameNamespace(left: readonly string[], right: readonly string[]): boolean {
  return stableSerialize(left) === stableSerialize(right);
}

type MemoryConflictScope = Pick<
  GovernedMemoryRecord,
  "tenantId" | "namespace" | "subject" | "principalId" | "scope" | "allowedPurposes"
>;

function memoryConflictDomain(value: MemoryConflictScope): JsonRecord {
  return {
    tenantId: value.tenantId,
    namespace: value.namespace,
    subject: value.subject,
    principalId: value.principalId,
    scope: value.scope,
    allowedPurposes: sorted(value.allowedPurposes),
  };
}

function sameMemoryConflictDomain(left: MemoryConflictScope, right: MemoryConflictScope): boolean {
  return stableSerialize(memoryConflictDomain(left)) === stableSerialize(memoryConflictDomain(right));
}

export function proposeGovernedMemory(input: ProposeGovernedMemoryInput): ContractResult<MemoryMutation> {
  if (!isRecord(input)) return reject("INVALID_MEMORY_PROPOSAL", "memory proposal must be an object");
  const keys = [
    "records", "memoryId", "tenantId", "namespace", "subject", "value", "scope", "principalId",
    "allowedPurposes", "provenance", "confidence", "sensitivity", "idempotencyKey", "at",
  ];
  if (input.expiresAt !== undefined) keys.push("expiresAt");
  if (!exactKeys(input, keys)) return reject("INVALID_MEMORY_PROPOSAL", "memory proposal has an invalid schema");
  const recordsValidation = validateMemoryRecords(input.records);
  if (!recordsValidation.ok) return recordsValidation;
  const records = recordsValidation.value;
  if (
    !nonEmpty(input.memoryId) ||
    !nonEmpty(input.tenantId) ||
    !denseUniqueStrings(input.namespace, false) ||
    !nonEmpty(input.subject) ||
    !nonEmpty(input.value) ||
    !MEMORY_SCOPES.has(input.scope) ||
    !nonEmpty(input.principalId) ||
    !denseUniqueStrings(input.allowedPurposes, false) ||
    !isDenseArray(input.provenance) ||
    input.provenance.length === 0 ||
    !finiteUnit(input.confidence) ||
    !["public", "internal", "restricted"].includes(input.sensitivity) ||
    !nonEmpty(input.idempotencyKey) ||
    !finiteTimestamp(input.at) ||
    (input.expiresAt !== undefined && (!finiteTimestamp(input.expiresAt) || Date.parse(input.expiresAt) <= Date.parse(input.at)))
  ) {
    return reject("INVALID_MEMORY_PROPOSAL", "memory proposal contains invalid runtime values");
  }
  for (const source of input.provenance) {
    const validation = validateProvenanceRef(source, "memoryProposal.provenance");
    if (!validation.ok || Date.parse(validation.value.observedAt) > Date.parse(input.at)) {
      return reject("INVALID_MEMORY_PROPOSAL", "memory proposal contains invalid or future provenance");
    }
  }
  const operationPayload = {
    memoryId: input.memoryId,
    tenantId: input.tenantId,
    namespace: input.namespace,
    subject: input.subject,
    value: input.value,
    scope: input.scope,
    principalId: input.principalId,
    allowedPurposes: input.allowedPurposes,
    provenance: input.provenance,
    confidence: input.confidence,
    sensitivity: input.sensitivity,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    at: input.at,
  };
  const operationDigest = stableDigest(operationPayload);
  const replay = records.find((record) => record.idempotencyKey === input.idempotencyKey);
  if (replay) {
    if (replay.operationDigest !== operationDigest) {
      return reject("IDEMPOTENCY_KEY_REUSE", `memory idempotency key ${input.idempotencyKey} changed payload`);
    }
    return succeed(deepFreeze({ records, record: replay, replayed: true, conflictIds: replay.conflictIds }));
  }
  if (records.some((record) => record.memoryId === input.memoryId)) {
    return reject("DUPLICATE_MEMORY_ID", `memory id ${input.memoryId} already exists`);
  }
  if (records.some((record) => Date.parse(record.updatedAt) > Date.parse(input.at))) {
    return reject("MEMORY_CLOCK_REGRESSION", "memory proposal timestamp is behind the current record set");
  }
  const conflicts = records.filter(
    (record) =>
      sameMemoryConflictDomain(record, input) &&
      record.value !== input.value &&
      record.status !== "deleted" &&
      record.status !== "superseded" &&
      (!record.expiresAt || Date.parse(record.expiresAt) > Date.parse(input.at)),
  );
  const conflictIds = conflicts.map((record) => record.memoryId).sort();
  const updatedRecords = records.map((record) => {
    if (!conflictIds.includes(record.memoryId)) return record;
    const payload = {
      ...memoryPayload(record),
      status: "disputed" as const,
      conflictIds: [...new Set([...record.conflictIds, input.memoryId])].sort(),
      updatedAt: input.at,
    };
    return deepFreeze({ ...payload, digest: stableDigest(payload) });
  });
  const newPayload = {
    schemaVersion: "governed-memory/v1" as const,
    memoryId: input.memoryId,
    tenantId: input.tenantId,
    namespace: [...input.namespace],
    subject: input.subject,
    value: input.value,
    scope: input.scope,
    principalId: input.principalId,
    allowedPurposes: [...input.allowedPurposes],
    provenance: input.provenance.map(copyProvenanceRef),
    confidence: input.confidence,
    sensitivity: input.sensitivity,
    status: (conflicts.length > 0 ? "disputed" : input.confidence >= 0.9 ? "active" : "candidate") as MemoryStatus,
    conflictIds,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    idempotencyKey: input.idempotencyKey,
    operationDigest,
    createdAt: input.at,
    updatedAt: input.at,
  };
  const record = deepFreeze({ ...newPayload, digest: stableDigest(newPayload) });
  const nextRecords = [...updatedRecords, record];
  const nextValidation = validateMemoryRecords(nextRecords);
  if (!nextValidation.ok) {
    return reject("INVALID_MEMORY_CONFLICT_GROUP", "memory mutation did not produce a rehydratable conflict group", {
      cause: nextValidation.error.code,
    });
  }
  const validatedRecord = nextValidation.value.find((entry) => entry.memoryId === record.memoryId)!;
  return succeed(deepFreeze({ records: nextValidation.value, record: validatedRecord, replayed: false, conflictIds }));
}

export interface QueryGovernedMemoryInput {
  records: readonly GovernedMemoryRecord[];
  tenantId: string;
  principalId: string;
  purpose: string;
  namespacePrefix: readonly string[];
  at: string;
}

export interface GovernedMemoryQueryResult {
  records: readonly GovernedMemoryRecord[];
  digest: string;
}

export function queryGovernedMemory(input: QueryGovernedMemoryInput): ContractResult<GovernedMemoryQueryResult> {
  if (!isRecord(input) || !exactKeys(input, ["records", "tenantId", "principalId", "purpose", "namespacePrefix", "at"])) {
    return reject("INVALID_MEMORY_QUERY", "memory query has an invalid schema");
  }
  const recordsValidation = validateMemoryRecords(input.records);
  if (!recordsValidation.ok) return recordsValidation;
  if (
    !nonEmpty(input.tenantId) ||
    !nonEmpty(input.principalId) ||
    !nonEmpty(input.purpose) ||
    !denseUniqueStrings(input.namespacePrefix, false) ||
    !finiteTimestamp(input.at)
  ) {
    return reject("INVALID_MEMORY_QUERY", "memory query contains invalid runtime values");
  }
  const records = recordsValidation.value.filter(
    (record) =>
      record.status === "active" &&
      record.tenantId === input.tenantId &&
      record.principalId === input.principalId &&
      record.allowedPurposes.includes(input.purpose) &&
      input.namespacePrefix.every((part, index) => record.namespace[index] === part) &&
      (!record.expiresAt || Date.parse(record.expiresAt) > Date.parse(input.at)),
  );
  const payload = { records };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

export interface DeleteGovernedMemoryInput {
  records: readonly GovernedMemoryRecord[];
  memoryId: string;
  tenantId: string;
  principalId: string;
  idempotencyKey: string;
  at: string;
}

export function deleteGovernedMemory(input: DeleteGovernedMemoryInput): ContractResult<MemoryMutation> {
  if (!isRecord(input) || !exactKeys(input, ["records", "memoryId", "tenantId", "principalId", "idempotencyKey", "at"])) {
    return reject("INVALID_MEMORY_DELETE", "memory delete has an invalid schema");
  }
  const recordsValidation = validateMemoryRecords(input.records);
  if (!recordsValidation.ok) return recordsValidation;
  const records = recordsValidation.value;
  if (
    !nonEmpty(input.memoryId) ||
    !nonEmpty(input.tenantId) ||
    !nonEmpty(input.principalId) ||
    !nonEmpty(input.idempotencyKey) ||
    !finiteTimestamp(input.at)
  ) {
    return reject("INVALID_MEMORY_DELETE", "memory delete contains invalid runtime values");
  }
  const target = records.find((record) => record.memoryId === input.memoryId);
  if (!target) return reject("MEMORY_NOT_FOUND", `memory ${input.memoryId} does not exist`);
  if (target.tenantId !== input.tenantId || target.principalId !== input.principalId) {
    return reject("MEMORY_DELETE_DENIED", "memory deletion scope does not match the record owner");
  }
  const operationDigest = stableDigest({ memoryId: input.memoryId, tenantId: input.tenantId, principalId: input.principalId, at: input.at });
  if (target.status === "deleted") {
    if (target.idempotencyKey === input.idempotencyKey && target.operationDigest === operationDigest) {
      return succeed(deepFreeze({ records, record: target, replayed: true, conflictIds: target.conflictIds }));
    }
    return reject("MEMORY_ALREADY_DELETED", `memory ${input.memoryId} is already deleted`);
  }
  if (Date.parse(input.at) < Date.parse(target.updatedAt)) {
    return reject("INVALID_MEMORY_DELETE", "memory deletion timestamp cannot move backwards");
  }
  if (records.some((record) => record.idempotencyKey === input.idempotencyKey && record.memoryId !== input.memoryId)) {
    return reject("IDEMPOTENCY_KEY_REUSE", "memory deletion idempotency key is already in use");
  }
  const deletedPayload = {
    ...memoryPayload(target),
    status: "deleted" as const,
    deletedAt: input.at,
    idempotencyKey: input.idempotencyKey,
    operationDigest,
    updatedAt: input.at,
  };
  const record = deepFreeze({ ...deletedPayload, digest: stableDigest(deletedPayload) });
  const next = records.map((candidate) => candidate.memoryId === input.memoryId ? record : candidate);
  return succeed(deepFreeze({ records: next, record, replayed: false, conflictIds: record.conflictIds }));
}

export interface ContextCacheEntry {
  schemaVersion: "context-cache-entry/v1";
  key: string;
  runId: string;
  stage: string;
  tenantId: string;
  principalId: string;
  purpose: string;
  permissionDigest: string;
  queryDigest: string;
  contextPolicyDigest: string;
  policySnapshot: VersionRef;
  modelProfile: VersionRef;
  toolset: VersionRef;
  indexSnapshot: VersionRef;
  stateRevision: number;
  freshnessBucket: string;
  build: EnterpriseContextBuild;
  createdAt: string;
  expiresAt: string;
  digest: string;
}

export interface CreateContextCacheEntryInput {
  build: EnterpriseContextBuild;
  createdAt: string;
  expiresAt: string;
}

export interface ContextCacheReadResult {
  hit: boolean;
  reason: "hit" | "scope-mismatch" | "expired";
  build?: EnterpriseContextBuild;
}

function validateContextCacheEntry(value: unknown): ContractResult<ContextCacheEntry> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "key", "runId", "stage", "tenantId", "principalId", "purpose", "permissionDigest", "queryDigest", "contextPolicyDigest",
    "policySnapshot", "modelProfile", "toolset", "indexSnapshot", "stateRevision", "freshnessBucket", "build",
    "createdAt", "expiresAt", "digest",
  ])) {
    return reject("INVALID_CONTEXT_CACHE_ENTRY", "context cache entry has an invalid schema");
  }
  const buildValidation = validateEnterpriseContextBuildSnapshotInternal(value.build);
  if (!buildValidation.ok) return reject("INVALID_CONTEXT_CACHE_ENTRY", "context cache entry contains an invalid build");
  const build = buildValidation.value;
  if (
    value.schemaVersion !== "context-cache-entry/v1" ||
    !nonEmpty(value.key) ||
    !nonEmpty(value.runId) ||
    !nonEmpty(value.stage) ||
    !nonEmpty(value.tenantId) ||
    !nonEmpty(value.principalId) ||
    !nonEmpty(value.purpose) ||
    !nonEmpty(value.permissionDigest) ||
    !nonEmpty(value.queryDigest) ||
    !nonEmpty(value.contextPolicyDigest) ||
    !validateVersionRef(value.policySnapshot, "contextCache.policySnapshot").ok ||
    !validateVersionRef(value.modelProfile, "contextCache.modelProfile").ok ||
    !validateVersionRef(value.toolset, "contextCache.toolset").ok ||
    !validateVersionRef(value.indexSnapshot, "contextCache.indexSnapshot").ok ||
    !Number.isSafeInteger(value.stateRevision) ||
    (value.stateRevision as number) < 0 ||
    !nonEmpty(value.freshnessBucket) ||
    !finiteTimestamp(value.createdAt) ||
    !finiteTimestamp(value.expiresAt) ||
    Date.parse(value.expiresAt) <= Date.parse(value.createdAt) ||
    Date.parse(value.expiresAt) > Date.parse(build.package.expiresAt) ||
    value.key !== build.fingerprint.digest ||
    value.runId !== build.request.runId ||
    value.stage !== build.request.stage ||
    value.tenantId !== build.request.tenantId ||
    value.principalId !== build.request.principal.id ||
    value.purpose !== build.request.purpose ||
    value.permissionDigest !== build.fingerprint.permissionDigest ||
    value.queryDigest !== stableDigest(build.request.query) ||
    value.contextPolicyDigest !== stableDigest({ contextPolicy: build.request.contextPolicy, safetyReserve: build.request.safetyReserve }) ||
    stableSerialize(value.policySnapshot) !== stableSerialize(build.request.policySnapshot) ||
    stableSerialize(value.modelProfile) !== stableSerialize(build.request.modelProfile) ||
    stableSerialize(value.toolset) !== stableSerialize(build.request.toolset) ||
    stableSerialize(value.indexSnapshot) !== stableSerialize(build.request.indexSnapshot) ||
    value.stateRevision !== build.request.stateRevision ||
    value.freshnessBucket !== build.request.freshnessBucket
  ) {
    return reject("INVALID_CONTEXT_CACHE_ENTRY", "context cache entry scope does not match its build");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) {
    return reject("INVALID_CONTEXT_CACHE_ENTRY", "context cache entry digest does not match content");
  }
  return succeed(deepFreeze(copyJson(value as unknown as ContextCacheEntry)));
}

export function createContextCacheEntry(
  input: CreateContextCacheEntryInput,
): ContractResult<ContextCacheEntry> {
  if (!isRecord(input) || !exactKeys(input, ["build", "createdAt", "expiresAt"])) {
    return reject("INVALID_CONTEXT_CACHE_ENTRY", "context cache input has an invalid schema");
  }
  const buildValidation = validateEnterpriseContextBuildSnapshotInternal(input.build);
  if (!buildValidation.ok) return reject("INVALID_CONTEXT_CACHE_ENTRY", "context cache requires a valid context build");
  const build = buildValidation.value;
  if (
    !finiteTimestamp(input.createdAt) ||
    !finiteTimestamp(input.expiresAt) ||
    Date.parse(input.createdAt) < Date.parse(build.request.requestedAt) ||
    Date.parse(input.expiresAt) <= Date.parse(input.createdAt) ||
    Date.parse(input.expiresAt) > Date.parse(build.package.expiresAt)
  ) {
    return reject("INVALID_CONTEXT_CACHE_ENTRY", "context cache timestamps exceed the package validity window");
  }
  const payload = {
    schemaVersion: "context-cache-entry/v1" as const,
    key: build.fingerprint.digest,
    runId: build.request.runId,
    stage: build.request.stage,
    tenantId: build.request.tenantId,
    principalId: build.request.principal.id,
    purpose: build.request.purpose,
    permissionDigest: build.fingerprint.permissionDigest,
    queryDigest: stableDigest(build.request.query),
    contextPolicyDigest: stableDigest({ contextPolicy: build.request.contextPolicy, safetyReserve: build.request.safetyReserve }),
    policySnapshot: copyVersionRef(build.request.policySnapshot),
    modelProfile: copyVersionRef(build.request.modelProfile),
    toolset: copyVersionRef(build.request.toolset),
    indexSnapshot: copyVersionRef(build.request.indexSnapshot),
    stateRevision: build.request.stateRevision,
    freshnessBucket: build.request.freshnessBucket,
    build,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

export function readContextCache(input: {
  entry: unknown;
  request: EnterpriseContextRequest;
  at: string;
}): ContractResult<ContextCacheReadResult> {
  if (!isRecord(input) || !exactKeys(input, ["entry", "request", "at"])) {
    return reject("INVALID_CONTEXT_CACHE_READ", "context cache read has an invalid schema");
  }
  const entryValidation = validateContextCacheEntry(input.entry);
  if (!entryValidation.ok) return entryValidation;
  const requestValidation = validateContextRequest(input.request);
  if (!requestValidation.ok) return reject("INVALID_CONTEXT_CACHE_READ", "context cache read request is invalid");
  if (!finiteTimestamp(input.at)) return reject("INVALID_CONTEXT_CACHE_READ", "context cache read requires a timestamp");
  const entry = entryValidation.value;
  const request = requestValidation.value;
  if (Date.parse(input.at) >= Date.parse(entry.expiresAt)) {
    return succeed(deepFreeze({ hit: false, reason: "expired" as const }));
  }
  const scopeMatches =
    entry.runId === request.runId &&
    entry.stage === request.stage &&
    entry.tenantId === request.tenantId &&
    entry.principalId === request.principal.id &&
    entry.purpose === request.purpose &&
    entry.permissionDigest === permissionDigest(request) &&
    entry.queryDigest === stableDigest(request.query) &&
    entry.contextPolicyDigest === stableDigest({ contextPolicy: request.contextPolicy, safetyReserve: request.safetyReserve }) &&
    stableSerialize(entry.policySnapshot) === stableSerialize(request.policySnapshot) &&
    stableSerialize(entry.modelProfile) === stableSerialize(request.modelProfile) &&
    stableSerialize(entry.toolset) === stableSerialize(request.toolset) &&
    stableSerialize(entry.indexSnapshot) === stableSerialize(request.indexSnapshot) &&
    entry.stateRevision === request.stateRevision &&
    entry.freshnessBucket === request.freshnessBucket;
  if (!scopeMatches) return succeed(deepFreeze({ hit: false, reason: "scope-mismatch" as const }));
  return succeed(deepFreeze({ hit: true, reason: "hit" as const, build: entry.build }));
}

export interface WorkerBudget {
  maxTokens: number;
  maxToolCalls: number;
}

export interface WorkerEvidenceDelegation {
  evidenceId: string;
  evidenceDigest: string;
}

function validateEvidenceDelegations(value: unknown): value is readonly WorkerEvidenceDelegation[] {
  if (!isDenseArray(value)) return false;
  const evidenceIds: string[] = [];
  for (const delegation of value) {
    if (
      !isRecord(delegation) ||
      !exactKeys(delegation, ["evidenceId", "evidenceDigest"]) ||
      !nonEmpty(delegation.evidenceId) ||
      !nonEmpty(delegation.evidenceDigest)
    ) {
      return false;
    }
    evidenceIds.push(delegation.evidenceId);
  }
  return new Set(evidenceIds).size === evidenceIds.length;
}

export interface WorkerContextPackage {
  schemaVersion: "worker-context-package/v1";
  assignmentId: string;
  workerId: string;
  tenantId: string;
  principal: EnterprisePrincipal;
  principalId: string;
  purpose: string;
  permissionDigest: string;
  policySnapshot: VersionRef;
  authority: AuthorityScope;
  budget: WorkerBudget;
  parentAuthorityDigest: string;
  parentBudgetDigest: string;
  contextBuildDigest: string;
  visibleItemIds: readonly string[];
  evidenceDelegations: readonly WorkerEvidenceDelegation[];
  createdAt: string;
  digest: string;
}

export interface CreateWorkerContextPackageInput {
  assignmentId: string;
  workerId: string;
  tenantId: string;
  principal: EnterprisePrincipal;
  purpose: string;
  policySnapshot: VersionRef;
  parentAuthority: AuthorityScope;
  authority: AuthorityScope;
  parentBudget: WorkerBudget;
  budget: WorkerBudget;
  contextBuildDigest: string;
  visibleItemIds: readonly string[];
  evidenceDelegations: readonly WorkerEvidenceDelegation[];
  at: string;
}

function validateWorkerBudget(value: unknown): value is WorkerBudget {
  return (
    isRecord(value) &&
    exactKeys(value, ["maxTokens", "maxToolCalls"]) &&
    Number.isSafeInteger(value.maxTokens) &&
    (value.maxTokens as number) > 0 &&
    Number.isSafeInteger(value.maxToolCalls) &&
    (value.maxToolCalls as number) >= 0
  );
}

function validateWorkerContextPackage(value: unknown): ContractResult<WorkerContextPackage> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "assignmentId", "workerId", "tenantId", "principal", "principalId", "purpose", "permissionDigest", "policySnapshot", "authority", "budget",
    "parentAuthorityDigest", "parentBudgetDigest", "contextBuildDigest", "visibleItemIds", "evidenceDelegations", "createdAt", "digest",
  ])) {
    return reject("INVALID_WORKER_CONTEXT", "worker context package has an invalid schema");
  }
  if (
    value.schemaVersion !== "worker-context-package/v1" ||
    !nonEmpty(value.assignmentId) ||
    !nonEmpty(value.workerId) ||
    !nonEmpty(value.tenantId) ||
    !validatePrincipal(value.principal) ||
    !nonEmpty(value.principalId) ||
    value.principalId !== value.principal.id ||
    !nonEmpty(value.purpose) ||
    !nonEmpty(value.permissionDigest) ||
    !validateVersionRef(value.policySnapshot, "workerContext.policySnapshot").ok ||
    !validateAuthority(value.authority) ||
    !validateWorkerBudget(value.budget) ||
    !nonEmpty(value.parentAuthorityDigest) ||
    !nonEmpty(value.parentBudgetDigest) ||
    !nonEmpty(value.contextBuildDigest) ||
    !denseUniqueStrings(value.visibleItemIds) ||
    !validateEvidenceDelegations(value.evidenceDelegations) ||
    !finiteTimestamp(value.createdAt)
  ) {
    return reject("INVALID_WORKER_CONTEXT", "worker context package contains invalid runtime values");
  }
  if (value.permissionDigest !== permissionDigest({
    tenantId: value.tenantId as string,
    principal: value.principal as unknown as EnterprisePrincipal,
    purpose: value.purpose as string,
    policySnapshot: value.policySnapshot as unknown as VersionRef,
  })) {
    return reject("INVALID_WORKER_CONTEXT", "worker context permission digest does not match scope");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_WORKER_CONTEXT", "worker context digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as WorkerContextPackage)));
}

export function createWorkerContextPackage(
  input: CreateWorkerContextPackageInput,
): ContractResult<WorkerContextPackage> {
  if (!isRecord(input) || !exactKeys(input, [
    "assignmentId", "workerId", "tenantId", "principal", "purpose", "policySnapshot", "parentAuthority", "authority",
    "parentBudget", "budget", "contextBuildDigest", "visibleItemIds", "evidenceDelegations", "at",
  ])) {
    return reject("INVALID_WORKER_CONTEXT", "worker context input has an invalid schema");
  }
  if (
    !nonEmpty(input.assignmentId) ||
    !nonEmpty(input.workerId) ||
    !nonEmpty(input.tenantId) ||
    !validatePrincipal(input.principal) ||
    !nonEmpty(input.purpose) ||
    !validateVersionRef(input.policySnapshot, "workerContext.policySnapshot").ok ||
    !validateAuthority(input.parentAuthority) ||
    !validateAuthority(input.authority) ||
    !validateWorkerBudget(input.parentBudget) ||
    !validateWorkerBudget(input.budget) ||
    !nonEmpty(input.contextBuildDigest) ||
    !denseUniqueStrings(input.visibleItemIds) ||
    !validateEvidenceDelegations(input.evidenceDelegations) ||
    !finiteTimestamp(input.at)
  ) {
    return reject("INVALID_WORKER_CONTEXT", "worker context input contains invalid runtime values");
  }
  if (!authoritySubset(input.authority, input.parentAuthority)) {
    return reject("WORKER_AUTHORITY_EXPANSION", "worker authority must be a subset of parent authority");
  }
  if (input.budget.maxTokens > input.parentBudget.maxTokens || input.budget.maxToolCalls > input.parentBudget.maxToolCalls) {
    return reject("WORKER_BUDGET_EXPANSION", "worker budget must be a subset of parent budget");
  }
  const payload = {
    schemaVersion: "worker-context-package/v1" as const,
    assignmentId: input.assignmentId,
    workerId: input.workerId,
    tenantId: input.tenantId,
    principal: copyJson(input.principal),
    principalId: input.principal.id,
    purpose: input.purpose,
    permissionDigest: permissionDigest({
      tenantId: input.tenantId,
      principal: input.principal,
      purpose: input.purpose,
      policySnapshot: input.policySnapshot,
    }),
    policySnapshot: copyVersionRef(input.policySnapshot),
    authority: copyAuthority(input.authority),
    budget: copyJson(input.budget),
    parentAuthorityDigest: stableDigest({
      tools: sorted(input.parentAuthority.tools),
      resources: sorted(input.parentAuthority.resources),
      actions: sorted(input.parentAuthority.actions),
    }),
    parentBudgetDigest: stableDigest(input.parentBudget),
    contextBuildDigest: input.contextBuildDigest,
    visibleItemIds: [...input.visibleItemIds],
    evidenceDelegations: input.evidenceDelegations.map(copyJson),
    createdAt: input.at,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

export interface WorkerClaim {
  claimId: string;
  value: string;
  evidenceIds: readonly string[];
  confidence: number;
}

export interface WorkerEvidencePackage {
  schemaVersion: "worker-evidence-package/v1";
  assignmentId: string;
  workerId: string;
  tenantId: string;
  principal: EnterprisePrincipal;
  principalId: string;
  purpose: string;
  permissionDigest: string;
  policySnapshot: VersionRef;
  authority: AuthorityScope;
  budget: WorkerBudget;
  parentAuthorityDigest: string;
  parentBudgetDigest: string;
  contextPackageDigest: string;
  evidenceDelegations: readonly WorkerEvidenceDelegation[];
  status: "complete" | "partial";
  claims: readonly WorkerClaim[];
  evidence: readonly VerifiedEvidence[];
  uncertainties: readonly string[];
  consumed: { tokens: number; toolCalls: number };
  traceId: string;
  createdAt: string;
  digest: string;
}

export interface CreateWorkerEvidencePackageInput {
  context: WorkerContextPackage;
  status: "complete" | "partial";
  claims: readonly WorkerClaim[];
  evidence: readonly VerifiedEvidence[];
  uncertainties: readonly string[];
  consumed: { tokens: number; toolCalls: number };
  traceId: string;
  at: string;
}

function validateVerifiedEvidence(value: unknown): value is VerifiedEvidence {
  if (!isRecord(value) || !nonEmpty(value.digest) || !nonEmpty(value.permissionDigest)) return false;
  const { digest, permissionDigest: permission, ...candidate } = value;
  if (!validateEvidenceCandidate(candidate)) return false;
  return stableDigest({ ...candidate, permissionDigest: permission }) === digest;
}

function validateWorkerClaimFields(value: JsonRecord): boolean {
  return (
    nonEmpty(value.claimId) &&
    nonEmpty(value.value) &&
    denseUniqueStrings(value.evidenceIds, false) &&
    finiteUnit(value.confidence)
  );
}

function validateWorkerClaim(value: unknown): value is WorkerClaim {
  return isRecord(value) && exactKeys(value, ["claimId", "value", "evidenceIds", "confidence"]) && validateWorkerClaimFields(value);
}

function validateReducedWorkerClaim(value: unknown): value is ReducedWorkerClaim {
  return (
    isRecord(value) &&
    exactKeys(value, ["claimId", "value", "evidenceIds", "confidence", "workerIds", "sourceIds"]) &&
    validateWorkerClaimFields(value) &&
    denseUniqueStrings(value.workerIds, false) &&
    denseUniqueStrings(value.sourceIds, false)
  );
}

function validateWorkerEvidencePackage(value: unknown): ContractResult<WorkerEvidencePackage> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "assignmentId", "workerId", "tenantId", "principal", "principalId", "purpose", "permissionDigest", "policySnapshot", "authority", "budget",
    "parentAuthorityDigest", "parentBudgetDigest", "contextPackageDigest", "evidenceDelegations", "status", "claims", "evidence",
    "uncertainties", "consumed", "traceId", "createdAt", "digest",
  ])) {
    return reject("INVALID_WORKER_EVIDENCE", "worker evidence package has an invalid schema");
  }
  if (
    value.schemaVersion !== "worker-evidence-package/v1" ||
    !nonEmpty(value.assignmentId) ||
    !nonEmpty(value.workerId) ||
    !nonEmpty(value.tenantId) ||
    !validatePrincipal(value.principal) ||
    !nonEmpty(value.principalId) ||
    value.principalId !== value.principal.id ||
    !nonEmpty(value.purpose) ||
    !nonEmpty(value.permissionDigest) ||
    !validateVersionRef(value.policySnapshot, "workerEvidence.policySnapshot").ok ||
    !validateAuthority(value.authority) ||
    !validateWorkerBudget(value.budget) ||
    !nonEmpty(value.parentAuthorityDigest) ||
    !nonEmpty(value.parentBudgetDigest) ||
    !nonEmpty(value.contextPackageDigest) ||
    !validateEvidenceDelegations(value.evidenceDelegations) ||
    !["complete", "partial"].includes(value.status as string) ||
    !isDenseArray(value.claims) ||
    !value.claims.every(validateWorkerClaim) ||
    !isDenseArray(value.evidence) ||
    !value.evidence.every(validateVerifiedEvidence) ||
    !denseUniqueStrings(value.uncertainties) ||
    !isRecord(value.consumed) ||
    !exactKeys(value.consumed, ["tokens", "toolCalls"]) ||
    !Number.isSafeInteger(value.consumed.tokens) ||
    (value.consumed.tokens as number) < 0 ||
    !Number.isSafeInteger(value.consumed.toolCalls) ||
    (value.consumed.toolCalls as number) < 0 ||
    (value.consumed.tokens as number) > (value.budget as WorkerBudget).maxTokens ||
    (value.consumed.toolCalls as number) > (value.budget as WorkerBudget).maxToolCalls ||
    !nonEmpty(value.traceId) ||
    !finiteTimestamp(value.createdAt)
  ) {
    return reject("INVALID_WORKER_EVIDENCE", "worker evidence package contains invalid runtime values");
  }
  if (value.permissionDigest !== permissionDigest({
    tenantId: value.tenantId as string,
    principal: value.principal as unknown as EnterprisePrincipal,
    purpose: value.purpose as string,
    policySnapshot: value.policySnapshot as unknown as VersionRef,
  })) {
    return reject("INVALID_WORKER_EVIDENCE", "worker evidence permission digest does not match scope");
  }
  const evidenceIds = new Set((value.evidence as unknown as VerifiedEvidence[]).map((entry) => entry.id));
  const delegatedEvidence = new Map(
    (value.evidenceDelegations as unknown as WorkerEvidenceDelegation[]).map((entry) => [entry.evidenceId, entry.evidenceDigest]),
  );
  if ((value.evidence as unknown as VerifiedEvidence[]).some((entry) => delegatedEvidence.get(entry.id) !== entry.digest)) {
    return reject("WORKER_EVIDENCE_NOT_DELEGATED", "worker evidence is not bound to its delegated id and digest");
  }
  if ((value.evidence as unknown as VerifiedEvidence[]).some((entry) =>
    Date.parse(entry.observedAt) > Date.parse(value.createdAt as string) ||
    Date.parse(entry.provenance.observedAt) > Date.parse(value.createdAt as string) ||
    Boolean(entry.expiresAt && Date.parse(entry.expiresAt) <= Date.parse(value.createdAt as string))
  )) {
    return reject("WORKER_EVIDENCE_TIME_INVALID", "worker evidence is outside the package time boundary");
  }
  if ((value.claims as unknown as WorkerClaim[]).some((claim) => claim.evidenceIds.some((id) => !evidenceIds.has(id)))) {
    return reject("INVALID_WORKER_EVIDENCE", "worker claim references evidence outside its package");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_WORKER_EVIDENCE", "worker evidence digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as WorkerEvidencePackage)));
}

export function createWorkerEvidencePackage(
  input: CreateWorkerEvidencePackageInput,
): ContractResult<WorkerEvidencePackage> {
  if (!isRecord(input) || !exactKeys(input, ["context", "status", "claims", "evidence", "uncertainties", "consumed", "traceId", "at"])) {
    return reject("INVALID_WORKER_EVIDENCE", "worker evidence input has an invalid schema");
  }
  const contextValidation = validateWorkerContextPackage(input.context);
  if (!contextValidation.ok) return contextValidation;
  const context = contextValidation.value;
  if (
    !["complete", "partial"].includes(input.status) ||
    !isDenseArray(input.claims) ||
    !input.claims.every(validateWorkerClaim) ||
    !isDenseArray(input.evidence) ||
    !input.evidence.every(validateVerifiedEvidence) ||
    !denseUniqueStrings(input.uncertainties) ||
    !isRecord(input.consumed) ||
    !exactKeys(input.consumed, ["tokens", "toolCalls"]) ||
    !Number.isSafeInteger(input.consumed.tokens) ||
    input.consumed.tokens < 0 ||
    !Number.isSafeInteger(input.consumed.toolCalls) ||
    input.consumed.toolCalls < 0 ||
    input.consumed.tokens > context.budget.maxTokens ||
    input.consumed.toolCalls > context.budget.maxToolCalls ||
    !nonEmpty(input.traceId) ||
    !finiteTimestamp(input.at) ||
    Date.parse(input.at) < Date.parse(context.createdAt)
  ) {
    return reject("INVALID_WORKER_EVIDENCE", "worker evidence input contains invalid runtime values");
  }
  const evidenceIds = new Set(input.evidence.map((entry) => entry.id));
  if (input.evidence.some((entry) => {
    const roleAllowed = entry.allowedRoles?.some((role) => context.principal.roles.includes(role)) ?? false;
    return (
      entry.tenantId !== context.tenantId ||
      (!entry.allowedPrincipalIds.includes(context.principalId) && !roleAllowed) ||
      !entry.allowedPurposes.includes(context.purpose) ||
      entry.permissionDigest !== context.permissionDigest
    );
  })) {
    return reject("WORKER_EVIDENCE_SCOPE_MISMATCH", "worker evidence must retain the context tenant, principal, purpose, and permission digest");
  }
  if (input.evidence.some((entry) =>
    Date.parse(entry.observedAt) > Date.parse(input.at) ||
    Date.parse(entry.provenance.observedAt) > Date.parse(input.at) ||
    Boolean(entry.expiresAt && Date.parse(entry.expiresAt) <= Date.parse(input.at))
  )) {
    return reject("WORKER_EVIDENCE_TIME_INVALID", "worker evidence is outside the delegated execution time boundary");
  }
  const delegatedEvidence = new Map(context.evidenceDelegations.map((entry) => [entry.evidenceId, entry.evidenceDigest]));
  if (input.evidence.some((entry) => delegatedEvidence.get(entry.id) !== entry.digest)) {
    return reject("WORKER_EVIDENCE_NOT_DELEGATED", "worker evidence must match an explicitly delegated id and digest");
  }
  if (input.claims.some((claim) => claim.evidenceIds.some((id) => !evidenceIds.has(id)))) {
    return reject("INVALID_WORKER_EVIDENCE", "worker claims must reference packaged evidence");
  }
  const payload = {
    schemaVersion: "worker-evidence-package/v1" as const,
    assignmentId: context.assignmentId,
    workerId: context.workerId,
    tenantId: context.tenantId,
    principal: copyJson(context.principal),
    principalId: context.principalId,
    purpose: context.purpose,
    permissionDigest: context.permissionDigest,
    policySnapshot: copyVersionRef(context.policySnapshot),
    authority: copyAuthority(context.authority),
    budget: copyJson(context.budget),
    parentAuthorityDigest: context.parentAuthorityDigest,
    parentBudgetDigest: context.parentBudgetDigest,
    contextPackageDigest: context.digest,
    evidenceDelegations: context.evidenceDelegations.map(copyJson),
    status: input.status,
    claims: input.claims.map(copyJson),
    evidence: input.evidence.map(copyJson),
    uncertainties: [...input.uncertainties],
    consumed: copyJson(input.consumed),
    traceId: input.traceId,
    createdAt: input.at,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

export interface ReducedWorkerClaim extends WorkerClaim {
  workerIds: readonly string[];
  sourceIds: readonly string[];
}

export interface ReducedEvidencePackage {
  schemaVersion: "reduced-evidence-package/v1";
  tenantId: string;
  purpose: string;
  policySnapshot: VersionRef;
  permissionFingerprint: string;
  status: "complete" | "partial" | "conflicted";
  claims: readonly ReducedWorkerClaim[];
  conflicts: readonly EvidenceConflict[];
  evidence: readonly VerifiedEvidence[];
  uncertainties: readonly string[];
  consumed: { tokens: number; toolCalls: number };
  assignmentIds: readonly string[];
  reducedAt: string;
  digest: string;
}

export interface ReduceWorkerEvidenceInput {
  tenantId: string;
  purpose: string;
  policySnapshot: VersionRef;
  parentAuthority: AuthorityScope;
  parentBudget: WorkerBudget;
  packages: readonly WorkerEvidencePackage[];
  at: string;
}

export function reduceWorkerEvidence(
  input: ReduceWorkerEvidenceInput,
): ContractResult<ReducedEvidencePackage> {
  if (!isRecord(input) || !exactKeys(input, ["tenantId", "purpose", "policySnapshot", "parentAuthority", "parentBudget", "packages", "at"])) {
    return reject("INVALID_EVIDENCE_REDUCTION", "evidence reduction input has an invalid schema");
  }
  if (
    !nonEmpty(input.tenantId) ||
    !nonEmpty(input.purpose) ||
    !validateVersionRef(input.policySnapshot, "evidenceReduction.policySnapshot").ok ||
    !validateAuthority(input.parentAuthority) ||
    !validateWorkerBudget(input.parentBudget) ||
    !isDenseArray(input.packages) ||
    input.packages.length === 0 ||
    !finiteTimestamp(input.at)
  ) {
    return reject("INVALID_EVIDENCE_REDUCTION", "evidence reduction contains invalid runtime values");
  }
  const packages: WorkerEvidencePackage[] = [];
  for (const candidate of input.packages) {
    const validation = validateWorkerEvidencePackage(candidate);
    if (!validation.ok) return validation;
    packages.push(validation.value);
  }
  const assignmentIds = packages.map((entry) => entry.assignmentId);
  if (new Set(assignmentIds).size !== assignmentIds.length) {
    return reject("INVALID_EVIDENCE_REDUCTION", "worker assignment ids must be unique");
  }
  const expectedAuthorityDigest = stableDigest({
    tools: sorted(input.parentAuthority.tools),
    resources: sorted(input.parentAuthority.resources),
    actions: sorted(input.parentAuthority.actions),
  });
  const expectedBudgetDigest = stableDigest(input.parentBudget);
  for (const entry of packages) {
    if (
      entry.tenantId !== input.tenantId ||
      entry.purpose !== input.purpose ||
      stableSerialize(entry.policySnapshot) !== stableSerialize(input.policySnapshot) ||
      entry.parentAuthorityDigest !== expectedAuthorityDigest ||
      entry.parentBudgetDigest !== expectedBudgetDigest ||
      !authoritySubset(entry.authority, input.parentAuthority) ||
      Date.parse(entry.createdAt) > Date.parse(input.at)
    ) {
      return reject("WORKER_SCOPE_EXPANSION", `worker package ${entry.assignmentId} escaped reducer scope`);
    }
    if (entry.evidence.some((evidence) => {
      const roleAllowed = evidence.allowedRoles?.some((role) => entry.principal.roles.includes(role)) ?? false;
      return (
        evidence.tenantId !== entry.tenantId ||
        (!evidence.allowedPrincipalIds.includes(entry.principalId) && !roleAllowed) ||
        !evidence.allowedPurposes.includes(entry.purpose) ||
        evidence.permissionDigest !== entry.permissionDigest
      );
    })) {
      return reject("WORKER_EVIDENCE_SCOPE_MISMATCH", `worker package ${entry.assignmentId} contains cross-scope evidence`);
    }
    const delegatedEvidence = new Map(entry.evidenceDelegations.map((delegation) => [delegation.evidenceId, delegation.evidenceDigest]));
    if (entry.evidence.some((evidence) => delegatedEvidence.get(evidence.id) !== evidence.digest)) {
      return reject("WORKER_EVIDENCE_NOT_DELEGATED", `worker package ${entry.assignmentId} contains undelegated evidence`);
    }
    if (entry.evidence.some((evidence) =>
      Date.parse(evidence.observedAt) > Date.parse(input.at) ||
      Date.parse(evidence.provenance.observedAt) > Date.parse(input.at) ||
      Boolean(evidence.expiresAt && Date.parse(evidence.expiresAt) <= Date.parse(input.at))
    )) {
      return reject("WORKER_EVIDENCE_TIME_INVALID", `worker package ${entry.assignmentId} evidence is outside reducer time`);
    }
  }
  const allocated = packages.reduce(
    (total, entry) => ({ tokens: total.tokens + entry.budget.maxTokens, toolCalls: total.toolCalls + entry.budget.maxToolCalls }),
    { tokens: 0, toolCalls: 0 },
  );
  const consumed = packages.reduce(
    (total, entry) => ({ tokens: total.tokens + entry.consumed.tokens, toolCalls: total.toolCalls + entry.consumed.toolCalls }),
    { tokens: 0, toolCalls: 0 },
  );
  if (
    allocated.tokens > input.parentBudget.maxTokens ||
    allocated.toolCalls > input.parentBudget.maxToolCalls ||
    consumed.tokens > input.parentBudget.maxTokens ||
    consumed.toolCalls > input.parentBudget.maxToolCalls
  ) {
    return reject("WORKER_BUDGET_EXPANSION", "worker budget tree exceeds the parent budget");
  }
  const evidenceById = new Map<string, VerifiedEvidence>();
  for (const entry of packages) {
    for (const evidence of entry.evidence) {
      const prior = evidenceById.get(evidence.id);
      if (prior && prior.digest !== evidence.digest) {
        return reject("EVIDENCE_ID_COLLISION", `evidence id ${evidence.id} has conflicting digests`);
      }
      evidenceById.set(evidence.id, evidence);
    }
  }
  const claimGroups = new Map<string, Array<{ claim: WorkerClaim; workerId: string }>>();
  for (const entry of packages) {
    for (const claim of entry.claims) {
      const group = claimGroups.get(claim.claimId) ?? [];
      group.push({ claim, workerId: entry.workerId });
      claimGroups.set(claim.claimId, group);
    }
  }
  const claims: ReducedWorkerClaim[] = [];
  const conflicts: EvidenceConflict[] = [];
  for (const [claimId, group] of claimGroups) {
    const values = [...new Set(group.map((entry) => entry.claim.value))].sort();
    const evidenceIds = [...new Set(group.flatMap((entry) => entry.claim.evidenceIds))].sort();
    if (values.length > 1) {
      conflicts.push({ claimId, values, evidenceIds });
      continue;
    }
    const sourceIds = [...new Set(evidenceIds.map((id) => evidenceById.get(id)?.provenance.sourceId).filter(nonEmpty))].sort();
    claims.push({
      claimId,
      value: values[0]!,
      evidenceIds,
      confidence: Math.min(...group.map((entry) => entry.claim.confidence)),
      workerIds: [...new Set(group.map((entry) => entry.workerId))].sort(),
      sourceIds,
    });
  }
  claims.sort((left, right) => left.claimId.localeCompare(right.claimId));
  conflicts.sort((left, right) => left.claimId.localeCompare(right.claimId));
  const uncertainties = [...new Set(packages.flatMap((entry) => entry.uncertainties))].sort();
  const status: ReducedEvidencePackage["status"] = conflicts.length > 0
    ? "conflicted"
    : packages.some((entry) => entry.status === "partial") || uncertainties.length > 0
      ? "partial"
      : "complete";
  const payload = {
    schemaVersion: "reduced-evidence-package/v1" as const,
    tenantId: input.tenantId,
    purpose: input.purpose,
    policySnapshot: copyVersionRef(input.policySnapshot),
    permissionFingerprint: stableDigest({
      tenantId: input.tenantId,
      purpose: input.purpose,
      policySnapshot: input.policySnapshot,
      authority: {
        tools: sorted(input.parentAuthority.tools),
        resources: sorted(input.parentAuthority.resources),
        actions: sorted(input.parentAuthority.actions),
      },
    }),
    status,
    claims,
    conflicts,
    evidence: [...evidenceById.values()].sort((left, right) => left.id.localeCompare(right.id)),
    uncertainties,
    consumed,
    assignmentIds: [...assignmentIds].sort(),
    reducedAt: input.at,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

function validateEnterpriseContextBuildSnapshotInternal(
  value: unknown,
): ContractResult<EnterpriseContextBuild> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "request", "compiledContext", "package", "manifest", "fingerprint", "budget", "digest",
  ])) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "enterprise context build has an invalid schema");
  }
  if (value.schemaVersion !== "enterprise-context-build/v1") {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "enterprise context build schema version is unsupported");
  }
  const requestValidation = validateContextRequest(value.request);
  if (!requestValidation.ok) return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "enterprise context request is invalid");
  const compiledValidation = validateCompiledContextSnapshot(value.compiledContext);
  if (!compiledValidation.ok) return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "compiled context snapshot is invalid");
  const request = requestValidation.value;
  const compiled = compiledValidation.value;
  if (
    compiled.runId !== request.runId ||
    compiled.stage !== request.stage ||
    compiled.compiledAt !== request.requestedAt ||
    compiled.audience !== request.contextPolicy.audience ||
    stableSerialize(compiled.policy) !== stableSerialize(request.contextPolicy.ref) ||
    compiled.completionReserve !== request.contextPolicy.completionReserve
  ) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "compiled context does not match its request");
  }
  if (!isRecord(value.fingerprint) || !exactKeys(value.fingerprint, ["permissionDigest", "semanticDigest", "digest"])) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context fingerprint has an invalid schema");
  }
  const expectedPermissionDigest = permissionDigest(request);
  const expectedSemanticDigest = stableDigest(fingerprintPayload(request, compiled));
  const fingerprintPayloadValue = {
    permissionDigest: expectedPermissionDigest,
    semanticDigest: expectedSemanticDigest,
  };
  if (
    value.fingerprint.permissionDigest !== expectedPermissionDigest ||
    value.fingerprint.semanticDigest !== expectedSemanticDigest ||
    value.fingerprint.digest !== stableDigest(fingerprintPayloadValue)
  ) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context fingerprint does not match semantic inputs");
  }
  if (!isRecord(value.budget) || !exactKeys(value.budget, [
    "maxInputTokens", "completionReserve", "safetyReserve", "availableInputTokens", "usedInputTokens",
    "remainingInputTokens", "byKind", "digest",
  ])) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "budget report has an invalid schema");
  }
  const expectedBudget = makeBudgetReport(request, compiled);
  if (stableSerialize(value.budget) !== stableSerialize(expectedBudget)) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "budget report does not match compiled context");
  }
  if (!isRecord(value.package) || !exactKeys(value.package, [
    "packageId", "requestId", "tenantId", "principalId", "purpose", "permissionDigest", "policySnapshot",
    "fingerprintDigest", "blocks", "expiresAt", "digest",
  ])) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context package has an invalid schema");
  }
  const packageValue = value.package;
  if (
    !nonEmpty(packageValue.packageId) ||
    packageValue.requestId !== request.requestId ||
    packageValue.tenantId !== request.tenantId ||
    packageValue.principalId !== request.principal.id ||
    packageValue.purpose !== request.purpose ||
    packageValue.permissionDigest !== expectedPermissionDigest ||
    stableSerialize(packageValue.policySnapshot) !== stableSerialize(request.policySnapshot) ||
    packageValue.fingerprintDigest !== value.fingerprint.digest ||
    !isDenseArray(packageValue.blocks) ||
    stableSerialize(packageValue.blocks) !== stableSerialize(compiled.blocks) ||
    packageValue.expiresAt !== request.deadlineAt
  ) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context package does not match request or compiled blocks");
  }
  const { digest: packageDigest, ...packagePayload } = packageValue;
  if (!validateDigest(packagePayload, packageDigest)) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context package digest does not match content");
  }
  if (!isRecord(value.manifest) || !exactKeys(value.manifest, [
    "manifestId", "requestId", "policySnapshot", "candidateLedger", "decisions", "compiledContextDigest", "budgetDigest",
    "fingerprintDigest", "digest",
  ])) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context manifest has an invalid schema");
  }
  const manifestValue = value.manifest;
  if (
    !nonEmpty(manifestValue.manifestId) ||
    manifestValue.requestId !== request.requestId ||
    stableSerialize(manifestValue.policySnapshot) !== stableSerialize(request.policySnapshot) ||
    !isDenseArray(manifestValue.candidateLedger) ||
    !isDenseArray(manifestValue.decisions) ||
    manifestValue.compiledContextDigest !== compiled.digest ||
    manifestValue.budgetDigest !== expectedBudget.digest ||
    manifestValue.fingerprintDigest !== value.fingerprint.digest
  ) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context manifest does not match build components");
  }
  const candidateIds = new Set<string>();
  for (const candidate of manifestValue.candidateLedger) {
    if (
      !isRecord(candidate) ||
      !exactKeys(candidate, ["itemId", "candidateDigest"]) ||
      !nonEmpty(candidate.itemId) ||
      !nonEmpty(candidate.candidateDigest) ||
      candidateIds.has(candidate.itemId)
    ) {
      return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context candidate audit ledger is invalid");
    }
    candidateIds.add(candidate.itemId);
  }
  const decisionIds = new Set<string>();
  const decisionById = new Map<string, EnterpriseContextDecision>();
  for (const decision of manifestValue.decisions) {
    if (
      !isRecord(decision) ||
      !exactKeys(decision, ["itemId", "authorized", "authorizationDecisionId", "authorizationReason", "selected", "selectionReason", "source"]) ||
      !nonEmpty(decision.itemId) ||
      decisionIds.has(decision.itemId) ||
      typeof decision.authorized !== "boolean" ||
      !nonEmpty(decision.authorizationDecisionId) ||
      !["allowed", "tenant-mismatch", "principal-denied", "purpose-denied"].includes(decision.authorizationReason as string) ||
      decision.authorized !== (decision.authorizationReason === "allowed") ||
      typeof decision.selected !== "boolean" ||
      !nonEmpty(decision.selectionReason) ||
      (!decision.authorized && (decision.selected || decision.selectionReason !== "authorization-denied")) ||
      !validateProvenanceRef(decision.source, "enterpriseManifest.decision.source").ok
    ) {
      return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context manifest contains an invalid decision");
    }
    decisionIds.add(decision.itemId as string);
    decisionById.set(decision.itemId as string, decision as unknown as EnterpriseContextDecision);
  }
  if (
    candidateIds.size !== decisionIds.size ||
    [...candidateIds].some((itemId) => !decisionIds.has(itemId)) ||
    manifestValue.manifestId !== `ctxman-${stableDigest({
      candidateLedger: manifestValue.candidateLedger,
      decisions: manifestValue.decisions,
    }).slice(7, 23)}`
  ) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context manifest identity does not bind the complete candidate decision ledger");
  }
  const compiledLedgerIds = new Set(compiled.ledger.map((entry) => entry.itemId));
  for (const ledger of compiled.ledger) {
    const decision = decisionById.get(ledger.itemId);
    if (
      !decision ||
      !decision.authorized ||
      decision.selected !== ledger.included ||
      decision.selectionReason !== ledger.reason ||
      stableSerialize(decision.source) !== stableSerialize(ledger.source)
    ) {
      return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "manifest decision does not match compiler ledger");
    }
  }
  if ([...decisionById.values()].some((decision) => decision.authorized && !compiledLedgerIds.has(decision.itemId))) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "authorized manifest decision is missing from compiler ledger");
  }
  const { digest: manifestDigest, ...manifestPayload } = manifestValue;
  if (!validateDigest(manifestPayload, manifestDigest)) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "context manifest digest does not match content");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) {
    return reject("INVALID_ENTERPRISE_CONTEXT_BUILD", "enterprise context build digest does not match content");
  }
  return succeed(deepFreeze(copyJson(value as unknown as EnterpriseContextBuild)));
}

function validateEvidenceAssessment(value: unknown): ContractResult<EvidenceAssessment> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "tenantId", "principal", "principalId", "purpose", "policySnapshot", "permissionDigest",
    "evaluatedAt", "decision", "evidence", "denied", "conflicts", "requirements", "coverage", "digest",
  ])) {
    return reject("INVALID_EVIDENCE_ASSESSMENT", "evidence assessment has an invalid schema");
  }
  if (
    value.schemaVersion !== "evidence-assessment/v1" ||
    !nonEmpty(value.tenantId) ||
    !validatePrincipal(value.principal) ||
    value.principalId !== value.principal.id ||
    !nonEmpty(value.purpose) ||
    !validateVersionRef(value.policySnapshot, "evidenceAssessment.policySnapshot").ok ||
    !nonEmpty(value.permissionDigest) ||
    !finiteTimestamp(value.evaluatedAt) ||
    !["proceed", "abstain"].includes(value.decision as string) ||
    !isDenseArray(value.evidence) ||
    !value.evidence.every(validateVerifiedEvidence) ||
    !isDenseArray(value.denied) ||
    !isDenseArray(value.conflicts) ||
    !isDenseArray(value.requirements) ||
    value.requirements.length === 0 ||
    !isRecord(value.coverage)
  ) {
    return reject("INVALID_EVIDENCE_ASSESSMENT", "evidence assessment contains invalid runtime values");
  }
  const expectedPermission = permissionDigest({
    tenantId: value.tenantId as string,
    principal: value.principal as unknown as EnterprisePrincipal,
    purpose: value.purpose as string,
    policySnapshot: value.policySnapshot as unknown as VersionRef,
  });
  if (value.permissionDigest !== expectedPermission) {
    return reject("INVALID_EVIDENCE_ASSESSMENT", "evidence permission digest does not match scope");
  }
  const evidence = value.evidence as unknown as VerifiedEvidence[];
  if (evidence.some((entry) => {
    const roleAllowed = entry.allowedRoles?.some((role) => (value.principal as unknown as EnterprisePrincipal).roles.includes(role)) ?? false;
    return (
      entry.tenantId !== value.tenantId ||
      (!entry.allowedPrincipalIds.includes(value.principalId as string) && !roleAllowed) ||
      !entry.allowedPurposes.includes(value.purpose as string) ||
      entry.permissionDigest !== expectedPermission ||
      Date.parse(entry.observedAt) > Date.parse(value.evaluatedAt as string) ||
      Date.parse(entry.provenance.observedAt) > Date.parse(value.evaluatedAt as string) ||
      Boolean(entry.expiresAt && Date.parse(entry.expiresAt) <= Date.parse(value.evaluatedAt as string))
    );
  })) {
    return reject("INVALID_EVIDENCE_ASSESSMENT", "selected evidence escaped the assessment scope");
  }
  const requirements = value.requirements as unknown as EvidenceRequirement[];
  if (!requirements.every(
    (requirement) =>
      isRecord(requirement) &&
      exactKeys(requirement, ["claimId", "minIndependentSources", "minAuthority", "minConfidence"]) &&
      nonEmpty(requirement.claimId) &&
      Number.isSafeInteger(requirement.minIndependentSources) &&
      requirement.minIndependentSources > 0 &&
      finiteUnit(requirement.minAuthority) &&
      finiteUnit(requirement.minConfidence),
  ) || new Set(requirements.map((entry) => entry.claimId)).size !== requirements.length) {
    return reject("INVALID_EVIDENCE_ASSESSMENT", "evidence requirements are invalid");
  }
  for (const denied of value.denied) {
    if (
      !isRecord(denied) ||
      !exactKeys(denied, ["candidateId", "authorizationDecisionId", "reason"]) ||
      !nonEmpty(denied.candidateId) ||
      !nonEmpty(denied.authorizationDecisionId) ||
      !["tenant-mismatch", "principal-denied", "purpose-denied", "expired"].includes(denied.reason as string)
    ) {
      return reject("INVALID_EVIDENCE_ASSESSMENT", "denied evidence ledger is invalid");
    }
  }
  const groups = new Map<string, VerifiedEvidence[]>();
  for (const entry of evidence) {
    const group = groups.get(entry.claimId) ?? [];
    group.push(entry);
    groups.set(entry.claimId, group);
  }
  const expectedConflicts: EvidenceConflict[] = [];
  for (const [claimId, group] of groups) {
    const values = [...new Set(group.map((entry) => entry.value))].sort();
    if (values.length > 1) expectedConflicts.push({ claimId, values, evidenceIds: group.map((entry) => entry.id).sort() });
  }
  expectedConflicts.sort((left, right) => left.claimId.localeCompare(right.claimId));
  if (stableSerialize(value.conflicts) !== stableSerialize(expectedConflicts)) {
    return reject("INVALID_EVIDENCE_ASSESSMENT", "evidence conflict set does not match selected evidence");
  }
  const conflictIds = new Set(expectedConflicts.map((entry) => entry.claimId));
  const coveredClaimIds: string[] = [];
  const missingClaimIds: string[] = [];
  for (const requirement of requirements) {
    const eligible = (groups.get(requirement.claimId) ?? []).filter(
      (entry) => entry.authority >= requirement.minAuthority && entry.confidence >= requirement.minConfidence,
    );
    if (!conflictIds.has(requirement.claimId) && independentEvidenceCount(eligible) >= requirement.minIndependentSources) {
      coveredClaimIds.push(requirement.claimId);
    } else {
      missingClaimIds.push(requirement.claimId);
    }
  }
  const expectedCoverage: EvidenceCoverage = {
    requiredClaimIds: requirements.map((entry) => entry.claimId),
    coveredClaimIds,
    missingClaimIds,
    ratio: coveredClaimIds.length / requirements.length,
  };
  const expectedDecision = missingClaimIds.length === 0 && expectedConflicts.length === 0 ? "proceed" : "abstain";
  if (stableSerialize(value.coverage) !== stableSerialize(expectedCoverage) || value.decision !== expectedDecision) {
    return reject("INVALID_EVIDENCE_ASSESSMENT", "evidence coverage or decision is inconsistent");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_EVIDENCE_ASSESSMENT", "evidence assessment digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as EvidenceAssessment)));
}

function validateReducedEvidencePackage(value: unknown): ContractResult<ReducedEvidencePackage> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "tenantId", "purpose", "policySnapshot", "permissionFingerprint", "status", "claims",
    "conflicts", "evidence", "uncertainties", "consumed", "assignmentIds", "reducedAt", "digest",
  ])) {
    return reject("INVALID_REDUCED_EVIDENCE", "reduced evidence package has an invalid schema");
  }
  if (
    value.schemaVersion !== "reduced-evidence-package/v1" ||
    !nonEmpty(value.tenantId) ||
    !nonEmpty(value.purpose) ||
    !validateVersionRef(value.policySnapshot, "reducedEvidence.policySnapshot").ok ||
    !nonEmpty(value.permissionFingerprint) ||
    !["complete", "partial", "conflicted"].includes(value.status as string) ||
    !isDenseArray(value.claims) ||
    !isDenseArray(value.conflicts) ||
    !isDenseArray(value.evidence) ||
    !value.evidence.every(validateVerifiedEvidence) ||
    !denseUniqueStrings(value.uncertainties) ||
    !isRecord(value.consumed) ||
    !exactKeys(value.consumed, ["tokens", "toolCalls"]) ||
    !Number.isSafeInteger(value.consumed.tokens) ||
    (value.consumed.tokens as number) < 0 ||
    !Number.isSafeInteger(value.consumed.toolCalls) ||
    (value.consumed.toolCalls as number) < 0 ||
    !denseUniqueStrings(value.assignmentIds, false) ||
    !finiteTimestamp(value.reducedAt)
  ) {
    return reject("INVALID_REDUCED_EVIDENCE", "reduced evidence package contains invalid runtime values");
  }
  for (const claim of value.claims) {
    if (!validateReducedWorkerClaim(claim)) {
      return reject("INVALID_REDUCED_EVIDENCE", "reduced claim is invalid");
    }
  }
  const evidence = value.evidence as unknown as VerifiedEvidence[];
  const evidenceById = new Map<string, VerifiedEvidence>();
  for (const entry of evidence) {
    if (
      evidenceById.has(entry.id) ||
      entry.tenantId !== value.tenantId ||
      !entry.allowedPurposes.includes(value.purpose as string) ||
      Date.parse(entry.observedAt) > Date.parse(value.reducedAt as string) ||
      Date.parse(entry.provenance.observedAt) > Date.parse(value.reducedAt as string) ||
      Boolean(entry.expiresAt && Date.parse(entry.expiresAt) <= Date.parse(value.reducedAt as string))
    ) {
      return reject("INVALID_REDUCED_EVIDENCE", "reduced evidence escaped scope or time boundaries");
    }
    evidenceById.set(entry.id, entry);
  }
  const claimIds = new Set<string>();
  for (const claim of value.claims as unknown as ReducedWorkerClaim[]) {
    const expectedSourceIds = [...new Set(claim.evidenceIds.map((id) => evidenceById.get(id)?.provenance.sourceId).filter(nonEmpty))].sort();
    if (
      claimIds.has(claim.claimId) ||
      expectedSourceIds.length === 0 ||
      claim.evidenceIds.some((id) => !evidenceById.has(id)) ||
      stableSerialize(claim.sourceIds) !== stableSerialize(expectedSourceIds)
    ) {
      return reject("INVALID_REDUCED_EVIDENCE", "reduced claim provenance does not match packaged evidence");
    }
    claimIds.add(claim.claimId);
  }
  for (const conflict of value.conflicts) {
    if (
      !isRecord(conflict) ||
      !exactKeys(conflict, ["claimId", "values", "evidenceIds"]) ||
      !nonEmpty(conflict.claimId) ||
      !denseUniqueStrings(conflict.values, false) ||
      conflict.values.length < 2 ||
      !denseUniqueStrings(conflict.evidenceIds, false)
    ) {
      return reject("INVALID_REDUCED_EVIDENCE", "reduced conflict is invalid");
    }
  }
  if ((value.status === "conflicted") !== (value.conflicts.length > 0)) {
    return reject("INVALID_REDUCED_EVIDENCE", "reduced status does not match conflicts");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_REDUCED_EVIDENCE", "reduced evidence digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as ReducedEvidencePackage)));
}

export interface RuntimeTraceSpan {
  name: string;
  startedAt: string;
  endedAt: string;
  attributes: Readonly<Record<string, string | number | boolean>>;
  digest: string;
}

export interface EnterpriseRuntimeTrace {
  traceId: string;
  spans: readonly RuntimeTraceSpan[];
  digest: string;
}

function traceSpan(name: string, at: string, attributes: RuntimeTraceSpan["attributes"]): RuntimeTraceSpan {
  const payload = { name, startedAt: at, endedAt: at, attributes: copyJson(attributes) };
  return deepFreeze({ ...payload, digest: stableDigest(payload) });
}

function runtimeTrace(scenarioId: string, seed: number, at: string, spans: readonly RuntimeTraceSpan[]): EnterpriseRuntimeTrace {
  const payload = {
    traceId: `trace-${stableDigest({ scenarioId, seed }).slice(7, 23)}`,
    spans: spans.map(copyJson),
  };
  return deepFreeze({ ...payload, digest: stableDigest(payload) });
}

function validateRuntimeTrace(value: unknown): ContractResult<EnterpriseRuntimeTrace> {
  if (!isRecord(value) || !exactKeys(value, ["traceId", "spans", "digest"]) || !nonEmpty(value.traceId) || !isDenseArray(value.spans) || value.spans.length === 0) {
    return reject("INVALID_RUNTIME_TRACE", "runtime trace has an invalid schema");
  }
  for (const span of value.spans) {
    if (
      !isRecord(span) ||
      !exactKeys(span, ["name", "startedAt", "endedAt", "attributes", "digest"]) ||
      !nonEmpty(span.name) ||
      !finiteTimestamp(span.startedAt) ||
      !finiteTimestamp(span.endedAt) ||
      Date.parse(span.endedAt) < Date.parse(span.startedAt) ||
      !isRecord(span.attributes) ||
      Object.values(span.attributes).some((attribute) => !["string", "number", "boolean"].includes(typeof attribute))
    ) {
      return reject("INVALID_RUNTIME_TRACE", "runtime trace contains an invalid span");
    }
    const { digest, ...payload } = span;
    if (!validateDigest(payload, digest)) return reject("INVALID_RUNTIME_TRACE", "runtime span digest does not match content");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_RUNTIME_TRACE", "runtime trace digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as EnterpriseRuntimeTrace)));
}

export interface ProductionChangeReviewInput {
  scenarioId: string;
  at: string;
  seed: number;
  run: RunManifest;
  behavior: BehaviorBundle;
  context: BuildEnterpriseContextInput;
  evidence: {
    candidates: readonly EvidenceCandidate[];
    policySnapshot: VersionRef;
    requirements: readonly EvidenceRequirement[];
  };
  ledger: TaskLedger;
  memories: readonly GovernedMemoryRecord[];
  multiAgent?: {
    parentAuthority: AuthorityScope;
    parentBudget: WorkerBudget;
    packages: readonly WorkerEvidencePackage[];
  };
}

export interface ProductionChangeReview {
  schemaVersion: "production-change-review/v1";
  scenarioId: string;
  reviewedAt: string;
  seed: number;
  run: RunManifest;
  behavior: BehaviorBundle;
  context: EnterpriseContextBuild;
  evidence: EvidenceAssessment;
  ledger: TaskLedger;
  memory: GovernedMemoryQueryResult;
  reduction?: ReducedEvidencePackage;
  outcome: "READY_FOR_HUMAN_APPROVAL" | "ABSTAIN";
  reasons: readonly string[];
  trace: EnterpriseRuntimeTrace;
  digest: string;
}

const BEHAVIOR_BUNDLE_SURFACES = [
  "prompt",
  "model",
  "toolset",
  "outputContract",
  "contextPolicy",
  "permissionPolicy",
  "evalSuite",
] as const;

function sameRef(left: VersionRef, right: VersionRef): boolean {
  return stableSerialize(left) === stableSerialize(right);
}

function reviewTraceSpans(input: {
  at: string;
  run: RunManifest;
  behavior: BehaviorBundle;
  context: EnterpriseContextBuild;
  evidence: EvidenceAssessment;
  ledger: TaskLedger;
  memory: GovernedMemoryQueryResult;
  reduction?: ReducedEvidencePackage;
  outcome: ProductionChangeReview["outcome"];
  reasons: readonly string[];
}): RuntimeTraceSpan[] {
  return [
    traceSpan("run.validate", input.at, { digest: input.run.digest, status: input.run.status, revision: input.run.revision }),
    traceSpan("behavior.pin", input.at, { digest: input.behavior.digest, ref: `${input.behavior.id}@${input.behavior.version}` }),
    traceSpan("context.build", input.at, { digest: input.context.digest, selected: input.context.package.blocks.length }),
    traceSpan("evidence.evaluate", input.at, { digest: input.evidence.digest, coverage: input.evidence.coverage.ratio }),
    traceSpan("task.hydrate", input.at, { digest: input.ledger.digest, revision: input.ledger.revision }),
    traceSpan("memory.read", input.at, { digest: input.memory.digest, count: input.memory.records.length }),
    traceSpan("multi_agent.reduce", input.at, { digest: input.reduction?.digest ?? "none", status: input.reduction?.status ?? "not-requested" }),
    traceSpan("review.decide", input.at, { outcome: input.outcome, reasonCount: input.reasons.length }),
  ];
}

export function runProductionChangeReview(
  input: ProductionChangeReviewInput,
): ContractResult<ProductionChangeReview> {
  if (!isRecord(input)) return reject("INVALID_PRODUCTION_REVIEW", "production review input must be an object");
  const inputKeys = ["scenarioId", "at", "seed", "run", "behavior", "context", "evidence", "ledger", "memories"];
  if (input.multiAgent !== undefined) inputKeys.push("multiAgent");
  if (!exactKeys(input, inputKeys) || !nonEmpty(input.scenarioId) || !finiteTimestamp(input.at) || !Number.isSafeInteger(input.seed) || input.seed < 0) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review input has invalid identity, clock, or seed");
  }
  if (!isRecord(input.context) || !isRecord(input.evidence)) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review requires context and evidence inputs");
  }
  const contextResult = buildEnterpriseContext(input.context);
  if (!contextResult.ok) return contextResult;
  const context = contextResult.value;
  const runValidation = validateRunManifestSnapshot(input.run);
  const behaviorValidation = validateBehaviorBundleSnapshot(input.behavior);
  if (!runValidation.ok || !behaviorValidation.ok) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review requires valid A1 run and A3 behavior snapshots");
  }
  const run = runValidation.value;
  const behavior = behaviorValidation.value;
  if (
    run.status !== "running" ||
    run.runId !== context.request.runId ||
    run.stage !== context.request.stage ||
    BEHAVIOR_BUNDLE_SURFACES.some((surface) => !sameRef(run.behavior[surface], behavior[surface])) ||
    !sameRef(context.request.modelProfile, behavior.model) ||
    !sameRef(context.request.toolset, behavior.toolset) ||
    !sameRef(context.request.contextPolicy.ref, behavior.contextPolicy) ||
    !sameRef(context.request.policySnapshot, behavior.permissionPolicy) ||
    context.request.contextPolicy.tokenBudget > run.budget.maxTokens ||
    Date.parse(context.request.deadlineAt) > Date.parse(run.budget.deadline) ||
    Date.parse(input.at) < Date.parse(run.lastTransitionAt) ||
    Date.parse(input.at) >= Date.parse(run.budget.deadline)
  ) {
    return reject("RUN_BEHAVIOR_MISMATCH", "run, behavior bundle, and context request are not the same pinned execution");
  }
  if (Date.parse(input.at) < Date.parse(context.request.requestedAt) || Date.parse(input.at) >= Date.parse(context.package.expiresAt)) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review is outside the context package validity window");
  }
  if (!exactKeys(input.evidence, ["candidates", "policySnapshot", "requirements"]) || stableSerialize(input.evidence.policySnapshot) !== stableSerialize(context.request.policySnapshot)) {
    return reject("INVALID_PRODUCTION_REVIEW", "evidence policy snapshot must match the context request");
  }
  const evidenceResult = evaluateEvidence({
    tenantId: context.request.tenantId,
    principal: context.request.principal,
    purpose: context.request.purpose,
    policySnapshot: input.evidence.policySnapshot,
    at: input.at,
    candidates: input.evidence.candidates,
    requirements: input.evidence.requirements,
  });
  if (!evidenceResult.ok) return evidenceResult;
  const evidence = evidenceResult.value;
  const ledgerResult = validateTaskLedger(input.ledger);
  if (!ledgerResult.ok) return ledgerResult;
  const ledger = ledgerResult.value;
  if (
    ledger.tenantId !== context.request.tenantId ||
    stableSerialize(ledger.policySnapshot) !== stableSerialize(context.request.policySnapshot) ||
    context.request.stateRevision !== ledger.revision ||
    !authoritySubset(ledger.authority, run.authority) ||
    Date.parse(ledger.updatedAt) > Date.parse(input.at)
  ) {
    return reject("TASK_SCOPE_MISMATCH", "task ledger tenant, policy, or revision time does not match the review");
  }
  const memoryResult = queryGovernedMemory({
    records: input.memories,
    tenantId: context.request.tenantId,
    principalId: context.request.principal.id,
    purpose: context.request.purpose,
    namespacePrefix: [context.request.tenantId],
    at: input.at,
  });
  if (!memoryResult.ok) return memoryResult;
  let reduction: ReducedEvidencePackage | undefined;
  if (input.multiAgent !== undefined) {
    if (
      !isRecord(input.multiAgent) ||
      !exactKeys(input.multiAgent, ["parentAuthority", "parentBudget", "packages"]) ||
      !validateAuthority(input.multiAgent.parentAuthority) ||
      !authoritySubset(input.multiAgent.parentAuthority, ledger.authority)
    ) {
      return reject("WORKER_SCOPE_EXPANSION", "multi-agent authority must fit the task ledger authority");
    }
    const reductionResult = reduceWorkerEvidence({
      tenantId: context.request.tenantId,
      purpose: context.request.purpose,
      policySnapshot: context.request.policySnapshot,
      parentAuthority: input.multiAgent.parentAuthority,
      parentBudget: input.multiAgent.parentBudget,
      packages: input.multiAgent.packages,
      at: input.at,
    });
    if (!reductionResult.ok) return reductionResult;
    reduction = reductionResult.value;
  }
  const reasons: string[] = [];
  if (context.compiledContext.sufficiency !== "sufficient") reasons.push("context-insufficient");
  if (evidence.decision !== "proceed") reasons.push("evidence-insufficient-or-conflicted");
  if (reduction?.status === "conflicted") reasons.push("worker-conflict");
  if (reduction?.status === "partial") reasons.push("worker-partial");
  const outcome: ProductionChangeReview["outcome"] = reasons.length === 0
    ? "READY_FOR_HUMAN_APPROVAL"
    : "ABSTAIN";
  const spans = reviewTraceSpans({
    at: input.at,
    run,
    behavior,
    context,
    evidence,
    ledger,
    memory: memoryResult.value,
    ...(reduction ? { reduction } : {}),
    outcome,
    reasons,
  });
  const trace = runtimeTrace(input.scenarioId, input.seed, input.at, spans);
  const payload = {
    schemaVersion: "production-change-review/v1" as const,
    scenarioId: input.scenarioId,
    reviewedAt: input.at,
    seed: input.seed,
    run,
    behavior,
    context,
    evidence,
    ledger,
    memory: memoryResult.value,
    ...(reduction ? { reduction } : {}),
    outcome,
    reasons,
    trace,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

function validateProductionChangeReview(value: unknown): ContractResult<ProductionChangeReview> {
  if (!isRecord(value)) return reject("INVALID_PRODUCTION_REVIEW", "production review snapshot must be an object");
  const keys = ["schemaVersion", "scenarioId", "reviewedAt", "seed", "run", "behavior", "context", "evidence", "ledger", "memory", "outcome", "reasons", "trace", "digest"];
  if (value.reduction !== undefined) keys.push("reduction");
  if (!exactKeys(value, keys)) return reject("INVALID_PRODUCTION_REVIEW", "production review snapshot has an invalid schema");
  const context = validateEnterpriseContextBuildSnapshotInternal(value.context);
  const evidence = validateEvidenceAssessment(value.evidence);
  const ledger = validateTaskLedger(value.ledger);
  const trace = validateRuntimeTrace(value.trace);
  const run = validateRunManifestSnapshot(value.run);
  const behavior = validateBehaviorBundleSnapshot(value.behavior);
  if (!context.ok || !evidence.ok || !ledger.ok || !trace.ok || !run.ok || !behavior.ok) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review contains an invalid nested snapshot");
  }
  let reduction: ContractResult<ReducedEvidencePackage> | undefined;
  if (value.reduction !== undefined) {
    reduction = validateReducedEvidencePackage(value.reduction);
    if (!reduction.ok) return reject("INVALID_PRODUCTION_REVIEW", "production review reduction is invalid");
  }
  if (
    value.schemaVersion !== "production-change-review/v1" ||
    !nonEmpty(value.scenarioId) ||
    !finiteTimestamp(value.reviewedAt) ||
    !Number.isSafeInteger(value.seed) ||
    (value.seed as number) < 0 ||
    !["READY_FOR_HUMAN_APPROVAL", "ABSTAIN"].includes(value.outcome as string) ||
    !denseUniqueStrings(value.reasons) ||
    !isRecord(value.memory) ||
    !exactKeys(value.memory, ["records", "digest"]) ||
    !isDenseArray(value.memory.records) ||
    !value.memory.records.every((record) => validateMemoryRecord(record).ok) ||
    value.memory.digest !== stableDigest({ records: value.memory.records }) ||
    context.value.request.tenantId !== evidence.value.tenantId ||
    context.value.request.tenantId !== ledger.value.tenantId ||
    stableSerialize(context.value.request.policySnapshot) !== stableSerialize(evidence.value.policySnapshot) ||
    stableSerialize(context.value.request.policySnapshot) !== stableSerialize(ledger.value.policySnapshot) ||
    context.value.request.stateRevision !== ledger.value.revision ||
    run.value.status !== "running" ||
    run.value.runId !== context.value.request.runId ||
    run.value.stage !== context.value.request.stage ||
    BEHAVIOR_BUNDLE_SURFACES.some((surface) => !sameRef(run.value.behavior[surface], behavior.value[surface])) ||
    !sameRef(context.value.request.modelProfile, behavior.value.model) ||
    !sameRef(context.value.request.toolset, behavior.value.toolset) ||
    !sameRef(context.value.request.contextPolicy.ref, behavior.value.contextPolicy) ||
    !sameRef(context.value.request.policySnapshot, behavior.value.permissionPolicy) ||
    !authoritySubset(ledger.value.authority, run.value.authority) ||
    context.value.request.contextPolicy.tokenBudget > run.value.budget.maxTokens ||
    Date.parse(context.value.request.deadlineAt) > Date.parse(run.value.budget.deadline) ||
    Date.parse(value.reviewedAt) < Date.parse(run.value.lastTransitionAt) ||
    Date.parse(value.reviewedAt) < Date.parse(context.value.request.requestedAt) ||
    Date.parse(value.reviewedAt) >= Date.parse(run.value.budget.deadline) ||
    Date.parse(context.value.package.expiresAt) <= Date.parse(value.reviewedAt) ||
    evidence.value.evaluatedAt !== value.reviewedAt ||
    Date.parse(ledger.value.updatedAt) > Date.parse(value.reviewedAt) ||
    (reduction?.ok === true && reduction.value.reducedAt !== value.reviewedAt) ||
    trace.value.spans.some((span) => span.startedAt !== value.reviewedAt || span.endedAt !== value.reviewedAt)
  ) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review fields are inconsistent");
  }
  const expectedReasons: string[] = [];
  if (context.value.compiledContext.sufficiency !== "sufficient") expectedReasons.push("context-insufficient");
  if (evidence.value.decision !== "proceed") expectedReasons.push("evidence-insufficient-or-conflicted");
  if (reduction?.ok && reduction.value.status === "conflicted") expectedReasons.push("worker-conflict");
  if (reduction?.ok && reduction.value.status === "partial") expectedReasons.push("worker-partial");
  const expectedOutcome = expectedReasons.length === 0 ? "READY_FOR_HUMAN_APPROVAL" : "ABSTAIN";
  if (stableSerialize(value.reasons) !== stableSerialize(expectedReasons) || value.outcome !== expectedOutcome) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review outcome does not match evidence gates");
  }
  const memory = value.memory as unknown as GovernedMemoryQueryResult;
  if (memory.records.some((record) =>
    record.status !== "active" ||
    record.tenantId !== context.value.request.tenantId ||
    record.principalId !== context.value.request.principal.id ||
    !record.allowedPurposes.includes(context.value.request.purpose) ||
    record.namespace[0] !== context.value.request.tenantId ||
    Date.parse(record.createdAt) > Date.parse(value.reviewedAt as string) ||
    Date.parse(record.updatedAt) > Date.parse(value.reviewedAt as string) ||
    Boolean(record.expiresAt && Date.parse(record.expiresAt) <= Date.parse(value.reviewedAt as string))
  )) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review memory projection escaped current scope");
  }
  const expectedTrace = runtimeTrace(
    value.scenarioId as string,
    value.seed as number,
    value.reviewedAt as string,
    reviewTraceSpans({
      at: value.reviewedAt as string,
      run: run.value,
      behavior: behavior.value,
      context: context.value,
      evidence: evidence.value,
      ledger: ledger.value,
      memory,
      ...(reduction?.ok ? { reduction: reduction.value } : {}),
      outcome: expectedOutcome,
      reasons: expectedReasons,
    }),
  );
  if (stableSerialize(trace.value) !== stableSerialize(expectedTrace)) {
    return reject("INVALID_PRODUCTION_REVIEW", "production review trace is not the deterministic execution trace");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_PRODUCTION_REVIEW", "production review digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as ProductionChangeReview)));
}

export interface ProductionReviewReplay {
  matched: boolean;
  expectedDigest: string;
  actualDigest: string;
  review: ProductionChangeReview;
}

export function replayProductionChangeReview(input: {
  input: ProductionChangeReviewInput;
  expectedDigest: string;
}): ContractResult<ProductionReviewReplay> {
  if (!isRecord(input) || !exactKeys(input, ["input", "expectedDigest"]) || !nonEmpty(input.expectedDigest)) {
    return reject("INVALID_PRODUCTION_REPLAY", "production replay input has an invalid schema");
  }
  const replay = runProductionChangeReview(input.input);
  if (!replay.ok) return replay;
  return succeed(deepFreeze({
    matched: replay.value.digest === input.expectedDigest,
    expectedDigest: input.expectedDigest,
    actualDigest: replay.value.digest,
    review: replay.value,
  }));
}

export interface RuntimeEvaluationMetrics {
  passRate: number;
  evidenceCoverage: number;
  aclViolations: number;
  criticalFailures: number;
  p95Ms: number;
  costPerTask: number;
}

export interface RuntimeRolloutThresholds {
  minPassRate: number;
  minEvidenceCoverage: number;
  maxP95RegressionRatio: number;
  maxCostRegressionRatio: number;
}

export interface RuntimeRolloutDecision {
  schemaVersion: "runtime-rollout-decision/v1";
  stage: "shadow" | "canary";
  decision: "advance-to-canary" | "promote" | "block";
  reasons: readonly string[];
  baseline: RuntimeEvaluationMetrics;
  candidate: RuntimeEvaluationMetrics;
  thresholds: RuntimeRolloutThresholds;
  decidedAt: string;
  digest: string;
}

function validateTaskLedgerCompaction(value: unknown): ContractResult<TaskLedgerCompaction> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "taskId", "revision", "summary", "tokenEstimate", "dropped", "lossRisk",
    "recoverableArtifact", "sourceLedgerDigest", "compactedAt", "digest",
  ])) {
    return reject("INVALID_TASK_COMPACTION", "task compaction snapshot has an invalid schema");
  }
  if (!isRecord(value.summary)) return reject("INVALID_TASK_COMPACTION", "task compaction summary must be an object");
  const summaryKeys = [
    "tenantId", "policySnapshot", "authority", "status", "goal", "successCriteria", "currentStep",
    "verifiedFacts", "decisions", "openQuestions",
  ];
  if (value.summary.latestCheckpointId !== undefined) summaryKeys.push("latestCheckpointId");
  if (
    value.schemaVersion !== "task-ledger-compaction/v1" ||
    !nonEmpty(value.taskId) ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 0 ||
    !exactKeys(value.summary, summaryKeys) ||
    !nonEmpty(value.summary.tenantId) ||
    !validateVersionRef(value.summary.policySnapshot, "taskCompaction.policySnapshot").ok ||
    !validateAuthority(value.summary.authority) ||
    !["created", "running", "waiting", "blocked", "completed"].includes(value.summary.status as string) ||
    !nonEmpty(value.summary.goal) ||
    !denseUniqueStrings(value.summary.successCriteria, false) ||
    !nonEmpty(value.summary.currentStep) ||
    !isDenseArray(value.summary.verifiedFacts) ||
    !isDenseArray(value.summary.decisions) ||
    !denseUniqueStrings(value.summary.openQuestions) ||
    (value.summary.latestCheckpointId !== undefined && !nonEmpty(value.summary.latestCheckpointId)) ||
    !Number.isSafeInteger(value.tokenEstimate) ||
    (value.tokenEstimate as number) <= 0 ||
    !denseUniqueStrings(value.dropped) ||
    !["low", "medium"].includes(value.lossRisk as string) ||
    !nonEmpty(value.sourceLedgerDigest) ||
    !finiteTimestamp(value.compactedAt)
  ) {
    return reject("INVALID_TASK_COMPACTION", "task compaction contains invalid runtime values");
  }
  if (!(value.summary.verifiedFacts as unknown[]).every((fact) => validateVerifiedFact(fact, value.compactedAt as string)) ||
      !(value.summary.decisions as unknown[]).every((decision) => validateTaskDecision(decision, value.compactedAt as string))) {
    return reject("INVALID_TASK_COMPACTION", "task compaction lost verified fact or decision provenance");
  }
  const artifact = validateArtifactRef(value.recoverableArtifact, "taskCompaction.recoverableArtifact");
  if (!artifact.ok || !artifact.value.location) {
    return reject("INVALID_TASK_COMPACTION", "task compaction requires a recoverable artifact location");
  }
  const { digest, ...payload } = value;
  if (!validateDigest(payload, digest)) return reject("INVALID_TASK_COMPACTION", "task compaction digest does not match content");
  return succeed(deepFreeze(copyJson(value as unknown as TaskLedgerCompaction)));
}

function validateRuntimeMetrics(value: unknown): value is RuntimeEvaluationMetrics {
  return (
    isRecord(value) &&
    exactKeys(value, ["passRate", "evidenceCoverage", "aclViolations", "criticalFailures", "p95Ms", "costPerTask"]) &&
    finiteUnit(value.passRate) &&
    finiteUnit(value.evidenceCoverage) &&
    Number.isSafeInteger(value.aclViolations) &&
    (value.aclViolations as number) >= 0 &&
    Number.isSafeInteger(value.criticalFailures) &&
    (value.criticalFailures as number) >= 0 &&
    typeof value.p95Ms === "number" &&
    Number.isFinite(value.p95Ms) &&
    value.p95Ms > 0 &&
    typeof value.costPerTask === "number" &&
    Number.isFinite(value.costPerTask) &&
    value.costPerTask > 0
  );
}

function validateRolloutThresholds(value: unknown): value is RuntimeRolloutThresholds {
  return (
    isRecord(value) &&
    exactKeys(value, ["minPassRate", "minEvidenceCoverage", "maxP95RegressionRatio", "maxCostRegressionRatio"]) &&
    finiteUnit(value.minPassRate) &&
    finiteUnit(value.minEvidenceCoverage) &&
    finiteUnit(value.maxP95RegressionRatio) &&
    finiteUnit(value.maxCostRegressionRatio)
  );
}

export function decideRuntimeRollout(input: {
  stage: "shadow" | "canary";
  baseline: RuntimeEvaluationMetrics;
  candidate: RuntimeEvaluationMetrics;
  thresholds: RuntimeRolloutThresholds;
  at: string;
}): ContractResult<RuntimeRolloutDecision> {
  if (!isRecord(input) || !exactKeys(input, ["stage", "baseline", "candidate", "thresholds", "at"])) {
    return reject("INVALID_RUNTIME_ROLLOUT", "runtime rollout input has an invalid schema");
  }
  if (
    !["shadow", "canary"].includes(input.stage) ||
    !validateRuntimeMetrics(input.baseline) ||
    !validateRuntimeMetrics(input.candidate) ||
    !validateRolloutThresholds(input.thresholds) ||
    !finiteTimestamp(input.at)
  ) {
    return reject("INVALID_RUNTIME_ROLLOUT", "runtime rollout input contains invalid runtime values");
  }
  const reasons: string[] = [];
  if (input.candidate.aclViolations > 0) reasons.push("acl-violation");
  if (input.candidate.criticalFailures > 0) reasons.push("critical-failure");
  if (input.candidate.passRate < input.thresholds.minPassRate) reasons.push("pass-rate-below-threshold");
  if (input.candidate.evidenceCoverage < input.thresholds.minEvidenceCoverage) reasons.push("evidence-coverage-below-threshold");
  if ((input.candidate.p95Ms - input.baseline.p95Ms) / input.baseline.p95Ms > input.thresholds.maxP95RegressionRatio) {
    reasons.push("p95-regression");
  }
  if ((input.candidate.costPerTask - input.baseline.costPerTask) / input.baseline.costPerTask > input.thresholds.maxCostRegressionRatio) {
    reasons.push("cost-regression");
  }
  const decision: RuntimeRolloutDecision["decision"] = reasons.length > 0
    ? "block"
    : input.stage === "shadow"
      ? "advance-to-canary"
      : "promote";
  const payload = {
    schemaVersion: "runtime-rollout-decision/v1" as const,
    stage: input.stage,
    decision,
    reasons,
    baseline: copyJson(input.baseline),
    candidate: copyJson(input.candidate),
    thresholds: copyJson(input.thresholds),
    decidedAt: input.at,
  };
  return succeed(deepFreeze({ ...payload, digest: stableDigest(payload) }));
}

function validateRuntimeRolloutDecision(value: unknown): ContractResult<RuntimeRolloutDecision> {
  if (!isRecord(value) || !exactKeys(value, [
    "schemaVersion", "stage", "decision", "reasons", "baseline", "candidate", "thresholds", "decidedAt", "digest",
  ])) {
    return reject("INVALID_RUNTIME_ROLLOUT", "runtime rollout snapshot has an invalid schema");
  }
  if (
    value.schemaVersion !== "runtime-rollout-decision/v1" ||
    !["shadow", "canary"].includes(value.stage as string) ||
    !["advance-to-canary", "promote", "block"].includes(value.decision as string) ||
    !denseUniqueStrings(value.reasons) ||
    !validateRuntimeMetrics(value.baseline) ||
    !validateRuntimeMetrics(value.candidate) ||
    !validateRolloutThresholds(value.thresholds) ||
    !finiteTimestamp(value.decidedAt)
  ) {
    return reject("INVALID_RUNTIME_ROLLOUT", "runtime rollout snapshot contains invalid runtime values");
  }
  const rebuilt = decideRuntimeRollout({
    stage: value.stage as "shadow" | "canary",
    baseline: value.baseline,
    candidate: value.candidate,
    thresholds: value.thresholds,
    at: value.decidedAt as string,
  });
  if (!rebuilt.ok || stableSerialize(rebuilt.value) !== stableSerialize(value)) {
    return reject("INVALID_RUNTIME_ROLLOUT", "runtime rollout snapshot does not match deterministic gates");
  }
  return rebuilt;
}

export type EnterpriseRuntimeSnapshot =
  | EnterpriseContextBuild
  | EvidenceAssessment
  | TaskLedger
  | GovernedMemoryRecord
  | TaskLedgerCompaction
  | ContextCacheEntry
  | WorkerContextPackage
  | WorkerEvidencePackage
  | ReducedEvidencePackage
  | ProductionChangeReview
  | RuntimeRolloutDecision;

export interface EnterpriseRuntimeSnapshotValidationOptions {
  expectedDigest: string;
}

export function validateEnterpriseRuntimeSnapshot(
  snapshot: unknown,
  options?: EnterpriseRuntimeSnapshotValidationOptions,
): ContractResult<EnterpriseRuntimeSnapshot> {
  if (!isRecord(snapshot) || !nonEmpty(snapshot.schemaVersion)) {
    return reject("INVALID_ENTERPRISE_SNAPSHOT", "enterprise runtime snapshot must declare a schema version");
  }
  if (options !== undefined) {
    if (
      !isRecord(options) ||
      !exactKeys(options, ["expectedDigest"]) ||
      typeof options.expectedDigest !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(options.expectedDigest)
    ) {
      return reject("INVALID_ENTERPRISE_SNAPSHOT", "enterprise runtime expected digest pin is invalid");
    }
    if (snapshot.digest !== options.expectedDigest) {
      return reject("INVALID_ENTERPRISE_SNAPSHOT", "enterprise runtime snapshot does not match the trusted digest pin");
    }
  }
  let validation: ContractResult<EnterpriseRuntimeSnapshot>;
  switch (snapshot.schemaVersion) {
    case "enterprise-context-build/v1":
      validation = validateEnterpriseContextBuildSnapshotInternal(snapshot);
      break;
    case "evidence-assessment/v1":
      validation = validateEvidenceAssessment(snapshot);
      break;
    case "task-ledger/v1":
      validation = validateTaskLedger(snapshot);
      break;
    case "task-ledger-compaction/v1":
      validation = validateTaskLedgerCompaction(snapshot);
      break;
    case "governed-memory/v1":
      validation = validateMemoryRecord(snapshot);
      break;
    case "context-cache-entry/v1":
      validation = validateContextCacheEntry(snapshot);
      break;
    case "worker-context-package/v1":
      validation = validateWorkerContextPackage(snapshot);
      break;
    case "worker-evidence-package/v1":
      validation = validateWorkerEvidencePackage(snapshot);
      break;
    case "reduced-evidence-package/v1":
      validation = validateReducedEvidencePackage(snapshot);
      break;
    case "production-change-review/v1":
      validation = validateProductionChangeReview(snapshot);
      break;
    case "runtime-rollout-decision/v1":
      validation = validateRuntimeRolloutDecision(snapshot);
      break;
    default:
      return reject("INVALID_ENTERPRISE_SNAPSHOT", `unsupported enterprise runtime schema ${snapshot.schemaVersion}`);
  }
  if (!validation.ok) {
    return reject("INVALID_ENTERPRISE_SNAPSHOT", "enterprise runtime snapshot failed closed validation", {
      cause: validation.error.code,
    });
  }
  return validation;
}
