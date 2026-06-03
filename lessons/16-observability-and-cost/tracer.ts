/**
 * 第 16 章 · 轻量 Tracer（可观测性核心）
 *
 * WHY: 生产 agent 一次任务会展开成「多步 × 多次 LLM 调用 × 多次工具」，
 * 出问题时只看最终结果根本无法定位"慢在哪、贵在哪"。可观测性的第一性原理是：
 *   在每一次外部调用的"进出"两端打点，记录 model / tokens / 耗时，事后才能复盘。
 *
 * 这里用「装饰器模式」包住 LLMClient：对外仍是同一个 LLMClient 接口（透明替换，
 * 课程其它代码 runAgent 一行不用改），对内在每次 chat() 前后记录一条 span。
 * 真实项目会把这些 span 上报到 LangSmith / OpenTelemetry，原理与此完全一致。
 */
import { performance } from "node:perf_hooks";
import type { ChatOptions, ChatResult, LLMClient, StreamChunk } from "../../src/shared";
import { estimateCost } from "./pricing";

/** 一次被追踪的 LLM 调用记录（一个 span）。 */
export interface CallSpan {
  /** 第几次调用（从 1 开始），便于和 trace 树对应。 */
  index: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** 本次调用墙钟耗时（毫秒）。 */
  durationMs: number;
  /** 按价格表估算的本次费用（美元）。 */
  costUSD: number;
  /** 归一后的停止原因，tool_use 表示这一步触发了工具。 */
  stopReason: ChatResult["stopReason"];
}

/** 整个 trace 的汇总指标。 */
export interface TraceSummary {
  callCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  totalDurationMs: number;
  spans: CallSpan[];
}

/**
 * 包住一个 LLMClient，记录每次 chat() 的 tokens / 耗时 / 费用。
 *
 * 设计要点：
 *  - 只拦截 chat（agent 循环走的是 chat），stream 透传不计费（演示聚焦 chat）。
 *  - 不吞异常：调用失败照样向上抛，但失败前已无 span（保持"记成功调用"的简单语义）。
 */
export class Tracer {
  private readonly inner: LLMClient;
  private readonly spans: CallSpan[] = [];

  constructor(client: LLMClient) {
    this.inner = client;
  }

  /**
   * 返回一个"带追踪"的 LLMClient，可直接传给 runAgent({ client })。
   *
   * WHY 用闭包返回新对象而非让 Tracer 自己实现接口：保持 Tracer 职责单一
   * （只管收集 span），同时对外暴露的仍是干净的 LLMClient，符合不可变/低耦合偏好。
   */
  client(): LLMClient {
    const self = this;
    return {
      provider: this.inner.provider,
      model: this.inner.model,

      async chat(options: ChatOptions): Promise<ChatResult> {
        // performance.now() 是高精度单调时钟，不受系统时间回拨影响，最适合测耗时
        const startedAt = performance.now();
        const result = await self.inner.chat(options);
        const durationMs = performance.now() - startedAt;

        self.spans.push({
          index: self.spans.length + 1,
          model: self.inner.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          durationMs,
          costUSD: estimateCost(
            self.inner.model,
            result.usage.inputTokens,
            result.usage.outputTokens,
          ),
          stopReason: result.stopReason,
        });
        return result;
      },

      // stream 不在本章计费范围内，原样透传以保证接口完整可用
      stream(options: ChatOptions): AsyncIterable<StreamChunk> {
        return self.inner.stream(options);
      },
    };
  }

  /** 聚合所有 span，得到一次任务的总览指标。 */
  summary(): TraceSummary {
    const totalInputTokens = this.spans.reduce((sum, s) => sum + s.inputTokens, 0);
    const totalOutputTokens = this.spans.reduce((sum, s) => sum + s.outputTokens, 0);
    const totalCostUSD = this.spans.reduce((sum, s) => sum + s.costUSD, 0);
    const totalDurationMs = this.spans.reduce((sum, s) => sum + s.durationMs, 0);
    return {
      callCount: this.spans.length,
      totalInputTokens,
      totalOutputTokens,
      totalCostUSD,
      totalDurationMs,
      // 返回副本，避免外部拿到内部数组后改坏统计（不可变偏好）
      spans: [...this.spans],
    };
  }
}
