/**
 * 第 16 章 · 价格表与费用估算
 *
 * WHY: 成本是生产 agent 绕不开的指标，公式很简单——
 *   费用 = 输入 tokens × 输入单价 + 输出 tokens × 输出单价
 * 难点不在算，而在"单价从哪来、按哪个模型算"。把价格收敛成一张常量表，
 * 既让计费逻辑只有一个事实来源，也方便随官方调价时只改这一处。
 *
 * ⚠️ 注意：下表为「示意价格」，按 $ / 每百万(1M) tokens 计，仅用于教学演示。
 *   真实单价请以各厂商官方价格页为准（且会随时间变化）：
 *     - Anthropic: https://www.anthropic.com/pricing
 *     - OpenAI:    https://openai.com/api/pricing
 */

/** 某个模型的输入/输出单价（单位：美元 / 每百万 tokens）。 */
export interface ModelPrice {
  /** 每百万输入 token 的价格（美元）。 */
  inputPerMillion: number;
  /** 每百万输出 token 的价格（美元）。 */
  outputPerMillion: number;
}

/**
 * 价格表：模型名 → 单价。
 *
 * key 用各厂商真实模型 id（与 src/shared 里的 DEFAULT_MODEL 对齐），
 * 这样拿到 llm.model 就能直接查表，无需手动映射。
 */
export const PRICE_TABLE: Readonly<Record<string, ModelPrice>> = {
  // —— Anthropic（示意）——
  "claude-opus-4-8": { inputPerMillion: 15, outputPerMillion: 75 },
  "claude-sonnet-4-5": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-haiku-4-5": { inputPerMillion: 1, outputPerMillion: 5 },
  // —— OpenAI（示意）——
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
};

/**
 * 查不到模型时的兜底单价。
 *
 * WHY: 生产环境随时可能上线新模型，价格表却没及时更新。与其让计费崩溃，
 * 不如退化到一个保守的默认价，并由调用方决定是否告警——计费宁可不准也不能不算。
 */
export const FALLBACK_PRICE: ModelPrice = { inputPerMillion: 5, outputPerMillion: 15 };

/** 按模型名取单价；未知模型回退到 FALLBACK_PRICE。 */
export function getPrice(model: string): ModelPrice {
  return PRICE_TABLE[model] ?? FALLBACK_PRICE;
}

/**
 * 估算一次调用的费用（美元）。
 *
 * @param model        模型名（用于查价）。
 * @param inputTokens  本次输入 token 数。
 * @param outputTokens 本次输出 token 数。
 */
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = getPrice(model);
  // 单价是「每百万 token」，所以先除以 1_000_000 再相乘
  const inputCost = (inputTokens / 1_000_000) * price.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * price.outputPerMillion;
  return inputCost + outputCost;
}

/** 把美元金额格式化成可读字符串（保留 6 位小数，单次调用费用常常很小）。 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(6)}`;
}
