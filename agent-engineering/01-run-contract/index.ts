/**
 * Agent Engineering A1：Run manifest、显式生命周期与 scoped handoff。
 *
 * 纯离线示例：不调用模型、不执行工具、不触发任何生产变更。
 */
import {
  createHandoffEnvelope,
  createRunManifest,
  transitionRun,
  type AuthorityScope,
  type BehaviorRevisions,
  type ContractResult,
  type EvidenceRef,
  type VersionRef,
} from "../../src/shared/agent/engineering/index.ts";

const CREATED_AT = "2026-08-10T02:00:00.000Z";
const COMPLETED_AT = "2026-08-10T02:05:00.000Z";

function version(id: string, value = "1.0.0"): VersionRef {
  return { id, version: value, digest: `${id}-${value}-sha256` };
}

function unwrap<T>(label: string, result: ContractResult<T>): T {
  if (!result.ok) {
    throw new Error(`${label} 失败 [${result.error.code}]：${result.error.message}`);
  }
  return result.value;
}

function expectRejected(label: string, result: ContractResult<unknown>): void {
  if (result.ok) throw new Error(`${label} 本应被合同拒绝，却意外通过`);
  console.log(`  [已拒绝] ${label}: ${result.error.code} — ${result.error.message}`);
}

const behavior: BehaviorRevisions = {
  agent: version("release-review-agent"),
  harness: version("agent-engineering-harness"),
  prompt: version("release-review-prompt", "1.4.0"),
  model: version("deterministic-fixture-model"),
  toolset: version("read-only-release-tools", "1.2.0"),
  outputContract: version("release-decision-schema", "2.0.0"),
  contextPolicy: version("release-review-context", "2.1.0"),
  permissionPolicy: version("read-only-permissions", "3.0.0"),
  evalSuite: version("release-review-fixtures", "1.3.0"),
};

const authority: AuthorityScope = {
  tools: ["read_change", "read_runbook", "write_review_artifact"],
  resources: ["change:change-4821", "runbook:database-pool", "artifact:release-review"],
  actions: ["read", "write-artifact"],
};

const outcomeEvidence: EvidenceRef = {
  id: "review-artifact-change-4821",
  kind: "artifact",
  digest: "review-artifact-change-4821-sha256",
  location: "artifact://release-reviews/change-4821.json",
};

function main(): void {
  console.log("\n=== A1 / 生产变更审查 Run contract（离线） ===");

  const created = unwrap(
    "创建 run manifest",
    createRunManifest({
      runId: "run-change-4821",
      sessionId: "session-release-review",
      owner: "release-review-agent",
      objective: "审查 change-4821 是否满足发布条件",
      stage: "collect-evidence",
      behavior,
      authority,
      budget: {
        maxTurns: 8,
        maxTokens: 4_000,
        deadline: "2026-08-10T03:00:00.000Z",
      },
      expectedOutcome: "产生带证据引用的 release decision artifact",
      createdAt: CREATED_AT,
    }),
  );
  console.log("\n1) Manifest 固定的行为面");
  console.log(
    JSON.stringify(
      {
        runId: created.runId,
        status: created.status,
        revision: created.revision,
        behavior: Object.fromEntries(
          Object.entries(created.behavior).map(([surface, ref]) => [
            surface,
            `${ref.id}@${ref.version}`,
          ]),
        ),
        authority: created.authority,
      },
      null,
      2,
    ),
  );

  const started = unwrap(
    "启动 run",
    transitionRun(created, {
      type: "start",
      expectedRevision: created.revision,
      at: CREATED_AT,
    }),
  );

  const handoff = unwrap(
    "创建 scoped handoff",
    createHandoffEnvelope({
      handoffId: "handoff-change-4821-db-review",
      source: started.run,
      targetAgent: "database-risk-reviewer",
      objective: "只读复核连接池容量证据",
      expectedArtifact: version("database-capacity-review"),
      contextSourceRefs: [
        { sourceId: "change-diff", version: "change-4821", observedAt: CREATED_AT },
        { sourceId: "capacity-snapshot", version: "snapshot-2048", observedAt: CREATED_AT },
      ],
      artifactRefs: [],
      evidenceRefs: [outcomeEvidence],
      authority: {
        tools: ["read_change"],
        resources: ["change:change-4821"],
        actions: ["read"],
      },
      budget: {
        maxTurns: 3,
        maxTokens: 1_200,
        deadline: "2026-08-10T02:30:00.000Z",
      },
      createdAt: COMPLETED_AT,
    }),
  );
  console.log("\n2) Handoff envelope（引用而非复制完整历史）");
  console.log(
    JSON.stringify(
      {
        handoffId: handoff.handoffId,
        parent: handoff.parent,
        targetAgent: handoff.targetAgent,
        contextSourceRefs: handoff.contextSourceRefs,
        authority: handoff.authority,
      },
      null,
      2,
    ),
  );

  expectRejected(
    "handoff 扩张到 deploy_prod",
    createHandoffEnvelope({
      handoffId: "handoff-change-4821-unsafe",
      source: started.run,
      targetAgent: "unsafe-deployer",
      objective: "绕过审查直接部署",
      expectedArtifact: version("unsafe-deploy-result"),
      contextSourceRefs: [],
      artifactRefs: [],
      evidenceRefs: [],
      authority: {
        tools: ["deploy_prod"],
        resources: ["production"],
        actions: ["write"],
      },
      budget: { maxTurns: 1, maxTokens: 200, deadline: "2026-08-10T02:10:00.000Z" },
      createdAt: COMPLETED_AT,
    }),
  );

  expectRejected(
    "没有 outcome evidence 的假成功",
    transitionRun(started.run, {
      type: "complete",
      expectedRevision: started.run.revision,
      outcome: "Agent 自称审查通过",
      evidence: [],
      at: COMPLETED_AT,
    }),
  );

  const completed = unwrap(
    "用 artifact evidence 完成 run",
    transitionRun(started.run, {
      type: "complete",
      expectedRevision: started.run.revision,
      outcome: "release decision artifact 已由外部引用确认",
      evidence: [outcomeEvidence],
      at: COMPLETED_AT,
    }),
  );
  console.log("\n3) 显式终态与完成证据");
  console.log(
    JSON.stringify(
      {
        transition: `${created.status} -> ${started.run.status} -> ${completed.run.status}`,
        revision: completed.run.revision,
        completion: completed.run.completion,
      },
      null,
      2,
    ),
  );

  console.log(
    "\n✅ 已验证离线 pure contract；这不证明真实模型质量、生产持久化、权限隔离或外部副作用安全。",
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ A1 示例失败：${message}`);
  process.exitCode = 1;
}

