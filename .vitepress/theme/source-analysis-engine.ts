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

export interface SourceDocument {
  path: string;
  content: string;
}

export interface SourceQuestionCitation {
  path: string;
  startLine: number;
  endLine: number;
  layer: RepositoryLayer;
  score: number;
  matchedTerms: string[];
  excerpt: string;
  explanation: string;
  url: string;
}

export interface SourceQuestionAnswer {
  question: string;
  summary: string;
  citations: SourceQuestionCitation[];
  searchedFiles: string[];
  missingFiles: string[];
  status: "answered" | "no-match" | "needs-source";
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
      area("libs/langchain_v1/langchain/agents", "运行时", 52, 46, 12, 0, "create_agent 装配模型、工具、middleware、structured output", "libs/langchain_v1/langchain/agents/factory.py"),
      area("libs/core/langchain_core/runnables", "运行时", 88, 74, 28, 0, "Runnable 统一 invoke/batch/stream/composition 调用协议", "libs/core/langchain_core/runnables/base.py"),
      area("libs/core/langchain_core/tools", "工具", 62, 50, 18, 0, "工具 schema、调用边界、错误回传", "libs/core/langchain_core/tools/base.py"),
      area("libs/langchain/langchain", "检索", 140, 120, 32, 0, "chains/retrievers/vectorstores 等旧生态 glue code", "libs/langchain/langchain/chains/retrieval.py"),
      area("docs/docs", "文档", 600, 0, 0, 600, "公开 API 使用法和概念解释", "docs/docs/concepts/runnables.mdx"),
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
      area("libs/langgraph/langgraph/graph", "状态", 34, 30, 8, 0, "StateGraph 声明 state schema、node、edge、compile", "libs/langgraph/langgraph/graph/state.py"),
      area("libs/langgraph/langgraph/pregel", "运行时", 56, 50, 18, 0, "super-step 调度、stream、interrupt、checkpoint 写入", "libs/langgraph/langgraph/pregel/main.py"),
      area("libs/langgraph/langgraph/checkpoint", "状态", 42, 36, 14, 0, "thread_id、state history、持久化恢复", "libs/langgraph/langgraph/checkpoint/base/__init__.py"),
      area("libs/prebuilt/langgraph/prebuilt", "工具", 38, 34, 10, 0, "create_react_agent 与 ToolNode 预制图", "libs/prebuilt/langgraph/prebuilt/tool_node.py"),
      area("docs/docs/concepts", "文档", 120, 0, 0, 120, "低层概念、persistence、HITL、多 agent", "docs/docs/concepts/low_level.md"),
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
      area("llama-index-core/llama_index/core/query_engine", "检索", 54, 48, 18, 0, "retriever、postprocessor、synthesizer 串成查询链路", "llama-index-core/llama_index/core/query_engine/retriever_query_engine.py"),
      area("llama-index-core/llama_index/core/indices", "检索", 80, 70, 20, 0, "文档如何变成 nodes/index/retriever", "llama-index-core/llama_index/core/indices/base.py"),
      area("llama-index-core/llama_index/core/response_synthesizers", "运行时", 42, 38, 14, 0, "检索结果如何被合成答案和 source nodes", "llama-index-core/llama_index/core/response_synthesizers/base.py"),
      area("llama-index-core/llama_index/core/workflow", "运行时", 65, 58, 18, 0, "event、step、context、handoff 工作流", "llama-index-core/llama_index/core/workflow/workflow.py"),
      area("llama-index-core/llama_index/core/agent", "工具", 72, 64, 22, 0, "agent workflow、multi-agent handoff、tool 调用", "llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py"),
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

export function buildGitHubLineUrl(slug: string, branch: string, path: string, startLine: number, endLine: number): string {
  const base = buildGitHubFileUrl(slug, branch, path);
  return startLine === endLine ? `${base}#L${startLine}` : `${base}#L${startLine}-L${endLine}`;
}

export function selectQuestionFiles(
  analysis: RepositoryAnalysis,
  question: string,
  limit = 8,
): RepositoryFileRow[] {
  const terms = questionTerms(question);
  const candidates = new Map<string, RepositoryFileRow>();

  for (const file of analysis.keyFiles) {
    candidates.set(file.path, { ...file });
  }

  for (const area of analysis.areas) {
    if (!candidates.has(area.readFirst)) {
      candidates.set(area.readFirst, {
        path: area.readFirst,
        layer: area.layer,
        reason: `${area.area}: ${area.signal}`,
        score: scorePath(area.readFirst),
      });
    }
  }

  return [...candidates.values()]
    .map((candidate) => ({
      ...candidate,
      score:
        candidate.score +
        scoreTextForTerms(`${candidate.path}\n${candidate.layer}\n${candidate.reason}`, terms) +
        layerQuestionBonus(candidate.layer, question),
    }))
    .filter((candidate) => isCodeFile(candidate.path) || isDocsFile(candidate.path) || isConfigFile(candidate.path))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit);
}

export function answerSourceQuestion(options: {
  analysis: RepositoryAnalysis;
  question: string;
  documents: readonly SourceDocument[];
  requestedFiles?: readonly string[];
  maxCitations?: number;
}): SourceQuestionAnswer {
  const question = options.question.trim();
  const requestedFiles = options.requestedFiles ?? options.documents.map((document) => document.path);
  const documents = options.documents.filter((document) => document.content.trim().length > 0);
  const missingFiles = requestedFiles.filter((path) => !documents.some((document) => document.path === path));

  if (!question) {
    return {
      question,
      summary: "先输入源码问题，再检索候选文件。",
      citations: [],
      searchedFiles: documents.map((document) => document.path),
      missingFiles,
      status: "needs-source",
    };
  }

  if (documents.length === 0) {
    return {
      question,
      summary: "还没有可检索的源码内容；需要先读取 GitHub raw 文件。",
      citations: [],
      searchedFiles: [],
      missingFiles,
      status: "needs-source",
    };
  }

  const terms = questionTerms(question);
  const citations = documents
    .flatMap((document) => sourceCitationsForDocument(options.analysis, document, question, terms))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path) || a.startLine - b.startLine)
    .slice(0, options.maxCitations ?? 4)
    .map((citation) => ({
      ...citation,
      url: buildGitHubLineUrl(options.analysis.slug, options.analysis.defaultBranch, citation.path, citation.startLine, citation.endLine),
    }));

  if (citations.length === 0) {
    const fallbackFiles = selectQuestionFiles(options.analysis, question, options.maxCitations ?? 4);
    return {
      question,
      summary: "源码已读取，但问题关键词没有命中具体行；先从候选文件继续下钻。",
      citations: fallbackFiles.map((file) => ({
        path: file.path,
        startLine: 1,
        endLine: 1,
        layer: file.layer,
        score: file.score,
        matchedTerms: [],
        excerpt: "",
        explanation: file.reason,
        url: buildGitHubLineUrl(options.analysis.slug, options.analysis.defaultBranch, file.path, 1, 1),
      })),
      searchedFiles: documents.map((document) => document.path),
      missingFiles,
      status: "no-match",
    };
  }

  const top = citations[0]!;
  const uniquePaths = [...new Set(citations.map((citation) => citation.path))];
  return {
    question,
    summary: `最相关位置是 ${top.path}:${top.startLine}-${top.endLine}。${summaryForQuestion(question, top.layer)} 本次命中 ${uniquePaths.length} 个文件，优先沿这些源码引用继续追调用链。`,
    citations,
    searchedFiles: documents.map((document) => document.path),
    missingFiles,
    status: "answered",
  };
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

function sourceCitationsForDocument(
  analysis: RepositoryAnalysis,
  document: SourceDocument,
  question: string,
  terms: readonly string[],
): Array<Omit<SourceQuestionCitation, "url">> {
  const lines = document.content.split(/\r?\n/);
  const pathLower = document.path.toLowerCase();
  const layer = classifyRepositoryPath(document.path);
  const analysisBoost = analysis.keyFiles.some((file) => file.path === document.path) ? 6 : 0;
  const lineScores = lines
    .map((line, index) => {
      const matchedTerms = matchedLineTerms(`${pathLower}\n${line}`, terms);
      const textScore = scoreTextForTerms(`${pathLower}\n${line}`, terms);
      const declarationBonus = /^\s*(class|def|async\s+def|function|export\s+function|export\s+class|const|interface|type)\b/.test(line)
        ? 8
        : 0;
      const layerBonus = layerQuestionBonus(layer, question);
      return {
        lineNumber: index + 1,
        score: textScore + declarationBonus + layerBonus,
        matchedTerms,
      };
    })
    .filter((item) => item.score > 0);

  const windows: Array<Omit<SourceQuestionCitation, "url">> = [];
  for (const lineScore of lineScores.sort((a, b) => b.score - a.score)) {
    const startLine = Math.max(1, lineScore.lineNumber - 3);
    const endLine = Math.min(lines.length, lineScore.lineNumber + 4);
    const overlaps = windows.some((window) => window.path === document.path && startLine <= window.endLine && endLine >= window.startLine);
    if (overlaps) continue;
    const excerptLines = lines.slice(startLine - 1, endLine);
    const excerpt = excerptLines.map((line, offset) => `${startLine + offset}: ${line}`).join("\n").trimEnd();
    const windowText = `${document.path}\n${excerpt}`;
    const matchedTerms = matchedLineTerms(windowText, terms);
    const score = lineScore.score + analysisBoost + scoreTextForTerms(windowText, terms) + Math.min(20, scorePath(document.path) / 4);
    windows.push({
      path: document.path,
      startLine,
      endLine,
      layer,
      score,
      matchedTerms,
      excerpt,
      explanation: explanationForCitation(layer, question, matchedTerms, document.path),
    });
    if (windows.length >= 3) break;
  }

  return windows.sort((a, b) => b.score - a.score);
}

function questionTerms(question: string): string[] {
  const lower = question.toLowerCase();
  const terms = new Set<string>();
  for (const token of lower.match(/[a-z0-9_.$-]{3,}/g) ?? []) {
    if (!QUESTION_STOP_WORDS.has(token)) terms.add(token);
  }
  for (const [pattern, expansions] of QUESTION_EXPANSIONS) {
    if (pattern.test(question)) {
      for (const expansion of expansions) terms.add(expansion.toLowerCase());
    }
  }
  if (terms.size === 0) {
    for (const token of lower.split(/\s+/).filter((item) => item.length >= 2)) terms.add(token);
  }
  return [...terms];
}

function scoreTextForTerms(text: string, terms: readonly string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!lower.includes(term)) continue;
    score += term.length >= 8 ? 10 : 6;
  }
  return score;
}

function matchedLineTerms(text: string, terms: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term)).slice(0, 8);
}

function layerQuestionBonus(layer: RepositoryLayer, question: string): number {
  if (/工具|tool|function.?call/i.test(question) && layer === "工具") return 18;
  if (/状态|checkpoint|memory|state|持久/i.test(question) && layer === "状态") return 18;
  if (/检索|rag|retriev|query|索引|引用|source/i.test(question) && layer === "检索") return 18;
  if (/运行|循环|runtime|agent|graph|workflow|pregel/i.test(question) && layer === "运行时") return 16;
  if (/入口|api|开始|create|compile/i.test(question) && layer === "入口") return 12;
  return 0;
}

function summaryForQuestion(question: string, layer: RepositoryLayer): string {
  if (/工具|tool|function.?call/i.test(question)) return "这个问题主要看工具调用请求与本地执行边界。";
  if (/状态|checkpoint|memory|持久|恢复/i.test(question)) return "这个问题主要看状态 schema、checkpoint、history 或 reducer。";
  if (/检索|rag|query|引用|source/i.test(question)) return "这个问题主要看 retrieve、postprocess、synthesize 和 source node 回传。";
  if (/循环|runtime|graph|workflow|pregel/i.test(question)) return "这个问题主要看 runtime 如何推进控制流。";
  return `这个问题当前落在 ${layer} 层。`;
}

function explanationForCitation(layer: RepositoryLayer, question: string, matchedTerms: readonly string[], path: string): string {
  const termText = matchedTerms.length > 0 ? `命中 ${matchedTerms.join(", ")}。` : "未命中显式关键词。";
  const base = reasonForPath(path);
  if (/工具|tool|function.?call/i.test(question)) {
    return `${termText} 这段源码可用来确认模型 tool call 到本地工具执行/回传消息的边界。`;
  }
  if (/状态|checkpoint|memory|持久|恢复/i.test(question)) {
    return `${termText} 这段源码可用来确认状态如何被声明、合并、保存或恢复。`;
  }
  if (/检索|rag|query|引用|source/i.test(question)) {
    return `${termText} 这段源码可用来确认查询如何检索材料、合成答案并保留来源。`;
  }
  return `${termText} ${base} 当前职责层：${layer}。`;
}

const QUESTION_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "how",
  "what",
  "where",
  "does",
  "this",
  "that",
  "from",
  "into",
  "为什么",
  "怎么",
  "如何",
]);

const QUESTION_EXPANSIONS: Array<[RegExp, string[]]> = [
  [/工具|调用|tool|function.?call/i, ["tool", "tools", "tool_call", "tool_calls", "tool_node", "toolnode", "toolmessage", "invoke", "call", "execute"]],
  [/状态|checkpoint|恢复|持久|memory|state/i, ["state", "checkpoint", "memory", "store", "history", "channel", "reducer", "resume"]],
  [/检索|索引|引用|rag|query|source/i, ["retriev", "query_engine", "query", "synthesizer", "source", "source_nodes", "index", "nodes"]],
  [/结构化|schema|structured/i, ["structured_output", "schema", "strategy", "response_format", "providerstrategy", "toolstrategy"]],
  [/循环|图|运行|runtime|agent|workflow|pregel/i, ["agent", "runtime", "workflow", "graph", "pregel", "step", "edge", "compile", "invoke", "stream"]],
  [/入口|开始|create|compile|factory/i, ["create_agent", "stategraph", "as_query_engine", "compile", "factory", "main"]],
  [/错误|异常|error|exception/i, ["error", "exception", "handle", "fallback", "raise", "try"]],
];
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

