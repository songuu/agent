import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function readRepositoryFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const blueprint = readRepositoryFile("docs/agent-trends-architecture.md");

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
  assert.doesNotMatch(blueprint, /agent-engineering\/0[1-3]-/);

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
  const companionDocuments = Object.values(readCompanionDocuments()).join("\n");

  assert.match(companionDocuments, /离线|offline/i);
  assert.match(
    companionDocuments,
    /不(?:等于|代表|证明)[^\n]*生产|不能证明[^\n]*生产|not production/i,
  );
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
