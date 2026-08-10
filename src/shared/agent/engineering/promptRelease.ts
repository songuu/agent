import {
  copyEvidenceRef,
  copyVersionRef,
  deepFreeze,
  isDenseArray,
  reject,
  stableDigest,
  stableSerialize,
  succeed,
  validateEvidenceRef,
  validateVersionRef,
  type ContractResult,
  type EvidenceRef,
  type VersionRef,
} from "./contracts";

export interface PromptTemplate {
  system: string;
  user: string;
}

export interface PromptArtifact<TVariables extends readonly string[] = readonly string[]> {
  schemaVersion: "prompt-artifact/v1";
  id: string;
  version: string;
  status: "draft" | "candidate";
  variables: TVariables;
  template: PromptTemplate;
  outputContract: VersionRef;
  ref: VersionRef;
  digest: string;
}

export interface DefinePromptInput<TVariables extends readonly string[]> {
  id: string;
  version: string;
  status: PromptArtifact["status"];
  variables: TVariables;
  template: PromptTemplate;
  outputContract: VersionRef;
}

function placeholderNames(template: PromptTemplate): string[] {
  const matches = `${template.system}\n${template.user}`.matchAll(/\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g);
  return [...matches].map((match) => match[1]!);
}

function hasMalformedPlaceholder(template: PromptTemplate): boolean {
  const source = `${template.system}\n${template.user}`;
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.indexOf("{{", cursor);
    if (start < 0) return false;
    const end = source.indexOf("}}", start + 2);
    if (end < 0) return true;
    const name = source.slice(start + 2, end).trim();
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) return true;
    cursor = end + 2;
  }
  return false;
}

function hasExactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function definePrompt<const TVariables extends readonly string[]>(
  input: DefinePromptInput<TVariables>,
): ContractResult<PromptArtifact<TVariables>> {
  if (!input || typeof input !== "object") {
    return reject("INVALID_PROMPT_DEFINITION", "prompt definition must be an object");
  }
  if (!hasExactKeys(input, ["id", "version", "status", "variables", "template", "outputContract"])) {
    return reject("INVALID_PROMPT_DEFINITION", "prompt definition contains undeclared fields");
  }
  if (!(["draft", "candidate"] as string[]).includes(input.status as string)) {
    return reject("INVALID_PROMPT_STATUS", "prompt factory status must be draft or candidate");
  }
  if (
    !isDenseArray(input.variables) ||
    input.variables.some((variable: unknown) => typeof variable !== "string" || !variable.trim()) ||
    !input.template ||
    typeof input.template !== "object" ||
    !hasExactKeys(input.template, ["system", "user"]) ||
    typeof input.template.system !== "string" ||
    typeof input.template.user !== "string"
  ) {
    return reject("INVALID_PROMPT_DEFINITION", "prompt variables and template schema are invalid");
  }
  const selfRef: VersionRef = { id: input.id, version: input.version, digest: "pending" };
  const selfValidation = validateVersionRef(selfRef, "prompt");
  if (!selfValidation.ok) return selfValidation;
  const outputValidation = validateVersionRef(input.outputContract, "prompt.outputContract");
  if (!outputValidation.ok) return outputValidation;
  if (!input.template.system.trim() || !input.template.user.trim()) {
    return reject("INVALID_PROMPT_TEMPLATE", "system and user templates must be non-empty");
  }
  if (hasMalformedPlaceholder(input.template)) {
    return reject("INVALID_PROMPT_TEMPLATE", "prompt contains an invalid or unmatched placeholder");
  }
  if (new Set(input.variables).size !== input.variables.length) {
    return reject("DUPLICATE_PROMPT_VARIABLE", "prompt variables must be unique");
  }
  const declared = [...input.variables].sort();
  const used = [...new Set(placeholderNames(input.template))].sort();
  if (declared.length !== used.length || declared.some((name, index) => name !== used[index])) {
    return reject("PROMPT_VARIABLE_DECLARATION_MISMATCH", "template placeholders must exactly match declared variables", {
      declared,
      used,
    });
  }

  const content = {
    schemaVersion: "prompt-artifact/v1" as const,
    id: input.id,
    version: input.version,
    status: input.status,
    variables: [...input.variables] as unknown as TVariables,
    template: { system: input.template.system, user: input.template.user },
    outputContract: copyVersionRef(input.outputContract),
  };
  const digest = stableDigest(content);
  return succeed(
    deepFreeze({
      ...content,
      ref: { id: input.id, version: input.version, digest },
      digest,
    }),
  );
}

export function validatePromptArtifactSnapshot(
  snapshot: unknown,
): ContractResult<PromptArtifact> {
  if (!snapshot || typeof snapshot !== "object") {
    return reject("INVALID_PROMPT_ARTIFACT", "prompt artifact must be an object");
  }
  const value = snapshot as Partial<PromptArtifact>;
  if (
    !hasExactKeys(snapshot, [
      "schemaVersion",
      "id",
      "version",
      "status",
      "variables",
      "template",
      "outputContract",
      "ref",
      "digest",
    ]) ||
    value.schemaVersion !== "prompt-artifact/v1" ||
    typeof value.id !== "string" ||
    typeof value.version !== "string" ||
    !["draft", "candidate"].includes(value.status ?? "") ||
    !isDenseArray(value.variables) ||
    value.variables.some((variable: unknown) => typeof variable !== "string" || !variable.trim()) ||
    !value.template ||
    typeof value.template !== "object" ||
    !hasExactKeys(value.template, ["system", "user"]) ||
    typeof value.template.system !== "string" ||
    typeof value.template.user !== "string" ||
    typeof value.digest !== "string"
  ) {
    return reject("INVALID_PROMPT_ARTIFACT", "prompt artifact schema is invalid");
  }
  const rebuilt = definePrompt({
    id: value.id,
    version: value.version,
    status: value.status!,
    variables: value.variables,
    template: value.template,
    outputContract: value.outputContract as VersionRef,
  });
  if (!rebuilt.ok) {
    return reject("INVALID_PROMPT_ARTIFACT", "prompt artifact content is invalid", {
      cause: rebuilt.error.code,
    });
  }
  if (
    value.digest !== rebuilt.value.digest ||
    !value.ref ||
    value.ref.id !== rebuilt.value.ref.id ||
    value.ref.version !== rebuilt.value.ref.version ||
    value.ref.digest !== rebuilt.value.ref.digest
  ) {
    return reject("INVALID_PROMPT_ARTIFACT", "prompt artifact digest or ref does not match its content");
  }
  return succeed(rebuilt.value);
}

export interface RenderedPrompt {
  prompt: VersionRef;
  system: string;
  user: string;
  inputs: Readonly<Record<string, string>>;
  digest: string;
}

export type PromptSurface = "instructions" | "variables" | "outputContract";

export interface PromptArtifactDiff {
  from: VersionRef;
  to: VersionRef;
  changedSurfaces: readonly PromptSurface[];
  changes: readonly {
    surface: PromptSurface;
    risk: "behavioral" | "breaking";
    before: unknown;
    after: unknown;
  }[];
  digest: string;
}

export function diffPromptArtifacts(
  before: PromptArtifact,
  after: PromptArtifact,
): ContractResult<PromptArtifactDiff> {
  const beforeValidation = validatePromptArtifactSnapshot(before);
  if (!beforeValidation.ok) return beforeValidation;
  const afterValidation = validatePromptArtifactSnapshot(after);
  if (!afterValidation.ok) return afterValidation;
  const left = beforeValidation.value;
  const right = afterValidation.value;
  const changes: PromptArtifactDiff["changes"][number][] = [];
  if (stableSerialize(left.template) !== stableSerialize(right.template)) {
    changes.push({
      surface: "instructions",
      risk: "behavioral",
      before: { ...left.template },
      after: { ...right.template },
    });
  }
  if (stableSerialize(left.variables) !== stableSerialize(right.variables)) {
    changes.push({
      surface: "variables",
      risk: "breaking",
      before: [...left.variables],
      after: [...right.variables],
    });
  }
  if (!sameVersionRef(left.outputContract, right.outputContract)) {
    changes.push({
      surface: "outputContract",
      risk: "breaking",
      before: copyVersionRef(left.outputContract),
      after: copyVersionRef(right.outputContract),
    });
  }
  const snapshot = {
    from: copyVersionRef(left.ref),
    to: copyVersionRef(right.ref),
    changedSurfaces: changes.map((change) => change.surface),
    changes,
  };
  return succeed(deepFreeze({ ...snapshot, digest: stableDigest(snapshot) }));
}

export function renderPrompt<TVariables extends readonly string[]>(
  prompt: PromptArtifact<TVariables>,
  inputs: Record<TVariables[number], string>,
): ContractResult<RenderedPrompt> {
  const promptValidation = validatePromptArtifactSnapshot(prompt);
  if (!promptValidation.ok) return promptValidation;
  const verifiedPrompt = promptValidation.value as PromptArtifact<TVariables>;
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) {
    return reject("PROMPT_INPUT_MISMATCH", "render inputs must be an object");
  }
  const expected = [...verifiedPrompt.variables].sort();
  const actual = Object.keys(inputs).sort();
  if (
    expected.length !== actual.length ||
    expected.some((name, index) => name !== actual[index]) ||
    actual.some((name) => typeof (inputs as Record<string, unknown>)[name] !== "string")
  ) {
    return reject("PROMPT_INPUT_MISMATCH", "render inputs must exactly match typed prompt variables", {
      expected,
      actual,
    });
  }
  const render = (template: string): string =>
    template.replace(
      /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g,
      (_placeholder, variable: string) => (inputs as Record<string, string>)[variable]!,
    );
  const rendered = {
    prompt: copyVersionRef(verifiedPrompt.ref),
    system: render(verifiedPrompt.template.system),
    user: render(verifiedPrompt.template.user),
    inputs: Object.fromEntries(
      expected.map((name) => [name, (inputs as Record<string, string>)[name]!]),
    ) as Record<string, string>,
  };
  return succeed(deepFreeze({ ...rendered, digest: stableDigest(rendered) }));
}

export type BehaviorSurface =
  | "prompt"
  | "model"
  | "toolset"
  | "outputContract"
  | "contextPolicy"
  | "permissionPolicy"
  | "evalSuite";

export interface BehaviorBundle {
  schemaVersion: "behavior-bundle/v1";
  id: string;
  version: string;
  status: "candidate";
  prompt: VersionRef;
  model: VersionRef;
  toolset: VersionRef;
  outputContract: VersionRef;
  contextPolicy: VersionRef;
  permissionPolicy: VersionRef;
  evalSuite: VersionRef;
  ref: VersionRef;
  digest: string;
}

export type CreateBehaviorBundleInput = Omit<BehaviorBundle, "schemaVersion" | "ref" | "digest">;

const BEHAVIOR_SURFACES = [
  "prompt",
  "model",
  "toolset",
  "outputContract",
  "contextPolicy",
  "permissionPolicy",
  "evalSuite",
] as const satisfies readonly BehaviorSurface[];

export function createBehaviorBundle(
  input: CreateBehaviorBundleInput,
): ContractResult<BehaviorBundle> {
  if (!input || typeof input !== "object") {
    return reject("INVALID_BEHAVIOR_BUNDLE", "behavior bundle input must be an object");
  }
  if ((input.status as string) !== "candidate") {
    return reject("DIRECT_ACTIVATION_FORBIDDEN", "bundle creation can only produce a candidate");
  }
  const selfValidation = validateVersionRef(
    { id: input.id, version: input.version, digest: "pending" },
    "behaviorBundle",
  );
  if (!selfValidation.ok) return selfValidation;
  for (const surface of BEHAVIOR_SURFACES) {
    const validation = validateVersionRef(input[surface], `behaviorBundle.${surface}`);
    if (!validation.ok) return validation;
  }
  const content = {
    schemaVersion: "behavior-bundle/v1" as const,
    id: input.id,
    version: input.version,
    status: "candidate" as const,
    ...Object.fromEntries(BEHAVIOR_SURFACES.map((surface) => [surface, copyVersionRef(input[surface])])),
  } as Omit<BehaviorBundle, "ref" | "digest">;
  const digest = stableDigest(content);
  return succeed(deepFreeze({ ...content, ref: { id: input.id, version: input.version, digest }, digest }));
}

export function validateBehaviorBundleSnapshot(
  snapshot: unknown,
): ContractResult<BehaviorBundle> {
  if (!snapshot || typeof snapshot !== "object") {
    return reject("INVALID_BEHAVIOR_BUNDLE", "behavior bundle must be an object");
  }
  const value = snapshot as Partial<BehaviorBundle>;
  if (
    !hasExactKeys(snapshot, [
      "schemaVersion",
      "id",
      "version",
      "status",
      ...BEHAVIOR_SURFACES,
      "ref",
      "digest",
    ]) ||
    value.schemaVersion !== "behavior-bundle/v1" ||
    typeof value.id !== "string" ||
    typeof value.version !== "string" ||
    value.status !== "candidate" ||
    typeof value.digest !== "string"
  ) {
    return reject("INVALID_BEHAVIOR_BUNDLE", "behavior bundle schema is invalid");
  }
  const rebuilt = createBehaviorBundle({
    id: value.id,
    version: value.version,
    status: "candidate",
    ...Object.fromEntries(BEHAVIOR_SURFACES.map((surface) => [surface, value[surface]])),
  } as CreateBehaviorBundleInput);
  if (!rebuilt.ok) {
    return reject("INVALID_BEHAVIOR_BUNDLE", "behavior bundle contains an invalid pinned surface", {
      cause: rebuilt.error.code,
    });
  }
  if (
    value.digest !== rebuilt.value.digest ||
    !value.ref ||
    value.ref.id !== rebuilt.value.ref.id ||
    value.ref.version !== rebuilt.value.ref.version ||
    value.ref.digest !== rebuilt.value.ref.digest
  ) {
    return reject("INVALID_BEHAVIOR_BUNDLE", "behavior bundle digest or ref does not match its content");
  }
  return succeed(rebuilt.value);
}

export interface BehaviorChange {
  surface: BehaviorSurface;
  before: VersionRef;
  after: VersionRef;
  risk: "behavioral" | "breaking" | "permission-affecting";
}

export interface BehaviorBundleDiff {
  from: VersionRef;
  to: VersionRef;
  changedSurfaces: readonly BehaviorSurface[];
  changes: readonly BehaviorChange[];
  digest: string;
}

export function diffBehaviorBundles(
  before: BehaviorBundle,
  after: BehaviorBundle,
): ContractResult<BehaviorBundleDiff> {
  const beforeValidation = validateBehaviorBundleSnapshot(before);
  if (!beforeValidation.ok) return beforeValidation;
  const afterValidation = validateBehaviorBundleSnapshot(after);
  if (!afterValidation.ok) return afterValidation;
  const verifiedBefore = beforeValidation.value;
  const verifiedAfter = afterValidation.value;
  const changes = BEHAVIOR_SURFACES.flatMap((surface): BehaviorChange[] => {
    if (
      verifiedBefore[surface].id === verifiedAfter[surface].id &&
      verifiedBefore[surface].version === verifiedAfter[surface].version &&
      verifiedBefore[surface].digest === verifiedAfter[surface].digest
    ) return [];
    return [
      {
        surface,
        before: copyVersionRef(verifiedBefore[surface]),
        after: copyVersionRef(verifiedAfter[surface]),
        risk:
          surface === "permissionPolicy" || surface === "toolset"
            ? "permission-affecting"
            : surface === "outputContract"
              ? "breaking"
              : "behavioral",
      },
    ];
  });
  const snapshot = {
    from: copyVersionRef(verifiedBefore.ref),
    to: copyVersionRef(verifiedAfter.ref),
    changedSurfaces: changes.map((change) => change.surface),
    changes,
  };
  return succeed(deepFreeze({ ...snapshot, digest: stableDigest(snapshot) }));
}

export type EvaluationBucket = "capability" | "regression" | "holdout";

export interface EvaluationTrial {
  seed: number;
  passed: boolean;
  score: number;
}

export interface EvaluationCase {
  fixtureId: string;
  bucket: EvaluationBucket;
  critical: boolean;
  trials: readonly EvaluationTrial[];
  reasons: readonly string[];
}

export interface EvaluationFixtureSpec {
  fixtureId: string;
  bucket: EvaluationBucket;
  critical: boolean;
  seeds: readonly number[];
}

export interface EvaluationSuiteManifest {
  schemaVersion: "evaluation-suite/v1";
  id: string;
  version: string;
  fixtures: readonly EvaluationFixtureSpec[];
  ref: VersionRef;
  digest: string;
}

export interface DefineEvaluationSuiteInput {
  id: string;
  version: string;
  fixtures: readonly EvaluationFixtureSpec[];
}

export function defineEvaluationSuite(
  input: DefineEvaluationSuiteInput,
): ContractResult<EvaluationSuiteManifest> {
  if (
    !input ||
    typeof input !== "object" ||
    !hasExactKeys(input, ["id", "version", "fixtures"])
  ) {
    return reject("INVALID_EVALUATION_SUITE", "evaluation suite definition must be an exact object");
  }
  const versionValidation = validateVersionRef(
    { id: input?.id, version: input?.version, digest: "pending" },
    "evaluationSuite",
  );
  if (!versionValidation.ok) return versionValidation;
  if (!isDenseArray(input.fixtures) || input.fixtures.length === 0) {
    return reject("INVALID_EVALUATION_SUITE", "evaluation suite requires fixture specifications");
  }
  const fixtureIds = new Set<string>();
  const fixtures: EvaluationFixtureSpec[] = [];
  for (const fixture of input.fixtures) {
    if (
      !fixture ||
      typeof fixture !== "object" ||
      !hasExactKeys(fixture, ["fixtureId", "bucket", "critical", "seeds"]) ||
      typeof fixture.fixtureId !== "string" ||
      !fixture.fixtureId.trim() ||
      fixtureIds.has(fixture.fixtureId) ||
      !EVALUATION_BUCKETS.has(fixture.bucket) ||
      typeof fixture.critical !== "boolean" ||
      !isDenseArray(fixture.seeds) ||
      fixture.seeds.length === 0 ||
      fixture.seeds.some((seed: unknown) => typeof seed !== "number" || !Number.isSafeInteger(seed)) ||
      new Set(fixture.seeds).size !== fixture.seeds.length
    ) {
      return reject("INVALID_EVALUATION_SUITE", "evaluation fixture specification is invalid");
    }
    fixtureIds.add(fixture.fixtureId);
    fixtures.push({
      fixtureId: fixture.fixtureId,
      bucket: fixture.bucket,
      critical: fixture.critical,
      seeds: [...fixture.seeds],
    });
  }
  const content = {
    schemaVersion: "evaluation-suite/v1" as const,
    id: input.id,
    version: input.version,
    fixtures,
  };
  const digest = stableDigest(content);
  return succeed(deepFreeze({
    ...content,
    ref: { id: input.id, version: input.version, digest },
    digest,
  }));
}

export function validateEvaluationSuiteSnapshot(
  snapshot: unknown,
): ContractResult<EvaluationSuiteManifest> {
  if (!snapshot || typeof snapshot !== "object") {
    return reject("INVALID_EVALUATION_SUITE", "evaluation suite must be an object");
  }
  const value = snapshot as Partial<EvaluationSuiteManifest>;
  if (
    !hasExactKeys(snapshot, ["schemaVersion", "id", "version", "fixtures", "ref", "digest"]) ||
    value.schemaVersion !== "evaluation-suite/v1" ||
    typeof value.id !== "string" ||
    typeof value.version !== "string" ||
    typeof value.digest !== "string"
  ) {
    return reject("INVALID_EVALUATION_SUITE", "evaluation suite schema is invalid");
  }
  const rebuilt = defineEvaluationSuite({
    id: value.id,
    version: value.version,
    fixtures: value.fixtures as readonly EvaluationFixtureSpec[],
  });
  if (!rebuilt.ok) return rebuilt;
  if (
    stableSerialize(value) !== stableSerialize(rebuilt.value) ||
    !value.ref ||
    !sameVersionRef(value.ref, rebuilt.value.ref)
  ) {
    return reject("INVALID_EVALUATION_SUITE", "evaluation suite digest or ref is invalid");
  }
  return succeed(rebuilt.value);
}

export interface EvaluationReport {
  schemaVersion: "evaluation-report/v1";
  bundle: VersionRef;
  bundleDigest: string;
  suite: VersionRef;
  cases: readonly EvaluationCase[];
  passRate: number;
  criticalFailures: number;
  buckets: Readonly<Record<EvaluationBucket, { cases: number; trials: number; passRate: number }>>;
  digest: string;
}

export interface BuildEvaluationReportInput {
  bundle: BehaviorBundle;
  suite: EvaluationSuiteManifest;
  cases: readonly EvaluationCase[];
}

function bucketMetrics(cases: readonly EvaluationCase[], bucket: EvaluationBucket) {
  const selected = cases.filter((testCase) => testCase.bucket === bucket);
  const trials = selected.flatMap((testCase) => testCase.trials);
  return {
    cases: selected.length,
    trials: trials.length,
    passRate: trials.length === 0 ? 0 : trials.filter((trial) => trial.passed).length / trials.length,
  };
}

const EVALUATION_BUCKETS = new Set<EvaluationBucket>(["capability", "regression", "holdout"]);

function validateEvaluationCases(cases: unknown): ContractResult<readonly EvaluationCase[]> {
  if (!isDenseArray(cases) || cases.length === 0) {
    return reject("EMPTY_EVALUATION", "evaluation requires at least one case");
  }
  const fixtureIds = new Set<string>();
  const normalized: EvaluationCase[] = [];
  for (const rawCase of cases) {
    if (
      !rawCase ||
      typeof rawCase !== "object" ||
      !hasExactKeys(rawCase, ["fixtureId", "bucket", "critical", "trials", "reasons"])
    ) {
      return reject("INVALID_EVALUATION_CASE", "evaluation case schema is invalid");
    }
    const testCase = rawCase as Partial<EvaluationCase>;
    if (
      typeof testCase.fixtureId !== "string" ||
      !testCase.fixtureId.trim() ||
      fixtureIds.has(testCase.fixtureId) ||
      !EVALUATION_BUCKETS.has(testCase.bucket as EvaluationBucket) ||
      typeof testCase.critical !== "boolean" ||
      !isDenseArray(testCase.trials) ||
      testCase.trials.length === 0 ||
      !isDenseArray(testCase.reasons) ||
      testCase.reasons.some((reason: unknown) => typeof reason !== "string")
    ) {
      return reject("INVALID_EVALUATION_CASE", "evaluation case fields or fixture id are invalid", {
        fixtureId: testCase.fixtureId ?? "unknown",
      });
    }
    fixtureIds.add(testCase.fixtureId);
    const seeds = new Set<number>();
    const trials: EvaluationTrial[] = [];
    for (const rawTrial of testCase.trials) {
      if (
        !rawTrial ||
        typeof rawTrial !== "object" ||
        !hasExactKeys(rawTrial, ["seed", "passed", "score"])
      ) {
        return reject("INVALID_EVALUATION_TRIAL", "evaluation trial schema is invalid");
      }
      const trial = rawTrial as Partial<EvaluationTrial>;
      if (
        !Number.isSafeInteger(trial.seed) ||
        seeds.has(trial.seed!) ||
        typeof trial.passed !== "boolean" ||
        typeof trial.score !== "number" ||
        !Number.isFinite(trial.score) ||
        trial.score < 0 ||
        trial.score > 1
      ) {
        return reject("INVALID_EVALUATION_TRIAL", "trial seed, passed, or score is invalid", {
          fixtureId: testCase.fixtureId,
        });
      }
      seeds.add(trial.seed!);
      trials.push({ seed: trial.seed!, passed: trial.passed, score: trial.score });
    }
    normalized.push({
      fixtureId: testCase.fixtureId,
      bucket: testCase.bucket as EvaluationBucket,
      critical: testCase.critical,
      trials,
      reasons: [...testCase.reasons],
    });
  }
  return succeed(normalized);
}

export function buildEvaluationReport(
  input: BuildEvaluationReportInput,
): ContractResult<EvaluationReport> {
  if (!input || typeof input !== "object") {
    return reject("INVALID_EVALUATION_REPORT", "evaluation report input must be an object");
  }
  const bundleValidation = validateBehaviorBundleSnapshot(input.bundle);
  if (!bundleValidation.ok) return bundleValidation;
  const bundle = bundleValidation.value;
  const suiteValidation = validateEvaluationSuiteSnapshot(input.suite);
  if (!suiteValidation.ok) return suiteValidation;
  const suite = suiteValidation.value;
  if (
    suite.ref.id !== bundle.evalSuite.id ||
    suite.ref.version !== bundle.evalSuite.version ||
    suite.ref.digest !== bundle.evalSuite.digest
  ) {
    return reject("EVAL_SUITE_MISMATCH", "evaluation suite must match the bundle's pinned evalSuite");
  }
  const caseValidation = validateEvaluationCases(input.cases);
  if (!caseValidation.ok) return caseValidation;
  const cases = caseValidation.value;
  const expectedCoverage = suite.fixtures
    .flatMap((fixture) =>
      fixture.seeds.map((seed) => ({
        fixtureId: fixture.fixtureId,
        bucket: fixture.bucket,
        critical: fixture.critical,
        seed,
      })),
    )
    .sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right)));
  const actualCoverage = cases
    .flatMap((testCase) =>
      testCase.trials.map((trial) => ({
        fixtureId: testCase.fixtureId,
        bucket: testCase.bucket,
        critical: testCase.critical,
        seed: trial.seed,
      })),
    )
    .sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right)));
  if (stableSerialize(expectedCoverage) !== stableSerialize(actualCoverage)) {
    return reject("EVALUATION_COVERAGE_MISMATCH", "report must contain the suite's exact fixture and seed plan");
  }
  const trials = cases.flatMap((testCase) => testCase.trials);
  const passRate = trials.filter((trial) => trial.passed).length / trials.length;
  const criticalFailures = cases.filter(
    (testCase) => testCase.critical && testCase.trials.some((trial) => !trial.passed),
  ).length;
  const snapshot = {
    schemaVersion: "evaluation-report/v1" as const,
    bundle: copyVersionRef(bundle.ref),
    bundleDigest: bundle.digest,
    suite: copyVersionRef(suite.ref),
    cases,
    passRate,
    criticalFailures,
    buckets: {
      capability: bucketMetrics(cases, "capability"),
      regression: bucketMetrics(cases, "regression"),
      holdout: bucketMetrics(cases, "holdout"),
    },
  };
  return succeed(deepFreeze({ ...snapshot, digest: stableDigest(snapshot) }));
}

export function validateEvaluationReportSnapshot(
  report: unknown,
  bundle: BehaviorBundle,
  suite: EvaluationSuiteManifest,
): ContractResult<EvaluationReport> {
  if (!report || typeof report !== "object") {
    return reject("INVALID_EVALUATION_REPORT", "evaluation report must be an object");
  }
  const value = report as Partial<EvaluationReport>;
  if (
    !hasExactKeys(report, [
      "schemaVersion",
      "bundle",
      "bundleDigest",
      "suite",
      "cases",
      "passRate",
      "criticalFailures",
      "buckets",
      "digest",
    ]) ||
    value.schemaVersion !== "evaluation-report/v1" ||
    typeof value.digest !== "string"
  ) {
    return reject("INVALID_EVALUATION_REPORT", "evaluation report schema is invalid");
  }
  const rebuilt = buildEvaluationReport({
    bundle,
    suite,
    cases: value.cases as readonly EvaluationCase[],
  });
  if (!rebuilt.ok) {
    return reject("INVALID_EVALUATION_REPORT", "evaluation report cannot be rebuilt", {
      cause: rebuilt.error.code,
    });
  }
  if (stableSerialize(value) !== stableSerialize(rebuilt.value)) {
    return reject("INVALID_EVALUATION_REPORT", "evaluation report digest or derived metrics were tampered");
  }
  return succeed(rebuilt.value);
}

export interface ReleasePolicy {
  minPassRate: number;
  maxPassRateRegression: number;
  requireZeroCriticalFailures: boolean;
  requireHoldout: boolean;
}

export interface DecideReleaseInput {
  baselineBundle: BehaviorBundle;
  baselineReport: EvaluationReport;
  candidateBundle: BehaviorBundle;
  candidateReport: EvaluationReport;
  evaluationSuite: EvaluationSuiteManifest;
  policy: ReleasePolicy;
  actor: string;
  at: string;
}

export interface ReleaseAudit {
  actor: string;
  at: string;
  fromDigest: string;
  toDigest: string;
  evidenceDigest: string;
}

export type ReleaseDecision =
  | {
      decision: "promote";
      activeBundle: BehaviorBundle;
      reasons: readonly string[];
      audit: ReleaseAudit;
    }
  | { decision: "block"; reasons: readonly string[]; activeBundle: BehaviorBundle };

function sameVersionRef(left: VersionRef, right: VersionRef): boolean {
  return left.id === right.id && left.version === right.version && left.digest === right.digest;
}

function evaluationTrialSignature(report: EvaluationReport): string {
  const tuples = report.cases
    .flatMap((testCase) =>
      testCase.trials.map(
        (trial) => ({
          fixtureId: testCase.fixtureId,
          bucket: testCase.bucket,
          critical: testCase.critical,
          seed: trial.seed,
        }),
      ),
    )
    .sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right)));
  return stableDigest(tuples);
}

export function decideRelease(input: DecideReleaseInput): ContractResult<ReleaseDecision> {
  if (!input || typeof input !== "object") {
    return reject("INVALID_RELEASE_INPUT", "release decision input must be an object");
  }
  const reasons: string[] = [];
  const baselineBundleValidation = validateBehaviorBundleSnapshot(input.baselineBundle);
  if (!baselineBundleValidation.ok) {
    return reject("INVALID_BASELINE_BUNDLE", "baseline behavior bundle is invalid");
  }
  const candidateBundleValidation = validateBehaviorBundleSnapshot(input.candidateBundle);
  if (!candidateBundleValidation.ok) {
    return reject("INVALID_CANDIDATE_BUNDLE", "candidate behavior bundle is invalid");
  }
  const baselineBundle = baselineBundleValidation.value;
  const candidateBundle = candidateBundleValidation.value;
  const suiteValidation = validateEvaluationSuiteSnapshot(input.evaluationSuite);
  if (!suiteValidation.ok) {
    return reject("INVALID_EVALUATION_SUITE", "evaluation suite manifest is invalid");
  }
  const evaluationSuite = suiteValidation.value;
  const baselineReportValidation = validateEvaluationReportSnapshot(
    input.baselineReport,
    baselineBundle,
    evaluationSuite,
  );
  const candidateReportValidation = validateEvaluationReportSnapshot(
    input.candidateReport,
    candidateBundle,
    evaluationSuite,
  );
  if (!baselineReportValidation.ok) reasons.push("baseline evaluation report is invalid or tampered");
  if (!candidateReportValidation.ok) reasons.push("candidate evaluation report is invalid or tampered");
  if (
    !input.policy ||
    typeof input.policy !== "object" ||
    !Number.isFinite(input.policy.minPassRate) ||
    input.policy.minPassRate < 0 ||
    input.policy.minPassRate > 1 ||
    !Number.isFinite(input.policy.maxPassRateRegression) ||
    input.policy.maxPassRateRegression < 0 ||
    input.policy.maxPassRateRegression > 1 ||
    typeof input.policy.requireZeroCriticalFailures !== "boolean" ||
    typeof input.policy.requireHoldout !== "boolean" ||
    typeof input.actor !== "string" ||
    !input.actor.trim() ||
    typeof input.at !== "string" ||
    !Number.isFinite(Date.parse(input.at))
  ) {
    return reject("INVALID_RELEASE_POLICY", "release policy or audit identity/time is invalid");
  }
  if (baselineBundle.id !== candidateBundle.id) {
    reasons.push("candidate bundle does not share baseline lineage");
  }
  if (!baselineReportValidation.ok || !candidateReportValidation.ok) {
    return succeed(deepFreeze({ decision: "block", reasons, activeBundle: baselineBundle }));
  }
  const baselineReport = baselineReportValidation.value;
  const candidateReport = candidateReportValidation.value;
  if (!sameVersionRef(baselineReport.suite, candidateReport.suite)) {
    reasons.push("baseline and candidate evaluation suites are not comparable");
  }
  if (evaluationTrialSignature(baselineReport) !== evaluationTrialSignature(candidateReport)) {
    reasons.push("baseline and candidate fixture/seed sets are not comparable");
  }
  if (candidateReport.passRate < input.policy.minPassRate) {
    reasons.push("candidate pass rate is below the release threshold");
  }
  if (baselineReport.passRate - candidateReport.passRate > input.policy.maxPassRateRegression) {
    reasons.push("candidate pass rate regression exceeds policy");
  }
  if (candidateReport.criticalFailures > 0) {
    reasons.push("critical evaluation failure vetoes release");
  }
  if (input.policy.requireHoldout && candidateReport.buckets.holdout.cases === 0) {
    reasons.push("holdout evidence is required");
  }
  if (reasons.length > 0) {
    return succeed(deepFreeze({ decision: "block", reasons, activeBundle: baselineBundle }));
  }
  const audit = {
    actor: input.actor,
    at: input.at,
    fromDigest: baselineBundle.digest,
    toDigest: candidateBundle.digest,
    evidenceDigest: candidateReport.digest,
  };
  return succeed(deepFreeze({
    decision: "promote",
    activeBundle: candidateBundle,
    reasons: ["all configured release gates passed"],
    audit,
  }));
}

export interface RollbackReleaseInput {
  activeBundle: BehaviorBundle;
  expectedActiveDigest: string;
  previousBundle: BehaviorBundle;
  promotionAudit: ReleaseAudit;
  reason: string;
  actor: string;
  at: string;
  evidence: readonly EvidenceRef[];
}

export interface RollbackReleaseResult {
  decision: "rollback";
  activeBundle: BehaviorBundle;
  audit: {
    actor: string;
    at: string;
    reason: string;
    fromDigest: string;
    toDigest: string;
    evidence: readonly EvidenceRef[];
  };
  notice: string;
}

export function rollbackRelease(
  input: RollbackReleaseInput,
): ContractResult<RollbackReleaseResult> {
  if (!input || typeof input !== "object") {
    return reject("INVALID_ROLLBACK_INPUT", "rollback input must be an object");
  }
  const activeValidation = validateBehaviorBundleSnapshot(input.activeBundle);
  if (!activeValidation.ok) return activeValidation;
  const previousValidation = validateBehaviorBundleSnapshot(input.previousBundle);
  if (!previousValidation.ok) return previousValidation;
  const activeBundle = activeValidation.value;
  const previousBundle = previousValidation.value;
  if (
    typeof input.expectedActiveDigest !== "string" ||
    !input.expectedActiveDigest.trim() ||
    input.expectedActiveDigest !== activeBundle.digest
  ) {
    return reject("STALE_ACTIVE_BUNDLE", "rollback CAS precondition does not match the active bundle");
  }
  if (activeBundle.id !== previousBundle.id) {
    return reject("INVALID_ROLLBACK_LINEAGE", "rollback target must share the active bundle id");
  }
  if (
    !input.promotionAudit ||
    typeof input.promotionAudit !== "object" ||
    typeof input.promotionAudit.actor !== "string" ||
    !input.promotionAudit.actor.trim() ||
    typeof input.promotionAudit.at !== "string" ||
    !Number.isFinite(Date.parse(input.promotionAudit.at)) ||
    typeof input.promotionAudit.evidenceDigest !== "string" ||
    !input.promotionAudit.evidenceDigest.trim() ||
    input.promotionAudit.toDigest !== activeBundle.digest ||
    input.promotionAudit.fromDigest !== previousBundle.digest
  ) {
    return reject("INVALID_ROLLBACK_LINEAGE", "rollback target must match the trusted promotion audit");
  }
  if (
    typeof input.reason !== "string" ||
    !input.reason.trim() ||
    typeof input.actor !== "string" ||
    !input.actor.trim() ||
    typeof input.at !== "string" ||
    !Number.isFinite(Date.parse(input.at)) ||
    !isDenseArray(input.evidence) ||
    input.evidence.length === 0
  ) {
    return reject("INVALID_ROLLBACK_AUDIT", "rollback requires reason, actor, time, and evidence");
  }
  for (const [index, evidence] of input.evidence.entries()) {
    const validation = validateEvidenceRef(evidence, `rollback.evidence[${index}]`);
    if (!validation.ok) return validation;
  }
  return succeed(deepFreeze({
    decision: "rollback" as const,
    activeBundle: previousBundle,
    audit: {
      actor: input.actor,
      at: input.at,
      reason: input.reason,
      fromDigest: activeBundle.digest,
      toDigest: previousBundle.digest,
      evidence: input.evidence.map(copyEvidenceRef),
    },
    notice: "Rollback decision prepared; an external CAS must apply it atomically, and it does not reverse external side effects.",
  }));
}
