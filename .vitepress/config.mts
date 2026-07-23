import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
// @ts-ignore markdown-it-task-lists has no bundled types; VitePress loads this config through esbuild.
import taskLists from "markdown-it-task-lists";
import { CHAPTERS, type Chapter } from "../knowledge-graph/data/graph";
import { CONTEXTUAL_SIDEBAR, PRIMARY_NAVIGATION } from "./site-information-architecture";
import {
  CONCEPT_VISUALS,
  renderConceptVisualHtml,
  type ConceptVisual,
} from "../knowledge-graph/data/visuals";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(__dirname, "../.env") });

const GITHUB_REPO = "https://github.com/songuu/agent";
const GITHUB_BLOB = `${GITHUB_REPO}/blob/master/`;
const CODE_LINK_RE = /\.(ts|tsx|mts|cts|js|mjs|json|example|yml|yaml)$/i;

const KG_HTML_ROUTE = "/knowledge-graph/output/index.html";
const KG_HTML_FILE = resolve(__dirname, "../knowledge-graph/output/index.html");
const DEMO_RUNNER_CACHE_FILE = resolve(__dirname, "cache/demo-runner.json");
const DEFAULT_DEMO_RUNNER_PORT = 5174;

function normalizeBase(value: string | undefined): string {
  if (!value || value.trim() === "" || value === "/") return "/";
  const trimmed = value.trim();
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

interface DemoMarker {
  id: string;
  title: string;
  needsKey: "none" | "llm" | "embedding";
}

interface DemoRunnerRuntime {
  token: string;
  port: number;
}

interface FrontierSupabaseConfig {
  url: string;
  anonKey: string;
  schema: string;
}

function resolveRepoPath(fromMdRelativePath: string, href: string): string {
  const segments = fromMdRelativePath.split("/").slice(0, -1);
  for (const part of href.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return segments.join("/");
}

function buildDemoMarkers(chapters: readonly Chapter[] = CHAPTERS): Map<string, DemoMarker> {
  const markers = new Map<string, DemoMarker>();
  for (const chapter of chapters) {
    if (!chapter.demo) continue;
    if (chapter.demo.interactive || chapter.demo.needsServer) continue;
    const marker = {
      id: chapter.id,
      title: chapter.title,
      needsKey: chapter.demo.needsKey ?? "llm",
    };
    markers.set(`${chapter.dir}/README.md`, marker);
    markers.set(`${chapter.dir}/index.md`, marker);
  }
  return markers;
}

function buildConceptVisualMarkers(
  chapters: readonly Chapter[] = CHAPTERS,
  visuals: readonly ConceptVisual[] = CONCEPT_VISUALS,
): Map<string, ConceptVisual> {
  const chaptersById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const markers = new Map<string, ConceptVisual>();
  for (const visual of visuals) {
    const chapter = chaptersById.get(visual.chapter);
    if (!chapter) continue;
    markers.set(`${chapter.dir}/README.md`, visual);
    markers.set(`${chapter.dir}/index.md`, visual);
  }
  return markers;
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function readDemoRunnerRuntime(): DemoRunnerRuntime {
  if (!existsSync(DEMO_RUNNER_CACHE_FILE)) {
    return { token: "", port: DEFAULT_DEMO_RUNNER_PORT };
  }
  try {
    const payload = JSON.parse(readFileSync(DEMO_RUNNER_CACHE_FILE, "utf8")) as {
      token?: unknown;
      port?: unknown;
    };
    return {
      token: typeof payload.token === "string" ? payload.token : "",
      port: typeof payload.port === "number" ? payload.port : DEFAULT_DEMO_RUNNER_PORT,
    };
  } catch {
    return { token: "", port: DEFAULT_DEMO_RUNNER_PORT };
  }
}

function readFrontierSupabaseConfig(): FrontierSupabaseConfig | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) return null;
  return {
    url,
    anonKey,
    schema: (process.env.SUPABASE_SCHEMA || "public").trim() || "public",
  };
}

function serveKgHtmlPlugin() {
  return {
    name: "serve-kg-interactive-html",
    configureServer(server: any) {
      server.middlewares.use(KG_HTML_ROUTE, (_req: unknown, res: any) => {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(
          existsSync(KG_HTML_FILE)
            ? readFileSync(KG_HTML_FILE, "utf8")
            : "请先运行 npm run kg 生成交互式图谱。",
        );
      });
    },
  };
}

const demoMarkers = buildDemoMarkers();
const conceptVisualMarkers = buildConceptVisualMarkers();
const shouldInjectDemoRunnerToken = process.env.npm_lifecycle_event === "site:dev";
const shouldEnableProductionDemoRunner = process.env.DEMO_RUNNER_CLIENT_ENABLED === "1";
const demoRunnerRuntime = shouldInjectDemoRunnerToken
  ? readDemoRunnerRuntime()
  : { token: "", port: DEFAULT_DEMO_RUNNER_PORT };
const demoRunnerBaseUrl =
  process.env.DEMO_RUNNER_BASE_URL?.trim() ||
  `http://127.0.0.1:${demoRunnerRuntime.port}`;
const demoRunnerClientEnabled = shouldInjectDemoRunnerToken || shouldEnableProductionDemoRunner;
const siteBase = normalizeBase(process.env.VITEPRESS_BASE);
const frontierSupabaseConfig = readFrontierSupabaseConfig();

export default withMermaid(
  defineConfig({
    base: siteBase,
    lang: "zh-CN",
    title: "Agent 工程知识门户",
    description: "学 Agent、做项目、追前沿的一站式工程知识门户：从底层原理、源码解析到真实项目与每日技术情报。",
    srcDir: ".",
    srcExclude: [
      "docs/plans/**",
      "docs/DEPLOYMENT.md",
      "README.md",
      "news-collector/**",
      "**/node_modules/**",
    ],
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: true,
    rewrites: {
      "lessons/:lesson/README.md": "lessons/:lesson/index.md",
      "agent-basics/README.md": "agent-basics/index.md",
      "rag-advanced/:topic/README.md": "rag-advanced/:topic/index.md",
      "langgraph-advanced/README.md": "langgraph-advanced/index.md",
      "langgraph-advanced/:topic/README.md": "langgraph-advanced/:topic/index.md",
      "source-analysis/README.md": "source-analysis/index.md",
      "capstone/README.md": "capstone/index.md",
      "capstone/:project/README.md": "capstone/:project/index.md",
      "knowledge-graph/README.md": "knowledge-graph/index.md",
    },

    markdown: {
      theme: { light: "github-light", dark: "github-dark" },
      config(md) {
        md.use(taskLists, { enabled: false });

        md.core.ruler.push("normalize-relative-links", (state) => {
          const rel = String((state.env as { relativePath?: string })?.relativePath ?? "");
          if (!rel) return;
          for (const block of state.tokens) {
            if (block.type !== "inline" || !block.children) continue;
            for (const token of block.children) {
              if (token.type !== "link_open") continue;
              const href = token.attrGet("href");
              if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("/")) continue;
              const hashIdx = href.indexOf("#");
              const clean = hashIdx === -1 ? href : href.slice(0, hashIdx);
              const hash = hashIdx === -1 ? "" : href.slice(hashIdx);
              if (clean === "") continue;

              if (CODE_LINK_RE.test(clean)) {
                const repoPath = resolveRepoPath(rel, clean);
                if (repoPath.startsWith("knowledge-graph/output/")) continue;
                token.attrSet("href", GITHUB_BLOB + repoPath);
                token.attrSet("target", "_blank");
                token.attrSet("rel", "noreferrer");
                continue;
              }
              if (/(^|\/)README\.md$/i.test(clean)) {
                token.attrSet("href", clean.replace(/README\.md$/i, "") + hash);
                continue;
              }
              if (/\.md$/i.test(clean)) {
                token.attrSet("href", clean.replace(/\.md$/i, "") + hash);
              }
            }
          }
        });

        md.core.ruler.push("inject-demo-runner", (state) => {
          const rel = String((state.env as { relativePath?: string })?.relativePath ?? "");
          const marker = demoMarkers.get(rel);
          if (!marker) return;
          const fenceIndex = state.tokens.findIndex((token) => token.type === "fence");
          if (fenceIndex === -1) return;

          const html = [
            "<div",
            " data-demo-runner",
            ` data-demo-id="${escapeHtmlAttribute(marker.id)}"`,
            ` data-demo-title="${escapeHtmlAttribute(marker.title)}"`,
            ` data-needs-key="${marker.needsKey}"`,
            "></div>",
          ].join("");
          const token = new state.Token("html_block", "", 0);
          token.content = `${html}\n`;
          state.tokens.splice(fenceIndex + 1, 0, token);
        });

        md.core.ruler.push("inject-concept-visual", (state) => {
          const rel = String((state.env as { relativePath?: string })?.relativePath ?? "");
          const visual = conceptVisualMarkers.get(rel);
          if (!visual) return;
          const fenceIndex = state.tokens.findIndex((token) => token.type === "fence");
          if (fenceIndex === -1) return;

          const token = new state.Token("html_block", "", 0);
          token.content = `${renderConceptVisualHtml(visual)}\n`;
          state.tokens.splice(fenceIndex + 1, 0, token);
        });
      },
    },

    vite: {
      define: {
        __DEMO_RUNNER_TOKEN__: JSON.stringify(demoRunnerRuntime.token),
        __DEMO_RUNNER_BASE_URL__: JSON.stringify(demoRunnerBaseUrl),
        __DEMO_RUNNER_CLIENT_ENABLED__: JSON.stringify(demoRunnerClientEnabled),
        __FRONTIER_SUPABASE_CONFIG__: JSON.stringify(frontierSupabaseConfig),
      },
      plugins: [serveKgHtmlPlugin()],
      optimizeDeps: {
        include: ["@xterm/xterm", "@xterm/addon-fit"],
        exclude: [
          "dotenv",
          "openai",
          "@anthropic-ai/sdk",
          "@ai-sdk/anthropic",
          "ai",
          "zod-to-json-schema",
          "@langchain/langgraph",
          "@langchain/core",
          "@langchain/anthropic",
        ],
      },
    },

    async buildEnd(siteConfig) {
      if (!existsSync(KG_HTML_FILE)) return;
      const dest = resolve(siteConfig.outDir, "knowledge-graph/output/index.html");
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(KG_HTML_FILE, dest);
    },

    themeConfig: {
      siteTitle: "Agent 工程知识门户",
      nav: PRIMARY_NAVIGATION,
      sidebar: CONTEXTUAL_SIDEBAR,
      outline: { level: [2, 3], label: "本页目录" },
      socialLinks: [{ icon: "github", link: GITHUB_REPO }],
      search: {
        provider: "local",
        options: {
          translations: {
            button: { buttonText: "搜索全站", buttonAriaLabel: "搜索全站" },
            modal: {
              noResultsText: "没有找到相关内容",
              resetButtonTitle: "清空",
              footer: { selectText: "选择", navigateText: "切换", closeText: "关闭" },
            },
          },
        },
      },
      docFooter: { prev: "上一篇", next: "下一篇" },
      lastUpdatedText: "最后更新",
      darkModeSwitchLabel: "外观",
      sidebarMenuLabel: "目录",
      returnToTopLabel: "回到顶部",
      footer: {
        message: "从零手写 → 再上框架 → 进阶 RAG → 可部署服务",
        copyright: "MIT © songuu",
      },
    },

    mermaid: {
      maxTextSize: 200000,
      maxEdges: 1000,
      // 不设 theme：让 vitepress-plugin-mermaid 按明暗模式自适应（写死会破坏暗色）。
      // 只调字号/字体/间距，配合 diagram-zoom 的适配，保证默认视图文字可读。
      fontFamily:
        '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif',
      themeVariables: {
        fontSize: "16px",
      },
      flowchart: {
        // 本征尺寸渲染：交给 diagram-zoom 适配，避免 useMaxWidth 把整图（含文字）压扁。
        useMaxWidth: false,
        htmlLabels: true,
        nodeSpacing: 44,
        rankSpacing: 62,
        padding: 14,
        curve: "basis",
      },
    },
  }),
);
