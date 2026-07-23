import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"面试题库","description":"","frontmatter":{"title":"面试题库","aside":false},"headers":[],"relativePath":"interview/index.md","filePath":"interview/index.md","lastUpdated":1782973529000}');
const _sfc_main = { name: "interview/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="面试题库-·-独立刷题页" tabindex="-1">面试题库 · 独立刷题页 <a class="header-anchor" href="#面试题库-·-独立刷题页" aria-label="Permalink to &quot;面试题库 · 独立刷题页&quot;">​</a></h1><blockquote><p>本页独立展示 <code>public.interview_questions</code> 题库，优先读取 Supabase 匿名只读数据；失败时自动回退到本地 bundle。 当前已接入 Codefather 面试同步链路，和 <a href="/docs/career-guide">求职指南</a> 里的面试章节使用同一份题库，不再混在课程章节筛选里。</p></blockquote><div data-interview-clinic></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("interview/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
