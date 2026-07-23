import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"B9 · Structured Output 基础","description":"","frontmatter":{},"headers":[],"relativePath":"agent-basics/09-structured-output-basics.md","filePath":"agent-basics/09-structured-output-basics.md","lastUpdated":1782376068000}');
const _sfc_main = { name: "agent-basics/09-structured-output-basics.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="b9-·-structured-output-基础" tabindex="-1">B9 · Structured Output 基础 <a class="header-anchor" href="#b9-·-structured-output-基础" aria-label="Permalink to &quot;B9 · Structured Output 基础&quot;">​</a></h1><blockquote><p>目标：结构化输出不是“让模型返回 JSON”这么简单。模型输出永远先当不可信输入处理，再 parse、validate、repair、fallback。</p></blockquote><h2 id="为什么需要结构化输出" tabindex="-1">为什么需要结构化输出 <a class="header-anchor" href="#为什么需要结构化输出" aria-label="Permalink to &quot;为什么需要结构化输出&quot;">​</a></h2><table tabindex="0"><thead><tr><th>场景</th><th>非结构化问题</th><th>结构化收益</th></tr></thead><tbody><tr><td>路由</td><td>文本里难判断下一步</td><td><code>route</code> enum 可直接分支</td></tr><tr><td>抽取</td><td>字段缺失难发现</td><td>schema 能报错</td></tr><tr><td>评估</td><td>judge 输出不稳定</td><td>固定 score/reason/evidence</td></tr><tr><td>工具参数</td><td>参数自由漂移</td><td>类型和范围可校验</td></tr></tbody></table><h2 id="基本管线" tabindex="-1">基本管线 <a class="header-anchor" href="#基本管线" aria-label="Permalink to &quot;基本管线&quot;">​</a></h2><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>model output</span></span>
<span class="line"><span>  -&gt; parse JSON</span></span>
<span class="line"><span>  -&gt; validate schema</span></span>
<span class="line"><span>  -&gt; repair or retry</span></span>
<span class="line"><span>  -&gt; fallback / needs_input</span></span>
<span class="line"><span>  -&gt; downstream logic</span></span></code></pre></div><p>任何一步失败都不能静默吞掉。</p><h2 id="schema-设计" tabindex="-1">Schema 设计 <a class="header-anchor" href="#schema-设计" aria-label="Permalink to &quot;Schema 设计&quot;">​</a></h2><table tabindex="0"><thead><tr><th>设计点</th><th>建议</th></tr></thead><tbody><tr><td>enum</td><td>能枚举就不要自由文本</td></tr><tr><td>required</td><td>下游必须用的字段设必填</td></tr><tr><td>nullable</td><td>允许缺失时显式建模</td></tr><tr><td>confidence</td><td>区分高/中/低置信</td></tr><tr><td>evidence</td><td>要求引用输入片段或工具结果</td></tr><tr><td>reason</td><td>供人审和调试</td></tr></tbody></table><h2 id="retry-repair" tabindex="-1">Retry-Repair <a class="header-anchor" href="#retry-repair" aria-label="Permalink to &quot;Retry-Repair&quot;">​</a></h2><p>当 JSON 解析或 schema 校验失败时，可以把错误反馈给模型：</p><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Your JSON failed validation:</span></span>
<span class="line"><span>- field &quot;priority&quot; must be one of [&quot;low&quot;,&quot;medium&quot;,&quot;high&quot;]</span></span>
<span class="line"><span>Return only corrected JSON.</span></span></code></pre></div><p>但 retry 有上限。超过上限后应返回 fallback，而不是无限重试。</p><h2 id="常见误区" tabindex="-1">常见误区 <a class="header-anchor" href="#常见误区" aria-label="Permalink to &quot;常见误区&quot;">​</a></h2><ol><li>只检查是不是 JSON，不检查字段语义。</li><li>让模型输出“看起来像 JSON”的 Markdown fenced block。</li><li>下游直接信任模型给出的路径、SQL、命令。</li><li>修复失败后仍继续执行。</li></ol><h2 id="课程连接" tabindex="-1">课程连接 <a class="header-anchor" href="#课程连接" aria-label="Permalink to &quot;课程连接&quot;">​</a></h2><ul><li>第 13 章：结构化输出与校验。</li><li>第 15 章：把结构化字段接入 eval。</li><li>第 17 章：安全策略也需要结构化 verdict。</li><li>code-review-crew：结构化 finding 和 severity。</li></ul><h2 id="自检练习" tabindex="-1">自检练习 <a class="header-anchor" href="#自检练习" aria-label="Permalink to &quot;自检练习&quot;">​</a></h2><p>为“邮件重要性判断”设计 schema：</p><ul><li><code>priority</code> 应该是哪些 enum？</li><li><code>requires_reply</code> 是 boolean 还是 enum？</li><li><code>evidence</code> 应该引用原文哪部分？</li><li>模型无法判断时如何表示？</li></ul><h2 id="记住一句话" tabindex="-1">记住一句话 <a class="header-anchor" href="#记住一句话" aria-label="Permalink to &quot;记住一句话&quot;">​</a></h2><p>JSON 只是文本；通过 schema 验证后，才开始接近可用数据。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("agent-basics/09-structured-output-basics.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _09StructuredOutputBasics = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  _09StructuredOutputBasics as default
};
