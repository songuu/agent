import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Agent 应用入口","description":"","frontmatter":{},"headers":[],"relativePath":"docs/agent-apps.md","filePath":"docs/agent-apps.md","lastUpdated":1783066876000}');
const _sfc_main = { name: "docs/agent-apps.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="agent-应用入口" tabindex="-1">Agent 应用入口 <a class="header-anchor" href="#agent-应用入口" aria-label="Permalink to &quot;Agent 应用入口&quot;">​</a></h1><p>这里收束独立部署的 Agent 子应用。课程站点只负责导航；每个子应用在自己的仓库或 monorepo app 中独立运行、独立部署、独立验证。</p><h2 id="当前可访问应用" tabindex="-1">当前可访问应用 <a class="header-anchor" href="#当前可访问应用" aria-label="Permalink to &quot;当前可访问应用&quot;">​</a></h2><table tabindex="0"><thead><tr><th>应用</th><th>类型</th><th>访问</th><th>说明</th></tr></thead><tbody><tr><td>SPIFFE mTLS Agent</td><td>安全架构演示</td><td><a href="https://songuu.top/agent-demo/spiffe/" target="_blank" rel="noreferrer">打开应用</a></td><td>一页查看 Agent 双向认证、SVID、PeerPolicy、审计链路。</td></tr></tbody></table><h2 id="扩展约定" tabindex="-1">扩展约定 <a class="header-anchor" href="#扩展约定" aria-label="Permalink to &quot;扩展约定&quot;">​</a></h2><p>后续新增子应用时按同一模型接入：</p><table tabindex="0"><thead><tr><th>字段</th><th>责任</th></tr></thead><tbody><tr><td><code>id</code></td><td>稳定应用标识，例如 <code>spiffe-mtls-agent</code></td></tr><tr><td><code>title</code></td><td>导航显示名</td></tr><tr><td><code>href</code></td><td>公网入口，优先用完整 URL</td></tr><tr><td><code>summary</code></td><td>一句话说明访问目的</td></tr><tr><td><code>ownerRepo</code></td><td>应用所属仓库</td></tr><tr><td><code>health</code></td><td>可验证健康检查地址</td></tr></tbody></table><p>agent-build 不承载子应用运行时，只保留统一入口。子应用运行时由各自仓库的部署配置、PM2 进程和 Nginx 路由负责。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("docs/agent-apps.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const agentApps = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  agentApps as default
};
