import {
  copyProvenanceRef,
  copyVersionRef,
  deepFreeze,
  isDenseArray,
  reject,
  stableDigest,
  stableSerialize,
  succeed,
  validateProvenanceRef,
  validateVersionRef,
  type ContractResult,
  type ProvenanceRef,
  type VersionRef,
} from "./contracts";

export type ContextKind =
  | "instruction"
  | "session"
  | "memory"
  | "artifact"
  | "retrieval"
  | "tool"
  | "handoff";
export type ContextRole = "control" | "data";
export type ContextTrust = "untrusted" | "reviewed" | "trusted";
export type ContextSensitivity = "public" | "internal" | "restricted" | "secret";

export interface ContextItem {
  id: string;
  kind: ContextKind;
  role: ContextRole;
  content: string;
  priority: number;
  mandatory: boolean;
  trust: ContextTrust;
  sensitivity: ContextSensitivity;
  audience: readonly string[];
  stages: readonly string[];
  stable: boolean;
  observedAt: string;
  expiresAt?: string;
  dedupeKey?: string;
  provenance: ProvenanceRef;
}

export interface ContextPolicy {
  ref: VersionRef;
  tokenBudget: number;
  completionReserve: number;
  allowedKinds: readonly ContextKind[];
  minimumTrust: ContextTrust;
  maximumSensitivity: ContextSensitivity;
  audience: string;
  requiredEvidenceIds: readonly string[];
  sourcePrecedence?: readonly string[];
}

export interface CompileContextInput {
  runId: string;
  stage: string;
  now: string;
  items: readonly ContextItem[];
  policy: ContextPolicy;
  estimateTokens: (content: string) => number;
}

export type ContextExclusionReason =
  | "included"
  | "untrusted-control"
  | "kind-blocked"
  | "trust-blocked"
  | "sensitivity-blocked"
  | "wrong-audience"
  | "wrong-stage"
  | "expired"
  | "duplicate"
  | "superseded"
  | "over-budget";

export interface ContextLedgerEntry {
  itemId: string;
  included: boolean;
  reason: ContextExclusionReason;
  tokenEstimate: number;
  mandatory: boolean;
  source: ProvenanceRef;
  trust: ContextTrust;
  sensitivity: ContextSensitivity;
  audience: readonly string[];
  observedAt: string;
  expiresAt?: string;
}

export interface CompiledContextBlock {
  id: string;
  kind: ContextKind;
  role: ContextRole;
  content: string;
  trust: ContextTrust;
  sensitivity: ContextSensitivity;
  stable: boolean;
  tokenEstimate: number;
  provenance: ProvenanceRef;
  audience: readonly string[];
  observedAt: string;
  expiresAt?: string;
  transformationLineage: readonly string[];
}

export interface CompiledContext {
  schemaVersion: "compiled-context/v1";
  runId: string;
  stage: string;
  compiledAt: string;
  audience: string;
  policy: VersionRef;
  blocks: readonly CompiledContextBlock[];
  ledger: readonly ContextLedgerEntry[];
  usedTokens: number;
  completionReserve: number;
  requiredEvidenceIds: readonly string[];
  sufficiency: "sufficient" | "insufficient" | "unknown";
  missingEvidenceIds: readonly string[];
  stablePrefixDigest: string;
  digest: string;
}

const TRUST_RANK: Record<ContextTrust, number> = { untrusted: 0, reviewed: 1, trusted: 2 };
const SENSITIVITY_RANK: Record<ContextSensitivity, number> = {
  public: 0,
  internal: 1,
  restricted: 2,
  secret: 3,
};
const CONTEXT_KINDS = new Set<ContextKind>([
  "instruction",
  "session",
  "memory",
  "artifact",
  "retrieval",
  "tool",
  "handoff",
]);
const CONTEXT_ROLES = new Set<ContextRole>(["control", "data"]);
const CONTEXT_TRUST = new Set<ContextTrust>(["untrusted", "reviewed", "trusted"]);
const CONTEXT_SENSITIVITY = new Set<ContextSensitivity>([
  "public",
  "internal",
  "restricted",
  "secret",
]);
const CONTEXT_EXCLUSION_REASONS = new Set<ContextExclusionReason>([
  "included",
  "untrusted-control",
  "kind-blocked",
  "trust-blocked",
  "sensitivity-blocked",
  "wrong-audience",
  "wrong-stage",
  "expired",
  "duplicate",
  "superseded",
  "over-budget",
]);

function tokenEstimate(
  item: ContextItem,
  estimate: (content: string) => number,
): ContractResult<number> {
  const estimateValue = estimate(item.content);
  if (!Number.isSafeInteger(estimateValue) || estimateValue <= 0) {
    return reject("INVALID_TOKEN_ESTIMATE", `context item ${item.id} requires a positive safe-integer token estimate`, {
      itemId: item.id,
      estimate: estimateValue,
    });
  }
  return succeed(estimateValue);
}

function policyExclusion(
  item: ContextItem,
  input: CompileContextInput,
): Exclude<ContextExclusionReason, "included" | "over-budget"> | undefined {
  if (item.role === "control" && item.trust === "untrusted") return "untrusted-control";
  if (item.sensitivity === "secret") return "sensitivity-blocked";
  if (!input.policy.allowedKinds.includes(item.kind)) return "kind-blocked";
  if (TRUST_RANK[item.trust] < TRUST_RANK[input.policy.minimumTrust]) return "trust-blocked";
  if (SENSITIVITY_RANK[item.sensitivity] > SENSITIVITY_RANK[input.policy.maximumSensitivity]) {
    return "sensitivity-blocked";
  }
  if (!item.audience.includes(input.policy.audience)) return "wrong-audience";
  if (!item.stages.includes(input.stage)) return "wrong-stage";
  if (item.expiresAt && Date.parse(item.expiresAt) <= Date.parse(input.now)) return "expired";
  return undefined;
}

function toBlock(item: ContextItem, tokens: number): CompiledContextBlock {
  return {
    id: item.id,
    kind: item.kind,
    role: item.role,
    content: item.content,
    trust: item.trust,
    sensitivity: item.sensitivity,
    stable: item.stable,
    tokenEstimate: tokens,
    provenance: copyProvenanceRef(item.provenance),
    audience: [...item.audience],
    observedAt: item.observedAt,
    ...(item.expiresAt ? { expiresAt: item.expiresAt } : {}),
    transformationLineage: [
      `${item.provenance.sourceId}@${item.provenance.version}`,
      "selected-without-semantic-transformation",
    ],
  };
}

function evidenceIdsForBlocks(blocks: readonly CompiledContextBlock[]): Set<string> {
  return new Set(
    blocks
      .filter(
        (block) =>
          block.trust !== "untrusted" &&
          (["artifact", "retrieval", "tool", "handoff"] as ContextKind[]).includes(block.kind),
      )
      .map((block) => block.id),
  );
}

export function compileContext(input: CompileContextInput): ContractResult<CompiledContext> {
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.runId !== "string" ||
    !input.runId.trim() ||
    typeof input.stage !== "string" ||
    !input.stage.trim() ||
    !isDenseArray(input.items) ||
    !input.policy ||
    typeof input.policy !== "object" ||
    typeof input.estimateTokens !== "function"
  ) {
    return reject("INVALID_CONTEXT_INPUT", "context compilation requires run identity, stage, items, policy, and tokenizer");
  }
  const policyRefValidation = validateVersionRef(input.policy.ref, "contextPolicy.ref");
  if (!policyRefValidation.ok) return policyRefValidation;
  if (
    !Number.isInteger(input.policy.tokenBudget) ||
    input.policy.tokenBudget <= 0 ||
    !Number.isInteger(input.policy.completionReserve) ||
    input.policy.completionReserve < 0 ||
    input.policy.completionReserve >= input.policy.tokenBudget
  ) {
    return reject("INVALID_CONTEXT_BUDGET", "token budget must leave positive room before completion reserve");
  }
  if (
    !CONTEXT_TRUST.has(input.policy.minimumTrust) ||
    !CONTEXT_SENSITIVITY.has(input.policy.maximumSensitivity) ||
    typeof input.policy.audience !== "string" ||
    !input.policy.audience.trim() ||
    !isDenseArray(input.policy.allowedKinds) ||
    input.policy.allowedKinds.some((kind) => !CONTEXT_KINDS.has(kind)) ||
    !isDenseArray(input.policy.requiredEvidenceIds) ||
    input.policy.requiredEvidenceIds.some((id: unknown) => typeof id !== "string" || !id.trim()) ||
    new Set(input.policy.requiredEvidenceIds).size !== input.policy.requiredEvidenceIds.length ||
    (input.policy.sourcePrecedence !== undefined &&
      (!isDenseArray(input.policy.sourcePrecedence) ||
        input.policy.sourcePrecedence.some((source: unknown) => typeof source !== "string" || !source.trim()) ||
        new Set(input.policy.sourcePrecedence).size !== input.policy.sourcePrecedence.length))
  ) {
    return reject("INVALID_CONTEXT_POLICY", "context policy contains invalid enum or list values");
  }
  if (typeof input.now !== "string" || !Number.isFinite(Date.parse(input.now))) {
    return reject("INVALID_CONTEXT_TIME", "context compilation requires an injected timestamp");
  }
  for (const item of input.items) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      typeof item.content !== "string" ||
      !CONTEXT_KINDS.has(item.kind) ||
      !CONTEXT_ROLES.has(item.role) ||
      !CONTEXT_TRUST.has(item.trust) ||
      !CONTEXT_SENSITIVITY.has(item.sensitivity) ||
      typeof item.priority !== "number" ||
      !Number.isFinite(item.priority) ||
      typeof item.mandatory !== "boolean" ||
      typeof item.stable !== "boolean" ||
      typeof item.observedAt !== "string" ||
      (item.expiresAt !== undefined && typeof item.expiresAt !== "string") ||
      (item.dedupeKey !== undefined && (typeof item.dedupeKey !== "string" || !item.dedupeKey.trim())) ||
      !isDenseArray(item.audience) ||
      item.audience.some((audience: unknown) => typeof audience !== "string" || !audience.trim()) ||
      !isDenseArray(item.stages) ||
      item.stages.some((stage: unknown) => typeof stage !== "string" || !stage.trim())
    ) {
      return reject("INVALID_CONTEXT_ITEM", "context item contains invalid schema values", {
        itemId: typeof item?.id === "string" ? item.id : "unknown",
      });
    }
    const observedAt = Date.parse(item.observedAt);
    const expiresAt = item.expiresAt ? Date.parse(item.expiresAt) : undefined;
    if (!item.provenance) {
      return reject("MISSING_PROVENANCE", `context item ${item.id} requires a valid source reference`, {
        itemId: item.id,
      });
    }
    const provenanceValidation = validateProvenanceRef(item.provenance, `context.items.${item.id}.provenance`);
    if (!provenanceValidation.ok) return provenanceValidation;
    const provenanceObservedAt = Date.parse(provenanceValidation.value.observedAt);
    if (
      !Number.isFinite(observedAt) ||
      (expiresAt !== undefined && !Number.isFinite(expiresAt)) ||
      observedAt > Date.parse(input.now) ||
      provenanceObservedAt > Date.parse(input.now)
    ) {
      return reject("INVALID_CONTEXT_TIME", `context item ${item.id} has invalid or future timestamps`, {
        itemId: item.id,
      });
    }
  }
  if (new Set(input.items.map((item) => item.id)).size !== input.items.length) {
    return reject("DUPLICATE_CONTEXT_ID", "context item ids must be unique");
  }

  const availableTokens = input.policy.tokenBudget - input.policy.completionReserve;
  const decisions = new Map<string, ContextLedgerEntry>();
  const eligibleCandidates: Array<{ item: ContextItem; tokens: number }> = [];

  for (const item of input.items) {
    const tokenResult = tokenEstimate(item, input.estimateTokens);
    if (!tokenResult.ok) return tokenResult;
    const tokens = tokenResult.value;
    const reason = policyExclusion(item, input);
    if (reason) {
      if (item.mandatory) {
        return reject("MANDATORY_CONTEXT_REJECTED", `mandatory item ${item.id} violates context policy`, {
          itemId: item.id,
          reason,
        });
      }
      decisions.set(item.id, {
        itemId: item.id,
        included: false,
        reason,
        tokenEstimate: tokens,
        mandatory: item.mandatory,
        source: copyProvenanceRef(item.provenance),
        trust: item.trust,
        sensitivity: item.sensitivity,
        audience: [...item.audience],
        observedAt: item.observedAt,
        ...(item.expiresAt ? { expiresAt: item.expiresAt } : {}),
      });
      continue;
    }
    eligibleCandidates.push({ item, tokens });
  }

  const precedence = new Map(
    (input.policy.sourcePrecedence ?? []).map((sourceId, index) => [sourceId, index]),
  );
  const groups = new Map<string, Array<{ item: ContextItem; tokens: number }>>();
  for (const entry of eligibleCandidates) {
    const groupKey = entry.item.dedupeKey
      ? `semantic:${entry.item.kind}:${entry.item.role}:${entry.item.dedupeKey}`
      : `content:${stableDigest({ kind: entry.item.kind, role: entry.item.role, content: entry.item.content })}`;
    const group = groups.get(groupKey) ?? [];
    group.push(entry);
    groups.set(groupKey, group);
  }
  const eligible: Array<{ item: ContextItem; tokens: number }> = [];
  for (const group of groups.values()) {
    group.sort((left, right) => {
      const leftPrecedence = precedence.get(left.item.provenance.sourceId) ?? Number.MAX_SAFE_INTEGER;
      const rightPrecedence = precedence.get(right.item.provenance.sourceId) ?? Number.MAX_SAFE_INTEGER;
      return (
        Number(right.item.mandatory) - Number(left.item.mandatory) ||
        leftPrecedence - rightPrecedence ||
        TRUST_RANK[right.item.trust] - TRUST_RANK[left.item.trust] ||
        right.item.priority - left.item.priority ||
        Date.parse(right.item.observedAt) - Date.parse(left.item.observedAt) ||
        left.item.id.localeCompare(right.item.id)
      );
    });
    const winner = group[0]!;
    eligible.push(winner);
    for (const loser of group.slice(1)) {
      decisions.set(loser.item.id, {
        itemId: loser.item.id,
        included: false,
        reason: loser.item.content === winner.item.content ? "duplicate" : "superseded",
        tokenEstimate: loser.tokens,
        mandatory: loser.item.mandatory,
        source: copyProvenanceRef(loser.item.provenance),
        trust: loser.item.trust,
        sensitivity: loser.item.sensitivity,
        audience: [...loser.item.audience],
        observedAt: loser.item.observedAt,
        ...(loser.item.expiresAt ? { expiresAt: loser.item.expiresAt } : {}),
      });
    }
  }

  const mandatory = eligible
    .filter(({ item }) => item.mandatory)
    .sort((left, right) => right.item.priority - left.item.priority || left.item.id.localeCompare(right.item.id));
  const mandatoryTokens = mandatory.reduce((total, entry) => total + entry.tokens, 0);
  if (mandatoryTokens > availableTokens) {
    return reject("CONTEXT_BUDGET_EXCEEDED", "mandatory context exceeds the hard input budget", {
      mandatoryTokens,
      availableTokens,
    });
  }

  const optional = eligible
    .filter(({ item }) => !item.mandatory)
    .sort((left, right) => right.item.priority - left.item.priority || left.item.id.localeCompare(right.item.id));
  const selected: Array<{ item: ContextItem; tokens: number }> = [...mandatory];
  let usedTokens = mandatoryTokens;
  for (const entry of optional) {
    if (usedTokens + entry.tokens <= availableTokens) {
      selected.push(entry);
      usedTokens += entry.tokens;
    } else {
      decisions.set(entry.item.id, {
        itemId: entry.item.id,
        included: false,
        reason: "over-budget",
        tokenEstimate: entry.tokens,
        mandatory: false,
        source: copyProvenanceRef(entry.item.provenance),
        trust: entry.item.trust,
        sensitivity: entry.item.sensitivity,
        audience: [...entry.item.audience],
        observedAt: entry.item.observedAt,
        ...(entry.item.expiresAt ? { expiresAt: entry.item.expiresAt } : {}),
      });
    }
  }

  selected.sort(
    (left, right) =>
      Number(right.item.stable) - Number(left.item.stable) ||
      Number(right.item.mandatory) - Number(left.item.mandatory) ||
      right.item.priority - left.item.priority ||
      left.item.id.localeCompare(right.item.id),
  );
  for (const entry of selected) {
    decisions.set(entry.item.id, {
      itemId: entry.item.id,
      included: true,
      reason: "included",
      tokenEstimate: entry.tokens,
      mandatory: entry.item.mandatory,
      source: copyProvenanceRef(entry.item.provenance),
      trust: entry.item.trust,
      sensitivity: entry.item.sensitivity,
      audience: [...entry.item.audience],
      observedAt: entry.item.observedAt,
      ...(entry.item.expiresAt ? { expiresAt: entry.item.expiresAt } : {}),
    });
  }

  const blocks = selected.map(({ item, tokens }) => toBlock(item, tokens));
  const evidenceIds = evidenceIdsForBlocks(blocks);
  const missingEvidenceIds = input.policy.requiredEvidenceIds.filter((id) => !evidenceIds.has(id));
  const sufficiency: CompiledContext["sufficiency"] =
    input.policy.requiredEvidenceIds.length === 0
      ? "unknown"
      : missingEvidenceIds.length === 0
        ? "sufficient"
        : "insufficient";
  const stableBlocks = blocks.filter((block) => block.stable);
  const stablePrefixDigest = stableDigest({ policy: input.policy.ref, blocks: stableBlocks });
  const snapshot = {
    schemaVersion: "compiled-context/v1" as const,
    runId: input.runId,
    stage: input.stage,
    compiledAt: input.now,
    audience: input.policy.audience,
    policy: copyVersionRef(input.policy.ref),
    blocks,
    ledger: input.items.map((item) => decisions.get(item.id)!),
    usedTokens,
    completionReserve: input.policy.completionReserve,
    requiredEvidenceIds: [...input.policy.requiredEvidenceIds],
    sufficiency,
    missingEvidenceIds,
    stablePrefixDigest,
  };
  return succeed(deepFreeze({ ...snapshot, digest: stableDigest(snapshot) }));
}

export function validateCompiledContextSnapshot(
  snapshot: unknown,
): ContractResult<CompiledContext> {
  if (!snapshot || typeof snapshot !== "object") {
    return reject("INVALID_COMPILED_CONTEXT", "compiled context must be an object");
  }
  const value = snapshot as Partial<CompiledContext>;
  const expectedKeys = [
    "schemaVersion",
    "runId",
    "stage",
    "compiledAt",
    "audience",
    "policy",
    "blocks",
    "ledger",
    "usedTokens",
    "completionReserve",
    "requiredEvidenceIds",
    "sufficiency",
    "missingEvidenceIds",
    "stablePrefixDigest",
    "digest",
  ].sort();
  const actualKeys = Object.keys(snapshot).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index]) ||
    value.schemaVersion !== "compiled-context/v1" ||
    typeof value.runId !== "string" ||
    !value.runId.trim() ||
    typeof value.stage !== "string" ||
    !value.stage.trim() ||
    typeof value.compiledAt !== "string" ||
    !Number.isFinite(Date.parse(value.compiledAt)) ||
    typeof value.audience !== "string" ||
    !value.audience.trim() ||
    !isDenseArray(value.blocks) ||
    !isDenseArray(value.ledger) ||
    !isDenseArray(value.requiredEvidenceIds) ||
    !isDenseArray(value.missingEvidenceIds) ||
    !["sufficient", "insufficient", "unknown"].includes(value.sufficiency ?? "") ||
    typeof value.digest !== "string" ||
    typeof value.stablePrefixDigest !== "string"
  ) {
    return reject("INVALID_COMPILED_CONTEXT", "compiled context schema is invalid");
  }
  const policyValidation = validateVersionRef(value.policy, "compiledContext.policy");
  if (!policyValidation.ok) return reject("INVALID_COMPILED_CONTEXT", "compiled context policy is invalid");
  const compiledAt = Date.parse(value.compiledAt!);
  let sawDynamic = false;
  let computedTokens = 0;
  const blockIds = new Set<string>();
  for (const block of value.blocks) {
    if (
      !block ||
      typeof block.id !== "string" ||
      !block.id.trim() ||
      blockIds.has(block.id) ||
      !CONTEXT_KINDS.has(block.kind) ||
      !CONTEXT_ROLES.has(block.role) ||
      !CONTEXT_TRUST.has(block.trust) ||
      !CONTEXT_SENSITIVITY.has(block.sensitivity) ||
      (block.role === "control" && block.trust === "untrusted") ||
      block.sensitivity === "secret" ||
      typeof block.content !== "string" ||
      !Number.isSafeInteger(block.tokenEstimate) ||
      block.tokenEstimate <= 0 ||
      typeof block.stable !== "boolean" ||
      !isDenseArray(block.audience) ||
      block.audience.some((audience: unknown) => typeof audience !== "string" || !audience.trim()) ||
      !block.audience.includes(value.audience!) ||
      typeof block.observedAt !== "string" ||
      !Number.isFinite(Date.parse(block.observedAt)) ||
      Date.parse(block.observedAt) > compiledAt ||
      (block.expiresAt !== undefined &&
        (typeof block.expiresAt !== "string" ||
          !Number.isFinite(Date.parse(block.expiresAt)) ||
          Date.parse(block.expiresAt) <= compiledAt)) ||
      !isDenseArray(block.transformationLineage) ||
      block.transformationLineage.length === 0 ||
      block.transformationLineage.some((step: unknown) => typeof step !== "string" || !step.trim())
    ) {
      return reject("INVALID_COMPILED_CONTEXT", "compiled block schema is invalid");
    }
    blockIds.add(block.id);
    const provenanceValidation = validateProvenanceRef(block.provenance, "compiledContext.block.provenance");
    if (!provenanceValidation.ok) return reject("INVALID_COMPILED_CONTEXT", "compiled block provenance is invalid");
    if (Date.parse(provenanceValidation.value.observedAt) > compiledAt) {
      return reject("INVALID_COMPILED_CONTEXT", "compiled block provenance is from the future");
    }
    if (!block.stable) sawDynamic = true;
    if (block.stable && sawDynamic) {
      return reject("INVALID_COMPILED_CONTEXT", "stable blocks must form a prefix");
    }
    computedTokens += block.tokenEstimate;
  }
  const ledgerIds = new Set<string>();
  for (const entry of value.ledger) {
    if (
      !entry ||
      typeof entry.itemId !== "string" ||
      !entry.itemId.trim() ||
      ledgerIds.has(entry.itemId) ||
      typeof entry.included !== "boolean" ||
      !CONTEXT_EXCLUSION_REASONS.has(entry.reason) ||
      entry.included !== (entry.reason === "included") ||
      !Number.isSafeInteger(entry.tokenEstimate) ||
      entry.tokenEstimate <= 0 ||
      typeof entry.mandatory !== "boolean" ||
      !CONTEXT_TRUST.has(entry.trust) ||
      !CONTEXT_SENSITIVITY.has(entry.sensitivity) ||
      (entry.included && entry.sensitivity === "secret") ||
      !isDenseArray(entry.audience) ||
      entry.audience.some((audience: unknown) => typeof audience !== "string" || !audience.trim()) ||
      typeof entry.observedAt !== "string" ||
      !Number.isFinite(Date.parse(entry.observedAt)) ||
      Date.parse(entry.observedAt) > compiledAt ||
      (entry.expiresAt !== undefined &&
        (typeof entry.expiresAt !== "string" || !Number.isFinite(Date.parse(entry.expiresAt))))
    ) {
      return reject("INVALID_COMPILED_CONTEXT", "context ledger schema is invalid");
    }
    ledgerIds.add(entry.itemId);
    const provenanceValidation = validateProvenanceRef(entry.source, "compiledContext.ledger.source");
    if (!provenanceValidation.ok) return reject("INVALID_COMPILED_CONTEXT", "context ledger provenance is invalid");
    if (Date.parse(provenanceValidation.value.observedAt) > compiledAt) {
      return reject("INVALID_COMPILED_CONTEXT", "context ledger provenance is from the future");
    }
  }
  const requiredEvidenceIds = value.requiredEvidenceIds!;
  const compiledEvidenceIds = evidenceIdsForBlocks(value.blocks!);
  const expectedMissingEvidenceIds = requiredEvidenceIds.filter(
    (id) => !compiledEvidenceIds.has(id),
  );
  const expectedSufficiency: CompiledContext["sufficiency"] =
    requiredEvidenceIds.length === 0
      ? "unknown"
      : expectedMissingEvidenceIds.length === 0
        ? "sufficient"
        : "insufficient";
  const includedLedgerById = new Map(
    value.ledger.filter((entry) => entry.included).map((entry) => [entry.itemId, entry]),
  );
  if (
    value.ledger.some((entry) => entry.included && !blockIds.has(entry.itemId)) ||
    value.blocks.some((block) => {
      const entry = includedLedgerById.get(block.id);
      return (
        !entry ||
        entry.tokenEstimate !== block.tokenEstimate ||
        entry.trust !== block.trust ||
        entry.sensitivity !== block.sensitivity ||
        stableSerialize(entry.audience) !== stableSerialize(block.audience) ||
        entry.observedAt !== block.observedAt ||
        entry.expiresAt !== block.expiresAt ||
        stableSerialize(entry.source) !== stableSerialize(block.provenance)
      );
    }) ||
    computedTokens !== value.usedTokens ||
    !Number.isSafeInteger(value.completionReserve) ||
    value.completionReserve! < 0 ||
    requiredEvidenceIds.some((id: unknown) => typeof id !== "string" || !id.trim()) ||
    new Set(requiredEvidenceIds).size !== requiredEvidenceIds.length ||
    value.missingEvidenceIds.some((id) => typeof id !== "string" || !id.trim()) ||
    new Set(value.missingEvidenceIds).size !== value.missingEvidenceIds.length ||
    stableSerialize(value.missingEvidenceIds) !== stableSerialize(expectedMissingEvidenceIds) ||
    value.sufficiency !== expectedSufficiency
  ) {
    return reject("INVALID_COMPILED_CONTEXT", "compiled token accounting is invalid");
  }
  const stablePrefixDigest = stableDigest({
    policy: value.policy,
    blocks: value.blocks.filter((block) => block.stable),
  });
  if (stablePrefixDigest !== value.stablePrefixDigest) {
    return reject("INVALID_COMPILED_CONTEXT", "stable prefix digest does not match blocks");
  }
  const { digest: _digest, ...payload } = value as CompiledContext;
  if (stableDigest(payload) !== value.digest) {
    return reject("INVALID_COMPILED_CONTEXT", "compiled context digest does not match content");
  }
  return succeed(deepFreeze(JSON.parse(stableSerialize(value)) as CompiledContext));
}
