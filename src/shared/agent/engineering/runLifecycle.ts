import {
  copyEvidenceRef,
  copyProvenanceRef,
  copyVersionRef,
  deepFreeze,
  isDenseArray,
  reject,
  stableDigest,
  stableSerialize,
  succeed,
  validateArtifactRef,
  validateEvidenceRef,
  validateProvenanceRef,
  validateVersionRef,
  type ArtifactRef,
  type ContractResult,
  type EvidenceRef,
  type ProvenanceRef,
  type VersionRef,
} from "./contracts";

export interface AuthorityScope {
  tools: readonly string[];
  resources: readonly string[];
  actions: readonly string[];
}

export interface BehaviorRevisions {
  agent: VersionRef;
  harness: VersionRef;
  prompt: VersionRef;
  model: VersionRef;
  toolset: VersionRef;
  outputContract: VersionRef;
  contextPolicy: VersionRef;
  permissionPolicy: VersionRef;
  evalSuite: VersionRef;
}

export interface RunBudget {
  maxTurns: number;
  maxTokens: number;
  deadline: string;
}

export type RunStatus =
  | "created"
  | "running"
  | "waiting_approval"
  | "paused"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface RunCheckpoint {
  reason: string;
  evidence: EvidenceRef;
  at: string;
  revision: number;
}

export interface RunCompletion {
  outcome: string;
  evidence: readonly EvidenceRef[];
  completedAt: string;
}

export interface ResumeLedgerEntry {
  token: string;
  requestDigest: string;
  event: { type: "resume"; at: string; fromRevision: number; toRevision: number };
}

export interface RunManifest {
  schemaVersion: "agent-run/v1";
  runId: string;
  sessionId: string;
  owner: string;
  objective: string;
  stage: string;
  behavior: BehaviorRevisions;
  authority: AuthorityScope;
  budget: RunBudget;
  expectedOutcome: string;
  createdAt: string;
  lastTransitionAt: string;
  status: RunStatus;
  revision: number;
  checkpoints: readonly RunCheckpoint[];
  consumedResumeTokens: readonly string[];
  resumeLedger: readonly ResumeLedgerEntry[];
  completion?: RunCompletion;
  terminalReason?: string;
  digest: string;
}

export interface CreateRunManifestInput {
  runId: string;
  sessionId: string;
  owner: string;
  objective: string;
  stage: string;
  behavior: BehaviorRevisions;
  authority: AuthorityScope;
  budget: RunBudget;
  expectedOutcome: string;
  createdAt: string;
}

const BEHAVIOR_FIELDS = [
  "agent",
  "harness",
  "prompt",
  "model",
  "toolset",
  "outputContract",
  "contextPolicy",
  "permissionPolicy",
  "evalSuite",
] as const satisfies readonly (keyof BehaviorRevisions)[];

function copyAuthority(authority: AuthorityScope): AuthorityScope {
  return {
    tools: [...authority.tools],
    resources: [...authority.resources],
    actions: [...authority.actions],
  };
}

function copyBehavior(behavior: BehaviorRevisions): BehaviorRevisions {
  return Object.fromEntries(
    BEHAVIOR_FIELDS.map((field) => [field, copyVersionRef(behavior[field])]),
  ) as unknown as BehaviorRevisions;
}

function validateBudget(budget: unknown): ContractResult<RunBudget> {
  if (!budget || typeof budget !== "object") {
    return reject("INVALID_BUDGET", "run budget must be an object");
  }
  const candidate = budget as Partial<RunBudget>;
  if (!Number.isInteger(candidate.maxTurns) || candidate.maxTurns! <= 0) {
    return reject("INVALID_BUDGET", "maxTurns must be a positive integer");
  }
  if (!Number.isInteger(candidate.maxTokens) || candidate.maxTokens! <= 0) {
    return reject("INVALID_BUDGET", "maxTokens must be a positive integer");
  }
  if (typeof candidate.deadline !== "string" || !Number.isFinite(Date.parse(candidate.deadline))) {
    return reject("INVALID_BUDGET", "deadline must be an ISO timestamp");
  }
  return succeed({
    maxTurns: candidate.maxTurns!,
    maxTokens: candidate.maxTokens!,
    deadline: candidate.deadline,
  });
}

function withDigest(manifest: Omit<RunManifest, "digest">): RunManifest {
  return deepFreeze({ ...manifest, digest: stableDigest(manifest) });
}

export function validateRunManifestSnapshot(snapshot: unknown): ContractResult<RunManifest> {
  if (!snapshot || typeof snapshot !== "object") {
    return reject("INVALID_RUN_MANIFEST", "run manifest must be an object");
  }
  const value = snapshot as Partial<RunManifest>;
  const requiredKeys = [
    "schemaVersion",
    "runId",
    "sessionId",
    "owner",
    "objective",
    "stage",
    "behavior",
    "authority",
    "budget",
    "expectedOutcome",
    "createdAt",
    "lastTransitionAt",
    "status",
    "revision",
    "checkpoints",
    "consumedResumeTokens",
    "resumeLedger",
    "digest",
  ];
  const allowedKeys = new Set([...requiredKeys, "completion", "terminalReason"]);
  if (
    requiredKeys.some((key) => !(key in snapshot)) ||
    Object.keys(snapshot).some((key) => !allowedKeys.has(key)) ||
    value.schemaVersion !== "agent-run/v1" ||
    typeof value.digest !== "string"
  ) {
    return reject("INVALID_RUN_MANIFEST", "run manifest schema is invalid");
  }
  const { digest: _digest, ...payload } = value as RunManifest;
  if (stableDigest(payload) !== value.digest) {
    return reject("INVALID_RUN_MANIFEST", "run manifest digest does not match its content");
  }
  if (
    ![value.runId, value.sessionId, value.owner, value.objective, value.stage, value.expectedOutcome].every(
      (field) => typeof field === "string" && field.trim(),
    ) ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    typeof value.lastTransitionAt !== "string" ||
    !Number.isFinite(Date.parse(value.lastTransitionAt)) ||
    Date.parse(value.lastTransitionAt) < Date.parse(value.createdAt ?? "") ||
    !Number.isSafeInteger(value.revision) ||
    value.revision! < 0 ||
    !["created", "running", "waiting_approval", "paused", "succeeded", "failed", "cancelled"].includes(
      value.status ?? "",
    ) ||
    !value.behavior ||
    !value.authority ||
    !value.budget ||
    !isDenseArray(value.checkpoints) ||
    !isDenseArray(value.consumedResumeTokens) ||
    !isDenseArray(value.resumeLedger)
  ) {
    return reject("INVALID_RUN_MANIFEST", "run manifest fields are invalid");
  }
  for (const field of BEHAVIOR_FIELDS) {
    const validation = validateVersionRef(value.behavior[field], `run.behavior.${field}`);
    if (!validation.ok) return reject("INVALID_RUN_MANIFEST", "run behavior pin is invalid", { field });
  }
  const budgetValidation = validateBudget(value.budget);
  if (!budgetValidation.ok) return reject("INVALID_RUN_MANIFEST", "run budget is invalid");
  if (Date.parse(budgetValidation.value.deadline) < Date.parse(value.createdAt!)) {
    return reject("INVALID_RUN_MANIFEST", "run deadline cannot precede creation");
  }
  if (Date.parse(value.lastTransitionAt!) > Date.parse(budgetValidation.value.deadline)) {
    return reject("INVALID_RUN_MANIFEST", "run transition time cannot exceed its deadline");
  }
  for (const values of [value.authority.tools, value.authority.resources, value.authority.actions]) {
    if (!isDenseArray(values) || values.some((entry) => typeof entry !== "string" || !entry.trim())) {
      return reject("INVALID_RUN_MANIFEST", "run authority is invalid");
    }
  }
  for (const checkpoint of value.checkpoints) {
    if (
      !checkpoint ||
      typeof checkpoint.reason !== "string" ||
      !checkpoint.reason.trim() ||
      typeof checkpoint.at !== "string" ||
      !Number.isFinite(Date.parse(checkpoint.at)) ||
      Date.parse(checkpoint.at) < Date.parse(value.createdAt!) ||
      Date.parse(checkpoint.at) > Date.parse(value.lastTransitionAt!) ||
      !Number.isSafeInteger(checkpoint.revision) ||
      checkpoint.revision <= 0 ||
      checkpoint.revision > value.revision!
    ) {
      return reject("INVALID_RUN_MANIFEST", "run checkpoint is invalid");
    }
    const validation = validateEvidenceRef(checkpoint.evidence, "run.checkpoint.evidence");
    if (!validation.ok) return reject("INVALID_RUN_MANIFEST", "run checkpoint evidence is invalid");
  }
  if (
    value.consumedResumeTokens.some((token) => typeof token !== "string" || !token.trim()) ||
    value.resumeLedger.some(
      (entry) =>
        !entry ||
        typeof entry.token !== "string" ||
        !entry.token.trim() ||
        typeof entry.requestDigest !== "string" ||
        !entry.requestDigest.trim() ||
        entry.event?.type !== "resume" ||
        typeof entry.event.at !== "string" ||
        !Number.isFinite(Date.parse(entry.event.at)) ||
        Date.parse(entry.event.at) < Date.parse(value.createdAt!) ||
        Date.parse(entry.event.at) > Date.parse(value.lastTransitionAt!) ||
        !Number.isSafeInteger(entry.event.fromRevision) ||
        !Number.isSafeInteger(entry.event.toRevision) ||
        entry.event.fromRevision < 0 ||
        entry.event.toRevision !== entry.event.fromRevision + 1 ||
        entry.event.toRevision > value.revision!,
    ) ||
    new Set(value.consumedResumeTokens).size !== value.consumedResumeTokens.length ||
    new Set(value.resumeLedger.map((entry) => entry.token)).size !== value.resumeLedger.length ||
    value.resumeLedger.length !== value.consumedResumeTokens.length ||
    value.resumeLedger.some((entry) => !value.consumedResumeTokens!.includes(entry.token))
  ) {
    return reject("INVALID_RUN_MANIFEST", "run resume ledger is invalid");
  }
  const isTerminal = ["succeeded", "failed", "cancelled"].includes(value.status!);
  if (isTerminal) {
    const completion = value.completion;
    if (
      !completion ||
      typeof completion !== "object" ||
      typeof completion.outcome !== "string" ||
      !completion.outcome.trim() ||
      typeof completion.completedAt !== "string" ||
      !Number.isFinite(Date.parse(completion.completedAt)) ||
      Date.parse(completion.completedAt) < Date.parse(value.createdAt!) ||
      Date.parse(completion.completedAt) > Date.parse(value.budget.deadline) ||
      typeof value.terminalReason !== "string" ||
      !value.terminalReason.trim() ||
      value.terminalReason !== completion.outcome ||
      !isDenseArray(completion.evidence) ||
      completion.evidence.length === 0
    ) {
      return reject("INVALID_RUN_MANIFEST", "terminal run requires completion reason and evidence");
    }
    for (const evidence of completion.evidence) {
      const validation = validateEvidenceRef(evidence, "run.completion.evidence");
      if (!validation.ok) return reject("INVALID_RUN_MANIFEST", "run completion evidence is invalid");
    }
    if (
      value.status === "succeeded" &&
      !completion.evidence.some(
        (evidence) => evidence.kind === "artifact" || evidence.kind === "state",
      )
    ) {
      return reject("INVALID_RUN_MANIFEST", "successful run requires artifact or state outcome evidence");
    }
  } else if (value.completion !== undefined || value.terminalReason !== undefined) {
    return reject("INVALID_RUN_MANIFEST", "non-terminal run cannot contain terminal completion fields");
  }
  const timeline = [
    ...value.checkpoints.map((checkpoint) => ({ revision: checkpoint.revision, at: checkpoint.at })),
    ...value.resumeLedger.map((entry) => ({ revision: entry.event.toRevision, at: entry.event.at })),
    ...(value.completion
      ? [{ revision: value.revision!, at: value.completion.completedAt }]
      : []),
  ].sort((left, right) => left.revision - right.revision);
  if (
    (value.status === "created" && value.lastTransitionAt !== value.createdAt) ||
    timeline.some(
      (event, index) =>
        (index > 0 && event.revision === timeline[index - 1]!.revision) ||
        (index > 0 && Date.parse(event.at) < Date.parse(timeline[index - 1]!.at)),
    ) ||
    (timeline.length > 0 &&
      timeline[timeline.length - 1]!.revision === value.revision &&
      timeline[timeline.length - 1]!.at !== value.lastTransitionAt)
  ) {
    return reject("INVALID_RUN_MANIFEST", "run journal violates revision or time ordering");
  }
  return succeed(deepFreeze(JSON.parse(stableSerialize(value)) as RunManifest));
}

export function createRunManifest(input: CreateRunManifestInput): ContractResult<RunManifest> {
  if (!input || typeof input !== "object") {
    return reject("INVALID_RUN_MANIFEST", "run manifest input must be an object");
  }
  const requiredStrings = [
    input.runId,
    input.sessionId,
    input.owner,
    input.objective,
    input.stage,
    input.expectedOutcome,
  ];
  if (
    requiredStrings.some((value) => typeof value !== "string" || !value.trim()) ||
    typeof input.createdAt !== "string" ||
    !Number.isFinite(Date.parse(input.createdAt)) ||
    !input.behavior ||
    typeof input.behavior !== "object" ||
    !input.authority ||
    typeof input.authority !== "object" ||
    !isDenseArray(input.authority.tools) ||
    !isDenseArray(input.authority.resources) ||
    !isDenseArray(input.authority.actions) ||
    [input.authority.tools, input.authority.resources, input.authority.actions].some((values) =>
      values.some((entry) => typeof entry !== "string" || !entry.trim()),
    )
  ) {
    return reject("INVALID_RUN_MANIFEST", "run manifest fields and timestamps must be non-empty");
  }
  for (const field of BEHAVIOR_FIELDS) {
    const validation = validateVersionRef(input.behavior[field], `behavior.${field}`);
    if (!validation.ok) return validation;
  }
  const budgetValidation = validateBudget(input.budget);
  if (!budgetValidation.ok) return budgetValidation;
  if (Date.parse(budgetValidation.value.deadline) < Date.parse(input.createdAt)) {
    return reject("INVALID_BUDGET", "run deadline cannot precede creation");
  }

  return succeed(
    withDigest({
      schemaVersion: "agent-run/v1",
      runId: input.runId,
      sessionId: input.sessionId,
      owner: input.owner,
      objective: input.objective,
      stage: input.stage,
      behavior: copyBehavior(input.behavior),
      authority: copyAuthority(input.authority),
      budget: { ...budgetValidation.value },
      expectedOutcome: input.expectedOutcome,
      createdAt: input.createdAt,
      lastTransitionAt: input.createdAt,
      status: "created",
      revision: 0,
      checkpoints: [],
      consumedResumeTokens: [],
      resumeLedger: [],
    }),
  );
}

export type RunTransition =
  | { type: "start"; expectedRevision: number; at: string }
  | { type: "wait"; expectedRevision: number; reason: string; checkpoint: EvidenceRef; at: string }
  | { type: "pause"; expectedRevision: number; reason: string; checkpoint: EvidenceRef; at: string }
  | { type: "resume"; expectedRevision: number; resumeToken: string; at: string }
  | { type: "complete"; expectedRevision: number; outcome: string; evidence: readonly EvidenceRef[]; at: string }
  | { type: "fail"; expectedRevision: number; reason: string; evidence: readonly EvidenceRef[]; at: string }
  | { type: "cancel"; expectedRevision: number; reason: string; evidence: readonly EvidenceRef[]; at: string };

export interface RunTransitionResult {
  run: RunManifest;
  replayed: boolean;
  event: {
    type: RunTransition["type"];
    at: string;
    fromRevision: number;
    toRevision: number;
  };
}

const TERMINAL = new Set<RunStatus>(["succeeded", "failed", "cancelled"]);

function allowed(status: RunStatus, action: RunTransition["type"]): boolean {
  if (status === "created") return action === "start" || action === "cancel";
  if (status === "running") return ["wait", "pause", "complete", "fail", "cancel"].includes(action);
  if (status === "waiting_approval" || status === "paused") {
    return ["resume", "fail", "cancel"].includes(action);
  }
  return false;
}

function nextRun(run: RunManifest, updates: Partial<Omit<RunManifest, "digest">>): RunManifest {
  const { digest: _digest, ...snapshot } = run;
  return withDigest({ ...snapshot, ...updates });
}

export function transitionRun(
  run: RunManifest,
  action: RunTransition,
): ContractResult<RunTransitionResult> {
  const manifestValidation = validateRunManifestSnapshot(run);
  if (!manifestValidation.ok) return manifestValidation;
  run = manifestValidation.value;
  if (
    !action ||
    typeof action !== "object" ||
    !["start", "wait", "pause", "resume", "complete", "fail", "cancel"].includes(action.type) ||
    !Number.isSafeInteger(action.expectedRevision) ||
    typeof action.at !== "string" ||
    !Number.isFinite(Date.parse(action.at)) ||
    Date.parse(action.at) < Date.parse(run.createdAt) ||
    Date.parse(action.at) > Date.parse(run.budget.deadline)
  ) {
    return reject("INVALID_TRANSITION", "transition type, revision, and timestamp must be valid within the run deadline");
  }
  if (action.type === "resume" && (typeof action.resumeToken !== "string" || !action.resumeToken.trim())) {
    return reject("RESUME_TOKEN_REQUIRED", "resume requires a token");
  }
  const resumeRequestDigest =
    action.type === "resume"
      ? stableDigest({ type: action.type, resumeToken: action.resumeToken, at: action.at })
      : undefined;
  const replayEntry =
    action.type === "resume"
      ? run.resumeLedger.find((entry) => entry.token === action.resumeToken)
      : undefined;
  if (action.type === "resume" && replayEntry) {
    if (replayEntry.requestDigest !== resumeRequestDigest) {
      return reject("IDEMPOTENCY_KEY_REUSE", "resume token was reused with a different request payload");
    }
    return succeed(
      deepFreeze({
        run,
        replayed: true,
        event: { ...replayEntry.event },
      }),
    );
  }
  if (Date.parse(action.at) < Date.parse(run.lastTransitionAt)) {
    return reject("INVALID_TRANSITION", "new transition timestamp cannot precede the current run state");
  }
  if (action.expectedRevision !== run.revision) {
    return reject("STALE_REVISION", "transition expectedRevision does not match the run", {
      expected: action.expectedRevision,
      actual: run.revision,
    });
  }
  if (TERMINAL.has(run.status) || !allowed(run.status, action.type)) {
    return reject("ILLEGAL_TRANSITION", `${run.status} cannot accept ${action.type}`);
  }
  const revision = run.revision + 1;
  let updated: RunManifest;
  switch (action.type) {
    case "start":
      updated = nextRun(run, { status: "running", revision });
      break;
    case "wait":
    case "pause": {
      if (typeof action.reason !== "string" || !action.reason.trim()) {
        return reject("CHECKPOINT_REQUIRED", "wait/pause requires a reason");
      }
      const checkpointValidation = validateEvidenceRef(action.checkpoint, "transition.checkpoint");
      if (!checkpointValidation.ok) return checkpointValidation;
      const checkpoint: RunCheckpoint = {
        reason: action.reason,
        evidence: copyEvidenceRef(action.checkpoint),
        at: action.at,
        revision,
      };
      updated = nextRun(run, {
        status: action.type === "wait" ? "waiting_approval" : "paused",
        revision,
        checkpoints: [...run.checkpoints, checkpoint],
      });
      break;
    }
    case "resume":
      updated = nextRun(run, {
        status: "running",
        revision,
        consumedResumeTokens: [...run.consumedResumeTokens, action.resumeToken],
        resumeLedger: [
          ...run.resumeLedger,
          {
            token: action.resumeToken,
            requestDigest: resumeRequestDigest!,
            event: { type: "resume", at: action.at, fromRevision: run.revision, toRevision: revision },
          },
        ],
      });
      break;
    case "complete":
      if (typeof action.outcome !== "string" || !action.outcome.trim()) {
        return reject("TERMINAL_REASON_REQUIRED", "successful completion requires a non-empty outcome");
      }
      if (!isDenseArray(action.evidence)) {
        return reject("OUTCOME_EVIDENCE_REQUIRED", "successful completion requires outcome evidence");
      }
      if (action.evidence.length === 0) {
        return reject("OUTCOME_EVIDENCE_REQUIRED", "successful completion requires outcome evidence");
      }
      for (const [index, evidence] of action.evidence.entries()) {
        const validation = validateEvidenceRef(evidence, `transition.evidence[${index}]`);
        if (!validation.ok) return validation;
      }
      if (!action.evidence.some((evidence) => evidence.kind === "artifact" || evidence.kind === "state")) {
        return reject("OUTCOME_ORACLE_REQUIRED", "successful completion requires artifact or state evidence");
      }
      updated = nextRun(run, {
        status: "succeeded",
        revision,
        completion: {
          outcome: action.outcome,
          evidence: action.evidence.map(copyEvidenceRef),
          completedAt: action.at,
        },
        terminalReason: action.outcome,
      });
      break;
    case "fail":
    case "cancel":
      if (typeof action.reason !== "string" || !action.reason.trim()) {
        return reject("TERMINAL_REASON_REQUIRED", "terminal transition requires a reason");
      }
      if (!isDenseArray(action.evidence)) {
        return reject("TERMINAL_EVIDENCE_REQUIRED", "failed/cancelled terminal states require evidence");
      }
      if (action.evidence.length === 0) {
        return reject("TERMINAL_EVIDENCE_REQUIRED", "failed/cancelled terminal states require evidence");
      }
      for (const [index, evidence] of action.evidence.entries()) {
        const validation = validateEvidenceRef(evidence, `transition.evidence[${index}]`);
        if (!validation.ok) return validation;
      }
      updated = nextRun(run, {
        status: action.type === "fail" ? "failed" : "cancelled",
        revision,
        terminalReason: action.reason,
        completion: {
          outcome: action.reason,
          evidence: action.evidence.map(copyEvidenceRef),
          completedAt: action.at,
        },
      });
      break;
  }

  updated = nextRun(updated, { lastTransitionAt: action.at });

  const updatedValidation = validateRunManifestSnapshot(updated);
  if (!updatedValidation.ok) {
    return reject("INVALID_TRANSITION_RESULT", "transition produced an invalid run manifest", {
      cause: updatedValidation.error.code,
    });
  }
  updated = updatedValidation.value;

  return succeed(
    deepFreeze({
      run: updated,
      replayed: false,
      event: { type: action.type, at: action.at, fromRevision: run.revision, toRevision: revision },
    }),
  );
}

export interface CreateHandoffEnvelopeInput {
  handoffId: string;
  source: RunManifest;
  targetAgent: string;
  objective: string;
  expectedArtifact: VersionRef;
  contextSourceRefs: readonly ProvenanceRef[];
  artifactRefs: readonly ArtifactRef[];
  evidenceRefs: readonly EvidenceRef[];
  authority: AuthorityScope;
  budget: RunBudget;
  createdAt: string;
}

export interface HandoffEnvelope {
  schemaVersion: "agent-handoff/v1";
  handoffId: string;
  parent: { runId: string; revision: number; agent: string; traceDigest: string };
  targetAgent: string;
  objective: string;
  expectedArtifact: VersionRef;
  contextSourceRefs: readonly ProvenanceRef[];
  artifactRefs: readonly ArtifactRef[];
  evidenceRefs: readonly EvidenceRef[];
  authority: AuthorityScope;
  budget: RunBudget;
  createdAt: string;
  returnStatusContract: readonly ["succeeded", "failed", "cancelled", "unknown"];
  digest: string;
}

function isSubset(child: readonly string[], parent: readonly string[]): boolean {
  const allowedValues = new Set(parent);
  return child.every((value) => allowedValues.has(value));
}

export function createHandoffEnvelope(
  input: CreateHandoffEnvelopeInput,
): ContractResult<HandoffEnvelope> {
  if (!input || typeof input !== "object") {
    return reject("INVALID_HANDOFF", "handoff input must be an object");
  }
  const sourceValidation = validateRunManifestSnapshot(input.source);
  if (!sourceValidation.ok) return sourceValidation;
  const source = sourceValidation.value;
  const createdAt = typeof input.createdAt === "string" ? Date.parse(input.createdAt) : Number.NaN;
  if (!Number.isFinite(createdAt) || createdAt < Date.parse(source.createdAt)) {
    return reject("INVALID_HANDOFF_TIME", "handoff createdAt must be a valid timestamp");
  }
  if (
    !isDenseArray(input.contextSourceRefs) ||
    !isDenseArray(input.artifactRefs) ||
    !isDenseArray(input.evidenceRefs) ||
    !input.authority ||
    typeof input.authority !== "object" ||
    !isDenseArray(input.authority.tools) ||
    !isDenseArray(input.authority.resources) ||
    !isDenseArray(input.authority.actions) ||
    [input.authority.tools, input.authority.resources, input.authority.actions].some((values) =>
      values.some((entry) => typeof entry !== "string" || !entry.trim()),
    )
  ) {
    return reject("INVALID_HANDOFF", "handoff refs and authority must be arrays of valid values");
  }
  const artifactValidation = validateArtifactRef(input.expectedArtifact, "expectedArtifact");
  if (!artifactValidation.ok) return artifactValidation;
  const contextSourceRefs: ProvenanceRef[] = [];
  for (const [index, provenance] of input.contextSourceRefs.entries()) {
    const validation = validateProvenanceRef(provenance, `handoff.contextSourceRefs[${index}]`);
    if (!validation.ok) return validation;
    if (Date.parse(provenance.observedAt) > createdAt) {
      return reject("INVALID_HANDOFF_TIME", "handoff lineage cannot be observed after handoff creation");
    }
    contextSourceRefs.push(copyProvenanceRef(validation.value));
  }
  const artifactRefs: ArtifactRef[] = [];
  for (const [index, artifact] of input.artifactRefs.entries()) {
    const validation = validateArtifactRef(artifact, `handoff.artifactRefs[${index}]`);
    if (!validation.ok) return validation;
    artifactRefs.push({ ...validation.value });
  }
  const evidenceRefs: EvidenceRef[] = [];
  for (const [index, evidence] of input.evidenceRefs.entries()) {
    const validation = validateEvidenceRef(evidence, `handoff.evidenceRefs[${index}]`);
    if (!validation.ok) return validation;
    evidenceRefs.push(copyEvidenceRef(validation.value));
  }
  const budgetValidation = validateBudget(input.budget);
  if (!budgetValidation.ok) return budgetValidation;
  if (Date.parse(input.budget.deadline) < createdAt) {
    return reject("INVALID_HANDOFF_TIME", "handoff deadline cannot precede creation");
  }
  if (
    !isSubset(input.authority.tools, source.authority.tools) ||
    !isSubset(input.authority.resources, source.authority.resources) ||
    !isSubset(input.authority.actions, source.authority.actions)
  ) {
    return reject("AUTHORITY_EXPANSION", "handoff authority must be a subset of parent authority");
  }
  if (
    input.budget.maxTurns > source.budget.maxTurns ||
    input.budget.maxTokens > source.budget.maxTokens ||
    Date.parse(input.budget.deadline) > Date.parse(source.budget.deadline)
  ) {
    return reject("BUDGET_EXPANSION", "handoff budget and deadline cannot exceed the parent run");
  }
  if (
    ![input.handoffId, input.targetAgent, input.objective].every(
      (value) => typeof value === "string" && value.trim(),
    )
  ) {
    return reject("INVALID_HANDOFF", "handoff identity, target, and objective are required");
  }

  const snapshot = {
    schemaVersion: "agent-handoff/v1" as const,
    handoffId: input.handoffId,
    parent: {
      runId: source.runId,
      revision: source.revision,
      agent: source.owner,
      traceDigest: source.digest,
    },
    targetAgent: input.targetAgent,
    objective: input.objective,
    expectedArtifact: copyVersionRef(artifactValidation.value),
    contextSourceRefs,
    artifactRefs,
    evidenceRefs,
    authority: copyAuthority(input.authority),
    budget: { ...budgetValidation.value },
    createdAt: input.createdAt,
    returnStatusContract: ["succeeded", "failed", "cancelled", "unknown"] as const,
  };
  return succeed(deepFreeze({ ...snapshot, digest: stableDigest(snapshot) }));
}
