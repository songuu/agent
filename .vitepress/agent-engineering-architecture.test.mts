import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CHAPTERS, CONCEPTS, RELATIONS } from "../knowledge-graph/data/graph.ts";
import { CONCEPT_VISUALS } from "../knowledge-graph/data/visuals.ts";
import { CONTEXTUAL_SIDEBAR } from "./site-information-architecture.ts";

function readRepositoryFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const blueprint = readRepositoryFile("docs/agent-trends-architecture.md");

const AGENT_ENGINEERING_UNITS = [
  { code: "A1", id: "ae-run", dir: "agent-engineering/01-run-contract", title: "Run Contract：可恢复运行契约" },
  { code: "A2", id: "ae-context", dir: "agent-engineering/02-context-compiler", title: "Context Compiler：可审计上下文编译" },
  { code: "A3", id: "ae-prompt", dir: "agent-engineering/03-prompt-release-gate", title: "Prompt Release Gate：行为包发布门" },
  { code: "A4", id: "ae-runtime", dir: "agent-engineering/04-context-runtime", title: "Context Runtime：身份、策略与可解释装配" },
  { code: "A5", id: "ae-evidence", dir: "agent-engineering/05-evidence-rag", title: "Evidence RAG：权限、引用与充分性" },
  { code: "A6", id: "ae-memory", dir: "agent-engineering/06-durable-memory", title: "Durable State & Memory：恢复、压缩与治理" },
  { code: "A7", id: "ae-multi", dir: "agent-engineering/07-cache-multi-agent", title: "Cache & Multi-Agent：指纹、隔离与聚合" },
  { code: "A8", id: "ae-capstone", dir: "agent-engineering/08-observability-capstone", title: "Observability Capstone：回放、灰度与发布" },
] as const;

const ADVANCED_AGENT_ENGINEERING_UNITS = AGENT_ENGINEERING_UNITS.slice(3);

function readUnitDocuments(): string[] {
  return AGENT_ENGINEERING_UNITS.map(({ dir }) => readRepositoryFile(`${dir}/README.md`));
}

function readCompanionDocuments(): {
  companionHub: string;
  contextCompiler: string;
  promptReleaseGate: string;
  runContract: string;
} {
  return {
    companionHub: readRepositoryFile("agent-engineering/README.md"),
    runContract: readRepositoryFile(
      "agent-engineering/01-run-contract/README.md",
    ),
    contextCompiler: readRepositoryFile(
      "agent-engineering/02-context-compiler/README.md",
    ),
    promptReleaseGate: readRepositoryFile(
      "agent-engineering/03-prompt-release-gate/README.md",
    ),
  };
}

test("the five-plane blueprint stays canonical and links only to its executable companion hub", () => {
  const { companionHub } = readCompanionDocuments();

  assert.match(blueprint, /(?:canonical|唯一)[^\n]*责任模型/i);
  assert.match(
    blueprint,
    /\[[^\]]*Agent Engineering[^\]]*\]\(\.\.\/agent-engineering\/README\.md\)/,
  );
  assert.doesNotMatch(blueprint, /agent-engineering\/0[1-8]-/);

  assert.match(companionHub, /(?:canonical|唯一)[^\n]*五平面|五平面[^\n]*(?:canonical|唯一)/i);
  assert.match(
    companionHub,
    /\[[^\]]*(?:五平面|架构蓝图)[^\]]*\]\(\.\.\/docs\/agent-trends-architecture\.md\)/,
  );
  assert.match(companionHub, /(?:可执行|executable)[^\n]*(?:companion|配套实践)/i);
});

test("the companion traces all five engineering angles to reviewed primary sources", () => {
  const companionDocuments = Object.values(readCompanionDocuments()).join("\n");
  const sourceGroups = [
    {
      angle: "agent lifecycle and evaluation",
      patterns: [
        /anthropic\.com\/engineering\/demystifying-evals-for-ai-agents/,
        /openai\.com\/index\/the-next-evolution-of-the-agents-sdk/,
      ],
    },
    {
      angle: "context compilation and memory",
      patterns: [
        /anthropic\.com\/engineering\/effective-context-engineering-for-ai-agents/,
        /developers\.googleblog\.com\/architecting-efficient-context-aware-multi-agent-framework-for-production/,
      ],
    },
    {
      angle: "prompt versioning and release",
      patterns: [
        /developers\.openai\.com\/api\/docs\/guides\/prompting/,
        /platform\.claude\.com\/docs\/en\/build-with-claude\/prompt-engineering\/overview/,
      ],
    },
    {
      angle: "tool safety and permissions",
      patterns: [
        /blog\.modelcontextprotocol\.io\/posts\/2026-07-28/,
        /modelcontextprotocol\.io\/specification\/draft\/server\/tools/,
      ],
    },
    {
      angle: "multi-agent handoff",
      patterns: [
        /anthropic\.com\/engineering\/harness-design-long-running-apps/,
        /developers\.googleblog\.com\/architecting-efficient-context-aware-multi-agent-framework-for-production/,
      ],
    },
  ];

  for (const { angle, patterns } of sourceGroups) {
    assert.ok(
      patterns.some((pattern) => pattern.test(companionDocuments)),
      `missing a primary source for ${angle}`,
    );
  }
});

test("the prompt track follows OpenAI's current code-managed boundary", () => {
  const { companionHub, promptReleaseGate } = readCompanionDocuments();
  const promptDocuments = `${companionHub}\n${promptReleaseGate}`;

  assert.match(
    promptDocuments,
    /developers\.openai\.com\/api\/docs\/guides\/prompting/,
  );
  assert.match(promptDocuments, /code-managed|代码管理/i);
  assert.match(promptDocuments, /hosted reusable prompt objects|托管[^\n]*prompt/i);
  assert.match(promptDocuments, /2026-11-30/);
  assert.match(promptDocuments, /关闭|下线|deprecat/i);
  assert.match(promptDocuments, /不[^\n]*(?:canonical|唯一真相)|迁移/i);
});

test("offline examples explicitly do not claim production completion", () => {
  const companionDocuments = [
    readCompanionDocuments().companionHub,
    ...readUnitDocuments(),
  ];

  for (const document of companionDocuments) {
    assert.match(document, /离线|offline/i);
    assert.match(
      document,
      /不(?:等于|代表|证明)[^\n]*生产|不能证明[^\n]*生产|not production|offline\s*(?:≠|!=|is not)\s*production/i,
    );
  }
});

test("the Agent Engineering registry exposes the fixed A1-A8 keyless sequence", () => {
  const chapters = CHAPTERS.filter((chapter) => chapter.part === "Agent Engineering 专题");

  assert.deepEqual(
    chapters.map(({ id, dir, title }) => ({ id, dir, title })),
    AGENT_ENGINEERING_UNITS.map(({ id, dir, title }) => ({ id, dir, title })),
  );
  assert.ok(
    chapters.every((chapter) => chapter.demo?.needsKey === "none"),
    "every Agent Engineering unit must remain runnable without a key",
  );
});

test("the twenty-week A1-A8 curriculum is discoverable from docs and sidebar", () => {
  const course = readRepositoryFile("agent-engineering/CURRICULUM.md");
  const navigation = readRepositoryFile("docs/navigation.md");
  const curriculum = readRepositoryFile("docs/curriculum.md");
  const sidebar = CONTEXTUAL_SIDEBAR["/agent-engineering/"];

  assert.match(course, /20\s*周/i);
  for (let week = 1; week <= 20; week += 1) {
    assert.match(
      course,
      new RegExp(`(?:第\\s*0?${week}\\s*周|W(?:eek)?\\s*0?${week}\\b|\\|\\s*0?${week}\\s*\\|)`, "i"),
      `curriculum must include week ${week}`,
    );
  }
  for (const { code } of AGENT_ENGINEERING_UNITS) {
    assert.match(course, new RegExp(`\\b${code}\\b`), `curriculum must include ${code}`);
  }
  for (const document of [navigation, curriculum]) {
    assert.match(document, /20\s*周/i);
    assert.match(document, /120\s*[–—-]\s*160\s*小时/i);
    assert.ok(
      document.includes("../agent-engineering/CURRICULUM.md"),
      "docs entry must link to the complete Agent Engineering curriculum",
    );
  }
  assert.ok(Array.isArray(sidebar), "Agent Engineering sidebar must be an item list");
  assert.equal(
    sidebar[0]?.items?.[0]?.link,
    "/agent-engineering/CURRICULUM",
    "the complete curriculum must precede chapter links",
  );
});

test("every A1-A8 unit contains theory, lab, counterexample, and acceptance signals", () => {
  const structuralSignals = [
    { name: "theory", pattern: /^##\s+.*(?:学习目标|理论|核心概念|机制|架构)/im },
    { name: "lab", pattern: /^##\s+.*(?:正例|离线运行|实验|动手|Lab)/im },
    { name: "counterexample", pattern: /^##\s+.*(?:反例|失败模式|陷阱)/im },
    {
      name: "acceptance",
      pattern: /(?:^##\s+.*(?:验收|完成条件|检查清单)|^-\s+\[[ xX]\]\s+)/im,
    },
  ] as const;

  for (const { code, dir } of AGENT_ENGINEERING_UNITS) {
    const document = readRepositoryFile(`${dir}/README.md`);
    for (const { name, pattern } of structuralSignals) {
      assert.match(document, pattern, `${code} must expose a ${name} learning structure`);
    }
    assert.match(document, /index\.ts|pnpm\s+ae:/i, `${code} must expose an executable lab entry`);
  }
});

test("advanced graph chapters have concepts, cross-chapter dependencies, and visuals", () => {
  const chapterByConcept = new Map(CONCEPTS.map((concept) => [concept.id, concept.chapter]));

  for (const { id } of ADVANCED_AGENT_ENGINEERING_UNITS) {
    assert.ok(
      CONCEPTS.filter((concept) => concept.chapter === id).length >= 3,
      `${id} must define at least three concepts`,
    );
    assert.ok(
      RELATIONS.some((relation) => {
        const fromChapter = chapterByConcept.get(relation.from);
        const toChapter = chapterByConcept.get(relation.to);
        return (
          fromChapter !== undefined &&
          toChapter !== undefined &&
          fromChapter !== toChapter &&
          (fromChapter === id || toChapter === id)
        );
      }),
      `${id} must participate in a cross-chapter dependency`,
    );
    assert.ok(
      CONCEPT_VISUALS.some((visual) => visual.chapter === id),
      `${id} must include an architecture visual`,
    );
  }
});

test("Agent Engineering README sources rewrite to clean public routes", () => {
  const vitepressConfig = readRepositoryFile(".vitepress/config.mts");

  assert.match(
    vitepressConfig,
    /"agent-engineering\/README\.md"\s*:\s*"agent-engineering\/index\.md"/,
  );
  assert.match(
    vitepressConfig,
    /"agent-engineering\/:unit\/README\.md"\s*:\s*"agent-engineering\/:unit\/index\.md"/,
  );
});

test("CI exercises the Agent Engineering registry and rejects generated KG drift", () => {
  const packageJson = JSON.parse(readRepositoryFile("package.json")) as {
    scripts?: Record<string, string>;
  };
  const workflow = readRepositoryFile(".github/workflows/agent-build-deploy.yml");

  assert.equal(
    packageJson.scripts?.["demo:registry:test"],
    "tsx scripts/demo-runner/registry.test.mts",
  );
  assert.equal(
    packageJson.scripts?.["ae:advanced:smoke"],
    "tsx agent-engineering/advanced-smoke.ts",
  );
  assert.equal(
    packageJson.scripts?.["ae:course:smoke"],
    "pnpm ae:smoke && pnpm ae:advanced:smoke",
  );
  assert.match(workflow, /pnpm ae:research:test\s+pnpm ae:course:smoke/);
  assert.match(workflow, /pnpm demo:registry:test/);
  assert.match(
    workflow,
    /pnpm kg[\s\S]*git diff --exit-code -- docs\/knowledge-graph\.md knowledge-graph\/output\/index\.html/,
  );
  assert.match(workflow, /:\(glob\)\*\*\/README\.md/);
});

test("existing foundations link forward to the matching Agent Engineering unit", () => {
  const backlinks = [
    {
      path: "lessons/03-prompt-engineering/README.md",
      target: "../../agent-engineering/03-prompt-release-gate/README.md",
    },
    {
      path: "lessons/07-short-term-memory/README.md",
      target: "../../agent-engineering/02-context-compiler/README.md",
    },
    {
      path: "lessons/15-evaluation-and-testing/README.md",
      target: "../../agent-engineering/03-prompt-release-gate/README.md",
    },
    {
      path: "rag-advanced/11-context-engineering/README.md",
      target: "../../agent-engineering/02-context-compiler/README.md",
    },
    {
      path: "capstone/agent-eval-harness/README.md",
      target: "../../agent-engineering/03-prompt-release-gate/README.md",
    },
  ];

  for (const { path, target } of backlinks) {
    const document = readRepositoryFile(path);
    assert.match(document, /基础\s*(?:→|->)\s*进阶/);
    assert.ok(document.includes(`](${target})`), `${path} must link to ${target}`);
  }
});
