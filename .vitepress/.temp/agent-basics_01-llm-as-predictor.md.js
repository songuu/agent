import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"B1 · LLM 是预测器，不是数据库","description":"","frontmatter":{},"headers":[],"relativePath":"agent-basics/01-llm-as-predictor.md","filePath":"agent-basics/01-llm-as-predictor.md","lastUpdated":1782376068000}');
const _sfc_main = { name: "agent-basics/01-llm-as-predictor.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="b1-·-llm-是预测器-不是数据库" tabindex="-1">B1 · LLM 是预测器，不是数据库 <a class="header-anchor" href="#b1-·-llm-是预测器-不是数据库" aria-label="Permalink to &quot;B1 · LLM 是预测器，不是数据库&quot;">​</a></h1><blockquote><p>目标：先纠正最容易错的心智模型。LLM 不是事实数据库，也不是会自动联网的知识库；它是在给定上下文里预测下一个 token 的模型。</p></blockquote><h2 id="核心判断" tabindex="-1">核心判断 <a class="header-anchor" href="#核心判断" aria-label="Permalink to &quot;核心判断&quot;">​</a></h2><table tabindex="0"><thead><tr><th>误解</th><th>更准确的说法</th><th>工程后果</th></tr></thead><tbody><tr><td>“模型知道答案”</td><td>模型生成看起来像答案的文本</td><td>重要事实必须检索、校验、引用</td></tr><tr><td>“模型会记住上次对话”</td><td>模型只看本次请求带入的 messages</td><td>历史需要由应用回灌</td></tr><tr><td>“模型会执行我的要求”</td><td>模型只输出文本或工具调用请求</td><td>执行权必须在本地代码</td></tr><tr><td>“模型说得自信就是真的”</td><td>置信语气不是事实保证</td><td>需要 eval、来源和拒答策略</td></tr></tbody></table><h2 id="为什么会编造" tabindex="-1">为什么会编造 <a class="header-anchor" href="#为什么会编造" aria-label="Permalink to &quot;为什么会编造&quot;">​</a></h2><p>LLM 的训练目标是让输出在语境里高概率成立，不是保证每个断言都可追溯。它可以把真实模式、近似概念、错误记忆和上下文暗示混成一段很流畅的话。</p><p>工程上不要问“怎么让模型永远不编造”，而是问：</p><ul><li>这类问题是否需要外部事实源。</li><li>事实源能否被检索、引用、版本化。</li><li>没有证据时应该拒答、追问还是降级。</li><li>输出是否进入高风险动作，比如发邮件、写数据库、执行命令。</li></ul><h2 id="能力边界" tabindex="-1">能力边界 <a class="header-anchor" href="#能力边界" aria-label="Permalink to &quot;能力边界&quot;">​</a></h2><table tabindex="0"><thead><tr><th>能力</th><th>模型擅长</th><th>模型不擅长</th><th>应用层补法</th></tr></thead><tbody><tr><td>语言</td><td>改写、总结、分类、解释</td><td>保证每个事实最新</td><td>接检索、引用和日期</td></tr><tr><td>推理</td><td>多步拆解、假设比较</td><td>长链条精确计算</td><td>工具计算、单元测试</td></tr><tr><td>知识</td><td>常识、公开模式、训练期知识</td><td>私有数据、实时状态</td><td>RAG、API、数据库</td></tr><tr><td>计划</td><td>给出候选步骤</td><td>判断真实环境是否完成</td><td>执行器和验收信号</td></tr></tbody></table><h2 id="课程连接" tabindex="-1">课程连接 <a class="header-anchor" href="#课程连接" aria-label="Permalink to &quot;课程连接&quot;">​</a></h2><ul><li>第 02 章解释一次 LLM 调用为什么是无状态函数。</li><li>第 07 章处理短期记忆和上下文窗口。</li><li>第 08/09 章用 embedding 和 RAG 补外部知识。</li><li>第 15 章用 eval 判断质量是否退化。</li></ul><h2 id="常见误区" tabindex="-1">常见误区 <a class="header-anchor" href="#常见误区" aria-label="Permalink to &quot;常见误区&quot;">​</a></h2><ol><li>把 prompt 写得更强硬，试图替代事实校验。</li><li>让模型“自己检查引用”，但不给它真实来源。</li><li>让模型做金额、日期、权限等精确判断，却不调用工具。</li><li>将旧训练知识当成当前真实状态。</li></ol><h2 id="自检练习" tabindex="-1">自检练习 <a class="header-anchor" href="#自检练习" aria-label="Permalink to &quot;自检练习&quot;">​</a></h2><p>拿一个问题：“我们产品今天线上还有多少活跃用户？”</p><p>回答下面四个问题：</p><ul><li>模型单独能不能回答？为什么？</li><li>需要哪些真实数据源？</li><li>如果数据源不可用，应该拒答、推断还是追问？</li><li>输出里哪些内容必须带来源或查询时间？</li></ul><h2 id="记住一句话" tabindex="-1">记住一句话 <a class="header-anchor" href="#记住一句话" aria-label="Permalink to &quot;记住一句话&quot;">​</a></h2><p>LLM 负责生成候选答案；应用负责提供事实、约束、执行和验证。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("agent-basics/01-llm-as-predictor.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _01LlmAsPredictor = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  _01LlmAsPredictor as default
};
