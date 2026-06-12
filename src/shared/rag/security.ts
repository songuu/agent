/**
 * RAG 安全护栏：把「检索来的外部内容默认不可信」这条铁律，落成三道确定性纯函数防线。
 *
 * WHY（为什么 RAG 需要专门的安全章）：
 *   RAG 的本质是把【外部文档】塞进提示词再交给模型。这等于把一段**不可信数据**直接递到
 *   模型嘴边——攻击者只要让一段恶意文本被检索命中，就可能间接劫持系统意图（indirect /
 *   data-poisoning prompt injection）。模型自身不会可靠地拒绝这些内容，所以护栏必须在
 *   **代码边界**上强制，而且最该先上的是「确定性、可离线、可审计」的那一层。
 *
 *   本模块给检索面三类典型风险各一道纯函数防线（都不调用 LLM、不联网，同输入永远同输出）：
 *     1) detectInjection —— 扫描检索片段里的「指令式」文本，命中即标记，便于隔离/丢弃。
 *     2) redactPii       —— 片段或答案落地前，正则脱敏邮箱/手机/身份证/银行卡，并返回审计命中。
 *     3) verifyCitations —— 校验答案声称的引用编号是否真的落在检索来源范围内，抓「幻觉引用」。
 *
 * 这三者是 LLM 护栏里最便宜、最该先上的一层：确定性意味着可单测、可进 CI、可回归。
 */

// ────────────────────────────────────────────────────────────────────────────
// 1) 提示注入检测：检索片段里的「指令式」文本
// ────────────────────────────────────────────────────────────────────────────

/** 一条注入检测规则：规则名 + 匹配正则。 */
export interface InjectionPattern {
  /** 规则名（用于审计与教学展示）。 */
  name: string;
  /** 匹配的正则（必须带 g 标志，detectInjection 用 matchAll 收集全部命中）。 */
  pattern: RegExp;
}

/** 一处注入命中。 */
export interface InjectionFinding {
  /** 命中的规则名。 */
  rule: string;
  /** 命中的原文片段。 */
  match: string;
  /** 命中在输入文本中的起始下标。 */
  index: number;
}

/** detectInjection 的结果。 */
export interface InjectionScanResult {
  /** 是否检出可疑注入指令。 */
  suspicious: boolean;
  /** 全部命中明细（可能多条，按出现顺序）。 */
  findings: InjectionFinding[];
}

/**
 * 内置注入规则集（教学用、可读优先，中英文各覆盖一档）。
 *
 * 设计要点：用 `[^。\n]{0,N}` 把匹配限制在「同一句话内」，避免跨句误报；只盯最典型的
 * 几类劫持话术（覆盖既有指令 / 角色劫持 / 诱导泄密），宁可漏报也尽量不误伤正常资料。
 * 生产中应在此基础上接更完整的规则库或专用模型，但「确定性规则先行」的思路一致。
 */
const INJECTION_PATTERNS: readonly InjectionPattern[] = [
  { name: "覆盖既有指令", pattern: /(忽略|无视|忘记)[^。\n]{0,8}(之前|以上|前面|上面)[^。\n]{0,8}(指令|提示|规则|要求)/g },
  { name: "覆盖既有指令(英文)", pattern: /ignore[^.\n]{0,16}(previous|prior|above|all)[^.\n]{0,16}(instructions?|prompts?|rules?)/gi },
  { name: "角色劫持", pattern: /(从现在起|现在开始)?[^。\n]{0,4}你现在是[^。\n]{0,12}/g },
  { name: "角色劫持(英文)", pattern: /you are now[^.\n]{0,24}/gi },
  { name: "诱导泄密", pattern: /(打印|输出|泄露|发送|告诉我)[^。\n]{0,8}(系统提示|系统指令|密钥|api\s?key|密码|口令)/gi },
  { name: "诱导泄密(英文)", pattern: /(reveal|print|show|leak|expose)[^.\n]{0,16}(system prompt|api\s?key|password|secret)/gi },
];

/**
 * 扫描一段文本是否藏有提示注入指令。
 *
 * 纯函数：遍历内置规则收集全部命中。结果用于「先标记，再决定隔离/丢弃/降权」，
 * 而不是直接信任检索内容。
 */
export function detectInjection(text: string): InjectionScanResult {
  const findings: InjectionFinding[] = [];
  for (const { name, pattern } of INJECTION_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      findings.push({ rule: name, match: match[0], index: match.index ?? 0 });
    }
  }
  // 按出现位置排序，让审计输出与原文顺序一致。
  findings.sort((a, b) => a.index - b.index);
  return { suspicious: findings.length > 0, findings };
}

/** 一段带 id 的检索片段（最小形状，便于隔离演示）。 */
export interface ScannableChunk {
  id: string;
  text: string;
}

/** 把检索片段按是否检出注入分成「安全」与「隔离」两堆。 */
export interface QuarantineResult<T extends ScannableChunk> {
  safe: T[];
  quarantined: Array<{ chunk: T; scan: InjectionScanResult }>;
}

/**
 * 对一批检索片段做注入检测，命中者移入隔离区（不进入后续提示拼装）。
 * 这是「检索内容不可信」最直接的落地：可疑片段宁可不用，也不让它当指令执行。
 */
export function quarantineInjectedChunks<T extends ScannableChunk>(chunks: readonly T[]): QuarantineResult<T> {
  const safe: T[] = [];
  const quarantined: Array<{ chunk: T; scan: InjectionScanResult }> = [];
  for (const chunk of chunks) {
    const scan = detectInjection(chunk.text);
    if (scan.suspicious) {
      quarantined.push({ chunk, scan });
    } else {
      safe.push(chunk);
    }
  }
  return { safe, quarantined };
}

// ────────────────────────────────────────────────────────────────────────────
// 2) PII 出口脱敏：邮箱 / 手机 / 身份证 / 银行卡
// ────────────────────────────────────────────────────────────────────────────

/** PII 类型。 */
export type PiiType = "email" | "phone" | "id-card" | "bank-card";

/** 一处 PII 命中（用于审计）。 */
export interface PiiMatch {
  type: PiiType;
  /** 命中的原始明文（仅用于审计日志，不应回写进面向用户的输出）。 */
  value: string;
  /** 命中在输入中的起始下标。 */
  index: number;
}

/** redactPii 的结果。 */
export interface RedactionResult {
  /** 脱敏后的文本。 */
  redacted: string;
  /** 全部命中明细（按出现位置升序），供审计。 */
  matches: PiiMatch[];
}

/** 邮箱脱敏：保留首字符与域名，`zhang@corp.com` → `z***@corp.com`。 */
function maskEmail(value: string): string {
  const at = value.indexOf("@");
  return `${value.slice(0, 1)}***${value.slice(at)}`;
}

/** 手机号脱敏：保留前 3 后 4，`13800001234` → `138****1234`。 */
function maskPhone(value: string): string {
  return `${value.slice(0, 3)}****${value.slice(7)}`;
}

interface PiiRule {
  type: PiiType;
  pattern: RegExp;
  mask: (value: string) => string;
}

/**
 * PII 规则（顺序即优先级：靠前者在区间重叠时胜出）。
 *
 * 关键陷阱：18 位纯数字既像身份证（`\d{17}[\dXx]`）又像银行卡（`\d{16,19}`）。
 * 把 id-card 排在 bank-card 之前，重叠时按优先级保留身份证，避免同一串被两种类型重复计数。
 * 用 `(?<!\d)`/`(?!\d)` 前后界确保命中的是完整数字串，而非更长数字的一段。
 */
const PII_RULES: readonly PiiRule[] = [
  { type: "email", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, mask: maskEmail },
  { type: "id-card", pattern: /(?<!\d)\d{17}[\dXx](?!\d)/g, mask: () => "[已脱敏:身份证]" },
  { type: "bank-card", pattern: /(?<!\d)\d{16,19}(?!\d)/g, mask: () => "[已脱敏:银行卡]" },
  { type: "phone", pattern: /(?<!\d)1[3-9]\d{9}(?!\d)/g, mask: maskPhone },
];

interface PiiSpan {
  start: number;
  end: number;
  type: PiiType;
  value: string;
  masked: string;
}

/**
 * 脱敏文本中的 PII，并返回审计命中清单。
 *
 * 纯函数，三步：
 *   1) 收集所有规则的命中区间；
 *   2) 重叠区间按规则优先级去重（贪心保留先到且高优先者）；
 *   3) 一次遍历用掩码替换被保留的区间，拼出脱敏文本。
 *
 * WHY 出口脱敏：检索库里可能混入真实个人信息，答案落地（日志/返回/留痕）前必须在边界统一过滤，
 * 不能寄望模型「自觉」不复述。
 */
export function redactPii(text: string): RedactionResult {
  const priority = new Map<PiiType, number>(PII_RULES.map((rule, index) => [rule.type, index]));

  // 1) 收集全部命中
  const spans: PiiSpan[] = [];
  for (const rule of PII_RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      const value = match[0];
      const start = match.index ?? 0;
      spans.push({ start, end: start + value.length, type: rule.type, value, masked: rule.mask(value) });
    }
  }

  // 2) 排序：先按起点，再按优先级；贪心保留不与已保留区间重叠者
  spans.sort((a, b) => a.start - b.start || priority.get(a.type)! - priority.get(b.type)!);
  const kept: PiiSpan[] = [];
  let lastEnd = -1;
  for (const span of spans) {
    if (span.start >= lastEnd) {
      kept.push(span);
      lastEnd = span.end;
    }
  }

  // 3) 拼接脱敏文本（kept 已按 start 升序）
  let redacted = "";
  let cursor = 0;
  const matches: PiiMatch[] = [];
  for (const span of kept) {
    redacted += text.slice(cursor, span.start) + span.masked;
    matches.push({ type: span.type, value: span.value, index: span.start });
    cursor = span.end;
  }
  redacted += text.slice(cursor);

  return { redacted, matches };
}

// ────────────────────────────────────────────────────────────────────────────
// 3) 引用核验：答案声称的来源编号是否真实存在
// ────────────────────────────────────────────────────────────────────────────

/** verifyCitations 的结果。 */
export interface CitationCheck {
  /** 答案中出现的全部引用编号（去重、升序）。 */
  cited: number[];
  /** 越界 / 不存在的引用编号（幻觉引用）。 */
  hallucinated: number[];
  /** 检索来源里从未被引用的编号（升序）。 */
  unused: number[];
  /** 是否全部引用都有据可查（无幻觉引用）。 */
  ok: boolean;
}

/** 从答案中抽取 `[n]` 形式的引用编号（去重升序）。 */
function extractCitations(answer: string): number[] {
  const seen = new Set<number>();
  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    seen.add(Number(match[1]));
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * 核验答案里的引用编号是否都落在「检索到的来源」范围内。
 *
 * 来源按检索顺序 1..sourceCount 编号；答案用 `[1]`/`[2]` 标注。
 *   - hallucinated：编号 < 1 或 > sourceCount —— 模型「引用了不存在的来源」，是可量化的幻觉信号。
 *   - unused：有效来源里没被任何引用提及 —— 可能检索冗余或答案漏用证据。
 *
 * 纯函数、确定性：可直接进 CI，对「答案是否言之有据」做回归。
 */
export function verifyCitations(answer: string, sourceCount: number): CitationCheck {
  const cited = extractCitations(answer);
  const hallucinated = cited.filter((n) => n < 1 || n > sourceCount);
  const citedSet = new Set(cited);
  const unused: number[] = [];
  for (let n = 1; n <= sourceCount; n += 1) {
    if (!citedSet.has(n)) unused.push(n);
  }
  return { cited, hallucinated, unused, ok: hallucinated.length === 0 };
}
