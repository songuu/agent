export type RepositoryItemType = "file" | "dir";

export interface RepositoryTreeItem {
  path: string;
  type: RepositoryItemType;
  size?: number;
}

export interface RepositoryTarget {
  owner: string;
  repo: string;
  slug: string;
}

export interface RepositoryPreset {
  slug: string;
  name: string;
  description: string;
  defaultBranch: string;
  sourceUrl: string;
  indexedAt: string;
  focus: string;
  files: RepositoryTreeItem[];
  curatedAreas: RepositoryAreaRow[];
  curatedFiles: RepositoryFileRow[];
  readingPath: string[];
}

export interface RepositoryAreaRow {
  area: string;
  layer: RepositoryLayer;
  fileCount: number;
  codeFiles: number;
  testFiles: number;
  docsFiles: number;
  signal: string;
  readFirst: string;
}

export interface RepositoryFileRow {
  path: string;
  layer: RepositoryLayer;
  reason: string;
  score: number;
}

export interface RepositoryLanguageRow {
  language: string;
  files: number;
}

export interface RepositoryStats {
  totalFiles: number;
  totalDirs: number;
  codeFiles: number;
  testFiles: number;
  docsFiles: number;
  configFiles: number;
}

export interface RepositoryAnalysis {
  slug: string;
  name: string;
  description: string;
  defaultBranch: string;
  sourceUrl: string;
  indexedAt: string;
  focus: string;
  stats: RepositoryStats;
  languages: RepositoryLanguageRow[];
  areas: RepositoryAreaRow[];
  keyFiles: RepositoryFileRow[];
  readingPath: string[];
  source: "preset" | "github";
  truncated?: boolean;
}

export type RepositoryLayer =
  | "入口"
  | "运行时"
  | "状态"
  | "工具"
  | "检索"
  | "文档"
  | "测试"
  | "配置"
  | "示例"
  | "通用";

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".mjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".cs",
  ".rb",
  ".php",
  ".swift",
  ".scala",
]);

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mts": "TypeScript",
  ".mjs": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".kt": "Kotlin",
  ".cs": "C#",
  ".rb": "Ruby",
  ".php": "PHP",
  ".swift": "Swift",
  ".scala": "Scala",
  ".md": "Markdown",
  ".mdx": "MDX",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
};

export const SOURCE_ANALYSIS_PRESETS: RepositoryPreset[] = [
  {
    slug: "langchain-ai/langchain",
    name: "LangChain",
    description: "组合式 LLM 应用框架；重点看 agent factory、Runnable、middleware、structured output。",
    defaultBranch: "master",
    sourceUrl: "https://github.com/langchain-ai/langchain",
    indexedAt: "2026-06-29",
    focus: "agent runtime assembly",
    files: [
      file("libs/langchain_v1/langchain/agents/factory.py", 52000),
      file("libs/langchain_v1/langchain/agents/middleware/types.py", 28000),
      file("libs/langchain_v1/langchain/agents/structured_output.py", 30000),
      file("libs/core/langchain_core/runnables/base.py", 120000),
      file("libs/core/langchain_core/tools/base.py", 52000),
      file("libs/core/langchain_core/messages/tool.py", 10000),
      file("libs/langchain/langchain/chains/retrieval.py", 16000),
      file("libs/langchain/langchain/indexes/vectorstore.py", 10000),
      file("libs/langchain/tests/unit_tests/agents/test_factory.py", 26000),
      file("docs/docs/concepts/runnables.mdx", 12000),
      file("pyproject.toml", 9000),
    ],
    curatedAreas: [
      area("libs/langchain_v1/langchain/agents", "运行时", 52, 46, 12, 0, "create_agent 装配模型、工具、middleware、structured output", "factory.py"),
      area("libs/core/langchain_core/runnables", "运行时", 88, 74, 28, 0, "Runnable 统一 invoke/batch/stream/composition 调用协议", "base.py"),
      area("libs/core/langchain_core/tools", "工具", 62, 50, 18, 0, "工具 schema、调用边界、错误回传", "base.py"),
      area("libs/langchain/langchain", "检索", 140, 120, 32, 0, "chains/retrievers/vectorstores 等旧生态 glue code", "retrieval.py"),
      area("docs/docs", "文档", 600, 0, 0, 600, "公开 API 使用法和概念解释", "concepts/runnables.mdx"),
    ],
    curatedFiles: [
      key("libs/langchain_v1/langchain/agents/factory.py", "运行时", "create_agent 主入口，追参数如何变成可调用 runtime", 100),
      key("libs/core/langchain_core/runnables/base.py", "运行时", "Runnable 协议定义 invoke/batch/stream 和 composition", 96),
      key("libs/langchain_v1/langchain/agents/structured_output.py", "运行时", "provider strategy 与 tool strategy 的 structured output 分流", 88),
      key("libs/core/langchain_core/tools/base.py", "工具", "工具定义、schema、调用异常的核心边界", 82),
      key("libs/langchain_v1/langchain/agents/middleware/types.py", "状态", "middleware 生命周期扩展点，适合接 trace、budget、权限", 78),
    ],
    readingPath: [
      "先读 factory.py：找 create_agent 如何规范化 model/tools/response_format。",
      "再读 Runnable base.py：确认所有组件为何都能 invoke/stream。",
      "追 tool base.py：把模型 tool call 和本地副作用边界分开。",
      "最后读 structured_output.py 和 middleware/types.py：看迁移模型、插治理逻辑时的稳定边界。",
    ],
  },
  {
    slug: "langchain-ai/langgraph",
    name: "LangGraph",
    description: "显式状态图运行时；重点看 StateGraph、Pregel super-step、ToolNode、checkpoint。",
    defaultBranch: "main",
    sourceUrl: "https://github.com/langchain-ai/langgraph",
    indexedAt: "2026-06-29",
    focus: "durable graph runtime",
    files: [
      file("libs/langgraph/langgraph/graph/state.py", 74000),
      file("libs/langgraph/langgraph/pregel/main.py", 140000),
      file("libs/langgraph/langgraph/channels/binop.py", 12000),
      file("libs/langgraph/langgraph/checkpoint/base/__init__.py", 38000),
      file("libs/prebuilt/langgraph/prebuilt/chat_agent_executor.py", 68000),
      file("libs/prebuilt/langgraph/prebuilt/tool_node.py", 62000),
      file("libs/langgraph/langgraph/types.py", 42000),
      file("libs/langgraph/tests/test_pregel.py", 90000),
      file("docs/docs/concepts/low_level.md", 18000),
      file("pyproject.toml", 8000),
    ],
    curatedAreas: [
      area("libs/langgraph/langgraph/graph", "状态", 34, 30, 8, 0, "StateGraph 声明 state schema、node、edge、compile", "state.py"),
      area("libs/langgraph/langgraph/pregel", "运行时", 56, 50, 18, 0, "super-step 调度、stream、interrupt、checkpoint 写入", "main.py"),
      area("libs/langgraph/langgraph/checkpoint", "状态", 42, 36, 14, 0, "thread_id、state history、持久化恢复", "base/__init__.py"),
      area("libs/prebuilt/langgraph/prebuilt", "工具", 38, 34, 10, 0, "create_react_agent 与 ToolNode 预制图", "tool_node.py"),
      area("docs/docs/concepts", "文档", 120, 0, 0, 120, "低层概念、persistence、HITL、多 agent", "low_level.md"),
    ],
    curatedFiles: [
      key("libs/langgraph/langgraph/graph/state.py", "状态", "StateGraph 声明层：schema、channel、node、edge、compile", 100),
      key("libs/langgraph/langgraph/pregel/main.py", "运行时", "编译后图的执行层：super-step、stream、checkpoint", 98),
      key("libs/prebuilt/langgraph/prebuilt/tool_node.py", "工具", "读取 tool_calls、执行工具、写回 ToolMessage", 90),
      key("libs/prebuilt/langgraph/prebuilt/chat_agent_executor.py", "运行时", "create_react_agent 如何把模型节点和工具节点接成循环", 86),
      key("libs/langgraph/langgraph/checkpoint/base/__init__.py", "状态", "持久化 checkpoint 接口和 state history 边界", 82),
    ],
    readingPath: [
      "先读 state.py：把声明层和执行层分开。",
      "再读 pregel/main.py：看 super-step 如何推进图。",
      "追 ToolNode：确认工具执行不是模型执行。",
      "最后读 checkpoint/base：看 thread_id、history、resume 这些生产能力如何落地。",
    ],
  },
  {
    slug: "run-llama/llama_index",
    name: "LlamaIndex",
    description: "data-first RAG/agent 框架；重点看 QueryEngine、Retriever、ResponseSynthesizer、Workflow。",
    defaultBranch: "main",
    sourceUrl: "https://github.com/run-llama/llama_index",
    indexedAt: "2026-06-29",
    focus: "data-first RAG runtime",
    files: [
      file("llama-index-core/llama_index/core/query_engine/retriever_query_engine.py", 22000),
      file("llama-index-core/llama_index/core/retrievers.py", 26000),
      file("llama-index-core/llama_index/core/response_synthesizers/base.py", 24000),
      file("llama-index-core/llama_index/core/indices/base.py", 26000),
      file("llama-index-core/llama_index/core/workflow/workflow.py", 46000),
      file("llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py", 56000),
      file("llama-index-core/llama_index/core/tools/query_engine.py", 18000),
      file("llama-index-core/tests/query_engine/test_retriever_query_engine.py", 18000),
      file("docs/docs/understanding/querying/querying.md", 14000),
      file("pyproject.toml", 9000),
    ],
    curatedAreas: [
      area("llama-index-core/llama_index/core/query_engine", "检索", 54, 48, 18, 0, "retriever、postprocessor、synthesizer 串成查询链路", "retriever_query_engine.py"),
      area("llama-index-core/llama_index/core/indices", "检索", 80, 70, 20, 0, "文档如何变成 nodes/index/retriever", "base.py"),
      area("llama-index-core/llama_index/core/response_synthesizers", "运行时", 42, 38, 14, 0, "检索结果如何被合成答案和 source nodes", "base.py"),
      area("llama-index-core/llama_index/core/workflow", "运行时", 65, 58, 18, 0, "event、step、context、handoff 工作流", "workflow.py"),
      area("llama-index-core/llama_index/core/agent", "工具", 72, 64, 22, 0, "agent workflow、multi-agent handoff、tool 调用", "multi_agent_workflow.py"),
    ],
    curatedFiles: [
      key("llama-index-core/llama_index/core/query_engine/retriever_query_engine.py", "检索", "QueryEngine 主线：retrieve -> postprocess -> synthesize", 100),
      key("llama-index-core/llama_index/core/retrievers.py", "检索", "retriever 抽象，定义 query 到 nodes 的边界", 88),
      key("llama-index-core/llama_index/core/response_synthesizers/base.py", "运行时", "把 nodes 合成 response/source_nodes 的边界", 84),
      key("llama-index-core/llama_index/core/workflow/workflow.py", "运行时", "step/event/context 的 workflow runtime", 82),
      key("llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py", "工具", "多 agent handoff 和 tool 组织方式", 80),
    ],
    readingPath: [
      "先读 retriever_query_engine.py：主线最短，能看懂 LlamaIndex 的 data-first 边界。",
      "再读 retrievers.py 和 indices/base.py：确认数据如何进入可检索结构。",
      "追 response_synthesizers/base.py：看引用和答案合成在哪里发生。",
      "最后读 workflow.py / multi_agent_workflow.py：把 RAG query engine 接进 agent 控制流。",
    ],
  },
];

export function normalizeRepositoryInput(input: string): RepositoryTarget | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withoutGit = trimmed.replace(/\.git$/i, "");
  const githubMatch = withoutGit.match(/github\.com[/:]([^/\s]+)\/([^/\s?#]+)/i);
  const slug = githubMatch ? `${githubMatch[1]}/${githubMatch[2]}` : withoutGit.replace(/^https?:\/\//i, "");
  const parts = slug.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = cleanSlugPart(parts[0]!);
  const repo = cleanSlugPart(parts[1]!);
  if (!owner || !repo) return null;
  return { owner, repo, slug: `${owner}/${repo}` };
}

export function presetForSlug(slug: string): RepositoryPreset | undefined {
  return SOURCE_ANALYSIS_PRESETS.find((preset) => preset.slug.toLowerCase() === slug.toLowerCase());
}

export function analyzePreset(preset: RepositoryPreset): RepositoryAnalysis {
  const derived = analyzeRepositoryTree({
    slug: preset.slug,
    name: preset.name,
    description: preset.description,
    defaultBranch: preset.defaultBranch,
    sourceUrl: preset.sourceUrl,
    indexedAt: preset.indexedAt,
    focus: preset.focus,
    items: preset.files,
    source: "preset",
  });
  return {
    ...derived,
    areas: preset.curatedAreas,
    keyFiles: preset.curatedFiles,
    readingPath: preset.readingPath,
  };
}

export function analyzeRepositoryTree(options: {
  slug: string;
  name?: string;
  description?: string;
  defaultBranch?: string;
  sourceUrl?: string;
  indexedAt?: string;
  focus?: string;
  items: readonly RepositoryTreeItem[];
  source: "preset" | "github";
  truncated?: boolean;
}): RepositoryAnalysis {
  const files = options.items.filter((item) => item.type === "file");
  const dirs = new Set<string>();
  for (const item of options.items) {
    const segments = item.path.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      dirs.add(segments.slice(0, index).join("/"));
    }
  }

  return {
    slug: options.slug,
    name: options.name ?? options.slug,
    description: options.description ?? "公开 GitHub 仓库源码矩阵",
    defaultBranch: options.defaultBranch ?? "main",
    sourceUrl: options.sourceUrl ?? `https://github.com/${options.slug}`,
    indexedAt: options.indexedAt ?? new Date().toISOString().slice(0, 10),
    focus: options.focus ?? inferRepositoryFocus(files.map((file) => file.path)),
    stats: {
      totalFiles: files.length,
      totalDirs: dirs.size,
      codeFiles: files.filter((file) => isCodeFile(file.path)).length,
      testFiles: files.filter((file) => isTestFile(file.path)).length,
      docsFiles: files.filter((file) => isDocsFile(file.path)).length,
      configFiles: files.filter((file) => isConfigFile(file.path)).length,
    },
    languages: languageRows(files.map((file) => file.path)),
    areas: buildAreaRows(files),
    keyFiles: pickKeyFiles(files),
    readingPath: buildReadingPath(files.map((file) => file.path)),
    source: options.source,
    truncated: options.truncated,
  };
}

export function buildGitHubFileUrl(slug: string, branch: string, path: string): string {
  return `https://github.com/${slug}/blob/${branch}/${path}`;
}

export function classifyRepositoryPath(path: string): RepositoryLayer {
  const lower = path.toLowerCase();
  if (isDocsFile(lower)) return "文档";
  if (isTestFile(lower)) return "测试";
  if (isConfigFile(lower)) return "配置";
  if (/(^|\/)(example|examples|demo|demos|sample|samples)(\/|$)/.test(lower)) return "示例";
  if (/(tool|tools|function_call|function-call|tool_node|toolnode|middleware)/.test(lower)) return "工具";
  if (/(retriev|query_engine|query-engine|index|indices|vector|rag|synthesizer|embedding)/.test(lower)) return "检索";
  if (/(state|memory|checkpoint|store|schema|channel|reducer|history)/.test(lower)) return "状态";
  if (/(agent|agents|workflow|graph|pregel|runtime|executor|runnable|chain|orchestrat)/.test(lower)) return "运行时";
  if (/(^|\/)(cli|server|api|app|main|index)\./.test(lower)) return "入口";
  return "通用";
}

function buildAreaRows(files: readonly RepositoryTreeItem[]): RepositoryAreaRow[] {
  const groups = new Map<string, RepositoryTreeItem[]>();
  for (const file of files) {
    const areaName = areaForPath(file.path);
    const current = groups.get(areaName) ?? [];
    current.push(file);
    groups.set(areaName, current);
  }

  return [...groups.entries()]
    .map(([areaName, areaFiles]) => {
      const layerCounts = new Map<RepositoryLayer, number>();
      for (const file of areaFiles) {
        const layer = classifyRepositoryPath(file.path);
        layerCounts.set(layer, (layerCounts.get(layer) ?? 0) + 1);
      }
      const layer = [...layerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "通用";
      const first = pickKeyFiles(areaFiles, 1)[0]?.path ?? areaFiles[0]?.path ?? areaName;
      return {
        area: areaName,
        layer,
        fileCount: areaFiles.length,
        codeFiles: areaFiles.filter((file) => isCodeFile(file.path)).length,
        testFiles: areaFiles.filter((file) => isTestFile(file.path)).length,
        docsFiles: areaFiles.filter((file) => isDocsFile(file.path)).length,
        signal: signalForLayer(layer),
        readFirst: first,
      };
    })
    .filter((row) => row.fileCount >= 2 || row.codeFiles > 0)
    .sort((a, b) => b.codeFiles + b.testFiles + b.docsFiles - (a.codeFiles + a.testFiles + a.docsFiles))
    .slice(0, 12);
}

function pickKeyFiles(files: readonly RepositoryTreeItem[], limit = 12): RepositoryFileRow[] {
  return files
    .map((file) => ({
      path: file.path,
      layer: classifyRepositoryPath(file.path),
      reason: reasonForPath(file.path),
      score: scorePath(file.path),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit);
}

function buildReadingPath(paths: readonly string[]): string[] {
  const keyFiles = pickKeyFiles(paths.map((path) => file(path)), 5);
  if (keyFiles.length === 0) {
    return [
      "先看 README / docs，确认项目目标和公开 API。",
      "再看 package/pyproject/go.mod 等配置，确认包边界和入口。",
      "最后从 src/lib/core 进入运行时，沿测试文件反推真实行为。",
    ];
  }
  return keyFiles.map((item, index) => `${index + 1}. ${item.path}：${item.reason}`);
}

function languageRows(paths: readonly string[]): RepositoryLanguageRow[] {
  const counts = new Map<string, number>();
  for (const path of paths) {
    const language = LANGUAGE_BY_EXTENSION[extensionOf(path)];
    if (!language) continue;
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([language, files]) => ({ language, files }))
    .sort((a, b) => b.files - a.files)
    .slice(0, 8);
}

function inferRepositoryFocus(paths: readonly string[]): string {
  const text = paths.join("\n").toLowerCase();
  if (/query_engine|retriev|rag|embedding|vector/.test(text)) return "data and retrieval runtime";
  if (/graph|pregel|checkpoint|workflow/.test(text)) return "stateful graph runtime";
  if (/agent|tool|runnable|middleware/.test(text)) return "agent and tool runtime";
  if (/server|api|route/.test(text)) return "application service";
  return "repository structure";
}

function scorePath(path: string): number {
  const lower = path.toLowerCase();
  let score = 0;
  if (/(^|\/)(readme|package|pyproject|go\.mod|cargo\.toml|pom\.xml)/.test(lower)) score += 35;
  if (/(agent|agents|factory|runtime|graph|pregel|workflow|runnable)/.test(lower)) score += 35;
  if (/(tool|tools|middleware|structured_output|function_call)/.test(lower)) score += 24;
  if (/(retriev|query_engine|index|vector|rag|synthesizer|embedding)/.test(lower)) score += 24;
  if (/(state|checkpoint|memory|channel|reducer|store)/.test(lower)) score += 20;
  if (isTestFile(lower)) score += 10;
  if (isDocsFile(lower)) score += 8;
  score += Math.max(0, 12 - lower.split("/").length * 2);
  if (!isCodeFile(lower) && !isDocsFile(lower) && !isConfigFile(lower)) score -= 20;
  return score;
}

function reasonForPath(path: string): string {
  const layer = classifyRepositoryPath(path);
  switch (layer) {
    case "运行时":
      return "运行时/编排入口，优先追调用链。";
    case "状态":
      return "状态、checkpoint、schema 或 reducer 边界。";
    case "工具":
      return "工具调用、middleware 或副作用边界。";
    case "检索":
      return "检索、索引、query engine 或 response synthesis 主线。";
    case "测试":
      return "测试能反推出真实契约和边界条件。";
    case "文档":
      return "公开 API 和概念说明，先建立使用侧心智模型。";
    case "配置":
      return "包边界、构建入口、依赖和 monorepo 结构。";
    case "示例":
      return "最短可运行路径，适合对照源码入口。";
    case "入口":
      return "CLI/API/app 入口，适合从用户动作往内追。";
    default:
      return "高信号源码文件，适合纳入首轮扫描。";
  }
}

function signalForLayer(layer: RepositoryLayer): string {
  switch (layer) {
    case "运行时":
      return "找 invoke/stream/run/compile/execute。";
    case "状态":
      return "找 schema/reducer/checkpoint/history。";
    case "工具":
      return "找 schema 校验、tool call、错误回传。";
    case "检索":
      return "找 retrieve/postprocess/synthesize。";
    case "测试":
      return "从断言反推契约。";
    case "文档":
      return "先建立 API 心智模型。";
    case "配置":
      return "确认包边界和入口。";
    case "示例":
      return "用最短样例跑通调用链。";
    case "入口":
      return "从用户入口追到核心 runtime。";
    default:
      return "按命名和引用继续下钻。";
  }
}

function areaForPath(path: string): string {
  const parts = path.split("/");
  if (parts.length >= 3 && ["libs", "packages", "apps", "crates"].includes(parts[0]!)) {
    return `${parts[0]}/${parts[1]}`;
  }
  if (parts.length >= 3 && parts[0] === "llama-index-core") return `${parts[0]}/${parts[1]}/${parts[2]}`;
  if (parts.length >= 2) return parts[0]!;
  return "(root)";
}

function isCodeFile(path: string): boolean {
  return SOURCE_EXTENSIONS.has(extensionOf(path));
}

function isTestFile(path: string): boolean {
  return /(^|\/)(__tests__|tests?|test|spec)(\/|\.|$)|(\.|-)(test|spec)\.[a-z0-9]+$/i.test(path);
}

function isDocsFile(path: string): boolean {
  return /(^|\/)(docs?|documentation|website)(\/|$)|readme\.|\.mdx?$/i.test(path);
}

function isConfigFile(path: string): boolean {
  return /(^|\/)(package\.json|pyproject\.toml|go\.mod|cargo\.toml|pom\.xml|build\.gradle|requirements.*\.txt|setup\.py|tsconfig.*\.json|vite\.config|next\.config|ruff\.toml|eslint|biome|\.github\/)/i.test(path);
}

function extensionOf(path: string): string {
  const match = path.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

function cleanSlugPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "");
}

function file(path: string, size = 0): RepositoryTreeItem {
  return { path, type: "file", size };
}

function area(
  areaName: string,
  layer: RepositoryLayer,
  fileCount: number,
  codeFiles: number,
  testFiles: number,
  docsFiles: number,
  signal: string,
  readFirst: string,
): RepositoryAreaRow {
  return { area: areaName, layer, fileCount, codeFiles, testFiles, docsFiles, signal, readFirst };
}

function key(path: string, layer: RepositoryLayer, reason: string, score: number): RepositoryFileRow {
  return { path, layer, reason, score };
}

