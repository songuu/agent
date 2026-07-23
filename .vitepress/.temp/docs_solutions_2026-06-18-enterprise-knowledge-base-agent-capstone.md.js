import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"企业知识库 Agent Capstone 接线","description":"","frontmatter":{"title":"企业知识库 Agent Capstone 接线","date":"2026-06-18T00:00:00.000Z","tags":["solution","agent-build","curriculum","rag","capstone"],"related_instincts":[],"aliases":["企业知识库 Agent 纵向项目","RAG capstone 接线"]},"headers":[],"relativePath":"docs/solutions/2026-06-18-enterprise-knowledge-base-agent-capstone.md","filePath":"docs/solutions/2026-06-18-enterprise-knowledge-base-agent-capstone.md","lastUpdated":1782270877000}');
const _sfc_main = { name: "docs/solutions/2026-06-18-enterprise-knowledge-base-agent-capstone.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="企业知识库-agent-capstone-接线" tabindex="-1">企业知识库 Agent Capstone 接线 <a class="header-anchor" href="#企业知识库-agent-capstone-接线" aria-label="Permalink to &quot;企业知识库 Agent Capstone 接线&quot;">​</a></h1><h2 id="problem" tabindex="-1">Problem <a class="header-anchor" href="#problem" aria-label="Permalink to &quot;Problem&quot;">​</a></h2><p>外部“转型 Agent 全栈工程师”目录暴露出一个缺口：本课程横向模块完整，但企业知识库这种纵向作品集路线还不够显性。</p><h2 id="root-cause" tabindex="-1">Root Cause <a class="header-anchor" href="#root-cause" aria-label="Permalink to &quot;Root Cause&quot;">​</a></h2><p>原体系已经有手写 Agent、RAG、LangGraph、流式 UX、评估、部署，但学习入口主要按章节和专题组织；学习者不容易看到“从上传资料到 Agentic RAG、权限、事件流、trace/eval、定时任务”的端到端交付路径。</p><h2 id="solution" tabindex="-1">Solution <a class="header-anchor" href="#solution" aria-label="Permalink to &quot;Solution&quot;">​</a></h2><p>新增 <code>capstone/enterprise-knowledge-base-agent/README.md</code>，把蓝图拆成可执行项目：</p><ul><li>产品边界：用户角色、MVP 主流程、非目标。</li><li>数据模型：tenant、collection、document version、chunk、memory、trace、job、eval case。</li><li>架构与接口：ingestion、retrieval、memory、event sink、API surface。</li><li>Agent runtime：证据评分、改写重试、澄清、拒答、工具、审批、引用核验。</li><li>事件流：<code>status/evidence/citation/tool/token/error/done</code>。</li><li>测试验收：L1-L4 风险分层、golden set、4 周实现路线。</li></ul><p>同时接入 <code>README.md</code>、<code>docs/navigation.md</code>、<code>docs/curriculum.md</code>、<code>docs/rag-architecture.md</code>、<code>docs/rag-system-project.md</code>、VitePress nav/sidebar、首页、知识图谱章节源，并运行 <code>pnpm kg</code> 同步生成图谱。</p><h2 id="prevention" tabindex="-1">Prevention <a class="header-anchor" href="#prevention" aria-label="Permalink to &quot;Prevention&quot;">​</a></h2><p>以后新增纵向项目时，不只新增单页文档；同时更新这些入口：</p><ul><li><code>README.md</code></li><li><code>index.md</code></li><li><code>docs/navigation.md</code></li><li><code>docs/curriculum.md</code></li><li><code>.vitepress/config.mts</code></li><li><code>knowledge-graph/data/graph.ts</code></li><li>相关前置/后续项目文档</li></ul><h2 id="related" tabindex="-1">Related <a class="header-anchor" href="#related" aria-label="Permalink to &quot;Related&quot;">​</a></h2><ul><li>[[2026-06-18-wechat-agent-album-reference-analysis]]</li><li>[[2026-06-18]]</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("docs/solutions/2026-06-18-enterprise-knowledge-base-agent-capstone.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _20260618EnterpriseKnowledgeBaseAgentCapstone = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  _20260618EnterpriseKnowledgeBaseAgentCapstone as default
};
