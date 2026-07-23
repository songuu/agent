import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Notion 文章","description":"","frontmatter":{"title":"Notion 文章","aside":false},"headers":[],"relativePath":"notion/index.md","filePath":"notion/index.md","lastUpdated":1781690914000}');
const _sfc_main = { name: "notion/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="notion-文章-·-全文同步" tabindex="-1">Notion 文章 · 全文同步 <a class="header-anchor" href="#notion-文章-·-全文同步" aria-label="Permalink to &quot;Notion 文章 · 全文同步&quot;">​</a></h1><blockquote><p>本页文章由 <a href="https://github.com/songuu/agent/tree/master/news-collector/src/notion" target="_blank" rel="noreferrer"><code>notion-sync</code></a> 从配置的 Notion 文件夹/页面子树<strong>全文同步</strong>而来： 页面 blocks 转 markdown、图片重托管到稳定存储，写入 Supabase <code>notion_articles</code>，本页只读公开 anon 配置渲染。 同步由 <code>pnpm notion:sync</code>（手动）或独立 cron（<code>NOTION_CRON</code>，默认每日 08:30）触发，增量、幂等。</p></blockquote><div data-notion-articles></div><hr><h2 id="怎么接入自己的-notion" tabindex="-1">怎么接入自己的 Notion <a class="header-anchor" href="#怎么接入自己的-notion" aria-label="Permalink to &quot;怎么接入自己的 Notion&quot;">​</a></h2><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>1. 在 Notion 建 integration，拿 NOTION_TOKEN（只进 .env，绝不提交）</span></span>
<span class="line"><span>2. 把目标文件夹/根页面共享给该 integration</span></span>
<span class="line"><span>3. 在 news-collector/src/notion/notion-sources.ts 填 folder source 的 rootPageId，enabled:true</span></span>
<span class="line"><span>4. 先执行 supabase/migrations/20260617140000_create_notion_articles.sql 建表</span></span>
<span class="line"><span>5. pnpm notion:sync —— 全文 + 图片同步进库，本页即时可见（无需 rebuild）</span></span></code></pre></div><p>详见仓库 <code>news-collector/src/notion/</code>。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("notion/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
