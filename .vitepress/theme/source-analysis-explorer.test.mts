import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SOURCE_ANALYSIS_PRESETS,
  analyzePreset,
  analyzeRepositoryTree,
  buildGitHubFileUrl,
  classifyRepositoryPath,
  normalizeRepositoryInput,
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

