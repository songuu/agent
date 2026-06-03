/**
 * 第 14 章 · 流式与交互体验的小工具
 *
 * 抽出来单独成文，是因为这两个能力（打字机节奏、可取消的流消费）会在多个 demo 里复用，
 * 也方便你在练习里替换实现，而不必动主流程 index.ts。
 */
import { color } from "../../src/shared";
import type { StreamChunk } from "../../src/shared/llm/types";

/** sleep 的语义化封装：让"打字机"在每个字符之间停顿一小会儿。 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 打字机式打印一个文本流，并返回拼接后的完整文本。
 *
 * WHY 不直接用 shared 的 printStream：
 *  - printStream 是"来多少打多少"，受网络分块影响，节奏忽快忽慢；
 *  - 这里把流先拆成字符、再用固定间隔吐出，得到稳定的"逐字"观感（聊天产品常见做法）。
 *
 * 注意：节奏感是体验，不是性能。真正的首字延迟取决于模型，本函数只是让"已到达的字"
 * 更均匀地呈现。
 *
 * @param stream  llm.stream(...) 返回的异步可迭代流
 * @param charDelayMs 每个字符之间的停顿（毫秒）。0 表示不节流（等价于原始流速）。
 */
export async function typewriter(
  stream: AsyncIterable<StreamChunk>,
  charDelayMs = 12,
): Promise<string> {
  let full = "";
  process.stdout.write(color("[AI] ", "green"));
  for await (const chunk of stream) {
    if (chunk.type === "text" && chunk.text) {
      // 逐字符吐出，制造打字机节奏
      for (const ch of chunk.text) {
        process.stdout.write(ch);
        full += ch;
        if (charDelayMs > 0) await sleep(charDelayMs);
      }
    }
  }
  process.stdout.write("\n");
  return full;
}

/**
 * 消费一个文本流，但接受一个 AbortSignal：一旦被中止，立刻停止继续消费并返回已收到的部分。
 *
 * WHY 这样实现取消：
 *  课程的 llm.stream() 是一个 async generator，签名里不接收 AbortSignal。
 *  对调用方而言，"取消"最朴素也最可靠的语义是——**停止继续向生成器要数据**。
 *  当我们 `break` 出 for-await 循环时，生成器会被关闭（触发其内部的 return），
 *  从而结束底层请求的消费。这就是"消费侧取消"。
 *
 * 返回值用对象而非裸字符串，是为了让调用方明确知道"是正常读完还是被中断了"，
 * 以便给用户不同的 UX 反馈（完成 vs. 已取消）。
 */
export async function consumeWithAbort(
  stream: AsyncIterable<StreamChunk>,
  signal: AbortSignal,
  onText: (text: string) => void,
): Promise<{ text: string; aborted: boolean }> {
  let full = "";
  // 进入循环前就可能已经被中止（比如超时极短），先做一次短路检查
  if (signal.aborted) return { text: full, aborted: true };

  for await (const chunk of stream) {
    // 每收到一块都检查一次中止标志——这是"协作式取消"：
    // 我们不能强杀异步任务，只能在安全的检查点主动退出。
    if (signal.aborted) {
      return { text: full, aborted: true };
    }
    if (chunk.type === "text" && chunk.text) {
      full += chunk.text;
      onText(chunk.text);
    }
  }
  return { text: full, aborted: false };
}
