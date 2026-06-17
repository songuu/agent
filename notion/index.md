---
title: Notion 文章
aside: false
---

# Notion 文章 · 全文同步

> 本页文章由 [`notion-sync`](https://github.com/songuu/agent/tree/master/news-collector/src/notion) 从配置的 Notion 文件夹/页面子树**全文同步**而来：
> 页面 blocks 转 markdown、图片重托管到稳定存储，写入 Supabase `notion_articles`，本页只读公开 anon 配置渲染。
> 同步由 `pnpm notion:sync`（手动）或独立 cron（`NOTION_CRON`，默认每日 08:30）触发，增量、幂等。

<div data-notion-articles></div>

---

## 怎么接入自己的 Notion

```text
1. 在 Notion 建 integration，拿 NOTION_TOKEN（只进 .env，绝不提交）
2. 把目标文件夹/根页面共享给该 integration
3. 在 news-collector/src/notion/notion-sources.ts 填 folder source 的 rootPageId，enabled:true
4. 先执行 supabase/migrations/20260617140000_create_notion_articles.sql 建表
5. pnpm notion:sync —— 全文 + 图片同步进库，本页即时可见（无需 rebuild）
```

详见仓库 `news-collector/src/notion/`。
