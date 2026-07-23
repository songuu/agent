import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"AI 资讯文章详情","description":"","frontmatter":{"title":"AI 资讯文章详情","aside":false},"headers":[],"relativePath":"news/article.md","filePath":"news/article.md","lastUpdated":1782274079000}');
const _sfc_main = { name: "news/article.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><div data-news-article></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("news/article.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const article = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  article as default
};
