import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SOURCE_ANALYSIS_PRESETS,
  analyzePreset,
  analyzeRepositoryTree,
  answerSourceQuestion,
  buildGitHubFileUrl,
  buildGitHubLineUrl,
  classifyRepositoryPath,
  normalizeRepositoryInput,
  selectQuestionFiles,
} from "./source-analysis-engine.ts";

test("normalizeRepositoryInput accepts owner/repo and GitHub URLs", () => {
  assert.deepEqual(normalizeRepositoryInput("langchain-ai/langgraph"), {
    owner: "langchain-ai",
    repo: "langgraph",
    slug: "langchain-ai/langgraph",
  });
  assert.deepEqual(normalizeRepositoryInput("https://github.com/run-llama/llama_index.git"), {
    owner: "run-llama",
    repo: "llama_index",
    slug: "run-llama/llama_index",
  });
  assert.equal(normalizeRepositoryInput("not-a-slug"), null);
});

test("presets expose complete matrix basics for the three source-analysis repos", () => {
  assert.equal(SOURCE_ANALYSIS_PRESETS.length, 3);
  for (const preset of SOURCE_ANALYSIS_PRESETS) {
    const analysis = analyzePreset(preset);
    assert.ok(analysis.areas.length >= 5, `${preset.slug} should expose area matrix`);
    assert.ok(analysis.keyFiles.length >= 5, `${preset.slug} should expose relevant source files`);
    assert.ok(analysis.readingPath.length >= 4, `${preset.slug} should expose reading path`);
    assert.ok(analysis.areas.every((row) => preset.files.some((file) => file.path === row.readFirst)));
    assert.equal(analysis.source, "preset");
  }
});

test("dynamic repository tree creates matrix, language rows, and key files", () => {
  const analysis = analyzeRepositoryTree({
    slug: "example/repo",
    items: [
      { path: "README.md", type: "file" },
      { path: "package.json", type: "file" },
      { path: "src/agent/runtime.ts", type: "file" },
      { path: "src/tools/registry.ts", type: "file" },
      { path: "src/retrievers/query-engine.ts", type: "file" },
      { path: "tests/runtime.test.ts", type: "file" },
      { path: "docs/architecture.md", type: "file" },
    ],
    source: "github",
  });

  assert.equal(analysis.stats.totalFiles, 7);
  assert.equal(analysis.stats.codeFiles, 4);
  assert.ok(analysis.languages.some((row) => row.language === "TypeScript" && row.files === 4));
  assert.ok(analysis.areas.some((row) => row.area === "src" && row.layer === "运行时"));
  assert.ok(analysis.keyFiles.some((row) => row.path === "src/agent/runtime.ts"));
});

test("classifyRepositoryPath maps DeepWiki-style source layers", () => {
  assert.equal(classifyRepositoryPath("libs/langgraph/langgraph/pregel/main.py"), "运行时");
  assert.equal(classifyRepositoryPath("libs/prebuilt/langgraph/prebuilt/tool_node.py"), "工具");
  assert.equal(classifyRepositoryPath("llama_index/core/query_engine/retriever_query_engine.py"), "检索");
  assert.equal(classifyRepositoryPath("docs/concepts/low_level.md"), "文档");
});

test("buildGitHubFileUrl points at selected branch and file", () => {
  assert.equal(
    buildGitHubFileUrl("langchain-ai/langgraph", "main", "libs/langgraph/langgraph/graph/state.py"),
    "https://github.com/langchain-ai/langgraph/blob/main/libs/langgraph/langgraph/graph/state.py",
  );
});


test("selectQuestionFiles prioritizes question-relevant source files", () => {
  const analysis = analyzePreset(SOURCE_ANALYSIS_PRESETS.find((preset) => preset.slug === "langchain-ai/langgraph")!);
  const files = selectQuestionFiles(analysis, "ToolNode 如何执行工具调用？", 3);
  assert.ok(files.some((file) => file.path.endsWith("tool_node.py")));
  assert.equal(files[0]?.layer, "工具");
});

test("answerSourceQuestion returns line citations and explanations from source text", () => {
  const analysis = analyzeRepositoryTree({
    slug: "example/repo",
    defaultBranch: "main",
    items: [
      { path: "src/tools/tool_node.ts", type: "file" },
      { path: "src/runtime/agent.ts", type: "file" },
    ],
    source: "github",
  });

  const answer = answerSourceQuestion({
    analysis,
    question: "工具调用如何执行并返回结果？",
    documents: [
      {
        path: "src/tools/tool_node.ts",
        content: [
          "export class ToolNode {",
          "  async invoke(tool_call: ToolCall) {",
          "    const result = await this.registry.execute(tool_call.name, tool_call.args);",
          "    return new ToolMessage({ tool_call_id: tool_call.id, content: result });",
          "  }",
          "}",
        ].join("\n"),
      },
    ],
    requestedFiles: ["src/tools/tool_node.ts"],
  });

  assert.equal(answer.status, "answered");
  assert.equal(answer.citations[0]?.path, "src/tools/tool_node.ts");
  assert.ok(answer.citations[0]?.startLine === 1);
  assert.ok(answer.citations[0]?.endLine && answer.citations[0].endLine >= 4);
  assert.match(answer.citations[0]?.url ?? "", /#L1-L/);
  assert.match(answer.citations[0]?.explanation ?? "", /tool call/);
});

test("buildGitHubLineUrl anchors exact source lines", () => {
  assert.equal(
    buildGitHubLineUrl("langchain-ai/langgraph", "main", "libs/prebuilt/langgraph/prebuilt/tool_node.py", 10, 18),
    "https://github.com/langchain-ai/langgraph/blob/main/libs/prebuilt/langgraph/prebuilt/tool_node.py#L10-L18",
  );
});
