import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"B6 · Tool Calling 心智模型","description":"","frontmatter":{},"headers":[],"relativePath":"agent-basics/06-tool-calling-mental-model.md","filePath":"agent-basics/06-tool-calling-mental-model.md","lastUpdated":1782376068000}');
const _sfc_main = { name: "agent-basics/06-tool-calling-mental-model.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="b6-·-tool-calling-心智模型" tabindex="-1">B6 · Tool Calling 心智模型 <a class="header-anchor" href="#b6-·-tool-calling-心智模型" aria-label="Permalink to &quot;B6 · Tool Calling 心智模型&quot;">​</a></h1><blockquote><p>目标：理解模型不会真的执行工具。它只提出结构化请求；本地代码决定是否执行、怎么校验、如何回传结果。</p></blockquote><h2 id="一次工具调用往返" tabindex="-1">一次工具调用往返 <a class="header-anchor" href="#一次工具调用往返" aria-label="Permalink to &quot;一次工具调用往返&quot;">​</a></h2><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>user request</span></span>
<span class="line"><span>  -&gt; model: 我需要调用 search({&quot;query&quot;:&quot;...&quot;})</span></span>
<span class="line"><span>  -&gt; app: 校验参数和权限</span></span>
<span class="line"><span>  -&gt; app: 执行 search</span></span>
<span class="line"><span>  -&gt; app: 回传 tool result</span></span>
<span class="line"><span>  -&gt; model: 基于结果继续或给最终答案</span></span></code></pre></div><h2 id="职责边界" tabindex="-1">职责边界 <a class="header-anchor" href="#职责边界" aria-label="Permalink to &quot;职责边界&quot;">​</a></h2><table tabindex="0"><thead><tr><th>环节</th><th>模型负责</th><th>应用负责</th></tr></thead><tbody><tr><td>选择工具</td><td>提出候选工具调用</td><td>判断工具是否允许</td></tr><tr><td>生成参数</td><td>按 schema 填参数</td><td>校验类型、范围、权限</td></tr><tr><td>执行工具</td><td>不执行</td><td>调 API、查库、写文件</td></tr><tr><td>处理错误</td><td>读取错误 observation</td><td>捕获异常、清洗错误、回传</td></tr><tr><td>终止循环</td><td>给出最终答案</td><td>maxSteps、预算、人工确认</td></tr></tbody></table><h2 id="tool-schema-是-abi" tabindex="-1">Tool Schema 是 ABI <a class="header-anchor" href="#tool-schema-是-abi" aria-label="Permalink to &quot;Tool Schema 是 ABI&quot;">​</a></h2><p>Schema 不只是“给模型看的说明”，也是代码执行边界：</p><ul><li>字段名要有业务语义。</li><li>描述要说明何时使用。</li><li>enum 优先于自由文本。</li><li>数值要有范围。</li><li>高风险参数要二次确认。</li></ul><h2 id="错误回传" tabindex="-1">错误回传 <a class="header-anchor" href="#错误回传" aria-label="Permalink to &quot;错误回传&quot;">​</a></h2><p>不要把工具错误藏起来。把错误转成模型能理解的 observation：</p><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Tool error: customerId must be a non-empty string. Ask user for a valid customer id.</span></span></code></pre></div><p>这样下一轮模型才可能追问或修正参数。</p><h2 id="高风险工具" tabindex="-1">高风险工具 <a class="header-anchor" href="#高风险工具" aria-label="Permalink to &quot;高风险工具&quot;">​</a></h2><p>以下工具需要确认门：</p><ul><li>发邮件、发消息、创建工单。</li><li>写数据库、删除文件、执行命令。</li><li>花钱、下单、改权限。</li><li>访问隐私数据或跨租户数据。</li></ul><p>确认门应该在应用层实现，不要只靠 prompt 请求模型“谨慎”。</p><h2 id="课程连接" tabindex="-1">课程连接 <a class="header-anchor" href="#课程连接" aria-label="Permalink to &quot;课程连接&quot;">​</a></h2><ul><li>第 05 章：原生 function calling。</li><li>第 06 章：ToolRegistry、zod 校验、安全执行。</li><li>第 17 章：危险操作确认和护栏。</li><li>第 18 章：工具型 agent 变成服务后的 timeout / rate limit。</li></ul><h2 id="自检练习" tabindex="-1">自检练习 <a class="header-anchor" href="#自检练习" aria-label="Permalink to &quot;自检练习&quot;">​</a></h2><p>设计一个 <code>sendEmail</code> 工具：</p><ul><li>参数 schema 怎么写？</li><li>哪些字段需要校验？</li><li>哪些场景必须人工确认？</li><li>发送失败怎么回传给模型？</li></ul><h2 id="记住一句话" tabindex="-1">记住一句话 <a class="header-anchor" href="#记住一句话" aria-label="Permalink to &quot;记住一句话&quot;">​</a></h2><p>模型可以请求工具；执行权永远属于你的代码。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("agent-basics/06-tool-calling-mental-model.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _06ToolCallingMentalModel = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  _06ToolCallingMentalModel as default
};
