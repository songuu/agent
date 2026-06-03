/**
 * 第 09 章配套：自写的「分块（chunk）」工具。
 *
 * WHY 要分块？
 *  1. 检索粒度：整篇文档当成一个向量，语义会被「平均」掉，检索召回不准。
 *     切成小块后，每块聚焦一个局部主题，向量更「锐利」，top-k 检索更精确。
 *  2. 上下文预算：把整篇文档塞进 prompt 既贵又可能超长。只注入命中的少数小块，
 *     既省 token 又减少无关噪声，模型更不容易被带偏。
 *
 * WHY 要重叠（overlap）？
 *  纯按长度硬切，会把一句完整的话/一个事实从中间截断，导致「答案恰好落在两块边界」时
 *  任何一块都检索不全。让相邻块共享一段重叠文字，相当于给边界上「保险」，
 *  保证关键信息至少完整出现在某一块里。
 */

export interface Chunk {
  /** 块的序号（从 0 开始），后面用作「引用编号」让答案可溯源。 */
  index: number;
  /** 块的文本内容。 */
  text: string;
}

export interface ChunkOptions {
  /** 每块的目标字符数（不含重叠）。 */
  size?: number;
  /** 相邻块之间重叠的字符数，必须小于 size。 */
  overlap?: number;
}

/**
 * 按「固定字符长度 + 重叠」把长文本切成多个块。
 *
 * 实现思路：用一个滑动窗口在原文上移动，每次取 [start, start+size) 作为一块，
 * 然后让下一个窗口的起点回退 overlap 个字符，从而与上一块产生重叠。
 *
 * 注意：这里是「字符级」的极简策略，足以讲清原理。真实项目通常按句子/段落/Markdown
 * 标题等语义边界切，并按 token（而非字符）计长——但核心思想完全一致。
 *
 * @param text    原始长文本
 * @param options size（默认 300）/ overlap（默认 60）
 */
export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const size = options.size ?? 300;
  const overlap = options.overlap ?? 60;

  // 输入校验：overlap >= size 会让窗口无法前进，造成死循环——在边界处显式拦截。
  if (size <= 0) {
    throw new Error(`chunk size 必须为正数，收到：${size}`);
  }
  if (overlap < 0 || overlap >= size) {
    throw new Error(`overlap 必须满足 0 <= overlap < size，收到：overlap=${overlap}, size=${size}`);
  }

  // 先把多余空白压成单个换行，避免大段空行污染块内容（也让向量更干净）。
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  const chunks: Chunk[] = [];
  // 滑动窗口每次前进的步长：每块净增 (size - overlap) 个新字符。
  const step = size - overlap;

  let start = 0;
  let index = 0;
  while (start < normalized.length) {
    const piece = normalized.slice(start, start + size).trim();
    // 跳过仅由空白构成的空块（极端情况下切到全是空白的区间）。
    if (piece.length > 0) {
      chunks.push({ index, text: piece });
      index += 1;
    }
    start += step;
  }

  return chunks;
}
