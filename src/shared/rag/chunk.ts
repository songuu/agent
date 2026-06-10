/**
 * 分块（chunking）策略库。第 09 章用「字符级滑动窗口」讲清原理，这里补上生产里更常用的
 * 两种：递归语义切分（recursiveChunk）与 Markdown 标题感知切分（markdownChunk）。
 *
 * 为什么分块策略重要？检索质量的上限很大程度由切块决定：
 *  - 切太大：一个向量混入多主题，召回钝、还浪费上下文预算。
 *  - 切太小：把一个完整事实割裂到多块，任何一块都答不全。
 *  - 盲按字符切：常把一句话/一个代码块/一个表格从中间截断。
 * 递归切分的思路是「优先在语义边界（段落 > 句子 > 词）下刀」，并按 token（而非字符）控大小。
 */

export interface Chunk {
  /** 块序号（从 0 开始），可用作引用编号。 */
  index: number;
  /** 块文本。 */
  text: string;
  /** 可选元数据（如 markdownChunk 会带上标题路径）。 */
  metadata?: Record<string, unknown>;
}

/**
 * 粗略 token 估算：CJK 字按 1 token，其余字符按每 4 个约 1 token。
 * 仅用于「控制块大小」的相对比较，不追求与具体分词器精确一致。
 */
export function approxTokens(text: string): number {
  const cjk = (text.match(/[一-鿿぀-ヿ가-힯]/g) ?? []).length;
  const rest = text.length - cjk;
  return cjk + Math.ceil(rest / 4);
}

// ── 1) 字符级滑动窗口（= 第 09 章版本，作为最直观的基线）────────────────────────

export interface SlidingWindowOptions {
  /** 每块目标字符数（不含重叠）。 */
  size?: number;
  /** 相邻块重叠字符数，必须小于 size。 */
  overlap?: number;
}

/** 按「固定字符长度 + 重叠」切块。简单直观，适合讲原理。 */
export function slidingWindowChunk(text: string, options: SlidingWindowOptions = {}): Chunk[] {
  const size = options.size ?? 300;
  const overlap = options.overlap ?? 60;
  if (size <= 0) throw new Error(`chunk size 必须为正数，收到：${size}`);
  if (overlap < 0 || overlap >= size) {
    throw new Error(`overlap 必须满足 0 <= overlap < size，收到：overlap=${overlap}, size=${size}`);
  }
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const chunks: Chunk[] = [];
  const step = size - overlap;
  let start = 0;
  let index = 0;
  while (start < normalized.length) {
    const piece = normalized.slice(start, start + size).trim();
    if (piece.length > 0) {
      chunks.push({ index, text: piece });
      index += 1;
    }
    start += step;
  }
  return chunks;
}

// ── 2) 递归语义切分（recursive character text splitter）──────────────────────

export interface RecursiveChunkOptions {
  /** 目标块大小（按 approxTokens 估算），默认 256。 */
  chunkSize?: number;
  /** 相邻块重叠（token），默认 40。 */
  overlap?: number;
  /** 切分边界优先级，从粗到细；"" 表示按字符兜底。 */
  separators?: string[];
}

/** 默认分隔符：段落 → 行 → 中英文句末 → 分句 → 词 → 字符兜底。 */
const DEFAULT_SEPARATORS = ["\n\n", "\n", "。", "！", "？", "; ", "；", ". ", "，", ", ", " ", ""];

/**
 * 第一阶段：把文本递归切成「原子片段」，保证每个原子都不超过 chunkSize。
 * 选第一个出现在文本中的分隔符切；若某段仍过大，用更细的分隔符继续递归。
 */
function splitToAtoms(text: string, separators: string[], chunkSize: number): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];
  if (approxTokens(trimmed) <= chunkSize) return [trimmed];

  const sepIdx = separators.findIndex((s) => s !== "" && trimmed.includes(s));
  if (sepIdx === -1) {
    // 没有可用分隔符：按字符硬切兜底（极少触发，如超长无空格串）。
    const atoms: string[] = [];
    const step = Math.max(1, chunkSize);
    for (let i = 0; i < trimmed.length; i += step) {
      const piece = trimmed.slice(i, i + step).trim();
      if (piece.length > 0) atoms.push(piece);
    }
    return atoms;
  }

  const sep = separators[sepIdx]!;
  const rest = separators.slice(sepIdx + 1);
  const parts = trimmed.split(sep).map((p) => p.trim()).filter((p) => p.length > 0);
  const atoms: string[] = [];
  for (const part of parts) {
    if (approxTokens(part) <= chunkSize) atoms.push(part);
    else atoms.push(...splitToAtoms(part, rest.length ? rest : [""], chunkSize));
  }
  return atoms;
}

/**
 * 第二阶段：把原子贪心打包成块（尽量不超过 chunkSize），开新块时从上一块尾部
 * 回带若干原子覆盖 overlap，实现块间重叠。
 *
 * 两条保证块大小可控、且永不死循环的关键规则：
 *  1) 回带的重叠原子总量不超过 overlap（overlap 调用前已夹到 ≤ chunkSize/2），
 *     避免「把上一块整块当重叠」导致新块翻倍。
 *  2) 只有当前块里已经有「至少一个本轮新加的原子」时才允许 flush（hasFresh 守卫），
 *     保证每个触发 flush 的原子一定会被消费，块大小上界 ≈ overlap + 单原子 ≤ 1.5×chunkSize。
 */
function mergeWithOverlap(
  atoms: string[],
  chunkSize: number,
  overlap: number,
  joiner = " ",
): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;
  let hasFresh = false; // 自上次 flush 起是否已加入新原子
  for (const atom of atoms) {
    const t = approxTokens(atom);
    if (currentTokens + t > chunkSize && hasFresh) {
      chunks.push(current.join(joiner));
      // 回带尾部原子作为重叠，但总量不超过 overlap 预算。
      const carried: string[] = [];
      let carriedTokens = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const a = current[i]!;
        const at = approxTokens(a);
        if (carriedTokens + at > overlap) break;
        carried.unshift(a);
        carriedTokens += at;
      }
      current = carried;
      currentTokens = carriedTokens;
      hasFresh = false;
    }
    current.push(atom);
    currentTokens += t;
    hasFresh = true;
  }
  if (hasFresh) chunks.push(current.join(joiner));
  return chunks;
}

/** 递归语义切分：优先在语义边界下刀，按 token 控大小，块间带重叠。 */
export function recursiveChunk(text: string, options: RecursiveChunkOptions = {}): Chunk[] {
  const chunkSize = options.chunkSize ?? 256;
  if (chunkSize <= 0) throw new Error(`chunkSize 必须为正数，收到：${chunkSize}`);
  // overlap 夹到 ≤ chunkSize/2：保证重叠不会反过来把块撑到 2 倍大。
  const overlap = Math.max(0, Math.min(options.overlap ?? 40, Math.floor(chunkSize / 2)));
  const separators = options.separators ?? DEFAULT_SEPARATORS;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length === 0) return [];
  const atoms = splitToAtoms(normalized, separators, chunkSize);
  const merged = mergeWithOverlap(atoms, chunkSize, overlap);
  return merged.map((t, index) => ({ index, text: t }));
}

// ── 3) Markdown 标题感知切分 ────────────────────────────────────────────────

interface MarkdownSection {
  /** 标题路径，如 "安装 > Windows"。 */
  heading: string;
  body: string[];
}

/**
 * 按 Markdown 标题分节，保留「标题路径」作为上下文，再对每节做递归切分。
 * WHY: 文档结构本身就是很好的语义边界；把标题路径前缀进块，能让检索片段「自带出处」，
 * 既提升召回，也让答案更易溯源。
 */
export function markdownChunk(text: string, options: RecursiveChunkOptions = {}): Chunk[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: MarkdownSection[] = [];
  let headingStack: string[] = [];
  let current: MarkdownSection = { heading: "", body: [] };

  const flush = (): void => {
    if (current.heading || current.body.join("").trim().length > 0) sections.push(current);
  };

  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      const level = m[1]!.length;
      const title = m[2]!.trim();
      headingStack = headingStack.slice(0, level - 1);
      while (headingStack.length < level - 1) headingStack.push("");
      headingStack.push(title);
      const path = headingStack.filter((h) => h.length > 0).join(" > ");
      current = { heading: path, body: [] };
    } else {
      current.body.push(line);
    }
  }
  flush();

  const chunks: Chunk[] = [];
  let index = 0;
  for (const sec of sections) {
    const body = sec.body.join("\n").trim();
    if (body.length === 0) continue;
    for (const sub of recursiveChunk(body, options)) {
      const prefixed = sec.heading ? `【${sec.heading}】\n${sub.text}` : sub.text;
      chunks.push({
        index: index++,
        text: prefixed,
        ...(sec.heading ? { metadata: { heading: sec.heading } } : {}),
      });
    }
  }
  return chunks;
}
