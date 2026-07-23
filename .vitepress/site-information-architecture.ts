import type { DefaultTheme } from "vitepress";
import { CHAPTERS, type Chapter } from "../knowledge-graph/data/graph";

export type SiteNavigationItem = DefaultTheme.NavItem;
export type SiteSidebarItem = DefaultTheme.SidebarItem;

export interface PortalPillar {
  id: "learn" | "build" | "intelligence";
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
}

export const PORTAL_PILLARS: PortalPillar[] = [
  {
    id: "learn",
    eyebrow: "LEARN · 体系学习",
    title: "从原理到生产，建立 Agent 工程能力",
    description: "沿 21 章主课、基础扩展、RAG 与 LangGraph 专题逐层推进。",
    href: "/docs/navigation",
    action: "查看学习路线",
  },
  {
    id: "build",
    eyebrow: "BUILD · 项目实践",
    title: "用 28 个真实项目把知识变成作品",
    description: "从离线工作流到企业知识库，按场景选择可运行、可验收的 capstone。",
    href: "/capstone/",
    action: "选择实战项目",
  },
  {
    id: "intelligence",
    eyebrow: "INTELLIGENCE · 持续跟踪",
    title: "把资讯、长文和面试输入变成长期认知",
    description: "每日 AI 情报、技术长文与面试题库共享一套可追溯阅读入口。",
    href: "/news/",
    action: "进入情报中心",
  },
];

export const PRIMARY_NAVIGATION: DefaultTheme.NavItem[] = [
  { text: "首页", link: "/" },
  {
    text: "学习",
    items: [
      { text: "学习路线", link: "/docs/navigation" },
      { text: "基础概念", link: "/agent-basics/" },
      { text: "进阶 RAG", link: "/rag-advanced/01-chunking-strategies/" },
      { text: "进阶 LangGraph", link: "/langgraph-advanced/" },
    ],
  },
  { text: "项目", link: "/capstone/", activeMatch: "^/(?:capstone|docs/projects)(?:/|$)" },
  {
    text: "情报",
    items: [
      { text: "AI 资讯", link: "/news/" },
      { text: "技术长文", link: "/notion/" },
      { text: "面试题库", link: "/interview/" },
    ],
  },
  {
    text: "源码",
    link: "/source-analysis/repository-matrix",
    activeMatch: "^/source-analysis(?:/|$)",
  },
  {
    text: "更多",
    items: [
      { text: "知识图谱", link: "/docs/knowledge-graph" },
      { text: "图谱扩展指南", link: "/knowledge-graph/" },
      { text: "求职指南", link: "/docs/career-guide" },
      { text: "创业指南", link: "/docs/startup-guide" },
      { text: "Agent 应用", link: "/docs/agent-apps" },
      { text: "系统与计划", link: "/docs/scheduled" },
    ],
  },
];

const BASIC_EXTENSION_ITEMS: SiteSidebarItem[] = Array.from({ length: 12 }, (_, index) => {
  const chapter = String(index + 1).padStart(2, "0");
  const slugs = [
    "llm-as-predictor",
    "messages-roles-context",
    "token-latency-cost",
    "sampling-repeatability",
    "instructions-output-contracts",
    "tool-calling-mental-model",
    "workflow-vs-agent",
    "memory-rag-context",
    "structured-output-basics",
    "guardrails-intro",
    "evaluation-first",
    "framework-runtime-map",
  ];
  const titles = [
    "LLM 是预测器",
    "Messages 与 Roles",
    "Token、延迟与成本",
    "采样与可重复性",
    "指令与输出契约",
    "Tool Calling",
    "Workflow vs Agent",
    "Memory / RAG / Context",
    "Structured Output",
    "Guardrails",
    "Evaluation 先行",
    "Framework 与 Runtime",
  ];
  return {
    text: `B${index + 1} ${titles[index]}`,
    link: `/agent-basics/${chapter}-${slugs[index]}`,
  };
});

const MAIN_COURSE_PARTS = [
  "第一部分 · 基础概念",
  "第二部分 · 从零手写核心",
  "第三部分 · 知识与检索",
  "第四部分 · 进阶模式",
  "第五部分 · 工程化与框架",
  "第六部分 · 生产化",
  "第七部分 · 前沿与生态",
] as const;

function chapterItems(part: string): SiteSidebarItem[] {
  return CHAPTERS.filter((chapter) => chapter.part === part).map((chapter, index) => ({
    text: chapterLabel(chapter, index),
    link: `/${chapter.dir}/`,
  }));
}

function chapterLabel(chapter: Chapter, index: number): string {
  if (chapter.part === "毕业项目") return chapter.title.replace(/^毕业项目 · /, "");
  if (chapter.part === "进阶 RAG 专题") return `R${index + 1} ${chapter.title}`;
  if (chapter.part === "进阶 LangGraph 专题") return `L${index + 1} ${chapter.title}`;
  return `${chapter.id} ${chapter.title}`;
}

const learningSidebar: SiteSidebarItem[] = [
  {
    text: "开始",
    items: [
      { text: "学习路线", link: "/docs/navigation" },
      { text: "环境搭建", link: "/docs/setup" },
      { text: "完整教学大纲", link: "/docs/curriculum" },
      { text: "术语表", link: "/docs/glossary" },
    ],
  },
  { text: "基础概念扩展", collapsed: true, items: BASIC_EXTENSION_ITEMS },
  ...MAIN_COURSE_PARTS.map((part, index) => ({
    text: part,
    collapsed: index !== 0,
    items: chapterItems(part),
  })),
];

const ragSidebar: SiteSidebarItem[] = [
  { text: "进阶 RAG 专题", items: chapterItems("进阶 RAG 专题") },
  {
    text: "架构与实战",
    items: [
      { text: "RAG 完整架构", link: "/docs/rag-architecture" },
      { text: "RAG 系统实战", link: "/docs/rag-system-project" },
      { text: "企业知识库 Agent", link: "/docs/enterprise-knowledge-base-agent" },
    ],
  },
];

const langGraphSidebar: SiteSidebarItem[] = [
  { text: "进阶 LangGraph 专题", items: chapterItems("进阶 LangGraph 专题") },
  {
    text: "关联学习",
    items: [
      { text: "多智能体编排", link: "/lessons/11-multi-agent-orchestration/" },
      { text: "框架入门", link: "/lessons/12-intro-to-frameworks/" },
    ],
  },
];

const sourceSidebar: SiteSidebarItem[] = [
  {
    text: "源码解析",
    items: [
      { text: "源码阅读路线", link: "/source-analysis/" },
      { text: "热门仓库与源码对话", link: "/source-analysis/repository-matrix" },
      { text: "LangChain", link: "/source-analysis/langchain" },
      { text: "LangGraph", link: "/source-analysis/langgraph" },
      { text: "LlamaIndex", link: "/source-analysis/llamaindex" },
    ],
  },
];

const capstoneSidebar: SiteSidebarItem[] = [
  { text: "毕业项目 · 28 个", items: chapterItems("毕业项目") },
];

const intelligenceSidebar: SiteSidebarItem[] = [
  {
    text: "情报中心",
    items: [
      { text: "AI 资讯", link: "/news/" },
      { text: "技术长文", link: "/notion/" },
      { text: "面试题库", link: "/interview/" },
    ],
  },
  {
    text: "把输入变成能力",
    items: [
      { text: "求职指南", link: "/docs/career-guide" },
      { text: "Agent 学习指南", link: "/docs/agent-learning-guides" },
    ],
  },
];

const knowledgeGraphSidebar: SiteSidebarItem[] = [
  {
    text: "知识图谱",
    items: [
      { text: "全局知识图谱", link: "/docs/knowledge-graph" },
      { text: "交互式图谱", link: "/knowledge-graph/output/index.html" },
      { text: "图谱扩展指南", link: "/knowledge-graph/" },
    ],
  },
];
const docsSidebar: SiteSidebarItem[] = [
  {
    text: "知识入口",
    items: [
      { text: "全站导航", link: "/docs/navigation" },
      { text: "学习大纲", link: "/docs/curriculum" },
      { text: "项目中心", link: "/docs/projects" },
      { text: "知识图谱", link: "/docs/knowledge-graph" },
      { text: "图谱扩展指南", link: "/knowledge-graph/" },
    ],
  },
  {
    text: "能力指南",
    items: [
      { text: "Agent 学习指南", link: "/docs/agent-learning-guides" },
      { text: "求职指南", link: "/docs/career-guide" },
      { text: "创业指南", link: "/docs/startup-guide" },
      { text: "RAG 完整架构", link: "/docs/rag-architecture" },
      { text: "企业知识库 Agent", link: "/docs/enterprise-knowledge-base-agent" },
    ],
  },
];

const projectSidebar: SiteSidebarItem[] = [
  {
    text: "项目工作区",
    items: [
      { text: "项目中心", link: "/docs/projects" },
      { text: "28 个毕业项目", link: "/capstone/" },
      { text: "源码解析", link: "/source-analysis/repository-matrix" },
      { text: "RAG 系统实战", link: "/docs/rag-system-project" },
      { text: "企业知识库 Agent", link: "/docs/enterprise-knowledge-base-agent" },
    ],
  },
];

export const CONTEXTUAL_SIDEBAR: DefaultTheme.SidebarMulti = {
  "/lessons/": learningSidebar,
  "/agent-basics/": learningSidebar,
  "/rag-advanced/": ragSidebar,
  "/langgraph-advanced/": langGraphSidebar,
  "/source-analysis/": sourceSidebar,
  "/capstone/": capstoneSidebar,
  "/news/": intelligenceSidebar,
  "/notion/": intelligenceSidebar,
  "/interview/": intelligenceSidebar,
  "/knowledge-graph/": knowledgeGraphSidebar,
  "/docs/projects": projectSidebar,
  "/docs/": docsSidebar,
};

export function collectNavigationLinks(items: readonly DefaultTheme.NavItem[]): string[] {
  return items.flatMap((item) => {
    if ("link" in item && typeof item.link === "string") return [item.link];
    if ("items" in item && Array.isArray(item.items)) return collectNavigationLinks(item.items);
    return [];
  });
}

export function collectSidebarLinks(items: readonly SiteSidebarItem[] | undefined): string[] {
  if (!items) return [];
  return items.flatMap((item) => [
    ...(item.link ? [item.link] : []),
    ...collectSidebarLinks(item.items),
  ]);
}
