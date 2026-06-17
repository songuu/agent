---
title: AI 资讯
aside: false
---

# AI 资讯 · 每日自动收集

> 本页资讯由 [`news-collector`](https://github.com/songuu/agent/tree/master/news-collector) 定时从多源 RSS 聚合自动收集，
> 经规则分类落入第 19 章的八层生态框架，写入 Supabase `news_items`，页面只读公开 anon 配置渲染。
> 与第 [20 章 · 前沿文章库](/lessons/20-agent-frontier-news/) 使用同一条文章数据流；日历按 `published_date` 筛选。

<div data-daily-news></div>

---

## 这套收集系统怎么运转

```text
多源 RSS/Atom（量子位 / The Decoder / arXiv / Hacker News / Google AI / …）
   │  抓取（单源故障隔离：某源挂了只跳过，不影响其它源）
   ▼
归一化（canonical URL 去跟踪参 / 清洗摘要 / sha256 身份）
   │
规则分类（8 层生态 + 实体标签 + 语言；纯函数、确定性）
   │  可选 Claude 富化（无 key 自动降级为规则结果）
   ▼
去重 → 幂等 upsert 到 Supabase news_items（on_conflict=external_id）
   ▼
本页按【发布时间】与【体系层】筛选展示
```

部署为独立 Node 常驻服务（node-cron + pm2/systemd），按 `NEWS_CRON`（默认每日 08:00 Asia/Shanghai）周期收集。
完整运行/测试/部署说明见仓库 `news-collector/README.md`。
