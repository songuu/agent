// 规则分类器：把一条资讯映射到 8 层生态框架 + 实体标签 + 语言。
//
// 设计为**纯函数 + 确定性**：同样的输入恒定产出同样的层/标签，不依赖时间、随机或网络。
// 这让分类逻辑可离线单测，也让 fixtures 派生的 seed 可复现（见 [[teaching-demo-deterministic-payoff]]）。
//
// 算法：对每层累计命中关键词数得分，取最高分层；平分时按 LAYER_MATCHERS 顺序（越靠前越具体）
// 决胜；零命中退回源的 layerHint 或 foundation。model-platform 的关键词最宽（含"发布/release"），
// 故排在末位，避免把"协议发布""评测发布"误吞为模型层。

import type {
  Classification,
  EcosystemLayer,
  NewsSource,
  SourceLang,
} from "./types.ts";
import { LAYER_LABELS } from "./types.ts";

interface LayerMatcher {
  readonly layer: EcosystemLayer;
  readonly patterns: readonly RegExp[];
}

// 顺序 = 平分时的优先级（具体层在前，宽泛层在后）。
const LAYER_MATCHERS: readonly LayerMatcher[] = [
  {
    layer: "protocol",
    patterns: [
      /\bMCP\b/i,
      /model context protocol/i,
      /\bA2A\b/i,
      /agent2agent/i,
      /apps sdk/i,
      /interoperab/i,
      /互操作|协议互通|协议/,
    ],
  },
  {
    layer: "security-governance",
    patterns: [
      /prompt injection/i,
      /jailbreak/i,
      /\bowasp\b/i,
      /guardrail/i,
      /护栏/,
      /\bsecurity\b/i,
      /安全/,
      /governance/i,
      /治理/,
      /privacy/i,
      /隐私/,
      /compliance/i,
      /合规/,
      /red.?team/i,
    ],
  },
  {
    layer: "evaluation",
    patterns: [
      /benchmark/i,
      /\beval/i,
      /webarena/i,
      /osworld/i,
      /swe-?bench/i,
      /swe-?agent/i,
      /tau-?bench/i,
      /\bgaia\b/i,
      /leaderboard/i,
      /评测|测评/,
      /基准/,
      /排行榜?/,
    ],
  },
  {
    layer: "data-memory",
    patterns: [
      /\brag\b/i,
      /retrieval-augmented/i,
      /retrieval/i,
      /embedding/i,
      /向量/,
      /vector (db|database|store|search)/i,
      /\bmemory\b/i,
      /记忆/,
      /knowledge base/i,
      /知识库/,
      /context engineering/i,
      /long ?context/i,
      /长上下文/,
    ],
  },
  {
    layer: "runtime",
    patterns: [
      /langgraph/i,
      /langchain/i,
      /\bcrewai\b/i,
      /autogen/i,
      /semantic kernel/i,
      /bedrock agents?/i,
      /orchestrat/i,
      /编排/,
      /\bworkflow\b/i,
      /state machine/i,
      /状态机/,
      /multi-?agent/i,
      /多智能体|多 ?agent/i,
    ],
  },
  {
    layer: "product-ui",
    patterns: [
      /copilot/i,
      /\bcursor\b/i,
      /windsurf/i,
      /operator/i,
      /deep research/i,
      /computer use/i,
      /gui agent/i,
      /browser agent/i,
      /chatgpt/i,
      /claude\.ai/i,
      /助手|应用|插件/,
    ],
  },
  {
    layer: "model-platform",
    patterns: [
      /\bgpt-?\d/i,
      /\bclaude\b/i,
      /\bgemini\b/i,
      /\bllama\b/i,
      /deepseek/i,
      /qwen|通义/i,
      /mistral/i,
      /responses api/i,
      /agents sdk/i,
      /model (release|launch|card)/i,
      /模型/,
      /发布|launch|release|上线|开源|open-?source/i,
    ],
  },
];

const PRIORITY: readonly EcosystemLayer[] = LAYER_MATCHERS.map((m) => m.layer);

// 实体标签：命中即附加，便于展示页按公司/主题二次筛选。
const ENTITY_TAGS: readonly (readonly [RegExp, string])[] = [
  [/openai|chatgpt|\bgpt-?\d/i, "OpenAI"],
  [/anthropic|\bclaude\b/i, "Anthropic"],
  [/google|gemini|deepmind/i, "Google"],
  [/\bmeta\b|llama/i, "Meta"],
  [/microsoft|copilot/i, "Microsoft"],
  [/deepseek/i, "DeepSeek"],
  [/qwen|通义|alibaba|阿里/i, "Alibaba"],
  [/\bMCP\b|model context protocol/i, "MCP"],
  [/langgraph|langchain/i, "LangChain"],
  [/\brag\b|retrieval/i, "RAG"],
  [/benchmark|\beval/i, "Benchmark"],
];

/** 按中英文字符占比判语言；主要作为辅助，源本身的 lang 才是权威。 */
export function detectLang(text: string, fallback: SourceLang = "en"): SourceLang {
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const letters = (text.match(/[a-zA-Z]/g) ?? []).length;
  if (cjk === 0 && letters === 0) return fallback;
  // 含中文且中文占比不低 → 判中文（容忍标题里夹少量英文品牌名）。
  return cjk > 0 && cjk * 2 >= letters ? "zh" : "en";
}

export interface ClassifyInput {
  readonly title: string;
  readonly summary?: string;
}

/** 纯函数：输入文本 + 源 → 体系层 / 标签 / 语言。 */
export function classify(input: ClassifyInput, source: NewsSource): Classification {
  const text = `${input.title} ${input.summary ?? ""}`;

  const scores = new Map<EcosystemLayer, number>();
  for (const matcher of LAYER_MATCHERS) {
    let score = 0;
    for (const pattern of matcher.patterns) {
      if (pattern.test(text)) score += 1;
    }
    if (score > 0) scores.set(matcher.layer, score);
  }

  let layer: EcosystemLayer;
  if (scores.size === 0) {
    layer = source.layerHint ?? "foundation";
  } else {
    layer = [...scores.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return PRIORITY.indexOf(a[0]) - PRIORITY.indexOf(b[0]);
    })[0][0];
  }

  const tags = new Set<string>();
  for (const [pattern, tag] of ENTITY_TAGS) {
    if (pattern.test(text)) tags.add(tag);
  }
  tags.add(LAYER_LABELS[layer]);

  return {
    ecosystemLayer: layer,
    ecosystemLayerLabel: LAYER_LABELS[layer],
    tags: [...tags],
    lang: source.lang,
  };
}
