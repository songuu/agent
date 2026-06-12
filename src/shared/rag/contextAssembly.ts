/**
 * 检索后「上下文工程」：把召回片段【装配】成最终提示上下文的纯函数集合。
 * 全部离线确定、无需任何 API key——去重 / 抽取式压缩 / 预算内打包 / 位置注意力重排 / 有效相关性度量。
 *
 * WHY（为什么单独有这一层）？
 *   第 08/09 章把片段「检索出来」，但**检索到 ≠ 用得上**：
 *     1) 窗口有 token 预算，多路召回 + 块重叠会带来近重复，长文档塞不下；
 *     2) 模型读上下文【首尾强、中间弱】（lost-in-the-middle），片段顺序影响利用率。
 *   本模块把「装配」这步拆成可单测的纯函数，结论由构造保证、可离线回归。
 *
 * 设计取向：所有函数都是**纯函数**（不改入参、返回新对象），随机性为零（无 PRNG，结果只取决于输入）。
 */
import { approxTokens } from "./chunk";
import { tokenize } from "./bm25";

// ── 数据模型 ──────────────────────────────────────────────────────────────────

/** 一个待装配的上下文片段：检索打分越高越相关，tokens 是它占用的预算成本。 */
export interface ContextChunk {
  id: string;
  text: string;
  /** 检索 / 精排打分，越大越相关。 */
  relevance: number;
  /** 该片段的 token 成本（用 approxTokens 估算；显式携带以保证打包确定、与具体分词器解耦）。 */
  tokens: number;
}

// ── 0) 内容词元：去重相似度的基础 ───────────────────────────────────────────────

/**
 * 取「内容词元集合」用于近重复判定：复用 BM25 的 tokenize（英文/数字成词、CJK 出单字+二元组），
 * 但**只保留长度 ≥ 2 的词元**（即二元组与英文词，丢弃单个 CJK 字）。
 * WHY 丢单字：单字几乎篇篇都有（"的""了""向"…），会把无关片段的 Jaccard 抬高，二元组才有区分度。
 */
function contentTokenSet(text: string): Set<string> {
  return new Set(tokenize(text).filter((token) => token.length >= 2));
}

/** 两段文本的 Jaccard 相似度（基于内容词元集合）：|交| / |并|，∈[0,1]；任一为空集时约定为 0。 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = contentTokenSet(a);
  const setB = contentTokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── 1) 去重：删掉与「已保留片段」近重复的整片冗余 ──────────────────────────────

export interface DedupeOptions {
  /** Jaccard 阈值：相似度 ≥ 阈值即判为近重复并丢弃。默认 0.6。 */
  threshold?: number;
}

/** 一条被判为近重复而丢弃的片段，记录它和谁重复、相似多少（便于审计 / 教学打印）。 */
export interface DroppedDuplicate {
  chunk: ContextChunk;
  /** 与之重复的、被保留的那条片段 id。 */
  duplicateOf: string;
  similarity: number;
}

export interface DedupeResult {
  kept: ContextChunk[];
  dropped: DroppedDuplicate[];
}

/**
 * 近重复去重：按**输入顺序**遍历，保留首次出现者，丢弃与任一已保留片段相似度 ≥ 阈值的后来者。
 *
 * 重要：保留的是「先出现」的那条。所以若希望相关性更高的留下，**先按 relevance 降序排序再去重**
 * （demo 即如此）。这是确定性的：相同输入永远得到相同 kept/dropped。
 */
export function dedupeChunks(
  chunks: readonly ContextChunk[],
  options: DedupeOptions = {},
): DedupeResult {
  const threshold = options.threshold ?? 0.6;
  if (threshold <= 0 || threshold > 1) {
    throw new Error(`dedupe 阈值必须落在 (0, 1]，收到：${threshold}`);
  }

  const kept: ContextChunk[] = [];
  const dropped: DroppedDuplicate[] = [];

  for (const chunk of chunks) {
    let bestId: string | null = null;
    let bestSim = 0;
    for (const keeper of kept) {
      const sim = jaccardSimilarity(chunk.text, keeper.text);
      if (sim > bestSim) {
        bestSim = sim;
        bestId = keeper.id;
      }
    }
    if (bestId !== null && bestSim >= threshold) {
      dropped.push({ chunk, duplicateOf: bestId, similarity: bestSim });
    } else {
      kept.push(chunk);
    }
  }

  return { kept, dropped };
}

// ── 2) 压缩：把超长片段按句抽取裁到预算内（抽取式，非生成式） ──────────────────

export interface CompressResult {
  chunk: ContextChunk;
  /** 被裁掉的整句数量。 */
  droppedSentences: number;
}

/** 按中英文句末标点切句，**保留分隔符**，使保留句拼接后仍是原文的一个前缀。 */
function splitSentences(text: string): string[] {
  return text.match(/[^。！？!?；;\n]+[。！？!?；;\n]?/g) ?? (text ? [text] : []);
}

/** 字符级硬截断到 token 预算内（仅当连第一句都超预算时兜底）。 */
function truncateToTokens(text: string, maxTokens: number): string {
  let out = text;
  while (out.length > 0 && approxTokens(out) > maxTokens) out = out.slice(0, -1);
  return out;
}

/**
 * 抽取式压缩：在 maxTokens 预算内，**按原顺序贪心保留整句**，超预算即停。
 * 保证：返回片段的 tokens ≤ maxTokens（即使连第一句都超，也字符级硬截断到预算内）；
 * 返回文本是原文的一个前缀（不改写、不生成，纯抽取——离线确定、无幻觉风险）。
 */
export function compressChunk(chunk: ContextChunk, maxTokens: number): CompressResult {
  if (maxTokens < 1) {
    throw new Error(`压缩预算 maxTokens 必须 ≥ 1，收到：${maxTokens}`);
  }
  const sentences = splitSentences(chunk.text);
  const kept: string[] = [];
  let used = 0;
  for (const sentence of sentences) {
    const cost = approxTokens(sentence);
    if (used + cost <= maxTokens) {
      kept.push(sentence);
      used += cost;
    } else {
      break;
    }
  }

  let textOut = kept.join("");
  if (kept.length === 0) {
    // 连第一句都装不下：抽不出整句，退化为字符级硬截断，保证不超预算。
    textOut = truncateToTokens(sentences[0] ?? chunk.text, maxTokens);
  }

  const compressed: ContextChunk = { ...chunk, text: textOut, tokens: approxTokens(textOut) };
  return { chunk: compressed, droppedSentences: sentences.length - kept.length };
}

// ── 3) lost-in-the-middle：位置注意力权重 + 有效相关性 + 注意力感知重排 ──────────

/**
 * U 形位置权重：首尾高、中间低，模拟「模型对上下文首尾注意力强、中间弱」（lost-in-the-middle）。
 * 返回长度 n、关于中心对称、值 ∈ [middleWeight, 1]：两端恒为 1，正中为 middleWeight。
 */
export function positionalWeights(n: number, middleWeight = 0.4): number[] {
  if (n < 0) throw new Error(`位置数 n 不能为负，收到：${n}`);
  if (middleWeight < 0 || middleWeight > 1) {
    throw new Error(`middleWeight 必须 ∈ [0,1]，收到：${middleWeight}`);
  }
  if (n === 0) return [];
  if (n === 1) return [1];
  const center = (n - 1) / 2;
  return Array.from({ length: n }, (_unused, i) => {
    const distance = Math.abs(i - center) / center; // 0=正中，1=两端
    return middleWeight + (1 - middleWeight) * distance;
  });
}

/** 给定一个片段顺序，按位置注意力权重算「有效相关性」= Σ relevance_i · weight_i。 */
export function effectiveRelevance(
  ordered: readonly ContextChunk[],
  middleWeight = 0.4,
): number {
  const weights = positionalWeights(ordered.length, middleWeight);
  return ordered.reduce((sum, chunk, i) => sum + chunk.relevance * weights[i]!, 0);
}

/**
 * 注意力感知重排：把高相关片段放到高权重位置（首尾），最大化有效相关性。
 * 依据**重排不等式**（rearrangement inequality）——把两个序列同序配对，使 Σ aᵢ·bᵢ 最大。
 * 因此 effectiveRelevance(reorderForAttention(c)) ≥ effectiveRelevance(任意排列)，对原序亦然。
 *
 * 做法：相关性降序的片段，依次填入权重降序的位置（第 j 高相关 → 第 j 高权重位）。
 * 全程显式 tie-break（相关性同分按 id、权重同值按下标），保证确定可复现。
 */
export function reorderForAttention(
  chunks: readonly ContextChunk[],
  middleWeight = 0.4,
): ContextChunk[] {
  const n = chunks.length;
  if (n <= 1) return [...chunks];

  const weights = positionalWeights(n, middleWeight);
  // 位置下标按权重降序（同值按下标升序）→ 先填最高权重的位置。
  const positionsByWeight = Array.from({ length: n }, (_unused, i) => i).sort(
    (a, b) => weights[b]! - weights[a]! || a - b,
  );
  // 片段下标按相关性降序（同分按 id 升序）→ 先安排最相关的片段。
  const chunksByRelevance = Array.from({ length: n }, (_unused, i) => i).sort(
    (a, b) => chunks[b]!.relevance - chunks[a]!.relevance || (chunks[a]!.id < chunks[b]!.id ? -1 : 1),
  );

  const result: ContextChunk[] = new Array(n);
  for (let j = 0; j < n; j++) {
    result[positionsByWeight[j]!] = chunks[chunksByRelevance[j]!]!;
  }
  return result;
}

// ── 4) 预算分配：在 token 预算内贪心挑选价值最高的片段子集 ──────────────────────

export interface PackOptions {
  /** token 预算上限。 */
  budget: number;
  /**
   * 贪心排序依据：
   *  - "relevance"（默认）：按相关性降序，先要最相关的；
   *  - "density"：按「相关性 / token」降序，优先性价比高的，常能在同预算下塞进更多价值。
   */
  strategy?: "relevance" | "density";
}

export interface PackResult {
  selected: ContextChunk[];
  /** 已用 token，保证 ≤ budget。 */
  usedTokens: number;
  /** 入选片段相关性之和（注意：不去重，重复内容会被重复计数——故装配前应先去重）。 */
  totalRelevance: number;
  /** 因预算放不下而被跳过的片段。 */
  skipped: ContextChunk[];
}

/**
 * 预算内打包：按策略排序后**贪心**装入，装不下就跳过（继续看后面更小的还能不能塞）。
 * 保证：usedTokens ≤ budget（恒成立）；selected ∪ skipped = 输入且不重不漏。
 * 注意：贪心不是背包最优解——这是有意的教学简化，真正的硬保证是「绝不超预算」。
 */
export function packWithinBudget(
  chunks: readonly ContextChunk[],
  options: PackOptions,
): PackResult {
  const { budget } = options;
  const strategy = options.strategy ?? "relevance";
  if (budget < 0) throw new Error(`预算 budget 不能为负，收到：${budget}`);

  const order = [...chunks].sort((a, b) => {
    if (strategy === "density") {
      const da = a.relevance / Math.max(a.tokens, 1);
      const db = b.relevance / Math.max(b.tokens, 1);
      if (db !== da) return db - da;
    }
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const selected: ContextChunk[] = [];
  const skipped: ContextChunk[] = [];
  let usedTokens = 0;
  for (const chunk of order) {
    if (usedTokens + chunk.tokens <= budget) {
      selected.push(chunk);
      usedTokens += chunk.tokens;
    } else {
      skipped.push(chunk);
    }
  }

  const totalRelevance = selected.reduce((sum, chunk) => sum + chunk.relevance, 0);
  return { selected, usedTokens, totalRelevance, skipped };
}

// ── 5) 合成确定语料：演示「装配」全流程，含近重复与超长片段 ────────────────────

/**
 * 返回一份**固定、确定**的上下文片段语料（无随机、无 key），刻意包含：
 *  - 若干相关性不同的唯一片段（制造预算压力）；
 *  - 两条近重复片段（u1/u2 的「逐字超集」副本，模拟多路召回 / 块重叠带来的冗余）；
 *  - 一条超长多句片段（用于演示抽取式压缩）；
 *  - 一条低相关噪声片段。
 * 每条的 tokens 由 approxTokens(text) 算出，保证与压缩 / 打包用的 token 估算一致。
 */
export function makeContextCorpus(): ContextChunk[] {
  const raw: Array<Omit<ContextChunk, "tokens">> = [
    {
      id: "u1",
      relevance: 0.96,
      text: "生产 RAG 必须把向量库持久化到磁盘，服务重启后直接载入，省去重新计算 embedding 的成本。",
    },
    {
      id: "u2",
      relevance: 0.92,
      text: "当数据量和并发超出内存向量库，迁移到 pgvector 或 Qdrant 这类专用向量数据库。",
    },
    {
      id: "u3",
      relevance: 0.88,
      text: "检索链路加 metadata 过滤，按租户和权限先筛子集再做向量检索，落实最小权限。",
    },
    {
      id: "u4",
      relevance: 0.83,
      text: "用增量 upsert 只重嵌发生变化的文档，避免每次知识更新都整库重建。",
    },
    {
      id: "u5",
      relevance: 0.74,
      text: "监控检索的召回率与延迟，给慢查询和低召回设告警，持续观测线上质量。",
    },
    {
      // u1 的近重复副本：正文几乎逐字相同，仅把句末句号改成逗号再续写一句（故并非字符前缀/子串）。
      // 模拟同一片段被多路召回拿到两次（高分重复，会和 u1 抢预算）；去重靠 Jaccard 词元集判定，不依赖前缀/子串包含。
      id: "dup1",
      relevance: 0.9,
      text: "生产 RAG 必须把向量库持久化到磁盘，服务重启后直接载入，省去重新计算 embedding 的成本，这一点在冷启动时尤其关键。",
    },
    {
      // u2 的近重复副本（同上：逐字相近但非字符前缀，由 Jaccard 词元集判为近重复）。
      id: "dup2",
      relevance: 0.86,
      text: "当数据量和并发超出内存向量库，迁移到 pgvector 或 Qdrant 这类专用向量数据库即可平滑横向扩展。",
    },
    {
      // 超长多句片段：用于演示压缩（裁到预算内仍保留高信息前缀）。
      id: "long1",
      relevance: 0.8,
      text: "RAG 的离线建库流程包含若干步骤。首先加载原始文档并清洗噪声。然后按语义边界分块并设置重叠。接着调用 embedding 接口把每块转成向量。再把向量与元数据写入向量库并建立索引。最后抽样验证检索质量是否达标。",
    },
    {
      // 低相关噪声：和主题无关，制造预算压力，应被打包阶段挤掉。
      id: "noise1",
      relevance: 0.31,
      text: "团队周会一般安排在每周一上午，会议室需要提前预订并同步给所有成员。",
    },
  ];
  return raw.map((chunk) => ({ ...chunk, tokens: approxTokens(chunk.text) }));
}
