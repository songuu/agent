import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"B3 · Token、延迟与成本直觉","description":"","frontmatter":{},"headers":[],"relativePath":"agent-basics/03-token-latency-cost.md","filePath":"agent-basics/03-token-latency-cost.md","lastUpdated":1782376068000}');
const _sfc_main = { name: "agent-basics/03-token-latency-cost.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="b3-·-token、延迟与成本直觉" tabindex="-1">B3 · Token、延迟与成本直觉 <a class="header-anchor" href="#b3-·-token、延迟与成本直觉" aria-label="Permalink to &quot;B3 · Token、延迟与成本直觉&quot;">​</a></h1><blockquote><p>目标：建立预算意识。Agent 的质量问题常常不是模型不够强，而是上下文太长、步骤太多、工具太贵、输出太散。</p></blockquote><h2 id="token-是什么" tabindex="-1">Token 是什么 <a class="header-anchor" href="#token-是什么" aria-label="Permalink to &quot;Token 是什么&quot;">​</a></h2><p>Token 是模型处理文本的基本单位。中文、英文、符号、代码都会被切成 token。你不需要背精确算法，但必须知道：</p><ul><li>输入 token 越多，成本越高。</li><li>输出 token 越多，延迟越高。</li><li>多轮 agent loop 会把历史和工具结果继续带入后续请求。</li><li>RAG 检索片段会快速占满上下文。</li></ul><h2 id="成本来源" tabindex="-1">成本来源 <a class="header-anchor" href="#成本来源" aria-label="Permalink to &quot;成本来源&quot;">​</a></h2><table tabindex="0"><thead><tr><th>成本项</th><th>来自哪里</th><th>常见失控点</th></tr></thead><tbody><tr><td>输入 token</td><td>system、历史、检索、工具结果</td><td>原样塞全文、重复塞相同资料</td></tr><tr><td>输出 token</td><td>模型回答、计划、解释</td><td>让模型无限展开、缺少长度约束</td></tr><tr><td>步数</td><td>agent loop 多轮调用</td><td>没有 maxSteps、工具失败后反复尝试</td></tr><tr><td>工具</td><td>搜索、数据库、外部 API</td><td>每轮重复查同一份数据</td></tr><tr><td>评估</td><td>LLM-as-judge、回归集</td><td>每次提交跑全量高成本 eval</td></tr></tbody></table><h2 id="延迟拆解" tabindex="-1">延迟拆解 <a class="header-anchor" href="#延迟拆解" aria-label="Permalink to &quot;延迟拆解&quot;">​</a></h2><p>一次 agent 响应通常包含：</p><ol><li>请求排队。</li><li>模型首 token 时间。</li><li>模型输出时间。</li><li>工具调用时间。</li><li>后续模型轮次。</li></ol><p>流式输出只能改善用户感知，不会减少总计算成本。真正降低成本需要减少上下文、步骤和无效工具调用。</p><h2 id="预算策略" tabindex="-1">预算策略 <a class="header-anchor" href="#预算策略" aria-label="Permalink to &quot;预算策略&quot;">​</a></h2><table tabindex="0"><thead><tr><th>场景</th><th>建议</th></tr></thead><tbody><tr><td>长对话</td><td>最近 N 轮原文 + 摘要</td></tr><tr><td>RAG</td><td>top-k 小而精，先 rerank 再打包</td></tr><tr><td>工具循环</td><td>maxSteps + 每类工具调用上限</td></tr><tr><td>结构化输出</td><td>schema 限制字段和长度</td></tr><tr><td>eval</td><td>smoke 集每次跑，完整集定时或发布前跑</td></tr></tbody></table><h2 id="课程连接" tabindex="-1">课程连接 <a class="header-anchor" href="#课程连接" aria-label="Permalink to &quot;课程连接&quot;">​</a></h2><ul><li>第 07 章：短期记忆与摘要压缩。</li><li>第 11 章：多 agent 并发时的步骤和成本放大。</li><li>第 16 章：trace、token usage、预算告警。</li><li>RAG R11：检索后上下文工程。</li></ul><h2 id="自检练习" tabindex="-1">自检练习 <a class="header-anchor" href="#自检练习" aria-label="Permalink to &quot;自检练习&quot;">​</a></h2><p>给一个 research agent 设预算：</p><ul><li>最多搜索几次？</li><li>每次保留几段资料？</li><li>每段最长多少 token？</li><li>最终答案最长多少字？</li><li>什么时候停止并说明证据不足？</li></ul><h2 id="记住一句话" tabindex="-1">记住一句话 <a class="header-anchor" href="#记住一句话" aria-label="Permalink to &quot;记住一句话&quot;">​</a></h2><p>Agent 的预算不是上线后才算；它必须写进循环、检索和输出契约。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("agent-basics/03-token-latency-cost.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _03TokenLatencyCost = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  _03TokenLatencyCost as default
};
