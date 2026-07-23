import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"AI 资讯","description":"","frontmatter":{"title":"AI 资讯","aside":false},"headers":[],"relativePath":"news/index.md","filePath":"news/index.md","lastUpdated":1781666647000}');
const _sfc_main = { name: "news/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="ai-资讯-·-每日自动收集" tabindex="-1">AI 资讯 · 每日自动收集 <a class="header-anchor" href="#ai-资讯-·-每日自动收集" aria-label="Permalink to &quot;AI 资讯 · 每日自动收集&quot;">​</a></h1><blockquote><p>本页资讯由 <a href="https://github.com/songuu/agent/tree/master/news-collector" target="_blank" rel="noreferrer"><code>news-collector</code></a> 定时从多源 RSS 聚合自动收集， 经规则分类落入第 19 章的八层生态框架，写入 Supabase <code>news_items</code>，页面只读公开 anon 配置渲染。 与第 <a href="/lessons/20-agent-frontier-news/">20 章 · 前沿文章库</a> 使用同一条文章数据流；日历按 <code>published_date</code> 筛选。</p></blockquote><div data-daily-news></div><hr><h2 id="这套收集系统怎么运转" tabindex="-1">这套收集系统怎么运转 <a class="header-anchor" href="#这套收集系统怎么运转" aria-label="Permalink to &quot;这套收集系统怎么运转&quot;">​</a></h2><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>多源 RSS/Atom（量子位 / The Decoder / arXiv / Hacker News / Google AI / …）</span></span>
<span class="line"><span>   │  抓取（单源故障隔离：某源挂了只跳过，不影响其它源）</span></span>
<span class="line"><span>   ▼</span></span>
<span class="line"><span>归一化（canonical URL 去跟踪参 / 清洗摘要 / sha256 身份）</span></span>
<span class="line"><span>   │</span></span>
<span class="line"><span>规则分类（8 层生态 + 实体标签 + 语言；纯函数、确定性）</span></span>
<span class="line"><span>   │  可选 Claude 富化（无 key 自动降级为规则结果）</span></span>
<span class="line"><span>   ▼</span></span>
<span class="line"><span>去重 → 幂等 upsert 到 Supabase news_items（on_conflict=external_id）</span></span>
<span class="line"><span>   ▼</span></span>
<span class="line"><span>本页按【发布时间】与【体系层】筛选展示</span></span></code></pre></div><p>部署为独立 Node 常驻服务（node-cron + pm2/systemd），按 <code>NEWS_CRON</code>（默认每日 08:00 Asia/Shanghai）周期收集。 完整运行/测试/部署说明见仓库 <code>news-collector/README.md</code>。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("news/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
