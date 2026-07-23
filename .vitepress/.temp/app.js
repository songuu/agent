import { ssrRenderAttrs, ssrRenderSlot, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderComponent, ssrRenderVNode, ssrRenderClass, renderToString } from "vue/server-renderer";
import { shallowRef, inject, computed, ref, watch, onUnmounted, reactive, markRaw, readonly, nextTick, defineComponent, h, toRaw, onMounted, mergeProps, useSSRContext, unref, watchEffect, watchPostEffect, onUpdated, resolveComponent, createVNode, resolveDynamicComponent, withCtx, renderSlot, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, Fragment, renderList, defineAsyncComponent, provide, toHandlers, withKeys, onBeforeUnmount, useSlots, createSSRApp } from "vue";
import mermaid from "mermaid";
import { usePreferredDark, useDark, useMediaQuery, useWindowSize, onKeyStroke, useWindowScroll, useScrollLock } from "@vueuse/core";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
import MarkdownIt from "markdown-it";
const init = async (externalDiagrams) => {
  try {
    if (mermaid.registerExternalDiagrams)
      await mermaid.registerExternalDiagrams(externalDiagrams);
  } catch (e) {
    console.error(e);
  }
};
const render$5 = async (id, code, config) => {
  mermaid.initialize(config);
  const { svg } = await mermaid.render(id, code);
  return svg;
};
function deserializeFunctions(r) {
  return Array.isArray(r) ? r.map(deserializeFunctions) : typeof r == "object" && r !== null ? Object.keys(r).reduce((t, n) => (t[n] = deserializeFunctions(r[n]), t), {}) : typeof r == "string" && r.startsWith("_vp-fn_") ? new Function(`return ${r.slice(7)}`)() : r;
}
const siteData = deserializeFunctions(JSON.parse('{"lang":"zh-CN","dir":"ltr","title":"Agent 从零到上框架","description":"面向初学者的 AI Agent 开发完整学习路径：纯 TypeScript 手写每个零件，再上框架，进阶 RAG，直到可部署服务。","base":"/","head":[],"router":{"prefetchLinks":true},"appearance":true,"themeConfig":{"siteTitle":"🤖 Agent 从零到上框架","nav":[{"text":"开始学习","link":"/docs/setup"},{"text":"课程总览","link":"/docs/navigation"},{"text":"应用入口","items":[{"text":"SPIFFE mTLS Agent","link":"https://songuu.top/agent-demo/spiffe/","target":"_blank"},{"text":"应用目录","link":"/docs/agent-apps"}]},{"text":"AI 资讯","link":"/news/"},{"text":"面试题库","link":"/interview/","activeMatch":"^/interview(?:/|$)"},{"text":"Notion 文章","link":"/notion/"},{"text":"项目","link":"/docs/projects"},{"text":"已安排","link":"/docs/scheduled"},{"text":"知识图谱","items":[{"text":"全局知识图谱","link":"/docs/knowledge-graph"},{"text":"交互式图谱（动图）","link":"/knowledge-graph/output/index.html","target":"_blank"}]},{"text":"指南","items":[{"text":"💼 求职指南","link":"/docs/career-guide"},{"text":"🎯 面试题库","link":"/interview/"},{"text":"🚀 创业指南","link":"/docs/startup-guide"},{"text":"📁 项目","link":"/docs/projects"},{"text":"⏱️ 已安排","link":"/docs/scheduled"},{"text":"Agent 学习指南","link":"/docs/agent-learning-guides"},{"text":"🧭 RAG 完整架构","link":"/docs/rag-architecture"},{"text":"🏢 企业知识库 Agent","link":"/docs/enterprise-knowledge-base-agent"},{"text":"🎓 企业知识库 Agent Capstone","link":"/capstone/enterprise-knowledge-base-agent/"},{"text":"📚 RAG 系统实战","link":"/docs/rag-system-project"}]}],"sidebar":[{"text":"开始","items":[{"text":"00 环境搭建","link":"/docs/setup"},{"text":"全局课程导航","link":"/docs/navigation"},{"text":"项目","link":"/docs/projects"},{"text":"已安排","link":"/docs/scheduled"},{"text":"完整教学大纲","link":"/docs/curriculum"},{"text":"术语表","link":"/docs/glossary"}]},{"text":"基础概念扩展专题","collapsed":true,"items":[{"text":"B1-B12 扩章地图","link":"/agent-basics/"},{"text":"B1 LLM 不是数据库","link":"/agent-basics/01-llm-as-predictor"},{"text":"B2 Messages 与 Roles","link":"/agent-basics/02-messages-roles-context"},{"text":"B3 Token 与成本","link":"/agent-basics/03-token-latency-cost"},{"text":"B4 采样与可重复性","link":"/agent-basics/04-sampling-repeatability"},{"text":"B5 输出契约","link":"/agent-basics/05-instructions-output-contracts"},{"text":"B6 Tool Calling","link":"/agent-basics/06-tool-calling-mental-model"},{"text":"B7 Workflow vs Agent","link":"/agent-basics/07-workflow-vs-agent"},{"text":"B8 Memory/RAG/Context","link":"/agent-basics/08-memory-rag-context"},{"text":"B9 Structured Output","link":"/agent-basics/09-structured-output-basics"},{"text":"B10 Guardrails","link":"/agent-basics/10-guardrails-intro"},{"text":"B11 Evaluation 先行","link":"/agent-basics/11-evaluation-first"},{"text":"B12 Runtime 地图","link":"/agent-basics/12-framework-runtime-map"}]},{"text":"第一部分 · 基础概念","collapsed":false,"items":[{"text":"01 什么是 Agent","link":"/lessons/01-what-is-an-agent/"},{"text":"02 你的第一次 LLM 调用","link":"/lessons/02-first-llm-call/"},{"text":"03 提示工程","link":"/lessons/03-prompt-engineering/"}]},{"text":"第二部分 · 从零手写核心","collapsed":true,"items":[{"text":"04 手写 Agent 循环 (ReAct)","link":"/lessons/04-the-agent-loop/"},{"text":"05 工具调用基础","link":"/lessons/05-tool-use-basics/"},{"text":"06 从零构建工具系统","link":"/lessons/06-building-a-tool-system/"},{"text":"07 短期记忆与上下文","link":"/lessons/07-short-term-memory/"}]},{"text":"第三部分 · 知识与检索","collapsed":true,"items":[{"text":"08 Embedding 与向量检索","link":"/lessons/08-embeddings-and-vector-search/"},{"text":"09 从零实现 RAG","link":"/lessons/09-rag-from-scratch/"}]},{"text":"第四部分 · 进阶模式","collapsed":true,"items":[{"text":"10 推理范式","link":"/lessons/10-reasoning-patterns/"},{"text":"11 多智能体编排","link":"/lessons/11-multi-agent-orchestration/"}]},{"text":"第五部分 · 工程化与框架","collapsed":true,"items":[{"text":"12 上框架：LangGraph.js 与 Vercel AI SDK","link":"/lessons/12-intro-to-frameworks/"},{"text":"13 结构化输出与校验","link":"/lessons/13-structured-output/"},{"text":"14 流式输出与 UX","link":"/lessons/14-streaming-and-ux/"}]},{"text":"第六部分 · 生产化","collapsed":true,"items":[{"text":"15 评估与测试","link":"/lessons/15-evaluation-and-testing/"},{"text":"16 可观测性与成本","link":"/lessons/16-observability-and-cost/"},{"text":"17 安全与护栏","link":"/lessons/17-safety-and-guardrails/"},{"text":"18 部署：把 Agent 变成服务","link":"/lessons/18-deployment/"}]},{"text":"第七部分 · 前沿与生态","collapsed":true,"items":[{"text":"19 Agent 前沿发展与生态拆解","link":"/lessons/19-agent-ecosystem-and-frontier/"},{"text":"20 Agent 前沿文章库","link":"/lessons/20-agent-frontier-news/"}]},{"text":"第八部分 · 源码解析","collapsed":true,"items":[{"text":"21 源码解析","link":"/source-analysis/","items":[{"text":"热门仓库与源码对话","link":"/source-analysis/repository-matrix"},{"text":"LangChain 源码解析","link":"/source-analysis/langchain"},{"text":"LangGraph 源码解析","link":"/source-analysis/langgraph"},{"text":"LlamaIndex 源码解析","link":"/source-analysis/llamaindex"}]}]},{"text":"毕业项目","collapsed":true,"items":[{"text":"🎓 Deep Research Agent","link":"/capstone/deep-research-agent/"},{"text":"cap-support 毕业项目 · 客服 Copilot","link":"/capstone/support-copilot/"},{"text":"cap-review 毕业项目 · 代码评审团","link":"/capstone/code-review-crew/"},{"text":"cap-eval 毕业项目 · Agent 评测与回归门","link":"/capstone/agent-eval-harness/"},{"text":"cap-incident 毕业项目 · 告警响应 Agent","link":"/capstone/incident-responder/"},{"text":"cap-feedback 毕业项目 · 用户反馈洞察 Agent","link":"/capstone/feedback-intelligence/"},{"text":"cap-sales 毕业项目 · 销售线索研究 Agent","link":"/capstone/sales-lead-researcher/"},{"text":"cap-enterprise-kb 毕业项目 · 企业知识库 Agent","link":"/capstone/enterprise-knowledge-base-agent/"},{"text":"cap-meeting-action 毕业项目 · 会议行动项 Agent","link":"/capstone/meeting-action-agent/"},{"text":"cap-contract-risk 毕业项目 · 合同风险审阅 Agent","link":"/capstone/contract-risk-reviewer/"},{"text":"cap-data-quality 毕业项目 · 数据质量哨兵 Agent","link":"/capstone/data-quality-sentinel/"},{"text":"cap-onboarding-coach 毕业项目 · 新员工入职教练 Agent","link":"/capstone/onboarding-coach-agent/"},{"text":"cap-rfp-proposal 毕业项目 · RFP 方案标书 Agent","link":"/capstone/rfp-proposal-writer/"},{"text":"cap-clinical-intake 毕业项目 · 临床问诊分流助手 Agent","link":"/capstone/clinical-intake-assistant/"},{"text":"cap-legal-discovery 毕业项目 · 法务证据发现 Agent","link":"/capstone/legal-discovery-assistant/"},{"text":"cap-finance-close 毕业项目 · 财务月结助手 Agent","link":"/capstone/finance-close-assistant/"},{"text":"cap-security-triage 毕业项目 · 安全告警分诊 Agent","link":"/capstone/security-triage-analyst/"},{"text":"cap-compliance-policy 毕业项目 · 合规政策监控 Agent","link":"/capstone/compliance-policy-monitor/"},{"text":"cap-developer-onboarding 毕业项目 · 开发者入仓引导 Agent","link":"/capstone/developer-onboarding-guide/"},{"text":"cap-test-synthesizer 毕业项目 · 测试用例生成 Agent","link":"/capstone/test-case-synthesizer/"},{"text":"cap-cs-renewal 毕业项目 · 客户成功续约 Agent","link":"/capstone/customer-success-renewal/"},{"text":"cap-ecommerce-merch 毕业项目 · 电商选品运营 Agent","link":"/capstone/ecommerce-merchandising-planner/"},{"text":"cap-adaptive-tutor 毕业项目 · 自适应学习教练 Agent","link":"/capstone/adaptive-learning-tutor/"},{"text":"cap-recruiting-screener 毕业项目 · 招聘初筛 Agent","link":"/capstone/recruiting-screener/"},{"text":"cap-grant-proposal 毕业项目 · 科研基金申请 Agent","link":"/capstone/grant-proposal-planner/"},{"text":"cap-supply-chain 毕业项目 · 供应链风险雷达 Agent","link":"/capstone/supply-chain-risk-radar/"},{"text":"cap-field-service 毕业项目 · 现场服务调度 Agent","link":"/capstone/field-service-dispatch/"},{"text":"cap-privacy-dsr 毕业项目 · 隐私数据请求 Agent","link":"/capstone/privacy-dsr-automation/"}]},{"text":"进阶 RAG 专题","collapsed":true,"items":[{"text":"R1 进阶分块策略","link":"/rag-advanced/01-chunking-strategies/"},{"text":"R2 混合检索 (向量+BM25+RRF)","link":"/rag-advanced/02-hybrid-search/"},{"text":"R3 召回-精排两段式","link":"/rag-advanced/03-reranking/"},{"text":"R4 查询改写 (multi-query/HyDE)","link":"/rag-advanced/04-query-transformation/"},{"text":"R5 RAG 评估三指标","link":"/rag-advanced/05-rag-evaluation/"},{"text":"R6 生产化 RAG 全链路","link":"/rag-advanced/06-production-rag/"},{"text":"R7 Contextual Retrieval","link":"/rag-advanced/07-contextual-retrieval/"},{"text":"R8 Agentic RAG","link":"/rag-advanced/08-agentic-rag/"},{"text":"R9 RAG 安全护栏","link":"/rag-advanced/09-rag-security/"},{"text":"R10 向量索引内部机制","link":"/rag-advanced/10-index-internals/"},{"text":"R11 检索后上下文工程","link":"/rag-advanced/11-context-engineering/"}]},{"text":"进阶 LangGraph 专题","collapsed":true,"items":[{"text":"L1 手写 StateGraph","link":"/langgraph-advanced/01-stategraph-basics/"},{"text":"L2 条件边与路由","link":"/langgraph-advanced/02-conditional-routing/"},{"text":"L3 Checkpointer 持久化与时间旅行","link":"/langgraph-advanced/03-checkpointing/"},{"text":"L4 Human-in-the-Loop（interrupt 审批门）","link":"/langgraph-advanced/04-human-in-the-loop/"},{"text":"L5 多 Agent 编排（supervisor / 并行 team）","link":"/langgraph-advanced/05-multi-agent-graph/"}]},{"text":"知识图谱","collapsed":true,"items":[{"text":"全局知识图谱","link":"/docs/knowledge-graph"},{"text":"交互式图谱（动图）","link":"/knowledge-graph/output/index.html","target":"_blank"},{"text":"图谱扩展指南","link":"/knowledge-graph/"}]},{"text":"学完之后","collapsed":true,"items":[{"text":"💼 求职指南","link":"/docs/career-guide"},{"text":"🎯 面试题库","link":"/interview/"},{"text":"🚀 创业指南","link":"/docs/startup-guide"},{"text":"📁 项目","link":"/docs/projects"},{"text":"⏱️ 已安排","link":"/docs/scheduled"},{"text":"Agent 学习指南","link":"/docs/agent-learning-guides"},{"text":"🧭 RAG 完整架构蓝图","link":"/docs/rag-architecture"},{"text":"🏢 企业知识库 Agent 蓝图","link":"/docs/enterprise-knowledge-base-agent"},{"text":"🎓 企业知识库 Agent Capstone","link":"/capstone/enterprise-knowledge-base-agent/"},{"text":"📚 RAG 系统实战项目","link":"/docs/rag-system-project"}]}],"outline":{"level":[2,3],"label":"本页目录"},"socialLinks":[{"icon":"github","link":"https://github.com/songuu/agent"}],"search":{"provider":"local","options":{"translations":{"button":{"buttonText":"搜索课程","buttonAriaLabel":"搜索课程"},"modal":{"noResultsText":"没有找到相关内容","resetButtonTitle":"清空","footer":{"selectText":"选择","navigateText":"切换","closeText":"关闭"}}}}},"docFooter":{"prev":"上一篇","next":"下一篇"},"lastUpdatedText":"最后更新","darkModeSwitchLabel":"外观","sidebarMenuLabel":"目录","returnToTopLabel":"回到顶部","footer":{"message":"从零手写 → 再上框架 → 进阶 RAG → 可部署服务","copyright":"MIT © songuu"}},"locales":{},"scrollOffset":134,"cleanUrls":true}'));
const __vite_import_meta_env__ = {};
const EXTERNAL_URL_RE = /^(?:[a-z]+:|\/\/)/i;
const APPEARANCE_KEY = "vitepress-theme-appearance";
const HASH_RE = /#.*$/;
const HASH_OR_QUERY_RE = /[?#].*$/;
const INDEX_OR_EXT_RE = /(?:(^|\/)index)?\.(?:md|html)$/;
const inBrowser = typeof document !== "undefined";
const notFoundPageData = {
  relativePath: "404.md",
  filePath: "",
  title: "404",
  description: "Not Found",
  headers: [],
  frontmatter: { sidebar: false, layout: "page" },
  lastUpdated: 0,
  isNotFound: true
};
function isActive(currentPath, matchPath, asRegex = false) {
  if (matchPath === void 0) {
    return false;
  }
  currentPath = normalize(`/${currentPath}`);
  if (asRegex) {
    return new RegExp(matchPath).test(currentPath);
  }
  if (normalize(matchPath) !== currentPath) {
    return false;
  }
  const hashMatch = matchPath.match(HASH_RE);
  if (hashMatch) {
    return (inBrowser ? location.hash : "") === hashMatch[0];
  }
  return true;
}
function normalize(path) {
  return decodeURI(path).replace(HASH_OR_QUERY_RE, "").replace(INDEX_OR_EXT_RE, "$1");
}
function isExternal(path) {
  return EXTERNAL_URL_RE.test(path);
}
function getLocaleForPath(siteData2, relativePath) {
  return Object.keys((siteData2 == null ? void 0 : siteData2.locales) || {}).find((key2) => key2 !== "root" && !isExternal(key2) && isActive(relativePath, `/${key2}/`, true)) || "root";
}
function resolveSiteDataByRoute(siteData2, relativePath) {
  var _a, _b, _c, _d, _e, _f, _g;
  const localeIndex = getLocaleForPath(siteData2, relativePath);
  return Object.assign({}, siteData2, {
    localeIndex,
    lang: ((_a = siteData2.locales[localeIndex]) == null ? void 0 : _a.lang) ?? siteData2.lang,
    dir: ((_b = siteData2.locales[localeIndex]) == null ? void 0 : _b.dir) ?? siteData2.dir,
    title: ((_c = siteData2.locales[localeIndex]) == null ? void 0 : _c.title) ?? siteData2.title,
    titleTemplate: ((_d = siteData2.locales[localeIndex]) == null ? void 0 : _d.titleTemplate) ?? siteData2.titleTemplate,
    description: ((_e = siteData2.locales[localeIndex]) == null ? void 0 : _e.description) ?? siteData2.description,
    head: mergeHead(siteData2.head, ((_f = siteData2.locales[localeIndex]) == null ? void 0 : _f.head) ?? []),
    themeConfig: {
      ...siteData2.themeConfig,
      ...(_g = siteData2.locales[localeIndex]) == null ? void 0 : _g.themeConfig
    }
  });
}
function createTitle(siteData2, pageData) {
  const title = pageData.title || siteData2.title;
  const template = pageData.titleTemplate ?? siteData2.titleTemplate;
  if (typeof template === "string" && template.includes(":title")) {
    return template.replace(/:title/g, title);
  }
  const templateString = createTitleTemplate(siteData2.title, template);
  if (title === templateString.slice(3)) {
    return title;
  }
  return `${title}${templateString}`;
}
function createTitleTemplate(siteTitle, template) {
  if (template === false) {
    return "";
  }
  if (template === true || template === void 0) {
    return ` | ${siteTitle}`;
  }
  if (siteTitle === template) {
    return "";
  }
  return ` | ${template}`;
}
function hasTag(head, tag) {
  const [tagType, tagAttrs] = tag;
  if (tagType !== "meta")
    return false;
  const keyAttr = Object.entries(tagAttrs)[0];
  if (keyAttr == null)
    return false;
  return head.some(([type, attrs]) => type === tagType && attrs[keyAttr[0]] === keyAttr[1]);
}
function mergeHead(prev, curr) {
  return [...prev.filter((tagAttrs) => !hasTag(curr, tagAttrs)), ...curr];
}
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$&*+,:;<=>?[\]^`{|}\u007F]/g;
const DRIVE_LETTER_REGEX = /^[a-z]:/i;
function sanitizeFileName(name) {
  const match = DRIVE_LETTER_REGEX.exec(name);
  const driveLetter = match ? match[0] : "";
  return driveLetter + name.slice(driveLetter.length).replace(INVALID_CHAR_REGEX, "_").replace(/(^|\/)_+(?=[^/]*$)/, "$1");
}
const KNOWN_EXTENSIONS = /* @__PURE__ */ new Set();
function treatAsHtml(filename) {
  var _a;
  if (KNOWN_EXTENSIONS.size === 0) {
    const extraExts = typeof process === "object" && ((_a = process.env) == null ? void 0 : _a.VITE_EXTRA_EXTENSIONS) || (__vite_import_meta_env__ == null ? void 0 : __vite_import_meta_env__.VITE_EXTRA_EXTENSIONS) || "";
    ("3g2,3gp,aac,ai,apng,au,avif,bin,bmp,cer,class,conf,crl,css,csv,dll,doc,eps,epub,exe,gif,gz,ics,ief,jar,jpe,jpeg,jpg,js,json,jsonld,m4a,man,mid,midi,mjs,mov,mp2,mp3,mp4,mpe,mpeg,mpg,mpp,oga,ogg,ogv,ogx,opus,otf,p10,p7c,p7m,p7s,pdf,png,ps,qt,roff,rtf,rtx,ser,svg,t,tif,tiff,tr,ts,tsv,ttf,txt,vtt,wav,weba,webm,webp,woff,woff2,xhtml,xml,yaml,yml,zip" + (extraExts && typeof extraExts === "string" ? "," + extraExts : "")).split(",").forEach((ext2) => KNOWN_EXTENSIONS.add(ext2));
  }
  const ext = filename.split(".").pop();
  return ext == null || !KNOWN_EXTENSIONS.has(ext.toLowerCase());
}
function escapeRegExp(str) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
const dataSymbol = Symbol();
const siteDataRef = shallowRef(siteData);
function initData(route) {
  const site = computed(() => resolveSiteDataByRoute(siteDataRef.value, route.data.relativePath));
  const appearance = site.value.appearance;
  const isDark = appearance === "force-dark" ? ref(true) : appearance === "force-auto" ? usePreferredDark() : appearance ? useDark({
    storageKey: APPEARANCE_KEY,
    initialValue: () => appearance === "dark" ? "dark" : "auto",
    ...typeof appearance === "object" ? appearance : {}
  }) : ref(false);
  const hashRef = ref(inBrowser ? location.hash : "");
  if (inBrowser) {
    window.addEventListener("hashchange", () => {
      hashRef.value = location.hash;
    });
  }
  watch(() => route.data, () => {
    hashRef.value = inBrowser ? location.hash : "";
  });
  return {
    site,
    theme: computed(() => site.value.themeConfig),
    page: computed(() => route.data),
    frontmatter: computed(() => route.data.frontmatter),
    params: computed(() => route.data.params),
    lang: computed(() => site.value.lang),
    dir: computed(() => route.data.frontmatter.dir || site.value.dir),
    localeIndex: computed(() => site.value.localeIndex || "root"),
    title: computed(() => createTitle(site.value, route.data)),
    description: computed(() => route.data.description || site.value.description),
    isDark,
    hash: computed(() => hashRef.value)
  };
}
function useData$1() {
  const data = inject(dataSymbol);
  if (!data) {
    throw new Error("vitepress data not properly injected in app");
  }
  return data;
}
function joinPath(base, path) {
  return `${base}${path}`.replace(/\/+/g, "/");
}
function withBase(path) {
  return EXTERNAL_URL_RE.test(path) || !path.startsWith("/") ? path : joinPath(siteDataRef.value.base, path);
}
function pathToFile(path) {
  let pagePath = path.replace(/\.html$/, "");
  pagePath = decodeURIComponent(pagePath);
  pagePath = pagePath.replace(/\/$/, "/index");
  {
    if (inBrowser) {
      const base = "/";
      pagePath = sanitizeFileName(pagePath.slice(base.length).replace(/\//g, "_") || "index") + ".md";
      let pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()];
      if (!pageHash) {
        pagePath = pagePath.endsWith("_index.md") ? pagePath.slice(0, -9) + ".md" : pagePath.slice(0, -3) + "_index.md";
        pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()];
      }
      if (!pageHash)
        return null;
      pagePath = `${base}${"assets"}/${pagePath}.${pageHash}.js`;
    } else {
      pagePath = `./${sanitizeFileName(pagePath.slice(1).replace(/\//g, "_"))}.md.js`;
    }
  }
  return pagePath;
}
let contentUpdatedCallbacks = [];
function onContentUpdated(fn) {
  contentUpdatedCallbacks.push(fn);
  onUnmounted(() => {
    contentUpdatedCallbacks = contentUpdatedCallbacks.filter((f) => f !== fn);
  });
}
function getScrollOffset() {
  let scrollOffset = siteDataRef.value.scrollOffset;
  let offset = 0;
  let padding = 24;
  if (typeof scrollOffset === "object" && "padding" in scrollOffset) {
    padding = scrollOffset.padding;
    scrollOffset = scrollOffset.selector;
  }
  if (typeof scrollOffset === "number") {
    offset = scrollOffset;
  } else if (typeof scrollOffset === "string") {
    offset = tryOffsetSelector(scrollOffset, padding);
  } else if (Array.isArray(scrollOffset)) {
    for (const selector of scrollOffset) {
      const res = tryOffsetSelector(selector, padding);
      if (res) {
        offset = res;
        break;
      }
    }
  }
  return offset;
}
function tryOffsetSelector(selector, padding) {
  const el2 = document.querySelector(selector);
  if (!el2)
    return 0;
  const bot = el2.getBoundingClientRect().bottom;
  if (bot < 0)
    return 0;
  return bot + padding;
}
const RouterSymbol = Symbol();
const fakeHost = "http://a.com";
const getDefaultRoute = () => ({
  path: "/",
  component: null,
  data: notFoundPageData
});
function createRouter(loadPageModule, fallbackComponent) {
  const route = reactive(getDefaultRoute());
  const router = {
    route,
    go
  };
  async function go(href = inBrowser ? location.href : "/") {
    var _a, _b;
    href = normalizeHref(href);
    if (await ((_a = router.onBeforeRouteChange) == null ? void 0 : _a.call(router, href)) === false)
      return;
    if (inBrowser && href !== normalizeHref(location.href)) {
      history.replaceState({ scrollPosition: window.scrollY }, "");
      history.pushState({}, "", href);
    }
    await loadPage(href);
    await ((_b = router.onAfterRouteChange ?? router.onAfterRouteChanged) == null ? void 0 : _b(href));
  }
  let latestPendingPath = null;
  async function loadPage(href, scrollPosition = 0, isRetry = false) {
    var _a, _b;
    if (await ((_a = router.onBeforePageLoad) == null ? void 0 : _a.call(router, href)) === false)
      return;
    const targetLoc = new URL(href, fakeHost);
    const pendingPath = latestPendingPath = targetLoc.pathname;
    try {
      let page = await loadPageModule(pendingPath);
      if (!page) {
        throw new Error(`Page not found: ${pendingPath}`);
      }
      if (latestPendingPath === pendingPath) {
        latestPendingPath = null;
        const { default: comp, __pageData } = page;
        if (!comp) {
          throw new Error(`Invalid route component: ${comp}`);
        }
        await ((_b = router.onAfterPageLoad) == null ? void 0 : _b.call(router, href));
        route.path = inBrowser ? pendingPath : withBase(pendingPath);
        route.component = markRaw(comp);
        route.data = true ? markRaw(__pageData) : readonly(__pageData);
        if (inBrowser) {
          nextTick(() => {
            let actualPathname = siteDataRef.value.base + __pageData.relativePath.replace(/(?:(^|\/)index)?\.md$/, "$1");
            if (!siteDataRef.value.cleanUrls && !actualPathname.endsWith("/")) {
              actualPathname += ".html";
            }
            if (actualPathname !== targetLoc.pathname) {
              targetLoc.pathname = actualPathname;
              href = actualPathname + targetLoc.search + targetLoc.hash;
              history.replaceState({}, "", href);
            }
            if (targetLoc.hash && !scrollPosition) {
              let target = null;
              try {
                target = document.getElementById(decodeURIComponent(targetLoc.hash).slice(1));
              } catch (e) {
                console.warn(e);
              }
              if (target) {
                scrollTo(target, targetLoc.hash);
                return;
              }
            }
            window.scrollTo(0, scrollPosition);
          });
        }
      }
    } catch (err) {
      if (!/fetch|Page not found/.test(err.message) && !/^\/404(\.html|\/)?$/.test(href)) {
        console.error(err);
      }
      if (!isRetry) {
        try {
          const res = await fetch(siteDataRef.value.base + "hashmap.json");
          window.__VP_HASH_MAP__ = await res.json();
          await loadPage(href, scrollPosition, true);
          return;
        } catch (e) {
        }
      }
      if (latestPendingPath === pendingPath) {
        latestPendingPath = null;
        route.path = inBrowser ? pendingPath : withBase(pendingPath);
        route.component = fallbackComponent ? markRaw(fallbackComponent) : null;
        const relativePath = inBrowser ? pendingPath.replace(/(^|\/)$/, "$1index").replace(/(\.html)?$/, ".md").replace(/^\//, "") : "404.md";
        route.data = { ...notFoundPageData, relativePath };
      }
    }
  }
  if (inBrowser) {
    if (history.state === null) {
      history.replaceState({}, "");
    }
    window.addEventListener("click", (e) => {
      if (e.defaultPrevented || !(e.target instanceof Element) || e.target.closest("button") || // temporary fix for docsearch action buttons
      e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)
        return;
      const link2 = e.target.closest("a");
      if (!link2 || link2.closest(".vp-raw") || link2.hasAttribute("download") || link2.hasAttribute("target"))
        return;
      const linkHref = link2.getAttribute("href") ?? (link2 instanceof SVGAElement ? link2.getAttribute("xlink:href") : null);
      if (linkHref == null)
        return;
      const { href, origin, pathname, hash, search } = new URL(linkHref, link2.baseURI);
      const currentUrl = new URL(location.href);
      if (origin === currentUrl.origin && treatAsHtml(pathname)) {
        e.preventDefault();
        if (pathname === currentUrl.pathname && search === currentUrl.search) {
          if (hash !== currentUrl.hash) {
            history.pushState({}, "", href);
            window.dispatchEvent(new HashChangeEvent("hashchange", {
              oldURL: currentUrl.href,
              newURL: href
            }));
          }
          if (hash) {
            scrollTo(link2, hash, link2.classList.contains("header-anchor"));
          } else {
            window.scrollTo(0, 0);
          }
        } else {
          go(href);
        }
      }
    }, { capture: true });
    window.addEventListener("popstate", async (e) => {
      var _a;
      if (e.state === null)
        return;
      const href = normalizeHref(location.href);
      await loadPage(href, e.state && e.state.scrollPosition || 0);
      await ((_a = router.onAfterRouteChange ?? router.onAfterRouteChanged) == null ? void 0 : _a(href));
    });
    window.addEventListener("hashchange", (e) => {
      e.preventDefault();
    });
  }
  return router;
}
function useRouter() {
  const router = inject(RouterSymbol);
  if (!router) {
    throw new Error("useRouter() is called without provider.");
  }
  return router;
}
function useRoute() {
  return useRouter().route;
}
function scrollTo(el2, hash, smooth = false) {
  let target = null;
  try {
    target = el2.classList.contains("header-anchor") ? el2 : document.getElementById(decodeURIComponent(hash).slice(1));
  } catch (e) {
    console.warn(e);
  }
  if (target) {
    let scrollToTarget = function() {
      if (!smooth || Math.abs(targetTop - window.scrollY) > window.innerHeight)
        window.scrollTo(0, targetTop);
      else
        window.scrollTo({ left: 0, top: targetTop, behavior: "smooth" });
    };
    const targetPadding = parseInt(window.getComputedStyle(target).paddingTop, 10);
    const targetTop = window.scrollY + target.getBoundingClientRect().top - getScrollOffset() + targetPadding;
    requestAnimationFrame(scrollToTarget);
  }
}
function normalizeHref(href) {
  const url = new URL(href, fakeHost);
  url.pathname = url.pathname.replace(/(^|\/)index(\.html)?$/, "$1");
  if (siteDataRef.value.cleanUrls)
    url.pathname = url.pathname.replace(/\.html$/, "");
  else if (!url.pathname.endsWith("/") && !url.pathname.endsWith(".html"))
    url.pathname += ".html";
  return url.pathname + url.search + url.hash;
}
const runCbs = () => contentUpdatedCallbacks.forEach((fn) => fn());
const Content = defineComponent({
  name: "VitePressContent",
  props: {
    as: { type: [Object, String], default: "div" }
  },
  setup(props) {
    const route = useRoute();
    const { frontmatter, site } = useData$1();
    watch(frontmatter, runCbs, { deep: true, flush: "post" });
    return () => h(props.as, site.value.contentProps ?? { style: { position: "relative" } }, [
      route.component ? h(route.component, {
        onVnodeMounted: runCbs,
        onVnodeUpdated: runCbs,
        onVnodeUnmounted: runCbs
      }) : "404 Page Not Found"
    ]);
  }
});
const _sfc_main$15 = {
  __name: "Mermaid",
  __ssrInlineRender: true,
  props: {
    graph: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    class: {
      type: String,
      required: false,
      default: "mermaid"
    }
  },
  setup(__props) {
    const pluginSettings = ref({
      securityLevel: "loose",
      startOnLoad: false,
      externalDiagrams: []
    });
    const { page } = useData$1();
    const { frontmatter } = toRaw(page.value);
    const mermaidPageTheme = frontmatter.mermaidTheme || "";
    const props = __props;
    const svg = ref(null);
    let mut = null;
    onMounted(async () => {
      var _a;
      await init(pluginSettings.value.externalDiagrams);
      let settings = await import("./virtual_mermaid-config.Q_0ImVyM.js");
      if (settings == null ? void 0 : settings.default) pluginSettings.value = settings.default;
      mut = new MutationObserver(async () => await renderChart());
      mut.observe(document.documentElement, { attributes: true });
      await renderChart();
      const hasImages = ((_a = /<img([\w\W]+?)>/.exec(decodeURIComponent(props.graph))) == null ? void 0 : _a.length) > 0;
      if (hasImages)
        setTimeout(() => {
          let imgElements = document.getElementsByTagName("img");
          let imgs = Array.from(imgElements);
          if (imgs.length) {
            Promise.all(
              imgs.filter((img) => !img.complete).map(
                (img) => new Promise((resolve) => {
                  img.onload = img.onerror = resolve;
                })
              )
            ).then(async () => {
              await renderChart();
            });
          }
        }, 100);
    });
    onUnmounted(() => mut.disconnect());
    const renderChart = async () => {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      let mermaidConfig = {
        ...pluginSettings.value
      };
      if (mermaidPageTheme) mermaidConfig.theme = mermaidPageTheme;
      if (hasDarkClass) mermaidConfig.theme = "dark";
      let svgCode = await render$5(
        props.id,
        decodeURIComponent(props.graph),
        mermaidConfig
      );
      const salt = Math.random().toString(36).substring(7);
      svg.value = `${svgCode} <span style="display: none">${salt}</span>`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: props.class
      }, _attrs))}>${svg.value ?? ""}</div>`);
    };
  }
};
const _sfc_setup$15 = _sfc_main$15.setup;
_sfc_main$15.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress-plugin-mermaid@2._ccd50e51a6cde3842ac4f39d9aeb7ebe/node_modules/vitepress-plugin-mermaid/dist/Mermaid.vue");
  return _sfc_setup$15 ? _sfc_setup$15(props, ctx) : void 0;
};
const _sfc_main$14 = /* @__PURE__ */ defineComponent({
  __name: "VPBadge",
  __ssrInlineRender: true,
  props: {
    text: {},
    type: { default: "tip" }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<span${ssrRenderAttrs(mergeProps({
        class: ["VPBadge", __props.type]
      }, _attrs))}>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, () => {
        _push(`${ssrInterpolate(__props.text)}`);
      }, _push, _parent);
      _push(`</span>`);
    };
  }
});
const _sfc_setup$14 = _sfc_main$14.setup;
_sfc_main$14.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPBadge.vue");
  return _sfc_setup$14 ? _sfc_setup$14(props, ctx) : void 0;
};
const _sfc_main$13 = /* @__PURE__ */ defineComponent({
  __name: "VPBackdrop",
  __ssrInlineRender: true,
  props: {
    show: { type: Boolean }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.show) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPBackdrop" }, _attrs))} data-v-194e6ccf></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$13 = _sfc_main$13.setup;
_sfc_main$13.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPBackdrop.vue");
  return _sfc_setup$13 ? _sfc_setup$13(props, ctx) : void 0;
};
const VPBackdrop = /* @__PURE__ */ _export_sfc(_sfc_main$13, [["__scopeId", "data-v-194e6ccf"]]);
const useData = useData$1;
function throttleAndDebounce(fn, delay) {
  let timeoutId;
  let called = false;
  return () => {
    if (timeoutId)
      clearTimeout(timeoutId);
    if (!called) {
      fn();
      (called = true) && setTimeout(() => called = false, delay);
    } else
      timeoutId = setTimeout(fn, delay);
  };
}
function ensureStartingSlash(path) {
  return path.startsWith("/") ? path : `/${path}`;
}
function normalizeLink$1(url) {
  const { pathname, search, hash, protocol } = new URL(url, "http://a.com");
  if (isExternal(url) || url.startsWith("#") || !protocol.startsWith("http") || !treatAsHtml(pathname))
    return url;
  const { site } = useData();
  const normalizedPath = pathname.endsWith("/") || pathname.endsWith(".html") ? url : url.replace(/(?:(^\.+)\/)?.*$/, `$1${pathname.replace(/(\.md)?$/, site.value.cleanUrls ? "" : ".html")}${search}${hash}`);
  return withBase(normalizedPath);
}
function useLangs({ correspondingLink = false } = {}) {
  const { site, localeIndex, page, theme: theme2, hash } = useData();
  const currentLang = computed(() => {
    var _a, _b;
    return {
      label: (_a = site.value.locales[localeIndex.value]) == null ? void 0 : _a.label,
      link: ((_b = site.value.locales[localeIndex.value]) == null ? void 0 : _b.link) || (localeIndex.value === "root" ? "/" : `/${localeIndex.value}/`)
    };
  });
  const localeLinks = computed(() => Object.entries(site.value.locales).flatMap(([key2, value]) => currentLang.value.label === value.label ? [] : {
    text: value.label,
    link: normalizeLink(value.link || (key2 === "root" ? "/" : `/${key2}/`), theme2.value.i18nRouting !== false && correspondingLink, page.value.relativePath.slice(currentLang.value.link.length - 1), !site.value.cleanUrls) + hash.value
  }));
  return { localeLinks, currentLang };
}
function normalizeLink(link2, addPath, path, addExt) {
  return addPath ? link2.replace(/\/$/, "") + ensureStartingSlash(path.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, addExt ? ".html" : "")) : link2;
}
const _sfc_main$12 = /* @__PURE__ */ defineComponent({
  __name: "NotFound",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    const { currentLang } = useLangs();
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "NotFound" }, _attrs))} data-v-3bf87d65><p class="code" data-v-3bf87d65>${ssrInterpolate(((_a = unref(theme2).notFound) == null ? void 0 : _a.code) ?? "404")}</p><h1 class="title" data-v-3bf87d65>${ssrInterpolate(((_b = unref(theme2).notFound) == null ? void 0 : _b.title) ?? "PAGE NOT FOUND")}</h1><div class="divider" data-v-3bf87d65></div><blockquote class="quote" data-v-3bf87d65>${ssrInterpolate(((_c = unref(theme2).notFound) == null ? void 0 : _c.quote) ?? "But if you don't change your direction, and if you keep looking, you may end up where you are heading.")}</blockquote><div class="action" data-v-3bf87d65><a class="link"${ssrRenderAttr("href", unref(withBase)(unref(currentLang).link))}${ssrRenderAttr("aria-label", ((_d = unref(theme2).notFound) == null ? void 0 : _d.linkLabel) ?? "go to home")} data-v-3bf87d65>${ssrInterpolate(((_e = unref(theme2).notFound) == null ? void 0 : _e.linkText) ?? "Take me home")}</a></div></div>`);
    };
  }
});
const _sfc_setup$12 = _sfc_main$12.setup;
_sfc_main$12.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/NotFound.vue");
  return _sfc_setup$12 ? _sfc_setup$12(props, ctx) : void 0;
};
const NotFound = /* @__PURE__ */ _export_sfc(_sfc_main$12, [["__scopeId", "data-v-3bf87d65"]]);
function getSidebar(_sidebar, path) {
  if (Array.isArray(_sidebar))
    return addBase(_sidebar);
  if (_sidebar == null)
    return [];
  path = ensureStartingSlash(path);
  const dir = Object.keys(_sidebar).sort((a, b) => {
    return b.split("/").length - a.split("/").length;
  }).find((dir2) => {
    return path.startsWith(ensureStartingSlash(dir2));
  });
  const sidebar = dir ? _sidebar[dir] : [];
  return Array.isArray(sidebar) ? addBase(sidebar) : addBase(sidebar.items, sidebar.base);
}
function getSidebarGroups(sidebar) {
  const groups = [];
  let lastGroupIndex = 0;
  for (const index in sidebar) {
    const item = sidebar[index];
    if (item.items) {
      lastGroupIndex = groups.push(item);
      continue;
    }
    if (!groups[lastGroupIndex]) {
      groups.push({ items: [] });
    }
    groups[lastGroupIndex].items.push(item);
  }
  return groups;
}
function getFlatSideBarLinks(sidebar) {
  const links = [];
  function recursivelyExtractLinks(items) {
    for (const item of items) {
      if (item.text && item.link) {
        links.push({
          text: item.text,
          link: item.link,
          docFooterText: item.docFooterText
        });
      }
      if (item.items) {
        recursivelyExtractLinks(item.items);
      }
    }
  }
  recursivelyExtractLinks(sidebar);
  return links;
}
function hasActiveLink(path, items) {
  if (Array.isArray(items)) {
    return items.some((item) => hasActiveLink(path, item));
  }
  return isActive(path, items.link) ? true : items.items ? hasActiveLink(path, items.items) : false;
}
function addBase(items, _base) {
  return [...items].map((_item) => {
    const item = { ..._item };
    const base = item.base || _base;
    if (base && item.link)
      item.link = base + item.link;
    if (item.items)
      item.items = addBase(item.items, base);
    return item;
  });
}
function useSidebar() {
  const { frontmatter, page, theme: theme2 } = useData();
  const is960 = useMediaQuery("(min-width: 960px)");
  const isOpen = ref(false);
  const _sidebar = computed(() => {
    const sidebarConfig = theme2.value.sidebar;
    const relativePath = page.value.relativePath;
    return sidebarConfig ? getSidebar(sidebarConfig, relativePath) : [];
  });
  const sidebar = ref(_sidebar.value);
  watch(_sidebar, (next, prev) => {
    if (JSON.stringify(next) !== JSON.stringify(prev))
      sidebar.value = _sidebar.value;
  });
  const hasSidebar = computed(() => {
    return frontmatter.value.sidebar !== false && sidebar.value.length > 0 && frontmatter.value.layout !== "home";
  });
  const leftAside = computed(() => {
    if (hasAside)
      return frontmatter.value.aside == null ? theme2.value.aside === "left" : frontmatter.value.aside === "left";
    return false;
  });
  const hasAside = computed(() => {
    if (frontmatter.value.layout === "home")
      return false;
    if (frontmatter.value.aside != null)
      return !!frontmatter.value.aside;
    return theme2.value.aside !== false;
  });
  const isSidebarEnabled = computed(() => hasSidebar.value && is960.value);
  const sidebarGroups = computed(() => {
    return hasSidebar.value ? getSidebarGroups(sidebar.value) : [];
  });
  function open() {
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
  }
  function toggle() {
    isOpen.value ? close() : open();
  }
  return {
    isOpen,
    sidebar,
    sidebarGroups,
    hasSidebar,
    hasAside,
    leftAside,
    isSidebarEnabled,
    open,
    close,
    toggle
  };
}
function useCloseSidebarOnEscape(isOpen, close) {
  let triggerElement;
  watchEffect(() => {
    triggerElement = isOpen.value ? document.activeElement : void 0;
  });
  onMounted(() => {
    window.addEventListener("keyup", onEscape);
  });
  onUnmounted(() => {
    window.removeEventListener("keyup", onEscape);
  });
  function onEscape(e) {
    if (e.key === "Escape" && isOpen.value) {
      close();
      triggerElement == null ? void 0 : triggerElement.focus();
    }
  }
}
function useSidebarControl(item) {
  const { page, hash } = useData();
  const collapsed = ref(false);
  const collapsible = computed(() => {
    return item.value.collapsed != null;
  });
  const isLink = computed(() => {
    return !!item.value.link;
  });
  const isActiveLink = ref(false);
  const updateIsActiveLink = () => {
    isActiveLink.value = isActive(page.value.relativePath, item.value.link);
  };
  watch([page, item, hash], updateIsActiveLink);
  onMounted(updateIsActiveLink);
  const hasActiveLink$1 = computed(() => {
    if (isActiveLink.value) {
      return true;
    }
    return item.value.items ? hasActiveLink(page.value.relativePath, item.value.items) : false;
  });
  const hasChildren = computed(() => {
    return !!(item.value.items && item.value.items.length);
  });
  watchEffect(() => {
    collapsed.value = !!(collapsible.value && item.value.collapsed);
  });
  watchPostEffect(() => {
    (isActiveLink.value || hasActiveLink$1.value) && (collapsed.value = false);
  });
  function toggle() {
    if (collapsible.value) {
      collapsed.value = !collapsed.value;
    }
  }
  return {
    collapsed,
    collapsible,
    isLink,
    isActiveLink,
    hasActiveLink: hasActiveLink$1,
    hasChildren,
    toggle
  };
}
function useAside() {
  const { hasSidebar } = useSidebar();
  const is960 = useMediaQuery("(min-width: 960px)");
  const is1280 = useMediaQuery("(min-width: 1280px)");
  const isAsideEnabled = computed(() => {
    if (!is1280.value && !is960.value) {
      return false;
    }
    return hasSidebar.value ? is1280.value : is960.value;
  });
  return {
    isAsideEnabled
  };
}
const ignoreRE = /\b(?:VPBadge|header-anchor|footnote-ref|ignore-header)\b/;
const resolvedHeaders = [];
function resolveTitle(theme2) {
  return typeof theme2.outline === "object" && !Array.isArray(theme2.outline) && theme2.outline.label || theme2.outlineTitle || "On this page";
}
function getHeaders(range) {
  const headers = [
    ...document.querySelectorAll(".VPDoc :where(h1,h2,h3,h4,h5,h6)")
  ].filter((el2) => el2.id && el2.hasChildNodes()).map((el2) => {
    const level = Number(el2.tagName[1]);
    return {
      element: el2,
      title: serializeHeader(el2),
      link: "#" + el2.id,
      level
    };
  });
  return resolveHeaders(headers, range);
}
function serializeHeader(h2) {
  let ret = "";
  for (const node of h2.childNodes) {
    if (node.nodeType === 1) {
      if (ignoreRE.test(node.className))
        continue;
      ret += node.textContent;
    } else if (node.nodeType === 3) {
      ret += node.textContent;
    }
  }
  return ret.trim();
}
function resolveHeaders(headers, range) {
  if (range === false) {
    return [];
  }
  const levelsRange = (typeof range === "object" && !Array.isArray(range) ? range.level : range) || 2;
  const [high, low] = typeof levelsRange === "number" ? [levelsRange, levelsRange] : levelsRange === "deep" ? [2, 6] : levelsRange;
  return buildTree(headers, high, low);
}
function useActiveAnchor(container, marker) {
  const { isAsideEnabled } = useAside();
  const onScroll = throttleAndDebounce(setActiveLink, 100);
  let prevActiveLink = null;
  onMounted(() => {
    requestAnimationFrame(setActiveLink);
    window.addEventListener("scroll", onScroll);
  });
  onUpdated(() => {
    activateLink(location.hash);
  });
  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
  });
  function setActiveLink() {
    if (!isAsideEnabled.value) {
      return;
    }
    const scrollY = window.scrollY;
    const innerHeight = window.innerHeight;
    const offsetHeight = document.body.offsetHeight;
    const isBottom = Math.abs(scrollY + innerHeight - offsetHeight) < 1;
    const headers = resolvedHeaders.map(({ element, link: link2 }) => ({
      link: link2,
      top: getAbsoluteTop(element)
    })).filter(({ top }) => !Number.isNaN(top)).sort((a, b) => a.top - b.top);
    if (!headers.length) {
      activateLink(null);
      return;
    }
    if (scrollY < 1) {
      activateLink(null);
      return;
    }
    if (isBottom) {
      activateLink(headers[headers.length - 1].link);
      return;
    }
    let activeLink = null;
    for (const { link: link2, top } of headers) {
      if (top > scrollY + getScrollOffset() + 4) {
        break;
      }
      activeLink = link2;
    }
    activateLink(activeLink);
  }
  function activateLink(hash) {
    if (prevActiveLink) {
      prevActiveLink.classList.remove("active");
    }
    if (hash == null) {
      prevActiveLink = null;
    } else {
      prevActiveLink = container.value.querySelector(`a[href="${decodeURIComponent(hash)}"]`);
    }
    const activeLink = prevActiveLink;
    if (activeLink) {
      activeLink.classList.add("active");
      marker.value.style.top = activeLink.offsetTop + 39 + "px";
      marker.value.style.opacity = "1";
    } else {
      marker.value.style.top = "33px";
      marker.value.style.opacity = "0";
    }
  }
}
function getAbsoluteTop(element) {
  let offsetTop = 0;
  while (element !== document.body) {
    if (element === null) {
      return NaN;
    }
    offsetTop += element.offsetTop;
    element = element.offsetParent;
  }
  return offsetTop;
}
function buildTree(data, min, max) {
  resolvedHeaders.length = 0;
  const result = [];
  const stack = [];
  data.forEach((item) => {
    const node = { ...item, children: [] };
    let parent = stack[stack.length - 1];
    while (parent && parent.level >= node.level) {
      stack.pop();
      parent = stack[stack.length - 1];
    }
    if (node.element.classList.contains("ignore-header") || parent && "shouldIgnore" in parent) {
      stack.push({ level: node.level, shouldIgnore: true });
      return;
    }
    if (node.level > max || node.level < min)
      return;
    resolvedHeaders.push({ element: node.element, link: node.link });
    if (parent)
      parent.children.push(node);
    else
      result.push(node);
    stack.push(node);
  });
  return result;
}
const _sfc_main$11 = /* @__PURE__ */ defineComponent({
  __name: "VPDocOutlineItem",
  __ssrInlineRender: true,
  props: {
    headers: {},
    root: { type: Boolean }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_VPDocOutlineItem = resolveComponent("VPDocOutlineItem", true);
      _push(`<ul${ssrRenderAttrs(mergeProps({
        class: ["VPDocOutlineItem", __props.root ? "root" : "nested"]
      }, _attrs))} data-v-24b05622><!--[-->`);
      ssrRenderList(__props.headers, ({ children, link: link2, title }) => {
        _push(`<li data-v-24b05622><a class="outline-link"${ssrRenderAttr("href", link2)}${ssrRenderAttr("title", title)} data-v-24b05622>${ssrInterpolate(title)}</a>`);
        if (children == null ? void 0 : children.length) {
          _push(ssrRenderComponent(_component_VPDocOutlineItem, { headers: children }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</li>`);
      });
      _push(`<!--]--></ul>`);
    };
  }
});
const _sfc_setup$11 = _sfc_main$11.setup;
_sfc_main$11.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDocOutlineItem.vue");
  return _sfc_setup$11 ? _sfc_setup$11(props, ctx) : void 0;
};
const VPDocOutlineItem = /* @__PURE__ */ _export_sfc(_sfc_main$11, [["__scopeId", "data-v-24b05622"]]);
const _sfc_main$10 = /* @__PURE__ */ defineComponent({
  __name: "VPDocAsideOutline",
  __ssrInlineRender: true,
  setup(__props) {
    const { frontmatter, theme: theme2 } = useData();
    const headers = shallowRef([]);
    onContentUpdated(() => {
      headers.value = getHeaders(frontmatter.value.outline ?? theme2.value.outline);
    });
    const container = ref();
    const marker = ref();
    useActiveAnchor(container, marker);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<nav${ssrRenderAttrs(mergeProps({
        "aria-labelledby": "doc-outline-aria-label",
        class: ["VPDocAsideOutline", { "has-outline": headers.value.length > 0 }],
        ref_key: "container",
        ref: container
      }, _attrs))} data-v-1c51b2b3><div class="content" data-v-1c51b2b3><div class="outline-marker" data-v-1c51b2b3></div><div aria-level="2" class="outline-title" id="doc-outline-aria-label" role="heading" data-v-1c51b2b3>${ssrInterpolate(unref(resolveTitle)(unref(theme2)))}</div>`);
      _push(ssrRenderComponent(VPDocOutlineItem, {
        headers: headers.value,
        root: true
      }, null, _parent));
      _push(`</div></nav>`);
    };
  }
});
const _sfc_setup$10 = _sfc_main$10.setup;
_sfc_main$10.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDocAsideOutline.vue");
  return _sfc_setup$10 ? _sfc_setup$10(props, ctx) : void 0;
};
const VPDocAsideOutline = /* @__PURE__ */ _export_sfc(_sfc_main$10, [["__scopeId", "data-v-1c51b2b3"]]);
const _sfc_main$$ = /* @__PURE__ */ defineComponent({
  __name: "VPDocAsideCarbonAds",
  __ssrInlineRender: true,
  props: {
    carbonAds: {}
  },
  setup(__props) {
    const VPCarbonAds = () => null;
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPDocAsideCarbonAds" }, _attrs))}>`);
      _push(ssrRenderComponent(unref(VPCarbonAds), { "carbon-ads": __props.carbonAds }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$$ = _sfc_main$$.setup;
_sfc_main$$.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDocAsideCarbonAds.vue");
  return _sfc_setup$$ ? _sfc_setup$$(props, ctx) : void 0;
};
const _sfc_main$_ = /* @__PURE__ */ defineComponent({
  __name: "VPDocAside",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPDocAside" }, _attrs))} data-v-4ef0d428>`);
      ssrRenderSlot(_ctx.$slots, "aside-top", {}, null, _push, _parent);
      ssrRenderSlot(_ctx.$slots, "aside-outline-before", {}, null, _push, _parent);
      _push(ssrRenderComponent(VPDocAsideOutline, null, null, _parent));
      ssrRenderSlot(_ctx.$slots, "aside-outline-after", {}, null, _push, _parent);
      _push(`<div class="spacer" data-v-4ef0d428></div>`);
      ssrRenderSlot(_ctx.$slots, "aside-ads-before", {}, null, _push, _parent);
      if (unref(theme2).carbonAds) {
        _push(ssrRenderComponent(_sfc_main$$, {
          "carbon-ads": unref(theme2).carbonAds
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "aside-ads-after", {}, null, _push, _parent);
      ssrRenderSlot(_ctx.$slots, "aside-bottom", {}, null, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$_ = _sfc_main$_.setup;
_sfc_main$_.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDocAside.vue");
  return _sfc_setup$_ ? _sfc_setup$_(props, ctx) : void 0;
};
const VPDocAside = /* @__PURE__ */ _export_sfc(_sfc_main$_, [["__scopeId", "data-v-4ef0d428"]]);
function useEditLink() {
  const { theme: theme2, page } = useData();
  return computed(() => {
    const { text = "Edit this page", pattern = "" } = theme2.value.editLink || {};
    let url;
    if (typeof pattern === "function") {
      url = pattern(page.value);
    } else {
      url = pattern.replace(/:path/g, page.value.filePath);
    }
    return { url, text };
  });
}
function usePrevNext() {
  const { page, theme: theme2, frontmatter } = useData();
  return computed(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const sidebar = getSidebar(theme2.value.sidebar, page.value.relativePath);
    const links = getFlatSideBarLinks(sidebar);
    const candidates = uniqBy(links, (link2) => link2.link.replace(/[?#].*$/, ""));
    const index = candidates.findIndex((link2) => {
      return isActive(page.value.relativePath, link2.link);
    });
    const hidePrev = ((_a = theme2.value.docFooter) == null ? void 0 : _a.prev) === false && !frontmatter.value.prev || frontmatter.value.prev === false;
    const hideNext = ((_b = theme2.value.docFooter) == null ? void 0 : _b.next) === false && !frontmatter.value.next || frontmatter.value.next === false;
    return {
      prev: hidePrev ? void 0 : {
        text: (typeof frontmatter.value.prev === "string" ? frontmatter.value.prev : typeof frontmatter.value.prev === "object" ? frontmatter.value.prev.text : void 0) ?? ((_c = candidates[index - 1]) == null ? void 0 : _c.docFooterText) ?? ((_d = candidates[index - 1]) == null ? void 0 : _d.text),
        link: (typeof frontmatter.value.prev === "object" ? frontmatter.value.prev.link : void 0) ?? ((_e = candidates[index - 1]) == null ? void 0 : _e.link)
      },
      next: hideNext ? void 0 : {
        text: (typeof frontmatter.value.next === "string" ? frontmatter.value.next : typeof frontmatter.value.next === "object" ? frontmatter.value.next.text : void 0) ?? ((_f = candidates[index + 1]) == null ? void 0 : _f.docFooterText) ?? ((_g = candidates[index + 1]) == null ? void 0 : _g.text),
        link: (typeof frontmatter.value.next === "object" ? frontmatter.value.next.link : void 0) ?? ((_h = candidates[index + 1]) == null ? void 0 : _h.link)
      }
    };
  });
}
function uniqBy(array, keyFn) {
  const seen = /* @__PURE__ */ new Set();
  return array.filter((item) => {
    const k = keyFn(item);
    return seen.has(k) ? false : seen.add(k);
  });
}
const _sfc_main$Z = /* @__PURE__ */ defineComponent({
  __name: "VPLink",
  __ssrInlineRender: true,
  props: {
    tag: {},
    href: {},
    noIcon: { type: Boolean },
    target: {},
    rel: {}
  },
  setup(__props) {
    const props = __props;
    const tag = computed(() => props.tag ?? (props.href ? "a" : "span"));
    const isExternal2 = computed(
      () => props.href && EXTERNAL_URL_RE.test(props.href) || props.target === "_blank"
    );
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(tag.value), mergeProps({
        class: ["VPLink", {
          link: __props.href,
          "vp-external-link-icon": isExternal2.value,
          "no-icon": __props.noIcon
        }],
        href: __props.href ? unref(normalizeLink$1)(__props.href) : void 0,
        target: __props.target ?? (isExternal2.value ? "_blank" : void 0),
        rel: __props.rel ?? (isExternal2.value ? "noreferrer" : void 0)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "default")
            ];
          }
        }),
        _: 3
      }), _parent);
    };
  }
});
const _sfc_setup$Z = _sfc_main$Z.setup;
_sfc_main$Z.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPLink.vue");
  return _sfc_setup$Z ? _sfc_setup$Z(props, ctx) : void 0;
};
const _sfc_main$Y = /* @__PURE__ */ defineComponent({
  __name: "VPDocFooterLastUpdated",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2, page, lang } = useData();
    const date = computed(
      () => new Date(page.value.lastUpdated)
    );
    const isoDatetime = computed(() => date.value.toISOString());
    const datetime = ref("");
    onMounted(() => {
      watchEffect(() => {
        var _a, _b, _c;
        datetime.value = new Intl.DateTimeFormat(
          ((_b = (_a = theme2.value.lastUpdated) == null ? void 0 : _a.formatOptions) == null ? void 0 : _b.forceLocale) ? lang.value : void 0,
          ((_c = theme2.value.lastUpdated) == null ? void 0 : _c.formatOptions) ?? {
            dateStyle: "short",
            timeStyle: "short"
          }
        ).format(date.value);
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<p${ssrRenderAttrs(mergeProps({ class: "VPLastUpdated" }, _attrs))} data-v-280d9c5b>${ssrInterpolate(((_a = unref(theme2).lastUpdated) == null ? void 0 : _a.text) || unref(theme2).lastUpdatedText || "Last updated")}: <time${ssrRenderAttr("datetime", isoDatetime.value)} data-v-280d9c5b>${ssrInterpolate(datetime.value)}</time></p>`);
    };
  }
});
const _sfc_setup$Y = _sfc_main$Y.setup;
_sfc_main$Y.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDocFooterLastUpdated.vue");
  return _sfc_setup$Y ? _sfc_setup$Y(props, ctx) : void 0;
};
const VPDocFooterLastUpdated = /* @__PURE__ */ _export_sfc(_sfc_main$Y, [["__scopeId", "data-v-280d9c5b"]]);
const _sfc_main$X = /* @__PURE__ */ defineComponent({
  __name: "VPDocFooter",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2, page, frontmatter } = useData();
    const editLink = useEditLink();
    const control = usePrevNext();
    const hasEditLink = computed(
      () => theme2.value.editLink && frontmatter.value.editLink !== false
    );
    const hasLastUpdated = computed(() => page.value.lastUpdated);
    const showFooter = computed(
      () => hasEditLink.value || hasLastUpdated.value || control.value.prev || control.value.next
    );
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      if (showFooter.value) {
        _push(`<footer${ssrRenderAttrs(mergeProps({ class: "VPDocFooter" }, _attrs))} data-v-eb6936ba>`);
        ssrRenderSlot(_ctx.$slots, "doc-footer-before", {}, null, _push, _parent);
        if (hasEditLink.value || hasLastUpdated.value) {
          _push(`<div class="edit-info" data-v-eb6936ba>`);
          if (hasEditLink.value) {
            _push(`<div class="edit-link" data-v-eb6936ba>`);
            _push(ssrRenderComponent(_sfc_main$Z, {
              class: "edit-link-button",
              href: unref(editLink).url,
              "no-icon": true
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<span class="vpi-square-pen edit-link-icon" data-v-eb6936ba${_scopeId}></span> ${ssrInterpolate(unref(editLink).text)}`);
                } else {
                  return [
                    createVNode("span", { class: "vpi-square-pen edit-link-icon" }),
                    createTextVNode(" " + toDisplayString(unref(editLink).text), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          if (hasLastUpdated.value) {
            _push(`<div class="last-updated" data-v-eb6936ba>`);
            _push(ssrRenderComponent(VPDocFooterLastUpdated, null, null, _parent));
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (((_a = unref(control).prev) == null ? void 0 : _a.link) || ((_b = unref(control).next) == null ? void 0 : _b.link)) {
          _push(`<nav class="prev-next" aria-labelledby="doc-footer-aria-label" data-v-eb6936ba><span class="visually-hidden" id="doc-footer-aria-label" data-v-eb6936ba>Pager</span><div class="pager" data-v-eb6936ba>`);
          if ((_c = unref(control).prev) == null ? void 0 : _c.link) {
            _push(ssrRenderComponent(_sfc_main$Z, {
              class: "pager-link prev",
              href: unref(control).prev.link
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                var _a2, _b2;
                if (_push2) {
                  _push2(`<span class="desc" data-v-eb6936ba${_scopeId}>${(((_a2 = unref(theme2).docFooter) == null ? void 0 : _a2.prev) || "Previous page") ?? ""}</span><span class="title" data-v-eb6936ba${_scopeId}>${unref(control).prev.text ?? ""}</span>`);
                } else {
                  return [
                    createVNode("span", {
                      class: "desc",
                      innerHTML: ((_b2 = unref(theme2).docFooter) == null ? void 0 : _b2.prev) || "Previous page"
                    }, null, 8, ["innerHTML"]),
                    createVNode("span", {
                      class: "title",
                      innerHTML: unref(control).prev.text
                    }, null, 8, ["innerHTML"])
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="pager" data-v-eb6936ba>`);
          if ((_d = unref(control).next) == null ? void 0 : _d.link) {
            _push(ssrRenderComponent(_sfc_main$Z, {
              class: "pager-link next",
              href: unref(control).next.link
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                var _a2, _b2;
                if (_push2) {
                  _push2(`<span class="desc" data-v-eb6936ba${_scopeId}>${(((_a2 = unref(theme2).docFooter) == null ? void 0 : _a2.next) || "Next page") ?? ""}</span><span class="title" data-v-eb6936ba${_scopeId}>${unref(control).next.text ?? ""}</span>`);
                } else {
                  return [
                    createVNode("span", {
                      class: "desc",
                      innerHTML: ((_b2 = unref(theme2).docFooter) == null ? void 0 : _b2.next) || "Next page"
                    }, null, 8, ["innerHTML"]),
                    createVNode("span", {
                      class: "title",
                      innerHTML: unref(control).next.text
                    }, null, 8, ["innerHTML"])
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div></nav>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</footer>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$X = _sfc_main$X.setup;
_sfc_main$X.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDocFooter.vue");
  return _sfc_setup$X ? _sfc_setup$X(props, ctx) : void 0;
};
const VPDocFooter = /* @__PURE__ */ _export_sfc(_sfc_main$X, [["__scopeId", "data-v-eb6936ba"]]);
const _sfc_main$W = /* @__PURE__ */ defineComponent({
  __name: "VPDoc",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    const route = useRoute();
    const { hasSidebar, hasAside, leftAside } = useSidebar();
    const pageName = computed(
      () => route.path.replace(/[./]+/g, "_").replace(/_html$/, "")
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Content = resolveComponent("Content");
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPDoc", { "has-sidebar": unref(hasSidebar), "has-aside": unref(hasAside) }]
      }, _attrs))} data-v-337a36fe>`);
      ssrRenderSlot(_ctx.$slots, "doc-top", {}, null, _push, _parent);
      _push(`<div class="container" data-v-337a36fe>`);
      if (unref(hasAside)) {
        _push(`<div class="${ssrRenderClass([{ "left-aside": unref(leftAside) }, "aside"])}" data-v-337a36fe><div class="aside-curtain" data-v-337a36fe></div><div class="aside-container" data-v-337a36fe><div class="aside-content" data-v-337a36fe>`);
        _push(ssrRenderComponent(VPDocAside, null, {
          "aside-top": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-top", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-top", {}, void 0, true)
              ];
            }
          }),
          "aside-bottom": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-bottom", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-bottom", {}, void 0, true)
              ];
            }
          }),
          "aside-outline-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-outline-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-outline-before", {}, void 0, true)
              ];
            }
          }),
          "aside-outline-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-outline-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-outline-after", {}, void 0, true)
              ];
            }
          }),
          "aside-ads-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-ads-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-ads-before", {}, void 0, true)
              ];
            }
          }),
          "aside-ads-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-ads-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-ads-after", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="content" data-v-337a36fe><div class="content-container" data-v-337a36fe>`);
      ssrRenderSlot(_ctx.$slots, "doc-before", {}, null, _push, _parent);
      _push(`<main class="main" data-v-337a36fe>`);
      _push(ssrRenderComponent(_component_Content, {
        class: ["vp-doc", [
          pageName.value,
          unref(theme2).externalLinkIcon && "external-link-icon-enabled"
        ]]
      }, null, _parent));
      _push(`</main>`);
      _push(ssrRenderComponent(VPDocFooter, null, {
        "doc-footer-before": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "doc-footer-before", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "doc-footer-before", {}, void 0, true)
            ];
          }
        }),
        _: 3
      }, _parent));
      ssrRenderSlot(_ctx.$slots, "doc-after", {}, null, _push, _parent);
      _push(`</div></div></div>`);
      ssrRenderSlot(_ctx.$slots, "doc-bottom", {}, null, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$W = _sfc_main$W.setup;
_sfc_main$W.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDoc.vue");
  return _sfc_setup$W ? _sfc_setup$W(props, ctx) : void 0;
};
const VPDoc = /* @__PURE__ */ _export_sfc(_sfc_main$W, [["__scopeId", "data-v-337a36fe"]]);
const _sfc_main$V = /* @__PURE__ */ defineComponent({
  __name: "VPButton",
  __ssrInlineRender: true,
  props: {
    tag: {},
    size: { default: "medium" },
    theme: { default: "brand" },
    text: {},
    href: {},
    target: {},
    rel: {}
  },
  setup(__props) {
    const props = __props;
    const isExternal2 = computed(
      () => props.href && EXTERNAL_URL_RE.test(props.href)
    );
    const component = computed(() => {
      return props.tag || (props.href ? "a" : "button");
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(component.value), mergeProps({
        class: ["VPButton", [__props.size, __props.theme]],
        href: __props.href ? unref(normalizeLink$1)(__props.href) : void 0,
        target: props.target ?? (isExternal2.value ? "_blank" : void 0),
        rel: props.rel ?? (isExternal2.value ? "noreferrer" : void 0)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(__props.text)}`);
          } else {
            return [
              createTextVNode(toDisplayString(__props.text), 1)
            ];
          }
        }),
        _: 1
      }), _parent);
    };
  }
});
const _sfc_setup$V = _sfc_main$V.setup;
_sfc_main$V.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPButton.vue");
  return _sfc_setup$V ? _sfc_setup$V(props, ctx) : void 0;
};
const VPButton = /* @__PURE__ */ _export_sfc(_sfc_main$V, [["__scopeId", "data-v-201b13d4"]]);
const _sfc_main$U = /* @__PURE__ */ defineComponent({
  ...{ inheritAttrs: false },
  __name: "VPImage",
  __ssrInlineRender: true,
  props: {
    image: {},
    alt: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_VPImage = resolveComponent("VPImage", true);
      if (__props.image) {
        _push(`<!--[-->`);
        if (typeof __props.image === "string" || "src" in __props.image) {
          _push(`<img${ssrRenderAttrs(mergeProps({ class: "VPImage" }, typeof __props.image === "string" ? _ctx.$attrs : { ...__props.image, ..._ctx.$attrs }, {
            src: unref(withBase)(typeof __props.image === "string" ? __props.image : __props.image.src),
            alt: __props.alt ?? (typeof __props.image === "string" ? "" : __props.image.alt || "")
          }))} data-v-03b826d2>`);
        } else {
          _push(`<!--[-->`);
          _push(ssrRenderComponent(_component_VPImage, mergeProps({
            class: "dark",
            image: __props.image.dark,
            alt: __props.image.alt
          }, _ctx.$attrs), null, _parent));
          _push(ssrRenderComponent(_component_VPImage, mergeProps({
            class: "light",
            image: __props.image.light,
            alt: __props.image.alt
          }, _ctx.$attrs), null, _parent));
          _push(`<!--]-->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$U = _sfc_main$U.setup;
_sfc_main$U.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPImage.vue");
  return _sfc_setup$U ? _sfc_setup$U(props, ctx) : void 0;
};
const VPImage = /* @__PURE__ */ _export_sfc(_sfc_main$U, [["__scopeId", "data-v-03b826d2"]]);
const _sfc_main$T = /* @__PURE__ */ defineComponent({
  __name: "VPHero",
  __ssrInlineRender: true,
  props: {
    name: {},
    text: {},
    tagline: {},
    image: {},
    actions: {}
  },
  setup(__props) {
    const heroImageSlotExists = inject("hero-image-slot-exists");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPHero", { "has-image": __props.image || unref(heroImageSlotExists) }]
      }, _attrs))} data-v-1c9cb5ba><div class="container" data-v-1c9cb5ba><div class="main" data-v-1c9cb5ba>`);
      ssrRenderSlot(_ctx.$slots, "home-hero-info-before", {}, null, _push, _parent);
      ssrRenderSlot(_ctx.$slots, "home-hero-info", {}, () => {
        _push(`<h1 class="heading" data-v-1c9cb5ba>`);
        if (__props.name) {
          _push(`<span class="name clip" data-v-1c9cb5ba>${__props.name ?? ""}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.text) {
          _push(`<span class="text" data-v-1c9cb5ba>${__props.text ?? ""}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</h1>`);
        if (__props.tagline) {
          _push(`<p class="tagline" data-v-1c9cb5ba>${__props.tagline ?? ""}</p>`);
        } else {
          _push(`<!---->`);
        }
      }, _push, _parent);
      ssrRenderSlot(_ctx.$slots, "home-hero-info-after", {}, null, _push, _parent);
      if (__props.actions) {
        _push(`<div class="actions" data-v-1c9cb5ba><!--[-->`);
        ssrRenderList(__props.actions, (action) => {
          _push(`<div class="action" data-v-1c9cb5ba>`);
          _push(ssrRenderComponent(VPButton, {
            tag: "a",
            size: "medium",
            theme: action.theme,
            text: action.text,
            href: action.link,
            target: action.target,
            rel: action.rel
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "home-hero-actions-after", {}, null, _push, _parent);
      _push(`</div>`);
      if (__props.image || unref(heroImageSlotExists)) {
        _push(`<div class="image" data-v-1c9cb5ba><div class="image-container" data-v-1c9cb5ba><div class="image-bg" data-v-1c9cb5ba></div>`);
        ssrRenderSlot(_ctx.$slots, "home-hero-image", {}, () => {
          if (__props.image) {
            _push(ssrRenderComponent(VPImage, {
              class: "image-src",
              image: __props.image
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
        }, _push, _parent);
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$T = _sfc_main$T.setup;
_sfc_main$T.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPHero.vue");
  return _sfc_setup$T ? _sfc_setup$T(props, ctx) : void 0;
};
const VPHero = /* @__PURE__ */ _export_sfc(_sfc_main$T, [["__scopeId", "data-v-1c9cb5ba"]]);
const _sfc_main$S = /* @__PURE__ */ defineComponent({
  __name: "VPHomeHero",
  __ssrInlineRender: true,
  setup(__props) {
    const { frontmatter: fm } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(fm).hero) {
        _push(ssrRenderComponent(VPHero, mergeProps({
          class: "VPHomeHero",
          name: unref(fm).hero.name,
          text: unref(fm).hero.text,
          tagline: unref(fm).hero.tagline,
          image: unref(fm).hero.image,
          actions: unref(fm).hero.actions
        }, _attrs), {
          "home-hero-info-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info-before")
              ];
            }
          }),
          "home-hero-info": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info")
              ];
            }
          }),
          "home-hero-info-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info-after")
              ];
            }
          }),
          "home-hero-actions-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-actions-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-actions-after")
              ];
            }
          }),
          "home-hero-image": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-image", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-image")
              ];
            }
          }),
          _: 3
        }, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$S = _sfc_main$S.setup;
_sfc_main$S.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPHomeHero.vue");
  return _sfc_setup$S ? _sfc_setup$S(props, ctx) : void 0;
};
const _sfc_main$R = /* @__PURE__ */ defineComponent({
  __name: "VPFeature",
  __ssrInlineRender: true,
  props: {
    icon: {},
    title: {},
    details: {},
    link: {},
    linkText: {},
    rel: {},
    target: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$Z, mergeProps({
        class: "VPFeature",
        href: __props.link,
        rel: __props.rel,
        target: __props.target,
        "no-icon": true,
        tag: __props.link ? "a" : "div"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<article class="box" data-v-515a9d62${_scopeId}>`);
            if (typeof __props.icon === "object" && __props.icon.wrap) {
              _push2(`<div class="icon" data-v-515a9d62${_scopeId}>`);
              _push2(ssrRenderComponent(VPImage, {
                image: __props.icon,
                alt: __props.icon.alt,
                height: __props.icon.height || 48,
                width: __props.icon.width || 48
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else if (typeof __props.icon === "object") {
              _push2(ssrRenderComponent(VPImage, {
                image: __props.icon,
                alt: __props.icon.alt,
                height: __props.icon.height || 48,
                width: __props.icon.width || 48
              }, null, _parent2, _scopeId));
            } else if (__props.icon) {
              _push2(`<div class="icon" data-v-515a9d62${_scopeId}>${__props.icon ?? ""}</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<h2 class="title" data-v-515a9d62${_scopeId}>${__props.title ?? ""}</h2>`);
            if (__props.details) {
              _push2(`<p class="details" data-v-515a9d62${_scopeId}>${__props.details ?? ""}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.linkText) {
              _push2(`<div class="link-text" data-v-515a9d62${_scopeId}><p class="link-text-value" data-v-515a9d62${_scopeId}>${ssrInterpolate(__props.linkText)} <span class="vpi-arrow-right link-text-icon" data-v-515a9d62${_scopeId}></span></p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</article>`);
          } else {
            return [
              createVNode("article", { class: "box" }, [
                typeof __props.icon === "object" && __props.icon.wrap ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "icon"
                }, [
                  createVNode(VPImage, {
                    image: __props.icon,
                    alt: __props.icon.alt,
                    height: __props.icon.height || 48,
                    width: __props.icon.width || 48
                  }, null, 8, ["image", "alt", "height", "width"])
                ])) : typeof __props.icon === "object" ? (openBlock(), createBlock(VPImage, {
                  key: 1,
                  image: __props.icon,
                  alt: __props.icon.alt,
                  height: __props.icon.height || 48,
                  width: __props.icon.width || 48
                }, null, 8, ["image", "alt", "height", "width"])) : __props.icon ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "icon",
                  innerHTML: __props.icon
                }, null, 8, ["innerHTML"])) : createCommentVNode("", true),
                createVNode("h2", {
                  class: "title",
                  innerHTML: __props.title
                }, null, 8, ["innerHTML"]),
                __props.details ? (openBlock(), createBlock("p", {
                  key: 3,
                  class: "details",
                  innerHTML: __props.details
                }, null, 8, ["innerHTML"])) : createCommentVNode("", true),
                __props.linkText ? (openBlock(), createBlock("div", {
                  key: 4,
                  class: "link-text"
                }, [
                  createVNode("p", { class: "link-text-value" }, [
                    createTextVNode(toDisplayString(__props.linkText) + " ", 1),
                    createVNode("span", { class: "vpi-arrow-right link-text-icon" })
                  ])
                ])) : createCommentVNode("", true)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$R = _sfc_main$R.setup;
_sfc_main$R.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPFeature.vue");
  return _sfc_setup$R ? _sfc_setup$R(props, ctx) : void 0;
};
const VPFeature = /* @__PURE__ */ _export_sfc(_sfc_main$R, [["__scopeId", "data-v-515a9d62"]]);
const _sfc_main$Q = /* @__PURE__ */ defineComponent({
  __name: "VPFeatures",
  __ssrInlineRender: true,
  props: {
    features: {}
  },
  setup(__props) {
    const props = __props;
    const grid = computed(() => {
      const length = props.features.length;
      if (!length) {
        return;
      } else if (length === 2) {
        return "grid-2";
      } else if (length === 3) {
        return "grid-3";
      } else if (length % 3 === 0) {
        return "grid-6";
      } else if (length > 3) {
        return "grid-4";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.features) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPFeatures" }, _attrs))} data-v-48244469><div class="container" data-v-48244469><div class="items" data-v-48244469><!--[-->`);
        ssrRenderList(__props.features, (feature) => {
          _push(`<div class="${ssrRenderClass([[grid.value], "item"])}" data-v-48244469>`);
          _push(ssrRenderComponent(VPFeature, {
            icon: feature.icon,
            title: feature.title,
            details: feature.details,
            link: feature.link,
            "link-text": feature.linkText,
            rel: feature.rel,
            target: feature.target
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$Q = _sfc_main$Q.setup;
_sfc_main$Q.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPFeatures.vue");
  return _sfc_setup$Q ? _sfc_setup$Q(props, ctx) : void 0;
};
const VPFeatures = /* @__PURE__ */ _export_sfc(_sfc_main$Q, [["__scopeId", "data-v-48244469"]]);
const _sfc_main$P = /* @__PURE__ */ defineComponent({
  __name: "VPHomeFeatures",
  __ssrInlineRender: true,
  setup(__props) {
    const { frontmatter: fm } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(fm).features) {
        _push(ssrRenderComponent(VPFeatures, mergeProps({
          class: "VPHomeFeatures",
          features: unref(fm).features
        }, _attrs), null, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$P = _sfc_main$P.setup;
_sfc_main$P.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPHomeFeatures.vue");
  return _sfc_setup$P ? _sfc_setup$P(props, ctx) : void 0;
};
const _sfc_main$O = /* @__PURE__ */ defineComponent({
  __name: "VPHomeContent",
  __ssrInlineRender: true,
  setup(__props) {
    const { width: vw } = useWindowSize({
      initialWidth: 0,
      includeScrollbar: false
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "vp-doc container",
        style: unref(vw) ? { "--vp-offset": `calc(50% - ${unref(vw) / 2}px)` } : {}
      }, _attrs))} data-v-cf31c882>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$O = _sfc_main$O.setup;
_sfc_main$O.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPHomeContent.vue");
  return _sfc_setup$O ? _sfc_setup$O(props, ctx) : void 0;
};
const VPHomeContent = /* @__PURE__ */ _export_sfc(_sfc_main$O, [["__scopeId", "data-v-cf31c882"]]);
const _sfc_main$N = /* @__PURE__ */ defineComponent({
  __name: "VPHome",
  __ssrInlineRender: true,
  setup(__props) {
    const { frontmatter, theme: theme2 } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Content = resolveComponent("Content");
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPHome", {
          "external-link-icon-enabled": unref(theme2).externalLinkIcon
        }]
      }, _attrs))} data-v-9269f272>`);
      ssrRenderSlot(_ctx.$slots, "home-hero-before", {}, null, _push, _parent);
      _push(ssrRenderComponent(_sfc_main$S, null, {
        "home-hero-info-before": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "home-hero-info-before", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "home-hero-info-before", {}, void 0, true)
            ];
          }
        }),
        "home-hero-info": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "home-hero-info", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "home-hero-info", {}, void 0, true)
            ];
          }
        }),
        "home-hero-info-after": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "home-hero-info-after", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "home-hero-info-after", {}, void 0, true)
            ];
          }
        }),
        "home-hero-actions-after": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "home-hero-actions-after", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "home-hero-actions-after", {}, void 0, true)
            ];
          }
        }),
        "home-hero-image": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "home-hero-image", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "home-hero-image", {}, void 0, true)
            ];
          }
        }),
        _: 3
      }, _parent));
      ssrRenderSlot(_ctx.$slots, "home-hero-after", {}, null, _push, _parent);
      ssrRenderSlot(_ctx.$slots, "home-features-before", {}, null, _push, _parent);
      _push(ssrRenderComponent(_sfc_main$P, null, null, _parent));
      ssrRenderSlot(_ctx.$slots, "home-features-after", {}, null, _push, _parent);
      if (unref(frontmatter).markdownStyles !== false) {
        _push(ssrRenderComponent(VPHomeContent, null, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_Content, null, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_Content)
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(ssrRenderComponent(_component_Content, null, null, _parent));
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$N = _sfc_main$N.setup;
_sfc_main$N.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPHome.vue");
  return _sfc_setup$N ? _sfc_setup$N(props, ctx) : void 0;
};
const VPHome = /* @__PURE__ */ _export_sfc(_sfc_main$N, [["__scopeId", "data-v-9269f272"]]);
const _sfc_main$M = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  const _component_Content = resolveComponent("Content");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPPage" }, _attrs))}>`);
  ssrRenderSlot(_ctx.$slots, "page-top", {}, null, _push, _parent);
  _push(ssrRenderComponent(_component_Content, null, null, _parent));
  ssrRenderSlot(_ctx.$slots, "page-bottom", {}, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$M = _sfc_main$M.setup;
_sfc_main$M.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPPage.vue");
  return _sfc_setup$M ? _sfc_setup$M(props, ctx) : void 0;
};
const VPPage = /* @__PURE__ */ _export_sfc(_sfc_main$M, [["ssrRender", _sfc_ssrRender$1]]);
const _sfc_main$L = /* @__PURE__ */ defineComponent({
  __name: "VPContent",
  __ssrInlineRender: true,
  setup(__props) {
    const { page, frontmatter } = useData();
    const { hasSidebar } = useSidebar();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPContent", {
          "has-sidebar": unref(hasSidebar),
          "is-home": unref(frontmatter).layout === "home"
        }],
        id: "VPContent"
      }, _attrs))} data-v-27908459>`);
      if (unref(page).isNotFound) {
        ssrRenderSlot(_ctx.$slots, "not-found", {}, () => {
          _push(ssrRenderComponent(NotFound, null, null, _parent));
        }, _push, _parent);
      } else if (unref(frontmatter).layout === "page") {
        _push(ssrRenderComponent(VPPage, null, {
          "page-top": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "page-top", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "page-top", {}, void 0, true)
              ];
            }
          }),
          "page-bottom": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "page-bottom", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "page-bottom", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
      } else if (unref(frontmatter).layout === "home") {
        _push(ssrRenderComponent(VPHome, null, {
          "home-hero-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-before", {}, void 0, true)
              ];
            }
          }),
          "home-hero-info-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info-before", {}, void 0, true)
              ];
            }
          }),
          "home-hero-info": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info", {}, void 0, true)
              ];
            }
          }),
          "home-hero-info-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info-after", {}, void 0, true)
              ];
            }
          }),
          "home-hero-actions-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-actions-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-actions-after", {}, void 0, true)
              ];
            }
          }),
          "home-hero-image": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-image", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-image", {}, void 0, true)
              ];
            }
          }),
          "home-hero-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-after", {}, void 0, true)
              ];
            }
          }),
          "home-features-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-features-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-features-before", {}, void 0, true)
              ];
            }
          }),
          "home-features-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-features-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-features-after", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
      } else if (unref(frontmatter).layout && unref(frontmatter).layout !== "doc") {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(frontmatter).layout), null, null), _parent);
      } else {
        _push(ssrRenderComponent(VPDoc, null, {
          "doc-top": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-top", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-top", {}, void 0, true)
              ];
            }
          }),
          "doc-bottom": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-bottom", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-bottom", {}, void 0, true)
              ];
            }
          }),
          "doc-footer-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-footer-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-footer-before", {}, void 0, true)
              ];
            }
          }),
          "doc-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-before", {}, void 0, true)
              ];
            }
          }),
          "doc-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-after", {}, void 0, true)
              ];
            }
          }),
          "aside-top": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-top", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-top", {}, void 0, true)
              ];
            }
          }),
          "aside-outline-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-outline-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-outline-before", {}, void 0, true)
              ];
            }
          }),
          "aside-outline-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-outline-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-outline-after", {}, void 0, true)
              ];
            }
          }),
          "aside-ads-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-ads-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-ads-before", {}, void 0, true)
              ];
            }
          }),
          "aside-ads-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-ads-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-ads-after", {}, void 0, true)
              ];
            }
          }),
          "aside-bottom": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-bottom", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-bottom", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$L = _sfc_main$L.setup;
_sfc_main$L.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPContent.vue");
  return _sfc_setup$L ? _sfc_setup$L(props, ctx) : void 0;
};
const VPContent = /* @__PURE__ */ _export_sfc(_sfc_main$L, [["__scopeId", "data-v-27908459"]]);
const _sfc_main$K = /* @__PURE__ */ defineComponent({
  __name: "VPFooter",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2, frontmatter } = useData();
    const { hasSidebar } = useSidebar();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(theme2).footer && unref(frontmatter).footer !== false) {
        _push(`<footer${ssrRenderAttrs(mergeProps({
          class: ["VPFooter", { "has-sidebar": unref(hasSidebar) }]
        }, _attrs))} data-v-2f77aed0><div class="container" data-v-2f77aed0>`);
        if (unref(theme2).footer.message) {
          _push(`<p class="message" data-v-2f77aed0>${unref(theme2).footer.message ?? ""}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(theme2).footer.copyright) {
          _push(`<p class="copyright" data-v-2f77aed0>${unref(theme2).footer.copyright ?? ""}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></footer>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$K = _sfc_main$K.setup;
_sfc_main$K.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPFooter.vue");
  return _sfc_setup$K ? _sfc_setup$K(props, ctx) : void 0;
};
const VPFooter = /* @__PURE__ */ _export_sfc(_sfc_main$K, [["__scopeId", "data-v-2f77aed0"]]);
function useLocalNav() {
  const { theme: theme2, frontmatter } = useData();
  const headers = shallowRef([]);
  const hasLocalNav = computed(() => {
    return headers.value.length > 0;
  });
  onContentUpdated(() => {
    headers.value = getHeaders(frontmatter.value.outline ?? theme2.value.outline);
  });
  return {
    headers,
    hasLocalNav
  };
}
const _sfc_main$J = /* @__PURE__ */ defineComponent({
  __name: "VPLocalNavOutlineDropdown",
  __ssrInlineRender: true,
  props: {
    headers: {},
    navHeight: {}
  },
  setup(__props) {
    const { theme: theme2 } = useData();
    const open = ref(false);
    const vh = ref(0);
    const main = ref();
    ref();
    function closeOnClickOutside(e) {
      var _a;
      if (!((_a = main.value) == null ? void 0 : _a.contains(e.target))) {
        open.value = false;
      }
    }
    watch(open, (value) => {
      if (value) {
        document.addEventListener("click", closeOnClickOutside);
        return;
      }
      document.removeEventListener("click", closeOnClickOutside);
    });
    onKeyStroke("Escape", () => {
      open.value = false;
    });
    onContentUpdated(() => {
      open.value = false;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "VPLocalNavOutlineDropdown",
        style: { "--vp-vh": vh.value + "px" },
        ref_key: "main",
        ref: main
      }, _attrs))} data-v-4b30ba3c>`);
      if (__props.headers.length > 0) {
        _push(`<button class="${ssrRenderClass({ open: open.value })}" data-v-4b30ba3c><span class="menu-text" data-v-4b30ba3c>${ssrInterpolate(unref(resolveTitle)(unref(theme2)))}</span><span class="vpi-chevron-right icon" data-v-4b30ba3c></span></button>`);
      } else {
        _push(`<button data-v-4b30ba3c>${ssrInterpolate(unref(theme2).returnToTopLabel || "Return to top")}</button>`);
      }
      if (open.value) {
        _push(`<div class="items" data-v-4b30ba3c><div class="header" data-v-4b30ba3c><a class="top-link" href="#" data-v-4b30ba3c>${ssrInterpolate(unref(theme2).returnToTopLabel || "Return to top")}</a></div><div class="outline" data-v-4b30ba3c>`);
        _push(ssrRenderComponent(VPDocOutlineItem, { headers: __props.headers }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$J = _sfc_main$J.setup;
_sfc_main$J.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPLocalNavOutlineDropdown.vue");
  return _sfc_setup$J ? _sfc_setup$J(props, ctx) : void 0;
};
const VPLocalNavOutlineDropdown = /* @__PURE__ */ _export_sfc(_sfc_main$J, [["__scopeId", "data-v-4b30ba3c"]]);
const _sfc_main$I = /* @__PURE__ */ defineComponent({
  __name: "VPLocalNav",
  __ssrInlineRender: true,
  props: {
    open: { type: Boolean }
  },
  emits: ["open-menu"],
  setup(__props) {
    const { theme: theme2, frontmatter } = useData();
    const { hasSidebar } = useSidebar();
    const { headers } = useLocalNav();
    const { y } = useWindowScroll();
    const navHeight = ref(0);
    onMounted(() => {
      navHeight.value = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--vp-nav-height"
        )
      );
    });
    onContentUpdated(() => {
      headers.value = getHeaders(frontmatter.value.outline ?? theme2.value.outline);
    });
    const empty = computed(() => {
      return headers.value.length === 0;
    });
    const emptyAndNoSidebar = computed(() => {
      return empty.value && !hasSidebar.value;
    });
    const classes = computed(() => {
      return {
        VPLocalNav: true,
        "has-sidebar": hasSidebar.value,
        empty: empty.value,
        fixed: emptyAndNoSidebar.value
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(frontmatter).layout !== "home" && (!emptyAndNoSidebar.value || unref(y) >= navHeight.value)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: classes.value }, _attrs))} data-v-03a37c4c><div class="container" data-v-03a37c4c>`);
        if (unref(hasSidebar)) {
          _push(`<button class="menu"${ssrRenderAttr("aria-expanded", __props.open)} aria-controls="VPSidebarNav" data-v-03a37c4c><span class="vpi-align-left menu-icon" data-v-03a37c4c></span><span class="menu-text" data-v-03a37c4c>${ssrInterpolate(unref(theme2).sidebarMenuLabel || "Menu")}</span></button>`);
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(VPLocalNavOutlineDropdown, {
          headers: unref(headers),
          navHeight: navHeight.value
        }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$I = _sfc_main$I.setup;
_sfc_main$I.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPLocalNav.vue");
  return _sfc_setup$I ? _sfc_setup$I(props, ctx) : void 0;
};
const VPLocalNav = /* @__PURE__ */ _export_sfc(_sfc_main$I, [["__scopeId", "data-v-03a37c4c"]]);
function useNav() {
  const isScreenOpen = ref(false);
  function openScreen() {
    isScreenOpen.value = true;
    window.addEventListener("resize", closeScreenOnTabletWindow);
  }
  function closeScreen() {
    isScreenOpen.value = false;
    window.removeEventListener("resize", closeScreenOnTabletWindow);
  }
  function toggleScreen() {
    isScreenOpen.value ? closeScreen() : openScreen();
  }
  function closeScreenOnTabletWindow() {
    window.outerWidth >= 768 && closeScreen();
  }
  const route = useRoute();
  watch(() => route.path, closeScreen);
  return {
    isScreenOpen,
    openScreen,
    closeScreen,
    toggleScreen
  };
}
const _sfc_main$H = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<button${ssrRenderAttrs(mergeProps({
    class: "VPSwitch",
    type: "button",
    role: "switch"
  }, _attrs))} data-v-676783a0><span class="check" data-v-676783a0>`);
  if (_ctx.$slots.default) {
    _push(`<span class="icon" data-v-676783a0>`);
    ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
    _push(`</span>`);
  } else {
    _push(`<!---->`);
  }
  _push(`</span></button>`);
}
const _sfc_setup$H = _sfc_main$H.setup;
_sfc_main$H.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSwitch.vue");
  return _sfc_setup$H ? _sfc_setup$H(props, ctx) : void 0;
};
const VPSwitch = /* @__PURE__ */ _export_sfc(_sfc_main$H, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-676783a0"]]);
const _sfc_main$G = /* @__PURE__ */ defineComponent({
  __name: "VPSwitchAppearance",
  __ssrInlineRender: true,
  setup(__props) {
    const { isDark, theme: theme2 } = useData();
    const toggleAppearance = inject("toggle-appearance", () => {
      isDark.value = !isDark.value;
    });
    const switchTitle = ref("");
    watchPostEffect(() => {
      switchTitle.value = isDark.value ? theme2.value.lightModeSwitchTitle || "Switch to light theme" : theme2.value.darkModeSwitchTitle || "Switch to dark theme";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(VPSwitch, mergeProps({
        title: switchTitle.value,
        class: "VPSwitchAppearance",
        "aria-checked": unref(isDark),
        onClick: unref(toggleAppearance)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="vpi-sun sun" data-v-b1901732${_scopeId}></span><span class="vpi-moon moon" data-v-b1901732${_scopeId}></span>`);
          } else {
            return [
              createVNode("span", { class: "vpi-sun sun" }),
              createVNode("span", { class: "vpi-moon moon" })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$G = _sfc_main$G.setup;
_sfc_main$G.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSwitchAppearance.vue");
  return _sfc_setup$G ? _sfc_setup$G(props, ctx) : void 0;
};
const VPSwitchAppearance = /* @__PURE__ */ _export_sfc(_sfc_main$G, [["__scopeId", "data-v-b1901732"]]);
const _sfc_main$F = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarAppearance",
  __ssrInlineRender: true,
  setup(__props) {
    const { site } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(site).appearance && unref(site).appearance !== "force-dark" && unref(site).appearance !== "force-auto") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPNavBarAppearance" }, _attrs))} data-v-57c39857>`);
        _push(ssrRenderComponent(VPSwitchAppearance, null, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$F = _sfc_main$F.setup;
_sfc_main$F.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarAppearance.vue");
  return _sfc_setup$F ? _sfc_setup$F(props, ctx) : void 0;
};
const VPNavBarAppearance = /* @__PURE__ */ _export_sfc(_sfc_main$F, [["__scopeId", "data-v-57c39857"]]);
const focusedElement = ref();
let active = false;
let listeners = 0;
function useFlyout(options) {
  const focus = ref(false);
  if (inBrowser) {
    !active && activateFocusTracking();
    listeners++;
    const unwatch = watch(focusedElement, (el2) => {
      var _a, _b, _c;
      if (el2 === options.el.value || ((_a = options.el.value) == null ? void 0 : _a.contains(el2))) {
        focus.value = true;
        (_b = options.onFocus) == null ? void 0 : _b.call(options);
      } else {
        focus.value = false;
        (_c = options.onBlur) == null ? void 0 : _c.call(options);
      }
    });
    onUnmounted(() => {
      unwatch();
      listeners--;
      if (!listeners) {
        deactivateFocusTracking();
      }
    });
  }
  return readonly(focus);
}
function activateFocusTracking() {
  document.addEventListener("focusin", handleFocusIn);
  active = true;
  focusedElement.value = document.activeElement;
}
function deactivateFocusTracking() {
  document.removeEventListener("focusin", handleFocusIn);
}
function handleFocusIn() {
  focusedElement.value = document.activeElement;
}
const _sfc_main$E = /* @__PURE__ */ defineComponent({
  __name: "VPMenuLink",
  __ssrInlineRender: true,
  props: {
    item: {}
  },
  setup(__props) {
    const { page } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPMenuLink" }, _attrs))} data-v-75b71e5d>`);
      _push(ssrRenderComponent(_sfc_main$Z, {
        class: {
          active: unref(isActive)(
            unref(page).relativePath,
            __props.item.activeMatch || __props.item.link,
            !!__props.item.activeMatch
          )
        },
        href: __props.item.link,
        target: __props.item.target,
        rel: __props.item.rel,
        "no-icon": __props.item.noIcon
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span data-v-75b71e5d${_scopeId}>${__props.item.text ?? ""}</span>`);
          } else {
            return [
              createVNode("span", {
                innerHTML: __props.item.text
              }, null, 8, ["innerHTML"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$E = _sfc_main$E.setup;
_sfc_main$E.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPMenuLink.vue");
  return _sfc_setup$E ? _sfc_setup$E(props, ctx) : void 0;
};
const VPMenuLink = /* @__PURE__ */ _export_sfc(_sfc_main$E, [["__scopeId", "data-v-75b71e5d"]]);
const _sfc_main$D = /* @__PURE__ */ defineComponent({
  __name: "VPMenuGroup",
  __ssrInlineRender: true,
  props: {
    text: {},
    items: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPMenuGroup" }, _attrs))} data-v-72cf68c0>`);
      if (__props.text) {
        _push(`<p class="title" data-v-72cf68c0>${ssrInterpolate(__props.text)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(__props.items, (item) => {
        _push(`<!--[-->`);
        if ("link" in item) {
          _push(ssrRenderComponent(VPMenuLink, { item }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$D = _sfc_main$D.setup;
_sfc_main$D.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPMenuGroup.vue");
  return _sfc_setup$D ? _sfc_setup$D(props, ctx) : void 0;
};
const VPMenuGroup = /* @__PURE__ */ _export_sfc(_sfc_main$D, [["__scopeId", "data-v-72cf68c0"]]);
const _sfc_main$C = /* @__PURE__ */ defineComponent({
  __name: "VPMenu",
  __ssrInlineRender: true,
  props: {
    items: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPMenu" }, _attrs))} data-v-ec14f35b>`);
      if (__props.items) {
        _push(`<div class="items" data-v-ec14f35b><!--[-->`);
        ssrRenderList(__props.items, (item) => {
          _push(`<!--[-->`);
          if ("link" in item) {
            _push(ssrRenderComponent(VPMenuLink, { item }, null, _parent));
          } else if ("component" in item) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.component), mergeProps({ ref_for: true }, item.props), null), _parent);
          } else {
            _push(ssrRenderComponent(VPMenuGroup, {
              text: item.text,
              items: item.items
            }, null, _parent));
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$C = _sfc_main$C.setup;
_sfc_main$C.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPMenu.vue");
  return _sfc_setup$C ? _sfc_setup$C(props, ctx) : void 0;
};
const VPMenu = /* @__PURE__ */ _export_sfc(_sfc_main$C, [["__scopeId", "data-v-ec14f35b"]]);
const _sfc_main$B = /* @__PURE__ */ defineComponent({
  __name: "VPFlyout",
  __ssrInlineRender: true,
  props: {
    icon: {},
    button: {},
    label: {},
    items: {}
  },
  setup(__props) {
    const open = ref(false);
    const el2 = ref();
    useFlyout({ el: el2, onBlur });
    function onBlur() {
      open.value = false;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "VPFlyout",
        ref_key: "el",
        ref: el2
      }, _attrs))} data-v-a37614ba><button type="button" class="button" aria-haspopup="true"${ssrRenderAttr("aria-expanded", open.value)}${ssrRenderAttr("aria-label", __props.label)} data-v-a37614ba>`);
      if (__props.button || __props.icon) {
        _push(`<span class="text" data-v-a37614ba>`);
        if (__props.icon) {
          _push(`<span class="${ssrRenderClass([__props.icon, "option-icon"])}" data-v-a37614ba></span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.button) {
          _push(`<span data-v-a37614ba>${__props.button ?? ""}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span class="vpi-chevron-down text-icon" data-v-a37614ba></span></span>`);
      } else {
        _push(`<span class="vpi-more-horizontal icon" data-v-a37614ba></span>`);
      }
      _push(`</button><div class="menu" data-v-a37614ba>`);
      _push(ssrRenderComponent(VPMenu, { items: __props.items }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "default", {}, void 0, true)
            ];
          }
        }),
        _: 3
      }, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$B = _sfc_main$B.setup;
_sfc_main$B.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPFlyout.vue");
  return _sfc_setup$B ? _sfc_setup$B(props, ctx) : void 0;
};
const VPFlyout = /* @__PURE__ */ _export_sfc(_sfc_main$B, [["__scopeId", "data-v-a37614ba"]]);
const _sfc_main$A = /* @__PURE__ */ defineComponent({
  __name: "VPSocialLink",
  __ssrInlineRender: true,
  props: {
    icon: {},
    link: {},
    ariaLabel: {}
  },
  setup(__props) {
    var _a;
    const props = __props;
    const el2 = ref();
    onMounted(async () => {
      var _a2;
      await nextTick();
      const span = (_a2 = el2.value) == null ? void 0 : _a2.children[0];
      if (span instanceof HTMLElement && span.className.startsWith("vpi-social-") && (getComputedStyle(span).maskImage || getComputedStyle(span).webkitMaskImage) === "none") {
        span.style.setProperty(
          "--icon",
          `url('https://api.iconify.design/simple-icons/${props.icon}.svg')`
        );
      }
    });
    const svg = computed(() => {
      if (typeof props.icon === "object") return props.icon.svg;
      return `<span class="vpi-social-${props.icon}"></span>`;
    });
    {
      typeof props.icon === "string" && ((_a = useSSRContext()) == null ? void 0 : _a.vpSocialIcons.add(props.icon));
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<a${ssrRenderAttrs(mergeProps({
        ref_key: "el",
        ref: el2,
        class: "VPSocialLink no-icon",
        href: __props.link,
        "aria-label": __props.ariaLabel ?? (typeof __props.icon === "string" ? __props.icon : ""),
        target: "_blank",
        rel: "noopener"
      }, _attrs))} data-v-7db59132>${svg.value ?? ""}</a>`);
    };
  }
});
const _sfc_setup$A = _sfc_main$A.setup;
_sfc_main$A.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSocialLink.vue");
  return _sfc_setup$A ? _sfc_setup$A(props, ctx) : void 0;
};
const VPSocialLink = /* @__PURE__ */ _export_sfc(_sfc_main$A, [["__scopeId", "data-v-7db59132"]]);
const _sfc_main$z = /* @__PURE__ */ defineComponent({
  __name: "VPSocialLinks",
  __ssrInlineRender: true,
  props: {
    links: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPSocialLinks" }, _attrs))} data-v-eb478fff><!--[-->`);
      ssrRenderList(__props.links, ({ link: link2, icon, ariaLabel }) => {
        _push(ssrRenderComponent(VPSocialLink, {
          key: link2,
          icon,
          link: link2,
          ariaLabel
        }, null, _parent));
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$z = _sfc_main$z.setup;
_sfc_main$z.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSocialLinks.vue");
  return _sfc_setup$z ? _sfc_setup$z(props, ctx) : void 0;
};
const VPSocialLinks = /* @__PURE__ */ _export_sfc(_sfc_main$z, [["__scopeId", "data-v-eb478fff"]]);
const _sfc_main$y = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarExtra",
  __ssrInlineRender: true,
  setup(__props) {
    const { site, theme: theme2 } = useData();
    const { localeLinks, currentLang } = useLangs({ correspondingLink: true });
    const hasExtraContent = computed(
      () => localeLinks.value.length && currentLang.value.label || site.value.appearance || theme2.value.socialLinks
    );
    return (_ctx, _push, _parent, _attrs) => {
      if (hasExtraContent.value) {
        _push(ssrRenderComponent(VPFlyout, mergeProps({
          class: "VPNavBarExtra",
          label: "extra navigation"
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (unref(localeLinks).length && unref(currentLang).label) {
                _push2(`<div class="group translations" data-v-fb455327${_scopeId}><p class="trans-title" data-v-fb455327${_scopeId}>${ssrInterpolate(unref(currentLang).label)}</p><!--[-->`);
                ssrRenderList(unref(localeLinks), (locale) => {
                  _push2(ssrRenderComponent(VPMenuLink, { item: locale }, null, _parent2, _scopeId));
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (unref(site).appearance && unref(site).appearance !== "force-dark" && unref(site).appearance !== "force-auto") {
                _push2(`<div class="group" data-v-fb455327${_scopeId}><div class="item appearance" data-v-fb455327${_scopeId}><p class="label" data-v-fb455327${_scopeId}>${ssrInterpolate(unref(theme2).darkModeSwitchLabel || "Appearance")}</p><div class="appearance-action" data-v-fb455327${_scopeId}>`);
                _push2(ssrRenderComponent(VPSwitchAppearance, null, null, _parent2, _scopeId));
                _push2(`</div></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (unref(theme2).socialLinks) {
                _push2(`<div class="group" data-v-fb455327${_scopeId}><div class="item social-links" data-v-fb455327${_scopeId}>`);
                _push2(ssrRenderComponent(VPSocialLinks, {
                  class: "social-links-list",
                  links: unref(theme2).socialLinks
                }, null, _parent2, _scopeId));
                _push2(`</div></div>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                unref(localeLinks).length && unref(currentLang).label ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "group translations"
                }, [
                  createVNode("p", { class: "trans-title" }, toDisplayString(unref(currentLang).label), 1),
                  (openBlock(true), createBlock(Fragment, null, renderList(unref(localeLinks), (locale) => {
                    return openBlock(), createBlock(VPMenuLink, {
                      key: locale.link,
                      item: locale
                    }, null, 8, ["item"]);
                  }), 128))
                ])) : createCommentVNode("", true),
                unref(site).appearance && unref(site).appearance !== "force-dark" && unref(site).appearance !== "force-auto" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "group"
                }, [
                  createVNode("div", { class: "item appearance" }, [
                    createVNode("p", { class: "label" }, toDisplayString(unref(theme2).darkModeSwitchLabel || "Appearance"), 1),
                    createVNode("div", { class: "appearance-action" }, [
                      createVNode(VPSwitchAppearance)
                    ])
                  ])
                ])) : createCommentVNode("", true),
                unref(theme2).socialLinks ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "group"
                }, [
                  createVNode("div", { class: "item social-links" }, [
                    createVNode(VPSocialLinks, {
                      class: "social-links-list",
                      links: unref(theme2).socialLinks
                    }, null, 8, ["links"])
                  ])
                ])) : createCommentVNode("", true)
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$y = _sfc_main$y.setup;
_sfc_main$y.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarExtra.vue");
  return _sfc_setup$y ? _sfc_setup$y(props, ctx) : void 0;
};
const VPNavBarExtra = /* @__PURE__ */ _export_sfc(_sfc_main$y, [["__scopeId", "data-v-fb455327"]]);
const _sfc_main$x = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarHamburger",
  __ssrInlineRender: true,
  props: {
    active: { type: Boolean }
  },
  emits: ["click"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({
        type: "button",
        class: ["VPNavBarHamburger", { active: __props.active }],
        "aria-label": "mobile navigation",
        "aria-expanded": __props.active,
        "aria-controls": "VPNavScreen"
      }, _attrs))} data-v-ee25a74c><span class="container" data-v-ee25a74c><span class="top" data-v-ee25a74c></span><span class="middle" data-v-ee25a74c></span><span class="bottom" data-v-ee25a74c></span></span></button>`);
    };
  }
});
const _sfc_setup$x = _sfc_main$x.setup;
_sfc_main$x.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarHamburger.vue");
  return _sfc_setup$x ? _sfc_setup$x(props, ctx) : void 0;
};
const VPNavBarHamburger = /* @__PURE__ */ _export_sfc(_sfc_main$x, [["__scopeId", "data-v-ee25a74c"]]);
const _sfc_main$w = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarMenuLink",
  __ssrInlineRender: true,
  props: {
    item: {}
  },
  setup(__props) {
    const { page } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$Z, mergeProps({
        class: {
          VPNavBarMenuLink: true,
          active: unref(isActive)(
            unref(page).relativePath,
            __props.item.activeMatch || __props.item.link,
            !!__props.item.activeMatch
          )
        },
        href: __props.item.link,
        target: __props.item.target,
        rel: __props.item.rel,
        "no-icon": __props.item.noIcon,
        tabindex: "0"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span data-v-8f58dc35${_scopeId}>${__props.item.text ?? ""}</span>`);
          } else {
            return [
              createVNode("span", {
                innerHTML: __props.item.text
              }, null, 8, ["innerHTML"])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$w = _sfc_main$w.setup;
_sfc_main$w.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarMenuLink.vue");
  return _sfc_setup$w ? _sfc_setup$w(props, ctx) : void 0;
};
const VPNavBarMenuLink = /* @__PURE__ */ _export_sfc(_sfc_main$w, [["__scopeId", "data-v-8f58dc35"]]);
const _sfc_main$v = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarMenuGroup",
  __ssrInlineRender: true,
  props: {
    item: {}
  },
  setup(__props) {
    const props = __props;
    const { page } = useData();
    const isChildActive = (navItem) => {
      if ("component" in navItem) return false;
      if ("link" in navItem) {
        return isActive(
          page.value.relativePath,
          navItem.link,
          !!props.item.activeMatch
        );
      }
      return navItem.items.some(isChildActive);
    };
    const childrenActive = computed(() => isChildActive(props.item));
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(VPFlyout, mergeProps({
        class: {
          VPNavBarMenuGroup: true,
          active: unref(isActive)(unref(page).relativePath, __props.item.activeMatch, !!__props.item.activeMatch) || childrenActive.value
        },
        button: __props.item.text,
        items: __props.item.items
      }, _attrs), null, _parent));
    };
  }
});
const _sfc_setup$v = _sfc_main$v.setup;
_sfc_main$v.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarMenuGroup.vue");
  return _sfc_setup$v ? _sfc_setup$v(props, ctx) : void 0;
};
const _sfc_main$u = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(theme2).nav) {
        _push(`<nav${ssrRenderAttrs(mergeProps({
          "aria-labelledby": "main-nav-aria-label",
          class: "VPNavBarMenu"
        }, _attrs))} data-v-54078952><span id="main-nav-aria-label" class="visually-hidden" data-v-54078952> Main Navigation </span><!--[-->`);
        ssrRenderList(unref(theme2).nav, (item) => {
          _push(`<!--[-->`);
          if ("link" in item) {
            _push(ssrRenderComponent(VPNavBarMenuLink, { item }, null, _parent));
          } else if ("component" in item) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.component), mergeProps({ ref_for: true }, item.props), null), _parent);
          } else {
            _push(ssrRenderComponent(_sfc_main$v, { item }, null, _parent));
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]--></nav>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$u = _sfc_main$u.setup;
_sfc_main$u.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarMenu.vue");
  return _sfc_setup$u ? _sfc_setup$u(props, ctx) : void 0;
};
const VPNavBarMenu = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["__scopeId", "data-v-54078952"]]);
function createSearchTranslate(defaultTranslations) {
  const { localeIndex, theme: theme2 } = useData();
  function translate(key2) {
    var _a, _b, _c;
    const keyPath = key2.split(".");
    const themeObject = (_a = theme2.value.search) == null ? void 0 : _a.options;
    const isObject = themeObject && typeof themeObject === "object";
    const locales = isObject && ((_c = (_b = themeObject.locales) == null ? void 0 : _b[localeIndex.value]) == null ? void 0 : _c.translations) || null;
    const translations = isObject && themeObject.translations || null;
    let localeResult = locales;
    let translationResult = translations;
    let defaultResult = defaultTranslations;
    const lastKey = keyPath.pop();
    for (const k of keyPath) {
      let fallbackResult = null;
      const foundInFallback = defaultResult == null ? void 0 : defaultResult[k];
      if (foundInFallback) {
        fallbackResult = defaultResult = foundInFallback;
      }
      const foundInTranslation = translationResult == null ? void 0 : translationResult[k];
      if (foundInTranslation) {
        fallbackResult = translationResult = foundInTranslation;
      }
      const foundInLocale = localeResult == null ? void 0 : localeResult[k];
      if (foundInLocale) {
        fallbackResult = localeResult = foundInLocale;
      }
      if (!foundInFallback) {
        defaultResult = fallbackResult;
      }
      if (!foundInTranslation) {
        translationResult = fallbackResult;
      }
      if (!foundInLocale) {
        localeResult = fallbackResult;
      }
    }
    return (localeResult == null ? void 0 : localeResult[lastKey]) ?? (translationResult == null ? void 0 : translationResult[lastKey]) ?? (defaultResult == null ? void 0 : defaultResult[lastKey]) ?? "";
  }
  return translate;
}
const _sfc_main$t = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarSearchButton",
  __ssrInlineRender: true,
  setup(__props) {
    const defaultTranslations = {
      button: {
        buttonText: "Search",
        buttonAriaLabel: "Search"
      }
    };
    const translate = createSearchTranslate(defaultTranslations);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({
        type: "button",
        class: "DocSearch DocSearch-Button",
        "aria-label": unref(translate)("button.buttonAriaLabel")
      }, _attrs))}><span class="DocSearch-Button-Container"><span class="vp-icon DocSearch-Search-Icon"></span><span class="DocSearch-Button-Placeholder">${ssrInterpolate(unref(translate)("button.buttonText"))}</span></span><span class="DocSearch-Button-Keys"><kbd class="DocSearch-Button-Key"></kbd><kbd class="DocSearch-Button-Key">K</kbd></span></button>`);
    };
  }
});
const _sfc_setup$t = _sfc_main$t.setup;
_sfc_main$t.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarSearchButton.vue");
  return _sfc_setup$t ? _sfc_setup$t(props, ctx) : void 0;
};
const _sfc_main$s = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarSearch",
  __ssrInlineRender: true,
  setup(__props) {
    const VPLocalSearchBox = defineAsyncComponent(() => import("./VPLocalSearchBox.DDr3Aekt.js"));
    const VPAlgoliaSearchBox = () => null;
    const { theme: theme2 } = useData();
    const loaded = ref(false);
    const actuallyLoaded = ref(false);
    onMounted(() => {
      {
        return;
      }
    });
    function load() {
      if (!loaded.value) {
        loaded.value = true;
        setTimeout(poll, 16);
      }
    }
    function poll() {
      const e = new Event("keydown");
      e.key = "k";
      e.metaKey = true;
      window.dispatchEvent(e);
      setTimeout(() => {
        if (!document.querySelector(".DocSearch-Modal")) {
          poll();
        }
      }, 16);
    }
    function isEditingContent(event) {
      const element = event.target;
      const tagName = element.tagName;
      return element.isContentEditable || tagName === "INPUT" || tagName === "SELECT" || tagName === "TEXTAREA";
    }
    const showSearch = ref(false);
    {
      onKeyStroke("k", (event) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          showSearch.value = true;
        }
      });
      onKeyStroke("/", (event) => {
        if (!isEditingContent(event)) {
          event.preventDefault();
          showSearch.value = true;
        }
      });
    }
    const provider = "local";
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPNavBarSearch" }, _attrs))}>`);
      if (unref(provider) === "local") {
        _push(`<!--[-->`);
        if (showSearch.value) {
          _push(ssrRenderComponent(unref(VPLocalSearchBox), {
            onClose: ($event) => showSearch.value = false
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div id="local-search">`);
        _push(ssrRenderComponent(_sfc_main$t, {
          onClick: ($event) => showSearch.value = true
        }, null, _parent));
        _push(`</div><!--]-->`);
      } else if (unref(provider) === "algolia") {
        _push(`<!--[-->`);
        if (loaded.value) {
          _push(ssrRenderComponent(unref(VPAlgoliaSearchBox), {
            algolia: ((_a = unref(theme2).search) == null ? void 0 : _a.options) ?? unref(theme2).algolia,
            onVnodeBeforeMount: ($event) => actuallyLoaded.value = true
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        if (!actuallyLoaded.value) {
          _push(`<div id="docsearch">`);
          _push(ssrRenderComponent(_sfc_main$t, { onClick: load }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$s = _sfc_main$s.setup;
_sfc_main$s.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarSearch.vue");
  return _sfc_setup$s ? _sfc_setup$s(props, ctx) : void 0;
};
const _sfc_main$r = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarSocialLinks",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(theme2).socialLinks) {
        _push(ssrRenderComponent(VPSocialLinks, mergeProps({
          class: "VPNavBarSocialLinks",
          links: unref(theme2).socialLinks
        }, _attrs), null, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$r = _sfc_main$r.setup;
_sfc_main$r.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarSocialLinks.vue");
  return _sfc_setup$r ? _sfc_setup$r(props, ctx) : void 0;
};
const VPNavBarSocialLinks = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["__scopeId", "data-v-1c6dec34"]]);
const _sfc_main$q = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarTitle",
  __ssrInlineRender: true,
  setup(__props) {
    const { site, theme: theme2 } = useData();
    const { hasSidebar } = useSidebar();
    const { currentLang } = useLangs();
    const link2 = computed(
      () => {
        var _a;
        return typeof theme2.value.logoLink === "string" ? theme2.value.logoLink : (_a = theme2.value.logoLink) == null ? void 0 : _a.link;
      }
    );
    const rel = computed(
      () => {
        var _a;
        return typeof theme2.value.logoLink === "string" ? void 0 : (_a = theme2.value.logoLink) == null ? void 0 : _a.rel;
      }
    );
    const target = computed(
      () => {
        var _a;
        return typeof theme2.value.logoLink === "string" ? void 0 : (_a = theme2.value.logoLink) == null ? void 0 : _a.target;
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPNavBarTitle", { "has-sidebar": unref(hasSidebar) }]
      }, _attrs))} data-v-866c4f95><a class="title"${ssrRenderAttr("href", link2.value ?? unref(normalizeLink$1)(unref(currentLang).link))}${ssrRenderAttr("rel", rel.value)}${ssrRenderAttr("target", target.value)} data-v-866c4f95>`);
      ssrRenderSlot(_ctx.$slots, "nav-bar-title-before", {}, null, _push, _parent);
      if (unref(theme2).logo) {
        _push(ssrRenderComponent(VPImage, {
          class: "logo",
          image: unref(theme2).logo
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(theme2).siteTitle) {
        _push(`<span data-v-866c4f95>${unref(theme2).siteTitle ?? ""}</span>`);
      } else if (unref(theme2).siteTitle === void 0) {
        _push(`<span data-v-866c4f95>${ssrInterpolate(unref(site).title)}</span>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "nav-bar-title-after", {}, null, _push, _parent);
      _push(`</a></div>`);
    };
  }
});
const _sfc_setup$q = _sfc_main$q.setup;
_sfc_main$q.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarTitle.vue");
  return _sfc_setup$q ? _sfc_setup$q(props, ctx) : void 0;
};
const VPNavBarTitle = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["__scopeId", "data-v-866c4f95"]]);
const _sfc_main$p = /* @__PURE__ */ defineComponent({
  __name: "VPNavBarTranslations",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    const { localeLinks, currentLang } = useLangs({ correspondingLink: true });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(localeLinks).length && unref(currentLang).label) {
        _push(ssrRenderComponent(VPFlyout, mergeProps({
          class: "VPNavBarTranslations",
          icon: "vpi-languages",
          label: unref(theme2).langMenuLabel || "Change language"
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="items" data-v-1878ba52${_scopeId}><p class="title" data-v-1878ba52${_scopeId}>${ssrInterpolate(unref(currentLang).label)}</p><!--[-->`);
              ssrRenderList(unref(localeLinks), (locale) => {
                _push2(ssrRenderComponent(VPMenuLink, { item: locale }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div>`);
            } else {
              return [
                createVNode("div", { class: "items" }, [
                  createVNode("p", { class: "title" }, toDisplayString(unref(currentLang).label), 1),
                  (openBlock(true), createBlock(Fragment, null, renderList(unref(localeLinks), (locale) => {
                    return openBlock(), createBlock(VPMenuLink, {
                      key: locale.link,
                      item: locale
                    }, null, 8, ["item"]);
                  }), 128))
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$p = _sfc_main$p.setup;
_sfc_main$p.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBarTranslations.vue");
  return _sfc_setup$p ? _sfc_setup$p(props, ctx) : void 0;
};
const VPNavBarTranslations = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["__scopeId", "data-v-1878ba52"]]);
const _sfc_main$o = /* @__PURE__ */ defineComponent({
  __name: "VPNavBar",
  __ssrInlineRender: true,
  props: {
    isScreenOpen: { type: Boolean }
  },
  emits: ["toggle-screen"],
  setup(__props) {
    const props = __props;
    const { y } = useWindowScroll();
    const { hasSidebar } = useSidebar();
    const { frontmatter } = useData();
    const classes = ref({});
    watchPostEffect(() => {
      classes.value = {
        "has-sidebar": hasSidebar.value,
        "home": frontmatter.value.layout === "home",
        "top": y.value === 0,
        "screen-open": props.isScreenOpen
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPNavBar", classes.value]
      }, _attrs))} data-v-a2855a99><div class="wrapper" data-v-a2855a99><div class="container" data-v-a2855a99><div class="title" data-v-a2855a99>`);
      _push(ssrRenderComponent(VPNavBarTitle, null, {
        "nav-bar-title-before": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "nav-bar-title-before", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "nav-bar-title-before", {}, void 0, true)
            ];
          }
        }),
        "nav-bar-title-after": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "nav-bar-title-after", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "nav-bar-title-after", {}, void 0, true)
            ];
          }
        }),
        _: 3
      }, _parent));
      _push(`</div><div class="content" data-v-a2855a99><div class="content-body" data-v-a2855a99>`);
      ssrRenderSlot(_ctx.$slots, "nav-bar-content-before", {}, null, _push, _parent);
      _push(ssrRenderComponent(_sfc_main$s, { class: "search" }, null, _parent));
      _push(ssrRenderComponent(VPNavBarMenu, { class: "menu" }, null, _parent));
      _push(ssrRenderComponent(VPNavBarTranslations, { class: "translations" }, null, _parent));
      _push(ssrRenderComponent(VPNavBarAppearance, { class: "appearance" }, null, _parent));
      _push(ssrRenderComponent(VPNavBarSocialLinks, { class: "social-links" }, null, _parent));
      _push(ssrRenderComponent(VPNavBarExtra, { class: "extra" }, null, _parent));
      ssrRenderSlot(_ctx.$slots, "nav-bar-content-after", {}, null, _push, _parent);
      _push(ssrRenderComponent(VPNavBarHamburger, {
        class: "hamburger",
        active: __props.isScreenOpen,
        onClick: ($event) => _ctx.$emit("toggle-screen")
      }, null, _parent));
      _push(`</div></div></div></div><div class="divider" data-v-a2855a99><div class="divider-line" data-v-a2855a99></div></div></div>`);
    };
  }
});
const _sfc_setup$o = _sfc_main$o.setup;
_sfc_main$o.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavBar.vue");
  return _sfc_setup$o ? _sfc_setup$o(props, ctx) : void 0;
};
const VPNavBar = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["__scopeId", "data-v-a2855a99"]]);
const _sfc_main$n = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenAppearance",
  __ssrInlineRender: true,
  setup(__props) {
    const { site, theme: theme2 } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(site).appearance && unref(site).appearance !== "force-dark" && unref(site).appearance !== "force-auto") {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPNavScreenAppearance" }, _attrs))} data-v-616d38a4><p class="text" data-v-616d38a4>${ssrInterpolate(unref(theme2).darkModeSwitchLabel || "Appearance")}</p>`);
        _push(ssrRenderComponent(VPSwitchAppearance, null, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$n = _sfc_main$n.setup;
_sfc_main$n.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenAppearance.vue");
  return _sfc_setup$n ? _sfc_setup$n(props, ctx) : void 0;
};
const VPNavScreenAppearance = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["__scopeId", "data-v-616d38a4"]]);
const _sfc_main$m = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenMenuLink",
  __ssrInlineRender: true,
  props: {
    item: {}
  },
  setup(__props) {
    const closeScreen = inject("close-screen");
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$Z, mergeProps({
        class: "VPNavScreenMenuLink",
        href: __props.item.link,
        target: __props.item.target,
        rel: __props.item.rel,
        "no-icon": __props.item.noIcon,
        onClick: unref(closeScreen)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span data-v-880c4d7e${_scopeId}>${__props.item.text ?? ""}</span>`);
          } else {
            return [
              createVNode("span", {
                innerHTML: __props.item.text
              }, null, 8, ["innerHTML"])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$m = _sfc_main$m.setup;
_sfc_main$m.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuLink.vue");
  return _sfc_setup$m ? _sfc_setup$m(props, ctx) : void 0;
};
const VPNavScreenMenuLink = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__scopeId", "data-v-880c4d7e"]]);
const _sfc_main$l = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenMenuGroupLink",
  __ssrInlineRender: true,
  props: {
    item: {}
  },
  setup(__props) {
    const closeScreen = inject("close-screen");
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$Z, mergeProps({
        class: "VPNavScreenMenuGroupLink",
        href: __props.item.link,
        target: __props.item.target,
        rel: __props.item.rel,
        "no-icon": __props.item.noIcon,
        onClick: unref(closeScreen)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span data-v-ccf3caf3${_scopeId}>${__props.item.text ?? ""}</span>`);
          } else {
            return [
              createVNode("span", {
                innerHTML: __props.item.text
              }, null, 8, ["innerHTML"])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$l = _sfc_main$l.setup;
_sfc_main$l.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuGroupLink.vue");
  return _sfc_setup$l ? _sfc_setup$l(props, ctx) : void 0;
};
const VPNavScreenMenuGroupLink = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["__scopeId", "data-v-ccf3caf3"]]);
const _sfc_main$k = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenMenuGroupSection",
  __ssrInlineRender: true,
  props: {
    text: {},
    items: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPNavScreenMenuGroupSection" }, _attrs))} data-v-b2922dd0>`);
      if (__props.text) {
        _push(`<p class="title" data-v-b2922dd0>${ssrInterpolate(__props.text)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(__props.items, (item) => {
        _push(ssrRenderComponent(VPNavScreenMenuGroupLink, {
          key: item.text,
          item
        }, null, _parent));
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$k = _sfc_main$k.setup;
_sfc_main$k.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuGroupSection.vue");
  return _sfc_setup$k ? _sfc_setup$k(props, ctx) : void 0;
};
const VPNavScreenMenuGroupSection = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__scopeId", "data-v-b2922dd0"]]);
const _sfc_main$j = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenMenuGroup",
  __ssrInlineRender: true,
  props: {
    text: {},
    items: {}
  },
  setup(__props) {
    const props = __props;
    const isOpen = ref(false);
    const groupId = computed(
      () => `NavScreenGroup-${props.text.replace(" ", "-").toLowerCase()}`
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPNavScreenMenuGroup", { open: isOpen.value }]
      }, _attrs))} data-v-971734fc><button class="button"${ssrRenderAttr("aria-controls", groupId.value)}${ssrRenderAttr("aria-expanded", isOpen.value)} data-v-971734fc><span class="button-text" data-v-971734fc>${__props.text ?? ""}</span><span class="vpi-plus button-icon" data-v-971734fc></span></button><div${ssrRenderAttr("id", groupId.value)} class="items" data-v-971734fc><!--[-->`);
      ssrRenderList(__props.items, (item) => {
        _push(`<!--[-->`);
        if ("link" in item) {
          _push(`<div class="item" data-v-971734fc>`);
          _push(ssrRenderComponent(VPNavScreenMenuGroupLink, { item }, null, _parent));
          _push(`</div>`);
        } else if ("component" in item) {
          _push(`<div class="item" data-v-971734fc>`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.component), mergeProps({ ref_for: true }, item.props, { "screen-menu": "" }), null), _parent);
          _push(`</div>`);
        } else {
          _push(`<div class="group" data-v-971734fc>`);
          _push(ssrRenderComponent(VPNavScreenMenuGroupSection, {
            text: item.text,
            items: item.items
          }, null, _parent));
          _push(`</div>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuGroup.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
const VPNavScreenMenuGroup = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["__scopeId", "data-v-971734fc"]]);
const _sfc_main$i = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenMenu",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(theme2).nav) {
        _push(`<nav${ssrRenderAttrs(mergeProps({ class: "VPNavScreenMenu" }, _attrs))}><!--[-->`);
        ssrRenderList(unref(theme2).nav, (item) => {
          _push(`<!--[-->`);
          if ("link" in item) {
            _push(ssrRenderComponent(VPNavScreenMenuLink, { item }, null, _parent));
          } else if ("component" in item) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.component), mergeProps({ ref_for: true }, item.props, { "screen-menu": "" }), null), _parent);
          } else {
            _push(ssrRenderComponent(VPNavScreenMenuGroup, {
              text: item.text || "",
              items: item.items
            }, null, _parent));
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]--></nav>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenu.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
const _sfc_main$h = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenSocialLinks",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(theme2).socialLinks) {
        _push(ssrRenderComponent(VPSocialLinks, mergeProps({
          class: "VPNavScreenSocialLinks",
          links: unref(theme2).socialLinks
        }, _attrs), null, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenSocialLinks.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
const _sfc_main$g = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreenTranslations",
  __ssrInlineRender: true,
  setup(__props) {
    const { localeLinks, currentLang } = useLangs({ correspondingLink: true });
    const isOpen = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(localeLinks).length && unref(currentLang).label) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: ["VPNavScreenTranslations", { open: isOpen.value }]
        }, _attrs))} data-v-2a2fae2e><button class="title" data-v-2a2fae2e><span class="vpi-languages icon lang" data-v-2a2fae2e></span> ${ssrInterpolate(unref(currentLang).label)} <span class="vpi-chevron-down icon chevron" data-v-2a2fae2e></span></button><ul class="list" data-v-2a2fae2e><!--[-->`);
        ssrRenderList(unref(localeLinks), (locale) => {
          _push(`<li class="item" data-v-2a2fae2e>`);
          _push(ssrRenderComponent(_sfc_main$Z, {
            class: "link",
            href: locale.link
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(locale.text)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(locale.text), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenTranslations.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const VPNavScreenTranslations = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-2a2fae2e"]]);
const _sfc_main$f = /* @__PURE__ */ defineComponent({
  __name: "VPNavScreen",
  __ssrInlineRender: true,
  props: {
    open: { type: Boolean }
  },
  setup(__props) {
    const screen = ref(null);
    useScrollLock(inBrowser ? document.body : null);
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.open) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: "VPNavScreen",
          ref_key: "screen",
          ref: screen,
          id: "VPNavScreen"
        }, _attrs))} data-v-dee999b6><div class="container" data-v-dee999b6>`);
        ssrRenderSlot(_ctx.$slots, "nav-screen-content-before", {}, null, _push, _parent);
        _push(ssrRenderComponent(_sfc_main$i, { class: "menu" }, null, _parent));
        _push(ssrRenderComponent(VPNavScreenTranslations, { class: "translations" }, null, _parent));
        _push(ssrRenderComponent(VPNavScreenAppearance, { class: "appearance" }, null, _parent));
        _push(ssrRenderComponent(_sfc_main$h, { class: "social-links" }, null, _parent));
        ssrRenderSlot(_ctx.$slots, "nav-screen-content-after", {}, null, _push, _parent);
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNavScreen.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const VPNavScreen = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-dee999b6"]]);
const _sfc_main$e = /* @__PURE__ */ defineComponent({
  __name: "VPNav",
  __ssrInlineRender: true,
  setup(__props) {
    const { isScreenOpen, closeScreen, toggleScreen } = useNav();
    const { frontmatter } = useData();
    const hasNavbar = computed(() => {
      return frontmatter.value.navbar !== false;
    });
    provide("close-screen", closeScreen);
    watchEffect(() => {
      if (inBrowser) {
        document.documentElement.classList.toggle("hide-nav", !hasNavbar.value);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (hasNavbar.value) {
        _push(`<header${ssrRenderAttrs(mergeProps({ class: "VPNav" }, _attrs))} data-v-d2a50c98>`);
        _push(ssrRenderComponent(VPNavBar, {
          "is-screen-open": unref(isScreenOpen),
          onToggleScreen: unref(toggleScreen)
        }, {
          "nav-bar-title-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-title-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-title-before", {}, void 0, true)
              ];
            }
          }),
          "nav-bar-title-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-title-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-title-after", {}, void 0, true)
              ];
            }
          }),
          "nav-bar-content-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-content-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-content-before", {}, void 0, true)
              ];
            }
          }),
          "nav-bar-content-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-content-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-content-after", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
        _push(ssrRenderComponent(VPNavScreen, { open: unref(isScreenOpen) }, {
          "nav-screen-content-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-screen-content-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-screen-content-before", {}, void 0, true)
              ];
            }
          }),
          "nav-screen-content-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-screen-content-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-screen-content-after", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
        _push(`</header>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPNav.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const VPNav = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-d2a50c98"]]);
const _sfc_main$d = /* @__PURE__ */ defineComponent({
  __name: "VPSidebarItem",
  __ssrInlineRender: true,
  props: {
    item: {},
    depth: {}
  },
  setup(__props) {
    const props = __props;
    const {
      collapsed,
      collapsible,
      isLink,
      isActiveLink,
      hasActiveLink: hasActiveLink2,
      hasChildren,
      toggle
    } = useSidebarControl(computed(() => props.item));
    const sectionTag = computed(() => hasChildren.value ? "section" : `div`);
    const linkTag = computed(() => isLink.value ? "a" : "div");
    const textTag = computed(() => {
      return !hasChildren.value ? "p" : props.depth + 2 === 7 ? "p" : `h${props.depth + 2}`;
    });
    const itemRole = computed(() => isLink.value ? void 0 : "button");
    const classes = computed(() => [
      [`level-${props.depth}`],
      { collapsible: collapsible.value },
      { collapsed: collapsed.value },
      { "is-link": isLink.value },
      { "is-active": isActiveLink.value },
      { "has-active": hasActiveLink2.value }
    ]);
    function onItemInteraction(e) {
      if ("key" in e && e.key !== "Enter") {
        return;
      }
      !props.item.link && toggle();
    }
    function onCaretClick() {
      props.item.link && toggle();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_VPSidebarItem = resolveComponent("VPSidebarItem", true);
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(sectionTag.value), mergeProps({
        class: ["VPSidebarItem", classes.value]
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (__props.item.text) {
              _push2(`<div class="item"${ssrRenderAttr("role", itemRole.value)}${ssrRenderAttr("tabindex", __props.item.items && 0)} data-v-87998ed1${_scopeId}><div class="indicator" data-v-87998ed1${_scopeId}></div>`);
              if (__props.item.link) {
                _push2(ssrRenderComponent(_sfc_main$Z, {
                  tag: linkTag.value,
                  class: "link",
                  href: __props.item.link,
                  rel: __props.item.rel,
                  target: __props.item.target
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      ssrRenderVNode(_push3, createVNode(resolveDynamicComponent(textTag.value), { class: "text" }, null), _parent3, _scopeId2);
                    } else {
                      return [
                        (openBlock(), createBlock(resolveDynamicComponent(textTag.value), {
                          class: "text",
                          innerHTML: __props.item.text
                        }, null, 8, ["innerHTML"]))
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
              } else {
                ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(textTag.value), { class: "text" }, null), _parent2, _scopeId);
              }
              if (__props.item.collapsed != null && __props.item.items && __props.item.items.length) {
                _push2(`<div class="caret" role="button" aria-label="toggle section" tabindex="0" data-v-87998ed1${_scopeId}><span class="vpi-chevron-right caret-icon" data-v-87998ed1${_scopeId}></span></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.item.items && __props.item.items.length) {
              _push2(`<div class="items" data-v-87998ed1${_scopeId}>`);
              if (__props.depth < 5) {
                _push2(`<!--[-->`);
                ssrRenderList(__props.item.items, (i) => {
                  _push2(ssrRenderComponent(_component_VPSidebarItem, {
                    key: i.text,
                    item: i,
                    depth: __props.depth + 1
                  }, null, _parent2, _scopeId));
                });
                _push2(`<!--]-->`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              __props.item.text ? (openBlock(), createBlock("div", mergeProps({
                key: 0,
                class: "item",
                role: itemRole.value
              }, toHandlers(
                __props.item.items ? { click: onItemInteraction, keydown: onItemInteraction } : {},
                true
              ), {
                tabindex: __props.item.items && 0
              }), [
                createVNode("div", { class: "indicator" }),
                __props.item.link ? (openBlock(), createBlock(_sfc_main$Z, {
                  key: 0,
                  tag: linkTag.value,
                  class: "link",
                  href: __props.item.link,
                  rel: __props.item.rel,
                  target: __props.item.target
                }, {
                  default: withCtx(() => [
                    (openBlock(), createBlock(resolveDynamicComponent(textTag.value), {
                      class: "text",
                      innerHTML: __props.item.text
                    }, null, 8, ["innerHTML"]))
                  ]),
                  _: 1
                }, 8, ["tag", "href", "rel", "target"])) : (openBlock(), createBlock(resolveDynamicComponent(textTag.value), {
                  key: 1,
                  class: "text",
                  innerHTML: __props.item.text
                }, null, 8, ["innerHTML"])),
                __props.item.collapsed != null && __props.item.items && __props.item.items.length ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "caret",
                  role: "button",
                  "aria-label": "toggle section",
                  onClick: onCaretClick,
                  onKeydown: withKeys(onCaretClick, ["enter"]),
                  tabindex: "0"
                }, [
                  createVNode("span", { class: "vpi-chevron-right caret-icon" })
                ], 32)) : createCommentVNode("", true)
              ], 16, ["role", "tabindex"])) : createCommentVNode("", true),
              __props.item.items && __props.item.items.length ? (openBlock(), createBlock("div", {
                key: 1,
                class: "items"
              }, [
                __props.depth < 5 ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(__props.item.items, (i) => {
                  return openBlock(), createBlock(_component_VPSidebarItem, {
                    key: i.text,
                    item: i,
                    depth: __props.depth + 1
                  }, null, 8, ["item", "depth"]);
                }), 128)) : createCommentVNode("", true)
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }), _parent);
    };
  }
});
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSidebarItem.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const VPSidebarItem = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["__scopeId", "data-v-87998ed1"]]);
const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "VPSidebarGroup",
  __ssrInlineRender: true,
  props: {
    items: {}
  },
  setup(__props) {
    const disableTransition = ref(true);
    let timer = null;
    onMounted(() => {
      timer = setTimeout(() => {
        timer = null;
        disableTransition.value = false;
      }, 300);
    });
    onBeforeUnmount(() => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      ssrRenderList(__props.items, (item) => {
        _push(`<div class="${ssrRenderClass([{ "no-transition": disableTransition.value }, "group"])}" data-v-4239471d>`);
        _push(ssrRenderComponent(VPSidebarItem, {
          item,
          depth: 0
        }, null, _parent));
        _push(`</div>`);
      });
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSidebarGroup.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const VPSidebarGroup = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-4239471d"]]);
const _sfc_main$b = /* @__PURE__ */ defineComponent({
  __name: "VPSidebar",
  __ssrInlineRender: true,
  props: {
    open: { type: Boolean }
  },
  setup(__props) {
    const { sidebarGroups, hasSidebar } = useSidebar();
    const props = __props;
    const navEl = ref(null);
    const isLocked = useScrollLock(inBrowser ? document.body : null);
    watch(
      [props, navEl],
      () => {
        var _a;
        if (props.open) {
          isLocked.value = true;
          (_a = navEl.value) == null ? void 0 : _a.focus();
        } else isLocked.value = false;
      },
      { immediate: true, flush: "post" }
    );
    const key2 = ref(0);
    watch(
      sidebarGroups,
      () => {
        key2.value += 1;
      },
      { deep: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(hasSidebar)) {
        _push(`<aside${ssrRenderAttrs(mergeProps({
          class: ["VPSidebar", { open: __props.open }],
          ref_key: "navEl",
          ref: navEl
        }, _attrs))} data-v-f0634cfe><div class="curtain" data-v-f0634cfe></div><nav class="nav" id="VPSidebarNav" aria-labelledby="sidebar-aria-label" tabindex="-1" data-v-f0634cfe><span class="visually-hidden" id="sidebar-aria-label" data-v-f0634cfe> Sidebar Navigation </span>`);
        ssrRenderSlot(_ctx.$slots, "sidebar-nav-before", {}, null, _push, _parent);
        _push(ssrRenderComponent(VPSidebarGroup, {
          items: unref(sidebarGroups),
          key: key2.value
        }, null, _parent));
        ssrRenderSlot(_ctx.$slots, "sidebar-nav-after", {}, null, _push, _parent);
        _push(`</nav></aside>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSidebar.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const VPSidebar = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-f0634cfe"]]);
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "VPSkipLink",
  __ssrInlineRender: true,
  setup(__props) {
    const { theme: theme2 } = useData();
    const route = useRoute();
    const backToTop = ref();
    watch(() => route.path, () => backToTop.value.focus());
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[--><span tabindex="-1" data-v-a4b94ff8></span><a href="#VPContent" class="VPSkipLink visually-hidden" data-v-a4b94ff8>${ssrInterpolate(unref(theme2).skipToContentLabel || "Skip to content")}</a><!--]-->`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSkipLink.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const VPSkipLink = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-a4b94ff8"]]);
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "Layout",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      isOpen: isSidebarOpen,
      open: openSidebar,
      close: closeSidebar
    } = useSidebar();
    const route = useRoute();
    watch(() => route.path, closeSidebar);
    useCloseSidebarOnEscape(isSidebarOpen, closeSidebar);
    const { frontmatter } = useData();
    const slots = useSlots();
    const heroImageSlotExists = computed(() => !!slots["home-hero-image"]);
    provide("hero-image-slot-exists", heroImageSlotExists);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Content = resolveComponent("Content");
      if (unref(frontmatter).layout !== false) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: ["Layout", unref(frontmatter).pageClass]
        }, _attrs))} data-v-1e0cf112>`);
        ssrRenderSlot(_ctx.$slots, "layout-top", {}, null, _push, _parent);
        _push(ssrRenderComponent(VPSkipLink, null, null, _parent));
        _push(ssrRenderComponent(VPBackdrop, {
          class: "backdrop",
          show: unref(isSidebarOpen),
          onClick: unref(closeSidebar)
        }, null, _parent));
        _push(ssrRenderComponent(VPNav, null, {
          "nav-bar-title-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-title-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-title-before", {}, void 0, true)
              ];
            }
          }),
          "nav-bar-title-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-title-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-title-after", {}, void 0, true)
              ];
            }
          }),
          "nav-bar-content-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-content-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-content-before", {}, void 0, true)
              ];
            }
          }),
          "nav-bar-content-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-bar-content-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-bar-content-after", {}, void 0, true)
              ];
            }
          }),
          "nav-screen-content-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-screen-content-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-screen-content-before", {}, void 0, true)
              ];
            }
          }),
          "nav-screen-content-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "nav-screen-content-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "nav-screen-content-after", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
        _push(ssrRenderComponent(VPLocalNav, {
          open: unref(isSidebarOpen),
          onOpenMenu: unref(openSidebar)
        }, null, _parent));
        _push(ssrRenderComponent(VPSidebar, { open: unref(isSidebarOpen) }, {
          "sidebar-nav-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "sidebar-nav-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "sidebar-nav-before", {}, void 0, true)
              ];
            }
          }),
          "sidebar-nav-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "sidebar-nav-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "sidebar-nav-after", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
        _push(ssrRenderComponent(VPContent, null, {
          "page-top": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "page-top", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "page-top", {}, void 0, true)
              ];
            }
          }),
          "page-bottom": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "page-bottom", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "page-bottom", {}, void 0, true)
              ];
            }
          }),
          "not-found": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "not-found", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "not-found", {}, void 0, true)
              ];
            }
          }),
          "home-hero-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-before", {}, void 0, true)
              ];
            }
          }),
          "home-hero-info-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info-before", {}, void 0, true)
              ];
            }
          }),
          "home-hero-info": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info", {}, void 0, true)
              ];
            }
          }),
          "home-hero-info-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-info-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-info-after", {}, void 0, true)
              ];
            }
          }),
          "home-hero-actions-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-actions-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-actions-after", {}, void 0, true)
              ];
            }
          }),
          "home-hero-image": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-image", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-image", {}, void 0, true)
              ];
            }
          }),
          "home-hero-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-hero-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-hero-after", {}, void 0, true)
              ];
            }
          }),
          "home-features-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-features-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-features-before", {}, void 0, true)
              ];
            }
          }),
          "home-features-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "home-features-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "home-features-after", {}, void 0, true)
              ];
            }
          }),
          "doc-footer-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-footer-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-footer-before", {}, void 0, true)
              ];
            }
          }),
          "doc-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-before", {}, void 0, true)
              ];
            }
          }),
          "doc-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-after", {}, void 0, true)
              ];
            }
          }),
          "doc-top": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-top", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-top", {}, void 0, true)
              ];
            }
          }),
          "doc-bottom": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "doc-bottom", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "doc-bottom", {}, void 0, true)
              ];
            }
          }),
          "aside-top": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-top", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-top", {}, void 0, true)
              ];
            }
          }),
          "aside-bottom": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-bottom", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-bottom", {}, void 0, true)
              ];
            }
          }),
          "aside-outline-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-outline-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-outline-before", {}, void 0, true)
              ];
            }
          }),
          "aside-outline-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-outline-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-outline-after", {}, void 0, true)
              ];
            }
          }),
          "aside-ads-before": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-ads-before", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-ads-before", {}, void 0, true)
              ];
            }
          }),
          "aside-ads-after": withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderSlot(_ctx.$slots, "aside-ads-after", {}, null, _push2, _parent2, _scopeId);
            } else {
              return [
                renderSlot(_ctx.$slots, "aside-ads-after", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent));
        _push(ssrRenderComponent(VPFooter, null, null, _parent));
        ssrRenderSlot(_ctx.$slots, "layout-bottom", {}, null, _push, _parent);
        _push(`</div>`);
      } else {
        _push(ssrRenderComponent(_component_Content, _attrs, null, _parent));
      }
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/Layout.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const Layout = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-1e0cf112"]]);
const GridSettings = {
  xmini: [[0, 2]],
  mini: [],
  small: [
    [920, 6],
    [768, 5],
    [640, 4],
    [480, 3],
    [0, 2]
  ],
  medium: [
    [960, 5],
    [832, 4],
    [640, 3],
    [480, 2]
  ],
  big: [
    [832, 3],
    [640, 2]
  ]
};
function useSponsorsGrid({ el: el2, size = "medium" }) {
  const onResize = throttleAndDebounce(manage, 100);
  onMounted(() => {
    manage();
    window.addEventListener("resize", onResize);
  });
  onUnmounted(() => {
    window.removeEventListener("resize", onResize);
  });
  function manage() {
    adjustSlots(el2.value, size);
  }
}
function adjustSlots(el2, size) {
  const tsize = el2.children.length;
  const asize = el2.querySelectorAll(".vp-sponsor-grid-item:not(.empty)").length;
  const grid = setGrid(el2, size, asize);
  manageSlots(el2, grid, tsize, asize);
}
function setGrid(el2, size, items) {
  const settings = GridSettings[size];
  const screen = window.innerWidth;
  let grid = 1;
  settings.some(([breakpoint, value]) => {
    if (screen >= breakpoint) {
      grid = items < value ? items : value;
      return true;
    }
  });
  setGridData(el2, grid);
  return grid;
}
function setGridData(el2, value) {
  el2.dataset.vpGrid = String(value);
}
function manageSlots(el2, grid, tsize, asize) {
  const diff = tsize - asize;
  const rem = asize % grid;
  const drem = rem === 0 ? rem : grid - rem;
  neutralizeSlots(el2, drem - diff);
}
function neutralizeSlots(el2, count) {
  if (count === 0) {
    return;
  }
  count > 0 ? addSlots(el2, count) : removeSlots(el2, count * -1);
}
function addSlots(el2, count) {
  for (let i = 0; i < count; i++) {
    const slot = document.createElement("div");
    slot.classList.add("vp-sponsor-grid-item", "empty");
    el2.append(slot);
  }
}
function removeSlots(el2, count) {
  for (let i = 0; i < count; i++) {
    el2.removeChild(el2.lastElementChild);
  }
}
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "VPSponsorsGrid",
  __ssrInlineRender: true,
  props: {
    size: { default: "medium" },
    data: {}
  },
  setup(__props) {
    const props = __props;
    const el2 = ref(null);
    useSponsorsGrid({ el: el2, size: props.size });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPSponsorsGrid vp-sponsor-grid", [__props.size]],
        ref_key: "el",
        ref: el2
      }, _attrs))}><!--[-->`);
      ssrRenderList(__props.data, (sponsor) => {
        _push(`<div class="vp-sponsor-grid-item"><a class="vp-sponsor-grid-link"${ssrRenderAttr("href", sponsor.url)} target="_blank" rel="sponsored noopener"><article class="vp-sponsor-grid-box"><h4 class="visually-hidden">${ssrInterpolate(sponsor.name)}</h4><img class="vp-sponsor-grid-image"${ssrRenderAttr("src", sponsor.img)}${ssrRenderAttr("alt", sponsor.name)}></article></a></div>`);
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSponsorsGrid.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "VPSponsors",
  __ssrInlineRender: true,
  props: {
    mode: { default: "normal" },
    tier: {},
    size: {},
    data: {}
  },
  setup(__props) {
    const props = __props;
    const sponsors = computed(() => {
      const isSponsors = props.data.some((s) => {
        return "items" in s;
      });
      if (isSponsors) {
        return props.data;
      }
      return [
        { tier: props.tier, size: props.size, items: props.data }
      ];
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPSponsors vp-sponsor", [__props.mode]]
      }, _attrs))}><!--[-->`);
      ssrRenderList(sponsors.value, (sponsor, index) => {
        _push(`<section class="vp-sponsor-section">`);
        if (sponsor.tier) {
          _push(`<h3 class="vp-sponsor-tier">${ssrInterpolate(sponsor.tier)}</h3>`);
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(_sfc_main$8, {
          size: sponsor.size,
          data: sponsor.items
        }, null, _parent));
        _push(`</section>`);
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPSponsors.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "VPDocAsideSponsors",
  __ssrInlineRender: true,
  props: {
    tier: {},
    size: {},
    data: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "VPDocAsideSponsors" }, _attrs))}>`);
      _push(ssrRenderComponent(_sfc_main$7, {
        mode: "aside",
        tier: __props.tier,
        size: __props.size,
        data: __props.data
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPDocAsideSponsors.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "VPHomeSponsors",
  __ssrInlineRender: true,
  props: {
    message: {},
    actionText: { default: "Become a sponsor" },
    actionLink: {},
    data: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "VPHomeSponsors" }, _attrs))} data-v-dc4fbb87><div class="container" data-v-dc4fbb87><div class="header" data-v-dc4fbb87><div class="love" data-v-dc4fbb87><span class="vpi-heart icon" data-v-dc4fbb87></span></div>`);
      if (__props.message) {
        _push(`<h2 class="message" data-v-dc4fbb87>${ssrInterpolate(__props.message)}</h2>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="sponsors" data-v-dc4fbb87>`);
      _push(ssrRenderComponent(_sfc_main$7, { data: __props.data }, null, _parent));
      _push(`</div>`);
      if (__props.actionLink) {
        _push(`<div class="action" data-v-dc4fbb87>`);
        _push(ssrRenderComponent(VPButton, {
          theme: "sponsor",
          text: __props.actionText,
          href: __props.actionLink
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></section>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPHomeSponsors.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "VPTeamMembersItem",
  __ssrInlineRender: true,
  props: {
    size: { default: "medium" },
    member: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<article${ssrRenderAttrs(mergeProps({
        class: ["VPTeamMembersItem", [__props.size]]
      }, _attrs))} data-v-c08c0979><div class="profile" data-v-c08c0979><figure class="avatar" data-v-c08c0979><img class="avatar-img"${ssrRenderAttr("src", __props.member.avatar)}${ssrRenderAttr("alt", __props.member.name)} data-v-c08c0979></figure><div class="data" data-v-c08c0979><h1 class="name" data-v-c08c0979>${ssrInterpolate(__props.member.name)}</h1>`);
      if (__props.member.title || __props.member.org) {
        _push(`<p class="affiliation" data-v-c08c0979>`);
        if (__props.member.title) {
          _push(`<span class="title" data-v-c08c0979>${ssrInterpolate(__props.member.title)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.member.title && __props.member.org) {
          _push(`<span class="at" data-v-c08c0979> @ </span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.member.org) {
          _push(ssrRenderComponent(_sfc_main$Z, {
            class: ["org", { link: __props.member.orgLink }],
            href: __props.member.orgLink,
            "no-icon": ""
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(__props.member.org)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(__props.member.org), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.member.desc) {
        _push(`<p class="desc" data-v-c08c0979>${__props.member.desc ?? ""}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.member.links) {
        _push(`<div class="links" data-v-c08c0979>`);
        _push(ssrRenderComponent(VPSocialLinks, {
          links: __props.member.links
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (__props.member.sponsor) {
        _push(`<div class="sp" data-v-c08c0979>`);
        _push(ssrRenderComponent(_sfc_main$Z, {
          class: "sp-link",
          href: __props.member.sponsor,
          "no-icon": ""
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="vpi-heart sp-icon" data-v-c08c0979${_scopeId}></span> ${ssrInterpolate(__props.member.actionText || "Sponsor")}`);
            } else {
              return [
                createVNode("span", { class: "vpi-heart sp-icon" }),
                createTextVNode(" " + toDisplayString(__props.member.actionText || "Sponsor"), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</article>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPTeamMembersItem.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const VPTeamMembersItem = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-c08c0979"]]);
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "VPTeamMembers",
  __ssrInlineRender: true,
  props: {
    size: { default: "medium" },
    members: {}
  },
  setup(__props) {
    const props = __props;
    const classes = computed(() => [props.size, `count-${props.members.length}`]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["VPTeamMembers", classes.value]
      }, _attrs))} data-v-a97a9868><div class="container" data-v-a97a9868><!--[-->`);
      ssrRenderList(__props.members, (member) => {
        _push(`<div class="item" data-v-a97a9868>`);
        _push(ssrRenderComponent(VPTeamMembersItem, {
          size: __props.size,
          member
        }, null, _parent));
        _push(`</div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPTeamMembers.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = {};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPTeamPage.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPTeamPageSection.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/vitepress@1.6.4_@algolia+cl_0a079c08914399ac9ac85ec62c975203/node_modules/vitepress/dist/client/theme-default/components/VPTeamPageTitle.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const theme = {
  Layout,
  enhanceApp: ({ app }) => {
    app.component("Badge", _sfc_main$14);
  }
};
const FRONTIER_ECOSYSTEM_LAYERS = [
  { id: "foundation", label: "基础综述", description: "综述、taxonomy、系统边界与概念地图" },
  { id: "model-platform", label: "模型与托管平台", description: "模型 API、托管工具、平台级 agent primitives" },
  { id: "protocol", label: "协议与互操作", description: "MCP、A2A、身份、生命周期与生态标准" },
  { id: "runtime", label: "编排 Runtime", description: "图、workflow、多 agent、human-in-the-loop runtime" },
  { id: "product-ui", label: "产品与交互", description: "Operator、deep research、coding agent、GUI/浏览器 agent" },
  { id: "data-memory", label: "数据与记忆", description: "文件检索、长期记忆、上下文工程与知识接入" },
  { id: "evaluation", label: "评测与基准", description: "Web/OS/tool/coding/research agent benchmark 与 eval 方法" },
  { id: "security-governance", label: "安全与治理", description: "授权、prompt injection、secret、审计与风险缓解" }
];
function toDateStr(year, month, day) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
function dateKey(value) {
  return value.slice(0, 10);
}
function availableDates(articles) {
  const set = /* @__PURE__ */ new Set();
  for (const article of articles) {
    if (article.collectedDate) set.add(dateKey(article.collectedDate));
  }
  return [...set].sort((a, b) => a < b ? 1 : a > b ? -1 : 0);
}
function pickDefaultDate(articles) {
  return availableDates(articles)[0] ?? null;
}
function filterByDate(articles, date) {
  if (date === null) return [...articles];
  return articles.filter((article) => dateKey(article.collectedDate) === date);
}
function yearMonthOf(date) {
  if (!date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}
function shiftMonth(year, month, delta) {
  const zeroBased = month - 1 + delta;
  const nextYear = year + Math.floor(zeroBased / 12);
  const nextMonth = (zeroBased % 12 + 12) % 12 + 1;
  return { year: nextYear, month: nextMonth };
}
function buildCalendarMonth(year, month, contentDates) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (firstWeekday + 6) % 7;
  const weeks = [];
  for (let week = 0; week < 6; week++) {
    const row = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const offset = week * 7 + weekday - leading;
      const cellDate = new Date(Date.UTC(year, month - 1, 1 + offset));
      const cy = cellDate.getUTCFullYear();
      const cm = cellDate.getUTCMonth() + 1;
      const cd = cellDate.getUTCDate();
      const date = toDateStr(cy, cm, cd);
      row.push({
        date,
        day: cd,
        inMonth: cm === month && cy === year,
        hasContent: contentDates.has(date)
      });
    }
    weeks.push(row);
  }
  return weeks;
}
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 1e3;
const DEFAULT_MAX_PAGES = 100;
function buildPostgrestPageUrl(config, table, select, filters, order, pageSize, offset) {
  const baseUrl = config.url.replace(/\/+$/, "");
  const search = new URLSearchParams();
  search.set("select", select);
  for (const filter of filters) appendRawQuery(search, filter);
  for (const orderBy of order) search.append("order", orderBy);
  search.set("limit", String(pageSize));
  search.set("offset", String(offset));
  return `${baseUrl}/rest/v1/${table}?${search.toString()}`;
}
async function fetchAllPostgrestRows({
  config,
  table,
  select,
  filters = [],
  order = [],
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
  fetchImpl = fetch
}) {
  const normalizedPageSize = normalizePageSize(pageSize);
  const normalizedMaxPages = normalizeMaxPages(maxPages);
  const rows = [];
  for (let page = 0; page < normalizedMaxPages; page += 1) {
    const endpoint = buildPostgrestPageUrl(
      config,
      table,
      select,
      filters,
      order,
      normalizedPageSize,
      page * normalizedPageSize
    );
    const response = await fetchImpl(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        "Accept-Profile": config.schema || "public"
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`HTTP ${response.status} ${detail.slice(0, 180)}`);
    }
    const pageRows = await response.json();
    if (!Array.isArray(pageRows)) {
      throw new Error("返回数据不是数组");
    }
    rows.push(...pageRows);
    if (pageRows.length < normalizedPageSize) return rows;
  }
  throw new Error(`分页读取超过 ${normalizedMaxPages} 页，请缩小查询范围或提高 maxPages`);
}
async function fetchPostgrestPage({
  config,
  table,
  select,
  filters = [],
  order = [],
  pageSize = DEFAULT_PAGE_SIZE,
  offset = 0,
  fetchImpl = fetch
}) {
  const normalizedPageSize = normalizePageSize(pageSize);
  const normalizedOffset = Number.isInteger(offset) && offset > 0 ? offset : 0;
  const endpoint = buildPostgrestPageUrl(
    config,
    table,
    select,
    filters,
    order,
    normalizedPageSize,
    normalizedOffset
  );
  const response = await fetchImpl(endpoint, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Accept-Profile": config.schema || "public",
      Prefer: "count=exact"
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`HTTP ${response.status} ${detail.slice(0, 180)}`);
  }
  const pageRows = await response.json();
  if (!Array.isArray(pageRows)) {
    throw new Error("返回数据不是数组");
  }
  const totalCount = parseContentRangeTotal(response.headers.get("content-range"));
  const hasMore = totalCount === null ? pageRows.length === normalizedPageSize : normalizedOffset + pageRows.length < totalCount;
  return {
    rows: pageRows,
    totalCount,
    hasMore
  };
}
function appendRawQuery(search, raw) {
  const separator = raw.indexOf("=");
  if (separator <= 0 || separator === raw.length - 1) {
    throw new Error(`Invalid PostgREST filter: ${raw}`);
  }
  search.append(raw.slice(0, separator), raw.slice(separator + 1));
}
function normalizePageSize(value) {
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(value, MAX_PAGE_SIZE);
}
function normalizeMaxPages(value) {
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_MAX_PAGES;
  return value;
}
function parseContentRangeTotal(value) {
  if (!value) return null;
  const match = /\/(\d+)$/.exec(value);
  if (!match) return null;
  const total = Number(match[1]);
  return Number.isFinite(total) ? total : null;
}
const RETURN_PARAM = "from";
const RETURN_POSITION_STORAGE_PREFIX = "agent-build:list-detail-return:v1:";
const RETURN_POSITION_WAIT_TIMEOUT_MS = 6e4;
const LIST_DETAIL_RETURN_POSITION_TTL_MS = 12 * 60 * 60 * 1e3;
function currentRelativePath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
function safeReturnPathFromSearch(search, fallbackPath) {
  var _a;
  const raw = ((_a = new URLSearchParams(search).get(RETURN_PARAM)) == null ? void 0 : _a.trim()) || "";
  if (!raw) return fallbackPath;
  return isSafeRelativePath(raw) ? raw : fallbackPath;
}
function withReturnPath(href, returnPath) {
  if (!returnPath || !isSafeRelativePath(returnPath)) return href;
  const url = new URL(href, "https://agent-build.local");
  url.searchParams.set(RETURN_PARAM, returnPath);
  return `${url.pathname}${url.search}${url.hash}`;
}
function replaceCurrentSearch(params) {
  if (typeof window === "undefined") return;
  const search = params.toString();
  const nextPath = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
  if (nextPath === currentRelativePath()) return;
  window.history.replaceState(window.history.state, "", nextPath);
}
function positiveIntegerParam(params, key2, fallback) {
  const value = Number(params.get(key2));
  if (!Number.isInteger(value) || value <= 0) return fallback;
  return value;
}
function createListDetailReturnPosition(input) {
  const itemKey = input.itemKey.trim();
  const savedAt = input.savedAt ?? Date.now();
  if (!isSafeRelativePath(input.returnPath) || !itemKey) return null;
  if (![input.scrollX, input.scrollY, savedAt].every(Number.isFinite)) return null;
  if (input.anchorViewportTop != null && !Number.isFinite(input.anchorViewportTop)) return null;
  return {
    version: 1,
    returnPath: input.returnPath,
    itemKey,
    scrollX: Math.max(0, input.scrollX),
    scrollY: Math.max(0, input.scrollY),
    anchorViewportTop: input.anchorViewportTop ?? null,
    savedAt
  };
}
function parseListDetailReturnPosition(raw, expectedReturnPath, now = Date.now()) {
  if (!raw || !isSafeRelativePath(expectedReturnPath)) return null;
  try {
    const value = JSON.parse(raw);
    const position = createListDetailReturnPosition({
      returnPath: typeof value.returnPath === "string" ? value.returnPath : "",
      itemKey: typeof value.itemKey === "string" ? value.itemKey : "",
      scrollX: typeof value.scrollX === "number" ? value.scrollX : Number.NaN,
      scrollY: typeof value.scrollY === "number" ? value.scrollY : Number.NaN,
      anchorViewportTop: value.anchorViewportTop === null || typeof value.anchorViewportTop === "number" ? value.anchorViewportTop : Number.NaN,
      savedAt: typeof value.savedAt === "number" ? value.savedAt : Number.NaN
    });
    if (!position || value.version !== 1 || position.returnPath !== expectedReturnPath) return null;
    if (position.savedAt > now || now - position.savedAt > LIST_DETAIL_RETURN_POSITION_TTL_MS) {
      return null;
    }
    return position;
  } catch {
    return null;
  }
}
function resolveListDetailScrollTop(position, currentScrollY, currentAnchorViewportTop) {
  if (position.anchorViewportTop === null || currentAnchorViewportTop === null) {
    return position.scrollY;
  }
  return Math.max(0, currentScrollY + currentAnchorViewportTop - position.anchorViewportTop);
}
function rememberListDetailPosition(returnPath, itemKey, anchor) {
  if (typeof window === "undefined") return;
  const position = createListDetailReturnPosition({
    returnPath,
    itemKey,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    anchorViewportTop: (anchor == null ? void 0 : anchor.getBoundingClientRect().top) ?? null
  });
  if (!position) return;
  try {
    window.sessionStorage.setItem(returnPositionStorageKey(returnPath), JSON.stringify(position));
  } catch {
  }
}
function restoreListDetailPosition(root, returnPath = currentRelativePath()) {
  if (typeof window === "undefined" || !isSafeRelativePath(returnPath)) return false;
  const storageKey = returnPositionStorageKey(returnPath);
  let raw = null;
  try {
    raw = window.sessionStorage.getItem(storageKey);
  } catch {
    return false;
  }
  const position = parseListDetailReturnPosition(raw, returnPath);
  if (!position) {
    if (raw !== null) removeStoredReturnPosition(storageKey);
    return false;
  }
  let observer = null;
  let waitTimeoutId = null;
  let restoreScheduled = false;
  let disposed = false;
  const findAnchor = () => [...root.querySelectorAll("[data-list-detail-key]")].find(
    (element) => element.dataset.listDetailKey === position.itemKey
  ) ?? null;
  const stopWaiting = () => {
    if (disposed) return;
    disposed = true;
    observer == null ? void 0 : observer.disconnect();
    if (waitTimeoutId !== null) window.clearTimeout(waitTimeoutId);
  };
  const isCurrentList = () => root.isConnected && currentRelativePath() === position.returnPath;
  const ensureWaitTimeout = () => {
    if (!observer || waitTimeoutId !== null || disposed) return;
    waitTimeoutId = window.setTimeout(stopWaiting, RETURN_POSITION_WAIT_TIMEOUT_MS);
  };
  const tryScheduleRestore = () => {
    if (disposed) return false;
    if (!isCurrentList()) {
      stopWaiting();
      return false;
    }
    if (restoreScheduled) return true;
    const anchor = findAnchor();
    if (!anchor) return false;
    restoreScheduled = true;
    afterNextLayout(() => {
      restoreScheduled = false;
      if (disposed) return;
      if (!isCurrentList()) {
        stopWaiting();
        return;
      }
      const currentAnchor = findAnchor();
      if (!(currentAnchor == null ? void 0 : currentAnchor.isConnected)) {
        ensureWaitTimeout();
        return;
      }
      window.scrollTo({
        left: position.scrollX,
        top: resolveListDetailScrollTop(
          position,
          window.scrollY,
          currentAnchor.getBoundingClientRect().top
        ),
        behavior: "auto"
      });
      removeStoredReturnPosition(storageKey);
      stopWaiting();
    });
    return true;
  };
  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => {
      tryScheduleRestore();
    });
    observer.observe(root, { childList: true, subtree: true });
    ensureWaitTimeout();
  }
  if (tryScheduleRestore()) return true;
  if (!observer || disposed) return false;
  return true;
}
function afterNextLayout(callback) {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
    return;
  }
  window.setTimeout(callback, 0);
}
function removeStoredReturnPosition(storageKey) {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
  }
}
function shouldRememberListDetailClick(event) {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
function returnPositionStorageKey(returnPath) {
  return `${RETURN_POSITION_STORAGE_PREFIX}${encodeURIComponent(returnPath)}`;
}
function isSafeRelativePath(value) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return false;
  try {
    const base = new URL("https://agent-build.local");
    return new URL(value, base).origin === base.origin;
  } catch {
    return false;
  }
}
var define_FRONTIER_SUPABASE_CONFIG_default$6 = { url: "https://br-ideal-fawn-814db5fc.supabase.aidap-global.cn-beijing.volces.com:443", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjcwMzc5MzA0fQ.qiaVI4H2eZ1-5BywE5ORmEPf8_lmuq7-hW-f1lgqwWc", schema: "public" };
const WEEKDAY_LABELS$1 = ["一", "二", "三", "四", "五", "六", "日"];
const DEFAULT_DATE_LABEL$1 = "6月17日 · 周三";
const DEFAULT_NEWS_PAGE_SIZE = 10;
const NEWS_EXCERPT_MAX_LENGTH = 220;
const NEWS_PAGE_SIZE_OPTIONS = [10, 20, 50];
const NEWS_COLUMNS = [
  "external_id",
  "title",
  "url",
  "summary",
  "content_excerpt",
  "source_name",
  "source_kind",
  "ecosystem_layer",
  "ecosystem_layer_label",
  "collected_date",
  "published_date",
  "published_at",
  "read_count",
  "tags"
].join(",");
const NEWS_FILTER_INDEX_COLUMNS = ["published_date", "ecosystem_layer", "source_name"].join(",");
const BASE$4 = "/";
const initialized$9 = /* @__PURE__ */ new WeakSet();
if (typeof window !== "undefined") {
  installDailyNewsFeeds();
}
function installDailyNewsFeeds() {
  scanDailyNewsFeeds();
  const observer = new MutationObserver(() => scanDailyNewsFeeds());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scanDailyNewsFeeds() {
  document.querySelectorAll("[data-daily-news]").forEach((root) => {
    if (initialized$9.has(root)) return;
    initialized$9.add(root);
    createFeed(root);
  });
}
function createFeed(root) {
  root.classList.add("frontier-archive-shell");
  root.replaceChildren(statusBlock$2("正在读取每日资讯..."));
  void renderFeed(root).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    root.replaceChildren(statusBlock$2(`资讯读取失败：${message}`));
  });
}
async function fetchNewsPage(offset, filters, pageSize = DEFAULT_NEWS_PAGE_SIZE) {
  const config = define_FRONTIER_SUPABASE_CONFIG_default$6 ?? null;
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const page = await fetchPostgrestPage({
    config: {
      url: config.url,
      anonKey: config.anonKey,
      schema: config.schema || "public"
    },
    table: "news_items",
    select: NEWS_COLUMNS,
    filters: [...filters],
    order: ["published_date.desc", "published_at.desc"],
    pageSize,
    offset
  });
  return {
    items: page.rows.map(normalizeRow$1).filter((item) => item.title && item.url),
    totalCount: page.totalCount,
    hasMore: page.hasMore
  };
}
async function fetchNewsFilterIndex() {
  const config = define_FRONTIER_SUPABASE_CONFIG_default$6 ?? null;
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const rows = await fetchAllPostgrestRows({
    config: {
      url: config.url,
      anonKey: config.anonKey,
      schema: config.schema || "public"
    },
    table: "news_items",
    select: NEWS_FILTER_INDEX_COLUMNS,
    order: ["published_date.desc"],
    pageSize: 1e3
  });
  return rows.map(normalizeFilterIndexRow);
}
async function renderFeed(root) {
  root.replaceChildren();
  const initialState = readNewsListQueryState();
  let selectedLayer = initialState.layer;
  let selectedDate = initialState.date;
  let selectedDateWasExplicit = initialState.hasDate;
  let calendarMonth = { year: 2026, month: 6 };
  let filterIndex = [];
  let items = [];
  let totalCount = null;
  let currentPage = initialState.page;
  let pageSize = initialState.pageSize;
  let loadingPage = false;
  let pageError = null;
  let loadGeneration = 0;
  const overview = document.createElement("header");
  overview.className = "frontier-news-hero";
  const titleGroup = document.createElement("div");
  titleGroup.className = "frontier-news-title";
  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Agent Frontier News · 自动收集";
  const title = document.createElement("h2");
  title.textContent = "AI 前沿文章";
  const description = document.createElement("p");
  description.textContent = "由 news-collector 从多源 RSS 聚合；按发布时间与体系层筛选，每条保留来源、摘要与原文入口。";
  titleGroup.append(eyebrow, title, description);
  const stats = document.createElement("div");
  stats.className = "frontier-news-stats";
  stats.append(
    statItem$1(String(items.length), "文章"),
    statItem$1(String(availableDates(items).length), "日期"),
    statItem$1(String(new Set(items.map((i) => i.ecosystemLayer)).size), "体系层"),
    statItem$1(String(new Set(items.map((i) => i.sourceName)).size), "来源")
  );
  overview.append(titleGroup, stats);
  const filters = document.createElement("nav");
  filters.className = "frontier-layer-tabs";
  filters.setAttribute("aria-label", "资讯体系层");
  const calendar = document.createElement("section");
  calendar.className = "frontier-calendar";
  calendar.setAttribute("aria-label", "按日期筛选文章");
  const timeline = document.createElement("section");
  timeline.className = "frontier-article-timeline";
  timeline.setAttribute("aria-label", "文章列表");
  const layerTitle = document.createElement("strong");
  layerTitle.className = "frontier-filter-title";
  layerTitle.textContent = "按体系层筛选";
  const layerFilterGroup = document.createElement("div");
  layerFilterGroup.className = "frontier-filter-group";
  const filterBoard = document.createElement("section");
  filterBoard.className = "frontier-filter-board";
  const listPanel = document.createElement("section");
  listPanel.className = "frontier-news-list-panel";
  const layout = document.createElement("div");
  layout.className = "frontier-news-layout";
  const timelineStatus = document.createElement("div");
  timelineStatus.className = "frontier-timeline-status";
  const pagination = document.createElement("div");
  pagination.className = "frontier-news-pagination";
  function indexLayerScoped(layer = selectedLayer) {
    if (layer === "all") return filterIndex;
    return filterIndex.filter((item) => item.ecosystemLayer === layer);
  }
  function currentPageItems() {
    return items;
  }
  function layerCount(layer) {
    return filterByDate(indexLayerScoped(layer), selectedDate).length;
  }
  function dateCount(date) {
    return indexLayerScoped().filter((item) => item.collectedDate.slice(0, 10) === date).length;
  }
  function selectedDateLabel() {
    if (selectedDate === null) return "全部日期";
    return formatChineseDateLabel$1(selectedDate);
  }
  function alignDateToLayer() {
    if (selectedDate === null) return;
    const dates = availableDates(indexLayerScoped());
    if (dates.includes(selectedDate)) return;
    selectedDate = dates[0] ?? null;
    const nextMonth = yearMonthOf(selectedDate);
    if (nextMonth) calendarMonth = nextMonth;
  }
  function syncFilterState() {
    if (selectedDate === null && !selectedDateWasExplicit) {
      selectedDate = pickDefaultDate(filterIndex);
    }
    alignDateToLayer();
    calendarMonth = yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(filterIndex)[0] ?? null) ?? calendarMonth;
  }
  function renderStatus() {
    const visibleCount = currentPageItems().length;
    if (loadingPage) {
      timelineStatus.textContent = `正在加载第 ${currentPage} 页… 当前页 ${items.length} 篇${totalCount ? ` / 总计 ${totalCount} 篇` : ""}`;
      return;
    }
    if (pageError) {
      timelineStatus.textContent = `分页加载失败：${pageError}`;
      return;
    }
    const totalPages = resolveTotalPages(totalCount, pageSize);
    timelineStatus.textContent = totalPages > 0 ? `第 ${currentPage} / ${totalPages} 页 · 当前页 ${items.length} 篇${visibleCount !== items.length ? ` · 当前筛选命中 ${visibleCount} 篇` : ""}${totalCount ? ` · 总计 ${totalCount} 篇` : ""}` : `当前页 ${items.length} 篇${visibleCount !== items.length ? ` · 当前筛选命中 ${visibleCount} 篇` : ""}`;
  }
  function renderAll() {
    syncFilterState();
    stats.replaceChildren(
      statItem$1(String(totalCount ?? items.length), "文章"),
      statItem$1(String(availableDates(indexLayerScoped()).length), "日期"),
      statItem$1(String(new Set(indexLayerScoped().map((i) => i.ecosystemLayer)).size), "体系层"),
      statItem$1(String(new Set(indexLayerScoped().map((i) => i.sourceName)).size), "来源")
    );
    renderFilters();
    renderCalendar();
    renderTimeline();
    renderStatus();
    renderPagination();
  }
  function renderFilters() {
    filters.replaceChildren();
    const entries = [
      { id: "all", label: "全部体系" },
      ...FRONTIER_ECOSYSTEM_LAYERS.map((layer) => ({ id: layer.id, label: layer.label }))
    ];
    for (const entry of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "frontier-layer-tab";
      if (entry.id === selectedLayer) button.dataset.active = "true";
      button.textContent = `${entry.label} ${layerCount(entry.id)}`;
      button.addEventListener("click", () => {
        selectedLayer = entry.id;
        selectedDateWasExplicit = true;
        alignDateToLayer();
        currentPage = 1;
        void loadPage(1);
      });
      filters.append(button);
    }
  }
  function renderCalendar() {
    calendar.replaceChildren();
    const contentDates = new Set(availableDates(indexLayerScoped()));
    const head = document.createElement("div");
    head.className = "frontier-cal-head";
    const calTitle = document.createElement("strong");
    calTitle.className = "frontier-cal-title";
    calTitle.textContent = "按日期筛选文章";
    const nav = document.createElement("div");
    nav.className = "frontier-cal-nav";
    const prev = calNavButton$1("‹", "上个月", () => {
      calendarMonth = shiftMonth(calendarMonth.year, calendarMonth.month, -1);
      renderCalendar();
    });
    const label = document.createElement("span");
    label.className = "frontier-cal-label";
    label.textContent = `${calendarMonth.year}年 ${calendarMonth.month}月`;
    const next = calNavButton$1("›", "下个月", () => {
      calendarMonth = shiftMonth(calendarMonth.year, calendarMonth.month, 1);
      renderCalendar();
    });
    nav.append(prev, label, next);
    head.append(calTitle, nav);
    const current = document.createElement("p");
    current.className = "frontier-cal-current";
    current.textContent = `${selectedDateLabel()} · ${selectedDate === null ? totalCount ?? filterIndex.length : dateCount(selectedDate)} 篇`;
    const weekdays = document.createElement("div");
    weekdays.className = "frontier-cal-weekdays";
    for (const weekday of WEEKDAY_LABELS$1) {
      const span = document.createElement("span");
      span.textContent = weekday;
      weekdays.append(span);
    }
    const grid = document.createElement("div");
    grid.className = "frontier-cal-grid";
    for (const week of buildCalendarMonth(calendarMonth.year, calendarMonth.month, contentDates)) {
      for (const cell of week) {
        const button = document.createElement("button");
        const count = dateCount(cell.date);
        button.type = "button";
        button.className = "frontier-cal-cell";
        button.textContent = String(cell.day);
        if (!cell.inMonth) button.dataset.outside = "true";
        if (cell.hasContent) {
          button.dataset.hasContent = "true";
          button.title = `${cell.date} · ${count} 篇`;
          button.setAttribute("aria-label", `查看 ${cell.date} 的 ${count} 篇文章`);
          button.addEventListener("click", () => {
            selectedDate = cell.date;
            selectedDateWasExplicit = true;
            const nextMonth = yearMonthOf(cell.date);
            if (nextMonth) calendarMonth = nextMonth;
            currentPage = 1;
            void loadPage(1);
          });
        } else {
          button.disabled = true;
        }
        if (cell.date === selectedDate) button.dataset.active = "true";
        grid.append(button);
      }
    }
    const all = document.createElement("button");
    all.type = "button";
    all.className = "frontier-cal-all";
    all.textContent = `全部日期 (${indexLayerScoped().length})`;
    if (selectedDate === null) all.dataset.active = "true";
    all.addEventListener("click", () => {
      selectedDate = null;
      selectedDateWasExplicit = true;
      currentPage = 1;
      void loadPage(1);
    });
    calendar.append(head, current, weekdays, grid, all);
  }
  function renderTimeline() {
    timeline.replaceChildren();
    const rows = currentPageItems();
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "frontier-timeline-empty";
      empty.textContent = "该筛选条件下当前页暂无文章，可切换页码或调整筛选条件。";
      timeline.append(empty);
      return;
    }
    const groups = groupByDate(rows);
    let rank = 1;
    for (const group of groups) {
      const section = document.createElement("section");
      section.className = "frontier-date-section";
      const dateHeader = document.createElement("div");
      dateHeader.className = "frontier-timeline-date";
      const triangle = document.createElement("span");
      triangle.setAttribute("aria-hidden", "true");
      const dateText = document.createElement("strong");
      dateText.textContent = group.label;
      const count = document.createElement("em");
      count.textContent = `${group.items.length} 篇`;
      dateHeader.append(triangle, dateText, count);
      const list = document.createElement("div");
      list.className = "frontier-timeline-list";
      for (const item of group.items) {
        list.append(
          newsCard(
            item,
            rank,
            false,
            (card2) => openArticleDetail(item, card2)
          )
        );
        rank += 1;
      }
      section.append(dateHeader, list);
      timeline.append(section);
    }
  }
  function openArticleDetail(item, anchor) {
    const returnPath = currentRelativePath();
    rememberListDetailPosition(returnPath, item.externalId, anchor);
    window.location.href = newsArticleHref$1(item.externalId, returnPath);
  }
  function activeQueryFilters() {
    return buildNewsFilters(selectedLayer, selectedDate);
  }
  function replaceNewsListState() {
    const params = new URLSearchParams(window.location.search);
    params.set("layer", selectedLayer);
    params.set("date", selectedDate ?? "all");
    params.set("page", String(currentPage));
    params.set("pageSize", String(pageSize));
    replaceCurrentSearch(params);
  }
  function renderPagination() {
    pagination.replaceChildren();
    const totalPages = resolveTotalPages(totalCount, pageSize);
    if (totalPages <= 1 && totalCount !== null && totalCount <= pageSize) return;
    const controls = document.createElement("div");
    controls.className = "frontier-pagination-controls";
    const prev = pageButton("‹", currentPage <= 1, () => {
      void loadPage(currentPage - 1);
    });
    prev.setAttribute("aria-label", "上一页");
    controls.append(prev);
    for (const token of buildPaginationTokens(totalPages, currentPage)) {
      if (token === "...") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "frontier-pagination-ellipsis";
        ellipsis.textContent = "…";
        controls.append(ellipsis);
        continue;
      }
      const button = pageButton(String(token), token === currentPage, () => {
        void loadPage(token);
      });
      if (token === currentPage) button.dataset.active = "true";
      controls.append(button);
    }
    const next = pageButton("›", totalPages > 0 && currentPage >= totalPages, () => {
      void loadPage(currentPage + 1);
    });
    next.setAttribute("aria-label", "下一页");
    controls.append(next);
    const pageSizeWrap = document.createElement("label");
    pageSizeWrap.className = "frontier-page-size";
    const pageSizeLabel = document.createElement("span");
    pageSizeLabel.textContent = "每页";
    const pageSizeSelect = document.createElement("select");
    pageSizeSelect.className = "frontier-page-size-select";
    for (const optionValue of NEWS_PAGE_SIZE_OPTIONS) {
      const option = document.createElement("option");
      option.value = String(optionValue);
      option.textContent = `${optionValue} 条`;
      if (optionValue === pageSize) option.selected = true;
      pageSizeSelect.append(option);
    }
    pageSizeSelect.addEventListener("change", () => {
      const nextSize = Number(pageSizeSelect.value);
      if (!Number.isInteger(nextSize) || nextSize <= 0 || nextSize === pageSize) return;
      pageSize = nextSize;
      currentPage = 1;
      void loadPage(1);
    });
    pageSizeWrap.append(pageSizeLabel, pageSizeSelect);
    pagination.append(controls, pageSizeWrap);
  }
  async function loadPage(targetPage) {
    if (loadingPage) return;
    const safeTargetPage = Math.max(1, targetPage);
    loadingPage = true;
    pageError = null;
    renderStatus();
    renderPagination();
    const generation = ++loadGeneration;
    try {
      const page = await fetchNewsPage((safeTargetPage - 1) * pageSize, activeQueryFilters(), pageSize);
      if (generation !== loadGeneration) return;
      currentPage = safeTargetPage;
      items = page.items;
      totalCount = page.totalCount;
      const totalPages = resolveTotalPages(totalCount, pageSize);
      if (totalPages > 0 && currentPage > totalPages) {
        currentPage = totalPages;
      }
      renderAll();
      replaceNewsListState();
    } catch (error) {
      if (generation !== loadGeneration) return;
      pageError = error instanceof Error ? error.message : String(error);
      renderStatus();
      renderPagination();
    } finally {
      if (generation === loadGeneration) {
        loadingPage = false;
        renderStatus();
        renderPagination();
      }
    }
  }
  layerFilterGroup.append(layerTitle, filters);
  filterBoard.append(layerFilterGroup, calendar);
  listPanel.append(filterBoard, timeline, timelineStatus, pagination);
  layout.append(listPanel);
  root.append(overview, layout);
  restoreListDetailPosition(root);
  filterIndex = await fetchNewsFilterIndex();
  if (!selectedDateWasExplicit) {
    selectedDate = pickDefaultDate(filterIndex);
  } else {
    alignDateToLayer();
  }
  calendarMonth = yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(filterIndex)[0] ?? null) ?? calendarMonth;
  await loadPage(currentPage);
  if (items.length === 0) {
    timeline.replaceChildren(
      statusBlock$2("每日资讯暂无数据。先运行 news-collector（pnpm news:collect）或导入 news_items seed。")
    );
    timelineStatus.textContent = "";
    pagination.replaceChildren();
  }
}
function readNewsListQueryState(search = typeof window === "undefined" ? "" : window.location.search) {
  var _a;
  const params = new URLSearchParams(search);
  const layer = layerFilterValue(params.get("layer"));
  const hasDate = params.has("date");
  const rawDate = ((_a = params.get("date")) == null ? void 0 : _a.trim()) || "";
  const date = rawDate === "all" ? null : dateStringValue(rawDate, "") || null;
  const page = positiveIntegerParam(params, "page", 1);
  const rawPageSize = positiveIntegerParam(params, "pageSize", DEFAULT_NEWS_PAGE_SIZE);
  const pageSize = NEWS_PAGE_SIZE_OPTIONS.includes(rawPageSize) ? rawPageSize : DEFAULT_NEWS_PAGE_SIZE;
  return { layer, date, hasDate, page, pageSize };
}
function layerFilterValue(value) {
  if (value === "all") return "all";
  if (typeof value === "string" && FRONTIER_ECOSYSTEM_LAYERS.some((layer) => layer.id === value)) {
    return value;
  }
  return "all";
}
function pageButton(label, disabled, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "frontier-pagination-button";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}
function resolveTotalPages(totalCount, pageSize) {
  if (totalCount === null || totalCount <= 0) return 0;
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
function buildPaginationTokens(totalPages, currentPage) {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const tokens = /* @__PURE__ */ new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) {
    tokens.add(2);
    tokens.add(3);
    tokens.add(4);
  }
  if (currentPage >= totalPages - 2) {
    tokens.add(totalPages - 1);
    tokens.add(totalPages - 2);
    tokens.add(totalPages - 3);
  }
  const pages = [...tokens].filter((page) => page >= 1 && page <= totalPages).sort((left, right) => left - right);
  const result = [];
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const previous = pages[index - 1];
    if (previous !== void 0 && page - previous > 1) {
      result.push("...");
    }
    result.push(page);
  }
  return result;
}
function buildNewsFilters(layer, date) {
  const filters = [];
  if (layer !== "all") filters.push(`ecosystem_layer=eq.${layer}`);
  if (date !== null) filters.push(`published_date=eq.${date}`);
  return filters;
}
function cleanNewsSummary(summary) {
  return summary.replace(/\bArticle URL:\s*https?:\/\/\S+/gi, " ").replace(/\bComments URL:\s*https?:\/\/\S+/gi, " ").replace(/\bPoints:\s*\d+/gi, " ").replace(/#\s*Comments:\s*\d+/gi, " ").replace(/\bComments:\s*\d+/gi, " ").replace(/\s+/g, " ").trim();
}
function buildReadableNewsSummary(input) {
  const cleaned = cleanNewsSummary(input.summary);
  if (cleaned) return truncateNewsText(cleaned, NEWS_EXCERPT_MAX_LENGTH);
  const title = input.title.trim();
  if (title) return truncateNewsText(`文章主题：${title}`, NEWS_EXCERPT_MAX_LENGTH);
  return `来自 ${input.sourceName || "未知来源"} 的 AI 资讯条目。`;
}
function truncateNewsText(text, max) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
function calNavButton$1(symbol, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "frontier-cal-navbtn";
  button.textContent = symbol;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}
function newsCard(item, rankNumber, active2, onSelect) {
  const card2 = document.createElement("article");
  card2.className = "frontier-timeline-item";
  card2.dataset.listDetailKey = item.externalId;
  card2.tabIndex = 0;
  card2.setAttribute("role", "button");
  card2.setAttribute("aria-label", `阅读站内详情：${item.title}`);
  const marker = document.createElement("span");
  marker.className = "frontier-timeline-marker";
  marker.setAttribute("aria-hidden", "true");
  const content = document.createElement("div");
  content.className = "frontier-timeline-card";
  const cardHead = document.createElement("div");
  cardHead.className = "frontier-timeline-head";
  const rank = document.createElement("span");
  rank.className = "frontier-timeline-rank";
  rank.textContent = String(rankNumber).padStart(2, "0");
  const kind = document.createElement("span");
  kind.className = "frontier-timeline-kind";
  kind.textContent = item.sourceKind;
  cardHead.append(rank, kind);
  const title = document.createElement("h3");
  title.className = "frontier-timeline-title";
  title.textContent = item.title;
  const excerpt = document.createElement("p");
  excerpt.className = "frontier-timeline-excerpt";
  excerpt.textContent = item.summary;
  const meta = document.createElement("div");
  meta.className = "frontier-timeline-meta";
  const source = document.createElement("span");
  source.className = "frontier-timeline-source";
  source.textContent = item.sourceName;
  const layer = document.createElement("span");
  layer.className = "frontier-timeline-layer";
  layer.textContent = item.ecosystemLayerLabel;
  const read = document.createElement("a");
  read.className = "frontier-timeline-read";
  read.href = item.url;
  read.target = "_blank";
  read.rel = "noreferrer";
  read.textContent = "打开原文";
  read.setAttribute("aria-label", `打开原文：${item.title}`);
  meta.append(source, layer, read);
  content.append(cardHead, title, excerpt, meta);
  card2.append(marker, content);
  card2.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) return;
    onSelect(card2);
  });
  card2.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(card2);
  });
  return card2;
}
function newsArticleHref$1(externalId, returnPath) {
  return withReturnPath(`${BASE$4}news/article?id=${encodeURIComponent(externalId)}`, returnPath);
}
function groupByDate(items) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key2 = item.collectedDate.slice(0, 10) || "unknown";
    const existing = groups.get(key2);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    groups.set(key2, { date: key2, label: formatChineseDateLabel$1(key2), items: [item] });
  }
  return [...groups.values()].sort((left, right) => right.date.localeCompare(left.date));
}
function normalizeRow$1(row) {
  const collectionDate = stringValue$2(row.collected_date, "2026-06-17");
  const publishedAt = typeof row.published_at === "string" ? row.published_at : null;
  const publishedDate = dateStringValue(row.published_date, (publishedAt == null ? void 0 : publishedAt.slice(0, 10)) ?? collectionDate);
  const layer = layerValue$1(row.ecosystem_layer);
  const title = stringValue$2(row.title, "");
  const sourceName = stringValue$2(row.source_name, "未知来源");
  const sourceKind = stringValue$2(row.source_kind, "news");
  const ecosystemLayerLabel = stringValue$2(row.ecosystem_layer_label, layerLabel$1(layer));
  const rawSummary = stringValue$2(row.summary, "");
  const rawContentExcerpt = stringValue$2(row.content_excerpt, "");
  const tags = stringArrayValue$2(row.tags);
  const readableInput = {
    title,
    summary: rawContentExcerpt || rawSummary,
    sourceName
  };
  return {
    externalId: stringValue$2(row.external_id, ""),
    title,
    url: stringValue$2(row.url, ""),
    summary: buildReadableNewsSummary(readableInput),
    contentExcerpt: buildReadableNewsSummary(readableInput),
    sourceName,
    sourceKind,
    ecosystemLayer: layer,
    ecosystemLayerLabel,
    collectedDate: publishedDate,
    publishedAt,
    publishedDate,
    collectionDate,
    readCount: numberValue$2(row.read_count, 0),
    tags
  };
}
function normalizeFilterIndexRow(row) {
  const publishedDate = dateStringValue(row.published_date, "2026-06-17");
  const ecosystemLayer = layerValue$1(row.ecosystem_layer);
  return {
    collectedDate: publishedDate,
    ecosystemLayer,
    sourceName: stringValue$2(row.source_name, "未知来源")
  };
}
function statItem$1(value, label) {
  const item = document.createElement("div");
  item.className = "frontier-news-stat";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  return item;
}
function stringValue$2(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
function dateStringValue(value, fallback) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}
function numberValue$2(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function stringArrayValue$2(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}
function layerValue$1(value) {
  if (typeof value === "string" && FRONTIER_ECOSYSTEM_LAYERS.some((layer) => layer.id === value)) {
    return value;
  }
  return "foundation";
}
function layerLabel$1(layer) {
  var _a;
  return ((_a = FRONTIER_ECOSYSTEM_LAYERS.find((item) => item.id === layer)) == null ? void 0 : _a.label) ?? layer;
}
function formatChineseDateLabel$1(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return DEFAULT_DATE_LABEL$1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return DEFAULT_DATE_LABEL$1;
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${month}月${day}日 · ${weekday}`;
}
function statusBlock$2(message) {
  const status2 = document.createElement("div");
  status2.className = "frontier-archive-status";
  status2.textContent = message;
  return status2;
}
var define_FRONTIER_SUPABASE_CONFIG_default$5 = { url: "https://br-ideal-fawn-814db5fc.supabase.aidap-global.cn-beijing.volces.com:443", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjcwMzc5MzA0fQ.qiaVI4H2eZ1-5BywE5ORmEPf8_lmuq7-hW-f1lgqwWc", schema: "public" };
const DETAIL_COLUMNS$2 = [
  "external_id",
  "title",
  "url",
  "summary",
  "content_text",
  "content_excerpt",
  "content_status",
  "source_name",
  "source_kind",
  "ecosystem_layer_label",
  "tags",
  "published_at",
  "published_date"
].join(",");
const NAVIGATION_COLUMNS = ["external_id", "title", "published_at", "published_date"].join(",");
const BASE$3 = "/";
const initialized$8 = /* @__PURE__ */ new WeakSet();
const renderedIdByRoot = /* @__PURE__ */ new WeakMap();
const requestVersionByRoot$1 = /* @__PURE__ */ new WeakMap();
const NEWS_LOCATION_CHANGE_EVENT = "agent-build:news-locationchange";
let locationSyncInstalled$1 = false;
if (typeof window !== "undefined") {
  installNewsArticleDetail();
}
function installNewsArticleDetail() {
  installLocationSync$1();
  scanNewsArticleDetail();
  const observer = new MutationObserver(() => scanNewsArticleDetail());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener(NEWS_LOCATION_CHANGE_EVENT, () => scanNewsArticleDetail());
}
function scanNewsArticleDetail() {
  document.querySelectorAll("[data-news-article]").forEach((root) => {
    if (!initialized$8.has(root)) {
      initialized$8.add(root);
      mount$3(root);
      return;
    }
    refreshRoot$1(root);
  });
}
function mount$3(root) {
  root.classList.add("news-article-detail");
  refreshRoot$1(root, true);
}
function refreshRoot$1(root, force = false) {
  const id = newsArticleIdFromSearch(window.location.search);
  const renderedId = renderedIdByRoot.get(root) ?? null;
  if (!force && !shouldRefreshNewsArticleDetail(renderedId, window.location.search)) return;
  const nextRequestVersion = (requestVersionByRoot$1.get(root) ?? 0) + 1;
  requestVersionByRoot$1.set(root, nextRequestVersion);
  renderedIdByRoot.set(root, id);
  if (!id) {
    root.replaceChildren(status$3("缺少文章 id。请从 AI 资讯列表进入文章详情。"));
    return;
  }
  root.replaceChildren(status$3("正在加载文章正文..."));
  Promise.all([loadArticle$2(id), loadArticleNavigation(id)]).then(([row, navigation]) => {
    if (requestVersionByRoot$1.get(root) !== nextRequestVersion) return;
    if (!row) {
      root.replaceChildren(status$3("未找到该文章，可能已下线或尚未同步。"));
      return;
    }
    render$4(root, row, navigation);
  }).catch((error) => {
    if (requestVersionByRoot$1.get(root) !== nextRequestVersion) return;
    root.replaceChildren(status$3(`加载失败：${error instanceof Error ? error.message : String(error)}`));
  });
}
function requireSupabaseConfig() {
  const config = define_FRONTIER_SUPABASE_CONFIG_default$5 ?? null;
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" };
}
async function loadArticle$2(id) {
  const config = requireSupabaseConfig();
  const rows = await fetchAllPostgrestRows({
    config,
    table: "news_items",
    select: DETAIL_COLUMNS$2,
    filters: [`external_id=eq.${encodeURIComponent(id)}`],
    pageSize: 1,
    maxPages: 2
  });
  return rows[0] ?? null;
}
async function loadArticleNavigation(id) {
  const config = requireSupabaseConfig();
  const rows = await fetchAllPostgrestRows({
    config,
    table: "news_items",
    select: NAVIGATION_COLUMNS,
    order: ["published_date.desc", "published_at.desc"],
    pageSize: 1e3
  });
  return resolveArticleNavigation(rows, id);
}
function render$4(root, row, navigation) {
  const returnPath = newsArticleReturnPathFromSearch(window.location.search);
  const title = asString$3(row.title) || "未命名文章";
  const url = asString$3(row.url);
  const sourceName = asString$3(row.source_name) || "未知来源";
  const layer = asString$3(row.ecosystem_layer_label) || "未分类";
  const tags = stringArray$1(row.tags);
  const paragraphs = buildNewsArticleParagraphs({
    title,
    contentText: asString$3(row.content_text),
    contentExcerpt: asString$3(row.content_excerpt),
    summary: asString$3(row.summary)
  });
  const article = el$3("article", "news-detail-card");
  const header = el$3("header", "news-detail-header");
  header.append(el$3("p", "news-detail-eyebrow", "AI 资讯 · 站内详情"));
  header.append(el$3("h1", "news-detail-title", title));
  const meta = el$3("div", "news-detail-meta");
  meta.append(el$3("span", "news-detail-chip", sourceName));
  meta.append(el$3("span", "news-detail-chip", layer));
  const date = formatDate(asString$3(row.published_at), asString$3(row.published_date));
  if (date) meta.append(el$3("span", "news-detail-chip", date));
  header.append(meta);
  if (tags.length > 0) {
    const tagList = el$3("div", "news-detail-tags");
    for (const tag of tags.slice(0, 8)) tagList.append(el$3("span", "news-detail-tag", tag));
    header.append(tagList);
  }
  const body = el$3("div", "news-detail-body vp-doc");
  for (const paragraph of paragraphs) {
    body.append(el$3("p", "news-detail-paragraph", paragraph));
  }
  const actions = el$3("div", "news-detail-actions");
  const back = document.createElement("a");
  back.className = "news-detail-original";
  back.href = returnPath;
  back.textContent = "返回列表";
  actions.append(back);
  if (url) {
    const original = document.createElement("a");
    original.className = "news-detail-original";
    original.href = url;
    original.target = "_blank";
    original.rel = "noreferrer";
    original.textContent = "打开原文";
    actions.append(original);
  }
  article.append(header, body, actions);
  const navigationSection = buildArticleNavigation(navigation, returnPath);
  root.replaceChildren(...navigationSection ? [article, navigationSection] : [article]);
  document.title = `${title} | AI 资讯`;
}
function buildNewsArticleParagraphs(input) {
  const content = normalizeText$1(input.contentText);
  if (content) return splitArticleParagraphs(content);
  const excerpt = normalizeText$1(input.contentExcerpt) || cleanNewsSummary(input.summary);
  if (excerpt) {
    return [excerpt, "该条资讯暂未抓取到更完整的站内正文，请使用下方按钮打开原文查看全文。"];
  }
  return [`文章主题：${input.title}`, "该条资讯暂未抓取到可展示正文，请使用下方按钮打开原文查看全文。"];
}
function splitArticleParagraphs(text) {
  const byBreaks = text.split(/\n{2,}/).map((part) => normalizeText$1(part)).filter(Boolean);
  if (byBreaks.length > 0) return byBreaks;
  return [normalizeText$1(text)].filter(Boolean);
}
function resolveArticleNavigation(rows, currentId) {
  const items = rows.map((row) => ({
    externalId: asString$3(row.external_id),
    title: asString$3(row.title)
  })).filter((item) => item.externalId && item.title);
  const index = items.findIndex((item) => item.externalId === currentId);
  if (index < 0) return null;
  const previous = items[index - 1] ?? null;
  const next = items[index + 1] ?? null;
  if (!previous && !next) return null;
  return { previous, next };
}
function buildArticleNavigation(navigation, returnPath) {
  if (!(navigation == null ? void 0 : navigation.previous) && !(navigation == null ? void 0 : navigation.next)) return null;
  const section = el$3("section", "interview-detail-section interview-detail-nav");
  section.append(el$3("h2", "interview-detail-section-title", "文章切换"));
  const grid = el$3("div", "interview-detail-nav-grid");
  if (navigation.previous) grid.append(navigationCard$1("上一篇", navigation.previous.externalId, navigation.previous.title, returnPath));
  if (navigation.next) grid.append(navigationCard$1("下一篇", navigation.next.externalId, navigation.next.title, returnPath));
  section.append(grid);
  return section;
}
function navigationCard$1(label, externalId, title, returnPath) {
  const link2 = document.createElement("a");
  link2.className = "interview-detail-nav-card";
  link2.href = newsArticleHref(externalId, returnPath);
  link2.append(el$3("span", "interview-detail-nav-label", label));
  link2.append(el$3("strong", "interview-detail-nav-title", title));
  return link2;
}
function newsArticleHref(externalId, returnPath) {
  return withReturnPath(`${BASE$3}news/article?id=${encodeURIComponent(externalId)}`, returnPath);
}
function newsArticleReturnPathFromSearch(search) {
  return safeReturnPathFromSearch(search, `${BASE$3}news/`);
}
function newsArticleIdFromSearch(search) {
  var _a;
  const id = ((_a = new URLSearchParams(search).get("id")) == null ? void 0 : _a.trim()) || "";
  return id || null;
}
function shouldRefreshNewsArticleDetail(renderedId, search) {
  return (renderedId ?? null) !== newsArticleIdFromSearch(search);
}
function installLocationSync$1() {
  if (locationSyncInstalled$1) return;
  locationSyncInstalled$1 = true;
  const emitLocationChange = () => window.dispatchEvent(new Event(NEWS_LOCATION_CHANGE_EVENT));
  patchHistoryMethod$1("pushState", emitLocationChange);
  patchHistoryMethod$1("replaceState", emitLocationChange);
  window.addEventListener("popstate", emitLocationChange);
  window.addEventListener("hashchange", emitLocationChange);
}
function patchHistoryMethod$1(method, onChange) {
  const original = window.history[method];
  window.history[method] = function patchedHistoryMethod(...args) {
    const result = original.apply(this, args);
    onChange();
    return result;
  };
}
function normalizeText$1(text) {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function formatDate(publishedAt, publishedDate) {
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }
  return publishedDate;
}
function el$3(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function status$3(message) {
  return el$3("div", "news-detail-status", message);
}
function asString$3(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
function stringArray$1(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}
function createDemoFrameParser(onFrame) {
  let buffer = "";
  function readLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parsed = JSON.parse(trimmed);
    if (!isDemoFrame(parsed)) {
      throw new Error(`Invalid demo frame: ${trimmed}`);
    }
    onFrame(parsed);
  }
  return {
    push(chunk) {
      buffer += chunk;
      while (true) {
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex === -1) break;
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        readLine(line);
      }
    },
    flush() {
      if (!buffer.trim()) {
        buffer = "";
        return;
      }
      const line = buffer;
      buffer = "";
      readLine(line);
    }
  };
}
function isDemoFrame(value) {
  if (!value || typeof value !== "object") return false;
  const type = value.type;
  return type === "stdout" || type === "stderr" || type === "thinking" || type === "done" || type === "exit";
}
class RunnerHttpError extends Error {
  constructor(statusCode) {
    super(`runner request failed: ${statusCode}`);
    this.statusCode = statusCode;
  }
}
const initialized$7 = /* @__PURE__ */ new WeakSet();
if (typeof window !== "undefined") {
  installDemoRunnerPanels();
}
function installDemoRunnerPanels() {
  scanDemoRunnerPanels();
  const observer = new MutationObserver(() => scanDemoRunnerPanels());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scanDemoRunnerPanels() {
  document.querySelectorAll("[data-demo-runner]").forEach((root) => {
    if (initialized$7.has(root)) return;
    initialized$7.add(root);
    createPanel(root);
  });
}
function createPanel(root) {
  var _a, _b;
  const token = readBuildConstant$1("__DEMO_RUNNER_TOKEN__", "");
  if (!shouldInstallDemoRunnerPanel(false, token)) {
    root.hidden = true;
    root.replaceChildren();
    return;
  }
  const demoId = ((_a = root.dataset.demoId) == null ? void 0 : _a.trim()) ?? "";
  const demoTitle = ((_b = root.dataset.demoTitle) == null ? void 0 : _b.trim()) || `Demo ${demoId}`;
  const needsKey = root.dataset.needsKey ?? "llm";
  const state2 = {
    baseURL: readBuildConstant$1("__DEMO_RUNNER_BASE_URL__", "http://127.0.0.1:5174") || "http://127.0.0.1:5174",
    token,
    available: false,
    canRun: false,
    running: false,
    message: "正在检测本地 runner..."
  };
  root.classList.add("demo-runner-card");
  root.innerHTML = "";
  const header = document.createElement("div");
  header.className = "demo-runner-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("p");
  title.className = "demo-runner-title";
  title.textContent = `本章代码演示：${demoTitle}`;
  const meta = document.createElement("div");
  meta.className = "demo-runner-meta";
  const statusBadge = createBadge("检测中", "warn");
  const providerBadge = createBadge("provider: -", "");
  const keyBadge = createBadge(needsKey === "none" ? "无需 key" : "key: 检测中", "");
  meta.append(statusBadge, providerBadge, keyBadge);
  titleWrap.append(title, meta);
  const toolbar = document.createElement("div");
  toolbar.className = "demo-runner-toolbar";
  const runButton = createButton("运行");
  const stopButton = createButton("停止");
  const clearButton = createButton("清屏");
  stopButton.disabled = true;
  toolbar.append(runButton, stopButton, clearButton);
  header.append(titleWrap, toolbar);
  const terminalMount = document.createElement("div");
  terminalMount.className = "demo-runner-terminal";
  const message = document.createElement("div");
  message.className = "demo-runner-message";
  message.textContent = state2.message;
  root.append(header, terminalMount, message);
  const elements = {
    runButton,
    stopButton,
    statusBadge,
    providerBadge,
    keyBadge,
    message
  };
  renderState(elements, state2, needsKey);
  let terminalState;
  let terminalWriter;
  let abortController;
  runButton.addEventListener("click", async () => {
    if (!demoId || !state2.canRun || state2.running) return;
    terminalState ?? (terminalState = await ensureTerminal(terminalMount));
    terminalWriter ?? (terminalWriter = createBufferedTerminalWriter(terminalState.term));
    terminalState.term.clear();
    terminalState.term.writeln(`$ pnpm lesson ${demoId}`);
    terminalState.term.writeln("");
    state2.running = true;
    state2.message = "运行中...";
    renderState(elements, state2, needsKey);
    abortController = new AbortController();
    try {
      await runDemo({
        baseURL: state2.baseURL,
        token: state2.token,
        demoId,
        signal: abortController.signal,
        onFrame(frame) {
          terminalWriter.writeFrame(frame);
        }
      });
      terminalWriter.flush();
      state2.message = "运行结束。";
    } catch (error) {
      terminalWriter == null ? void 0 : terminalWriter.flush();
      const detail = error instanceof Error ? error.message : "unknown error";
      terminalState.term.writeln(`\x1B[31m${detail}\x1B[0m`);
      state2.message = "运行失败。";
    } finally {
      state2.running = false;
      abortController = void 0;
      renderState(elements, state2, needsKey);
    }
  });
  stopButton.addEventListener("click", async () => {
    abortController == null ? void 0 : abortController.abort();
    await stopDemo(state2.baseURL, state2.token).catch(() => void 0);
  });
  clearButton.addEventListener("click", async () => {
    terminalState ?? (terminalState = await ensureTerminal(terminalMount));
    terminalState.term.clear();
  });
  void probeConfig(state2, elements, needsKey);
}
async function probeConfig(state2, elements, needsKey) {
  try {
    const response = await fetch(`${state2.baseURL}/api/config`, {
      method: "GET",
      headers: runnerHeaders(state2.token)
    });
    if (!response.ok) throw new RunnerHttpError(response.status);
    const payload = await response.json();
    if (!payload.ok || !payload.config) throw new Error("runner config payload is invalid");
    state2.config = payload.config;
    state2.available = true;
    state2.canRun = canRunWithConfig(payload.config, needsKey);
    state2.message = state2.canRun ? "本地 runner 已就绪。" : missingKeyMessage(payload.config, needsKey);
  } catch (error) {
    state2.available = false;
    state2.canRun = false;
    state2.message = configErrorMessage(error);
  }
  renderState(elements, state2, needsKey);
}
async function runDemo(options) {
  const response = await fetch(`${options.baseURL}/api/run?demo=${encodeURIComponent(options.demoId)}`, {
    method: "POST",
    headers: runnerHeaders(options.token),
    signal: options.signal
  });
  if (!response.ok || !response.body) {
    throw new Error(`runner request failed: ${response.status}`);
  }
  const parser = createDemoFrameParser(options.onFrame);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(value);
  }
  parser.flush();
}
async function stopDemo(baseURL, token) {
  if (!token) return;
  await fetch(`${baseURL}/api/stop`, {
    method: "POST",
    headers: runnerHeaders(token)
  });
}
async function ensureTerminal(mount2) {
  const [{ Terminal }, { FitAddon }] = await Promise.all([
    import("@xterm/xterm"),
    import("@xterm/addon-fit"),
    Promise.resolve({          })
  ]);
  if (mount2.dataset.ready === "1") {
    return mount2.__terminalState;
  }
  const term = new Terminal({
    convertEol: true,
    cursorBlink: false,
    fontFamily: "JetBrains Mono, Consolas, monospace",
    fontSize: 13,
    theme: {
      background: "#0f172a",
      foreground: "#e5e7eb"
    }
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(mount2);
  fit.fit();
  const resizeObserver = new ResizeObserver(() => fit.fit());
  resizeObserver.observe(mount2);
  mount2.dataset.ready = "1";
  const state2 = { term, fit };
  mount2.__terminalState = state2;
  return state2;
}
function createBufferedTerminalWriter(term, schedule = scheduleTerminalFlush) {
  let queue = [];
  let scheduled = false;
  let activeSegment;
  const flush = () => {
    scheduled = false;
    const frames = queue;
    queue = [];
    for (const frame of frames) {
      writeFrameNow(term, frame, activeSegment);
      activeSegment = nextSegment(activeSegment, frame);
    }
  };
  return {
    writeFrame(frame) {
      queue.push(frame);
      if (scheduled) return;
      scheduled = true;
      schedule(flush);
    },
    flush
  };
}
function writeFrameNow(term, frame, activeSegment) {
  if (frame.type === "stdout") {
    closeDecoratedSegment(term, activeSegment);
    term.write(String(frame.data));
    return;
  }
  if (frame.type === "stderr") {
    if (activeSegment !== "stderr") {
      closeDecoratedSegment(term, activeSegment);
      term.write(`\x1B[33m[stderr]\x1B[0m \x1B[33m${String(frame.data)}\x1B[0m`);
      return;
    }
    term.write(`\x1B[33m${String(frame.data)}\x1B[0m`);
    return;
  }
  if (frame.type === "thinking") {
    if (activeSegment !== "thinking") {
      closeDecoratedSegment(term, activeSegment);
      term.write(`\x1B[36m[thinking]\x1B[0m \x1B[2m${String(frame.data)}`);
      return;
    }
    term.write(String(frame.data));
    return;
  }
  if (frame.type === "exit") {
    closeDecoratedSegment(term, activeSegment);
    term.writeln("");
    term.writeln(`exit: ${String(frame.data)}`);
  }
}
function closeDecoratedSegment(term, activeSegment) {
  if (activeSegment === "thinking" || activeSegment === "stderr") {
    term.write("\x1B[0m\n");
  }
}
function nextSegment(activeSegment, frame) {
  if (frame.type === "thinking" || frame.type === "stderr") return frame.type;
  if (frame.type === "stdout") return "stdout";
  if (frame.type === "exit") return void 0;
  return activeSegment;
}
function scheduleTerminalFlush(flush) {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(flush);
    return;
  }
  setTimeout(flush, 16);
}
function renderState(elements, state2, needsKey) {
  elements.runButton.disabled = !state2.canRun || state2.running;
  elements.stopButton.disabled = !state2.running;
  elements.message.textContent = state2.message;
  if (state2.running) {
    setBadge(elements.statusBadge, "运行中", "warn");
  } else if (state2.available && state2.canRun) {
    setBadge(elements.statusBadge, "runner ready", "ok");
  } else {
    setBadge(elements.statusBadge, "runner offline", "bad");
  }
  if (state2.config) {
    setBadge(elements.providerBadge, `${state2.config.provider} / ${state2.config.model}`, "");
    const keyRequired = needsKey !== "none" && state2.config.provider !== "ollama";
    setBadge(
      elements.keyBadge,
      keyRequired ? state2.config.hasKey ? "key ready" : "key missing" : "无需 key",
      keyRequired ? state2.config.hasKey ? "ok" : "bad" : "ok"
    );
  } else {
    setBadge(elements.providerBadge, "provider: -", "");
    setBadge(elements.keyBadge, needsKey === "none" ? "无需 key" : "key: -", "");
  }
}
function canRunWithConfig(config, needsKey) {
  if (needsKey === "none") return true;
  if (config.provider === "ollama") return true;
  return config.hasKey;
}
function missingKeyMessage(config, needsKey) {
  if (needsKey === "embedding") {
    return `当前 ${config.provider} 配置缺少可用 key；该 demo 需要 embedding key。`;
  }
  return `当前 ${config.provider} 配置缺少可用 key；请检查 .env。`;
}
function runnerHeaders(token) {
  const headers = {
    "X-Demo-Runner": "1"
  };
  if (token) headers["X-Demo-Runner-Token"] = token;
  return headers;
}
function configErrorMessage(error) {
  if (error instanceof RunnerHttpError && error.statusCode === 401) {
    return "生产 runner 需要先登录 songuu.top。";
  }
  if (error instanceof RunnerHttpError && error.statusCode === 403) {
    return "生产 runner 拒绝当前请求。请确认登录状态与访问域名。";
  }
  return "runner 未启动或无法连接。";
}
function createButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "demo-runner-button";
  button.textContent = label;
  return button;
}
function createBadge(label, tone) {
  const badge = document.createElement("span");
  badge.className = "demo-runner-badge";
  setBadge(badge, label, tone);
  return badge;
}
function setBadge(badge, label, tone) {
  badge.textContent = label;
  if (tone) badge.dataset.tone = tone;
  else delete badge.dataset.tone;
}
function readBuildConstant$1(_name, value) {
  return typeof value === "string" ? value : "";
}
function shouldInstallDemoRunnerPanel(clientEnabled, token) {
  return Boolean(token);
}
const MIN_SCALE = 0.45;
const MAX_SCALE = 3;
const SCALE_STEP = 0.18;
const MAX_RENDER_ATTEMPTS = 30;
const INITIAL_FIT_PADDING = 28;
const MIN_SURFACE_HEIGHT = 160;
const MAX_SURFACE_HEIGHT = 520;
const INITIAL_MAX_SCALE = 1.8;
const MIN_CONTAIN_SCALE = 0.5;
const OVERLAY_MIN_SCALE = MIN_SCALE;
const OVERLAY_MAX_SCALE = 2.5;
const SVG_BOUNDS_PADDING = 8;
const initializedDiagrams = /* @__PURE__ */ new WeakSet();
const pendingDiagrams = /* @__PURE__ */ new WeakMap();
if (typeof window !== "undefined") {
  scheduleZoomableDiagramsInstall();
}
function scheduleZoomableDiagramsInstall() {
  const installAfterHydration = () => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => installZoomableDiagrams());
    }, 0);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installAfterHydration, { once: true });
    return;
  }
  installAfterHydration();
}
function installZoomableDiagrams() {
  scanMermaidDiagrams();
  const observer = new MutationObserver(() => scanMermaidDiagrams());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scanMermaidDiagrams() {
  document.querySelectorAll(".vp-doc .mermaid").forEach((diagram) => {
    if (initializedDiagrams.has(diagram)) return;
    if (!diagram.querySelector("svg")) {
      scheduleDiagramRetry(diagram);
      return;
    }
    initializedDiagrams.add(diagram);
    upgradeMermaidDiagram(diagram);
  });
}
function scheduleDiagramRetry(diagram) {
  const attempts = pendingDiagrams.get(diagram) ?? 0;
  if (attempts >= MAX_RENDER_ATTEMPTS) return;
  pendingDiagrams.set(diagram, attempts + 1);
  window.setTimeout(() => {
    if (initializedDiagrams.has(diagram) || !diagram.isConnected) return;
    if (!diagram.querySelector("svg")) {
      scheduleDiagramRetry(diagram);
      return;
    }
    initializedDiagrams.add(diagram);
    upgradeMermaidDiagram(diagram);
  }, 120);
}
function upgradeMermaidDiagram(diagram) {
  var _a;
  const viewport = document.createElement("div");
  viewport.className = "diagram-zoom-viewport";
  viewport.setAttribute("tabindex", "0");
  viewport.setAttribute("role", "group");
  viewport.setAttribute("aria-label", "可缩放流程图或思维导图");
  const surface = document.createElement("div");
  surface.className = "diagram-zoom-surface";
  const toolbar = document.createElement("div");
  toolbar.className = "diagram-zoom-toolbar";
  toolbar.setAttribute("aria-label", "图表缩放控制");
  const zoomOutButton = createZoomButton("−", "缩小");
  const resetButton = createZoomButton("100%", "重置缩放");
  const zoomInButton = createZoomButton("+", "放大");
  const expandButton = createZoomButton("⤢", "全屏查看");
  expandButton.classList.add("diagram-zoom-expand");
  toolbar.append(zoomOutButton, resetButton, zoomInButton, expandButton);
  const content = document.createElement("div");
  content.className = "diagram-zoom-content";
  const parent = diagram.parentElement;
  if (!parent) return;
  parent.insertBefore(viewport, diagram);
  viewport.append(toolbar, surface);
  surface.append(content);
  const syncDiagramContent = () => {
    const sourceSvg = diagram.querySelector("svg");
    if (!sourceSvg) return false;
    content.replaceChildren(sourceSvg.cloneNode(true));
    normalizeDiagramSvgSize(content);
    return true;
  };
  if (!syncDiagramContent()) {
    viewport.remove();
    return;
  }
  diagram.hidden = true;
  diagram.setAttribute("aria-hidden", "true");
  expandButton.addEventListener("click", () => openDiagramOverlay(content));
  const state2 = { scale: 1, x: 0, y: 0 };
  let dragStart;
  let hasUserTransform = false;
  let syncFrame;
  let lastBounds;
  const apply = () => {
    content.style.transform = `translate(${state2.x}px, ${state2.y}px) scale(${state2.scale})`;
    resetButton.textContent = `${Math.round(state2.scale * 100)}%`;
    updateOverflowAffordance(surface, state2, lastBounds);
  };
  const fitToSurface = (contentRect) => {
    lastBounds = fitDiagramToSurface(surface, content, state2, contentRect);
    apply();
  };
  const sourceObserver = new MutationObserver(() => {
    if (syncFrame !== void 0) return;
    syncFrame = window.requestAnimationFrame(() => {
      syncFrame = void 0;
      if (!syncDiagramContent() || hasUserTransform) return;
      fitToSurface();
    });
  });
  sourceObserver.observe(diagram, { childList: true, subtree: true });
  const zoomBy = (delta, origin) => {
    const nextScale = clamp$1(state2.scale + delta, MIN_SCALE, MAX_SCALE);
    if (nextScale === state2.scale) return;
    if (origin) {
      const scaleRatio = nextScale / state2.scale;
      state2.x = origin.x - (origin.x - state2.x) * scaleRatio;
      state2.y = origin.y - (origin.y - state2.y) * scaleRatio;
    }
    state2.scale = nextScale;
    hasUserTransform = true;
    apply();
  };
  zoomOutButton.addEventListener("click", () => zoomBy(-SCALE_STEP));
  zoomInButton.addEventListener("click", () => zoomBy(SCALE_STEP));
  resetButton.addEventListener("click", () => {
    hasUserTransform = false;
    fitToSurface();
  });
  surface.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const rect = surface.getBoundingClientRect();
    zoomBy(event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }, { passive: false });
  surface.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragStart = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: state2.x,
      y: state2.y
    };
    surface.setPointerCapture(event.pointerId);
    surface.classList.add("is-dragging");
  });
  surface.addEventListener("pointermove", (event) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    const nextX = dragStart.x + event.clientX - dragStart.clientX;
    const nextY = dragStart.y + event.clientY - dragStart.clientY;
    if (nextX !== state2.x || nextY !== state2.y) hasUserTransform = true;
    state2.x = nextX;
    state2.y = nextY;
    apply();
  });
  const stopDrag = (event) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStart = void 0;
    surface.releasePointerCapture(event.pointerId);
    surface.classList.remove("is-dragging");
  };
  surface.addEventListener("pointerup", stopDrag);
  surface.addEventListener("pointercancel", stopDrag);
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      var _a2;
      const contentRect = (_a2 = entries[0]) == null ? void 0 : _a2.contentRect;
      if (!contentRect || hasUserTransform) return;
      fitToSurface(contentRect);
    });
    resizeObserver.observe(surface);
  }
  window.requestAnimationFrame(() => fitToSurface());
  (_a = document.fonts) == null ? void 0 : _a.ready.then(() => {
    if (!hasUserTransform) fitToSurface();
  }).catch(() => void 0);
}
function openDiagramOverlay(sourceDiagram) {
  const sourceSvg = sourceDiagram.querySelector("svg");
  if (!sourceSvg) return;
  const previouslyFocused = document.activeElement;
  const previousBodyOverflow = document.body.style.overflow;
  const overlay = document.createElement("div");
  overlay.className = "diagram-zoom-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "图表全屏查看");
  const panel = document.createElement("div");
  panel.className = "diagram-zoom-overlay-panel";
  const toolbar = document.createElement("div");
  toolbar.className = "diagram-zoom-toolbar";
  toolbar.setAttribute("aria-label", "图表缩放控制");
  const zoomOutButton = createZoomButton("−", "缩小");
  const resetButton = createZoomButton("100%", "重置缩放");
  const zoomInButton = createZoomButton("+", "放大");
  const closeButton = createZoomButton("✕", "关闭全屏");
  closeButton.classList.add("diagram-zoom-close");
  toolbar.append(zoomOutButton, resetButton, zoomInButton, closeButton);
  const surface = document.createElement("div");
  surface.className = "diagram-zoom-surface diagram-zoom-overlay-surface";
  const content = document.createElement("div");
  content.className = "diagram-zoom-content";
  content.append(sourceSvg.cloneNode(true));
  surface.append(content);
  panel.append(toolbar, surface);
  overlay.append(panel);
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  normalizeDiagramSvgSize(content);
  const state2 = { scale: 1, x: 0, y: 0 };
  let dragStart;
  const apply = () => {
    content.style.transform = `translate(${state2.x}px, ${state2.y}px) scale(${state2.scale})`;
    resetButton.textContent = `${Math.round(state2.scale * 100)}%`;
  };
  const fit = () => {
    const previousTransform = content.style.transform;
    content.style.transform = "none";
    const bounds = getDiagramBounds(content);
    content.style.transform = previousTransform;
    if (!(surface.clientWidth > 0) || !(surface.clientHeight > 0) || !(bounds.width > 0) || !(bounds.height > 0)) {
      state2.scale = 1;
      state2.x = 0;
      state2.y = 0;
      apply();
      return;
    }
    const fitted = calculateContainedFit({
      surfaceWidth: surface.clientWidth,
      surfaceHeight: surface.clientHeight,
      bounds,
      minScale: OVERLAY_MIN_SCALE,
      maxScale: OVERLAY_MAX_SCALE
    });
    state2.scale = fitted.scale;
    state2.x = fitted.x;
    state2.y = fitted.y;
    apply();
  };
  const zoomBy = (delta, origin) => {
    const nextScale = clamp$1(state2.scale + delta, MIN_SCALE, MAX_SCALE);
    if (nextScale === state2.scale) return;
    if (origin) {
      const scaleRatio = nextScale / state2.scale;
      state2.x = origin.x - (origin.x - state2.x) * scaleRatio;
      state2.y = origin.y - (origin.y - state2.y) * scaleRatio;
    }
    state2.scale = nextScale;
    apply();
  };
  const focusables = [zoomOutButton, resetButton, zoomInButton, closeButton];
  const onResize = () => fit();
  const onKeydown = (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const active2 = document.activeElement;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && active2 === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active2 === last) {
      event.preventDefault();
      first.focus();
    } else if (!active2 || !focusables.includes(active2)) {
      event.preventDefault();
      first.focus();
    }
  };
  const close = () => {
    var _a;
    if (!overlay.isConnected) return;
    window.removeEventListener("resize", onResize);
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = previousBodyOverflow;
    overlay.remove();
    (_a = previouslyFocused == null ? void 0 : previouslyFocused.focus) == null ? void 0 : _a.call(previouslyFocused);
  };
  zoomOutButton.addEventListener("click", () => zoomBy(-SCALE_STEP));
  zoomInButton.addEventListener("click", () => zoomBy(SCALE_STEP));
  resetButton.addEventListener("click", () => fit());
  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  surface.addEventListener("wheel", (event) => {
    event.preventDefault();
    const rect = surface.getBoundingClientRect();
    zoomBy(event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }, { passive: false });
  surface.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragStart = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: state2.x, y: state2.y };
    surface.setPointerCapture(event.pointerId);
    surface.classList.add("is-dragging");
  });
  surface.addEventListener("pointermove", (event) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    state2.x = dragStart.x + event.clientX - dragStart.clientX;
    state2.y = dragStart.y + event.clientY - dragStart.clientY;
    apply();
  });
  const stopDrag = (event) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStart = void 0;
    surface.releasePointerCapture(event.pointerId);
    surface.classList.remove("is-dragging");
  };
  surface.addEventListener("pointerup", stopDrag);
  surface.addEventListener("pointercancel", stopDrag);
  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", onKeydown);
  closeButton.focus();
  window.requestAnimationFrame(fit);
}
function normalizeDiagramSvgSize(diagram) {
  const svg = diagram.querySelector("svg");
  const viewBox = svg == null ? void 0 : svg.viewBox.baseVal;
  if (!svg || !viewBox || viewBox.width <= 0 || viewBox.height <= 0) return;
  const bounds = expandSvgViewBoxToVisibleBounds(svg, viewBox) ?? {
    x: viewBox.x,
    y: viewBox.y,
    width: viewBox.width,
    height: viewBox.height
  };
  svg.style.width = `${Math.ceil(bounds.width)}px`;
  svg.style.height = `${Math.ceil(bounds.height)}px`;
  svg.style.maxWidth = "none";
  svg.style.overflow = "hidden";
  svg.dataset.diagramZoomNormalized = "true";
}
function expandSvgViewBoxToVisibleBounds(svg, viewBox) {
  try {
    const box = svg.getBBox();
    if (!box || box.width <= 0 || box.height <= 0) return void 0;
    const minX = Math.min(viewBox.x, box.x) - SVG_BOUNDS_PADDING;
    const minY = Math.min(viewBox.y, box.y) - SVG_BOUNDS_PADDING;
    const maxX = Math.max(viewBox.x + viewBox.width, box.x + box.width) + SVG_BOUNDS_PADDING;
    const maxY = Math.max(viewBox.y + viewBox.height, box.y + box.height) + SVG_BOUNDS_PADDING;
    const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    const viewBoxValue = [
      roundSvgNumber(bounds.x),
      roundSvgNumber(bounds.y),
      roundSvgNumber(bounds.width),
      roundSvgNumber(bounds.height)
    ].join(" ");
    svg.setAttribute("viewBox", viewBoxValue);
    return bounds;
  } catch {
    return void 0;
  }
}
function roundSvgNumber(value) {
  return Number(value.toFixed(3)).toString();
}
function fitDiagramToSurface(surface, diagram, state2, contentRect) {
  const surfaceWidth = (contentRect == null ? void 0 : contentRect.width) ?? surface.clientWidth;
  const previousTransform = diagram.style.transform;
  diagram.style.transform = "none";
  const bounds = getDiagramBounds(diagram);
  diagram.style.transform = previousTransform;
  if (!(surfaceWidth > 0) || !(bounds.width > 0) || !(bounds.height > 0)) {
    state2.scale = 1;
    state2.x = 0;
    state2.y = 0;
    return void 0;
  }
  const fit = calculateDiagramFit({ surfaceWidth, bounds, maxSurfaceHeight: viewportSurfaceHeightCap() });
  const nextHeight = `${Math.round(fit.surfaceHeight)}px`;
  if (surface.style.height !== nextHeight) {
    surface.style.height = nextHeight;
  }
  state2.scale = fit.scale;
  state2.x = fit.x;
  state2.y = fit.y;
  return bounds;
}
function updateOverflowAffordance(surface, state2, bounds) {
  if (!bounds) {
    surface.classList.remove("has-overflow-x", "has-overflow-y");
    return;
  }
  const rightHidden = state2.x + (bounds.x + bounds.width) * state2.scale - surface.clientWidth > 1;
  const bottomHidden = state2.y + (bounds.y + bounds.height) * state2.scale - surface.clientHeight > 1;
  surface.classList.toggle("has-overflow-x", rightHidden);
  surface.classList.toggle("has-overflow-y", bottomHidden);
}
function calculateDiagramFit(input) {
  const maxSurfaceHeight = clamp$1(
    input.maxSurfaceHeight ?? MAX_SURFACE_HEIGHT,
    MIN_SURFACE_HEIGHT,
    MAX_SURFACE_HEIGHT
  );
  const availableWidth = Math.max(1, input.surfaceWidth - INITIAL_FIT_PADDING * 2);
  const availableHeight = Math.max(1, maxSurfaceHeight - INITIAL_FIT_PADDING * 2);
  const widthScale = availableWidth / input.bounds.width;
  const heightScale = availableHeight / input.bounds.height;
  const containScale = Math.min(widthScale, heightScale);
  const scale = clamp$1(containScale, MIN_CONTAIN_SCALE, INITIAL_MAX_SCALE);
  const preferredHeight = input.bounds.height * scale + INITIAL_FIT_PADDING * 2;
  const surfaceHeight = clamp$1(preferredHeight, MIN_SURFACE_HEIGHT, maxSurfaceHeight);
  return {
    scale,
    surfaceHeight,
    x: calculateAxisOffset(input.surfaceWidth, input.bounds.x, input.bounds.width, scale),
    y: calculateAxisOffset(surfaceHeight, input.bounds.y, input.bounds.height, scale)
  };
}
function calculateAxisOffset(containerSize, boundsStart, boundsSize, scale) {
  const scaledSize = boundsSize * scale;
  const availableSize = Math.max(1, containerSize - INITIAL_FIT_PADDING * 2);
  const visibleStart = scaledSize <= availableSize ? (containerSize - scaledSize) / 2 : INITIAL_FIT_PADDING;
  return visibleStart - boundsStart * scale;
}
function calculateContainedFit(input) {
  const availableWidth = Math.max(1, input.surfaceWidth - INITIAL_FIT_PADDING * 2);
  const availableHeight = Math.max(1, input.surfaceHeight - INITIAL_FIT_PADDING * 2);
  if (!(input.bounds.width > 0) || !(input.bounds.height > 0)) {
    return { scale: 1, x: 0, y: 0 };
  }
  const containScale = Math.min(availableWidth / input.bounds.width, availableHeight / input.bounds.height);
  const scale = clamp$1(containScale, input.minScale, input.maxScale);
  return {
    scale,
    x: calculateAxisOffset(input.surfaceWidth, input.bounds.x, input.bounds.width, scale),
    y: calculateAxisOffset(input.surfaceHeight, input.bounds.y, input.bounds.height, scale)
  };
}
function getDiagramBounds(diagram) {
  const svg = diagram.querySelector("svg");
  const svgRect = svg == null ? void 0 : svg.getBoundingClientRect();
  const viewBox = svg == null ? void 0 : svg.viewBox.baseVal;
  if ((svg == null ? void 0 : svg.dataset.diagramZoomNormalized) === "true" && svgRect && svgRect.width > 0 && svgRect.height > 0) {
    return { x: 0, y: 0, width: svgRect.width, height: svgRect.height };
  }
  const visibleBounds = getVisibleSvgBounds(svg, svgRect, viewBox);
  if (visibleBounds) return visibleBounds;
  if (svgRect && svgRect.width > 0 && svgRect.height > 0) {
    return { x: 0, y: 0, width: svgRect.width, height: svgRect.height };
  }
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height };
  }
  const rect = diagram.getBoundingClientRect();
  return { x: 0, y: 0, width: rect.width, height: rect.height };
}
function getVisibleSvgBounds(svg, svgRect, viewBox) {
  if (!svg || !svgRect || !viewBox || viewBox.width <= 0 || viewBox.height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
    return void 0;
  }
  try {
    const box = svg.getBBox();
    if (!box || box.width <= 0 || box.height <= 0) return void 0;
    const scaleX = svgRect.width / viewBox.width;
    const scaleY = svgRect.height / viewBox.height;
    return {
      x: (box.x - viewBox.x) * scaleX,
      y: (box.y - viewBox.y) * scaleY,
      width: box.width * scaleX,
      height: box.height * scaleY
    };
  } catch {
    return void 0;
  }
}
function createZoomButton(text, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "diagram-zoom-button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.title = label;
  return button;
}
function viewportSurfaceHeightCap() {
  if (typeof window === "undefined" || !window.innerHeight) return MAX_SURFACE_HEIGHT;
  const ceiling = window.innerWidth && window.innerWidth <= 640 ? 320 : MAX_SURFACE_HEIGHT;
  return clamp$1(Math.round(window.innerHeight * 0.72), MIN_SURFACE_HEIGHT, ceiling);
}
function clamp$1(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
var define_FRONTIER_SUPABASE_CONFIG_default$4 = { url: "https://br-ideal-fawn-814db5fc.supabase.aidap-global.cn-beijing.volces.com:443", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjcwMzc5MzA0fQ.qiaVI4H2eZ1-5BywE5ORmEPf8_lmuq7-hW-f1lgqwWc", schema: "public" };
const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const initialized$6 = /* @__PURE__ */ new WeakSet();
const FRONTIER_CHAPTER_ID = "20";
const DEFAULT_DATE_LABEL = "6月16日 · 周二";
const FRONTIER_COLUMNS = [
  "article_id",
  "slug",
  "chapter_id",
  "chapter_slug",
  "title",
  "source",
  "source_url",
  "kind",
  "ecosystem_layer",
  "ecosystem_layer_label",
  "summary",
  "collected_date",
  "collected_at",
  "read_count",
  "sort_order",
  "tags",
  "detail_paragraphs",
  "metadata"
].join(",");
if (typeof window !== "undefined") {
  installFrontierArticleArchives();
}
function installFrontierArticleArchives() {
  scanFrontierArticleArchives();
  const observer = new MutationObserver(() => scanFrontierArticleArchives());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scanFrontierArticleArchives() {
  document.querySelectorAll("[data-frontier-articles]").forEach((root) => {
    if (initialized$6.has(root)) return;
    initialized$6.add(root);
    createArchive(root);
  });
}
function createArchive(root) {
  root.classList.add("frontier-archive-shell");
  root.replaceChildren(statusBlock$1("正在读取前沿文章库..."));
  loadFrontierArticlesFromSupabase().then((articles) => renderArchive(root, articles)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    root.replaceChildren(statusBlock$1(`文章库读取失败：${message}`));
  });
}
async function loadFrontierArticlesFromSupabase() {
  const config = define_FRONTIER_SUPABASE_CONFIG_default$4 ?? null;
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const rows = await fetchAllPostgrestRows({
    config: {
      url: config.url,
      anonKey: config.anonKey,
      schema: config.schema || "public"
    },
    table: "frontier_ecosystem_articles",
    select: FRONTIER_COLUMNS,
    filters: [`chapter_id=eq.${FRONTIER_CHAPTER_ID}`],
    order: ["sort_order.asc"],
    pageSize: 100
  });
  return rows.map(normalizeArticleRow).filter((article) => article.title && article.url);
}
function renderArchive(root, articles) {
  root.replaceChildren();
  if (articles.length === 0) {
    root.append(statusBlock$1("文章库暂无文章。"));
    return;
  }
  let selectedLayer = "all";
  let selectedDate = pickDefaultDate(articles);
  let calendarMonth = yearMonthOf(selectedDate) ?? yearMonthOf(availableDates(articles)[0] ?? null) ?? { year: 2026, month: 6 };
  const filters = document.createElement("nav");
  filters.className = "frontier-layer-tabs";
  filters.setAttribute("aria-label", "前沿文章体系层");
  const filterBoard = document.createElement("section");
  filterBoard.className = "frontier-filter-board";
  filterBoard.setAttribute("aria-label", "文章筛选器");
  const layerFilterGroup = document.createElement("div");
  layerFilterGroup.className = "frontier-filter-group";
  const layerTitle = document.createElement("strong");
  layerTitle.className = "frontier-filter-title";
  layerTitle.textContent = "按体系层筛选";
  const calendar = document.createElement("section");
  calendar.className = "frontier-calendar";
  calendar.setAttribute("aria-label", "按日期筛选前沿文章");
  const timeline = document.createElement("section");
  timeline.className = "frontier-article-timeline";
  timeline.setAttribute("aria-label", "前沿文章列表");
  const overview = document.createElement("header");
  overview.className = "frontier-news-hero";
  overview.setAttribute("aria-label", "前沿文章库概览");
  const titleGroup = document.createElement("div");
  titleGroup.className = "frontier-news-title";
  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Agent Frontier News";
  const title = document.createElement("h2");
  title.textContent = "前沿文章库";
  const description = document.createElement("p");
  description.textContent = "按日期和体系层筛选 agent 前沿资料；每条文章保留摘要、来源、体系层和原文入口。";
  titleGroup.append(eyebrow, title, description);
  const stats = document.createElement("div");
  stats.className = "frontier-news-stats";
  stats.append(
    statItem(String(articles.length), "资料"),
    statItem(String(groupArticlesByDate(articles).length), "日期"),
    statItem(String(new Set(articles.map((article) => article.ecosystemLayer)).size), "体系层")
  );
  overview.append(titleGroup, stats);
  const layout = document.createElement("div");
  layout.className = "frontier-news-layout";
  const listPanel = document.createElement("section");
  listPanel.className = "frontier-news-list-panel";
  listPanel.setAttribute("aria-label", "文章列表");
  function layerScopedArticles(layer = selectedLayer) {
    if (layer === "all") return articles;
    return articles.filter((article) => article.ecosystemLayer === layer);
  }
  function visibleArticles() {
    return filterByDate(layerScopedArticles(), selectedDate);
  }
  function layerCount(layer) {
    return filterByDate(layerScopedArticles(layer), selectedDate).length;
  }
  function selectedDateLabel() {
    if (selectedDate === null) return "全部日期";
    const hit = articles.find((article) => article.collectedDate.slice(0, 10) === selectedDate);
    return (hit == null ? void 0 : hit.displayDateLabel) ?? formatChineseDateLabel(selectedDate);
  }
  function dateCount(date) {
    return layerScopedArticles().filter((article) => article.collectedDate.slice(0, 10) === date).length;
  }
  function alignDateToLayer() {
    if (selectedDate === null) return;
    const dates = availableDates(layerScopedArticles());
    if (dates.includes(selectedDate)) return;
    selectedDate = dates[0] ?? null;
    const nextMonth = yearMonthOf(selectedDate);
    if (nextMonth) calendarMonth = nextMonth;
  }
  function renderAll() {
    renderFilters();
    renderCalendar();
    renderTimeline();
  }
  function renderFilters() {
    filters.replaceChildren();
    const filterEntries = [
      { id: "all", label: "全部体系" },
      ...FRONTIER_ECOSYSTEM_LAYERS.map((layer) => ({ id: layer.id, label: layer.label }))
    ];
    for (const filter of filterEntries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "frontier-layer-tab";
      if (filter.id === selectedLayer) button.dataset.active = "true";
      button.textContent = `${filter.label} ${layerCount(filter.id)}`;
      button.addEventListener("click", () => {
        selectedLayer = filter.id;
        alignDateToLayer();
        renderAll();
      });
      filters.append(button);
    }
  }
  function renderCalendar() {
    calendar.replaceChildren();
    const contentDates = new Set(availableDates(layerScopedArticles()));
    const head = document.createElement("div");
    head.className = "frontier-cal-head";
    const title2 = document.createElement("strong");
    title2.className = "frontier-cal-title";
    title2.textContent = "按日期筛选文章";
    const nav = document.createElement("div");
    nav.className = "frontier-cal-nav";
    const prev = calNavButton("‹", "上个月", () => {
      calendarMonth = shiftMonth(calendarMonth.year, calendarMonth.month, -1);
      renderCalendar();
    });
    const label = document.createElement("span");
    label.className = "frontier-cal-label";
    label.textContent = `${calendarMonth.year}年 ${calendarMonth.month}月`;
    const next = calNavButton("›", "下个月", () => {
      calendarMonth = shiftMonth(calendarMonth.year, calendarMonth.month, 1);
      renderCalendar();
    });
    nav.append(prev, label, next);
    head.append(title2, nav);
    const current = document.createElement("p");
    current.className = "frontier-cal-current";
    current.textContent = `${selectedDateLabel()} · ${visibleArticles().length} 篇`;
    const weekdays = document.createElement("div");
    weekdays.className = "frontier-cal-weekdays";
    for (const weekday of WEEKDAY_LABELS) {
      const span = document.createElement("span");
      span.textContent = weekday;
      weekdays.append(span);
    }
    const grid = document.createElement("div");
    grid.className = "frontier-cal-grid";
    for (const week of buildCalendarMonth(calendarMonth.year, calendarMonth.month, contentDates)) {
      for (const cell of week) {
        const button = document.createElement("button");
        const count = dateCount(cell.date);
        button.type = "button";
        button.className = "frontier-cal-cell";
        button.textContent = String(cell.day);
        if (!cell.inMonth) button.dataset.outside = "true";
        if (cell.hasContent) {
          button.dataset.hasContent = "true";
          button.title = `${cell.date} · ${count} 篇`;
          button.setAttribute("aria-label", `查看 ${cell.date} 的 ${count} 篇文章`);
        } else {
          button.disabled = true;
        }
        if (cell.date === selectedDate) button.dataset.active = "true";
        if (cell.hasContent) {
          button.addEventListener("click", () => {
            selectedDate = cell.date;
            const nextMonth = yearMonthOf(cell.date);
            if (nextMonth) calendarMonth = nextMonth;
            renderAll();
          });
        }
        grid.append(button);
      }
    }
    const all = document.createElement("button");
    all.type = "button";
    all.className = "frontier-cal-all";
    all.textContent = `全部日期 (${layerScopedArticles().length})`;
    if (selectedDate === null) all.dataset.active = "true";
    all.addEventListener("click", () => {
      selectedDate = null;
      renderAll();
    });
    calendar.append(head, current, weekdays, grid, all);
  }
  function renderTimeline() {
    timeline.replaceChildren();
    const visible = visibleArticles();
    if (visible.length === 0) {
      const empty = document.createElement("p");
      empty.className = "frontier-timeline-empty";
      empty.textContent = "该筛选条件下暂无文章。";
      timeline.append(empty);
      return;
    }
    let rank = 1;
    for (const group of groupArticlesByDate(visible)) {
      const section = document.createElement("section");
      section.className = "frontier-date-section";
      const dateHeader = document.createElement("div");
      dateHeader.className = "frontier-timeline-date";
      const triangle = document.createElement("span");
      triangle.setAttribute("aria-hidden", "true");
      const dateText = document.createElement("strong");
      dateText.textContent = group.label;
      const count = document.createElement("em");
      count.textContent = `${group.articles.length} 篇`;
      dateHeader.append(triangle, dateText, count);
      const list = document.createElement("div");
      list.className = "frontier-timeline-list";
      for (const article of group.articles) {
        list.append(articleCard(article, rank));
        rank += 1;
      }
      section.append(dateHeader, list);
      timeline.append(section);
    }
  }
  renderAll();
  layerFilterGroup.append(layerTitle, filters);
  filterBoard.append(layerFilterGroup, calendar);
  listPanel.append(filterBoard, timeline);
  layout.append(listPanel);
  root.append(overview, layout);
}
function calNavButton(symbol, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "frontier-cal-navbtn";
  button.textContent = symbol;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}
function articleCard(article, rankNumber) {
  const card2 = document.createElement("article");
  card2.className = "frontier-timeline-item";
  card2.tabIndex = 0;
  card2.setAttribute("role", "link");
  card2.setAttribute("aria-label", `打开原文：${article.title}`);
  const marker = document.createElement("span");
  marker.className = "frontier-timeline-marker";
  marker.setAttribute("aria-hidden", "true");
  const content = document.createElement("div");
  content.className = "frontier-timeline-card";
  const cardHead = document.createElement("div");
  cardHead.className = "frontier-timeline-head";
  const rank = document.createElement("span");
  rank.className = "frontier-timeline-rank";
  rank.textContent = String(rankNumber).padStart(2, "0");
  const kind = document.createElement("span");
  kind.className = "frontier-timeline-kind";
  kind.textContent = article.kind;
  cardHead.append(rank, kind);
  const title = document.createElement("h3");
  title.className = "frontier-timeline-title";
  title.textContent = article.title;
  const excerpt = document.createElement("p");
  excerpt.className = "frontier-timeline-excerpt";
  excerpt.textContent = article.summary;
  const meta = document.createElement("div");
  meta.className = "frontier-timeline-meta";
  const source = document.createElement("span");
  source.className = "frontier-timeline-source";
  source.textContent = article.source;
  const layer = document.createElement("span");
  layer.className = "frontier-timeline-layer";
  layer.textContent = article.ecosystemLayerLabel;
  const readCount = document.createElement("span");
  readCount.className = "frontier-timeline-count";
  readCount.textContent = `阅读 ${article.readCount}`;
  const read = document.createElement("a");
  read.className = "frontier-timeline-read";
  read.href = article.url;
  read.target = "_blank";
  read.rel = "noreferrer";
  read.textContent = "原文";
  meta.append(source, layer, readCount, read);
  content.append(cardHead, title, excerpt, meta);
  card2.append(marker, content);
  card2.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) return;
    window.open(article.url, "_blank", "noopener,noreferrer");
  });
  card2.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    window.open(article.url, "_blank", "noopener,noreferrer");
  });
  return card2;
}
function groupArticlesByDate(articles) {
  const groups = /* @__PURE__ */ new Map();
  for (const article of articles) {
    const date = article.collectedDate.slice(0, 10);
    const key2 = date || "unknown";
    const existing = groups.get(key2);
    if (existing) {
      existing.articles.push(article);
      continue;
    }
    groups.set(key2, {
      date: key2,
      label: article.displayDateLabel || formatChineseDateLabel(key2),
      articles: [article]
    });
  }
  return [...groups.values()].sort((left, right) => right.date.localeCompare(left.date));
}
function normalizeArticleRow(row) {
  const collectedDate = stringValue$1(row.collected_date, "2026-06-17");
  const collectedAt = stringValue$1(row.collected_at, `${collectedDate}T09:00:00+08:00`);
  const layer = layerValue(row.ecosystem_layer);
  const source = stringValue$1(row.source, "未知来源");
  const summary = stringValue$1(row.summary, "");
  const detailParagraphs = stringArrayValue$1(row.detail_paragraphs);
  return {
    id: stringValue$1(row.article_id, ""),
    slug: stringValue$1(row.slug, ""),
    chapterId: stringValue$1(row.chapter_id, FRONTIER_CHAPTER_ID),
    chapterSlug: stringValue$1(row.chapter_slug, "20-agent-frontier-news"),
    title: stringValue$1(row.title, ""),
    source,
    url: stringValue$1(row.source_url, ""),
    kind: kindValue(row.kind),
    ecosystemLayer: layer,
    ecosystemLayerLabel: stringValue$1(row.ecosystem_layer_label, layerLabel(layer)),
    summary,
    collectedDate,
    collectedAt,
    displayDateLabel: displayDateLabel(row.metadata, collectedDate),
    readCount: numberValue$1(row.read_count, 0),
    sortOrder: numberValue$1(row.sort_order, 0),
    tags: stringArrayValue$1(row.tags),
    detailParagraphs: detailParagraphs.length > 0 ? detailParagraphs : [
      summary || "本条资料用于补充第 20 章 Agent 前沿文章库的选型与趋势判断。",
      `体系层：${layerLabel(layer)}。来源：${source}。`,
      "查看原文可以进一步核对发布日期、API 细节、协议术语与实现边界。"
    ]
  };
}
function statItem(value, label) {
  const item = document.createElement("div");
  item.className = "frontier-news-stat";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  return item;
}
function stringValue$1(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
function numberValue$1(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function stringArrayValue$1(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}
function kindValue(value) {
  if (value === "paper" || value === "doc" || value === "blog" || value === "video" || value === "internal") {
    return value;
  }
  return "doc";
}
function layerValue(value) {
  if (typeof value === "string" && FRONTIER_ECOSYSTEM_LAYERS.some((layer) => layer.id === value)) {
    return value;
  }
  return "foundation";
}
function layerLabel(layer) {
  var _a;
  return ((_a = FRONTIER_ECOSYSTEM_LAYERS.find((item) => item.id === layer)) == null ? void 0 : _a.label) ?? layer;
}
function displayDateLabel(metadata, collectedDate) {
  if (metadata && typeof metadata === "object" && "displayDateLabel" in metadata) {
    const label = metadata.displayDateLabel;
    if (typeof label === "string" && label.trim()) return label;
  }
  return formatChineseDateLabel(collectedDate);
}
function formatChineseDateLabel(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return DEFAULT_DATE_LABEL;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return DEFAULT_DATE_LABEL;
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${month}月${day}日 · ${weekday}`;
}
function statusBlock$1(message) {
  const status2 = document.createElement("div");
  status2.className = "frontier-archive-status";
  status2.textContent = message;
  return status2;
}
const TOPIC_LABELS$1 = {
  "llm-basics": "大语言模型基础",
  "prompt-engineering": "提示工程",
  "agents-reasoning": "Agent 与推理模式",
  "tool-use": "工具调用",
  "embeddings-rag": "检索增强与向量",
  "multi-agent": "多智能体协作",
  "output-eval-observability": "输出、评估与可观测",
  "safety-guardrails": "安全与护栏"
};
const GLOSSARY_TOPIC_ORDER = [
  "llm-basics",
  "prompt-engineering",
  "agents-reasoning",
  "tool-use",
  "embeddings-rag",
  "multi-agent",
  "output-eval-observability",
  "safety-guardrails"
];
function glossaryTopicLabel(topic) {
  return TOPIC_LABELS$1[topic];
}
const RAW_TERMS = [
  // 一、大语言模型基础
  {
    slug: "llm",
    term: "LLM（大语言模型，Large Language Model）",
    topic: "llm-basics",
    definition: "在海量文本上训练、通过“预测下一个 token”来生成文字的神经网络模型。它是整个 Agent 的“大脑”，负责理解输入并产出回答。例如 GPT、Claude 都是 LLM。",
    relatedChapters: ["02"],
    aliases: ["LLM", "大语言模型", "Large Language Model"]
  },
  {
    slug: "token",
    term: "Token",
    topic: "llm-basics",
    definition: "模型处理文本的最小单位，介于“字”和“词”之间，一个 token 大约对应英文 4 个字符或中文 1–2 个汉字。计费、长度限制、速度都以 token 计量，而不是字数。",
    relatedChapters: ["02"],
    aliases: ["Token", "令牌"]
  },
  {
    slug: "context-window",
    term: "上下文窗口（Context Window）",
    topic: "llm-basics",
    definition: "模型单次调用能“看到”的 token 总量上限，包含你发的提示和它生成的回答。超出窗口的内容会被截断或必须靠记忆/检索补回——这正是后面短期记忆和 RAG 要解决的核心约束。",
    relatedChapters: ["02", "07"],
    aliases: ["Context Window", "上下文窗口", "上下文"]
  },
  {
    slug: "temperature",
    term: "Temperature（温度）",
    topic: "llm-basics",
    definition: "控制生成随机性的参数，通常 0–2。值越低输出越确定、越保守（适合代码、结构化数据）；值越高越发散、越有创意（适合头脑风暴）。需要可复现结果时设为 0。",
    relatedChapters: ["02"],
    aliases: ["Temperature", "温度"]
  },
  {
    slug: "top-p",
    term: "Top-p（核采样，Nucleus Sampling）",
    topic: "llm-basics",
    definition: "另一种控制随机性的参数：只在累积概率达到 p 的最可能候选 token 中采样。常与 temperature 二选一调节，一般保持默认即可。",
    relatedChapters: ["02"],
    aliases: ["Top-p", "核采样", "Nucleus Sampling"]
  },
  {
    slug: "reasoning-model",
    term: "推理模型（Reasoning Model）",
    topic: "llm-basics",
    definition: "在回答前会先生成一段内部“思考过程”再给结论的一类模型，更擅长多步推理和复杂任务，代价是更慢、更贵。使用时往往不需要自己再写思维链提示。",
    relatedChapters: ["02", "10"],
    aliases: ["Reasoning Model", "推理模型"]
  },
  {
    slug: "latency-throughput",
    term: "Latency / Throughput（延迟 / 吞吐）",
    topic: "llm-basics",
    definition: "延迟指从发请求到拿到结果的耗时（首个 token 的延迟尤其影响体验）；吞吐指单位时间能处理的 token 量。流式输出主要优化的是“感知延迟”。",
    relatedChapters: ["02", "14"],
    aliases: ["Latency", "Throughput", "延迟", "吞吐"]
  },
  // 二、提示工程
  {
    slug: "prompt-engineering",
    term: "提示工程（Prompt Engineering）",
    topic: "prompt-engineering",
    definition: "通过精心设计输入文本来引导 LLM 产出期望结果的实践，包括给角色、给示例、给约束、给输出格式。它是用好模型成本最低、收益最高的手段。",
    relatedChapters: ["03"],
    aliases: ["Prompt Engineering", "提示工程"]
  },
  {
    slug: "system-user-prompt",
    term: "System 提示 / User 提示（System / User Prompt）",
    topic: "prompt-engineering",
    definition: "System 提示设定模型的角色、规则和全局约束（如“你是严谨的代码审查员，只输出 JSON”），User 提示是具体的用户问题或指令。System 优先级更高、更稳定，适合放不变的规则。",
    relatedChapters: ["03"],
    aliases: ["System Prompt", "User Prompt", "系统提示", "用户提示"]
  },
  {
    slug: "few-shot",
    term: "Few-shot（少样本提示）",
    topic: "prompt-engineering",
    definition: "在提示里塞进几个“输入→输出”的示范例子，让模型照葫芦画瓢，无需训练就能学会格式或风格。对应地，不给例子直接提问叫 zero-shot（零样本）。",
    relatedChapters: ["03"],
    aliases: ["Few-shot", "少样本", "zero-shot", "零样本"]
  },
  {
    slug: "chain-of-thought",
    term: "思维链（CoT，Chain-of-Thought）",
    topic: "prompt-engineering",
    definition: "引导模型“一步一步思考”再给答案的提示技巧（如加一句“让我们逐步推理”），能显著提升数学、逻辑类任务的正确率。代价是输出更长、更慢。",
    relatedChapters: ["03"],
    aliases: ["CoT", "Chain-of-Thought", "思维链"]
  },
  {
    slug: "hallucination",
    term: "幻觉（Hallucination）",
    topic: "prompt-engineering",
    definition: "模型一本正经地编造出看似合理、实则错误或不存在的内容（假引用、假 API、假数据）。这是 LLM 的固有风险，需要靠 RAG（提供真实依据）、结构化校验和评估来抑制。",
    relatedChapters: ["03", "09"],
    aliases: ["Hallucination", "幻觉"]
  },
  {
    slug: "prompt-template",
    term: "提示模板（Prompt Template）",
    topic: "prompt-engineering",
    definition: "把提示中固定的骨架和可变的占位符分开，用变量动态填充（如 `回答关于 {topic} 的问题`）。便于复用、版本管理和 A/B 测试。",
    relatedChapters: ["03"],
    aliases: ["Prompt Template", "提示模板"]
  },
  // 三、Agent 与推理模式
  {
    slug: "agent",
    term: "Agent（智能体）",
    topic: "agents-reasoning",
    definition: "能自主感知环境、做决策、调用工具并采取行动以完成目标的程序，核心是“LLM + 工具 + 循环”。和单次问答不同，Agent 会多步骤地朝目标推进，例如自动查资料、调接口、再总结。",
    relatedChapters: ["01"],
    aliases: ["Agent", "智能体"]
  },
  {
    slug: "agent-loop",
    term: "Agent 循环（Agent Loop）",
    topic: "agents-reasoning",
    definition: "Agent 的核心运行机制：观察当前状态 → 让 LLM 思考下一步 → 执行动作（调工具）→ 把结果喂回 → 再思考，如此循环直到任务完成或达到停止条件。是第 4 章的主线。",
    relatedChapters: ["04"],
    aliases: ["Agent Loop", "Agent 循环"]
  },
  {
    slug: "react",
    term: "ReAct（Reasoning + Acting）",
    topic: "agents-reasoning",
    definition: "一种把“推理”和“行动”交织的 Agent 模式：模型轮流输出 Thought（想）、Action（做）、Observation（看结果），边想边做边修正。是最经典、最易上手的 Agent 范式。",
    relatedChapters: ["04", "10"],
    aliases: ["ReAct", "Reasoning + Acting"]
  },
  {
    slug: "plan-and-execute",
    term: "Plan-and-Execute（先规划后执行）",
    topic: "agents-reasoning",
    definition: "Agent 先一次性制定完整的多步计划，再逐步执行各子任务。相比 ReAct 每步都重新思考，它步骤更可控、更省调用，适合流程清晰的复杂任务。",
    relatedChapters: ["10"],
    aliases: ["Plan-and-Execute", "先规划后执行"]
  },
  {
    slug: "reflection",
    term: "Reflection（反思 / 自我修正）",
    topic: "agents-reasoning",
    definition: "让 Agent 对自己的输出进行批判和复查，发现问题后再修订的模式（生成→自评→改进）。能提升质量，常用于代码生成、写作等需要打磨的场景。",
    relatedChapters: ["10"],
    aliases: ["Reflection", "反思", "自我修正"]
  },
  {
    slug: "stopping-condition",
    term: "停止条件（Stopping Condition / Termination）",
    topic: "agents-reasoning",
    definition: "决定 Agent 循环何时结束的规则，如任务标记完成、达到最大步数/最大 token、或连续无进展。没有它，Agent 可能陷入死循环或无限烧钱。",
    relatedChapters: ["04"],
    aliases: ["Stopping Condition", "Termination", "停止条件"]
  },
  {
    slug: "scratchpad",
    term: "Scratchpad（草稿区 / 中间状态）",
    topic: "agents-reasoning",
    definition: "Agent 在循环中累积的思考、动作和观察记录，作为下一步决策的上下文。它本质上是 Agent 的“工作记忆”，与短期记忆紧密相关。",
    relatedChapters: ["04", "07"],
    aliases: ["Scratchpad", "草稿区", "工作记忆"]
  },
  // 四、工具调用
  {
    slug: "function-calling",
    term: "工具调用 / Function Calling（函数调用）",
    topic: "tool-use",
    definition: "让 LLM 不直接回答，而是输出“要调用哪个函数、传什么参数”的结构化请求，由程序真正执行后把结果返回模型。这是 Agent 能查天气、读文件、调 API 的根本机制。",
    relatedChapters: ["05"],
    aliases: ["Function Calling", "工具调用", "函数调用"]
  },
  {
    slug: "tool",
    term: "Tool（工具）",
    topic: "tool-use",
    definition: "Agent 可以调用的一个能力单元，本质是一个带名称、描述、参数和实现逻辑的函数（如“搜索网页”“读取数据库”）。工具的描述写得好不好，直接决定模型用得对不对。",
    relatedChapters: ["05", "06"],
    aliases: ["Tool", "工具"]
  },
  {
    slug: "toolspec",
    term: "ToolSpec（工具规格 / 工具 Schema）",
    topic: "tool-use",
    definition: "用结构化格式（通常是 JSON Schema）声明一个工具的名称、用途说明和参数类型，模型据此判断何时调用、如何填参。它是模型与代码之间的“接口契约”。",
    relatedChapters: ["06"],
    aliases: ["ToolSpec", "工具规格", "工具 Schema", "JSON Schema"]
  },
  {
    slug: "tool-routing",
    term: "工具路由（Tool Routing / Dispatch）",
    topic: "tool-use",
    definition: "根据模型选择的工具名，把调用分发到对应实现函数并执行的逻辑。第 6 章构建工具系统时，注册表 + 路由是核心骨架。",
    relatedChapters: ["06"],
    aliases: ["Tool Routing", "Dispatch", "工具路由"]
  },
  {
    slug: "argument-validation",
    term: "参数校验（Argument Validation）",
    topic: "tool-use",
    definition: "执行工具前，对模型生成的参数做类型和取值检查，防止非法或恶意输入导致崩溃。属于系统边界处的必备防御，模型给的参数永远不能无条件信任。",
    relatedChapters: ["06"],
    aliases: ["Argument Validation", "参数校验"]
  },
  {
    slug: "parallel-tool-calls",
    term: "并行工具调用（Parallel Tool Calls）",
    topic: "tool-use",
    definition: "模型在一轮里同时请求调用多个互不依赖的工具，程序并发执行以缩短整体耗时。适合“同时查三个数据源”这类场景。",
    relatedChapters: ["05"],
    aliases: ["Parallel Tool Calls", "并行工具调用"]
  },
  // 五、检索增强与向量
  {
    slug: "embedding",
    term: "Embedding（嵌入 / 向量化）",
    topic: "embeddings-rag",
    definition: "把文本（或图片等）转换成一串固定长度的浮点数向量，使语义相近的内容在向量空间中距离也相近。它是语义检索、RAG、聚类的基础表示。",
    relatedChapters: ["08"],
    aliases: ["Embedding", "嵌入", "向量化"]
  },
  {
    slug: "vector-database",
    term: "向量 / 向量数据库（Vector / Vector Database）",
    topic: "embeddings-rag",
    definition: "向量是 embedding 产出的数字数组；向量数据库是专门存储这些向量并支持“按相似度快速查找”的数据库（如 FAISS、Chroma、pgvector）。是 RAG 的检索后端。",
    relatedChapters: ["08"],
    aliases: ["Vector Database", "向量数据库", "pgvector", "FAISS", "Chroma"]
  },
  {
    slug: "cosine-similarity",
    term: "余弦相似度（Cosine Similarity）",
    topic: "embeddings-rag",
    definition: "通过计算两个向量夹角的余弦值（-1 到 1）来衡量语义相近程度，值越接近 1 越相似。是向量检索中最常用的相似度度量，只看方向不看长度。",
    relatedChapters: ["08"],
    aliases: ["Cosine Similarity", "余弦相似度"]
  },
  {
    slug: "semantic-search",
    term: "语义检索（Semantic Search）",
    topic: "embeddings-rag",
    definition: "基于含义而非字面关键词匹配来查找内容：把查询和文档都转成向量，再找最相似的几条。即使用词不同但意思相近也能命中，弥补了传统关键词搜索的不足。",
    relatedChapters: ["08"],
    aliases: ["Semantic Search", "语义检索"]
  },
  {
    slug: "rag",
    term: "RAG（检索增强生成，Retrieval-Augmented Generation）",
    topic: "embeddings-rag",
    definition: "先从知识库检索相关资料，再把资料连同问题一起喂给 LLM 生成答案的架构。让模型基于真实、可更新的外部知识作答，是抑制幻觉、引入私有数据的主流方案。第 9 章带你从零实现。",
    relatedChapters: ["09"],
    aliases: ["RAG", "Retrieval-Augmented Generation", "检索增强生成"]
  },
  {
    slug: "chunking",
    term: "分块（Chunking）",
    topic: "embeddings-rag",
    definition: "把长文档切成若干较小片段后再做 embedding 和检索的过程。块太大会稀释语义、超出上下文，太小会丢失上下文，因此块大小和重叠（overlap）是 RAG 的关键调参点。",
    relatedChapters: ["09"],
    aliases: ["Chunking", "分块", "overlap", "重叠"]
  },
  {
    slug: "top-k-retrieval",
    term: "Top-k 检索（Top-k Retrieval）",
    topic: "embeddings-rag",
    definition: "从向量库中取出与查询最相似的前 k 条结果作为上下文。k 的取值要在“信息够用”和“上下文不超限/不引入噪声”之间权衡。",
    relatedChapters: ["09"],
    aliases: ["Top-k", "Top-k Retrieval", "Top-k 检索"]
  },
  {
    slug: "re-ranking",
    term: "重排序（Re-ranking）",
    topic: "embeddings-rag",
    definition: "在初步向量检索拿到候选后，用更精细的模型对结果重新打分排序，提升真正相关内容排在前面的概率。是进阶 RAG 提升质量的常见一步。",
    relatedChapters: ["09"],
    aliases: ["Re-ranking", "重排序", "rerank"]
  },
  {
    slug: "short-term-memory",
    term: "短期记忆（Short-term Memory）",
    topic: "embeddings-rag",
    definition: "Agent 在单次会话内保留对话历史和中间状态的机制，让它“记得”前几轮说了什么。受上下文窗口限制，常用截断、摘要等策略压缩。第 7 章主题。",
    relatedChapters: ["07"],
    aliases: ["Short-term Memory", "短期记忆"]
  },
  // 六、多智能体协作
  {
    slug: "multi-agent",
    term: "多智能体（Multi-Agent）",
    topic: "multi-agent",
    definition: "由多个各有分工的 Agent 协同完成复杂任务的系统，比如一个负责检索、一个负责写作、一个负责审查。通过分工把大问题拆小，各自专注、互相校验。",
    relatedChapters: ["11"],
    aliases: ["Multi-Agent", "多智能体"]
  },
  {
    slug: "supervisor-worker",
    term: "Supervisor / Worker（主管 / 工人模式）",
    topic: "multi-agent",
    definition: "一种常见的多智能体编排结构：Supervisor 负责拆解任务、分派给各 Worker、汇总结果；Worker 各自专注执行一类子任务。本仓库的毕业项目 deep-research-agent 即采用此模式。",
    relatedChapters: ["11", "capstone"],
    aliases: ["Supervisor", "Worker", "主管", "工人"]
  },
  {
    slug: "orchestration",
    term: "编排（Orchestration）",
    topic: "multi-agent",
    definition: "协调多个 Agent 之间任务流转、消息传递和结果聚合的控制逻辑，决定“谁先做、谁后做、怎么合并”。它是多智能体系统从能跑到好用的关键。",
    relatedChapters: ["11"],
    aliases: ["Orchestration", "编排"]
  },
  {
    slug: "handoff",
    term: "Handoff（任务移交）",
    topic: "multi-agent",
    definition: "一个 Agent 把控制权或子任务连同必要上下文交给另一个 Agent 继续处理的动作。移交时要传清楚状态，避免下游 Agent 丢失上下文。",
    relatedChapters: ["11"],
    aliases: ["Handoff", "任务移交"]
  },
  // 七、输出、评估与可观测
  {
    slug: "structured-output",
    term: "结构化输出（Structured Output）",
    topic: "output-eval-observability",
    definition: "约束 LLM 按预定格式（通常是符合某个 Schema 的 JSON）返回结果，便于程序直接解析使用，而非自由文本。是把模型接入工程系统的关键，第 13 章主题。",
    relatedChapters: ["13"],
    aliases: ["Structured Output", "结构化输出"]
  },
  {
    slug: "sse-streaming",
    term: "SSE / 流式（Server-Sent Events / Streaming）",
    topic: "output-eval-observability",
    definition: "让模型生成的内容像打字机一样逐 token 实时推送给前端，而不是等全部生成完才一次返回。SSE 是实现这种单向流式推送的常用 Web 协议，能大幅改善等待体验。第 14 章主题。",
    relatedChapters: ["14"],
    aliases: ["SSE", "Streaming", "流式", "Server-Sent Events"]
  },
  {
    slug: "evaluation",
    term: "评估（Eval / Evaluation）",
    topic: "output-eval-observability",
    definition: "用一组测试样例系统化衡量 Agent 或提示效果好坏的过程，输出可量化的指标（准确率、通过率等）。它把“感觉还行”变成“有数据支撑”，是迭代优化的前提。第 15 章主题。",
    relatedChapters: ["15"],
    aliases: ["Eval", "Evaluation", "评估"]
  },
  {
    slug: "llm-as-judge",
    term: "LLM-as-judge（用大模型当裁判）",
    topic: "output-eval-observability",
    definition: "让另一个 LLM 按给定标准对模型输出的质量打分或判定对错的评估方法。适合评判摘要、对话等没有唯一标准答案、难以用规则自动判分的任务。",
    relatedChapters: ["15"],
    aliases: ["LLM-as-judge", "用大模型当裁判"]
  },
  {
    slug: "golden-dataset",
    term: "黄金数据集（Golden Dataset / Test Set）",
    topic: "output-eval-observability",
    definition: "一组人工确认了正确答案的“输入→期望输出”样例，作为评估的基准。任何提示或模型改动都用它回归测试，确保没有把原来对的改坏。",
    relatedChapters: ["15"],
    aliases: ["Golden Dataset", "Test Set", "黄金数据集"]
  },
  {
    slug: "observability",
    term: "可观测性（Observability）",
    topic: "output-eval-observability",
    definition: "通过日志、指标、追踪等手段让系统内部运行状态变得可见、可诊断的能力。对 Agent 尤其重要——多步、非确定性的执行过程不可观测就几乎无法调试。第 16 章主题。",
    relatedChapters: ["16"],
    aliases: ["Observability", "可观测性"]
  },
  {
    slug: "trace",
    term: "Trace（追踪 / 调用链）",
    topic: "output-eval-observability",
    definition: "一次完整请求中各步骤（每次 LLM 调用、每次工具调用、每段耗时和 token 消耗）的有序记录。看 trace 是排查“Agent 为什么这么做”“钱花在哪一步”的主要手段。",
    relatedChapters: ["16"],
    aliases: ["Trace", "追踪", "调用链"]
  },
  {
    slug: "token-cost",
    term: "Token 成本 / 成本控制（Cost / Token Accounting）",
    topic: "output-eval-observability",
    definition: "按输入/输出 token 计量的 API 费用，以及通过缓存、压缩上下文、选小模型等手段控制开销的实践。Agent 多步循环会放大成本，必须在可观测的基础上持续优化。",
    relatedChapters: ["16"],
    aliases: ["Cost", "Token Accounting", "Token 成本", "成本控制"]
  },
  // 八、安全与护栏
  {
    slug: "prompt-injection",
    term: "提示注入（Prompt Injection）",
    topic: "safety-guardrails",
    definition: "攻击者把恶意指令藏在用户输入或被检索的外部内容里，诱导 Agent 偏离原任务（如泄露密钥、执行危险操作）。是 Agent 特有且高危的安全风险，凡是引入外部数据就要警惕。",
    relatedChapters: ["06", "15"],
    aliases: ["Prompt Injection", "提示注入"]
  },
  {
    slug: "guardrails",
    term: "护栏（Guardrails）",
    topic: "safety-guardrails",
    definition: "在模型输入/输出两侧加的一层安全与合规校验，过滤危险指令、敏感信息和不合规输出，约束 Agent 行为在安全边界内。包括输入清洗、输出审查、工具权限限制等。",
    relatedChapters: ["06"],
    aliases: ["Guardrails", "护栏"]
  },
  {
    slug: "jailbreak",
    term: "越狱（Jailbreak）",
    topic: "safety-guardrails",
    definition: "通过特制提示绕过模型的安全限制、诱导其产出本应拒绝内容的行为。属于提示注入的一类，护栏设计需专门防范。",
    relatedChapters: ["06"],
    aliases: ["Jailbreak", "越狱"]
  },
  {
    slug: "least-privilege",
    term: "最小权限（Least Privilege）",
    topic: "safety-guardrails",
    definition: "只给 Agent 和它的工具完成任务所必需的最小权限（如只读、限定目录、限定 API 范围）。一旦被注入或出错，能把破坏面控制到最小。安全设计的基本原则。",
    relatedChapters: ["06"],
    aliases: ["Least Privilege", "最小权限"]
  }
];
const GLOSSARY_TERMS = RAW_TERMS.map((raw, index) => ({
  id: `gl-${String(index + 1).padStart(2, "0")}`,
  slug: raw.slug,
  term: raw.term,
  topic: raw.topic,
  topicLabel: TOPIC_LABELS$1[raw.topic],
  definition: raw.definition,
  relatedChapters: raw.relatedChapters,
  aliases: raw.aliases,
  sortOrder: index + 1,
  tags: [raw.topic]
}));
const slugs$1 = new Set(GLOSSARY_TERMS.map((term) => term.slug));
if (slugs$1.size !== GLOSSARY_TERMS.length) {
  throw new Error("Duplicate glossary term slug detected in glossary.ts");
}
const TOPIC_OPTIONS = [
  { id: "all", label: "全部" },
  ...GLOSSARY_TOPIC_ORDER.map((topic) => ({
    id: topic,
    label: glossaryTopicLabel(topic)
  }))
];
function normalizeQuery(query) {
  return query.trim().toLowerCase();
}
function matchesQuery$1(term, normalizedQuery) {
  if (!normalizedQuery) return true;
  if (term.term.toLowerCase().includes(normalizedQuery)) return true;
  if (term.definition.toLowerCase().includes(normalizedQuery)) return true;
  return term.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery));
}
function filterTerms(terms, topic, query) {
  const normalizedQuery = normalizeQuery(query);
  return terms.filter((term) => {
    const byTopic = topic === "all" || term.topic === topic;
    return byTopic && matchesQuery$1(term, normalizedQuery);
  });
}
function topicCounts(terms) {
  const counts = { all: terms.length };
  for (const topic of GLOSSARY_TOPIC_ORDER) counts[topic] = 0;
  for (const term of terms) counts[term.topic] += 1;
  return counts;
}
const initialized$5 = /* @__PURE__ */ new WeakSet();
if (typeof window !== "undefined") {
  installGlossaryExplorers();
}
function installGlossaryExplorers() {
  scanGlossaryExplorers();
  const observer = new MutationObserver(() => scanGlossaryExplorers());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scanGlossaryExplorers() {
  document.querySelectorAll("[data-glossary]").forEach((root) => {
    if (initialized$5.has(root)) return;
    initialized$5.add(root);
    renderExplorer$1(root, GLOSSARY_TERMS);
  });
}
function renderExplorer$1(root, terms) {
  root.classList.add("glossary-explorer");
  root.replaceChildren();
  let selectedTopic = "all";
  let query = "";
  const counts = topicCounts(terms);
  const searchWrap = document.createElement("div");
  searchWrap.className = "glossary-search";
  const search = document.createElement("input");
  search.type = "search";
  search.className = "glossary-search-input";
  search.placeholder = "搜索术语（中文 / 英文，如 RAG、幻觉、向量数据库）";
  search.setAttribute("aria-label", "搜索术语");
  search.addEventListener("input", () => {
    query = search.value;
    renderList2();
  });
  searchWrap.append(search);
  const tabs = document.createElement("nav");
  tabs.className = "glossary-tabs";
  tabs.setAttribute("aria-label", "术语主题");
  const summary = document.createElement("p");
  summary.className = "glossary-summary";
  const list = document.createElement("dl");
  list.className = "glossary-list";
  function renderTabs() {
    tabs.replaceChildren();
    for (const option of TOPIC_OPTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "glossary-tab";
      if (option.id === selectedTopic) button.dataset.active = "true";
      button.textContent = `${option.label} ${counts[option.id]}`;
      button.addEventListener("click", () => {
        selectedTopic = option.id;
        renderTabs();
        renderList2();
      });
      tabs.append(button);
    }
  }
  function renderList2() {
    const filtered = filterTerms(terms, selectedTopic, query);
    const trimmed = query.trim();
    summary.textContent = trimmed ? `匹配 ${filtered.length} 条 · 关键词「${trimmed}」` : `共 ${filtered.length} 条术语`;
    list.replaceChildren();
    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "glossary-empty";
      empty.textContent = "没找到匹配的术语，换个关键词或主题试试。";
      list.append(empty);
      return;
    }
    for (const term of filtered) {
      const dt = document.createElement("dt");
      dt.className = "glossary-term";
      const name = document.createElement("span");
      name.className = "glossary-term-name";
      name.textContent = term.term;
      const topicBadge = document.createElement("span");
      topicBadge.className = "glossary-topic-badge";
      topicBadge.dataset.topic = term.topic;
      topicBadge.textContent = term.topicLabel;
      dt.append(name, topicBadge);
      const dd = document.createElement("dd");
      dd.className = "glossary-definition";
      const def = document.createElement("span");
      def.className = "glossary-definition-text";
      def.textContent = term.definition;
      dd.append(def);
      for (const chapter of term.relatedChapters) {
        const tag = document.createElement("span");
        tag.className = "glossary-chapter-tag";
        tag.textContent = `→ ${chapterDisplay$1(chapter)}`;
        dd.append(tag);
      }
      list.append(dt, dd);
    }
  }
  renderTabs();
  renderList2();
  root.append(searchWrap, tabs, summary, list);
}
function chapterDisplay$1(chapter) {
  return /^\d+$/.test(chapter) ? `第 ${chapter} 章` : chapter;
}
const CATEGORY_LABELS$1 = {
  principle: "原理类",
  engineering: "工程类",
  project: "项目深挖类"
};
const COLLECTED_DATE = "2026-07-23";
const COLLECTED_AT = `${COLLECTED_DATE}T09:00:00+08:00`;
const RAW_QUESTIONS = [
  // A. 原理类
  {
    slug: "llm-vs-agent-and-loop",
    category: "principle",
    question: "LLM 和 Agent 有什么区别？请画出 Agent 的执行循环。",
    relatedChapters: ["01"]
  },
  {
    slug: "token-and-statelessness-memory",
    category: "principle",
    question: "什么是 token？为什么说 LLM 是「无状态」的？多轮对话的「记忆」是怎么实现的？",
    relatedChapters: ["02", "07"]
  },
  {
    slug: "system-vs-user-prompt-cot-temperature",
    category: "principle",
    question: "system 提示和 user 提示有什么区别？为什么思维链（CoT）能提升正确率？什么任务该把 temperature 设成 0？",
    relatedChapters: ["03"]
  },
  {
    slug: "react-and-maxsteps",
    category: "principle",
    question: "ReAct 是什么、解决了什么问题？为什么 agent 循环一定要有 maxSteps（停止条件）？",
    relatedChapters: ["04"]
  },
  {
    slug: "function-calling-roundtrip",
    category: "principle",
    question: "function calling 的完整往返是怎样的？模型会自己执行工具吗？toolCallId 是干什么用的？",
    relatedChapters: ["05"]
  },
  {
    slug: "rag-basics-overlap-topk-traceable",
    category: "principle",
    question: "什么是 RAG？为什么 RAG 能降低幻觉？分块为什么要做 overlap？top-k 的 k 怎么取？如何让答案可溯源？",
    relatedChapters: ["08", "09"]
  },
  {
    slug: "why-llm-hallucinate",
    category: "principle",
    question: "模型为什么会幻觉？这是 bug 还是固有特性？工程上能彻底消除吗？",
    relatedChapters: ["09"]
  },
  {
    slug: "embedding-cosine-vs-euclidean",
    category: "principle",
    question: "什么是 embedding？为什么用余弦相似度而不是欧氏距离？语义检索 vs 关键词检索各自适用什么场景？",
    relatedChapters: ["08"]
  },
  {
    slug: "react-vs-plan-execute-reflection",
    category: "principle",
    question: "ReAct 和 Plan-and-Execute 的本质区别？什么任务该用哪个？Reflection 为什么能在不引入新信息的情况下提升质量、收益边界在哪？",
    relatedChapters: ["10"]
  },
  // B. 工程类
  {
    slug: "stable-json-output-retry-repair",
    category: "engineering",
    question: "怎么让 LLM 稳定输出 JSON？校验失败了怎么办（retry-repair 怎么实现）？工具调用 / JSON mode / 提示约束三者区别？",
    relatedChapters: ["13"]
  },
  {
    slug: "prevent-prompt-injection-guardrails",
    category: "engineering",
    question: "如何防 prompt injection？用户能通过输入篡改 system 指令吗？关键操作（删数据、发邮件）你怎么加护栏？",
    relatedChapters: ["17"]
  },
  {
    slug: "control-cost-token-accounting",
    category: "engineering",
    question: "如何控制成本？一次 agent 调用的钱花在哪？怎么算 token 账？上下文太长怎么压？模型怎么选？",
    relatedChapters: ["07", "16"]
  },
  {
    slug: "evaluate-agent-llm-app",
    category: "engineering",
    question: "如何评估一个 Agent / LLM 应用？为什么不能只靠传统单测？LLM-as-judge 有什么风险、怎么缓解？回归测试集解决什么问题？",
    relatedChapters: ["15"]
  },
  {
    slug: "context-window-full-strategies",
    category: "engineering",
    question: "上下文窗口满了怎么办？滑动窗口和摘要压缩各自的取舍？",
    relatedChapters: ["07"]
  },
  {
    slug: "streaming-throughput-vs-ux-abortcontroller",
    category: "engineering",
    question: "流式输出能让接口更快吗（吞吐）？为什么不能？为什么体验还是更好？AbortController 是强杀还是协作式取消？",
    relatedChapters: ["14"]
  },
  {
    slug: "tool-error-feedback-not-throw",
    category: "engineering",
    question: "工具执行报错时，为什么不直接抛异常，而要把错误回传给模型？",
    relatedChapters: ["06"]
  },
  {
    slug: "when-multi-agent-and-cost",
    category: "engineering",
    question: "什么场景下多 agent 比单 agent 更好？多 agent 的主要代价是什么、如何权衡？",
    relatedChapters: ["11"]
  },
  {
    slug: "when-not-to-use-agent",
    category: "engineering",
    question: "什么场景不该用 Agent？",
    relatedChapters: ["01"]
  },
  {
    slug: "computer-use-agent-success-vs-harm-metrics",
    category: "engineering",
    question: "评测 computer-use / workplace agent 时，为什么不能只看任务成功率？unintended / harmful action 指标分别在兜什么风险？",
    relatedChapters: ["15", "17", "19"],
    sourceTitles: [
      "WorkBench Revisited: Towards a Scalable Benchmark for Evaluating Agents in Realistic Enterprise Workflows"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.13715"],
    confidence: "medium",
    rationale: "本题直接来自 2026 新 benchmark 对 success 与 harmful action 双指标的强调。"
  },
  {
    slug: "memory-agent-recall-vs-reuse-evaluation",
    category: "engineering",
    question: "长期记忆 agent 为何不能只测 recall？为什么 observation stream、user feedback、knowledge archive 与 follow-up reuse 要分开评估？",
    relatedChapters: ["07", "15", "19"],
    sourceTitles: [
      "StreamMemBench: Towards Better Long-Context Evaluation for Memory Agents"
    ],
    sourceUrls: ["https://arxiv.org/abs/2509.16490"],
    confidence: "medium",
    rationale: "本题覆盖 2026 新 memory benchmark 的核心口径变化，适合补齐记忆评测高频追问。"
  },
  {
    slug: "harness-vs-framework-boundary",
    category: "engineering",
    question: "什么是 agent harness？它和 agent framework / SDK 的边界怎么划？为什么审批、重试、回放、权限壳层最好放在 harness 而不是模型里？",
    relatedChapters: ["04", "12", "16", "19"],
    sourceTitles: [
      "What makes a harness a harness? Model-free foundation for agentic AI",
      "Anthropic Engineering · Effective harnesses for long-running agents"
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.10666",
      "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    ],
    confidence: "medium",
    rationale: "本题对应 2026 对 harness 抽象的集中讨论，兼顾论文观点与工程实操。"
  },
  {
    slug: "runtime-upgrade-auth-compaction-boundaries",
    category: "engineering",
    question: "Agent runtime / tool 协议升级时，为什么要单独审查 auth-required vs input-required、history compaction、auto-approval 规则和 tracing 注入边界？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework .NET 1.10.0 release notes",
      "Google ADK Python v1.35.0 release notes",
      "OpenAI Agents Python v0.17.5 release notes"
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.10.0",
      "https://github.com/google/adk-python/releases/tag/v1.35.0",
      "https://github.com/openai/openai-agents-python/releases/tag/v0.17.5"
    ],
    confidence: "high",
    rationale: "本题来自多个官方 release notes 的共同趋势：生产 agent 的问题越来越集中在授权、压缩、审批和可观测边界。"
  },
  {
    slug: "scientific-synthesis-clean-room-generalization",
    category: "engineering",
    question: "研究型 agent 的 benchmark 为什么要强调 clean-room synthesis 和 strategic generalization？如果 agent 只是拼接原文句子，为什么高分也不可信？",
    relatedChapters: ["10", "15", "capstone", "19"],
    sourceTitles: [
      "Can AI Agents Synthesize Scientific Conclusions? Understanding Strategic Generalization on SciConBench"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.11337"],
    confidence: "medium",
    rationale: "本题对应 SciConBench 对『跨文献综合』与『避免原句泄露』的双重要求，适合深挖 deep research agent 的真实泛化能力。"
  },
  {
    slug: "long-horizon-agent-benchmark-vs-single-step-score",
    category: "engineering",
    question: "为什么长周期 agent 评测不能只看单步 reward 或单回合成功率？RetailBench 这类 benchmark 在检验什么长期策略能力？",
    relatedChapters: ["10", "15", "19"],
    sourceTitles: [
      "RetailBench: A Long-Horizon Benchmark for AI Agents in Retail Management"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.14545"],
    confidence: "medium",
    rationale: "本题来自长周期零售 benchmark 对策略一致性、跨天反馈链和收益稳定性的强调，适合补齐 long-horizon agent 高频追问。"
  },
  {
    slug: "monitoring-agent-timeliness-false-alert-action-chain",
    category: "engineering",
    question: "监控/告警 agent 为什么要同时测反应时效、误报/漏报和后续行动链，而不是只看『能否识别异常』？",
    relatedChapters: ["16", "17", "18", "19"],
    sourceTitles: [
      "SentinelBench: Benchmarking Monitoring Agents in Dynamic Environments"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.05342"],
    confidence: "medium",
    rationale: "本题来自 monitoring agent benchmark，对 observability、告警治理和自动处置边界都很贴近生产场景。"
  },
  {
    slug: "memory-agent-relational-consistency-vs-keyword-recall",
    category: "engineering",
    question: "评测记忆 agent 时，为什么要单独测补充关系、矛盾关系和无关关系的区分？只看关键词召回会漏掉什么记忆一致性问题？",
    relatedChapters: ["07", "15", "19"],
    sourceTitles: [
      "SubtleMemory: Benchmarking Long-Term Relational Memory in LLM Agents"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.05761"],
    confidence: "medium",
    rationale: "本题覆盖 relational memory benchmark 的核心口径，适合补齐『记住了多少』之外的『记得是否一致』。"
  },
  {
    slug: "pre-approval-tool-input-guardrails-vs-post-hoc-check",
    category: "engineering",
    question: "为什么 tool guardrails 最好放在“真正执行前”的 pre-approval 边界，而不是等工具跑完再做事后检查？这对高权限工具有什么安全意义？",
    relatedChapters: ["05", "17", "18", "19"],
    sourceTitles: [
      "OpenAI Agents Python v0.17.6 release notes",
      "OpenAI Agents JS v0.11.8 release notes"
    ],
    sourceUrls: [
      "https://github.com/openai/openai-agents-python/releases/tag/v0.17.6",
      "https://github.com/openai/openai-agents-js/releases/tag/v0.11.8"
    ],
    confidence: "high",
    rationale: "本题来自 OpenAI Agents 最新 py/js release 的共同变更：把 pre-approval tool input guardrails 前移到真实执行边界。"
  },
  {
    slug: "brokered-execution-vs-agent-held-production-authority",
    category: "engineering",
    question: "为什么生产变更权限不该直接放在 agent 推理进程里？certificate-bound broker / scoped execution identity 这种执行边界在兜什么风险？",
    relatedChapters: ["17", "18", "19"],
    sourceTitles: [
      "Sovereign Execution Brokers: Enforcing Certificate-Bound Authority in Agentic Control Planes"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.20520"],
    confidence: "medium",
    rationale: "本题对应 2026 新 paper 对“proposal / admission / execution”分层的强调，贴近高权限 agent 落地。"
  },
  {
    slug: "probabilistic-policy-verification-under-ambiguous-detectors",
    category: "engineering",
    question: "当 PII detector / declassifier 这类安全判定本身带误差时，为什么 deterministic policy 不够？agent runtime 该怎么理解 probabilistic verification 的意义？",
    relatedChapters: ["15", "17", "19"],
    sourceTitles: [
      "Efficient and Sound Probabilistic Verification for AI Agents"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.20510"],
    confidence: "medium",
    rationale: "本题覆盖安全策略在“检测器有误差”前提下的验证问题，适合补齐 agent security/eval 的高阶追问。"
  },
  {
    slug: "repository-guidance-coverage-vs-precision-for-coding-agents",
    category: "engineering",
    question: "为什么高质量仓库指引（如 AGENTS.md）更主要提升 coding agent 的文件定位覆盖率，而不一定直接提升 patch 精度？步数预算变大时它为什么更重要？",
    relatedChapters: ["12", "15", "19", "capstone"],
    sourceTitles: [
      "Probe-and-Refine Tuning of Repository Guidance for Coding Agents"
    ],
    sourceUrls: ["https://arxiv.org/abs/2606.20512"],
    confidence: "medium",
    rationale: "本题直接来自 2026 新 paper 对 repository guidance 的实验结论，和本仓库 AGENTS/课程结构高度相关。"
  },
  {
    slug: "multi-tenant-agent-runtime-isolation-vs-dedicated-stack",
    category: "engineering",
    question: "为什么共享基础设施的多租户 agent runtime 不能只靠“逻辑上分 tenant”就算隔离完成？state、identity、telemetry 和审批边界分别要隔离什么，什么时候还得回到 dedicated stack？",
    relatedChapters: ["16", "17", "18", "19"],
    sourceTitles: [
      "Shared infrastructure, isolated tenants: Pool model multi-tenancy with Amazon Bedrock AgentCore"
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/shared-infrastructure-isolated-tenants-pool-model-multi-tenancy-with-amazon-bedrock-agentcore/"
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对生产级多租户 AgentCore 隔离模式的官方实践，适合补齐 runtime / deployment / guardrail 的交叉追问。"
  },
  {
    slug: "scientific-copilot-query-parse-retrieval-summary-boundary",
    category: "engineering",
    question: "做研究型 copilot 时，为什么要把 structured query parsing、embedding retrieval 和 AI summary 三段拆开，而不是让一个大 prompt 端到端包办？这样拆分分别在兜什么准确性与可追溯风险？",
    relatedChapters: ["08", "09", "16", "19"],
    sourceTitles: [
      "Build a protein research copilot with Amazon Bedrock AgentCore"
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/build-a-protein-research-copilot-with-amazon-bedrock-agentcore/"
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对 research copilot 的官方实现拆解，直接对应 query parsing / retrieval / summarization 的工程边界。"
  },
  {
    slug: "agent-identity-infrastructure-vs-provider-account-mapping",
    category: "engineering",
    question: "为什么跨组织 agent 协作不能长期依赖“给每个 agent 发一把 API key”这种做法？独立的 agent identity / name service 在信任建立、权限撤销和跨平台互认上解决了什么问题？",
    relatedChapters: ["17", "18", "19"],
    sourceTitles: [
      "Linux Foundation Agent Name Service identity infrastructure announcement"
    ],
    sourceUrls: [
      "https://www.linuxfoundation.org/press/linux-foundation-announces-intent-to-launch-agent-name-service-to-establish-trusted-identity-infrastructure-for-ai-agents"
    ],
    confidence: "high",
    rationale: "本题对应 Linux Foundation 新提出的 agent identity 基础设施，适合补齐 protocol / trust / governance 的生产追问。"
  },
  {
    slug: "approval-state-idempotency-and-guardrail-race-cancellation",
    category: "engineering",
    question: "多 agent / realtime tool 执行里，为什么“已解决的 approval 不应被重复求值”，而 sibling guardrail/task 一旦失败就要立刻取消其它并发 guardrail？否则会出现什么竞态和副作用风险？",
    relatedChapters: ["11", "14", "17", "18", "19"],
    sourceTitles: [
      "OpenAI Agents Python v0.17.7 release notes",
      "OpenAI Agents JS v0.12.0 release notes"
    ],
    sourceUrls: [
      "https://github.com/openai/openai-agents-python/releases/tag/v0.17.7",
      "https://github.com/openai/openai-agents-js/releases/tag/v0.12.0"
    ],
    confidence: "high",
    rationale: "本题来自 OpenAI 最新 py/js release 对 approval state 与 guardrail 并发收尾的修复，直接对应生产 runtime 的竞态与重复副作用边界。"
  },
  {
    slug: "read-only-file-access-still-needs-explicit-approval",
    category: "engineering",
    question: "为什么即便是“read-only auto-approval”模式，file-access 工具仍可能要强制人工审批？当 loop 能力被集成进 harness agent 后，这条边界为什么会变得更关键？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework .NET 1.11.0 release notes",
      "Microsoft Agent Framework Python 1.9.0 release notes"
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.0",
      "https://github.com/microsoft/agent-framework/releases/tag/python-1.9.0"
    ],
    confidence: "high",
    rationale: "本题来自 Microsoft Agent Framework 最新 release：把审批边界前移到 file-access 与 harness loop 结合处，强调“读权限”在长流程里同样可能造成敏感外泄。"
  },
  {
    slug: "declarative-workflow-path-validation-vs-runtime-filesystem-boundary",
    category: "engineering",
    question: "声明式 workflow / skill archive 为什么要显式防 symlink path traversal 和非法 flow definition paths？这类问题看起来不是 prompt bug，却为什么能直接突破 agent runtime 的文件系统边界？",
    relatedChapters: ["11", "17", "18", "19"],
    sourceTitles: [
      "CrewAI 1.14.8a4 release notes"
    ],
    sourceUrls: [
      "https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a4"
    ],
    confidence: "high",
    rationale: "本题来自 CrewAI 最新 prerelease 对 skill archive 提取与 declarative flow path 的安全修复，适合补齐 workflow DSL 落地时的本地文件边界追问。"
  },
  {
    slug: "conversational-flow-telemetry-and-unified-loader-boundary",
    category: "engineering",
    question: "为什么 agent workflow 一旦进入 conversational flow / declarative flow 阶段，就要单独追踪 turn usage，并统一 CLI、TUI、loader 的入口？如果 telemetry 和运行入口不统一，会让调试、计费和回放出现什么问题？",
    relatedChapters: ["11", "16", "18", "19"],
    sourceTitles: [
      "CrewAI 1.15.0 release notes"
    ],
    sourceUrls: [
      "https://github.com/crewAIInc/crewAI/releases/tag/1.15.0"
    ],
    confidence: "high",
    rationale: "本题来自 CrewAI 1.15.0 对 conversational flow telemetry 和 declarative flow 统一入口的稳定版收敛，适合追问多 agent workflow 的可观测与运维边界。"
  },
  {
    slug: "agentic-overlay-vs-rebuild-for-legacy-enterprise-services",
    category: "engineering",
    question: "为什么企业做 agent 改造时常常应该『retrofit, don't rebuild』？agentic overlay 与直接重写遗留系统相比，分别在兜什么集成、权限和发布风险？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Retrofit, don't rebuild: Agentic overlays for transforming legacy enterprise services"
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/retrofit-dont-rebuild-agentic-overlays-for-transforming-legacy-enterprise-services/"
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对 legacy enterprise services 的 agentic overlay 实践，适合补齐工具接口改造、权限壳层和渐进迁移的生产追问。"
  },
  {
    slug: "governed-data-mesh-for-agentic-ai-vs-direct-source-access",
    category: "engineering",
    question: "为什么生产级 agentic AI 需要 governed data mesh，而不是让 agent 直接去拉数据库/对象存储/知识库？identity、catalog、policy 和 knowledge base 在 agent 数据底座里分别解决什么问题？",
    relatedChapters: ["08", "09", "16", "17", "18", "19"],
    sourceTitles: [
      "Building agentic AI applications with a modern data mesh strategy on AWS"
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/building-agentic-ai-applications-with-a-modern-data-mesh-strategy-on-aws/"
    ],
    confidence: "high",
    rationale: "本题来自 AWS 对 governed data mesh + Bedrock AgentCore + Knowledge Bases 的组合实践，适合追问 production agent 的数据治理与检索边界。"
  },
  {
    slug: "approval-by-default-for-agent-skills-and-tools",
    category: "engineering",
    question: "为什么 production agent 里的 skill/provider tools 最好默认 require approval，而不是默认放行后再补规则？一旦默认值反了，权限壳层、审计和回放会出现什么系统性漏洞？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework .NET 1.11.1 release notes"
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.1"
    ],
    confidence: "high",
    rationale: "本题来自 Microsoft Agent Framework 1.11.1 的 breaking change：把 AgentSkillsProvider tools 的默认审批策略改成 require approval，适合补齐 agent tool 默认信任边界的高频追问。"
  },
  {
    slug: "redirect-based-ssrf-in-agent-fetch-and-scraping-tools",
    category: "engineering",
    question: "为什么 agent 的网页抓取 / scraping tool 不能只校验首跳 URL 是否在 allowlist？一旦重定向链里出现 SSRF bypass，会把什么内网、metadata 或权限侧信道暴露给 agent？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "CrewAI 1.15.1 release notes"
    ],
    sourceUrls: [
      "https://github.com/crewAIInc/crewAI/releases/tag/1.15.1"
    ],
    confidence: "high",
    rationale: "本题来自 CrewAI 1.15.1 对 scraping fetches 中 SSRF redirect bypass 的修复，适合补齐 fetch/search/browser 类工具的网络边界追问。"
  },
  {
    slug: "stepwise-verification-and-interactive-benchmarks-for-research-agents",
    category: "engineering",
    question: "为什么研究型 agent 的 benchmark 不能只看最终答案对不对？stepwise verification 和 interactive environment 分别在检验什么能力，为什么它们比 final-answer-only 更能暴露长流程研究任务的失败模式？",
    relatedChapters: ["10", "15", "19", "capstone"],
    sourceTitles: [
      "Benchmarking AI Agents for Addressing Scientific Challenges Across Scales"
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.12736"
    ],
    confidence: "medium",
    rationale: "本题来自 SciAgentArena 论文：约 200 个科学任务使用 stepwise verification 和 interactive environment，适合补齐 deep research / science agent 的评测口径追问。"
  },
  {
    slug: "assistant-function-choice-vs-openapi-path-canonicalization",
    category: "engineering",
    question: "为什么给 Assistant agent 增加 `function_choice_behavior` 这类更强的函数选择能力时，必须同时审查 OpenAPI plugin 的路径归一化与 encoded dot-segment 绕过？如果只增强调度能力、不收紧 plugin 路径边界，会把什么 SSRF / 越权调用风险放大？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Semantic Kernel Python 1.43.1 release notes"
    ],
    sourceUrls: [
      "https://github.com/microsoft/semantic-kernel/releases/tag/python-1.43.1"
    ],
    confidence: "high",
    rationale: "本题来自 Semantic Kernel 1.43.1：把 assistant agent 的函数选择能力增强与 OpenAPI plugin 路径规范化修复放在同一次 release，适合追问“能力增强”和“边界收紧”为何必须并行推进。"
  },
  {
    slug: "scientific-review-agent-needs-inference-scaling-and-human-final-say",
    category: "engineering",
    question: "为什么 scientific review agent 不能只做一次性摘要或 zero-shot 打分？`inference scaling`、理论/实验核查和“人类保留最终裁决”分别在兜什么误判与责任边界？",
    relatedChapters: ["10", "15", "19", "capstone"],
    sourceTitles: [
      "Towards Automating Scientific Review with Google's Paper Assistant Tool"
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.28277"
    ],
    confidence: "medium",
    rationale: "本题来自 Google PAT 论文：review agent 的核心不是生成评论，而是把验证链拉长、把错误暴露出来，并维持 human-in-the-loop 的最终控制。"
  },
  {
    slug: "repository-level-friction-vs-single-agent-win-rate",
    category: "engineering",
    question: "为什么 coding agent 评测不能只看 isolated task success 或单个 PR 是否过测？`repository-level integration friction` 在衡量什么，为什么它比单 agent 胜率更接近真实生产风险？",
    relatedChapters: ["12", "15", "16", "18", "19"],
    sourceTitles: [
      "Govern the Repository, Not the Agent: Measuring Ecosystem-Level Risk in AI-Native Software"
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.28235"
    ],
    confidence: "medium",
    rationale: "本题来自仓库级风险论文：agent 各自过关不代表共享仓库健康，适合补齐 coding agent 在并发集成、仓库摩擦和生态治理上的高频追问。"
  },
  {
    slug: "debuggable-harness-boundary-in-background-agent-runtime",
    category: "engineering",
    question: "为什么 background agent runtime 不能吞掉 skill / resource 错误，而要把 provider 解析、available resources / scripts 和失败原因显式暴露给 harness？这对 agent 自纠错、回放和生产可调试性分别意味着什么？",
    relatedChapters: ["05", "11", "16", "18", "19"],
    sourceTitles: [
      "Microsoft Agent Framework Python 1.10.0 release notes"
    ],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/python-1.10.0"
    ],
    confidence: "high",
    rationale: "本题来自 Microsoft Agent Framework Python 1.10.0：release 直接补了 background agent loop provider 解析、available_resources/scripts 暴露与 skill/resource error 透传，适合追问 runtime 为什么必须让模型和 harness 看见真实失败边界。"
  },
  {
    slug: "terminal-use-agent-benchmark-needs-real-work-breadth",
    category: "engineering",
    question: "为什么 terminal-use agent 的 benchmark 不能只测 coding 或单条 shell task？像 TUA-Bench 这类覆盖文档编辑、邮件、在线研究、内容创作与系统运维的任务集，在检验什么更接近真实工作的长期能力？",
    relatedChapters: ["10", "15", "18", "19"],
    sourceTitles: [
      "TUA-Bench: A Benchmark for General-Purpose Terminal-Use Agents"
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2506.17537"
    ],
    confidence: "medium",
    rationale: "本题来自 TUA-Bench：把 terminal-use agent 从单一 coding 场景扩展到 200+ 个跨知识工作任务，适合补齐“真实工作广度”和“长流程工具链编排”两个评测维度。"
  },
  {
    slug: "multi-layer-agent-red-teaming-vs-single-jailbreak-metric",
    category: "engineering",
    question: "为什么 agent 安全红队不能只看单一 jailbreak 成功率？基础设施层、协议层、agent 层和模型层分别会暴露什么不同攻击面，为什么必须做 multi-layer red teaming？",
    relatedChapters: ["11", "15", "17", "18", "19"],
    sourceTitles: [
      "Securing the AI Agent: A Unified Framework for Multi-Layer Agent Red Teaming"
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2506.19396"
    ],
    confidence: "medium",
    rationale: "本题来自 AI-Infra-Guard 论文：把 agent 红队拆成 infra / protocol / agent / model 四层，适合补齐生产 agent 为什么不能只做 prompt jailbreak 测试的安全追问。"
  },
  {
    slug: "checkpoint-delta-state-roundtrip-vs-production-replay",
    category: "engineering",
    question: "为什么 graph agent 的 checkpoint / delta state 不能把『序列化细节』当成无关实现？一旦 `Overwrite` 或 superstep 补丁在 JSON roundtrip 后语义漂移，会怎样破坏回放、恢复和线上排障？",
    relatedChapters: ["11", "16", "18", "19"],
    sourceTitles: ["LangGraph 1.2.7 release notes"],
    sourceUrls: ["https://github.com/langchain-ai/langgraph/releases/tag/1.2.7"],
    confidence: "high",
    rationale: "本题来自 LangGraph 1.2.7：release 直接修了 DeltaChannel overwrite、Overwrite JSON roundtrip 和 exit-mode task_id 边界，适合追问 state graph 为何会在持久化层翻车。"
  },
  {
    slug: "a2a-gateway-vs-point-to-point-agent-mesh",
    category: "engineering",
    question: "为什么企业里的 agent-to-agent 通信不能靠点对点 URL + 各自凭证凑合？A2A protocol 只解决了哪一层，为什么 discoverability、scope 授权、统一路由、rate limit 和单域流式代理还需要单独的 gateway 层？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Building a serverless A2A gateway for agent discovery, routing, and access control"
    ],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/building-a-serverless-a2a-gateway-for-agent-discovery-routing-and-access-control/"
    ],
    confidence: "high",
    rationale: "本题来自 AWS A2A gateway 实践：文章明确把 management / control / execution 三层拆开，适合补齐协议标准化与企业治理层的边界追问。"
  },
  {
    slug: "metadata-prefiltering-vs-pure-semantic-memory-retrieval",
    category: "engineering",
    question: "为什么长期记忆 / agentic RAG 不能只靠 namespace + 语义相似度？metadata pre-filter、STRICTLY_CONSISTENT 键和值域约束分别在兜什么检索边界，为什么它们要发生在向量搜索之前？",
    relatedChapters: ["07", "08", "09", "11", "19"],
    sourceTitles: ["Structured memory filtering with metadata in AgentCore Memory"],
    sourceUrls: [
      "https://aws.amazon.com/blogs/machine-learning/structured-memory-filtering-with-metadata-in-agentcore-memory/"
    ],
    confidence: "high",
    rationale: "本题来自 AgentCore Memory 元数据过滤实践：重点不是记忆更多，而是先按业务/权限/时间边界裁候选集，再做相似度召回。"
  },
  {
    slug: "open-world-tool-use-fragility-vs-static-benchmark-score",
    category: "engineering",
    question: "为什么 tool-use agent 在静态 benchmark 上高分，到了真实环境仍会明显掉点？query、action、observation、domain 四类 open-world shift 分别在暴露什么泛化缺口，为什么仅靠静态训练不够？",
    relatedChapters: ["05", "10", "15", "18", "19"],
    sourceTitles: [
      "Can Agents Generalize to the Open World? Unveiling the Fragility of Static Training in Tool Use"
    ],
    sourceUrls: ["https://arxiv.org/abs/2607.01084"],
    confidence: "medium",
    rationale: "本题来自 OpenAgent 论文：把 open-world tool-use shift 拆成四层后，能直接追问为什么离线高分和线上可靠性不是一回事。"
  },
  {
    slug: "copilot-agent-session-streaming-audit-vs-chat-logs",
    category: "engineering",
    question: "为什么企业级 coding agent 不能只保留普通聊天日志，而要把 prompts、responses、tool calls 作为 agent session usage records 流式送到 SIEM / audit log？这和可观测性、合规审计、事故回放分别有什么关系？",
    relatedChapters: ["11", "16", "17", "18", "19"],
    sourceTitles: ["Copilot agent session streaming is now in public preview"],
    sourceUrls: [
      "https://github.blog/changelog/2026-07-02-copilot-agent-session-streaming-is-now-in-public-preview/"
    ],
    confidence: "high",
    rationale: "本题来自 GitHub Copilot agent session streaming：官方把 prompts / responses / tool calls 做成企业 usage records，适合追问 coding agent 的审计边界。"
  },
  {
    slug: "flow-agent-runtime-prerelease-signal-vs-stable-baseline",
    category: "engineering",
    question: "看到 CrewAI 这类 runtime 的 prerelease 同时改 Bedrock 适配、flow agent options、streaming docs 和 self-listening flow 校验时，应该如何判断哪些是生产升级信号，哪些只能作为观望项？",
    relatedChapters: ["11", "12", "14", "18", "19"],
    sourceTitles: ["CrewAI 1.15.2a2 release notes"],
    sourceUrls: ["https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a2"],
    confidence: "medium",
    rationale: "本题来自 CrewAI 官方 prerelease，考点是 runtime release notes 的工程解读：云模型适配、flow 校验和 streaming 不是同一类风险。"
  },
  {
    slug: "single-api-multi-agent-system-vs-app-level-orchestration",
    category: "engineering",
    question: "Sakana Fugu 这类把 multi-agent system 包装成单个 LLM/API 的做法，和应用层自己用 LangGraph / CrewAI 编排多个 agent 有什么边界差异？可观测性、成本控制、debug 和 vendor lock-in 分别会怎么变？",
    relatedChapters: ["04", "11", "12", "16", "18", "19"],
    sourceTitles: ["Sakana Fugu"],
    sourceUrls: ["https://github.com/SakanaAI/fugu"],
    confidence: "medium",
    rationale: "本题来自 Sakana Fugu：多 agent 能力被产品化为单模型接口后，使用门槛降低，但内部编排透明度和治理边界会变化。"
  },
  {
    slug: "eddops-registry-promotion-retirement-vs-one-time-eval",
    category: "engineering",
    question: "为什么 agent 评估不能停在上线前一次 benchmark？EDDOps 里的 registry、promotion、retirement 和 trace-native observability 分别在治理 agent 生命周期的哪一段风险？",
    relatedChapters: ["15", "16", "18", "19"],
    sourceTitles: [
      "Registry-Governed Agent Lifecycle: Completing EDDOps with Evaluation-Driven Registration, Promotion, and Retirement on AWS AgentCore"
    ],
    sourceUrls: ["https://arxiv.org/abs/2607.00345"],
    confidence: "medium",
    rationale: "本题来自 EDDOps / AgentCore 论文，适合把 agent eval 从一次性分数扩展到注册、晋升、观测和退休的全生命周期治理。"
  },
  {
    slug: "session-credit-limit-vs-global-budget-for-automation-agents",
    category: "engineering",
    question: "为什么自动化 coding agent 不能只靠月度/组织级预算控成本，而需要每次 session 自己带 AI credit 上限？subagents、compaction 和后台工作分别会怎样让一次运行超出预期？",
    relatedChapters: ["11", "16", "18", "19"],
    sourceTitles: ["Set AI credit session limits in Copilot CLI and SDK"],
    sourceUrls: [
      "https://github.blog/changelog/2026-07-01-set-ai-credit-session-limits-in-copilot-cli-and-sdk/"
    ],
    confidence: "high",
    rationale: "本题来自 GitHub Copilot CLI / SDK session limits：考点是 agent 成本控制要进入运行时边界，而不是只做事后账单统计。"
  },
  {
    slug: "browser-agent-permission-isolation-and-network-domain-controls",
    category: "engineering",
    question: "浏览器工具进入 IDE agent 后，为什么必须同时设计 tab 隔离、cookie/storage 隔离、敏感权限显式审批和企业域名 allow/deny？这些控制分别在防什么事故？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: [
      "Browser tools for GitHub Copilot in VS Code are generally available"
    ],
    sourceUrls: [
      "https://github.blog/changelog/2026-07-01-browser-tools-for-github-copilot-in-vs-code-are-generally-available/"
    ],
    confidence: "high",
    rationale: "本题来自 Copilot browser tools GA：agent 获得真实浏览器动作后，用户会话隔离、权限审批和网络域控制都变成生产必答题。"
  },
  {
    slug: "file-editing-tools-session-isolation-and-approval-harness-defaults",
    category: "engineering",
    question: "当 agent framework 新增 file editing tools、per-user session isolation 和 configurable default-approval harness 时，为什么这不是简单的功能增强，而是在重划身份、文件系统和工具审批边界？",
    relatedChapters: ["05", "11", "17", "18", "19"],
    sourceTitles: ["Microsoft Agent Framework .NET 1.13.0 release notes"],
    sourceUrls: [
      "https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.13.0"
    ],
    confidence: "high",
    rationale: "本题来自 Microsoft Agent Framework .NET 1.13.0：同一 release 同时触及 session isolation、file editing tools、skill approval options 与 shell/default approval 配置，适合追问 production harness 的安全默认值。"
  },
  {
    slug: "verified-rule-generation-loop-vs-freeform-agent-output",
    category: "engineering",
    question: "为什么让 agent 生成 deterministic rules 时，不能只看生成文本是否合理，而要把每条规则放进 corpus verification loop？这种 verified-rule generation 和普通自由文本生成在可靠性上有什么本质差异？",
    relatedChapters: ["10", "15", "19", "capstone"],
    sourceTitles: [
      "Agentic generation of verifiable rules for deterministic, self-expanding reaction classification"
    ],
    sourceUrls: ["https://arxiv.org/abs/2607.01061"],
    confidence: "medium",
    rationale: "本题来自 2607.01061：多 agent pipeline 不是只产出解释，而是产出可在数据集上验证的符号规则，适合追问 agent 输出如何从文本建议变成可回归工件。"
  },
  {
    slug: "realtime-agent-default-model-and-cross-sdk-parity",
    category: "engineering",
    question: "RealtimeAgent 默认模型跨 Python / JS SDK 同步升级时，为什么不能只改依赖版本，而要审查模型默认值、session 存储、token/trace 口径和回滚策略？",
    relatedChapters: ["12", "14", "16", "18", "19"],
    sourceTitles: [
      "OpenAI Agents SDK Python v0.18.0 release notes",
      "OpenAI Agents SDK JS v0.13.0 release notes"
    ],
    sourceUrls: [
      "https://github.com/openai/openai-agents-python/releases/tag/v0.18.0",
      "https://github.com/openai/openai-agents-js/releases/tag/v0.13.0"
    ],
    confidence: "high",
    rationale: "本题来自 OpenAI Agents Python / JS 同日 release：RealtimeAgent 默认模型升级会影响延迟、成本、能力边界、trace 对比和事故回滚，适合追问 SDK 默认值变更的生产审查。"
  },
  {
    slug: "managed-agent-workflow-as-tool-vs-local-orchestration",
    category: "engineering",
    question: "Google ADK 这类 runtime 同时加入 ManagedAgent、Workflow as Tool、session TTL、MCP traces 和 sandbox/security 修复时，为什么要重新划分托管执行、应用层编排、可观测性和安全默认值的边界？",
    relatedChapters: ["11", "12", "16", "17", "18", "19"],
    sourceTitles: ["Google ADK Python v2.4.0 release notes"],
    sourceUrls: ["https://github.com/google/adk-python/releases/tag/v2.4.0"],
    confidence: "high",
    rationale: "本题来自 Google ADK v2.4.0：同一 release 同时扩大托管 agent 能力、工作流复用能力、会话生命周期、trace 和安全补丁，适合考 runtime 升级的边界审查。"
  },
  {
    slug: "fresh-thread-update-state-snapshot-vs-stub-checkpoint",
    category: "engineering",
    question: "为什么 graph agent 在 fresh thread 上执行 updateState 时，应该强制形成可恢复 snapshot，而不能留下语义不完整的 stub checkpoint？这会怎样影响时间旅行、回放、人工修正和线上排障？",
    relatedChapters: ["07", "11", "15", "16", "18", "19"],
    sourceTitles: ["LangGraph 1.2.8 release notes"],
    sourceUrls: ["https://github.com/langchain-ai/langgraph/releases/tag/1.2.8"],
    confidence: "high",
    rationale: "本题来自 LangGraph 1.2.8：checkpoint/delta state bug 直接影响 fresh thread 的 updateState 语义，适合追问状态持久化是否可回放、可修正、可审计。"
  },
  {
    slug: "enterprise-cli-coding-agent-adoption-retention-output-proxy",
    category: "engineering",
    question: "企业 rollout CLI coding agents 时，为什么不能只看试用人数或 benchmark 成绩？adoption、retention、merged PR 这类 output proxy、token spend 和社交扩散分别应该怎样纳入评估？",
    relatedChapters: ["11", "15", "16", "18", "19"],
    sourceTitles: [
      "Adoption and Impact of Command-Line AI Coding Agents: A Study of Microsoft's Early 2026 Rollout of Claude Code and GitHub Copilot CLI"
    ],
    sourceUrls: ["https://arxiv.org/abs/2607.01418"],
    confidence: "medium",
    rationale: "本题来自 Microsoft CLI coding agent rollout 研究：作者用 merged PR 作为 output proxy，并提醒它不等同真实价值，适合考企业 agent 评估如何避免把采用率或产出代理指标误读为业务收益。"
  },
  {
    slug: "copilot-model-family-policy-and-job-fit",
    category: "engineering",
    question: "Copilot 这类 agentic coding 产品把 GPT-5.6 分成 Sol / Terra / Luna 并放进多个 agent 入口时，为什么模型选择不能只看“最强模型”？任务复杂度、usage-based billing、管理员策略和回滚分别要怎样纳入？",
    relatedChapters: ["12", "16", "18", "19"],
    sourceTitles: [
      "OpenAI's GPT-5.6 Sol, Terra, and Luna are now available in GitHub Copilot"
    ],
    sourceUrls: [
      "https://github.blog/changelog/2026-07-09-openais-gpt-5-6-sol-terra-and-luna-are-now-available-in-github-copilot/"
    ],
    confidence: "high",
    rationale: "本题来自 GitHub Copilot GPT-5.6 模型族 rollout：同一 agent 产品把不同模型绑定到不同任务、计费和企业策略，适合考模型选择的工程治理。"
  },
  {
    slug: "repository-overview-onboarding-vs-source-truth",
    category: "engineering",
    question: "Copilot 能为陌生仓库生成 overview / README 时，为什么这既是 onboarding 能力，也是事实性风险点？怎样用 README、贡献指南、源码扫描和人工复核兜住仓库理解偏差？",
    relatedChapters: ["07", "12", "16", "19", "capstone"],
    sourceTitles: ["Ask Copilot for a repository overview"],
    sourceUrls: [
      "https://github.blog/changelog/2026-07-09-ask-copilot-for-a-repository-overview/"
    ],
    confidence: "high",
    rationale: "本题来自 GitHub Copilot repository overview：仓库理解能力能降低 onboarding 成本，但也会把生成式摘要的事实性风险带入代码入口。"
  },
  {
    slug: "managed-otel-agent-host-vs-local-env-telemetry",
    category: "engineering",
    question: "为什么企业不能只让开发者自己配 OTEL_* 环境变量，而要用 managed settings 统一 Copilot CLI agent host 的 OpenTelemetry 导出？prompt / response / tool content、认证 header 和子进程隔离分别在兜什么治理风险？",
    relatedChapters: ["16", "17", "18", "19"],
    sourceTitles: ["Enterprise-managed OpenTelemetry export for VS Code and CLI"],
    sourceUrls: [
      "https://github.blog/changelog/2026-07-08-enterprise-managed-opentelemetry-export-for-vs-code-and-cli/"
    ],
    confidence: "high",
    rationale: "本题来自 GitHub enterprise-managed OTel：官方强调托管配置优先于本地环境变量，并避免把认证 header 暴露给子进程，适合考 agent 观测和凭证边界。"
  },
  {
    slug: "stable-crewai-flow-skill-runtime-hardening",
    category: "engineering",
    question: "CrewAI 1.15.2 把 inline skills、Flow Definition authoring、templated flow inputs、stream frame protocol 和 repository agents 做成 stable release 时，为什么要把 flow 定义、技能装载、反馈处理和供应链修复一起审查？",
    relatedChapters: ["11", "12", "14", "17", "18", "19"],
    sourceTitles: ["CrewAI 1.15.2 release notes"],
    sourceUrls: ["https://github.com/crewAIInc/crewAI/releases/tag/1.15.2"],
    confidence: "high",
    rationale: "本题来自 CrewAI 1.15.2 stable release：同一版本同时碰到 flow、skill、repo agent、streaming 与依赖安全修复，适合追问 runtime 升级审查清单。"
  },
  {
    slug: "agent-failure-taxonomy-vs-leaderboard-score",
    category: "engineering",
    question: "为什么 agent 评估不能只看 leaderboard 或平均分？tool 参数错误、规划失败、长上下文退化、多 agent 协调、安全失败和 measurement validity 这六类失败要怎样进入回归分桶？",
    relatedChapters: ["05", "10", "11", "15", "17", "18", "19"],
    sourceTitles: [
      "Beyond the Leaderboard: A Synthesis of Agentic AI Benchmarking, Failure Taxonomies, and Evaluation Gaps"
    ],
    sourceUrls: ["https://arxiv.org/abs/2607.05775"],
    confidence: "medium",
    rationale: "本题来自 2607.05775 综述：它把 agent benchmark 的问题从榜单均分拆到失败模式、轨迹和测量有效性，适合考评估体系设计。"
  },
  {
    slug: "hosted-multi-agent-sdk-sandbox-ownership",
    category: "engineering",
    question: "OpenAI Agents SDK 增加 hosted multi-agent beta 和 GPT-5.6 request controls 时，为什么要同时审查 sandbox PTY/Docker cleanup ownership、realtime callback/playback 和 content-filter refusal 可见性？",
    relatedChapters: ["12", "14", "17", "18", "19"],
    sourceTitles: ["OpenAI Agents SDK Python v0.18.2 release notes"],
    sourceUrls: ["https://github.com/openai/openai-agents-python/releases/tag/v0.18.2"],
    confidence: "high",
    rationale: "本题来自 OpenAI Agents SDK v0.18.2：同一 release 同时触达 hosted multi-agent、sandbox 生命周期、realtime 行为和拒答可见性，适合考生产运行时升级审查。"
  },
  {
    slug: "delta-channel-metadata-counters-replay",
    category: "engineering",
    question: "LangGraph 1.2.9 修 updateState metadata / counters for delta channel，为什么这类字段会影响 replay、time travel、监控统计和事故排查，而不能当成内部实现细节？",
    relatedChapters: ["07", "11", "15", "16", "18", "19"],
    sourceTitles: ["LangGraph 1.2.9 release notes"],
    sourceUrls: ["https://github.com/langchain-ai/langgraph/releases/tag/1.2.9"],
    confidence: "high",
    rationale: "本题来自 LangGraph 1.2.9：delta channel 元数据和计数器会进入状态恢复、时间旅行和 trace 口径，适合考 agent graph 持久化一致性。"
  },
  {
    slug: "agent-ui-tool-call-approval-cwe863",
    category: "engineering",
    question: "Pydantic AI 披露 AG-UI dangling tool-call strip 的 CWE-863 风险时，为什么 requires_approval、ApprovalRequiredToolset、工具参数鉴权和 usage_limits 要一起看？",
    relatedChapters: ["05", "13", "16", "17", "18", "19"],
    sourceTitles: ["Pydantic AI v2.9.0 release notes"],
    sourceUrls: ["https://github.com/pydantic/pydantic-ai/releases/tag/v2.9.0"],
    confidence: "high",
    rationale: "本题来自 Pydantic AI v2.9.0：安全公告把 UI 消息清洗、工具审批和授权边界放在一起，适合考 agent tool-call 治理。"
  },
  {
    slug: "multi-user-ai-budget-state-api-cost-governance",
    category: "engineering",
    question: "为什么企业级 agent / Copilot 成本治理不能只看总预算？GitHub multi-user budget per-user states API 里的 consumed、limit、使用比例过滤和 individual override 应该怎样用于预警、降级和 enablement？",
    relatedChapters: ["16", "18", "19"],
    sourceTitles: ["Per-user states for multi-user budgets in the REST API"],
    sourceUrls: ["https://github.blog/changelog/2026-07-10-per-user-states-for-multi-user-budgets-in-the-rest-api/"],
    confidence: "high",
    rationale: "本题来自 GitHub 2026-07-10 budget API：成本治理开始下沉到用户级状态，适合考 agent 成本观测和组织级配额控制。"
  },
  {
    slug: "agentic-rag-underwriting-human-governance",
    category: "engineering",
    question: "在 underwriting 这类 regulated workflow 中，为什么 Agentic RAG 要把 targeted retrieval、third-party checks、multi-step rule evaluation 和 human-in-the-loop governance 组合起来，而不是只做 naive RAG？",
    relatedChapters: ["09", "10", "11", "15", "17", "18", "19"],
    sourceTitles: ["Agentic AI and Retrieval-Augmented Models in Straight-Through Underwriting"],
    sourceUrls: ["https://arxiv.org/abs/2607.07858"],
    confidence: "medium",
    rationale: "本题来自 arXiv 2607.07858：论文用 underwriting 三管线对比说明多步、缺失信息和可审计决策比单纯检索摘要更关键。"
  },
  {
    slug: "health-agent-benchmark-terminal-verifier-governance",
    category: "engineering",
    question: "HealthAgentBench 这类医疗 agent benchmark 为什么要把终端环境、任务级 verifier、数据凭证、禁用浏览器和成本/时间指标一起纳入，而不能只看最终回答对不对？",
    relatedChapters: ["10", "11", "15", "16", "17", "18", "19"],
    sourceTitles: [
      "HealthAgentBench: A Unified Benchmark Suite of Realistic Agentic Healthcare Environments for Challenging Frontier AI Agents",
      "microsoft/HealthAgentBench"
    ],
    sourceUrls: [
      "https://arxiv.org/abs/2606.31179",
      "https://github.com/microsoft/HealthAgentBench"
    ],
    confidence: "medium",
    rationale: "本题来自 HealthAgentBench 论文与 Microsoft 仓库：医疗 agent 评估需要同时覆盖执行环境、领域 verifier、数据访问许可、防作弊和成本时间。"
  },
  {
    slug: "benchmark-audit-vs-assuming-ground-truth-is-clean",
    category: "engineering",
    question: "为什么评估 Agent 时不能默认 benchmark ground truth 和评分脚本都是干净的？Auto Benchmark Audit 发现的环境依赖、规格缺口和脆弱评分会怎样扭曲 SWE-bench / Terminal-Bench 这类结果？",
    relatedChapters: ["15", "16", "18", "19"],
    sourceTitles: ["Automated Benchmark Auditing for AI Agents and Large Language Models"],
    sourceUrls: ["https://arxiv.org/abs/2605.26079"],
    confidence: "medium",
    rationale: "本题来自 Auto Benchmark Audit：论文显示 benchmark 本身的缺陷会改变模型排名与平均分，适合考评估可信度和回归治理。"
  },
  {
    slug: "agents-md-skills-subagents-harness-engineering",
    category: "engineering",
    question: "AGENTS.md、context files、skills 和 subagents 分别在 coding agent harness 里解决什么问题？为什么说 AGENTS.md 是起点，但不能替代可执行 skill、权限边界和回归验证？",
    relatedChapters: ["05", "11", "12", "15", "16", "19"],
    sourceTitles: ["Harness Engineering for Agentic AI Coding Tools: An Exploratory Study"],
    sourceUrls: ["https://arxiv.org/abs/2602.14690"],
    confidence: "medium",
    rationale: "本题来自 2026 coding agent harness 研究：AGENTS.md 正成为跨工具起点，但 skills/subagents 的真实采用仍浅，适合考 repo guidance 与可执行 harness 边界。"
  },
  {
    slug: "agentic-pr-dataset-vs-productivity-claim",
    category: "engineering",
    question: "AIDev 这类 agent-authored PR 数据集能支持哪些结论，不能支持哪些结论？为什么 93 万个 Agentic-PR 只能作为采用与协作研究基础，而不能直接证明生产率提升？",
    relatedChapters: ["11", "15", "16", "18", "19"],
    sourceTitles: ["AIDev: Studying AI Coding Agents on GitHub"],
    sourceUrls: ["https://arxiv.org/abs/2602.09185"],
    confidence: "medium",
    rationale: "本题来自 AIDev 数据集论文：大规模 Agentic-PR 数据适合研究采用和协作模式，但 PR 数量不是业务价值或代码质量的直接证明。"
  },
  {
    slug: "openai-agents-js-workerd-tracing-request-controls",
    category: "engineering",
    question: "OpenAI Agents JS SDK 在 workerd 环境修 tracing lifecycle listeners，同时补 hosted multi-agent 和 GPT-5.6 request controls 文档时，为什么要把边缘运行时、trace 生命周期、托管编排和模型请求参数一起审查？",
    relatedChapters: ["11", "12", "16", "18", "19"],
    sourceTitles: ["OpenAI Agents SDK JS v0.13.3 release notes"],
    sourceUrls: ["https://github.com/openai/openai-agents-js/releases/tag/v0.13.3"],
    confidence: "high",
    rationale: "本题来自 OpenAI Agents JS v0.13.3：同一 release 同时触达 workerd tracing、hosted multi-agent 和 GPT-5.6 request controls，适合考 SDK 升级审查边界。"
  },
  {
    slug: "mcp-v2-beta-transport-cancellation-schema-identity",
    category: "engineering",
    question: "MCP v2 beta 迁移时，为什么要把 httpx2/SSE transport、subscriptions/listen、请求取消、resolver sample/list roots、TypeScript shared schema graph 和 exact version pin 放进同一套兼容性测试？",
    relatedChapters: ["05", "06", "11", "12", "17", "18", "19"],
    sourceTitles: [
      "MCP Python SDK v2.0.0b2 release notes",
      "MCP TypeScript SDK core v2.0.0-beta.4 release notes"
    ],
    sourceUrls: [
      "https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.0.0b2",
      "https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/%40modelcontextprotocol%2Fcore%402.0.0-beta.4"
    ],
    confidence: "high",
    rationale: "本题来自 MCP Python/TypeScript v2 beta：协议迁移不只是包升级，还会改变 transport、取消传播、订阅事件、schema 来源和跨包对象身份。"
  },
  {
    slug: "coding-agent-saas-credential-lifecycle-audit",
    category: "engineering",
    question: "OpenHands cloud 修 conversation created_at 生命周期保留和 MCP SaaS credentials encrypted storage 时，为什么这两类 bug 都属于 coding agent SaaS 的审计与安全边界，而不是普通数据字段修复？",
    relatedChapters: ["11", "16", "17", "18", "19"],
    sourceTitles: ["OpenHands cloud 1.46.1 release notes"],
    sourceUrls: ["https://github.com/OpenHands/OpenHands/releases/tag/cloud-1.46.1"],
    confidence: "high",
    rationale: "本题来自 OpenHands cloud 1.46.1：agent SaaS 需要同时保障会话时间线可审计和外部凭证加密持久化。"
  },
  {
    slug: "agent-observability-eval-contracts-statistical-semantics",
    category: "engineering",
    question: "Langfuse self-hosted monitors / contract-aware code evaluator 和 Phoenix evals 的 F-score、timeout、positive_label 修复说明了什么？为什么 observability 与 eval harness 的字段语义会改变上线门禁结论？",
    relatedChapters: ["15", "16", "17", "18", "19"],
    sourceTitles: [
      "Langfuse v3.213.0 release notes",
      "Arize Phoenix evals v3.1.1 release notes"
    ],
    sourceUrls: [
      "https://github.com/langfuse/langfuse/releases/tag/v3.213.0",
      "https://github.com/Arize-ai/phoenix/releases/tag/arize-phoenix-evals-v3.1.1"
    ],
    confidence: "high",
    rationale: "本题来自 Langfuse 与 Phoenix 2026-07-14 releases：生产评估的合约、成本、审计、F-score 和 timeout 归因都会影响回归判断。"
  },
  {
    slug: "agent-memory-provider-surface-reranking-dependency-control",
    category: "engineering",
    question: "Mem0 Node SDK 增加多 vector store、多 LLM provider、多 embedder 和 reranking support，并取消默认拉入 provider SDK 时，为什么长期记忆系统要把 provider surface、依赖体积、rerank 策略和供应商锁定一起设计？",
    relatedChapters: ["07", "08", "09", "15", "18", "19"],
    sourceTitles: ["Mem0 Node SDK v3.1.0 release notes"],
    sourceUrls: ["https://github.com/mem0ai/mem0/releases/tag/ts-v3.1.0"],
    confidence: "high",
    rationale: "本题来自 Mem0 Node SDK v3.1.0：agent memory 正在变成可组合 provider surface，检索质量、依赖边界和部署选择需要同时治理。"
  },
  {
    slug: "llm-as-verifier-vs-llm-as-judge-continuous-scores",
    category: "engineering",
    question: "LLM-as-a-Verifier 和普通 LLM-as-judge 有什么本质区别？为什么连续分数、重复评估、criteria decomposition 和 verifier 进度信号可能比一次性离散打分更适合 agent 回归门禁？",
    relatedChapters: ["10", "15", "16", "18", "19"],
    sourceTitles: ["LLM-as-a-Verifier: A General-Purpose Verification Framework"],
    sourceUrls: ["https://arxiv.org/abs/2607.05391"],
    confidence: "medium",
    rationale: "本题来自 arXiv 2607.05391：论文把 verification 作为 scaling axis，并强调连续分数、标准分解和重复评估对 agentic task 的校准价值。"
  },
  {
    slug: "stream-usage-schema-failfast-provider-normalization",
    category: "engineering",
    question: "OpenAI Agents JS SDK 修复 non-final streaming chunks 的 usage 保留、union/tuple schema conversion fail-fast 和 AI SDK text parts 拼接时，为什么这些都属于生产 agent runtime 的契约问题，而不是普通 SDK 小修？",
    relatedChapters: ["13", "14", "15", "16", "18", "19"],
    sourceTitles: ["OpenAI Agents SDK JS v0.13.4 release notes"],
    sourceUrls: ["https://github.com/openai/openai-agents-js/releases/tag/v0.13.4"],
    confidence: "high",
    rationale: "本题来自 OpenAI Agents JS v0.13.4：流式 usage、schema conversion 和 provider response normalization 会直接影响成本账、trace 和结构化输出可靠性。"
  },
  {
    slug: "settings-roundtrip-mcp-auth-secrets-and-saas-observability",
    category: "engineering",
    question: "为什么 OpenHands cloud 里 settings GET round-trip 剥离 MCP auth secrets、跨域 PostHog distinct_id 和 DB pool 默认值都要放进同一类 SaaS agent 生产风险审查？",
    relatedChapters: ["11", "16", "17", "18", "19"],
    sourceTitles: ["OpenHands cloud 1.46.2 release notes"],
    sourceUrls: ["https://github.com/OpenHands/OpenHands/releases/tag/cloud-1.46.2"],
    confidence: "high",
    rationale: "本题来自 OpenHands cloud 1.46.2：agent SaaS 的配置读写、MCP 凭证保留、观测身份和连接池容量都会改变线上可靠性与安全边界。"
  },
  {
    slug: "observability-eval-export-trace-io-ssrf-fail-closed",
    category: "engineering",
    question: "Langfuse 把 score filters 应用到 event streams、导出 eval job configurations、保护 trace 大 I/O，并在 outbound-URL/SSRF validation 拒绝时自动关闭 export，说明 agent observability 的哪些失败模式必须 fail-closed？",
    relatedChapters: ["15", "16", "17", "18", "19"],
    sourceTitles: ["Langfuse v3.218.0 release notes"],
    sourceUrls: ["https://github.com/langfuse/langfuse/releases/tag/v3.218.0"],
    confidence: "high",
    rationale: "本题来自 Langfuse 2026-07-16 连续 release：eval 配置、trace I/O、event filters 与 SSRF validation 失败会共同影响监控结论和数据导出安全。"
  },
  {
    slug: "history-processing-usage-errors-native-schema-contract",
    category: "engineering",
    question: "Pydantic AI 导出 HistoryProcessor、给 usage-limit/tool-retry errors 加 actionable hints，并修复 Anthropic/Bedrock native structured output schema transform 时，为什么要把历史处理、错误可操作性和 provider-native schema 当成同一套回归契约？",
    relatedChapters: ["05", "13", "14", "15", "16", "19"],
    sourceTitles: ["Pydantic AI v2.11.0 release notes"],
    sourceUrls: ["https://github.com/pydantic/pydantic-ai/releases/tag/v2.11.0"],
    confidence: "high",
    rationale: "本题来自 Pydantic AI v2.11.0：message history、usage/retry 错误提示和 provider-native schema 转换共同决定 agent loop 是否能恢复、解释和稳定产出结构化结果。"
  },
  {
    slug: "agent-safety-reconstructability-vs-final-score",
    category: "engineering",
    question: "为什么 agent-safety evaluation 的 task success、attack success 或 monitor score 不能单独当作 load-bearing evidence？reconstructability metric 和 Evidence Sufficiency Cards 具体补的是哪类证据缺口？",
    relatedChapters: ["15", "16", "17", "18", "19"],
    sourceTitles: ["Agent-Safety Evaluations as Load-Bearing Evidence: A Vendor-Neutral, Cross-Harness Reconstructability Metric"],
    sourceUrls: ["https://arxiv.org/abs/2607.12469"],
    confidence: "medium",
    rationale: "本题来自 arXiv 2607.12469：安全评测需要能重建支撑结论的决策证据，否则同一个分数可能对应完全不同的证据质量。"
  },
  {
    slug: "paper-replication-workspace-evidence-vs-final-message",
    category: "engineering",
    question: "研究型 coding agent 复现实验论文时，为什么不能以最终回复说“完成了”为验收？Paper-replication workflow 里的 target、provenance、report coverage 和 validation checks 分别在防什么风险？",
    relatedChapters: ["10", "15", "16", "19", "capstone"],
    sourceTitles: ["Coding-agents can replicate scientific machine learning papers"],
    sourceUrls: ["https://arxiv.org/abs/2607.02134"],
    confidence: "medium",
    rationale: "本题来自 arXiv 2607.02134：研究型 coding agent 的完成标准应绑定 workspace evidence、claim coverage 和可验证门禁，而不是最终自然语言声明。"
  },
  {
    slug: "autonomous-agent-incident-response-guardrail-lockout",
    category: "engineering",
    question: "Hugging Face 披露 autonomous AI agent system 驱动的真实入侵后，为什么 incident response 不能只靠商业 LLM API？数据处理 worker、凭证轮换、本地取证模型和 guardrail lockout 分别在兜什么风险？",
    relatedChapters: ["05", "11", "16", "17", "18", "19"],
    sourceTitles: ["Security incident disclosure — July 2026"],
    sourceUrls: ["https://huggingface.co/blog/security-incident-july-2026"],
    confidence: "high",
    rationale: "本题来自 Hugging Face 2026-07-16 官方安全披露：真实攻击链同时暴露 dataset processing 执行面、凭证轮换、LLM 辅助取证和安全策略误拦合法分析的边界。"
  },
  {
    slug: "domain-agent-cli-sandbox-eval-pipeline",
    category: "engineering",
    question: "Shippy 这类高风险行业 agent 为什么要把复杂业务 API 封成确定性 CLI、用每用户 ephemeral sandbox 隔离，并用真实数据 rubric 评估整个 agent，而不是只调一个强模型？",
    relatedChapters: ["05", "11", "15", "16", "17", "18", "19"],
    sourceTitles: ["What building Shippy taught us about building agents"],
    sourceUrls: ["https://huggingface.co/blog/allenai/shippy-tech-blog"],
    confidence: "high",
    rationale: "本题来自 Ai2 Shippy 技术复盘：生产 agent 的可靠性来自 typed tool surface、隔离执行、source attribution 和版本化评估，而不只是模型能力。"
  },
  {
    slug: "recursive-harness-self-improvement-vs-prompt-tuning",
    category: "engineering",
    question: "Recursive Harness Self-Improvement 为什么不是普通 prompt tuning？把 harness 当成可优化对象后，trajectory quality、训练数据、inference cost 和低推理强度 agent 的能力上限会怎样改变？",
    relatedChapters: ["10", "11", "15", "16", "19", "capstone"],
    sourceTitles: ["Recursive Harness Self-Improvement"],
    sourceUrls: ["https://arxiv.org/abs/2607.15524"],
    confidence: "medium",
    rationale: "本题来自 arXiv 2607.15524：论文把 harness specification 放进自我改进循环，适合追问 harness、agent loop 和训练数据之间的边界。"
  },
  {
    slug: "trajectory-review-vs-pass-fail-coding-agent-eval",
    category: "engineering",
    question: "为什么 coding agent eval 不能只看最终测试 pass/fail？AgentLens 这类 trajectory review 要怎样审查指令遵循、工具调用、错误恢复和自我验证，才能服务 nightly regression？",
    relatedChapters: ["10", "12", "15", "16", "19"],
    sourceTitles: ["AgentLens: Production-Assessed Trajectory Reviews for Coding Agent Evaluation"],
    sourceUrls: ["https://arxiv.org/abs/2607.06624"],
    confidence: "medium",
    rationale: "本题来自 AgentLens：完整轨迹审查能解释失败模式和版本差异，比单一最终分数更接近生产回归治理。"
  },
  {
    slug: "coding-agent-leaderboard-cost-harness-context",
    category: "engineering",
    question: "看 DeepSWE 这类 coding agent leaderboard 时，为什么必须同时看任务原创性、harness、agent steps、output tokens、cost 和 effort setting？为什么不能把榜单直接解读成纯模型能力排名？",
    relatedChapters: ["12", "15", "16", "18", "19"],
    sourceTitles: ["DeepSWE"],
    sourceUrls: ["https://deepswe.datacurve.ai/"],
    confidence: "high",
    rationale: "本题来自 Datacurve DeepSWE 2026-07-17 更新：榜单同时绑定任务集、mini-swe-agent harness、成本和运行配置，适合考 benchmark 解释边界。"
  },
  {
    slug: "white-box-agent-harness-vs-black-box-saas-coding-agent",
    category: "engineering",
    question: "ToFu 这类 white-box agent harness 和黑盒 SaaS coding agent 的边界差异是什么？可修改运行逻辑、本地部署、token efficiency、工具接入和复现实验分别带来什么取舍？",
    relatedChapters: ["05", "10", "12", "15", "18", "19", "capstone"],
    sourceTitles: ["ToFu: A White-Box, Token-Efficient Agent Harness for Researchers"],
    sourceUrls: ["https://arxiv.org/abs/2607.11423"],
    confidence: "medium",
    rationale: "本题来自 arXiv 2607.11423：white-box harness 把 agent 逻辑、工具执行和评估链路开放给研究者，适合追问可复现、隐私和成本边界。"
  },
  {
    slug: "task-turn-tracing-realtime-usage-session-isolation",
    category: "engineering",
    question: "Agent Runtime 的 task/turn tracing、实时会话成本和工具会话隔离应该如何设计？",
    relatedChapters: ["12", "14", "16", "17", "18", "19"],
    sourceTitles: ["OpenAI Agents SDK Python v0.18.3 release notes"],
    sourceUrls: ["https://github.com/openai/openai-agents-python/releases/tag/v0.18.3"],
    confidence: "high",
    rationale: "本题来自 OpenAI Agents Python v0.18.3：同一版本同时改 task/turn tracing、realtime usage、session serialization、provider error 和 concurrent computer isolation，适合考生产 runtime 分层。"
  },
  {
    slug: "pydantic-ai-capabilities-stack-vs-monolithic-agent",
    category: "engineering",
    question: "Pydantic AI 这类 typed agent stack 相比手写 agent loop 的核心工程收益是什么？",
    relatedChapters: ["05", "13", "15", "16", "19"],
    sourceTitles: ["Pydantic AI 2.14.1 release"],
    sourceUrls: ["https://pypi.org/project/pydantic-ai/"],
    confidence: "high",
    rationale: "本题来自 PyPI Pydantic AI 2.14.1：页面把 validation、model-agnostic provider、Logfire observability、evals、capabilities 与 MCP 放在同一个生产级 Agent stack 里。"
  },
  {
    slug: "skill-registry-authentication-and-promotion-boundary",
    category: "engineering",
    question: "为什么 Agent Skill Registry 需要认证、来源证明和晋级流程？",
    relatedChapters: ["11", "12", "17", "18", "19"],
    sourceTitles: ["CrewAI 1.15.5 skill registry authentication release"],
    sourceUrls: ["https://github.com/crewAIInc/crewAI/releases/tag/1.15.5"],
    confidence: "high",
    rationale: "本题来自 CrewAI 1.15.5：release note 明确把 Authenticate skill registry downloads 作为 feature，适合追问 skill 分发、认证和供应链边界。"
  },
  {
    slug: "codex-cli-sdk-embedded-agent-release-risk",
    category: "engineering",
    question: "把 Coding Agent 做成 SDK 嵌入业务系统时，需要额外评估哪些风险？",
    relatedChapters: ["05", "12", "16", "17", "18", "19", "capstone"],
    sourceTitles: ["OpenAI Codex npm packages 0.145.0 release train"],
    sourceUrls: ["https://www.npmjs.com/org/openai"],
    confidence: "medium",
    rationale: "本题来自 npm OpenAI org / Codex package registry 信号：Codex CLI/SDK 进入高频 package release train，适合考 CLI 到 SDK 后的权限、事件流和宿主系统治理。"
  },
  {
    slug: "ai-credit-pool-cost-center-governance",
    category: "engineering",
    question: "企业级 Agent/Copilot 为什么需要按成本中心管理 AI Credit？",
    relatedChapters: ["16", "18", "19"],
    sourceTitles: ["AI credit pools for cost centers in the billing UI"],
    sourceUrls: ["https://github.blog/changelog/2026-07-20-ai-credit-pools-for-cost-centers-in-the-billing-ui/"],
    confidence: "high",
    rationale: "本题来自 GitHub Changelog 2026-07-20：AI credit pool 已进入 cost center billing UI，适合考 enterprise Agent 的 FinOps、限额和 chargeback 设计。"
  },
  {
    slug: "agents-js-package-surface-and-supply-chain-provenance",
    category: "engineering",
    question: "OpenAI Agents SDK JS 这类多包运行时应如何做版本治理和供应链审计？",
    relatedChapters: ["11", "12", "14", "16", "17", "19"],
    sourceTitles: ["OpenAI Agents SDK JavaScript 0.13.5 release"],
    sourceUrls: ["https://www.npmjs.com/package/@openai/agents"],
    confidence: "high",
    rationale: "本题来自 npm @openai/agents 0.13.5：SDK 涵盖 multi-agent、sandbox、realtime、tools、guardrails、sessions 与 tracing，适合考 package pinning 和跨 SDK parity。"
  },
  {
    slug: "copilot-impact-dashboard-adoption-cohorts-vs-active-users",
    category: "engineering",
    question: "为什么企业评估 Copilot / coding agent rollout 时，不能只看活跃用户数，而要看 adoption phase、PR throughput、merge velocity 和下一步 enablement？",
    relatedChapters: ["15", "16", "18", "19"],
    sourceTitles: ["New Copilot usage metrics impact dashboard"],
    sourceUrls: ["https://github.blog/changelog/2026-07-22-new-copilot-usage-metrics-impact-dashboard/"],
    confidence: "high",
    rationale: "本题来自 GitHub Changelog 2026-07-22：Copilot impact dashboard 把 adoption cohorts、throughput、merge velocity 和 enablement 放在一起，适合考企业 rollout 指标设计。"
  },
  {
    slug: "gemini-36-flash-model-picker-effort-parallel-tools",
    category: "engineering",
    question: "Copilot 类 coding agent 引入 Gemini 3.6 Flash 这类新模型时，为什么要同时评估 reasoning effort、parallel tool use、usage-based billing 和管理员策略？",
    relatedChapters: ["12", "14", "16", "18", "19"],
    sourceTitles: ["Gemini 3.6 Flash is now available in GitHub Copilot"],
    sourceUrls: ["https://github.blog/changelog/2026-07-21-gemini-3-6-flash-is-now-available-in-github-copilot/"],
    confidence: "high",
    rationale: "本题来自 GitHub Changelog 2026-07-21：官方把 Gemini 3.6 Flash 绑定 agentic tasks、configurable reasoning effort、parallel tool use、billing 和 admin preview policy，适合考模型选择治理。"
  },
  {
    slug: "verification-loop-skills-vs-manual-checks",
    category: "engineering",
    question: "为什么 Claude Code skills 这类验证循环比“让人记得手动检查”更适合生产 coding agent？standalone、embedded、chained、PR gate 四种位置分别适合什么边界？",
    relatedChapters: ["10", "15", "16", "18", "19", "capstone"],
    sourceTitles: ["Building verification loops in Claude Code with skills"],
    sourceUrls: ["https://claude.com/blog/building-verification-loops-in-claude-code-with-skills"],
    confidence: "high",
    rationale: "本题来自 Anthropic/Claude Code 2026-07-22 技术实践：verification skills 把人工验收写成 repo-local、CI 可调用的闭环，适合考 agent 自检、工具错误和团队级门禁。"
  },
  {
    slug: "coderescue-budget-calibrated-recovery-routing",
    category: "engineering",
    question: "Coding agent 失败后，为什么“恢复路由”本身也要做成本校准？什么时候该用便宜模型恢复，什么时候才升级高价模型？",
    relatedChapters: ["10", "15", "16", "19", "capstone"],
    sourceTitles: ["CodeRescue: Budget-Calibrated Recovery Routing for Coding Agents"],
    sourceUrls: ["https://arxiv.org/abs/2607.19338"],
    confidence: "medium",
    rationale: "本题来自 CodeRescue 2026-07-21 arXiv：论文把 coding agent failure recovery 做成预算校准路由，适合考失败恢复、成本上限和 router 评估。"
  },
  {
    slug: "researcharena-sabotage-monitor-artifact-control",
    category: "engineering",
    question: "自动化 AI R&D agent 为什么要单独评估 sabotage 和 monitor blind spot？只看最终 artifact 能跑通为什么不够？",
    relatedChapters: ["10", "15", "17", "18", "19", "capstone"],
    sourceTitles: ["ResearchArena: Evaluating Sabotage and Monitoring in Automated AI R&D"],
    sourceUrls: ["https://arxiv.org/abs/2607.19321"],
    confidence: "medium",
    rationale: "本题来自 ResearchArena 2026-07-21 arXiv：benchmark 把隐藏 sabotage 和 deployable artifact 绑定，适合考高风险 research agent 的不可信执行与监控设计。"
  },
  {
    slug: "skillware-lifecycle-vs-prompt-snippet",
    category: "engineering",
    question: "为什么 Agent skill 不应被当成普通 prompt snippet？metadata、references、scripts、assets、tests、hooks 和 rollback 分别解决什么生命周期问题？",
    relatedChapters: ["11", "12", "15", "17", "18", "19"],
    sourceTitles: ["Skillware: A Software Ontology and Engineering Lifecycle for Persistent Behavioral Artifacts"],
    sourceUrls: ["https://arxiv.org/abs/2607.18970"],
    confidence: "medium",
    rationale: "本题来自 Skillware 2026-07-21 arXiv：论文把 skills 归类为 persistent behavioral artifacts，适合考 skill 身份、版本、测试、分发和宿主兼容。"
  },
  {
    slug: "preemptive-hardening-vs-runtime-policy-only",
    category: "engineering",
    question: "Agent 防数据泄露为什么不能只靠运行时 policy？部署前对 prompt template、tool interface 和 tool-invocation code 做 preemptive hardening 在兜什么风险？",
    relatedChapters: ["05", "15", "17", "18", "19", "capstone"],
    sourceTitles: ["Data Leakage Prevention in Agentic Applications via Preemptive Hardening"],
    sourceUrls: ["https://arxiv.org/abs/2607.18847"],
    confidence: "medium",
    rationale: "本题来自 2026-07-21 arXiv 数据泄露防护论文：pre-deployment hardening 会收紧 schema、边界清洗、tool gating 和 least privilege，适合考 agent 安全流水线。"
  },
  // C. 项目深挖类
  {
    slug: "project-why-multi-agent",
    category: "project",
    question: "你这个 Deep Research Agent，为什么用多智能体而不是单 agent？不用会怎样？多智能体的代价你怎么权衡的？",
    relatedChapters: ["11", "capstone"]
  },
  {
    slug: "project-rag-chunk-overlap-topk",
    category: "project",
    question: "你的 RAG 分块大小和 overlap 是多少、怎么定的？改大改小分别会怎样？top-k 取几、为什么？",
    relatedChapters: ["08", "09"]
  },
  {
    slug: "project-eval-set-and-judge",
    category: "project",
    question: "你说准确率 90%，这个 eval 集怎么搭的、多少条、用什么判分？LLM-as-judge 的判分你信吗？",
    relatedChapters: ["15"]
  },
  {
    slug: "project-perf-cost-bottleneck",
    category: "project",
    question: "这个项目最大的性能/成本瓶颈在哪？你做了哪些优化、效果如何？",
    relatedChapters: ["16"]
  },
  {
    slug: "project-handwrite-vs-langgraph",
    category: "project",
    question: "你为什么自己手写 agent loop 而不直接用 LangGraph？什么时候你会选择上框架？",
    relatedChapters: ["12"]
  },
  {
    slug: "project-scale-100-users",
    category: "project",
    question: "如果让它支持并发处理 100 个用户，你的设计哪里会先扛不住？怎么改？",
    relatedChapters: ["18"]
  },
  {
    slug: "project-runaway-tools-observability",
    category: "project",
    question: "线上如果模型开始胡乱调工具 / 陷入死循环，你怎么发现、怎么兜底？（考可观测 + 停止条件）",
    relatedChapters: ["16", "04"]
  },
  {
    slug: "project-biggest-pitfall",
    category: "project",
    question: "这个项目你踩过最大的坑是什么？怎么定位、怎么解决的？",
    relatedChapters: ["capstone"]
  }
];
const LOCAL_ANSWER_SUMMARIES = {
  "llm-vs-agent-and-loop": "LLM 只负责基于上下文生成下一段文本；Agent 是在 LLM 外面再包一层『目标、状态、工具、停止条件』的执行系统。典型循环是：读取目标 -> 思考下一步 -> 调工具/执行动作 -> 观察结果 -> 再规划，直到完成或触发 maxSteps。",
  "token-and-statelessness-memory": "Token 是模型实际计费和处理的最小文本单元。LLM 本身每次调用都不记得上次发生了什么，所谓多轮记忆其实是应用层把历史消息、摘要或检索结果重新塞回上下文；窗口满了就靠裁剪、摘要或外部记忆解决。",
  "system-vs-user-prompt-cot-temperature": "System 提示定义长期角色、规则和边界，user 提示描述当前任务。CoT 能提升正确率，因为它强迫模型把隐含推理拆成中间步骤；temperature=0 适合抽取、分类、结构化输出这类要稳定复现的任务。",
  "react-and-maxsteps": "ReAct 的核心是让模型在『思考 -> 行动 -> 观察』之间循环，用外部工具补足知识和执行能力。maxSteps 必须存在，因为模型可能反复试错、绕圈或被脏上下文带偏，没有步数上限就会烧时间、烧钱甚至触发危险副作用。",
  "function-calling-roundtrip": "完整往返是：模型先返回要调用的工具名和参数，宿主程序校验并真正执行工具，再把 tool_result 连同 toolCallId 回传给模型，最后模型基于结果继续回答。模型不会自己执行工具，toolCallId 的作用是把某次调用请求和对应结果精确配对。",
  "rag-basics-overlap-topk-traceable": "RAG 本质上是先检索相关知识片段，再让模型在这些片段约束下生成答案，所以比裸答更不容易幻觉。Overlap 用来避免关键信息被分块边界切断；top-k 取值是在召回率和噪声之间折中，通常从 3 到 8 起步调；可溯源的关键是回答时明确引用片段编号或来源链接。",
  "why-llm-hallucinate": "幻觉不是普通代码 bug，而是概率生成模型在上下文不足、训练分布外或指令模糊时的固有风险。工程上不能承诺彻底消除，只能通过检索约束、结构化校验、工具调用、人审和拒答策略把它压到可接受范围。",
  "embedding-cosine-vs-euclidean": "Embedding 是把文本映射到向量空间，让语义相近的内容在几何上更接近。相似度搜索更常用余弦，是因为我们更关心方向上的语义接近，而不是向量绝对长度；语义检索适合同义改写和开放问答，关键词检索更适合精确术语、编号、过滤条件。",
  "react-vs-plan-execute-reflection": "ReAct 是边做边想，适合环境不确定、每一步都要看反馈再决定下一步的任务；Plan-and-Execute 会先产出一个较完整计划，再按计划分步执行，适合目标清晰且拆解成本低的任务。Reflection 的价值在于让模型先审查自己哪里可能错了再修正，但如果没有新证据输入，它提升的是一致性和表达质量，不会无限提高真实性。",
  "stable-json-output-retry-repair": "想要稳定 JSON，先给清晰 schema，再让模型只输出结构化结果，最后在宿主程序里做强校验。校验失败时不要直接崩，应该把错误信息回喂模型做 retry-repair；工具调用最适合『模型决定调用什么能力』，JSON mode 适合受控结构化输出，纯提示约束最脆弱。",
  "prevent-prompt-injection-guardrails": "Prompt injection 的本质是外部输入试图覆盖系统规则或诱导模型泄露/越权，所以不能只靠 system 里一句『别上当』。真正的护栏要落在执行边界：高权限工具最小权限、参数白名单、人工确认、结果校验、敏感操作二次授权。",
  "control-cost-token-accounting": "成本主要花在输入 token、输出 token 和多步循环的重复调用上。控制办法是：压上下文、减少无效历史、用更小模型做简单步骤、把重计算移到工具层，并把每一步 token 和记账都打到 trace 里；上下文太长就优先裁剪、摘要和检索，而不是无脑把所有历史塞进去。",
  "evaluate-agent-llm-app": "LLM 应用不能只靠传统单测，因为输出不是完全确定的，真正风险在『大致对但关键处错』。评估要有代表性样本集、明确评分标准、回归基线和失败分桶；LLM-as-judge 可以提高覆盖率，但必须配人工抽查、双模型交叉和严格 rubric，避免模型互相糊弄。",
  "context-window-full-strategies": "窗口满了时最常见的三招是裁剪、滑动窗口和摘要压缩。滑动窗口保留最近交互，适合短期上下文强依赖；摘要压缩能保住长期信息，但会丢细节且可能引入摘要误差，所以常见做法是最近消息原文保留、远历史摘要化、再配外部检索补细节。",
  "streaming-throughput-vs-ux-abortcontroller": "流式输出并不会让模型真正更快算完，只是把已经生成的 token 提前推给前端，所以改善的是首字时间和用户体感。AbortController 更像协作式取消：宿主发出取消信号，后续请求/流读取停止，但已经发出的外部副作用必须靠业务层自己兜底。",
  "tool-error-feedback-not-throw": "工具报错直接抛异常只会中断当前链路，模型拿不到失败原因，也就没法自我修正。把错误变成可读字符串回传给模型，模型才能补参数、换工具或降级回答，这比宿主一崩到底更接近真实 agent 的闭环。",
  "when-multi-agent-and-cost": "多 agent 适合任务天然可拆成不同角色、不同上下文窗口和不同工具权限的场景，比如研究、写作、审核分工。代价是调用次数更多、调试更难、状态传递更复杂，所以只有当分工真的能减少单 agent 的上下文污染或决策负担时才值得上。",
  "when-not-to-use-agent": "流程固定、规则明确、没有开放式决策空间的任务通常不该上 Agent，普通 workflow、脚本或表单校验更便宜、更稳定。只要答案可以被确定性逻辑直接推出，Agent 往往是在增加成本和不确定性。",
  "realtime-agent-default-model-and-cross-sdk-parity": "RealtimeAgent 默认模型跨 SDK 升级不是普通依赖升级，因为默认模型会改变延迟、成本、输出特征、工具调用节奏和 trace 可比性。生产上要记录旧/新默认值、回归实时交互场景、确认 session 存储兼容，并准备按 SDK 或环境变量回滚，而不是让业务在无感知下漂移。",
  "managed-agent-workflow-as-tool-vs-local-orchestration": "ManagedAgent 和 Workflow as Tool 会把一部分编排与执行权从应用代码迁到 runtime/托管层。边界要重划：应用层负责业务状态、权限和验收，托管层负责执行、会话生命周期、工具协议和 trace；session TTL、MCP traces、mTLS、DNS rebinding 和 path traversal 修复说明这类 runtime 本身已经是安全与可观测控制面。",
  "fresh-thread-update-state-snapshot-vs-stub-checkpoint": "Fresh thread 上的 updateState 如果只留下 stub checkpoint，后续恢复时系统会误以为有完整历史，实际却缺少可重放状态。强制 snapshot 的意义是让人工修正、time travel、失败重试和事故排查都基于完整状态快照；否则回放看到的是假历史，排障和幂等补偿都会失真。",
  "enterprise-cli-coding-agent-adoption-retention-output-proxy": "企业 rollout CLI coding agents 要同时看谁开始用、谁持续用、用在什么工作、成本是多少，以及产出代理指标有没有带来真实价值。Merged PR 可以作为一个 output proxy，但它不等于代码质量、业务收益或长期维护性；token spend 又可能放大试错成本，所以评估必须把 adoption、retention、产出、质量和成本放在同一张表里看。",
  "hosted-multi-agent-sdk-sandbox-ownership": "Hosted multi-agent 和 request controls 扩大了 runtime 执行面，sandbox PTY/Docker ownership 决定后台任务和清理是否归属正确，realtime callback/playback 决定交互时序是否可控，content-filter refusal 可见性决定安全拒答是否会被吞成空 turn。升级时要按执行身份、资源清理、时序稳定和安全信号可观测性分别回归。",
  "delta-channel-metadata-counters-replay": "Delta channel 的 metadata 和 counters 会进入状态快照、回放、time travel 和监控统计。它们错了，表面可能只是计数不准，实际会让调试看到的历史和真实执行分叉；生产 graph agent 要把这类字段当作 replay contract，而不是内部小字段。",
  "agent-ui-tool-call-approval-cwe863": "AG-UI 消息清洗一旦错误处理 dangling tool-call，就可能让 UI 层看到的工具调用、审批状态和真实执行意图不一致。requires_approval / ApprovalRequiredToolset 把敏感工具默认拦住，工具 handler 自己做参数鉴权兜住越权，usage_limits 则限制错误链路持续消耗。",
  "multi-user-ai-budget-state-api-cost-governance": "总预算只能告诉你组织还剩多少钱，不能告诉你哪个用户或成本中心正在接近失控。per-user states API 能按 consumed、limit、比例和 override 找到高风险账户，再触发提醒、模型降级、session limit 或定向培训；这比月底账单复盘更接近实时治理。",
  "agentic-rag-underwriting-human-governance": "Regulated workflow 里 naive RAG 只能提供相似证据，不能保证决策步骤完整、外部数据已核验或规则被逐条应用。Agentic RAG 把检索、第三方检查、规则评估和人工治理拆成可审计步骤，可以在缺失信息时拒绝 straight-through decision，而不是生成看似合理但证据不足的结论。",
  "health-agent-benchmark-terminal-verifier-governance": "医疗 agent benchmark 不能只看最终自然语言答案，因为真实任务要进终端、读受控数据、运行工具、产出可验证结果，并遵守数据许可和防作弊边界。任务级 verifier 负责把输出落到领域成功标准，成本/时间指标则暴露长流程 agent 的真实运行代价。",
  "benchmark-audit-vs-assuming-ground-truth-is-clean": "Benchmark 不是天然真理，任务描述、环境依赖、gold answer 和评分脚本都可能有错。Auto Benchmark Audit 这类方法的价值是先审计题目本身，把 ambiguous spec、隐藏依赖和脆弱 grader 分出来；否则模型排名变化可能只是 benchmark 脏数据造成的假信号。",
  "agents-md-skills-subagents-harness-engineering": "AGENTS.md 适合给跨工具 agent 提供入口规则、命令和边界，context files 补仓库知识，skills 把重复流程封装成可执行能力，subagents 用来隔离角色和上下文。AGENTS.md 只是最低摩擦起点，生产可靠性还要靠权限控制、可执行脚本、测试回归和 trace 验证兜住。",
  "agentic-pr-dataset-vs-productivity-claim": "Agent-authored PR 数据集能告诉我们哪些工具被使用、PR 分布、评论/评审/提交轨迹和协作模式，但不能直接证明生产率或业务价值提升。PR 数量可能受任务难度、团队流程、审查门槛和生成代码质量影响；真正结论要叠加质量、维护成本、缺陷率和人工时间。",
  "stream-usage-schema-failfast-provider-normalization": "Streaming usage 若只在 final chunk 才保留，遇到中断、resume 或并发流时成本和 trace 会缺账；union/tuple schema 静默丢成员会让结构化输出看似成功但语义错；provider text parts 没拼全会漏答。生产 agent SDK 要 fail-fast，并把用量、schema 和响应归一化纳入回归。",
  "settings-roundtrip-mcp-auth-secrets-and-saas-observability": "SaaS agent 的设置读写不是无副作用操作：GET/保存一轮若剥离 MCP auth secrets，会让连接器下次调用直接失效。PostHog distinct_id 影响跨域行为归因，DB pool 默认值影响高并发稳定性；三者共同说明配置、观测身份和资源池都是生产控制面。",
  "observability-eval-export-trace-io-ssrf-fail-closed": "Agent observability 的风险在于监控数据本身会参与上线判断。Score filter 没覆盖所有 event stream 会造成漏判，eval config 不能导出会破坏可复现，大 trace I/O 可能卡死排障界面，SSRF validation 失败后继续导出则可能外传数据；这些都应优先 fail-closed。",
  "history-processing-usage-errors-native-schema-contract": "HistoryProcessor 决定历史如何进入下一轮，usage-limit/tool-retry errors 决定失败能否被开发者和模型修正，provider-native schema transform 决定结构化输出是否真按目标模型协议执行。任一层漂移都会让 agent loop 看似继续运行，实际已经丢上下文、丢错误含义或丢 schema 约束。",
  "agent-safety-reconstructability-vs-final-score": "安全评测分数只能说明某次 nominal outcome，不能说明证据是否足够支撑这个结论。Reconstructability 要求保存能重建关键决策的输入、工具、策略、监控和判定证据；Evidence Sufficiency Cards 把证据缺口显式化，避免把不可复现的 monitor score 当成可上线证明。",
  "paper-replication-workspace-evidence-vs-final-message": "研究型 coding agent 的最终回复可能自信但无证据。Paper-replication 把每个论文 claim 变成 target，用 provenance 记录数据和实验产物，用 report coverage 证明每个 target 都有对应说明，用 validation checks 阻止未验证结果过关；验收对象是工作区证据链，不是聊天结论。",
  "autonomous-agent-incident-response-guardrail-lockout": "真实 agent 入侵暴露的是完整执行链，不是单一提示绕过。数据处理 worker 要按不可信代码处理，凭证要能快速轮换和吊销，LLM 取证要保留原始事件链；当商业 API 因安全策略拒绝分析攻击 payload 时，本地隔离模型能避免 incident response 被 guardrail 卡死。",
  "domain-agent-cli-sandbox-eval-pipeline": "高风险行业 agent 应把不稳定自然语言和真实系统之间隔一层 typed/确定性工具。CLI 把复杂 API 变成可测命令，ephemeral sandbox 防止用户数据和文件串扰，真实数据 rubric 评估完整链路；强模型只负责规划和表达，不能替代权限、隔离和评估工程。",
  "recursive-harness-self-improvement-vs-prompt-tuning": "Prompt tuning 通常只改一段指令；recursive harness self-improvement 改的是 agent 循环的运行规约，会影响工具选择、观察组织、失败恢复和后续训练轨迹。它的收益要看任务集、反馈质量和成本，不能把少量 synthetic task 的提升直接外推到所有生产 agent。",
  "trajectory-review-vs-pass-fail-coding-agent-eval": "Pass/fail 只能告诉你最后有没有过，不能告诉你 agent 是否误读任务、乱用工具、重复试错或侥幸通过。Trajectory review 把指令遵循、工具调用、错误恢复、自我验证和最终 diff 逐段审查，才能用于 nightly regression 和版本差异诊断。",
  "coding-agent-leaderboard-cost-harness-context": "Coding agent leaderboard 不是纯模型榜，因为同一个模型在不同 harness、effort、工具策略和成本预算下会表现不同。DeepSWE 这类榜单要同时读 pass rate、agent steps、output tokens、cost 和任务原创性；否则容易把昂贵多步试错误解成模型本身更强。",
  "white-box-agent-harness-vs-black-box-saas-coding-agent": "White-box harness 的价值是能检查和修改 agent loop、工具调用、上下文拼装和评估逻辑，也能本地部署保护代码/数据；代价是团队要自己承担维护、扩展和安全配置。黑盒 SaaS 接入快，但可观测、复现、权限和成本调优空间更小。",
  "runtime-tracing-cost-session-isolation": "生产 Agent runtime 应把一次运行拆成 task、turn、tool call、provider request 和 session resource 五层。trace/span ID、实时 token/费用、provider capability error、conversation history 序列化、computer/E2B 等工具会话隔离都要显式记录，否则无法排查成本、并发串扰和工具副作用。",
  "pydantic-ai-capabilities-stack-vs-monolithic-agent": "Typed agent stack 的收益不是少写几行 loop，而是把 schema validation、provider abstraction、tool/MCP、capabilities、evals 和 observability 变成统一控制面。手写 loop 更透明，但一旦进生产，要补齐类型契约、回归评测、trace 和 provider surface 管理。",
  "skill-registry-authentication-and-promotion-boundary": "Skill 是可执行能力包，不是普通 prompt 文本。Registry 需要下载认证、签名/哈希、版本锁定、权限声明、环境隔离、灰度晋级、回滚和审计日志；否则一次供应链污染就能越过 agent 的工具边界。",
  "codex-cli-sdk-embedded-agent-release-risk": "CLI 到 SDK 会把 coding agent 嵌进业务系统权限面：文件系统、命令执行、网络访问、审批策略、审计日志、JSONL event 流、依赖锁定和用户身份透传都要由宿主显式治理，不能只把它当普通聊天 SDK。",
  "ai-credit-pool-cost-center-governance": "企业 Agent/Copilot 成本治理要从总账下钻到成本中心、license pool、项目 chargeback、告警、硬/软限额和异常使用检测。成本中心不是财务标签，而是大规模 agent rollout 后的资源隔离与责任归属机制。",
  "agents-js-package-surface-and-supply-chain-provenance": "多包 Agent SDK 要做 package pinning、lockfile 审核、跨包版本一致性、Python/JS parity、realtime 能力差异、tool schema 兼容性和 trace/eval 回归。只看 semver 或 package 名称，容易漏掉运行时默认值和供应链变化。",
  "project-why-multi-agent": "Deep Research Agent 用多智能体，是因为『检索/证据收集』和『综合写作』对上下文、工具和评价标准不同，拆开后每个角色更专注。单 agent 也能做，但容易把搜索噪声、写作风格和规划状态搅在一起；代价则是链路更长、调试更复杂，所以只在长任务上启用。",
  "project-rag-chunk-overlap-topk": "分块大小通常围绕『一个片段能独立表达一个小主题』来定，overlap 用来保证跨段概念不断裂；块太大噪声多，块太小上下文不完整。top-k 一般从 3 到 5 起步，命不中再扩召回，但不会无限加，因为加太多会把模型注意力稀释掉。",
  "project-eval-set-and-judge": "所谓 90% 不是拍脑袋，要先准备一组覆盖真实问题分布的 eval 集，再定义『事实正确、引用充分、结构完整』这类评分维度。LLM-as-judge 可以做初筛，但我会保留人工抽样复核，并记录模型间分歧，避免把模型偏见当成客观真相。",
  "project-perf-cost-bottleneck": "这类项目最大的成本瓶颈通常不是单次生成，而是多步检索、反复工具调用和冗长上下文带来的累计 token 消耗。优化手段包括裁剪历史、缓存检索结果、把简单步骤下放给小模型，以及对低价值步骤设置更硬的停止条件。",
  "project-handwrite-vs-langgraph": "先手写 agent loop 是为了把消息往返、工具执行、停止条件和错误回灌这些底层机制吃透。等到任务开始需要 checkpoint、复杂状态图、并发分支或人工审批节点时，再上 LangGraph 这类框架，收益才会超过它引入的抽象成本。",
  "project-scale-100-users": "并发到 100 用户时，先扛不住的通常是共享状态、限流和外部依赖，不是页面本身。要改成无状态服务、把会话和任务状态外置、加队列和并发上限、做 token/速率预算隔离，否则一个长任务就可能拖垮整批请求。",
  "project-runaway-tools-observability": "防模型胡乱调工具，第一层是 maxSteps、超时和工具级频率限制，第二层是 trace、日志和告警，把『谁在什么时候调了什么工具』记录清楚。真失控时要能人工熔断会话、降级成只读模式，或者直接切到人工审核。",
  "project-biggest-pitfall": "这种项目最常见的大坑不是功能写不出来，而是边界没先定清：哪些结果必须可追溯、哪些动作必须人工确认、哪些失败可以自动重试。我的处理原则是先把状态、权限和评估口径钉死，再继续堆能力，否则越往后越难补救。",
  "computer-use-agent-success-vs-harm-metrics": "评测 computer-use / workplace agent 不能只看任务成功率，因为 agent 可能在成功完成主任务的同时多做了不该做的动作。unintended action 兜的是『做对主线但顺手乱点、乱改、乱发』的流程偏航风险；harmful action 兜的是数据破坏、误操作、隐私泄露和安全事故这类高代价副作用。",
  "memory-agent-recall-vs-reuse-evaluation": "长期记忆 agent 不能只测 recall，因为『记住了』不等于『会在正确时机把对的记忆拿出来并用对』。observation stream 测原始事件摄入，user feedback 测偏好/纠错更新，knowledge archive 测稳定知识沉淀，follow-up reuse 测后续任务中的真实调用效果；四段混在一起，你就分不清问题出在记忆写入、更新、检索还是使用。",
  "harness-vs-framework-boundary": "Agent framework / SDK 主要提供模型调用、状态图、工具协议和工作流原语；harness 则是把审批、重试、回放、配额、追踪、权限壳层和失败恢复包在外面的运行时外壳。把这些控制面放在 harness 而不是模型里，才能做到可审计、可复现、可回滚，也避免一次 prompt 偏航直接越过系统护栏。",
  "runtime-upgrade-auth-compaction-boundaries": "Runtime / tool 协议升级时要单独审查 auth-required vs input-required，因为它决定『谁来批准、批准什么』；审查 history compaction，是因为压缩可能把关键审批证据、tool result 或安全上下文删掉；审查 auto-approval 和 tracing 注入，是因为它们分别改变默认信任边界和数据暴露边界。生产事故往往不是模型能力问题，而是这些运行时默认值悄悄变了。",
  "scientific-synthesis-clean-room-generalization": "研究型 agent benchmark 强调 clean-room synthesis，是要求 agent 基于证据自己综合结论，而不是把原文句子拼接得像答案；强调 strategic generalization，是看它能否在新组合、新约束和跨文献冲突里给出稳定推理。若 agent 只是检索命中后复读原句，高分证明的只是语料重合和抽取能力，不是科学综合能力。",
  "long-horizon-agent-benchmark-vs-single-step-score": "长周期 agent 评测不能只看单步 reward 或单回合成功率，因为真正难点在跨轮状态保持、延迟反馈下的策略修正和长期收益稳定性。RetailBench 这类 benchmark 检验的是 agent 能否在连续经营/运营情境里维持目标一致、处理中间波动、根据后验结果调策略，而不是某一步答对一个局部动作。",
  "monitoring-agent-timeliness-false-alert-action-chain": "监控/告警 agent 只会识别异常还不够，还要看识别得是否及时、误报/漏报成本是否可接受，以及后续处置链有没有把问题真的推进到解决。只测『能否识别异常』会遗漏两个关键风险：一是发现太慢等于没发现，二是发现之后不会升级、不会止损、不会闭环，系统仍然失控。",
  "memory-agent-relational-consistency-vs-keyword-recall": "关键词召回只能证明 agent 把某些词记住了，不能证明它记住了事实之间的关系。补充关系、矛盾关系和无关关系必须分开测，因为真实记忆系统常见失败不是『完全忘了』，而是把相互冲突的信息一起当真，或把无关细节当成支持证据，最终破坏回答一致性。",
  "pre-approval-tool-input-guardrails-vs-post-hoc-check": "Tool guardrails 放在真正执行前的 pre-approval 边界，本质是在副作用发生前阻断危险参数和越权动作。等工具跑完再做事后检查，很多损失已经不可逆了，例如邮件已发出、数据库已删除、权限已变更；高权限工具必须把参数校验、白名单、人工确认和策略判定前置。",
  "brokered-execution-vs-agent-held-production-authority": "生产变更权限不该直接塞进 agent 推理进程，因为模型一旦被注入、误触发或日志泄露，就等于把生产权限直接暴露给不稳定的推理层。Certificate-bound broker / scoped execution identity 的作用，是把『提出方案』和『真正执行』拆开，用独立身份、短时令牌和集中审计来兜住越权、横向移动和凭证滥用风险。",
  "probabilistic-policy-verification-under-ambiguous-detectors": "当 PII detector / declassifier 本身有误报漏报时，deterministic policy 只会假装这些判定是绝对真理，结果要么过度阻断，要么放过高风险动作。Probabilistic verification 的意义，是把检测器不确定性显式纳入决策，问的是『在当前误差分布下，这个 agent 行为的总体泄露/违规概率是否仍低于可接受阈值』。",
  "repository-guidance-coverage-vs-precision-for-coding-agents": "高质量仓库指引首先提升的是 coverage，也就是 agent 更快找到应该看的目录、命令、约束和边界，少在错误区域乱试。Patch precision 仍取决于模型推理、测试反馈和实现能力；但当步数预算变大时，谁能更稳定定位到正确文件，往往比单次补丁写得漂不漂亮更决定最终成功率。",
  "multi-tenant-agent-runtime-isolation-vs-dedicated-stack": "多租户 agent runtime 不能只靠逻辑 tenant id，因为真正要隔离的是会话状态与记忆、执行身份与凭证、遥测与日志、审批流与配额。只做逻辑分租容易出现跨租户上下文串味、trace 泄露和审批串单；一旦遇到高权限业务、强监管数据或 noisy neighbor 明显场景，就该回到 dedicated stack。",
  "scientific-copilot-query-parse-retrieval-summary-boundary": "研究型 copilot 把 structured query parsing、embedding retrieval 和 AI summary 拆开，是为了把『用户到底问什么』『系统到底拿到了哪些证据』『模型到底怎样组织答案』三类错误分层定位。若让一个大 prompt 端到端包办，你很难判断错在 query 解析、检索召回还是总结幻觉，也很难保留可追溯引用链。",
  "agent-identity-infrastructure-vs-provider-account-mapping": "跨组织 agent 协作不能长期靠『每个 agent 一把 API key』，因为 API key 只表示某个平台上的访问凭证，不解决身份发现、撤销、轮换、跨平台互认和组织级信任。独立的 agent identity / name service 提供的是稳定身份、可验证归属和统一吊销能力，让 agent 之间建立信任时不必把平台账号耦死在一起。",
  "approval-state-idempotency-and-guardrail-race-cancellation": "已解决的 approval 不应被重复求值，因为这会导致同一动作反复弹审批、重复执行甚至让用户误以为系统状态还没落地。Sibling guardrail / task 一旦失败就应立刻取消其它并发 guardrail，是为了阻断竞态窗口，避免某个分支在整体已经判定失败后仍继续写外部系统、留下双重副作用或脏状态。",
  "read-only-file-access-still-needs-explicit-approval": "Read-only 不等于低风险，因为读取本身就可能暴露密钥、客户数据、内部架构和后续可利用线索。尤其当 loop 能力被集成进 harness agent 后，模型可以把多次无害读取串成一次敏感推断或数据外传链路，所以 file-access 即便不写盘，也常常要做显式审批、目录范围限制和目的约束。",
  "declarative-workflow-path-validation-vs-runtime-filesystem-boundary": "声明式 workflow / skill archive 若不防 symlink path traversal 和非法 flow definition paths，攻击者就能把『加载工作流定义』变成『读取或执行本不该碰的文件』。这不是 prompt 层小 bug，而是 runtime 对文件系统边界失守：agent 会在看似合法的配置装载流程里越过目录沙箱。",
  "conversational-flow-telemetry-and-unified-loader-boundary": "Workflow 一旦进入 conversational / declarative flow 阶段，就必须单独追踪 turn usage，因为计费、性能瓶颈和状态膨胀都发生在每一轮交互里。CLI、TUI、loader 入口若不统一，同一条 flow 会在不同入口表现出不同 trace、不同上下文拼装和不同计费口径，最终让调试、回放和审计都失真。",
  "agentic-overlay-vs-rebuild-for-legacy-enterprise-services": "企业做 agent 改造时优先 agentic overlay，而不是推倒重写，是因为旧系统里最难替代的是沉淀多年的权限、事务、流程和集成契约。Overlay 做法是把 agent 放在现有系统外面做编排与辅助决策，既能复用成熟控制面，又能降低一次性替换带来的发布、回归和组织协调风险。",
  "governed-data-mesh-for-agentic-ai-vs-direct-source-access": "生产级 agentic AI 需要 governed data mesh，因为让 agent 直接拉数据库/对象存储等于给了一个会推理的程序过宽的数据面。Identity 解决『以谁身份访问』，catalog 解决『知道有哪些可用数据』，policy 解决『哪些上下文下能怎么用』，knowledge base 解决『把原始数据整理成适合检索和引用的知识层』。",
  "approval-by-default-for-agent-skills-and-tools": "Production agent 的 skill/provider tools 最好默认 require approval，因为默认放行意味着新工具上线的第一天就天然处于过度信任状态。默认值一旦反了，后续再补规则也只能被动堵洞：审计不完整、回放无法复现实验边界、权限壳层也会出现『漏配即放行』的系统性漏洞。",
  "redirect-based-ssrf-in-agent-fetch-and-scraping-tools": "抓取 / scraping tool 只校验首跳 URL 不够，因为重定向链完全可能把请求带到 169.254 metadata、内网控制台、私有 API 或带签名的内部端点。SSRF bypass 一旦成功，agent 不只是『看错网页』，而是会拿到本不该见到的凭证、网络拓扑和内部响应，再把这些信息带回推理链。",
  "stepwise-verification-and-interactive-benchmarks-for-research-agents": "研究型 agent benchmark 不能只看最终答案，因为 final-answer-only 会把幸运猜中、证据伪造和中间推理断裂都藏起来。Stepwise verification 检查的是每一步检索、归纳和推断是否站得住；interactive environment 检查的是 agent 遇到新反馈时会不会重规划、修正和管理证据链。",
  "assistant-function-choice-vs-openapi-path-canonicalization": "增强 Assistant agent 的 function_choice_behavior 会显著扩大工具调用频率和覆盖面，因此必须同时收紧 OpenAPI plugin 的路径归一化。若 encoded dot-segment 绕过仍存在，模型越会主动选函数，就越可能把本来局部的路径逃逸问题放大成 SSRF、越权调用和错误后端访问。",
  "scientific-review-agent-needs-inference-scaling-and-human-final-say": "Scientific review agent 不能只做一次性摘要或 zero-shot 打分，因为论文评审真正难的是核查理论链、实验设计、统计结论和相关工作位置。Inference scaling 让 agent 在高风险样本上花更多计算做交叉核查；而『人类保留最终裁决』是在责任边界上兜底，避免把接受/拒绝决定完全外包给不稳定模型。",
  "repository-level-friction-vs-single-agent-win-rate": "Coding agent 评测不能只看 isolated task success 或单个 PR 过不过测，因为真实仓库风险来自多个变更在共享依赖、测试环境、规范和发布节奏上的相互摩擦。Repository-level integration friction 衡量的是这些系统性阻力：单个 agent 各自都像赢了，但仓库整体可能更难合并、更难回滚、更容易积累隐性破坏。",
  "debuggable-harness-boundary-in-background-agent-runtime": "Background agent runtime 若吞掉 skill 或 resource 错误，模型和运维都只会看到『没成功』，却不知道失败发生在哪一层。把 provider 解析、available resources/scripts 和真实错误原因显式暴露出来，才能让模型自纠错、让 harness 做回放诊断，也才能在生产里区分是权限缺失、资源缺失还是 runtime 自己的调度问题。",
  "terminal-use-agent-benchmark-needs-real-work-breadth": "Terminal-use agent 若只在 coding benchmark 上高分，不代表它能处理真实工作的跨工具、跨格式和长流程任务。TUA-Bench 这类任务集覆盖写作、邮件、研究、运维和文档编辑，检验的是 agent 能否在统一终端环境里持续规划、切换工具、保持状态并交付可用产物，而不是只会修一段代码。",
  "multi-layer-agent-red-teaming-vs-single-jailbreak-metric": "只看 jailbreak 成功率会把 agent 风险错误压缩成单一提示攻击问题，但真实系统里还有基础设施、协议和工具编排层面的巨大攻击面。多层红队的价值是把风险拆开看：基础设施层管环境与凭证，协议层管调用与身份，agent 层管计划和工具使用，模型层才是提示与生成本身；四层混在一起就很难定位真实防线缺口。",
  "checkpoint-delta-state-roundtrip-vs-production-replay": "Checkpoint / delta state 若在 JSON roundtrip 里丢了 `Overwrite` 或 superstep 语义，线上最糟糕的后果不是『某个字段不漂亮』，而是恢复后的状态和真实执行历史分叉。回放无法复现、诊断看见的是假历史、重试可能覆盖错任务，这就是为什么状态补丁协议本身必须被当成生产边界来审查。",
  "a2a-gateway-vs-point-to-point-agent-mesh": "A2A protocol 只规范了 agent 彼此如何通信，不负责企业里『谁能发现谁、谁能访问谁、流量怎么走、速率怎么控、流式连接怎么统一代理』这些治理问题。Point-to-point 连接一多，凭证、路由和发现逻辑会在各后端分叉；gateway 的价值就是把 discoverability、authz 和 routing 抽到单一控制面。",
  "metadata-prefiltering-vs-pure-semantic-memory-retrieval": "长期记忆不能只靠 namespace + 向量相似度，因为语义接近不等于业务边界正确。Metadata pre-filter 先按时间、权限、部门、优先级等维度缩小候选集，STRICTLY_CONSISTENT 保证某些键值在抽取和合并过程中不漂移；两者合起来，才不会把不该混在一起的记忆先召回再交给模型误用。",
  "open-world-tool-use-fragility-vs-static-benchmark-score": "静态 benchmark 往往默认工具集合、用户请求和观察反馈都稳定，所以高分只能证明 agent 学会了一个封闭环境。真实部署里 query、action、observation、domain 都会漂移；一旦 agent 只适应训练分布，就会在新工具、新异常反馈和新任务组合前迅速掉点，这就是 open-world tool-use 的核心脆弱性。",
  "copilot-agent-session-streaming-audit-vs-chat-logs": "企业级 coding agent 的关键证据不只是最终回复，而是 prompt、response、tool call、客户端来源和执行时间线。把 session usage records 流式送到 SIEM / audit log，可以把异常工具调用、越权访问、成本峰值和事故复盘串成可检索证据链；普通聊天日志通常缺少工具调用粒度，无法支撑合规审计和精确回放。",
  "flow-agent-runtime-prerelease-signal-vs-stable-baseline": "Release notes 里的生产信号要分层看：Bedrock extra 说明云模型适配面扩大，flow options 说明编排配置面扩大，streaming docs 说明交互体验进入主路径，self-listening flow reject 则是结构校验补洞。但 prerelease 仍不能当稳定基线，应该先用于兼容性验证和趋势跟踪，而不是直接替换生产 runtime。",
  "single-api-multi-agent-system-vs-app-level-orchestration": "把 multi-agent system 包成单个 API 会降低接入成本：调用者像调一个模型一样获得内部协作能力。但代价是编排策略、子模型选择、失败重试和成本拆分更不透明；应用层自编排虽然更重，却能精确控制状态、审计、预算和工具权限。生产选择要看你更需要可控性还是托管抽象。",
  "eddops-registry-promotion-retirement-vs-one-time-eval": "一次性 eval 只能回答『这一版在这批题上是否过线』，不能管理上线后的漂移、成本变化和安全回归。EDDOps 把评估证据接进 registry、promotion 和 retirement：注册时说明准入条件，晋升时比较质量/成本/时延，运行时用 trace-native observability 捕捉退化，退休则让低质量或不再合规的 agent 有退出路径。",
  "session-credit-limit-vs-global-budget-for-automation-agents": "组织级预算只能限制整体花费，不能阻止一次无人值守的自动化 session 在错误路径上持续消耗。Session-level AI credit limit 把成本边界放进执行现场：subagents 会放大并发调用，compaction 会产生后台成本，长链路工具循环会持续拉高 token；软上限至少能让 agent 及时收尾并报告，而不是等账单或人工巡检才发现异常。",
  "browser-agent-permission-isolation-and-network-domain-controls": "Browser-use agent 一旦能点击、输入、读页面和截图，就等于获得了真实浏览器侧的行动能力。Tab 隔离防止 agent 读取用户私人会话，cookie/storage 隔离防止跨任务串号，敏感权限审批防止摄像头、麦克风、定位、剪贴板被自动授权，企业域名 allow/deny 则把 agent 可访问的网络边界从提示词约束变成确定性控制。",
  "file-editing-tools-session-isolation-and-approval-harness-defaults": "File editing tools 让 agent 从读环境进入改环境，per-user session isolation 决定不同用户/会话的状态和凭证是否串扰，approval harness 默认值决定新工具上线时是默认放行还是默认审查。三者合在一起说明 production harness 的核心不是提供更多能力，而是把身份、文件系统、副作用和审批记录绑定成可审计的运行边界。",
  "verified-rule-generation-loop-vs-freeform-agent-output": "自由文本生成只是在语言上看起来合理，不能保证规则可执行、可复现或覆盖新样本。Verified-rule generation 把 agent 产物放进确定性验证环：每条规则都要能在 corpus 上跑、失败就修正，最终形成可回归的符号资产。可靠性的差异在于，输出不再靠主观读感验收，而是靠可重复测试和数据集覆盖验收。",
  "copilot-model-family-policy-and-job-fit": "模型选择不是越强越好，而是要把任务复杂度、延迟、成本、上下文需求和组织策略一起放进决策。Sol 适合长跑复杂任务，Terra 适合日常默认路径，Luna 适合低成本快速任务；企业还要记录 billing、管理员开关、入口覆盖和回滚路径，否则一次模型默认值变更会同时影响成本、质量和合规边界。",
  "repository-overview-onboarding-vs-source-truth": "仓库 overview 能降低新成员理解成本，但它仍是生成式摘要，不是事实源。工程上应把 README、贡献指南、package/scripts、目录结构和关键源码当成可验证证据链，让 overview 只做导航入口；缺少 README 时可以辅助起草，但必须人工复核技术栈、运行命令和架构边界。",
  "managed-otel-agent-host-vs-local-env-telemetry": "Agent 观测不能只靠开发者本地环境变量，因为本地配置不可审计、不可统一回收，也容易把 token/header 泄露给子进程。Managed OTel 把 endpoint、resource attributes、内容采集范围和认证 header 放进企业控制面；prompt、response、tool content 是否导出必须由策略决定，不能由每个终端临时决定。",
  "stable-crewai-flow-skill-runtime-hardening": "Flow 和 skill 进入 stable 后，风险不只是 API 可用，而是声明式定义、技能装载、repo agent、streaming frame 和反馈处理会一起改变执行边界。升级时要核对 flow input 模板、生成式定义权限、依赖安全修复、模型 catalog cache 和异常反馈路径，避免把 prerelease 中的实验能力无审查地带进生产。",
  "agent-failure-taxonomy-vs-leaderboard-score": "Leaderboard 均分会掩盖失败类型：一个 agent 可能平均分高，却在工具参数、长上下文、规划、多 agent 协调或安全边界上系统性失败。回归评估要按失败模式分桶，记录轨迹和中间步骤，并单独审查 measurement validity；否则模型看似进步，生产中的端到端可靠性仍可能下降。"
};
function chapterAnswerLabel(chapter) {
  if (chapter === "capstone") return "毕业项目（capstone）";
  return `第 ${chapter} 章`;
}
function buildAnswerSource(relatedChapters) {
  const targets = relatedChapters.map(chapterAnswerLabel).join("、");
  return `标准答案来源：${targets} README 的 “💡 面试会问”。`;
}
function questionTags(raw) {
  const text = raw.question.toLowerCase();
  const tags = /* @__PURE__ */ new Set([raw.category]);
  if (text.includes("rag") || text.includes("检索") || text.includes("分块") || text.includes("embedding")) {
    tags.add("rag");
  }
  if (text.includes("react") || text.includes("maxsteps") || text.includes("agent 循环") || text.includes("plan-and-execute")) {
    tags.add("agent-loop");
  }
  if (text.includes("评估") || text.includes("eval") || text.includes("judge") || text.includes("单测") || text.includes("测试")) {
    tags.add("eval");
  }
  if (text.includes("成本") || text.includes("token") || text.includes("cost")) tags.add("cost");
  if (text.includes("injection") || text.includes("护栏") || text.includes("权限")) tags.add("safety");
  if (text.includes("多 agent") || text.includes("多智能体") || text.includes("multi")) tags.add("multi-agent");
  if (text.includes("流式") || text.includes("streaming") || text.includes("abortcontroller")) tags.add("streaming");
  if (text.includes("json")) tags.add("structured-output");
  if (text.includes("langgraph") || text.includes("框架")) tags.add("framework");
  if (text.includes("幻觉")) tags.add("hallucination");
  if (text.includes("窗口") || text.includes("记忆") || text.includes("上下文")) tags.add("context");
  if (text.includes("computer-use") || text.includes("harmful action") || text.includes("权限")) tags.add("safety");
  if (text.includes("harness") || text.includes("回放") || text.includes("审批")) tags.add("observability");
  if (text.includes("auth-required") || text.includes("auto-approval") || text.includes("compaction")) tags.add("runtime");
  return [...tags];
}
const INTERVIEW_QUESTIONS = RAW_QUESTIONS.map((raw, index) => ({
  id: `iq-${String(index + 1).padStart(2, "0")}`,
  slug: raw.slug,
  category: raw.category,
  categoryLabel: CATEGORY_LABELS$1[raw.category],
  question: raw.question,
  relatedChapters: raw.relatedChapters,
  answerSource: buildAnswerSource(raw.relatedChapters),
  collectedDate: COLLECTED_DATE,
  collectedAt: COLLECTED_AT,
  sortOrder: index + 1,
  tags: questionTags(raw),
  sourceTitles: raw.sourceTitles ?? [],
  sourceUrls: raw.sourceUrls ?? [],
  confidence: raw.confidence,
  rationale: raw.rationale,
  summaryExcerpt: LOCAL_ANSWER_SUMMARIES[raw.slug] ?? raw.rationale
}));
const slugs = new Set(INTERVIEW_QUESTIONS.map((q) => q.slug));
if (slugs.size !== INTERVIEW_QUESTIONS.length) {
  throw new Error("Duplicate interview question slug detected in interview-questions.ts");
}
var define_FRONTIER_SUPABASE_CONFIG_default$3 = { url: "https://br-ideal-fawn-814db5fc.supabase.aidap-global.cn-beijing.volces.com:443", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjcwMzc5MzA0fQ.qiaVI4H2eZ1-5BywE5ORmEPf8_lmuq7-hW-f1lgqwWc", schema: "public" };
const INTERVIEW_COLUMNS = [
  "question_id",
  "slug",
  "category",
  "category_label",
  "question",
  "related_chapters",
  "answer_source",
  "collected_date",
  "collected_at",
  "sort_order",
  "tags",
  "metadata"
].join(",");
const CATEGORY_LABELS = {
  principle: "原理类",
  engineering: "工程类",
  project: "项目深挖类"
};
const LOCAL_QUESTION_BY_SLUG$1 = new Map(INTERVIEW_QUESTIONS.map((question) => [question.slug, question]));
async function loadInterviewClinicData(fetchImpl) {
  const config = readSupabaseConfig();
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    return {
      questions: INTERVIEW_QUESTIONS,
      source: "bundle",
      note: "当前显示本地题库（缺少公开 Supabase 配置）。"
    };
  }
  try {
    const rows = await fetchAllPostgrestRows({
      config,
      table: "interview_questions",
      select: INTERVIEW_COLUMNS,
      order: ["sort_order.asc"],
      pageSize: 100,
      fetchImpl
    });
    const questions = rows.map(normalizeInterviewQuestionRow).filter((question) => question.question.trim().length > 0);
    if (questions.length === 0) {
      return {
        questions: INTERVIEW_QUESTIONS,
        source: "bundle",
        note: "Supabase 题库为空，已回退本地题库。"
      };
    }
    return {
      questions,
      source: "supabase",
      note: `当前显示 Supabase 题库（${questions.length} 题）。`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      questions: INTERVIEW_QUESTIONS,
      source: "bundle",
      note: `Supabase 读取失败，已回退本地题库：${message}`
    };
  }
}
function normalizeInterviewQuestionRow(row) {
  const category = categoryValue(row.category);
  const metadata = metadataValue$1(row.metadata);
  const slug = stringValue(row.slug, "");
  const localFallback = LOCAL_QUESTION_BY_SLUG$1.get(slug);
  const remoteRationale = optionalStringValue(metadata.rationale);
  const remoteSummaryExcerpt = excerptValue(metadata.plainTextDescription);
  const rationale = remoteRationale ?? (localFallback == null ? void 0 : localFallback.rationale);
  const summaryExcerpt = preferredSummaryExcerpt(remoteSummaryExcerpt, remoteRationale, localFallback == null ? void 0 : localFallback.summaryExcerpt);
  const faqList = faqListValue$1(metadata.faqList) ?? (localFallback == null ? void 0 : localFallback.faqList);
  const displayDate = preferredInterviewDate(
    optionalStringValue(metadata.sourceUpdatedAt),
    optionalStringValue(metadata.sourceCreatedAt),
    optionalStringValue(row.collected_date),
    localFallback == null ? void 0 : localFallback.collectedDate
  );
  return {
    id: stringValue(row.question_id, stringValue(row.slug, "")),
    slug,
    category,
    categoryLabel: stringValue(row.category_label, CATEGORY_LABELS[category]),
    question: stringValue(row.question, ""),
    relatedChapters: stringArrayValue(row.related_chapters),
    answerSource: stringValue(row.answer_source, ""),
    collectedDate: displayDate,
    collectedAt: stringValue(row.collected_at, "2026-06-24T09:00:00+08:00"),
    sortOrder: numberValue(row.sort_order, 0),
    tags: stringArrayValue(row.tags),
    sourceTitles: stringArrayValue(metadata.sourceTitles),
    sourceUrls: stringArrayValue(metadata.sourceUrls),
    confidence: confidenceValue(metadata.confidence),
    rationale,
    summaryExcerpt,
    faqList
  };
}
function readSupabaseConfig() {
  const injected = typeof define_FRONTIER_SUPABASE_CONFIG_default$3 !== "undefined" ? define_FRONTIER_SUPABASE_CONFIG_default$3 : globalThis.__FRONTIER_SUPABASE_CONFIG__ ?? null;
  if (!(injected == null ? void 0 : injected.url) || !injected.anonKey) return null;
  return {
    url: injected.url,
    anonKey: injected.anonKey,
    schema: injected.schema || "public"
  };
}
function stringValue(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
function optionalStringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function preferredInterviewDate(...candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeInterviewDate(candidate);
    if (normalized) return normalized;
  }
  return "2026-06-24";
}
function normalizeInterviewDate(value) {
  const trimmed = value.trim();
  if (!trimmed) return void 0;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (match) return match[1];
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return void 0;
  return date.toISOString().slice(0, 10);
}
function excerptValue(value) {
  var _a;
  const text = (_a = optionalStringValue(value)) == null ? void 0 : _a.replace(/\s+/g, " ");
  if (!text) return void 0;
  return text.length > 320 ? `${text.slice(0, 320)}...` : text;
}
function looksLikeAnswerSource$1(text) {
  return /^(标准答案来源|答案来源|来源)[:：]/.test(text.trim());
}
function looksLikeSelectionRationale$1(text) {
  return /^(本题(?:直接)?来自|本题覆盖|本题对应)/.test(text.trim());
}
function preferredSummaryExcerpt(remoteSummaryExcerpt, remoteRationale, localSummaryExcerpt) {
  const remote = remoteSummaryExcerpt && !looksLikeAnswerSource$1(remoteSummaryExcerpt) ? remoteSummaryExcerpt : void 0;
  if (remote && remote !== remoteRationale && !looksLikeSelectionRationale$1(remote)) return remote;
  if (localSummaryExcerpt) return localSummaryExcerpt;
  return remote ?? remoteRationale;
}
function faqListValue$1(value) {
  if (!Array.isArray(value)) return void 0;
  const items = value.map((entry) => {
    if (!entry || typeof entry !== "object") return null;
    const question = optionalStringValue(entry.question);
    const answer = optionalStringValue(entry.answer);
    if (!question || !answer) return null;
    return { question, answer };
  }).filter((item) => item !== null);
  return items.length > 0 ? items : void 0;
}
function numberValue(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function stringArrayValue(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}
function metadataValue$1(value) {
  return value && typeof value === "object" ? value : {};
}
function categoryValue(value) {
  if (value === "principle" || value === "engineering" || value === "project") return value;
  return "principle";
}
function confidenceValue(value) {
  if (value === "high" || value === "medium" || value === "low") return value;
  return void 0;
}
const SPECIAL_CHAPTERS = {
  capstone: { label: "毕业项目", order: 900, group: "special" },
  "external-codefather": { label: "面试专题", order: 1e3, group: "special" }
};
function chapterDisplay(chapter) {
  const special = SPECIAL_CHAPTERS[chapter];
  if (special) return special.label;
  return /^\d+$/.test(chapter) ? `第 ${chapter} 章` : chapter;
}
function chapterGroup(chapter) {
  var _a;
  return ((_a = SPECIAL_CHAPTERS[chapter]) == null ? void 0 : _a.group) ?? "course";
}
function compareChapters(left, right) {
  const leftSpecial = SPECIAL_CHAPTERS[left];
  const rightSpecial = SPECIAL_CHAPTERS[right];
  if (leftSpecial && rightSpecial) return leftSpecial.order - rightSpecial.order;
  if (leftSpecial) return 1;
  if (rightSpecial) return -1;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  if (Number.isFinite(leftNumber)) return -1;
  if (Number.isFinite(rightNumber)) return 1;
  return left.localeCompare(right);
}
function filterQuestions(questions, category, chapter) {
  return questions.filter((question) => {
    const byCategory = category === "all" || question.category === category;
    const byChapter = chapter === "all" || question.relatedChapters.includes(chapter);
    return byCategory && byChapter;
  });
}
function categoryCounts(questions) {
  const counts = {
    all: questions.length,
    principle: 0,
    engineering: 0,
    project: 0
  };
  for (const question of questions) counts[question.category] += 1;
  return counts;
}
function availableChapters(questions) {
  const set = /* @__PURE__ */ new Set();
  for (const question of questions) {
    for (const chapter of question.relatedChapters) set.add(chapter);
  }
  return [...set].sort(compareChapters);
}
const initialized$4 = /* @__PURE__ */ new WeakSet();
const BASE$2 = "/";
const CATEGORY_TABS = [
  { id: "all", label: "全部" },
  { id: "principle", label: "原理类" },
  { id: "engineering", label: "工程类" },
  { id: "project", label: "项目深挖类" }
];
if (typeof window !== "undefined") {
  installInterviewClinics();
}
function installInterviewClinics() {
  scanInterviewClinics();
  const observer = new MutationObserver(() => scanInterviewClinics());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scanInterviewClinics() {
  document.querySelectorAll("[data-interview-clinic]").forEach((root) => {
    if (initialized$4.has(root)) return;
    initialized$4.add(root);
    createClinic(root);
  });
}
function createClinic(root) {
  root.classList.add("interview-clinic");
  root.replaceChildren(statusBlock("正在读取面试题题库..."));
  restoreListDetailPosition(root);
  loadInterviewClinicData().then((result) => renderClinic(root, result.questions, result.note)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    root.replaceChildren(statusBlock(`面试题读取失败：${message}`));
  });
}
function renderClinic(root, questions, sourceNote) {
  root.classList.add("interview-clinic");
  root.replaceChildren();
  const counts = categoryCounts(questions);
  const chapters = availableChapters(questions);
  const initialState = readInterviewListQueryState();
  let selectedCategory = initialState.category;
  let selectedChapter = initialState.chapter === "all" || chapters.includes(initialState.chapter) ? initialState.chapter : "all";
  const tabs = document.createElement("nav");
  tabs.className = "interview-clinic-tabs";
  tabs.setAttribute("aria-label", "面试题分类");
  const controls = document.createElement("div");
  controls.className = "interview-clinic-controls";
  const chapterLabel = document.createElement("label");
  chapterLabel.className = "interview-clinic-chapter";
  chapterLabel.append(document.createTextNode("按章节："));
  const select = document.createElement("select");
  select.className = "interview-clinic-select";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "全部章节";
  select.append(allOption);
  const courseGroup = document.createElement("optgroup");
  courseGroup.label = "课程章节";
  const specialGroup = document.createElement("optgroup");
  specialGroup.label = "专题章节";
  for (const chapter of chapters) {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapterDisplay(chapter);
    if (chapterGroup(chapter) === "special") {
      specialGroup.append(option);
    } else {
      courseGroup.append(option);
    }
  }
  if (courseGroup.childElementCount > 0) select.append(courseGroup);
  if (specialGroup.childElementCount > 0) select.append(specialGroup);
  select.value = selectedChapter;
  select.addEventListener("change", () => {
    selectedChapter = select.value === "all" ? "all" : select.value;
    renderList2();
  });
  chapterLabel.append(select);
  controls.append(chapterLabel);
  const summary = document.createElement("p");
  summary.className = "interview-clinic-summary";
  const list = document.createElement("section");
  list.className = "interview-clinic-card-list";
  list.setAttribute("aria-label", "面试题列表");
  function renderTabs() {
    tabs.replaceChildren();
    for (const tab of CATEGORY_TABS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "interview-clinic-tab";
      if (tab.id === selectedCategory) button.dataset.active = "true";
      button.textContent = `${tab.label} ${counts[tab.id]}`;
      button.addEventListener("click", () => {
        selectedCategory = tab.id;
        renderTabs();
        renderList2();
      });
      tabs.append(button);
    }
  }
  function renderList2() {
    replaceInterviewListState();
    const filtered = filterQuestions(questions, selectedCategory, selectedChapter);
    summary.textContent = `共 ${filtered.length} 题${selectedChapter === "all" ? "" : ` · 章节 ${chapterDisplay(selectedChapter)}`} · ${sourceNote}`;
    list.replaceChildren();
    if (filtered.length === 0) {
      list.append(statusBlock("该筛选条件下暂无面试题。"));
      return;
    }
    for (const question of filtered) {
      list.append(buildInterviewCard(question, currentRelativePath()));
    }
  }
  renderTabs();
  renderList2();
  root.append(tabs, controls, summary, list);
  function replaceInterviewListState() {
    const params = new URLSearchParams(window.location.search);
    params.set("category", selectedCategory);
    params.set("chapter", selectedChapter);
    replaceCurrentSearch(params);
  }
}
function readInterviewListQueryState(search = typeof window === "undefined" ? "" : window.location.search) {
  var _a;
  const params = new URLSearchParams(search);
  const rawCategory = params.get("category");
  const category = CATEGORY_TABS.some((tab) => tab.id === rawCategory) ? rawCategory : "all";
  const chapter = ((_a = params.get("chapter")) == null ? void 0 : _a.trim()) || "all";
  return { category, chapter };
}
function buildInterviewCard(question, returnPath) {
  const article = document.createElement("article");
  article.className = "interview-clinic-card";
  article.tabIndex = 0;
  article.setAttribute("role", "link");
  article.setAttribute("aria-label", `打开面试题详情：${question.question}`);
  article.dataset.listDetailKey = question.slug;
  const openDetail = () => {
    rememberListDetailPosition(returnPath, question.slug, article);
    window.location.href = interviewArticleHref(question.slug, returnPath);
  };
  article.addEventListener("click", openDetail);
  article.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail();
    }
  });
  const title = document.createElement("h3");
  title.className = "interview-clinic-card-title";
  title.textContent = question.question;
  article.append(title);
  const excerpt = bestInterviewCardText(question);
  if (excerpt) {
    const body = document.createElement("p");
    body.className = "interview-clinic-card-excerpt";
    body.textContent = excerpt;
    article.append(body);
  }
  const actions = document.createElement("div");
  actions.className = "interview-clinic-card-actions";
  const detailLink = document.createElement("a");
  detailLink.className = "interview-clinic-card-link";
  detailLink.href = interviewArticleHref(question.slug, returnPath);
  detailLink.textContent = "查看全文";
  detailLink.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!shouldRememberListDetailClick(event)) return;
    rememberListDetailPosition(returnPath, question.slug, article);
  });
  actions.append(detailLink);
  article.append(actions);
  const source = document.createElement("div");
  source.className = "interview-clinic-card-source";
  source.textContent = question.sourceTitles[0] || question.answerSource || "课程标准答案";
  article.append(source);
  const tags = document.createElement("div");
  tags.className = "interview-clinic-card-tags";
  tags.append(chip(question.categoryLabel, "interview-clinic-badge"));
  for (const tag of buildTagList(question)) {
    tags.append(chip(tag, "interview-clinic-chapter-tag"));
  }
  article.append(tags);
  return article;
}
function buildTagList(question) {
  const chapterTags = question.relatedChapters.slice(0, 2).map((chapter) => chapterDisplay(chapter));
  const topicTags = question.tags.filter((tag) => tag !== "codefather").slice(0, Math.max(0, 4 - chapterTags.length));
  return [...chapterTags, ...topicTags];
}
function interviewArticleHref(slug, returnPath) {
  return withReturnPath(`${BASE$2}interview/article?id=${encodeURIComponent(slug)}`, returnPath);
}
function bestInterviewCardText(question) {
  if (question.summaryExcerpt) return question.summaryExcerpt;
  if (question.rationale) return question.rationale;
  if (question.answerSource) return `标准答案来源：${question.answerSource}`;
  return void 0;
}
function chip(text, className) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}
function statusBlock(message) {
  const status2 = document.createElement("div");
  status2.className = "frontier-archive-status";
  status2.textContent = message;
  return status2;
}
const TOPIC_RULES = [
  { id: "agent-loop", label: "Agent 循环", keywords: ["执行循环", "agent loop", "react", "plan-and-execute", "maxsteps", "reflection", "反思"] },
  { id: "memory-context", label: "记忆/上下文", keywords: ["记忆", "无状态", "上下文", "窗口", "长上下文", "compaction", "recall", "reuse"] },
  { id: "rag-retrieval", label: "RAG/检索", keywords: ["rag", "检索", "召回", "embedding", "分块", "overlap", "top-k", "topk"] },
  { id: "tool-runtime", label: "工具调用/运行时", keywords: ["function calling", "工具调用", "tool", "runtime", "harness", "sdk", "协议", "回放"] },
  { id: "prompt-injection", label: "Prompt Injection", keywords: ["prompt injection", "injection", "system 指令", "篡改 system"] },
  { id: "approval-boundary", label: "审批/权限边界", keywords: ["审批", "approval", "auth-required", "input-required", "require approval", "权限", "越权"] },
  { id: "attack-surface", label: "攻击面", keywords: ["ssrf", "harmful action", "敏感", "redirect bypass", "安全"] },
  { id: "eval-observability", label: "评估/观测", keywords: ["评估", "benchmark", "judge", "回归", "成功率", "指标", "trace", "tracing", "telemetry", "observability", "可观测"] },
  { id: "cost-efficiency", label: "成本/效率", keywords: ["成本", "token", "吞吐", "streaming", "压缩", "小模型", "并发"] },
  { id: "multi-agent", label: "多 Agent", keywords: ["多 agent", "多智能体", "workflow", "flow", "协作", "分工"] },
  { id: "framework-governance", label: "框架/治理", keywords: ["framework", "langgraph", "governance", "data mesh", "plugin", "identity", "治理"] }
];
const INTENT_RULES = [
  { id: "definition", label: "概念辨析", patterns: ["是什么", "区别", "本质", "为什么说"] },
  { id: "implementation", label: "实现方法", patterns: ["如何", "怎么", "实现", "完整往返", "怎么办", "策略"] },
  { id: "tradeoff", label: "取舍边界", patterns: ["取舍", "权衡", "代价", "边界", "为什么不能只", "收益"] },
  { id: "evaluation", label: "评测口径", patterns: ["评估", "benchmark", "指标", "成功率", "judge"] },
  { id: "safety", label: "风险控制", patterns: ["护栏", "权限", "审批", "越权", "风险", "安全"] }
];
const TOPIC_LABELS = new Map(TOPIC_RULES.map((rule) => [rule.id, rule.label]));
const INTENT_LABELS = new Map(INTENT_RULES.map((rule) => [rule.id, rule.label]));
function rankSimilarInterviewQuestions(questions, currentQuestion, limit = 3) {
  const input = buildSimilarityInput(currentQuestion);
  return questions.filter((question) => question.slug !== currentQuestion.slug).map((question) => scoreInterviewSimilarity(question, input)).filter((entry) => entry.score > 0 && isEligibleSimilarQuestion(entry, input)).sort((left, right) => right.score - left.score || left.question.sortOrder - right.question.sortOrder).slice(0, limit);
}
function scoreInterviewSimilarity(question, input) {
  const reasons = [];
  let score = 0;
  if (question.category === input.category) {
    score += 6;
    reasons.push("同题型");
  }
  const sharedConcepts = intersect(conceptsForQuestion(question), input.concepts);
  if (sharedConcepts.length > 0) {
    score += Math.min(sharedConcepts.length, 3) * 5;
    reasons.push(`同主题 ${sharedConcepts.slice(0, 2).map(topicLabel).join(" / ")}`);
  }
  const sharedChapters = intersect(question.relatedChapters, input.relatedChapters);
  if (sharedChapters.length > 0) {
    score += Math.min(sharedChapters.length, 2) * 4;
    reasons.push(`同章节 ${sharedChapters.slice(0, 2).join("/")}`);
  } else if (hasNearbyChapter(question.relatedChapters, input.relatedChapters)) {
    score += 2;
    reasons.push("章节相近");
  }
  const sharedTags = intersect(nonGenericTags(question.tags, question.category), nonGenericTags(input.tags, input.category));
  if (sharedTags.length > 0) {
    score += Math.min(sharedTags.length, 2) * 3;
    reasons.push(`同标签 ${sharedTags.slice(0, 2).join(" / ")}`);
  }
  const sharedIntents = intersect(intentsForQuestion(question), input.intents);
  if (sharedIntents.length > 0) {
    score += Math.min(sharedIntents.length, 2) * 2;
    reasons.push(`同问法 ${sharedIntents.slice(0, 1).map(intentLabel).join(" / ")}`);
  }
  if (sharedConcepts.length === 0 && sharedTags.length === 0 && sharedChapters.length === 0) {
    score = Math.max(0, score - 4);
  }
  return { question, score, reasons };
}
function buildSimilarityInput(question) {
  return {
    slug: question.slug,
    category: question.category,
    relatedChapters: question.relatedChapters,
    tags: question.tags,
    concepts: conceptsForQuestion(question),
    intents: intentsForQuestion(question)
  };
}
function isEligibleSimilarQuestion(entry, input) {
  const candidate = entry.question;
  const sharedConcepts = intersect(conceptsForQuestion(candidate), input.concepts);
  if (sharedConcepts.length > 0) return true;
  const sharedChapters = intersect(candidate.relatedChapters, input.relatedChapters);
  const sharedTags = intersect(nonGenericTags(candidate.tags, candidate.category), nonGenericTags(input.tags, input.category));
  const sharedIntents = intersect(intentsForQuestion(candidate), input.intents);
  return sharedChapters.length > 0 && sharedTags.length > 0 && sharedIntents.length > 0;
}
function conceptsForQuestion(question) {
  const text = fullText(question);
  return TOPIC_RULES.filter((rule) => rule.keywords.some((keyword) => text.includes(keyword))).map((rule) => rule.id);
}
function intentsForQuestion(question) {
  const text = fullText(question);
  return INTENT_RULES.filter((rule) => rule.patterns.some((pattern) => text.includes(pattern))).map((rule) => rule.id);
}
function fullText(question) {
  return [question.question, question.summaryExcerpt, question.rationale, ...question.tags].filter(Boolean).join(" ").toLowerCase();
}
function nonGenericTags(tags, category) {
  return tags.filter((tag) => tag && tag !== category);
}
function hasNearbyChapter(left, right) {
  for (const leftChapter of left) {
    for (const rightChapter of right) {
      const distance = chapterDistance(leftChapter, rightChapter);
      if (distance > 0 && distance <= 1) return true;
    }
  }
  return false;
}
function chapterDistance(left, right) {
  const leftNumber = Number.parseInt(left, 10);
  const rightNumber = Number.parseInt(right, 10);
  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) return Number.POSITIVE_INFINITY;
  return Math.abs(leftNumber - rightNumber);
}
function intersect(left, right) {
  if (left.length === 0 || right.length === 0) return [];
  const rightSet = new Set(right);
  return left.filter((item, index) => rightSet.has(item) && left.indexOf(item) === index);
}
function topicLabel(id) {
  return TOPIC_LABELS.get(id) ?? id;
}
function intentLabel(id) {
  return INTENT_LABELS.get(id) ?? id;
}
var define_FRONTIER_SUPABASE_CONFIG_default$2 = { url: "https://br-ideal-fawn-814db5fc.supabase.aidap-global.cn-beijing.volces.com:443", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjcwMzc5MzA0fQ.qiaVI4H2eZ1-5BywE5ORmEPf8_lmuq7-hW-f1lgqwWc", schema: "public" };
const DETAIL_COLUMNS$1 = [
  "slug",
  "question",
  "answer_source",
  "category_label",
  "related_chapters",
  "collected_date",
  "tags",
  "metadata"
].join(",");
const initialized$3 = /* @__PURE__ */ new WeakSet();
const mountedRoots = /* @__PURE__ */ new Set();
const renderedSlugByRoot = /* @__PURE__ */ new WeakMap();
const requestVersionByRoot = /* @__PURE__ */ new WeakMap();
const LOCAL_QUESTION_BY_SLUG = new Map(INTERVIEW_QUESTIONS.map((question) => [question.slug, question]));
const CATEGORY_BY_LABEL = new Map(INTERVIEW_QUESTIONS.map((question) => [question.categoryLabel, question.category]));
const INTERVIEW_LOCATION_CHANGE_EVENT = "agent-build:interview-locationchange";
let locationSyncInstalled = false;
if (typeof window !== "undefined") {
  installInterviewArticleDetail();
}
function installInterviewArticleDetail() {
  installLocationSync();
  scanInterviewArticleDetail();
  const observer = new MutationObserver(() => scanInterviewArticleDetail());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener(INTERVIEW_LOCATION_CHANGE_EVENT, () => scanInterviewArticleDetail());
}
function scanInterviewArticleDetail() {
  const roots = document.querySelectorAll("[data-interview-article]");
  document.body.classList.toggle("interview-article-page", roots.length > 0);
  for (const root of Array.from(mountedRoots)) {
    if (!document.body.contains(root)) mountedRoots.delete(root);
  }
  roots.forEach((root) => {
    mountedRoots.add(root);
    if (!initialized$3.has(root)) {
      initialized$3.add(root);
      mount$2(root);
      return;
    }
    refreshRoot(root);
  });
}
function mount$2(root) {
  root.classList.add("news-article-detail");
  refreshRoot(root, true);
}
function refreshRoot(root, force = false) {
  const slug = interviewDetailSlugFromSearch(window.location.search);
  const renderedSlug = renderedSlugByRoot.get(root) ?? null;
  if (!force && !shouldRefreshInterviewDetail(renderedSlug, window.location.search)) return;
  const nextRequestVersion = (requestVersionByRoot.get(root) ?? 0) + 1;
  requestVersionByRoot.set(root, nextRequestVersion);
  renderedSlugByRoot.set(root, slug);
  if (!slug) {
    root.replaceChildren(status$2("缺少面试题 id。请从面试题库列表进入详情页。"));
    return;
  }
  root.replaceChildren(status$2("正在加载面试题详情..."));
  loadArticle$1(slug).then((row) => {
    if (requestVersionByRoot.get(root) !== nextRequestVersion) return;
    if (!row) {
      root.replaceChildren(status$2("未找到该面试题，可能已下线或尚未同步。"));
      return;
    }
    render$3(root, row);
  }).catch((error) => {
    if (requestVersionByRoot.get(root) !== nextRequestVersion) return;
    root.replaceChildren(status$2(`加载失败：${error instanceof Error ? error.message : String(error)}`));
  });
}
async function loadArticle$1(slug) {
  const config = define_FRONTIER_SUPABASE_CONFIG_default$2 ?? null;
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const rows = await fetchAllPostgrestRows({
    config: { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" },
    table: "interview_questions",
    select: DETAIL_COLUMNS$1,
    filters: [`slug=eq.${slug}`],
    pageSize: 1,
    maxPages: 2
  });
  return rows[0] ?? null;
}
function render$3(root, row) {
  var _a;
  const title = asString$2(row.question) || "未命名面试题";
  const slug = asString$2(row.slug);
  const returnPath = interviewReturnPathFromSearch(window.location.search);
  const metadata = metadataValue(row.metadata);
  const localFallback = LOCAL_QUESTION_BY_SLUG.get(slug);
  const remoteSummary = normalizeText(asString$2(metadata.plainTextDescription));
  const remoteRationale = normalizeText(asString$2(metadata.rationale));
  const remoteFaqList = faqListValue(metadata.faqList);
  const summary = resolveInterviewSummary(remoteSummary, remoteRationale, (localFallback == null ? void 0 : localFallback.summaryExcerpt) ?? "");
  const displayRationale = resolveInterviewDisplayRationale(remoteRationale, (localFallback == null ? void 0 : localFallback.rationale) ?? "");
  const faqList = remoteFaqList.length > 0 ? remoteFaqList : (localFallback == null ? void 0 : localFallback.faqList) ?? [];
  const answerVariants = answerVariantValue(metadata.answerVariants, faqList, summary);
  const contentSections = contentSectionValue(metadata.contentSections, metadata.contentMarkdown, displayRationale, summary);
  const url = firstString(metadata.sourceUrls) || ((_a = localFallback == null ? void 0 : localFallback.sourceUrls) == null ? void 0 : _a[0]) || "";
  const sourceTitle = firstString(metadata.sourceTitles) || asString$2(row.answer_source) || (localFallback == null ? void 0 : localFallback.answerSource) || "面试题详情";
  const layer = asString$2(row.category_label) || (localFallback == null ? void 0 : localFallback.categoryLabel) || "未分类";
  const tags = [
    ...stringArray(row.related_chapters),
    ...stringArray(row.tags).slice(0, 6),
    ...(localFallback == null ? void 0 : localFallback.tags) ?? []
  ].filter((tag, index, list) => tag && list.indexOf(tag) === index);
  const paragraphs = buildInterviewParagraphs({
    summary,
    rationale: displayRationale,
    faqList
  });
  const currentQuestion = similarityInputFromRow(row, localFallback, tags);
  const navigation = buildQuestionNavigation(slug, returnPath);
  const recommendations = recommendSimilarQuestions(currentQuestion, returnPath);
  const article = el$2("article", "news-detail-card");
  const header = el$2("header", "news-detail-header");
  header.append(el$2("p", "news-detail-eyebrow", "面试题库 · 站内详情"));
  header.append(el$2("h1", "news-detail-title", title));
  const meta = el$2("div", "news-detail-meta");
  meta.append(el$2("span", "news-detail-chip", layer));
  const date = resolveInterviewDisplayDate(metadata, asString$2(row.collected_date));
  if (date) meta.append(el$2("span", "news-detail-chip", date));
  header.append(meta);
  if (tags.length > 0) {
    const tagList = el$2("div", "news-detail-tags");
    for (const tag of tags) tagList.append(el$2("span", "news-detail-tag", tag));
    header.append(tagList);
  }
  header.append(el$2("p", "interview-detail-source", sourceTitle));
  const body = el$2("div", "news-detail-body vp-doc");
  const leadParagraphs = answerVariants.length > 0 || contentSections.length > 0 ? [] : paragraphs;
  for (const paragraph of leadParagraphs) {
    body.append(el$2("p", "news-detail-paragraph", paragraph));
  }
  if (answerVariants.length > 0) body.append(buildAnswerSection(answerVariants));
  if (contentSections.length > 0) {
    body.append(buildAnalysisSection(contentSections));
  } else {
    for (const paragraph of paragraphs.slice(leadParagraphs.length)) body.append(el$2("p", "news-detail-paragraph", paragraph));
  }
  const actions = el$2("div", "news-detail-actions");
  const back = document.createElement("a");
  back.className = "news-detail-original";
  back.href = returnPath;
  back.textContent = "返回题库";
  actions.append(back);
  if (url) {
    const original = document.createElement("a");
    original.className = "news-detail-original";
    original.href = url;
    original.target = "_blank";
    original.rel = "noreferrer";
    original.textContent = "打开原文";
    actions.append(original);
  }
  article.append(header, body, actions);
  if (navigation) article.append(navigation);
  if (recommendations) article.append(recommendations);
  root.replaceChildren(article);
  document.title = `${title} | 面试题库`;
}
function buildInterviewParagraphs(input) {
  const paragraphs = [];
  const summary = normalizeText(input.summary);
  const rationale = normalizeText(input.rationale);
  if (summary) paragraphs.push(summary);
  if (rationale && rationale !== summary) paragraphs.push(rationale);
  for (const faq of input.faqList.slice(0, 6)) {
    paragraphs.push(`问：${faq.question}
答：${faq.answer}`);
  }
  if (paragraphs.length > 0) return paragraphs;
  return ["当前仅同步到题干，请结合原文和课程标准答案继续阅读。"];
}
function similarityInputFromRow(row, localFallback, tags) {
  return {
    slug: asString$2(row.slug),
    category: (localFallback == null ? void 0 : localFallback.category) || CATEGORY_BY_LABEL.get(asString$2(row.category_label)) || "principle",
    categoryLabel: asString$2(row.category_label) || (localFallback == null ? void 0 : localFallback.categoryLabel) || "未分类",
    question: asString$2(row.question) || (localFallback == null ? void 0 : localFallback.question) || "",
    relatedChapters: stringArray(row.related_chapters).length > 0 ? stringArray(row.related_chapters) : (localFallback == null ? void 0 : localFallback.relatedChapters) ?? [],
    tags,
    sortOrder: (localFallback == null ? void 0 : localFallback.sortOrder) ?? Number.MAX_SAFE_INTEGER,
    rationale: asString$2(metadataValue(row.metadata).rationale) || (localFallback == null ? void 0 : localFallback.rationale) || "",
    summaryExcerpt: asString$2(metadataValue(row.metadata).plainTextDescription) || (localFallback == null ? void 0 : localFallback.summaryExcerpt) || ""
  };
}
function buildQuestionNavigation(currentSlug, returnPath) {
  const index = INTERVIEW_QUESTIONS.findIndex((question) => question.slug === currentSlug);
  if (index < 0) return null;
  const previous = INTERVIEW_QUESTIONS[index - 1];
  const next = INTERVIEW_QUESTIONS[index + 1];
  if (!previous && !next) return null;
  const section = el$2("section", "interview-detail-section interview-detail-nav");
  section.append(sectionHeading("题目切换"));
  const grid = el$2("div", "interview-detail-nav-grid");
  if (previous) grid.append(navigationCard("上一题", previous.slug, previous.question, returnPath));
  if (next) grid.append(navigationCard("下一题", next.slug, next.question, returnPath));
  section.append(grid);
  return section;
}
function navigationCard(label, slug, title, returnPath) {
  const link2 = document.createElement("a");
  link2.className = "interview-detail-nav-card";
  link2.href = interviewDetailHref(slug, returnPath);
  link2.append(el$2("span", "interview-detail-nav-label", label));
  link2.append(el$2("strong", "interview-detail-nav-title", title));
  return link2;
}
function recommendSimilarQuestions(currentQuestion, returnPath) {
  const items = rankSimilarInterviewQuestions(INTERVIEW_QUESTIONS, currentQuestion, 3);
  if (items.length === 0) return null;
  const section = el$2("section", "interview-detail-section interview-detail-related");
  section.append(sectionHeading("相似题目推荐"));
  const grid = el$2("div", "interview-detail-related-grid");
  for (const item of items) {
    const card2 = document.createElement("a");
    card2.className = "interview-detail-related-card";
    card2.href = interviewDetailHref(item.question.slug, returnPath);
    card2.append(el$2("span", "interview-detail-related-kind", item.question.categoryLabel));
    card2.append(el$2("strong", "interview-detail-related-title", item.question.question));
    const excerpt = item.question.summaryExcerpt || item.question.rationale || "";
    if (excerpt) card2.append(el$2("p", "interview-detail-related-summary", excerpt));
    const metaText = item.reasons.join(" · ");
    if (metaText) card2.append(el$2("span", "interview-detail-related-meta", metaText));
    grid.append(card2);
  }
  section.append(grid);
  return section;
}
function sectionHeading(text) {
  return el$2("h2", "interview-detail-section-title", text);
}
function buildAnswerSection(items) {
  const section = el$2("section", "interview-detail-section interview-answer-section");
  const details = document.createElement("details");
  details.className = "interview-answer-disclosure";
  details.open = true;
  const summary = document.createElement("summary");
  summary.className = "interview-answer-summary";
  summary.append(sectionHeading("直接可背的答案"));
  summary.append(el$2("span", "interview-answer-toggle-label interview-answer-toggle-label-closed", "展开答案"));
  summary.append(el$2("span", "interview-answer-toggle-label interview-answer-toggle-label-open", "收起答案"));
  details.append(summary);
  const grid = el$2("div", "interview-answer-grid");
  for (const item of items) {
    const card2 = el$2("article", "interview-answer-card");
    card2.append(el$2("span", "interview-answer-kind", answerKindLabel(item.kind)));
    card2.append(el$2("h3", "interview-answer-title", item.title));
    card2.append(el$2("p", "interview-answer-body", item.answer));
    grid.append(card2);
  }
  details.append(grid);
  section.append(details);
  return section;
}
function buildAnalysisSection(items) {
  const section = el$2("section", "interview-detail-section interview-analysis-section");
  section.append(sectionHeading("完整解析"));
  for (const item of items) {
    const block = el$2("article", "interview-analysis-block");
    const headingTag = item.level >= 3 ? "h3" : "h2";
    block.append(el$2(headingTag, "interview-analysis-heading", item.heading));
    for (const paragraph of splitSectionParagraphs(item.body)) {
      if (paragraph.startsWith("```") && paragraph.endsWith("```")) {
        const pre = el$2("pre", "interview-analysis-pre");
        const code = document.createElement("code");
        code.textContent = paragraph.slice(3, -3).trim();
        pre.append(code);
        block.append(pre);
      } else {
        block.append(el$2("p", "interview-analysis-body", paragraph));
      }
    }
    section.append(block);
  }
  return section;
}
function splitSectionParagraphs(body) {
  return body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean).slice(0, 12);
}
function answerKindLabel(kind) {
  if (kind === "faq") return "追问回答";
  if (kind === "section") return "分层拆解";
  return "速答版";
}
function answerVariantValue(value, faqList, summary) {
  const fromMetadata = Array.isArray(value) ? value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item;
    const title = asString$2(record.title).trim();
    const answer = normalizeText(asString$2(record.answer));
    const kind = asString$2(record.kind).trim() || "summary";
    if (!title || !answer) return null;
    return { title, answer, kind };
  }).filter((item) => item !== null) : [];
  if (fromMetadata.length > 0) return fromMetadata;
  const fallback = [];
  const cleanSummary = normalizeText(summary);
  if (cleanSummary && !looksLikeAnswerSource(cleanSummary)) fallback.push({ title: "这道题怎么答", answer: cleanSummary, kind: "summary" });
  for (const item of faqList.slice(0, 6)) fallback.push({ title: item.question, answer: normalizeText(item.answer), kind: "faq" });
  return fallback;
}
function contentSectionValue(value, markdown, rationale, summary) {
  const fromMetadata = Array.isArray(value) ? value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item;
    const heading = asString$2(record.heading).trim();
    const body = normalizeText(asString$2(record.body));
    const level = Number(record.level);
    if (!heading || !body) return null;
    return { heading, body, level: Number.isFinite(level) && level > 0 ? level : 2 };
  }).filter((item) => item !== null) : [];
  if (fromMetadata.length > 0) return fromMetadata;
  const text = asString$2(markdown).trim();
  if (text) {
    const sections = text.split(/\n(?=##\s+)/).map((chunk) => chunk.trim()).filter(Boolean).map((chunk) => {
      const match = chunk.match(/^(#{2,4})\s+(.+)\n([\s\S]*)$/);
      if (!match) return null;
      return { heading: match[2].trim(), body: normalizeText(match[3]), level: match[1].length };
    }).filter((item) => item !== null && item.body.length > 0);
    if (sections.length > 0) return sections;
  }
  const fallback = [];
  const cleanSummary = normalizeText(summary);
  const cleanRationale = normalizeText(rationale);
  if (cleanSummary && !looksLikeAnswerSource(cleanSummary)) fallback.push({ heading: "概览", body: cleanSummary, level: 2 });
  if (cleanRationale && cleanRationale !== cleanSummary) fallback.push({ heading: "解析", body: cleanRationale, level: 2 });
  return fallback;
}
function faqListValue(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item;
    const question = asString$2(record.question).trim();
    const answer = asString$2(record.answer).trim();
    if (!question || !answer) return null;
    return { question, answer };
  }).filter((item) => item !== null);
}
function metadataValue(value) {
  return value && typeof value === "object" ? value : {};
}
function firstString(value) {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : "";
}
function stringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}
function normalizeText(text) {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function looksLikeAnswerSource(text) {
  return /^(标准答案来源|答案来源|来源)[:：]/.test(text.trim());
}
function looksLikeSelectionRationale(text) {
  return /^(本题(?:直接)?来自|本题覆盖|本题对应)/.test(text.trim());
}
function resolveInterviewSummary(remoteSummary, remoteRationale, localSummary) {
  const cleanRemoteSummary = normalizeText(remoteSummary);
  const cleanRemoteRationale = normalizeText(remoteRationale);
  const cleanLocalSummary = normalizeText(localSummary);
  if (cleanRemoteSummary && !looksLikeAnswerSource(cleanRemoteSummary) && !looksLikeSelectionRationale(cleanRemoteSummary) && cleanRemoteSummary !== cleanRemoteRationale) {
    return cleanRemoteSummary;
  }
  if (cleanLocalSummary && !looksLikeAnswerSource(cleanLocalSummary) && !looksLikeSelectionRationale(cleanLocalSummary)) {
    return cleanLocalSummary;
  }
  return cleanRemoteSummary || cleanLocalSummary || cleanRemoteRationale;
}
function resolveInterviewDisplayRationale(remoteRationale, localRationale) {
  const candidates = [normalizeText(remoteRationale), normalizeText(localRationale)];
  for (const candidate of candidates) {
    if (candidate && !looksLikeSelectionRationale(candidate)) return candidate;
  }
  return "";
}
function resolveInterviewDisplayDate(metadata, fallbackDate) {
  const candidates = [asString$2(metadata.sourceUpdatedAt), asString$2(metadata.sourceCreatedAt), fallbackDate];
  for (const candidate of candidates) {
    const normalized = normalizeInterviewDisplayDateValue(candidate);
    if (normalized) return normalized;
  }
  return "";
}
function normalizeInterviewDisplayDateValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (match) return match[1];
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
function interviewDetailSlugFromSearch(search) {
  var _a;
  const slug = ((_a = new URLSearchParams(search).get("id")) == null ? void 0 : _a.trim()) || "";
  return slug || null;
}
function shouldRefreshInterviewDetail(renderedSlug, search) {
  return (renderedSlug ?? null) !== interviewDetailSlugFromSearch(search);
}
function interviewDetailHref(slug, returnPath) {
  const base = "/";
  return withReturnPath(`${base}interview/article?id=${encodeURIComponent(slug)}`, returnPath);
}
function interviewReturnPathFromSearch(search) {
  const base = "/";
  return safeReturnPathFromSearch(search, `${base}interview/`);
}
function installLocationSync() {
  if (locationSyncInstalled) return;
  locationSyncInstalled = true;
  const emitLocationChange = () => window.dispatchEvent(new Event(INTERVIEW_LOCATION_CHANGE_EVENT));
  patchHistoryMethod("pushState", emitLocationChange);
  patchHistoryMethod("replaceState", emitLocationChange);
  window.addEventListener("popstate", emitLocationChange);
  window.addEventListener("hashchange", emitLocationChange);
}
function patchHistoryMethod(method, onChange) {
  const original = window.history[method];
  window.history[method] = function patchedHistoryMethod(...args) {
    const result = original.apply(this, args);
    onChange();
    return result;
  };
}
function el$2(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function status$2(message) {
  return el$2("div", "news-detail-status", message);
}
function asString$2(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
let mdSingleton = null;
function getMarkdownIt() {
  if (!mdSingleton) {
    mdSingleton = new MarkdownIt({ html: false, linkify: true, breaks: false });
  }
  return mdSingleton;
}
function renderMarkdownToSafeHtml(markdown) {
  return getMarkdownIt().render(markdown ?? "");
}
let purifier = null;
async function loadSanitizer() {
  if (purifier) return purifier;
  const mod = await import("dompurify");
  const candidate = mod.default ?? mod;
  purifier = (html) => candidate.sanitize(html);
  return purifier;
}
async function renderNotionMarkdown(markdown, sanitize) {
  const html = renderMarkdownToSafeHtml(markdown);
  if (typeof window === "undefined") return html;
  const dompurify = await loadSanitizer();
  return dompurify(html);
}
var define_FRONTIER_SUPABASE_CONFIG_default$1 = { url: "https://br-ideal-fawn-814db5fc.supabase.aidap-global.cn-beijing.volces.com:443", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjcwMzc5MzA0fQ.qiaVI4H2eZ1-5BywE5ORmEPf8_lmuq7-hW-f1lgqwWc", schema: "public" };
const DETAIL_COLUMNS = [
  "slug",
  "title",
  "summary",
  "body_markdown",
  "tags",
  "published_date",
  "cover_image_url",
  "notion_url"
].join(",");
const BASE$1 = "/";
const initialized$2 = /* @__PURE__ */ new WeakSet();
if (typeof window !== "undefined") {
  install$1();
}
function install$1() {
  scan$1();
  const observer = new MutationObserver(() => scan$1());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scan$1() {
  document.querySelectorAll("[data-notion-article]").forEach((root) => {
    if (initialized$2.has(root)) return;
    initialized$2.add(root);
    mount$1(root);
  });
}
function mount$1(root) {
  root.classList.add("notion-article-detail");
  const slug = notionArticleSlugFromSearch(window.location.search);
  if (!slug) {
    root.replaceChildren(status$1("缺少文章 slug（应通过列表页卡片进入）。"));
    return;
  }
  root.replaceChildren(status$1("正在加载文章..."));
  loadArticle(slug).then((row) => {
    if (!row) {
      root.replaceChildren(status$1("未找到该文章（可能未发布或已下线）。"));
      return;
    }
    return render$2(root, row);
  }).catch((error) => {
    root.replaceChildren(
      status$1(`加载失败：${error instanceof Error ? error.message : String(error)}`)
    );
  });
}
async function loadArticle(slug) {
  const config = define_FRONTIER_SUPABASE_CONFIG_default$1 ?? null;
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const rows = await fetchAllPostgrestRows({
    config: { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" },
    table: "notion_articles",
    select: DETAIL_COLUMNS,
    filters: [`slug=eq.${slug}`, "status=eq.published"],
    pageSize: 1,
    maxPages: 2
  });
  return rows[0] ?? null;
}
async function render$2(root, row) {
  const title = asString$1(row.title);
  const returnPath = notionArticleReturnPathFromSearch(window.location.search);
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];
  const article = document.createElement("article");
  article.className = "notion-detail";
  const header = el$1("header", "notion-detail-header");
  header.append(el$1("h1", "notion-detail-title", title));
  const meta = el$1("div", "notion-detail-meta");
  meta.append(el$1("span", "notion-detail-date", asString$1(row.published_date)));
  const back = document.createElement("a");
  back.className = "notion-detail-source";
  back.href = returnPath;
  back.textContent = "返回列表";
  meta.append(back);
  for (const tag of tags) meta.append(el$1("span", "notion-card-tag", tag));
  if (row.notion_url) {
    const link2 = document.createElement("a");
    link2.className = "notion-detail-source";
    link2.href = asString$1(row.notion_url);
    link2.target = "_blank";
    link2.rel = "noreferrer";
    link2.textContent = "在 Notion 打开";
    meta.append(link2);
  }
  header.append(meta);
  if (row.cover_image_url) {
    const cover = document.createElement("img");
    cover.className = "notion-detail-cover";
    cover.src = asString$1(row.cover_image_url);
    cover.alt = "";
    header.append(cover);
  }
  const bodyContainer = el$1("div", "notion-detail-body vp-doc");
  bodyContainer.textContent = "正在渲染正文...";
  article.append(header, bodyContainer);
  root.replaceChildren(article);
  if (typeof document !== "undefined") {
    document.title = title || "Notion 文章";
  }
  const html = await renderNotionMarkdown(asString$1(row.body_markdown));
  bodyContainer.textContent = "";
  bodyContainer.innerHTML = html;
}
function notionArticleSlugFromSearch(search) {
  var _a;
  const slug = ((_a = new URLSearchParams(search).get("slug")) == null ? void 0 : _a.trim()) || "";
  return slug || null;
}
function notionArticleReturnPathFromSearch(search) {
  return safeReturnPathFromSearch(search, `${BASE$1}notion/`);
}
function el$1(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function status$1(message) {
  return el$1("div", "notion-status", message);
}
function asString$1(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
function matchesTag(article, tag) {
  return tag === "all" || article.tags.includes(tag);
}
function matchesQuery(article, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [article.title, article.summary, ...article.tags].join(" ").toLowerCase();
  return haystack.includes(q);
}
function filterArticles(articles, state2) {
  return articles.filter(
    (article) => matchesTag(article, state2.tag) && matchesQuery(article, state2.query)
  );
}
function availableTags(articles) {
  const counts = tagCounts(articles);
  return [...counts.keys()].sort((a, b) => {
    const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}
function tagCounts(articles) {
  const counts = /* @__PURE__ */ new Map();
  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}
var define_FRONTIER_SUPABASE_CONFIG_default = { url: "https://br-ideal-fawn-814db5fc.supabase.aidap-global.cn-beijing.volces.com:443", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjcwMzc5MzA0fQ.qiaVI4H2eZ1-5BywE5ORmEPf8_lmuq7-hW-f1lgqwWc", schema: "public" };
const LIST_COLUMNS = [
  "notion_page_id",
  "slug",
  "title",
  "summary",
  "tags",
  "status",
  "published_date",
  "cover_image_url",
  "read_count"
].join(",");
const BASE = "/";
const initialized$1 = /* @__PURE__ */ new WeakSet();
if (typeof window !== "undefined") {
  install();
}
function install() {
  scan();
  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scan() {
  document.querySelectorAll("[data-notion-articles]").forEach((root) => {
    if (initialized$1.has(root)) return;
    initialized$1.add(root);
    mount(root);
  });
}
function mount(root) {
  root.classList.add("notion-articles");
  root.replaceChildren(status("正在读取 Notion 文章..."));
  restoreListDetailPosition(root);
  loadArticles().then((articles) => render$1(root, articles)).catch((error) => {
    root.replaceChildren(
      status(`读取失败：${error instanceof Error ? error.message : String(error)}`)
    );
  });
}
async function loadArticles() {
  const config = define_FRONTIER_SUPABASE_CONFIG_default ?? null;
  if (!(config == null ? void 0 : config.url) || !config.anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const rows = await fetchAllPostgrestRows({
    config: { url: config.url, anonKey: config.anonKey, schema: config.schema || "public" },
    table: "notion_articles",
    select: LIST_COLUMNS,
    filters: ["status=eq.published"],
    order: ["published_date.desc"],
    pageSize: 100
  });
  return rows.map(normalizeRow).filter((a) => a.title && a.slug);
}
function normalizeRow(row) {
  const publishedDate = asString(row.published_date) || "1970-01-01";
  return {
    notionPageId: asString(row.notion_page_id),
    slug: asString(row.slug),
    title: asString(row.title),
    summary: asString(row.summary),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    status: asString(row.status),
    publishedDate,
    collectedDate: publishedDate,
    coverImageUrl: row.cover_image_url ? asString(row.cover_image_url) : null,
    readCount: typeof row.read_count === "number" ? row.read_count : 0
  };
}
function render$1(root, articles) {
  root.replaceChildren();
  if (articles.length === 0) {
    root.append(
      status("Notion 文章暂无数据。配置 notion-sources.ts 并运行 pnpm notion:sync，或导入 seed。")
    );
    return;
  }
  const initialState = readNotionListQueryState();
  let selectedTag = initialState.tag;
  let selectedDate = initialState.date;
  let query = initialState.query;
  const hero = el("header", "notion-hero");
  hero.append(
    el("p", "notion-eyebrow", "Notion · 全文同步"),
    el("h2", "notion-title", "Notion 文章"),
    el("p", "notion-desc", "由 notion-sync 从 Notion 数据库全文同步；按标签、日期与关键词筛选，点击进入站内全文阅读。")
  );
  const controls = el("div", "notion-controls");
  const search = document.createElement("input");
  search.type = "search";
  search.className = "notion-search";
  search.placeholder = "搜索标题 / 摘要 / 标签…";
  search.value = query;
  search.addEventListener("input", () => {
    query = search.value;
    update();
  });
  const dateSelect = document.createElement("select");
  dateSelect.className = "notion-date-select";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "全部日期";
  dateSelect.append(allOpt);
  const dates = availableDates(articles);
  if (selectedDate && !dates.includes(selectedDate)) selectedDate = null;
  for (const date of dates) {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = date;
    dateSelect.append(opt);
  }
  dateSelect.value = selectedDate ?? "";
  dateSelect.addEventListener("change", () => {
    selectedDate = dateSelect.value || null;
    update();
  });
  controls.append(search, dateSelect);
  const tabs = el("nav", "notion-tag-tabs");
  tabs.setAttribute("aria-label", "标签筛选");
  const tags = ["all", ...availableTags(articles)];
  if (selectedTag !== "all" && !tags.includes(selectedTag)) selectedTag = "all";
  const tabButtons = /* @__PURE__ */ new Map();
  for (const tag of tags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "notion-tag-tab";
    button.textContent = tag === "all" ? "全部" : tag;
    button.addEventListener("click", () => {
      selectedTag = tag;
      update();
    });
    tabButtons.set(tag, button);
    tabs.append(button);
  }
  const grid = el("section", "notion-card-grid");
  grid.setAttribute("aria-label", "文章列表");
  function visible() {
    const byTagQuery = filterArticles(articles, { tag: selectedTag, query });
    return filterByDate(byTagQuery, selectedDate);
  }
  function update() {
    replaceNotionListState();
    for (const [tag, button] of tabButtons) {
      button.classList.toggle("is-active", tag === selectedTag);
    }
    const items = visible();
    grid.replaceChildren();
    if (items.length === 0) {
      grid.append(status("没有匹配的文章。"));
      return;
    }
    for (const article of items) grid.append(card(article, currentRelativePath()));
  }
  root.append(hero, controls, tabs, grid);
  update();
  function replaceNotionListState() {
    const params = new URLSearchParams(window.location.search);
    params.set("tag", selectedTag);
    params.set("date", selectedDate ?? "all");
    const cleanQuery = query.trim();
    if (cleanQuery) {
      params.set("q", cleanQuery);
    } else {
      params.delete("q");
    }
    replaceCurrentSearch(params);
  }
}
function readNotionListQueryState(search = typeof window === "undefined" ? "" : window.location.search) {
  var _a, _b, _c;
  const params = new URLSearchParams(search);
  const tag = ((_a = params.get("tag")) == null ? void 0 : _a.trim()) || "all";
  const rawDate = ((_b = params.get("date")) == null ? void 0 : _b.trim()) || "";
  const date = rawDate === "all" || rawDate === "" ? null : rawDate;
  const query = ((_c = params.get("q")) == null ? void 0 : _c.trim()) || "";
  return { tag, date, query };
}
function card(article, returnPath) {
  const link2 = document.createElement("a");
  link2.className = "notion-card";
  link2.dataset.listDetailKey = article.slug;
  link2.href = notionArticleHref(article.slug, returnPath);
  link2.addEventListener("click", (event) => {
    if (!shouldRememberListDetailClick(event)) return;
    rememberListDetailPosition(returnPath, article.slug, link2);
  });
  if (article.coverImageUrl) {
    const cover = document.createElement("img");
    cover.className = "notion-card-cover";
    cover.src = article.coverImageUrl;
    cover.alt = "";
    cover.loading = "lazy";
    link2.append(cover);
  }
  const body = el("div", "notion-card-body");
  body.append(el("h3", "notion-card-title", article.title));
  if (article.summary) body.append(el("p", "notion-card-summary", article.summary));
  const meta = el("div", "notion-card-meta");
  meta.append(el("span", "notion-card-date", article.publishedDate));
  for (const tag of article.tags.slice(0, 4)) {
    meta.append(el("span", "notion-card-tag", tag));
  }
  body.append(meta);
  link2.append(body);
  return link2;
}
function notionArticleHref(slug, returnPath) {
  return withReturnPath(`${BASE}notion/article?slug=${encodeURIComponent(slug)}`, returnPath);
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function status(message) {
  return el("div", "notion-status", message);
}
function asString(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
const MAX_SELECTED_TEXT_LENGTH = 6e3;
const MAX_QUESTION_LENGTH = 1e3;
const POPOVER_MARGIN = 12;
const state = {
  selectedText: "",
  messages: []
};
let popover;
let drawer;
let selectionTimer;
if (typeof window !== "undefined" && isSelectionChatEnabled()) {
  installSelectionChat();
}
function isSelectionChatEnabled() {
  return Boolean(readBuildConstant(""));
}
function normalizeSelectedText(text, maxLength = MAX_SELECTED_TEXT_LENGTH) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}
function shouldOfferSelectionChat(input) {
  return input.inArticle && !input.collapsed && normalizeSelectedText(input.text).length > 0;
}
function createSelectionChatPayload(input) {
  return {
    selectedText: normalizeSelectedText(input.selectedText),
    question: normalizeSelectedText(input.question, MAX_QUESTION_LENGTH),
    pageTitle: normalizeSelectedText(input.pageTitle ?? "", 160) || void 0,
    pagePath: normalizeSelectedText(input.pagePath ?? "", 240) || void 0,
    messages: (input.messages ?? []).filter((message) => message.role === "user" || message.role === "assistant").map((message) => ({
      role: message.role,
      content: normalizeSelectedText(message.content, 2e3)
    })).filter((message) => message.content.length > 0).slice(-8)
  };
}
function createSelectionChatFrameParser(onFrame) {
  let buffer = "";
  function readLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parsed = JSON.parse(trimmed);
    if (!isSelectionChatFrame(parsed)) {
      throw new Error(`Invalid selection chat frame: ${trimmed}`);
    }
    onFrame(parsed);
  }
  return {
    push(chunk) {
      buffer += chunk;
      while (true) {
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex === -1) break;
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        readLine(line);
      }
    },
    flush() {
      if (!buffer.trim()) {
        buffer = "";
        return;
      }
      const line = buffer;
      buffer = "";
      readLine(line);
    }
  };
}
function installSelectionChat() {
  ensurePopover();
  ensureDrawer();
  document.addEventListener("selectionchange", scheduleSelectionRead);
  document.addEventListener("mouseup", scheduleSelectionRead);
  document.addEventListener("keyup", scheduleSelectionRead);
  document.addEventListener("pointerdown", (event) => {
    const target = event.target instanceof Element ? event.target : void 0;
    if (target == null ? void 0 : target.closest(".selection-chat-popover, .selection-chat-drawer")) return;
    hidePopover();
  });
  window.addEventListener("scroll", hidePopover, { passive: true });
  window.addEventListener("resize", hidePopover, { passive: true });
}
function scheduleSelectionRead() {
  if (selectionTimer !== void 0) window.clearTimeout(selectionTimer);
  selectionTimer = window.setTimeout(readCurrentSelection, 20);
}
function readCurrentSelection() {
  selectionTimer = void 0;
  const selection = window.getSelection();
  const article = document.querySelector(".vp-doc");
  const text = selection ? normalizeSelectedText(selection.toString()) : "";
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : void 0;
  const inArticle = Boolean(article && range && containsRange(article, range) && !isExcludedRange(range));
  if (!selection || !range || !shouldOfferSelectionChat({ inArticle, text, collapsed: selection.isCollapsed })) {
    hidePopover();
    return;
  }
  state.selectedText = text;
  positionPopover(range);
}
function ensurePopover() {
  if (popover) return popover;
  const root = document.createElement("div");
  root.className = "selection-chat-popover";
  root.hidden = true;
  root.setAttribute("role", "toolbar");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "对话";
  button.addEventListener("click", () => {
    hidePopover();
    openDrawer(state.selectedText);
  });
  root.append(button);
  document.body.append(root);
  popover = root;
  return root;
}
function ensureDrawer() {
  if (drawer) return drawer;
  const root = document.createElement("aside");
  root.className = "selection-chat-drawer";
  root.dataset.open = "false";
  root.setAttribute("aria-label", "选区对话");
  const header = document.createElement("div");
  header.className = "selection-chat-drawer-header";
  const title = document.createElement("p");
  title.className = "selection-chat-title";
  title.textContent = "选区对话";
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "selection-chat-icon-button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "关闭对话");
  closeButton.addEventListener("click", closeDrawer);
  header.append(title, closeButton);
  const excerpt = document.createElement("blockquote");
  excerpt.className = "selection-chat-excerpt";
  const messages = document.createElement("div");
  messages.className = "selection-chat-messages";
  const status2 = document.createElement("p");
  status2.className = "selection-chat-status";
  status2.textContent = "选中正文后提问。";
  const form = document.createElement("form");
  form.className = "selection-chat-form";
  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.maxLength = MAX_QUESTION_LENGTH;
  textarea.placeholder = "围绕选中的内容提问";
  const actions = document.createElement("div");
  actions.className = "selection-chat-actions";
  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.textContent = "停止";
  stopButton.disabled = true;
  stopButton.addEventListener("click", () => stopCurrentChat());
  const sendButton = document.createElement("button");
  sendButton.type = "submit";
  sendButton.textContent = "发送";
  actions.append(stopButton, sendButton);
  form.append(textarea, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitQuestion();
  });
  root.append(header, excerpt, messages, status2, form);
  document.body.append(root);
  drawer = { root, excerpt, messages, textarea, sendButton, stopButton, status: status2 };
  return drawer;
}
function openDrawer(selectedText) {
  const elements = ensureDrawer();
  if (state.drawerSelectedText !== selectedText) {
    state.messages = [];
    elements.messages.replaceChildren();
  }
  state.selectedText = selectedText;
  state.drawerSelectedText = selectedText;
  elements.excerpt.textContent = selectedText;
  elements.root.dataset.open = "true";
  elements.status.textContent = "输入问题后发送。";
  requestAnimationFrame(() => elements.textarea.focus());
}
function closeDrawer() {
  if (state.abortController) stopCurrentChat();
  ensureDrawer().root.dataset.open = "false";
}
async function submitQuestion() {
  const elements = ensureDrawer();
  const question = normalizeSelectedText(elements.textarea.value, MAX_QUESTION_LENGTH);
  const selectedText = state.drawerSelectedText ?? "";
  if (!question || !selectedText) return;
  elements.textarea.value = "";
  state.messages.push({ role: "user", content: question });
  renderUserMessage(question);
  const assistantTurn = renderAssistantMessage();
  setRunningState(true, "正在连接模型...");
  const abortController = new AbortController();
  state.abortController = abortController;
  let answerForHistory = "";
  try {
    await streamSelectionChat(question, selectedText, assistantTurn, abortController.signal);
    answerForHistory = assistantTurn.answer.textContent ?? "";
    setRunningState(false, "回答完成。");
  } catch (error) {
    answerForHistory = assistantTurn.answer.textContent ?? "";
    if (isAbortError(error)) {
      setRunningState(false, "已停止。");
      return;
    }
    const detail = error instanceof Error ? error.message : "对话请求失败";
    assistantTurn.answer.textContent += `
${detail}`;
    setRunningState(false, "对话失败。");
  } finally {
    if (answerForHistory) {
      state.messages.push({ role: "assistant", content: answerForHistory });
    }
    if (state.abortController === abortController) state.abortController = void 0;
  }
}
async function streamSelectionChat(question, selectedText, turn, signal) {
  const response = await fetch(`${readBaseUrl()}/api/selection-chat`, {
    method: "POST",
    headers: selectionChatHeaders(),
    body: JSON.stringify(createSelectionChatPayload({
      selectedText,
      question,
      pageTitle: document.title,
      pagePath: window.location.pathname,
      messages: state.messages.slice(0, -1)
    })),
    signal
  });
  if (!response.ok || !response.body) {
    throw new Error(`selection chat request failed: ${response.status}`);
  }
  const parser = createSelectionChatFrameParser((frame) => {
    if (frame.type === "thinking") {
      turn.thinking.hidden = false;
      turn.thinking.textContent += String(frame.data);
    } else if (frame.type === "text") {
      turn.answer.textContent += String(frame.data);
    } else if (frame.type === "error") {
      throw new Error(String(frame.data));
    }
  });
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(value);
    }
    parser.flush();
  } finally {
    await reader.cancel().catch(() => void 0);
  }
}
function renderUserMessage(content) {
  const item = document.createElement("div");
  item.className = "selection-chat-message selection-chat-message-user";
  item.textContent = content;
  ensureDrawer().messages.append(item);
  item.scrollIntoView({ block: "end" });
}
function renderAssistantMessage() {
  const root = document.createElement("div");
  root.className = "selection-chat-message selection-chat-message-assistant";
  const thinking = document.createElement("pre");
  thinking.className = "selection-chat-thinking";
  thinking.hidden = true;
  const answer = document.createElement("div");
  answer.className = "selection-chat-answer";
  root.append(thinking, answer);
  ensureDrawer().messages.append(root);
  root.scrollIntoView({ block: "end" });
  return { thinking, answer };
}
function setRunningState(running, status2) {
  const elements = ensureDrawer();
  elements.sendButton.disabled = running;
  elements.stopButton.disabled = !running;
  elements.textarea.disabled = running;
  elements.status.textContent = status2;
}
function stopCurrentChat() {
  var _a;
  (_a = state.abortController) == null ? void 0 : _a.abort();
  state.abortController = void 0;
  const elements = ensureDrawer();
  setRunningState(false, "已停止。");
  elements.textarea.disabled = false;
}
function positionPopover(range) {
  const root = ensurePopover();
  const rect = firstUsableRect(range);
  if (!rect) {
    hidePopover();
    return;
  }
  root.hidden = false;
  const width = root.offsetWidth || 80;
  const height = root.offsetHeight || 36;
  const left = clamp(rect.left + rect.width / 2 - width / 2, POPOVER_MARGIN, window.innerWidth - width - POPOVER_MARGIN);
  const top = clamp(rect.top - height - 8, POPOVER_MARGIN, window.innerHeight - height - POPOVER_MARGIN);
  root.style.left = `${Math.round(left)}px`;
  root.style.top = `${Math.round(top)}px`;
}
function firstUsableRect(range) {
  const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
  return rects[0] ?? void 0;
}
function hidePopover() {
  if (popover) popover.hidden = true;
}
function containsRange(root, range) {
  return root.contains(range.startContainer) && root.contains(range.endContainer);
}
function isExcludedRange(range) {
  var _a, _b;
  return Boolean(
    ((_a = closestElement(range.startContainer)) == null ? void 0 : _a.closest("pre, code, kbd, samp, textarea, input, button, a, .selection-chat-drawer, .selection-chat-popover")) || ((_b = closestElement(range.endContainer)) == null ? void 0 : _b.closest("pre, code, kbd, samp, textarea, input, button, a, .selection-chat-drawer, .selection-chat-popover"))
  );
}
function closestElement(node) {
  if (node instanceof Element) return node;
  return node.parentElement ?? void 0;
}
function selectionChatHeaders() {
  const token = readBuildConstant("");
  const headers = {
    "Content-Type": "application/json",
    "X-Demo-Runner": "1"
  };
  if (token) headers["X-Demo-Runner-Token"] = token;
  return headers;
}
function readBaseUrl() {
  return readBuildConstant("http://127.0.0.1:5174") || "http://127.0.0.1:5174";
}
function readBuildConstant(value) {
  return typeof value === "string" ? value : "";
}
function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}
function isSelectionChatFrame(value) {
  if (!value || typeof value !== "object") return false;
  const type = value.type;
  return type === "thinking" || type === "text" || type === "done" || type === "error";
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
const SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
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
  ".scala"
]);
const LANGUAGE_BY_EXTENSION = {
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
  ".toml": "TOML"
};
const SOURCE_ANALYSIS_PRESETS = [
  {
    slug: "langchain-ai/langchain",
    name: "LangChain",
    description: "组合式 LLM 应用框架；重点看 agent factory、Runnable、middleware、structured output。",
    defaultBranch: "master",
    sourceUrl: "https://github.com/langchain-ai/langchain",
    indexedAt: "2026-06-29",
    focus: "agent runtime assembly",
    files: [
      file("libs/langchain_v1/langchain/agents/factory.py", 52e3),
      file("libs/langchain_v1/langchain/agents/middleware/types.py", 28e3),
      file("libs/langchain_v1/langchain/agents/structured_output.py", 3e4),
      file("libs/core/langchain_core/runnables/base.py", 12e4),
      file("libs/core/langchain_core/tools/base.py", 52e3),
      file("libs/core/langchain_core/messages/tool.py", 1e4),
      file("libs/langchain/langchain/chains/retrieval.py", 16e3),
      file("libs/langchain/langchain/indexes/vectorstore.py", 1e4),
      file("libs/langchain/tests/unit_tests/agents/test_factory.py", 26e3),
      file("docs/docs/concepts/runnables.mdx", 12e3),
      file("pyproject.toml", 9e3)
    ],
    curatedAreas: [
      area("libs/langchain_v1/langchain/agents", "运行时", 52, 46, 12, 0, "create_agent 装配模型、工具、middleware、structured output", "libs/langchain_v1/langchain/agents/factory.py"),
      area("libs/core/langchain_core/runnables", "运行时", 88, 74, 28, 0, "Runnable 统一 invoke/batch/stream/composition 调用协议", "libs/core/langchain_core/runnables/base.py"),
      area("libs/core/langchain_core/tools", "工具", 62, 50, 18, 0, "工具 schema、调用边界、错误回传", "libs/core/langchain_core/tools/base.py"),
      area("libs/langchain/langchain", "检索", 140, 120, 32, 0, "chains/retrievers/vectorstores 等旧生态 glue code", "libs/langchain/langchain/chains/retrieval.py"),
      area("docs/docs", "文档", 600, 0, 0, 600, "公开 API 使用法和概念解释", "docs/docs/concepts/runnables.mdx")
    ],
    curatedFiles: [
      key("libs/langchain_v1/langchain/agents/factory.py", "运行时", "create_agent 主入口，追参数如何变成可调用 runtime", 100),
      key("libs/core/langchain_core/runnables/base.py", "运行时", "Runnable 协议定义 invoke/batch/stream 和 composition", 96),
      key("libs/langchain_v1/langchain/agents/structured_output.py", "运行时", "provider strategy 与 tool strategy 的 structured output 分流", 88),
      key("libs/core/langchain_core/tools/base.py", "工具", "工具定义、schema、调用异常的核心边界", 82),
      key("libs/langchain_v1/langchain/agents/middleware/types.py", "状态", "middleware 生命周期扩展点，适合接 trace、budget、权限", 78)
    ],
    readingPath: [
      "先读 factory.py：找 create_agent 如何规范化 model/tools/response_format。",
      "再读 Runnable base.py：确认所有组件为何都能 invoke/stream。",
      "追 tool base.py：把模型 tool call 和本地副作用边界分开。",
      "最后读 structured_output.py 和 middleware/types.py：看迁移模型、插治理逻辑时的稳定边界。"
    ]
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
      file("libs/langgraph/langgraph/graph/state.py", 74e3),
      file("libs/langgraph/langgraph/pregel/main.py", 14e4),
      file("libs/langgraph/langgraph/channels/binop.py", 12e3),
      file("libs/langgraph/langgraph/checkpoint/base/__init__.py", 38e3),
      file("libs/prebuilt/langgraph/prebuilt/chat_agent_executor.py", 68e3),
      file("libs/prebuilt/langgraph/prebuilt/tool_node.py", 62e3),
      file("libs/langgraph/langgraph/types.py", 42e3),
      file("libs/langgraph/tests/test_pregel.py", 9e4),
      file("docs/docs/concepts/low_level.md", 18e3),
      file("pyproject.toml", 8e3)
    ],
    curatedAreas: [
      area("libs/langgraph/langgraph/graph", "状态", 34, 30, 8, 0, "StateGraph 声明 state schema、node、edge、compile", "libs/langgraph/langgraph/graph/state.py"),
      area("libs/langgraph/langgraph/pregel", "运行时", 56, 50, 18, 0, "super-step 调度、stream、interrupt、checkpoint 写入", "libs/langgraph/langgraph/pregel/main.py"),
      area("libs/langgraph/langgraph/checkpoint", "状态", 42, 36, 14, 0, "thread_id、state history、持久化恢复", "libs/langgraph/langgraph/checkpoint/base/__init__.py"),
      area("libs/prebuilt/langgraph/prebuilt", "工具", 38, 34, 10, 0, "create_react_agent 与 ToolNode 预制图", "libs/prebuilt/langgraph/prebuilt/tool_node.py"),
      area("docs/docs/concepts", "文档", 120, 0, 0, 120, "低层概念、persistence、HITL、多 agent", "docs/docs/concepts/low_level.md")
    ],
    curatedFiles: [
      key("libs/langgraph/langgraph/graph/state.py", "状态", "StateGraph 声明层：schema、channel、node、edge、compile", 100),
      key("libs/langgraph/langgraph/pregel/main.py", "运行时", "编译后图的执行层：super-step、stream、checkpoint", 98),
      key("libs/prebuilt/langgraph/prebuilt/tool_node.py", "工具", "读取 tool_calls、执行工具、写回 ToolMessage", 90),
      key("libs/prebuilt/langgraph/prebuilt/chat_agent_executor.py", "运行时", "create_react_agent 如何把模型节点和工具节点接成循环", 86),
      key("libs/langgraph/langgraph/checkpoint/base/__init__.py", "状态", "持久化 checkpoint 接口和 state history 边界", 82)
    ],
    readingPath: [
      "先读 state.py：把声明层和执行层分开。",
      "再读 pregel/main.py：看 super-step 如何推进图。",
      "追 ToolNode：确认工具执行不是模型执行。",
      "最后读 checkpoint/base：看 thread_id、history、resume 这些生产能力如何落地。"
    ]
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
      file("llama-index-core/llama_index/core/query_engine/retriever_query_engine.py", 22e3),
      file("llama-index-core/llama_index/core/retrievers.py", 26e3),
      file("llama-index-core/llama_index/core/response_synthesizers/base.py", 24e3),
      file("llama-index-core/llama_index/core/indices/base.py", 26e3),
      file("llama-index-core/llama_index/core/workflow/workflow.py", 46e3),
      file("llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py", 56e3),
      file("llama-index-core/llama_index/core/tools/query_engine.py", 18e3),
      file("llama-index-core/tests/query_engine/test_retriever_query_engine.py", 18e3),
      file("docs/docs/understanding/querying/querying.md", 14e3),
      file("pyproject.toml", 9e3)
    ],
    curatedAreas: [
      area("llama-index-core/llama_index/core/query_engine", "检索", 54, 48, 18, 0, "retriever、postprocessor、synthesizer 串成查询链路", "llama-index-core/llama_index/core/query_engine/retriever_query_engine.py"),
      area("llama-index-core/llama_index/core/indices", "检索", 80, 70, 20, 0, "文档如何变成 nodes/index/retriever", "llama-index-core/llama_index/core/indices/base.py"),
      area("llama-index-core/llama_index/core/response_synthesizers", "运行时", 42, 38, 14, 0, "检索结果如何被合成答案和 source nodes", "llama-index-core/llama_index/core/response_synthesizers/base.py"),
      area("llama-index-core/llama_index/core/workflow", "运行时", 65, 58, 18, 0, "event、step、context、handoff 工作流", "llama-index-core/llama_index/core/workflow/workflow.py"),
      area("llama-index-core/llama_index/core/agent", "工具", 72, 64, 22, 0, "agent workflow、multi-agent handoff、tool 调用", "llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py")
    ],
    curatedFiles: [
      key("llama-index-core/llama_index/core/query_engine/retriever_query_engine.py", "检索", "QueryEngine 主线：retrieve -> postprocess -> synthesize", 100),
      key("llama-index-core/llama_index/core/retrievers.py", "检索", "retriever 抽象，定义 query 到 nodes 的边界", 88),
      key("llama-index-core/llama_index/core/response_synthesizers/base.py", "运行时", "把 nodes 合成 response/source_nodes 的边界", 84),
      key("llama-index-core/llama_index/core/workflow/workflow.py", "运行时", "step/event/context 的 workflow runtime", 82),
      key("llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py", "工具", "多 agent handoff 和 tool 组织方式", 80)
    ],
    readingPath: [
      "先读 retriever_query_engine.py：主线最短，能看懂 LlamaIndex 的 data-first 边界。",
      "再读 retrievers.py 和 indices/base.py：确认数据如何进入可检索结构。",
      "追 response_synthesizers/base.py：看引用和答案合成在哪里发生。",
      "最后读 workflow.py / multi_agent_workflow.py：把 RAG query engine 接进 agent 控制流。"
    ]
  }
];
const POPULAR_SOURCE_REPOSITORIES = [
  {
    slug: "microsoft/vscode",
    description: "Visual Studio Code",
    starsLabel: "183.9k",
    reason: "大型 TypeScript/Electron 产品，适合读插件体系、编辑器服务和跨进程边界。"
  },
  {
    slug: "huggingface/transformers",
    description: "State-of-the-art machine learning model framework for text, vision, audio and multimodal workloads.",
    starsLabel: "159.4k",
    reason: "模型加载、pipeline、tokenizer 和推理抽象密集，适合读 ML 框架工程分层。"
  },
  {
    slug: "microsoft/playwright",
    description: "Web testing and automation framework for Chromium, Firefox and WebKit.",
    starsLabel: "86.5k",
    reason: "浏览器驱动、协议封装、fixture/test runner 组合清晰，适合读工具 runtime。"
  },
  {
    slug: "opendatalab/MinerU",
    description: "Transforms complex documents such as PDFs into LLM-ready markdown/JSON.",
    starsLabel: "60.0k",
    reason: "文档解析、版面识别和结构化输出链路完整，适合读 data pipeline。"
  },
  {
    slug: "karpathy/nanochat",
    description: "A compact ChatGPT-style training and inference codebase.",
    starsLabel: "51.9k",
    reason: "小而完整，适合从训练、tokenizer、推理和聊天入口一次读穿。"
  },
  {
    slug: "celery/celery",
    description: "Distributed task queue for Python applications.",
    reason: "任务调度、worker、broker 和可靠性边界成熟，适合读分布式后台 runtime。"
  },
  {
    slug: "Tencent/ncnn",
    description: "High-performance neural network inference framework optimized for mobile platforms.",
    starsLabel: "23.1k",
    reason: "C++ 推理 runtime、算子、模型加载和移动端优化边界清楚。"
  },
  {
    slug: "eosphoros-ai/DB-GPT",
    description: "Open-source agentic AI data assistant for AI + Data applications.",
    starsLabel: "18.5k",
    reason: "数据 agent、工具调用、SQL/RAG 和应用层编排都有真实工程复杂度。"
  },
  {
    slug: "linshenkx/prompt-optimizer",
    description: "AI prompt optimizer for writing better prompts and getting better AI results.",
    starsLabel: "26.4k",
    reason: "提示优化产品链路短，适合读 prompt workflow、模型调用和前端交互。"
  },
  {
    slug: "nextapps-de/flexsearch",
    description: "Next-generation full-text search library for browser and Node.js.",
    starsLabel: "13.7k",
    reason: "全文索引、分词、查询和性能权衡集中，适合读搜索库核心实现。"
  },
  {
    slug: "agent0ai/agent-zero",
    description: "Agent Zero AI framework.",
    starsLabel: "17.0k",
    reason: "agent framework 的工具、记忆、执行循环和扩展边界适合与本课程对照。"
  },
  {
    slug: "hackjutsu/Lepton",
    description: "Democratizing snippet management across macOS, Windows and Linux.",
    starsLabel: "10.3k",
    reason: "桌面应用、同步、编辑体验和状态管理完整，适合读产品型仓库。"
  },
  {
    slug: "langchain-ai/langchain",
    description: "The agent engineering platform.",
    starsLabel: "133.6k",
    reason: "课程内置深入解析：agent factory、Runnable、tool 和 middleware 主链完整。"
  },
  {
    slug: "openai/openai-python",
    description: "Official Python library for the OpenAI API.",
    starsLabel: "30.5k",
    reason: "SDK 生成代码、类型、streaming、错误处理和 API 边界适合读客户端设计。"
  },
  {
    slug: "langchain-ai/langgraph",
    description: "Build resilient language agents as graphs.",
    reason: "课程内置深入解析：StateGraph、Pregel、ToolNode 和 checkpoint 主链完整。"
  },
  {
    slug: "run-llama/llama_index",
    description: "Data framework for LLM applications.",
    reason: "课程内置深入解析：QueryEngine、Retriever、ResponseSynthesizer 和 Workflow 主链完整。"
  }
];
function normalizeRepositoryInput(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withoutGit = trimmed.replace(/\.git$/i, "");
  const githubMatch = withoutGit.match(/github\.com[/:]([^/\s]+)\/([^/\s?#]+)/i);
  const slug = githubMatch ? `${githubMatch[1]}/${githubMatch[2]}` : withoutGit.replace(/^https?:\/\//i, "");
  const parts = slug.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = cleanSlugPart(parts[0]);
  const repo = cleanSlugPart(parts[1]);
  if (!owner || !repo) return null;
  return { owner, repo, slug: `${owner}/${repo}` };
}
function presetForSlug(slug) {
  return SOURCE_ANALYSIS_PRESETS.find((preset) => preset.slug.toLowerCase() === slug.toLowerCase());
}
function analyzePreset(preset) {
  const derived = analyzeRepositoryTree({
    slug: preset.slug,
    name: preset.name,
    description: preset.description,
    defaultBranch: preset.defaultBranch,
    sourceUrl: preset.sourceUrl,
    indexedAt: preset.indexedAt,
    focus: preset.focus,
    items: preset.files,
    source: "preset"
  });
  return {
    ...derived,
    areas: preset.curatedAreas,
    keyFiles: preset.curatedFiles,
    readingPath: preset.readingPath
  };
}
function analyzeRepositoryTree(options) {
  const files = options.items.filter((item) => item.type === "file");
  const dirs = /* @__PURE__ */ new Set();
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
    indexedAt: options.indexedAt ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    focus: options.focus ?? inferRepositoryFocus(files.map((file2) => file2.path)),
    stats: {
      totalFiles: files.length,
      totalDirs: dirs.size,
      codeFiles: files.filter((file2) => isCodeFile(file2.path)).length,
      testFiles: files.filter((file2) => isTestFile(file2.path)).length,
      docsFiles: files.filter((file2) => isDocsFile(file2.path)).length,
      configFiles: files.filter((file2) => isConfigFile(file2.path)).length
    },
    languages: languageRows(files.map((file2) => file2.path)),
    areas: buildAreaRows(files),
    keyFiles: pickKeyFiles(files),
    readingPath: buildReadingPath(files.map((file2) => file2.path)),
    source: options.source,
    truncated: options.truncated
  };
}
function buildGitHubFileUrl(slug, branch, path) {
  return `https://github.com/${slug}/blob/${branch}/${path}`;
}
function buildGitHubLineUrl(slug, branch, path, startLine, endLine) {
  const base = buildGitHubFileUrl(slug, branch, path);
  return startLine === endLine ? `${base}#L${startLine}` : `${base}#L${startLine}-L${endLine}`;
}
function selectQuestionFiles(analysis, question, limit = 8) {
  const terms = questionTerms(question);
  const candidates = /* @__PURE__ */ new Map();
  for (const file2 of analysis.keyFiles) {
    candidates.set(file2.path, { ...file2 });
  }
  for (const area2 of analysis.areas) {
    if (!candidates.has(area2.readFirst)) {
      candidates.set(area2.readFirst, {
        path: area2.readFirst,
        layer: area2.layer,
        reason: `${area2.area}: ${area2.signal}`,
        score: scorePath(area2.readFirst)
      });
    }
  }
  return [...candidates.values()].map((candidate) => ({
    ...candidate,
    score: candidate.score + scoreTextForTerms(`${candidate.path}
${candidate.layer}
${candidate.reason}`, terms) + layerQuestionBonus(candidate.layer, question)
  })).filter((candidate) => isCodeFile(candidate.path) || isDocsFile(candidate.path) || isConfigFile(candidate.path)).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
}
function buildRepositoryCodeMap(analysis, options = {}) {
  var _a;
  const question = (_a = options.question) == null ? void 0 : _a.trim();
  const limitPerLayer = options.limitPerLayer ?? 5;
  const focusFiles = question ? selectQuestionFiles(analysis, question, 8) : [];
  const focusPaths = new Set(focusFiles.map((file2) => file2.path));
  const filesByPath = /* @__PURE__ */ new Map();
  const rememberFile = (file2) => {
    const previous = filesByPath.get(file2.path);
    if (!previous || file2.score > previous.score) filesByPath.set(file2.path, file2);
  };
  for (const file2 of analysis.keyFiles) rememberFile(file2);
  for (const area2 of analysis.areas) {
    rememberFile({
      path: area2.readFirst,
      layer: area2.layer,
      reason: `${area2.area}: ${area2.signal}`,
      score: scorePath(area2.readFirst)
    });
  }
  for (const file2 of focusFiles) rememberFile(file2);
  const areasByLayer = /* @__PURE__ */ new Map();
  for (const area2 of analysis.areas) {
    const areas = areasByLayer.get(area2.layer) ?? /* @__PURE__ */ new Set();
    areas.add(area2.area);
    areasByLayer.set(area2.layer, areas);
  }
  const grouped = /* @__PURE__ */ new Map();
  for (const file2 of filesByPath.values()) {
    const mappedFile = {
      ...file2,
      url: buildGitHubFileUrl(analysis.slug, analysis.defaultBranch, file2.path),
      questionMatched: focusPaths.has(file2.path),
      score: file2.score + (focusPaths.has(file2.path) ? 80 : 0)
    };
    const files = grouped.get(mappedFile.layer) ?? [];
    files.push(mappedFile);
    grouped.set(mappedFile.layer, files);
  }
  const layers = [...grouped.entries()].map(([layer, files]) => ({
    layer,
    signal: signalForLayer(layer),
    areas: [...areasByLayer.get(layer) ?? /* @__PURE__ */ new Set()].sort(),
    files: files.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limitPerLayer)
  })).sort((a, b) => layerOrder(a.layer) - layerOrder(b.layer) || a.layer.localeCompare(b.layer));
  const edges = analysis.areas.slice(0, 10).map((area2) => ({
    from: area2.area,
    to: area2.readFirst,
    relation: "read-first",
    reason: area2.signal
  }));
  const readingOrderFiles = analysis.keyFiles.slice(0, 5);
  for (let index = 1; index < readingOrderFiles.length; index += 1) {
    edges.push({
      from: readingOrderFiles[index - 1].path,
      to: readingOrderFiles[index].path,
      relation: "reading-order",
      reason: "按高信号文件顺序追 runtime 主链。"
    });
  }
  for (const file2 of focusFiles.slice(0, 4)) {
    edges.push({
      from: question ?? "当前问题",
      to: file2.path,
      relation: "question-focus",
      reason: file2.reason
    });
  }
  const focusText = focusFiles.length > 0 ? `，当前问题聚焦 ${focusFiles.slice(0, 3).map((file2) => file2.path).join("、")}` : "";
  return {
    question,
    summary: `CodeMap 将 ${analysis.areas.length} 个区域映射到 ${layers.length} 个源码职责层${focusText}。所有节点都指向 GitHub 源码文件。`,
    layers,
    edges
  };
}
function answerSourceQuestion(options) {
  const question = options.question.trim();
  const requestedFiles = options.requestedFiles ?? options.documents.map((document2) => document2.path);
  const documents = options.documents.filter((document2) => document2.content.trim().length > 0);
  const missingFiles = requestedFiles.filter((path) => !documents.some((document2) => document2.path === path));
  if (!question) {
    return {
      question,
      summary: "先输入源码问题，再检索候选文件。",
      citations: [],
      searchedFiles: documents.map((document2) => document2.path),
      missingFiles,
      status: "needs-source"
    };
  }
  if (documents.length === 0) {
    return {
      question,
      summary: "还没有可检索的源码内容；需要先读取 GitHub raw 文件。",
      citations: [],
      searchedFiles: [],
      missingFiles,
      status: "needs-source"
    };
  }
  const terms = questionTerms(question);
  const citations = documents.flatMap((document2) => sourceCitationsForDocument(options.analysis, document2, question, terms)).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path) || a.startLine - b.startLine).slice(0, options.maxCitations ?? 4).map((citation) => ({
    ...citation,
    url: buildGitHubLineUrl(options.analysis.slug, options.analysis.defaultBranch, citation.path, citation.startLine, citation.endLine)
  }));
  if (citations.length === 0) {
    const fallbackFiles = selectQuestionFiles(options.analysis, question, options.maxCitations ?? 4);
    return {
      question,
      summary: "源码已读取，但问题关键词没有命中具体行；先从候选文件继续下钻。",
      citations: fallbackFiles.map((file2) => ({
        path: file2.path,
        startLine: 1,
        endLine: 1,
        layer: file2.layer,
        score: file2.score,
        matchedTerms: [],
        excerpt: "",
        explanation: file2.reason,
        url: buildGitHubLineUrl(options.analysis.slug, options.analysis.defaultBranch, file2.path, 1, 1)
      })),
      searchedFiles: documents.map((document2) => document2.path),
      missingFiles,
      status: "no-match"
    };
  }
  const top = citations[0];
  const uniquePaths = [...new Set(citations.map((citation) => citation.path))];
  return {
    question,
    summary: `最相关位置是 ${top.path}:${top.startLine}-${top.endLine}。${summaryForQuestion(question, top.layer)} 本次命中 ${uniquePaths.length} 个文件，优先沿这些源码引用继续追调用链。`,
    citations,
    searchedFiles: documents.map((document2) => document2.path),
    missingFiles,
    status: "answered"
  };
}
function classifyRepositoryPath(path) {
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
function buildAreaRows(files) {
  const groups = /* @__PURE__ */ new Map();
  for (const file2 of files) {
    const areaName = areaForPath(file2.path);
    const current = groups.get(areaName) ?? [];
    current.push(file2);
    groups.set(areaName, current);
  }
  return [...groups.entries()].map(([areaName, areaFiles]) => {
    var _a, _b, _c;
    const layerCounts = /* @__PURE__ */ new Map();
    for (const file2 of areaFiles) {
      const layer2 = classifyRepositoryPath(file2.path);
      layerCounts.set(layer2, (layerCounts.get(layer2) ?? 0) + 1);
    }
    const layer = ((_a = [...layerCounts.entries()].sort((a, b) => b[1] - a[1])[0]) == null ? void 0 : _a[0]) ?? "通用";
    const first = ((_b = pickKeyFiles(areaFiles, 1)[0]) == null ? void 0 : _b.path) ?? ((_c = areaFiles[0]) == null ? void 0 : _c.path) ?? areaName;
    return {
      area: areaName,
      layer,
      fileCount: areaFiles.length,
      codeFiles: areaFiles.filter((file2) => isCodeFile(file2.path)).length,
      testFiles: areaFiles.filter((file2) => isTestFile(file2.path)).length,
      docsFiles: areaFiles.filter((file2) => isDocsFile(file2.path)).length,
      signal: signalForLayer(layer),
      readFirst: first
    };
  }).filter((row) => row.fileCount >= 2 || row.codeFiles > 0).sort((a, b) => b.codeFiles + b.testFiles + b.docsFiles - (a.codeFiles + a.testFiles + a.docsFiles)).slice(0, 12);
}
function pickKeyFiles(files, limit = 12) {
  return files.map((file2) => ({
    path: file2.path,
    layer: classifyRepositoryPath(file2.path),
    reason: reasonForPath(file2.path),
    score: scorePath(file2.path)
  })).filter((row) => row.score > 0).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
}
function buildReadingPath(paths) {
  const keyFiles = pickKeyFiles(paths.map((path) => file(path)), 5);
  if (keyFiles.length === 0) {
    return [
      "先看 README / docs，确认项目目标和公开 API。",
      "再看 package/pyproject/go.mod 等配置，确认包边界和入口。",
      "最后从 src/lib/core 进入运行时，沿测试文件反推真实行为。"
    ];
  }
  return keyFiles.map((item, index) => `${index + 1}. ${item.path}：${item.reason}`);
}
function languageRows(paths) {
  const counts = /* @__PURE__ */ new Map();
  for (const path of paths) {
    const language = LANGUAGE_BY_EXTENSION[extensionOf(path)];
    if (!language) continue;
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  return [...counts.entries()].map(([language, files]) => ({ language, files })).sort((a, b) => b.files - a.files).slice(0, 8);
}
function inferRepositoryFocus(paths) {
  const text = paths.join("\n").toLowerCase();
  if (/query_engine|retriev|rag|embedding|vector/.test(text)) return "data and retrieval runtime";
  if (/graph|pregel|checkpoint|workflow/.test(text)) return "stateful graph runtime";
  if (/agent|tool|runnable|middleware/.test(text)) return "agent and tool runtime";
  if (/server|api|route/.test(text)) return "application service";
  return "repository structure";
}
function scorePath(path) {
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
function reasonForPath(path) {
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
function layerOrder(layer) {
  const index = CODEMAP_LAYER_ORDER.indexOf(layer);
  return index === -1 ? CODEMAP_LAYER_ORDER.length : index;
}
const CODEMAP_LAYER_ORDER = ["入口", "运行时", "状态", "工具", "检索", "配置", "测试", "示例", "文档", "通用"];
function signalForLayer(layer) {
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
function sourceCitationsForDocument(analysis, document2, question, terms) {
  const lines = document2.content.split(/\r?\n/);
  const pathLower = document2.path.toLowerCase();
  const layer = classifyRepositoryPath(document2.path);
  const analysisBoost = analysis.keyFiles.some((file2) => file2.path === document2.path) ? 6 : 0;
  const lineScores = lines.map((line, index) => {
    const matchedTerms = matchedLineTerms(`${pathLower}
${line}`, terms);
    const textScore = scoreTextForTerms(`${pathLower}
${line}`, terms);
    const declarationBonus = /^\s*(class|def|async\s+def|function|export\s+function|export\s+class|const|interface|type)\b/.test(line) ? 8 : 0;
    const layerBonus = layerQuestionBonus(layer, question);
    return {
      lineNumber: index + 1,
      score: textScore + declarationBonus + layerBonus,
      matchedTerms
    };
  }).filter((item) => item.score > 0);
  const windows = [];
  for (const lineScore of lineScores.sort((a, b) => b.score - a.score)) {
    const startLine = Math.max(1, lineScore.lineNumber - 3);
    const endLine = Math.min(lines.length, lineScore.lineNumber + 4);
    const overlaps = windows.some((window2) => window2.path === document2.path && startLine <= window2.endLine && endLine >= window2.startLine);
    if (overlaps) continue;
    const excerptLines = lines.slice(startLine - 1, endLine);
    const excerpt = excerptLines.map((line, offset) => `${startLine + offset}: ${line}`).join("\n").trimEnd();
    const windowText = `${document2.path}
${excerpt}`;
    const matchedTerms = matchedLineTerms(windowText, terms);
    const score = lineScore.score + analysisBoost + scoreTextForTerms(windowText, terms) + Math.min(20, scorePath(document2.path) / 4);
    windows.push({
      path: document2.path,
      startLine,
      endLine,
      layer,
      score,
      matchedTerms,
      excerpt,
      explanation: explanationForCitation(layer, question, matchedTerms, document2.path)
    });
    if (windows.length >= 3) break;
  }
  return windows.sort((a, b) => b.score - a.score);
}
function questionTerms(question) {
  const lower = question.toLowerCase();
  const terms = /* @__PURE__ */ new Set();
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
function scoreTextForTerms(text, terms) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!lower.includes(term)) continue;
    score += term.length >= 8 ? 10 : 6;
  }
  return score;
}
function matchedLineTerms(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term)).slice(0, 8);
}
function layerQuestionBonus(layer, question) {
  if (/工具|tool|function.?call/i.test(question) && layer === "工具") return 18;
  if (/状态|checkpoint|memory|state|持久/i.test(question) && layer === "状态") return 18;
  if (/检索|rag|retriev|query|索引|引用|source/i.test(question) && layer === "检索") return 18;
  if (/运行|循环|runtime|agent|graph|workflow|pregel/i.test(question) && layer === "运行时") return 16;
  if (/入口|api|开始|create|compile/i.test(question) && layer === "入口") return 12;
  return 0;
}
function summaryForQuestion(question, layer) {
  if (/工具|tool|function.?call/i.test(question)) return "这个问题主要看工具调用请求与本地执行边界。";
  if (/状态|checkpoint|memory|持久|恢复/i.test(question)) return "这个问题主要看状态 schema、checkpoint、history 或 reducer。";
  if (/检索|rag|query|引用|source/i.test(question)) return "这个问题主要看 retrieve、postprocess、synthesize 和 source node 回传。";
  if (/循环|runtime|graph|workflow|pregel/i.test(question)) return "这个问题主要看 runtime 如何推进控制流。";
  return `这个问题当前落在 ${layer} 层。`;
}
function explanationForCitation(layer, question, matchedTerms, path) {
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
const QUESTION_STOP_WORDS = /* @__PURE__ */ new Set([
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
  "如何"
]);
const QUESTION_EXPANSIONS = [
  [/工具|调用|tool|function.?call/i, ["tool", "tools", "tool_call", "tool_calls", "tool_node", "toolnode", "toolmessage", "invoke", "call", "execute"]],
  [/状态|checkpoint|恢复|持久|memory|state/i, ["state", "checkpoint", "memory", "store", "history", "channel", "reducer", "resume"]],
  [/检索|索引|引用|rag|query|source/i, ["retriev", "query_engine", "query", "synthesizer", "source", "source_nodes", "index", "nodes"]],
  [/结构化|schema|structured/i, ["structured_output", "schema", "strategy", "response_format", "providerstrategy", "toolstrategy"]],
  [/循环|图|运行|runtime|agent|workflow|pregel/i, ["agent", "runtime", "workflow", "graph", "pregel", "step", "edge", "compile", "invoke", "stream"]],
  [/入口|开始|create|compile|factory/i, ["create_agent", "stategraph", "as_query_engine", "compile", "factory", "main"]],
  [/错误|异常|error|exception/i, ["error", "exception", "handle", "fallback", "raise", "try"]]
];
function areaForPath(path) {
  const parts = path.split("/");
  if (parts.length >= 3 && ["libs", "packages", "apps", "crates"].includes(parts[0])) {
    return `${parts[0]}/${parts[1]}`;
  }
  if (parts.length >= 3 && parts[0] === "llama-index-core") return `${parts[0]}/${parts[1]}/${parts[2]}`;
  if (parts.length >= 2) return parts[0];
  return "(root)";
}
function isCodeFile(path) {
  return SOURCE_EXTENSIONS.has(extensionOf(path));
}
function isTestFile(path) {
  return /(^|\/)(__tests__|tests?|test|spec)(\/|\.|$)|(\.|-)(test|spec)\.[a-z0-9]+$/i.test(path);
}
function isDocsFile(path) {
  return /(^|\/)(docs?|documentation|website)(\/|$)|readme\.|\.mdx?$/i.test(path);
}
function isConfigFile(path) {
  return /(^|\/)(package\.json|pyproject\.toml|go\.mod|cargo\.toml|pom\.xml|build\.gradle|requirements.*\.txt|setup\.py|tsconfig.*\.json|vite\.config|next\.config|ruff\.toml|eslint|biome|\.github\/)/i.test(path);
}
function extensionOf(path) {
  const match = path.toLowerCase().match(/\.[a-z0-9]+$/);
  return (match == null ? void 0 : match[0]) ?? "";
}
function cleanSlugPart(value) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "");
}
function file(path, size = 0) {
  return { path, type: "file", size };
}
function area(areaName, layer, fileCount, codeFiles, testFiles, docsFiles, signal, readFirst) {
  return { area: areaName, layer, fileCount, codeFiles, testFiles, docsFiles, signal, readFirst };
}
function key(path, layer, reason, score) {
  return { path, layer, reason, score };
}
const initialized = /* @__PURE__ */ new WeakSet();
if (typeof window !== "undefined") {
  installSourceAnalysisExplorers();
}
function installSourceAnalysisExplorers() {
  scanSourceAnalysisExplorers();
  const observer = new MutationObserver(() => scanSourceAnalysisExplorers());
  observer.observe(document.body, { childList: true, subtree: true });
}
function scanSourceAnalysisExplorers() {
  document.querySelectorAll("[data-source-analysis-explorer]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    renderExplorer(root);
  });
}
function renderExplorer(root) {
  root.classList.add("source-analysis-explorer");
  root.replaceChildren();
  const defaultAnalysis = analyzePreset(SOURCE_ANALYSIS_PRESETS[0]);
  let current = defaultAnalysis;
  const sourceCache = /* @__PURE__ */ new Map();
  const shell = document.createElement("section");
  shell.className = "source-analysis-shell";
  shell.setAttribute("aria-label", "源码仓库解析器");
  const hero = document.createElement("header");
  hero.className = "source-analysis-hero";
  const titleGroup = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "source-analysis-eyebrow";
  eyebrow.textContent = "DeepWiki-style Repository Analysis";
  const title = document.createElement("h2");
  title.textContent = "Which repo would you like to understand?";
  const description = document.createElement("p");
  description.className = "source-analysis-desc";
  description.textContent = "选择热门仓库，或粘贴任意公开 GitHub repo，直接生成仓库矩阵、Relevant Source Files、源码问答和阅读路径。";
  titleGroup.append(eyebrow, title, description);
  const stats = document.createElement("div");
  stats.className = "source-analysis-hero-stats";
  hero.append(titleGroup, stats);
  const form = document.createElement("form");
  form.className = "source-analysis-form";
  const input = document.createElement("input");
  input.type = "search";
  input.value = defaultAnalysis.slug;
  input.placeholder = "Search for repositories (or paste a link)";
  input.setAttribute("aria-label", "GitHub 仓库");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "解析";
  form.append(input, submit);
  const popular = document.createElement("section");
  popular.className = "source-analysis-popular";
  const presets = document.createElement("nav");
  presets.className = "source-analysis-presets";
  presets.setAttribute("aria-label", "内置源码解析仓库");
  for (const preset of SOURCE_ANALYSIS_PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = preset.name;
    button.dataset.slug = preset.slug;
    button.addEventListener("click", () => {
      input.value = preset.slug;
      current = analyzePreset(preset);
      status2.textContent = "已加载内置源码解析矩阵。";
      renderAnalysis();
    });
    presets.append(button);
  }
  const status2 = document.createElement("p");
  status2.className = "source-analysis-status";
  const body = document.createElement("div");
  body.className = "source-analysis-body";
  async function setRepository(value) {
    submit.disabled = true;
    status2.textContent = "正在读取 GitHub repo tree...";
    try {
      current = await loadRepository(value);
      input.value = current.slug;
      status2.textContent = current.source === "github" ? `GitHub tree 已解析：${current.stats.totalFiles} files${current.truncated ? " · GitHub 返回 truncated" : ""}` : "已加载内置源码解析矩阵。";
      renderAnalysis();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const target = normalizeRepositoryInput(value);
      const preset = target ? presetForSlug(target.slug) : void 0;
      if (preset) {
        current = analyzePreset(preset);
        input.value = preset.slug;
        status2.textContent = `GitHub 读取失败，已回退到内置矩阵：${message}`;
        renderAnalysis();
      } else {
        status2.textContent = `解析失败：${message}`;
      }
    } finally {
      submit.disabled = false;
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void setRepository(input.value);
  });
  function renderAnalysis() {
    stats.replaceChildren(
      statCard(String(current.stats.totalFiles), "files"),
      statCard(String(current.areas.length), "matrix rows"),
      statCard(String(current.keyFiles.length), "source files")
    );
    for (const button of presets.querySelectorAll("button")) {
      button.dataset.active = button.dataset.slug === current.slug ? "true" : "false";
    }
    renderPopularRepositories(popular, current.slug, {
      onAdd: () => {
        input.focus();
        input.select();
      },
      onAnalyze: (slug) => {
        input.value = slug;
        void setRepository(slug);
      }
    });
    body.replaceChildren(
      renderOverview(current),
      renderLanguages(current),
      renderAreaMatrix(current),
      renderFileMatrix(current),
      renderQuestionPanel(current, sourceCache),
      renderReadingPath(current)
    );
  }
  renderAnalysis();
  shell.append(hero, form, popular, presets, status2, body);
  root.append(shell);
}
async function loadRepository(input) {
  const target = normalizeRepositoryInput(input);
  if (!target) throw new Error("请输入 GitHub owner/repo 或仓库 URL");
  const preset = presetForSlug(target.slug);
  const headers = { Accept: "application/vnd.github+json" };
  const metaResponse = await fetch(`https://api.github.com/repos/${target.slug}`, { headers });
  if (!metaResponse.ok) {
    if (preset) return analyzePreset(preset);
    throw new Error(`GitHub repo meta ${metaResponse.status}`);
  }
  const meta = await metaResponse.json();
  const branch = meta.default_branch || (preset == null ? void 0 : preset.defaultBranch) || "main";
  const treeResponse = await fetch(
    `https://api.github.com/repos/${target.slug}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers }
  );
  if (!treeResponse.ok) {
    if (preset) return analyzePreset(preset);
    throw new Error(`GitHub tree ${treeResponse.status}`);
  }
  const tree = await treeResponse.json();
  const items = (tree.tree ?? []).filter((item) => item.path && (item.type === "blob" || item.type === "tree")).map((item) => ({
    path: item.path,
    type: item.type === "tree" ? "dir" : "file",
    size: item.size
  }));
  if (items.length === 0) throw new Error("GitHub tree 为空");
  return analyzeRepositoryTree({
    slug: target.slug,
    name: meta.full_name ?? target.slug,
    description: meta.description ?? (preset == null ? void 0 : preset.description) ?? "公开 GitHub 仓库源码矩阵",
    defaultBranch: branch,
    sourceUrl: meta.html_url ?? `https://github.com/${target.slug}`,
    indexedAt: (meta.updated_at ?? (/* @__PURE__ */ new Date()).toISOString()).slice(0, 10),
    focus: preset == null ? void 0 : preset.focus,
    items,
    source: "github",
    truncated: tree.truncated
  });
}
function renderOverview(analysis) {
  const section = document.createElement("section");
  section.className = "source-analysis-panel source-analysis-overview";
  section.append(panelHeading("仓库总览", analysis.description));
  const list = document.createElement("dl");
  list.className = "source-analysis-definition-grid";
  definition(list, "仓库", analysis.slug);
  definition(list, "默认分支", analysis.defaultBranch);
  definition(list, "索引时间", analysis.indexedAt);
  definition(list, "核心复杂度", analysis.focus);
  definition(list, "来源", analysis.source === "github" ? "GitHub live tree" : "内置源码矩阵");
  section.append(list);
  const link2 = document.createElement("a");
  link2.className = "source-analysis-primary-link";
  link2.href = analysis.sourceUrl;
  link2.target = "_blank";
  link2.rel = "noreferrer";
  link2.textContent = "打开 GitHub 仓库";
  section.append(link2);
  return section;
}
function renderLanguages(analysis) {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("语言与文件构成", "先看代码/测试/文档比例，判断该从实现、测试还是文档下手。"));
  const grid = document.createElement("div");
  grid.className = "source-analysis-language-grid";
  const max = Math.max(...analysis.languages.map((row) => row.files), 1);
  for (const row of analysis.languages) {
    const item = document.createElement("div");
    item.className = "source-analysis-language";
    const head = document.createElement("span");
    head.textContent = `${row.language} · ${row.files}`;
    const bar = document.createElement("i");
    bar.style.width = `${Math.max(6, row.files / max * 100)}%`;
    item.append(head, bar);
    grid.append(item);
  }
  section.append(grid);
  return section;
}
function renderAreaMatrix(analysis) {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("仓库矩阵", "按目录/包聚合，定位每块代码的职责、信号和首读文件。"));
  const table = document.createElement("table");
  table.className = "source-analysis-table";
  table.append(tableHead(["区域", "层", "文件", "代码", "测试", "文档", "信号", "先读"]));
  const body = document.createElement("tbody");
  for (const row of analysis.areas) body.append(areaRow(row, analysis));
  table.append(body);
  section.append(table);
  return section;
}
function renderFileMatrix(analysis) {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("Relevant Source Files", "DeepWiki 式高信号文件入口：从这些文件追 runtime 主链。"));
  const list = document.createElement("ol");
  list.className = "source-analysis-file-list";
  for (const file2 of analysis.keyFiles) list.append(fileRow(file2, analysis));
  section.append(list);
  return section;
}
function renderPopularRepositories(container, activeSlug, actions) {
  const header = document.createElement("header");
  header.className = "source-analysis-popular-heading";
  const title = document.createElement("h3");
  title.textContent = "热门库直接解读";
  const desc = document.createElement("p");
  desc.textContent = "参照 DeepWiki 首页形态，把热门仓库做成可点击的源码解析入口。";
  header.append(title, desc);
  const grid = document.createElement("div");
  grid.className = "source-analysis-popular-grid";
  const add = document.createElement("button");
  add.type = "button";
  add.className = "source-analysis-popular-card source-analysis-popular-card--add";
  add.addEventListener("click", actions.onAdd);
  const plus = document.createElement("span");
  plus.className = "source-analysis-popular-plus";
  plus.textContent = "+";
  const addTitle = document.createElement("strong");
  addTitle.textContent = "Add repo";
  const addHint = document.createElement("span");
  addHint.className = "source-analysis-popular-add-hint";
  addHint.textContent = "Paste GitHub URL";
  const addArrow = document.createElement("span");
  addArrow.className = "source-analysis-popular-arrow";
  addArrow.textContent = "→";
  add.append(plus, addTitle, addHint, addArrow);
  grid.append(add);
  for (const repo of POPULAR_SOURCE_REPOSITORIES) {
    grid.append(popularRepositoryCard(repo, activeSlug, actions.onAnalyze));
  }
  container.replaceChildren(header, grid);
}
function popularRepositoryCard(repo, activeSlug, onAnalyze) {
  const card2 = document.createElement("button");
  card2.type = "button";
  card2.className = "source-analysis-popular-card";
  card2.dataset.slug = repo.slug;
  card2.dataset.active = repo.slug.toLowerCase() === activeSlug.toLowerCase() ? "true" : "false";
  card2.setAttribute("aria-label", `解析 ${repo.slug}`);
  card2.addEventListener("click", () => onAnalyze(repo.slug));
  const head = document.createElement("span");
  head.className = "source-analysis-popular-card-head";
  const name = document.createElement("strong");
  name.textContent = repo.slug.replace("/", " / ");
  const arrow = document.createElement("span");
  arrow.className = "source-analysis-popular-arrow";
  arrow.textContent = "→";
  head.append(name, arrow);
  const desc = document.createElement("span");
  desc.className = "source-analysis-popular-desc";
  desc.textContent = repo.description;
  const meta = document.createElement("span");
  meta.className = "source-analysis-popular-meta";
  const stars = document.createElement("span");
  stars.textContent = repo.starsLabel ? `★ ${repo.starsLabel}` : "GitHub";
  const mode = document.createElement("span");
  mode.textContent = presetForSlug(repo.slug) ? "内置矩阵" : "Live tree";
  meta.append(stars, mode);
  card2.append(head, desc, meta);
  return card2;
}
function renderReadingPath(analysis) {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("阅读路径", "从 API 入口到 runtime，再到状态/工具/检索边界。"));
  const list = document.createElement("ol");
  list.className = "source-analysis-reading-path";
  for (const step of analysis.readingPath) {
    const item = document.createElement("li");
    item.textContent = step;
    list.append(item);
  }
  section.append(list);
  return section;
}
function areaRow(row, analysis) {
  const tr = document.createElement("tr");
  appendCell(tr, row.area);
  appendBadgeCell(tr, row.layer);
  appendCell(tr, String(row.fileCount));
  appendCell(tr, String(row.codeFiles));
  appendCell(tr, String(row.testFiles));
  appendCell(tr, String(row.docsFiles));
  appendCell(tr, row.signal);
  const link2 = document.createElement("a");
  link2.href = buildGitHubFileUrl(analysis.slug, analysis.defaultBranch, row.readFirst);
  link2.target = "_blank";
  link2.rel = "noreferrer";
  link2.textContent = row.readFirst;
  const td = document.createElement("td");
  td.append(link2);
  tr.append(td);
  return tr;
}
function fileRow(file2, analysis) {
  const item = document.createElement("li");
  const link2 = document.createElement("a");
  link2.href = buildGitHubFileUrl(analysis.slug, analysis.defaultBranch, file2.path);
  link2.target = "_blank";
  link2.rel = "noreferrer";
  link2.textContent = file2.path;
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = file2.layer;
  const reason = document.createElement("p");
  reason.textContent = file2.reason;
  item.append(link2, badge, reason);
  return item;
}
function panelHeading(title, desc) {
  const header = document.createElement("header");
  header.className = "source-analysis-panel-heading";
  const h3 = document.createElement("h3");
  h3.textContent = title;
  const p = document.createElement("p");
  p.textContent = desc;
  header.append(h3, p);
  return header;
}
function tableHead(labels) {
  const head = document.createElement("thead");
  const row = document.createElement("tr");
  for (const label of labels) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    row.append(th);
  }
  head.append(row);
  return head;
}
function appendCell(row, text) {
  const td = document.createElement("td");
  td.textContent = text;
  row.append(td);
}
function appendBadgeCell(row, text) {
  const td = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = text;
  td.append(badge);
  row.append(td);
}
function definition(list, term, value) {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  dd.textContent = value;
  list.append(dt, dd);
}
function statCard(value, label) {
  const item = document.createElement("div");
  item.className = "source-analysis-stat";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  return item;
}
function renderQuestionPanel(analysis, sourceCache) {
  const section = document.createElement("section");
  section.className = "source-analysis-panel source-analysis-question-panel";
  section.append(panelHeading("源码对话与 CodeMap", "连续提问时只检索已读取的 GitHub raw source，并把命中的文件同步到 CodeMap。"));
  let mode = "chat";
  let lastQuestion = "";
  const turns = [];
  const tabs = document.createElement("div");
  tabs.className = "source-analysis-dialog-tabs";
  const chatTab = dialogModeButton("对话", "chat");
  const codeMapTab = dialogModeButton("CodeMap", "codemap");
  tabs.append(chatTab, codeMapTab);
  const guard = document.createElement("p");
  guard.className = "source-analysis-answer-guard";
  guard.textContent = "回答只来自已读取的源码行；没有源码证据时只给候选文件，不编造实现结论。";
  const stage = document.createElement("div");
  stage.className = "source-analysis-dialog-stage";
  const form = document.createElement("form");
  form.className = "source-analysis-question-form";
  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "例如：ToolNode 如何执行工具调用？checkpoint 在哪里保存状态？";
  input.setAttribute("aria-label", "源码问题");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "基于源码回答";
  form.append(input, submit);
  const status2 = document.createElement("p");
  status2.className = "source-analysis-question-status";
  chatTab.addEventListener("click", () => setMode("chat"));
  codeMapTab.addEventListener("click", () => setMode("codemap"));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      status2.textContent = "请输入源码问题。";
      return;
    }
    input.value = "";
    await askQuestion(question);
  });
  function dialogModeButton(label, value) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.mode = value;
    return button;
  }
  function setMode(nextMode) {
    mode = nextMode;
    renderConversationSurface();
  }
  async function askQuestion(question) {
    submit.disabled = true;
    status2.textContent = "正在选择候选文件并读取源码...";
    const files = selectQuestionFiles(analysis, question, 8);
    try {
      const documents = await loadSourceDocuments(analysis, files.map((file2) => file2.path), sourceCache);
      const answer = answerSourceQuestion({
        analysis,
        question,
        documents,
        requestedFiles: files.map((file2) => file2.path),
        maxCitations: 4
      });
      turns.push({ id: Date.now(), question, answer });
      lastQuestion = question;
      status2.textContent = `已检索 ${answer.searchedFiles.length} 个源码文件${answer.missingFiles.length ? `，${answer.missingFiles.length} 个读取失败` : ""}。`;
      renderConversationSurface();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status2.textContent = `源码对话失败：${message}`;
    } finally {
      submit.disabled = false;
    }
  }
  function renderConversationSurface() {
    chatTab.dataset.active = mode === "chat" ? "true" : "false";
    codeMapTab.dataset.active = mode === "codemap" ? "true" : "false";
    if (mode === "chat") {
      stage.replaceChildren(renderChatHistory(turns, (question) => {
        input.value = question;
        input.focus();
      }));
      return;
    }
    stage.replaceChildren(renderCodeMapView(analysis, lastQuestion));
  }
  renderConversationSurface();
  section.append(tabs, guard, stage, form, status2);
  return section;
}
function renderChatHistory(turns, onExample) {
  const log = document.createElement("div");
  log.className = "source-analysis-chat-log";
  if (turns.length === 0) {
    const empty = document.createElement("div");
    empty.className = "source-analysis-chat-empty";
    const title = document.createElement("strong");
    title.textContent = "从源码问题开始";
    const examples = document.createElement("div");
    examples.className = "source-analysis-question-examples";
    for (const question of ["入口函数如何接到 runtime？", "工具调用在哪里执行并回写消息？", "checkpoint 或状态在哪里保存？"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = question;
      button.addEventListener("click", () => onExample(question));
      examples.append(button);
    }
    empty.append(title, examples);
    log.append(empty);
    return log;
  }
  for (const turn of turns) {
    const user = document.createElement("article");
    user.className = "source-analysis-chat-turn source-analysis-chat-turn--user";
    const question = document.createElement("p");
    question.textContent = turn.question;
    user.append(question);
    const assistant = document.createElement("article");
    assistant.className = "source-analysis-chat-turn source-analysis-chat-turn--assistant";
    assistant.append(renderQuestionAnswer(turn.answer));
    log.append(user, assistant);
  }
  return log;
}
function renderCodeMapView(analysis, question) {
  const codeMap = buildRepositoryCodeMap(analysis, { question: question || void 0, limitPerLayer: 5 });
  const wrap = document.createElement("article");
  wrap.className = "source-analysis-codemap";
  const summary = document.createElement("p");
  summary.className = "source-analysis-codemap-summary";
  summary.textContent = codeMap.summary;
  wrap.append(summary);
  const grid = document.createElement("div");
  grid.className = "source-analysis-codemap-grid";
  for (const layer of codeMap.layers) grid.append(renderCodeMapLayer(layer));
  wrap.append(grid);
  if (codeMap.edges.length > 0) wrap.append(renderCodeMapEdges(codeMap.edges));
  return wrap;
}
function renderCodeMapLayer(layer) {
  const group = document.createElement("section");
  group.className = "source-analysis-codemap-layer";
  const head = document.createElement("header");
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = layer.layer;
  const count = document.createElement("span");
  count.textContent = `${layer.files.length} files`;
  head.append(badge, count);
  const signal = document.createElement("p");
  signal.textContent = layer.signal;
  group.append(head, signal);
  const list = document.createElement("ol");
  for (const file2 of layer.files) {
    const item = document.createElement("li");
    item.dataset.focus = file2.questionMatched ? "true" : "false";
    const link2 = document.createElement("a");
    link2.href = file2.url;
    link2.target = "_blank";
    link2.rel = "noreferrer";
    link2.textContent = file2.path;
    const reason = document.createElement("p");
    reason.textContent = file2.reason;
    item.append(link2, reason);
    list.append(item);
  }
  group.append(list);
  if (layer.areas.length > 0) {
    const areas = document.createElement("small");
    areas.textContent = `区域：${layer.areas.slice(0, 3).join(" / ")}${layer.areas.length > 3 ? " ..." : ""}`;
    group.append(areas);
  }
  return group;
}
function renderCodeMapEdges(edges) {
  const wrap = document.createElement("aside");
  wrap.className = "source-analysis-codemap-edges";
  const title = document.createElement("strong");
  title.textContent = "关系线索";
  const list = document.createElement("ul");
  for (const edge of edges.slice(0, 14)) {
    const item = document.createElement("li");
    item.textContent = `${edge.from} -> ${edge.to} · ${relationLabel(edge.relation)} · ${edge.reason}`;
    list.append(item);
  }
  wrap.append(title, list);
  return wrap;
}
function relationLabel(relation) {
  if (relation === "question-focus") return "问题聚焦";
  if (relation === "reading-order") return "阅读顺序";
  return "先读文件";
}
async function loadSourceDocuments(analysis, paths, sourceCache) {
  const uniquePaths = [...new Set(paths)].slice(0, 8);
  const documents = [];
  for (const path of uniquePaths) {
    const cacheKey = `${analysis.slug}@${analysis.defaultBranch}:${path}`;
    const cached = sourceCache.get(cacheKey);
    if (cached !== void 0) {
      documents.push({ path, content: cached });
      continue;
    }
    const response = await fetch(buildRawGitHubUrl(analysis.slug, analysis.defaultBranch, path), {
      headers: { Accept: "text/plain" }
    });
    if (!response.ok) continue;
    const content = await response.text();
    const boundedContent = content.length > 16e4 ? content.slice(0, 16e4) : content;
    sourceCache.set(cacheKey, boundedContent);
    documents.push({ path, content: boundedContent });
  }
  return documents;
}
function buildRawGitHubUrl(slug, branch, path) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${slug}/${encodeURIComponent(branch)}/${encodedPath}`;
}
function renderQuestionAnswer(answer) {
  const wrap = document.createElement("article");
  wrap.className = "source-analysis-answer";
  const summary = document.createElement("p");
  summary.className = "source-analysis-answer-summary";
  summary.textContent = answer.summary;
  wrap.append(summary);
  if (answer.citations.length > 0) {
    const list = document.createElement("ol");
    list.className = "source-analysis-citation-list";
    for (const citation of answer.citations) list.append(renderCitation(citation));
    wrap.append(list);
  }
  if (answer.missingFiles.length > 0) {
    const details = document.createElement("details");
    details.className = "source-analysis-missing-files";
    const summaryNode = document.createElement("summary");
    summaryNode.textContent = "读取失败的候选文件";
    const list = document.createElement("ul");
    for (const path of answer.missingFiles) {
      const item = document.createElement("li");
      item.textContent = path;
      list.append(item);
    }
    details.append(summaryNode, list);
    wrap.append(details);
  }
  return wrap;
}
function renderCitation(citation) {
  const item = document.createElement("li");
  const header = document.createElement("div");
  header.className = "source-analysis-citation-head";
  const link2 = document.createElement("a");
  link2.href = citation.url;
  link2.target = "_blank";
  link2.rel = "noreferrer";
  link2.textContent = `${citation.path}:${citation.startLine}-${citation.endLine}`;
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = citation.layer;
  header.append(link2, badge);
  const explanation = document.createElement("p");
  explanation.textContent = citation.explanation;
  item.append(header, explanation);
  if (citation.excerpt) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = citation.excerpt;
    pre.append(code);
    item.append(pre);
  }
  return item;
}
const ClientOnly = defineComponent({
  setup(_, { slots }) {
    const show = ref(false);
    onMounted(() => {
      show.value = true;
    });
    return () => show.value && slots.default ? slots.default() : null;
  }
});
function useCodeGroups() {
  if (inBrowser) {
    window.addEventListener("click", (e) => {
      var _a;
      const el2 = e.target;
      if (el2.matches(".vp-code-group input")) {
        const group = (_a = el2.parentElement) == null ? void 0 : _a.parentElement;
        if (!group)
          return;
        const i = Array.from(group.querySelectorAll("input")).indexOf(el2);
        if (i < 0)
          return;
        const blocks = group.querySelector(".blocks");
        if (!blocks)
          return;
        const current = Array.from(blocks.children).find((child) => child.classList.contains("active"));
        if (!current)
          return;
        const next = blocks.children[i];
        if (!next || current === next)
          return;
        current.classList.remove("active");
        next.classList.add("active");
        const label = group == null ? void 0 : group.querySelector(`label[for="${el2.id}"]`);
        label == null ? void 0 : label.scrollIntoView({ block: "nearest" });
      }
    });
  }
}
function useCopyCode() {
  if (inBrowser) {
    const timeoutIdMap = /* @__PURE__ */ new WeakMap();
    window.addEventListener("click", (e) => {
      var _a;
      const el2 = e.target;
      if (el2.matches('div[class*="language-"] > button.copy')) {
        const parent = el2.parentElement;
        const sibling = (_a = el2.nextElementSibling) == null ? void 0 : _a.nextElementSibling;
        if (!parent || !sibling) {
          return;
        }
        const isShell = /language-(shellscript|shell|bash|sh|zsh)/.test(parent.className);
        const ignoredNodes = [".vp-copy-ignore", ".diff.remove"];
        const clone = sibling.cloneNode(true);
        clone.querySelectorAll(ignoredNodes.join(",")).forEach((node) => node.remove());
        let text = clone.textContent || "";
        if (isShell) {
          text = text.replace(/^ *(\$|>) /gm, "").trim();
        }
        copyToClipboard(text).then(() => {
          el2.classList.add("copied");
          clearTimeout(timeoutIdMap.get(el2));
          const timeoutId = setTimeout(() => {
            el2.classList.remove("copied");
            el2.blur();
            timeoutIdMap.delete(el2);
          }, 2e3);
          timeoutIdMap.set(el2, timeoutId);
        });
      }
    });
  }
}
async function copyToClipboard(text) {
  try {
    return navigator.clipboard.writeText(text);
  } catch {
    const element = document.createElement("textarea");
    const previouslyFocusedElement = document.activeElement;
    element.value = text;
    element.setAttribute("readonly", "");
    element.style.contain = "strict";
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.fontSize = "12pt";
    const selection = document.getSelection();
    const originalRange = selection ? selection.rangeCount > 0 && selection.getRangeAt(0) : null;
    document.body.appendChild(element);
    element.select();
    element.selectionStart = 0;
    element.selectionEnd = text.length;
    document.execCommand("copy");
    document.body.removeChild(element);
    if (originalRange) {
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  }
}
function useUpdateHead(route, siteDataByRouteRef) {
  let isFirstUpdate = true;
  let managedHeadElements = [];
  const updateHeadTags = (newTags) => {
    if (isFirstUpdate) {
      isFirstUpdate = false;
      newTags.forEach((tag) => {
        const headEl = createHeadElement(tag);
        for (const el2 of document.head.children) {
          if (el2.isEqualNode(headEl)) {
            managedHeadElements.push(el2);
            return;
          }
        }
      });
      return;
    }
    const newElements = newTags.map(createHeadElement);
    managedHeadElements.forEach((oldEl, oldIndex) => {
      const matchedIndex = newElements.findIndex((newEl) => newEl == null ? void 0 : newEl.isEqualNode(oldEl ?? null));
      if (matchedIndex !== -1) {
        delete newElements[matchedIndex];
      } else {
        oldEl == null ? void 0 : oldEl.remove();
        delete managedHeadElements[oldIndex];
      }
    });
    newElements.forEach((el2) => el2 && document.head.appendChild(el2));
    managedHeadElements = [...managedHeadElements, ...newElements].filter(Boolean);
  };
  watchEffect(() => {
    const pageData = route.data;
    const siteData2 = siteDataByRouteRef.value;
    const pageDescription = pageData && pageData.description;
    const frontmatterHead = pageData && pageData.frontmatter.head || [];
    const title = createTitle(siteData2, pageData);
    if (title !== document.title) {
      document.title = title;
    }
    const description = pageDescription || siteData2.description;
    let metaDescriptionElement = document.querySelector(`meta[name=description]`);
    if (metaDescriptionElement) {
      if (metaDescriptionElement.getAttribute("content") !== description) {
        metaDescriptionElement.setAttribute("content", description);
      }
    } else {
      createHeadElement(["meta", { name: "description", content: description }]);
    }
    updateHeadTags(mergeHead(siteData2.head, filterOutHeadDescription(frontmatterHead)));
  });
}
function createHeadElement([tag, attrs, innerHTML]) {
  const el2 = document.createElement(tag);
  for (const key2 in attrs) {
    el2.setAttribute(key2, attrs[key2]);
  }
  if (innerHTML) {
    el2.innerHTML = innerHTML;
  }
  if (tag === "script" && attrs.async == null) {
    el2.async = false;
  }
  return el2;
}
function isMetaDescription(headConfig) {
  return headConfig[0] === "meta" && headConfig[1] && headConfig[1].name === "description";
}
function filterOutHeadDescription(head) {
  return head.filter((h2) => !isMetaDescription(h2));
}
const hasFetched = /* @__PURE__ */ new Set();
const createLink = () => document.createElement("link");
const viaDOM = (url) => {
  const link2 = createLink();
  link2.rel = `prefetch`;
  link2.href = url;
  document.head.appendChild(link2);
};
const viaXHR = (url) => {
  const req = new XMLHttpRequest();
  req.open("GET", url, req.withCredentials = true);
  req.send();
};
let link;
const doFetch = inBrowser && (link = createLink()) && link.relList && link.relList.supports && link.relList.supports("prefetch") ? viaDOM : viaXHR;
function usePrefetch() {
  if (!inBrowser) {
    return;
  }
  if (!window.IntersectionObserver) {
    return;
  }
  let conn;
  if ((conn = navigator.connection) && (conn.saveData || /2g/.test(conn.effectiveType))) {
    return;
  }
  const rIC = window.requestIdleCallback || setTimeout;
  let observer = null;
  const observeLinks = () => {
    if (observer) {
      observer.disconnect();
    }
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link2 = entry.target;
          observer.unobserve(link2);
          const { pathname } = link2;
          if (!hasFetched.has(pathname)) {
            hasFetched.add(pathname);
            const pageChunkPath = pathToFile(pathname);
            if (pageChunkPath)
              doFetch(pageChunkPath);
          }
        }
      });
    });
    rIC(() => {
      document.querySelectorAll("#app a").forEach((link2) => {
        const { hostname, pathname } = new URL(link2.href instanceof SVGAnimatedString ? link2.href.animVal : link2.href, link2.baseURI);
        const extMatch = pathname.match(/\.\w+$/);
        if (extMatch && extMatch[0] !== ".html") {
          return;
        }
        if (
          // only prefetch same tab navigation, since a new tab will load
          // the lean js chunk instead.
          link2.target !== "_blank" && // only prefetch inbound links
          hostname === location.hostname
        ) {
          if (pathname !== location.pathname) {
            observer.observe(link2);
          } else {
            hasFetched.add(pathname);
          }
        }
      });
    });
  };
  onMounted(observeLinks);
  const route = useRoute();
  watch(() => route.path, observeLinks);
  onUnmounted(() => {
    observer && observer.disconnect();
  });
}
function resolveThemeExtends(theme2) {
  if (theme2.extends) {
    const base = resolveThemeExtends(theme2.extends);
    return {
      ...base,
      ...theme2,
      async enhanceApp(ctx) {
        if (base.enhanceApp)
          await base.enhanceApp(ctx);
        if (theme2.enhanceApp)
          await theme2.enhanceApp(ctx);
      }
    };
  }
  return theme2;
}
const Theme = resolveThemeExtends(theme);
const VitePressApp = defineComponent({
  name: "VitePressApp",
  setup() {
    const { site, lang, dir } = useData$1();
    onMounted(() => {
      watchEffect(() => {
        document.documentElement.lang = lang.value;
        document.documentElement.dir = dir.value;
      });
    });
    if (site.value.router.prefetchLinks) {
      usePrefetch();
    }
    useCopyCode();
    useCodeGroups();
    if (Theme.setup)
      Theme.setup();
    return () => h(Theme.Layout);
  }
});
async function createApp() {
  globalThis.__VITEPRESS__ = true;
  const router = newRouter();
  const app = newApp();
  app.provide(RouterSymbol, router);
  const data = initData(router.route);
  app.provide(dataSymbol, data);
  app.component("Mermaid", _sfc_main$15);
  app.component("Content", Content);
  app.component("ClientOnly", ClientOnly);
  Object.defineProperties(app.config.globalProperties, {
    $frontmatter: {
      get() {
        return data.frontmatter.value;
      }
    },
    $params: {
      get() {
        return data.page.value.params;
      }
    }
  });
  if (Theme.enhanceApp) {
    await Theme.enhanceApp({
      app,
      router,
      siteData: siteDataRef
    });
  }
  return { app, router, data };
}
function newApp() {
  return createSSRApp(VitePressApp);
}
function newRouter() {
  let isInitialPageLoad = inBrowser;
  return createRouter((path) => {
    let pageFilePath = pathToFile(path);
    let pageModule = null;
    if (pageFilePath) {
      if (isInitialPageLoad) {
        pageFilePath = pageFilePath.replace(/\.js$/, ".lean.js");
      }
      if (false) ;
      else {
        pageModule = import(
          /*@vite-ignore*/
          pageFilePath
        );
      }
    }
    if (inBrowser) {
      isInitialPageLoad = false;
    }
    return pageModule;
  }, Theme.NotFound);
}
if (inBrowser) {
  createApp().then(({ app, router, data }) => {
    router.go().then(() => {
      useUpdateHead(router.route, data.site);
      app.mount("#app");
    });
  });
}
async function render(path) {
  const { app, router } = await createApp();
  await router.go(path);
  const ctx = { content: "", vpSocialIcons: /* @__PURE__ */ new Set() };
  ctx.content = await renderToString(app, ctx);
  return ctx;
}
export {
  useRouter as a,
  createSearchTranslate as c,
  dataSymbol as d,
  escapeRegExp as e,
  inBrowser as i,
  pathToFile as p,
  render,
  useData as u
};
