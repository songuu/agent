/** A6 — CAS TaskLedger, checkpoint/idempotency, recoverable compaction, governed memory. */
import {
  checkpointTaskLedger,
  compactTaskLedger,
  commitTaskLedger,
  createTaskLedger,
  deleteGovernedMemory,
  proposeGovernedMemory,
  queryGovernedMemory,
  type ContractResult,
  type VersionRef,
} from "../../src/shared/agent/engineering/index.ts";

const AT = "2026-08-10T06:00:00.000Z";
const LATER = "2026-08-10T06:05:00.000Z";
const version = (id: string, value = "1.0.0"): VersionRef => ({ id, version: value, digest: `${id}-${value}-sha256` });
const unwrap = <T>(result: ContractResult<T>): T => {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};
const errorCode = (result: ContractResult<unknown>): string => {
  if (result.ok) throw new Error("安全反例意外通过");
  return result.error.code;
};
const authority = { tools: ["read_ci"], resources: ["ci:agent-build"], actions: ["read"] };
const policySnapshot = version("permission-policy", "7.0.0");

try {
  const created = unwrap(createTaskLedger({
    taskId: "task-change-4821",
    tenantId: "tenant-acme",
    goal: "生成带证据的生产变更审查结论",
    successCriteria: ["政策与 CI 证据齐全", "不得执行部署"],
    authority,
    policySnapshot,
    createdAt: AT,
  }));
  const committed = unwrap(commitTaskLedger(created, {
    expectedRevision: 0,
    idempotencyKey: "task-change-4821:fact:1",
    at: AT,
    patch: {
      currentStep: "review",
      verifiedFacts: [{
        claim: "CI 已通过",
        evidenceIds: ["ev-ci"],
        sourceRefs: [{ sourceId: "ci", version: "2048", observedAt: AT }],
      }],
      openQuestions: ["人工审批尚未签署"],
    },
  }));
  const checkpointed = unwrap(checkpointTaskLedger(committed.ledger, {
    expectedRevision: 1,
    idempotencyKey: "task-change-4821:checkpoint:1",
    checkpointId: "checkpoint-1",
    at: LATER,
    evidenceIds: ["ev-ci"],
    artifactRefs: [],
  }));
  const replayed = unwrap(checkpointTaskLedger(checkpointed.ledger, {
    expectedRevision: checkpointed.ledger.revision,
    idempotencyKey: "task-change-4821:checkpoint:1",
    checkpointId: "checkpoint-1",
    at: LATER,
    evidenceIds: ["ev-ci"],
    artifactRefs: [],
  }));
  const compaction = unwrap(compactTaskLedger(checkpointed.ledger, {
    maxTokens: 120,
    estimateTokens: (text) => Math.max(1, Math.ceil(text.length / 12)),
    artifact: {
      id: "task-change-4821-ledger",
      version: "2",
      digest: "task-change-4821-ledger-v2-sha256",
      location: "artifact://task-change-4821/ledger-2.json",
    },
    at: LATER,
  }));
  const firstMemory = unwrap(proposeGovernedMemory({
    records: [],
    memoryId: "mem-output-style",
    tenantId: "tenant-acme",
    namespace: ["tenant-acme", "release-reviewer-7"],
    subject: "review-output-style",
    value: "structured-json",
    scope: "user",
    principalId: "release-reviewer-7",
    allowedPurposes: ["production-change-review"],
    provenance: [{ sourceId: "user-confirmation", version: "turn-9", observedAt: AT }],
    confidence: 0.99,
    sensitivity: "internal",
    expiresAt: LATER,
    idempotencyKey: "memory:style:1",
    at: AT,
  }));
  const visible = unwrap(queryGovernedMemory({
    records: firstMemory.records,
    tenantId: "tenant-acme",
    principalId: "release-reviewer-7",
    purpose: "production-change-review",
    namespacePrefix: ["tenant-acme"],
    at: AT,
  }));
  const deleted = unwrap(deleteGovernedMemory({
    records: firstMemory.records,
    memoryId: firstMemory.record.memoryId,
    tenantId: "tenant-acme",
    principalId: "release-reviewer-7",
    idempotencyKey: "memory:delete:1",
    at: LATER,
  }));
  const staleCode = errorCode(commitTaskLedger(committed.ledger, {
    expectedRevision: 0,
    idempotencyKey: "task-change-4821:stale",
    at: LATER,
    patch: { currentStep: "unsafe" },
  }));
  if (!replayed.replayed || visible.records.length !== 1 || deleted.record.status !== "deleted") {
    throw new Error("A6 验收断言失败");
  }
  console.log(JSON.stringify({
    module: "A6",
    ledger: { revision: checkpointed.ledger.revision, checkpoint: checkpointed.ledger.checkpoints.at(-1)?.checkpointId, replayed: replayed.replayed },
    memory: { status: firstMemory.record.status, conflicts: firstMemory.conflictIds, deleted: deleted.record.status === "deleted" },
    compaction: { lossRisk: compaction.lossRisk, dropped: compaction.dropped, recoverableArtifact: compaction.recoverableArtifact },
    safetyCounterexample: {
      rejected: staleCode === "STALE_TASK_REVISION",
      code: staleCode,
      case: "stale-ledger-revision",
    },
    boundary: "in-memory pure state transitions; ArtifactRef is a handle and no database/object-store write occurred",
  }));
} catch (cause) {
  console.error(JSON.stringify({ module: "A6", fatal: cause instanceof Error ? cause.message : String(cause) }));
  process.exitCode = 1;
}
