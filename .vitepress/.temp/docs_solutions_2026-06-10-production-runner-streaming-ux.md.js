import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Production demo runner streaming UX","description":"","frontmatter":{"title":"Production demo runner streaming UX","date":"2026-06-10T00:00:00.000Z","tags":["solution","demo-runner","streaming","production"],"related_instincts":[],"aliases":["生产 runner 卡顿","runner thinking frame","LLM streaming UX"]},"headers":[],"relativePath":"docs/solutions/2026-06-10-production-runner-streaming-ux.md","filePath":"docs/solutions/2026-06-10-production-runner-streaming-ux.md","lastUpdated":1781146684000}');
const _sfc_main = { name: "docs/solutions/2026-06-10-production-runner-streaming-ux.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="production-demo-runner-streaming-ux" tabindex="-1">Production demo runner streaming UX <a class="header-anchor" href="#production-demo-runner-streaming-ux" aria-label="Permalink to &quot;Production demo runner streaming UX&quot;">​</a></h1><h2 id="problem" tabindex="-1">Problem <a class="header-anchor" href="#problem" aria-label="Permalink to &quot;Problem&quot;">​</a></h2><p>生产环境点击 demo 运行时，LLM 调用阶段会出现长时间静默；高频 token 输出还可能让 xterm 写入过密，造成页面卡顿。</p><h2 id="root-cause" tabindex="-1">Root Cause <a class="header-anchor" href="#root-cause" aria-label="Permalink to &quot;Root Cause&quot;">​</a></h2><p>runner 只把子进程 stdout/stderr 作为普通文本帧透传，缺少可表达“模型正在处理/推理”的协议帧；浏览器端每个 frame 直接写入 xterm，没有按动画帧批量合并。</p><h2 id="solution" tabindex="-1">Solution <a class="header-anchor" href="#solution" aria-label="Permalink to &quot;Solution&quot;">​</a></h2><ul><li>在 runner NDJSON 协议中增加 <code>thinking</code> frame。</li><li>子进程在 <code>DEMO_RUNNER_FRAME_PROTOCOL=1</code> 时，可通过 stderr 的 <code>__DEMO_RUNNER_FRAME__{...}</code> 侧信道发送 runner-only thinking 帧，普通命令行运行不受影响。</li><li>OpenAI-compatible provider 透出 <code>reasoning_content</code> / <code>reasoning</code> / <code>reasoning_text</code> / <code>thinking</code> 字段；Anthropic stream 兼容 <code>thinking_delta</code>。</li><li>浏览器端 <code>createBufferedTerminalWriter()</code> 使用 <code>requestAnimationFrame</code> 批量写入 xterm，减少高频 chunk 导致的 UI stall。</li><li>生产 PM2 runner 使用新 release cwd 启动，确保服务端和静态 bundle 使用同一版本。</li></ul><h2 id="prevention" tabindex="-1">Prevention <a class="header-anchor" href="#prevention" aria-label="Permalink to &quot;Prevention&quot;">​</a></h2><ul><li>runner 协议类型变更必须同时更新 <code>stream.test.mts</code>、<code>runner.test.mts</code>、<code>client.test.mts</code>。</li><li>PM2 <code>startOrReload</code> 不一定更新已有进程的 <code>script path</code> / <code>exec cwd</code>；切换 release 后必须复核 <code>pm2 describe agent-build-runner</code>。</li><li>不伪造隐藏 chain-of-thought；只展示 API 明确返回的 reasoning 字段，以及本地可观测的阶段状态。</li></ul><h2 id="related" tabindex="-1">Related <a class="header-anchor" href="#related" aria-label="Permalink to &quot;Related&quot;">​</a></h2><ul><li>[[session-2026-06-10]]</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("docs/solutions/2026-06-10-production-runner-streaming-ux.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _20260610ProductionRunnerStreamingUx = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  _20260610ProductionRunnerStreamingUx as default
};
