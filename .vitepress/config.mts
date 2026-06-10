/**
 * 课程站点配置（VitePress）。
 *
 * 设计原则（与仓库其他子系统一致）：
 *  1. 数据驱动：侧边栏课程目录直接 import knowledge-graph/data/graph.ts 的 CHAPTERS——
 *     新增章节只要进 CHAPTERS（跑 npm run kg 的同一份数据源），站点目录自动更新，零手改。
 *  2. 课程 Markdown 零改动：站点只“消费”现有 README/docs，不要求任何正文迁移。
 *  3. 干净 URL：rewrites 把 <dir>/README.md 映射成 <dir>/index.md，配 cleanUrls
 *     得到 /lessons/01-what-is-an-agent/ 这样的路径；VitePress 会按 rewrites 解析相对链接。
 *
 * 运行：pnpm site:dev（开发）/ pnpm site:build（构建到 .vitepress/dist）/ pnpm site:preview
 */
import { defineConfig, type DefaultTheme } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
// @ts-ignore 该插件无类型声明；config 由 VitePress 用 esbuild 打包，运行无碍
import taskLists from "markdown-it-task-lists";
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAPTERS } from "../knowledge-graph/data/graph";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 源码链接的跳转目标：站点不发布 .ts 文件，相对源码链接统一指向 GitHub。 */
const GITHUB_REPO = "https://github.com/songuu/agent";
const GITHUB_BLOB = `${GITHUB_REPO}/blob/master/`;
/** 这些扩展名的相对链接会被转成 GitHub 链接（md 由站点自己渲染，不在此列）。 */
const CODE_LINK_RE = /\.(ts|tsx|mts|cts|js|mjs|json|example|yml|yaml)$/i;

/** 把「某 md 文件内的相对链接」解析成仓库内路径（posix 风格）。 */
function resolveRepoPath(fromMdRelativePath: string, href: string): string {
  const segments = fromMdRelativePath.split("/").slice(0, -1);
  for (const part of href.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return segments.join("/");
}

// ── 侧边栏：由 CHAPTERS 数据驱动 ────────────────────────────────────────────

/** 进阶 RAG 专题用 R1..R6 展示编号；lessons 用自身两位编号；毕设用 🎓。 */
function chapterText(part: string, idxInPart: number, id: string, title: string): string {
  if (id === "capstone") return `🎓 ${title.replace(/^毕业项目 · /, "")}`;
  if (part === "进阶 RAG 专题") return `R${idxInPart + 1} ${title}`;
  return `${id} ${title}`;
}

function buildCourseSidebar(): DefaultTheme.SidebarItem[] {
  const parts = [...new Set(CHAPTERS.map((c) => c.part))];
  return parts.map((part) => {
    const chapters = CHAPTERS.filter((c) => c.part === part);
    return {
      text: part,
      collapsed: part !== parts[0],
      items: chapters.map((c, i) => ({
        text: chapterText(part, i, c.id, c.title),
        link: `/${c.dir}/`,
      })),
    };
  });
}

const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: "开始",
    items: [
      { text: "00 环境搭建", link: "/docs/setup" },
      { text: "全局课程导航", link: "/docs/navigation" },
      { text: "完整教学大纲", link: "/docs/curriculum" },
      { text: "术语表", link: "/docs/glossary" },
    ],
  },
  ...buildCourseSidebar(),
  {
    text: "知识图谱",
    collapsed: true,
    items: [
      { text: "全局知识图谱", link: "/docs/knowledge-graph" },
      { text: "交互式图谱（动图）", link: "/knowledge-graph/output/index.html", target: "_blank" },
      { text: "图谱扩展指南", link: "/knowledge-graph/" },
    ],
  },
  {
    text: "学完之后",
    collapsed: true,
    items: [
      { text: "💼 求职指南", link: "/docs/career-guide" },
      { text: "🚀 创业指南", link: "/docs/startup-guide" },
      { text: "📚 RAG 系统实战项目", link: "/docs/rag-system-project" },
    ],
  },
];

// ── 交互式知识图谱 HTML：dev 中间件直出 + build 后拷贝进 dist ────────────────

const KG_HTML_ROUTE = "/knowledge-graph/output/index.html";
const KG_HTML_FILE = resolve(__dirname, "../knowledge-graph/output/index.html");

/** dev 下 srcDir 里的非 md 静态文件不会被自动伺服，这个小中间件补上交互图谱这一个。 */
function serveKgHtmlPlugin() {
  return {
    name: "serve-kg-interactive-html",
    configureServer(server: { middlewares: { use: (route: string, fn: (req: unknown, res: { setHeader: (k: string, v: string) => void; end: (s: string) => void }) => void) => void } }) {
      server.middlewares.use(KG_HTML_ROUTE, (_req, res) => {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(existsSync(KG_HTML_FILE) ? readFileSync(KG_HTML_FILE, "utf8") : "请先运行 npm run kg 生成交互式图谱。");
      });
    },
  };
}

export default withMermaid(
  defineConfig({
    lang: "zh-CN",
    title: "Agent 从零到上框架",
    description: "面向初学者的 AI Agent 开发完整学习路径：纯 TypeScript 手写每个零件，再上框架，进阶 RAG，直到可部署服务。",
    srcDir: ".",
    // 内部 sprint 文档不发布；根 README 与首页重复，也不发布。
    srcExclude: ["docs/plans/**", "README.md", "**/node_modules/**"],
    cleanUrls: true,
    lastUpdated: true,
    // 少量链接指向 LICENSE 等非 md 资源，统一兜底（.ts 等代码链接已转 GitHub）。
    ignoreDeadLinks: true,
    rewrites: {
      "lessons/:lesson/README.md": "lessons/:lesson/index.md",
      "rag-advanced/:topic/README.md": "rag-advanced/:topic/index.md",
      "capstone/:project/README.md": "capstone/:project/index.md",
      "knowledge-graph/README.md": "knowledge-graph/index.md",
    },

    markdown: {
      theme: { light: "github-light", dark: "github-dark" },
      config(md) {
        md.use(taskLists, { enabled: false });
        // 渲染期重写正文相对链接，统一处理两类（footer 上/下一篇由 sidebar 生成不受影响）：
        //  1. 源码链接（./index.ts、../../src/shared/...）→ GitHub blob，新开页。
        //  2. 课程互链（../08-xxx/README.md、../../docs/setup.md）→ 干净 URL。
        //     WHY 必须自己处理：站点用 rewrites 把 README.md 映射成 index.md + cleanUrls，
        //     但 VitePress 对正文里指向 README.md 的相对链接只剥 .md，得到 .../README（404）。
        //     这里把 `/README.md` 收敛成目录、其余 `.md` 去扩展，与 rewrites+cleanUrls 对齐。
        md.core.ruler.push("normalize-relative-links", (state) => {
          const rel = String((state.env as { relativePath?: string })?.relativePath ?? "");
          if (!rel) return;
          for (const block of state.tokens) {
            if (block.type !== "inline" || !block.children) continue;
            for (const token of block.children) {
              if (token.type !== "link_open") continue;
              const href = token.attrGet("href");
              // 跳过：空 / 带协议(http: mailto: 等) / 锚点 / 站内绝对路径
              if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("/")) continue;
              const hashIdx = href.indexOf("#");
              const clean = hashIdx === -1 ? href : href.slice(0, hashIdx);
              const hash = hashIdx === -1 ? "" : href.slice(hashIdx);
              if (clean === "") continue; // 纯锚点

              // 1) 源码等非 md 文件 → GitHub（站内自伺服的交互图谱除外）
              if (CODE_LINK_RE.test(clean)) {
                const repoPath = resolveRepoPath(rel, clean);
                if (repoPath.startsWith("knowledge-graph/output/")) continue;
                token.attrSet("href", GITHUB_BLOB + repoPath);
                token.attrSet("target", "_blank");
                token.attrSet("rel", "noreferrer");
                continue;
              }
              // 2) README.md → 目录干净 URL（…/README.md → …/）
              if (/(^|\/)README\.md$/i.test(clean)) {
                token.attrSet("href", clean.replace(/README\.md$/i, "") + hash);
                continue;
              }
              // 3) 其余 .md → 去扩展（与 cleanUrls 对齐）
              if (/\.md$/i.test(clean)) {
                token.attrSet("href", clean.replace(/\.md$/i, "") + hash);
              }
            }
          }
        });
      },
    },

    vite: {
      plugins: [serveKgHtmlPlugin()],
    },

    /** build 结束后把交互式图谱原路径拷进 dist，保证线上链接与 dev 一致。 */
    async buildEnd(siteConfig) {
      if (!existsSync(KG_HTML_FILE)) return;
      const dest = resolve(siteConfig.outDir, "knowledge-graph/output/index.html");
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(KG_HTML_FILE, dest);
    },

    themeConfig: {
      siteTitle: "🤖 Agent 从零到上框架",
      nav: [
        { text: "开始学习", link: "/docs/setup" },
        { text: "课程总览", link: "/docs/navigation" },
        {
          text: "知识图谱",
          items: [
            { text: "全局知识图谱", link: "/docs/knowledge-graph" },
            { text: "交互式图谱（动图）", link: "/knowledge-graph/output/index.html", target: "_blank" },
          ],
        },
        {
          text: "指南",
          items: [
            { text: "💼 求职指南", link: "/docs/career-guide" },
            { text: "🚀 创业指南", link: "/docs/startup-guide" },
            { text: "📚 RAG 系统实战", link: "/docs/rag-system-project" },
          ],
        },
      ],
      sidebar,
      outline: { level: [2, 3], label: "本页目录" },
      socialLinks: [{ icon: "github", link: GITHUB_REPO }],
      search: {
        provider: "local",
        options: {
          translations: {
            button: { buttonText: "搜索课程", buttonAriaLabel: "搜索课程" },
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
      // 中文标签常见，放宽文本与边数限制，避免大图（全局概念图 165 节点）被拒绝渲染
      maxTextSize: 200000,
      maxEdges: 1000,
    },
  }),
);
