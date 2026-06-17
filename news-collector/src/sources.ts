// 新闻源注册表。
//
// 每个源都是公开 RSS/Atom feed，2026-06-17 实测可用性见下方注释。
// 间歇不稳定的源（HF/OpenAI/Anthropic）仍保留 enabled，由 rss.ts 的故障隔离兜底：
// 单源失败只 skip+log，不影响其它源——这是真实聚合器的核心健壮性。

import type { NewsSource } from "./types.ts";

export const SOURCES: readonly NewsSource[] = [
  // —— 实测稳定 ——
  {
    key: "qbitai",
    name: "量子位",
    url: "https://www.qbitai.com/feed",
    kind: "cn-media",
    lang: "zh",
    enabled: true,
  },
  {
    key: "the-decoder",
    name: "The Decoder",
    url: "https://the-decoder.com/feed/",
    kind: "en-media",
    lang: "en",
    enabled: true,
  },
  {
    key: "arxiv-cs-ai",
    name: "arXiv cs.AI",
    url: "http://export.arxiv.org/rss/cs.AI",
    kind: "paper",
    lang: "en",
    enabled: true,
  },
  {
    key: "hn-ai",
    name: "Hacker News · AI",
    url: "https://hnrss.org/newest?q=AI+OR+LLM+OR+agent&count=30",
    kind: "community",
    lang: "en",
    enabled: true,
  },
  {
    key: "google-ai",
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
    kind: "vendor-blog",
    lang: "en",
    layerHint: "model-platform",
    enabled: true,
  },
  {
    key: "deepmind",
    name: "Google DeepMind Blog",
    url: "https://deepmind.google/blog/rss.xml",
    kind: "vendor-blog",
    lang: "en",
    layerHint: "model-platform",
    enabled: true,
  },
  {
    key: "microsoft-ai-source",
    name: "Microsoft Source · AI",
    url: "https://news.microsoft.com/source/topics/ai/feed/",
    kind: "vendor-blog",
    lang: "en",
    layerHint: "model-platform",
    enabled: true,
  },
  {
    key: "aws-ml",
    name: "AWS Machine Learning Blog",
    url: "https://aws.amazon.com/blogs/machine-learning/feed/",
    kind: "vendor-blog",
    lang: "en",
    layerHint: "runtime",
    enabled: true,
  },
  {
    key: "nvidia-deep-learning",
    name: "NVIDIA Deep Learning",
    url: "https://blogs.nvidia.com/blog/category/deep-learning/feed/",
    kind: "vendor-blog",
    lang: "en",
    layerHint: "model-platform",
    enabled: true,
  },
  {
    key: "infoq-ai",
    name: "InfoQ AI/ML/Data Engineering",
    url: "https://feed.infoq.com/ai-ml-data-eng",
    kind: "en-media",
    lang: "en",
    layerHint: "runtime",
    enabled: true,
  },
  {
    key: "venturebeat-ai",
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/feed/",
    kind: "en-media",
    lang: "en",
    layerHint: "product-ui",
    enabled: true,
  },
  {
    key: "mit-tr",
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    kind: "en-media",
    lang: "en",
    enabled: true,
  },
  {
    key: "ahead-of-ai",
    name: "Ahead of AI",
    url: "https://magazine.sebastianraschka.com/feed",
    kind: "en-media",
    lang: "en",
    layerHint: "foundation",
    enabled: true,
  },
  // —— best-effort（间歇 502，靠故障隔离兜底）——
  {
    key: "huggingface",
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    kind: "vendor-blog",
    lang: "en",
    enabled: true,
  },
  {
    key: "openai",
    name: "OpenAI News",
    url: "https://openai.com/news/rss.xml",
    kind: "vendor-blog",
    lang: "en",
    layerHint: "model-platform",
    enabled: true,
  },
  {
    key: "anthropic",
    name: "Anthropic News",
    // 无已验证的公开 RSS（旧 /rss.xml 返回 404）。默认关闭，待确认地址后再开。
    url: "https://www.anthropic.com/rss.xml",
    kind: "vendor-blog",
    lang: "en",
    layerHint: "model-platform",
    enabled: false,
  },
];

/** 仅取启用的源；cron/collect 都走这个入口。 */
export function enabledSources(): readonly NewsSource[] {
  return SOURCES.filter((source) => source.enabled);
}

export function findSource(key: string): NewsSource | undefined {
  return SOURCES.find((source) => source.key === key);
}
