/**
 * 第 07 章 · 短期记忆的核心：Conversation 类
 *
 * WHY: 回扣第 02 章——LLM 是「无状态」的，它不会记得你上一句说了什么。
 * 所谓「记忆」，本质就是我们在客户端手动维护一个 messages 数组，每次调用时
 * 把历史一并塞回去。但窗口有限、token 成本随轮次线性（甚至更糟）增长，
 * 所以不能无脑堆历史。本类用两招控制规模：
 *   1) 滑动窗口：只保留「最近 N 轮」原文。
 *   2) LLM 摘要压缩：历史超过阈值时，把更早的对话交给模型压成一条摘要消息，
 *      用一条短消息替换掉一大段旧历史，从而既省 token 又保住关键信息。
 *
 * 设计取舍（YAGNI）：这里只做短期记忆，不做持久化、不做向量检索（那是第 08 章之后的事）。
 */
import type { LLMClient, Message } from "../../src/shared/llm/types";

/** Conversation 的可调参数。给默认值是为了开箱即用，业务侧按成本/效果再调。 */
export interface ConversationOptions {
  /** 与模型交互用的客户端（一律走 getLLM()，不直接耦合厂商 SDK）。 */
  client: LLMClient;
  /** 贯穿整段对话的系统提示（不计入滑动窗口，始终单独保留）。 */
  system?: string;
  /**
   * 滑动窗口大小：保留最近多少「轮」原文。
   * 一轮 = 一条 user + 一条 assistant（这里按消息条数 keepRecentTurns*2 估算）。
   */
  keepRecentTurns?: number;
  /**
   * 触发摘要压缩的阈值：当「可压缩历史」的消息条数超过它时，执行一次压缩。
   * WHY: 不是每条都压，而是攒够一批再压，避免频繁调用 LLM 反而更贵。
   */
  summarizeThreshold?: number;
}

/** 压缩发生时回调，便于 demo / 日志观测「什么时候压了、压了多少」。 */
export type OnSummarize = (info: {
  removedMessages: number;
  summary: string;
}) => void;

const DEFAULT_KEEP_RECENT_TURNS = 3;
const DEFAULT_SUMMARIZE_THRESHOLD = 6;

/**
 * 一段可自我管理规模的对话。
 *
 * 内部把消息分成三段，发送给模型时按顺序拼接：
 *   [system?]  +  [summary?(一条 assistant 摘要)]  +  [recent 原文窗口]
 *
 * - system：固定不变。
 * - summary：把「窗口之外的旧历史」压成的一条消息，可能随对话推进被反复刷新。
 * - recent：最近 N 轮的原文，保证近距离细节不失真。
 */
export class Conversation {
  private readonly client: LLMClient;
  private readonly system?: string;
  private readonly keepRecentMessages: number;
  private readonly summarizeThreshold: number;

  /** 已压缩的旧历史摘要（一句话/一段话）。空字符串表示还没产生过摘要。 */
  private summary = "";
  /** 滑动窗口内的原文消息（user / assistant 交替）。 */
  private recent: Message[] = [];

  constructor(options: ConversationOptions) {
    this.client = options.client;
    this.system = options.system;
    // 轮 → 条：一轮约等于 2 条消息（user + assistant）。用 ! 之外用判空更稳妥。
    const turns = options.keepRecentTurns ?? DEFAULT_KEEP_RECENT_TURNS;
    this.keepRecentMessages = Math.max(2, turns * 2);
    this.summarizeThreshold = options.summarizeThreshold ?? DEFAULT_SUMMARIZE_THRESHOLD;
  }

  /** 当前摘要文本（只读视角，便于 demo 展示「记忆被压成了什么」）。 */
  get currentSummary(): string {
    return this.summary;
  }

  /** 当前窗口内保留的原文消息条数（便于观测规模）。 */
  get recentCount(): number {
    return this.recent.length;
  }

  /**
   * 追加一条消息到窗口。注意这里只「记录」，不调用模型。
   * WHY: 把「记录历史」与「请求模型」解耦——发言由 ask() 触发，
   * 但有时我们也想手动塞入一条历史（比如预置背景），所以单独开放 append()。
   */
  append(message: Message): void {
    // 不可变更新：永远新建数组，不在原数组上 push 之外做隐式改写。
    this.recent = [...this.recent, message];
  }

  /**
   * 组装本次真正要发给模型的完整 messages。
   * 顺序：摘要（若有）放在最前，模拟「先读一遍前情提要，再看最近对话」。
   */
  buildMessages(): Message[] {
    const result: Message[] = [];
    if (this.summary) {
      // 用 assistant 角色承载摘要：相当于模型「自己记下的笔记」，比塞进 system 更自然。
      result.push({
        role: "assistant",
        content: `【前情摘要】${this.summary}`,
      });
    }
    return [...result, ...this.recent];
  }

  /**
   * 发起一轮对话：把用户输入入栈 → 必要时压缩 → 请求模型 → 把回复入栈 → 返回回复文本。
   *
   * 这是「记忆」生效的关键路径：每次都把（摘要 + 最近窗口）一并发给无状态的模型，
   * 模型才能「记得」前面提过的名字、偏好等信息。
   */
  async ask(userInput: string, onSummarize?: OnSummarize): Promise<string> {
    this.append({ role: "user", content: userInput });

    // 先尝试压缩，确保发送前规模已受控（避免「先超窗、再压」的浪费）。
    await this.compactIfNeeded(onSummarize);

    const result = await this.client.chat({
      system: this.system,
      messages: this.buildMessages(),
    });

    this.append({ role: "assistant", content: result.text });
    return result.text;
  }

  /**
   * 规模超阈值时执行一次摘要压缩：
   *   把「窗口之外的旧消息」交给 LLM 压成一段摘要，与已有摘要合并，
   *   旧消息随即从窗口移除——这就是「用一条短消息换掉一大段历史」。
   */
  private async compactIfNeeded(onSummarize?: OnSummarize): Promise<void> {
    // 需要被保留在窗口里的「最近原文」之外，还剩多少条旧历史。
    const overflow = this.recent.length - this.keepRecentMessages;
    if (overflow < this.summarizeThreshold) return;

    // 取出窗口外、待压缩的旧历史；其余（最近 keepRecentMessages 条）保留原文。
    const toSummarize = this.recent.slice(0, overflow);
    const kept = this.recent.slice(overflow);

    const newSummary = await this.summarize(toSummarize);

    // 不可变更新：先更新摘要，再收缩窗口。
    this.summary = newSummary;
    this.recent = kept;

    onSummarize?.({ removedMessages: toSummarize.length, summary: newSummary });
  }

  /**
   * 调用 LLM 把一段旧历史压成简短摘要。
   * WHY: 摘要本身也是一次 LLM 调用，所以提示词要明确「保留实体/数字/偏好/未决事项」，
   * 否则压缩会丢掉后续对话依赖的关键事实，记忆就「失忆」了。
   */
  private async summarize(messages: Message[]): Promise<string> {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
      .join("\n");

    // 若已有旧摘要，把它一并喂进去做「滚动摘要」，防止越早的信息越容易丢。
    const previous = this.summary ? `已有摘要：${this.summary}\n\n` : "";

    const result = await this.client.chat({
      system:
        "你是对话记忆压缩器。把给定对话压成一段中文摘要，" +
        "务必保留：人名、数字、用户偏好、已做的决定、尚未解决的事项。" +
        "不要编造、不要寒暄，直接输出摘要本身。",
      messages: [
        {
          role: "user",
          content: `${previous}请压缩下面这段对话：\n\n${transcript}`,
        },
      ],
    });

    return result.text.trim();
  }
}
