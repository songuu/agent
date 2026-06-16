/**
 * 评审员（reviewer agents）：每个角色用确定性规则扫描代码，产出结构化发现。
 *
 * WHY 规则而非真 LLM：毕业项目要离线可回归。每个 reviewer 是一个**纯函数 agent**——
 * 输入文件、输出 Finding[]。真实项目里把 review() 换成「给这个角色的 system prompt + LLM
 * 结构化输出」即可，crew 的并行调度与汇总（crew.ts）一行不用改。这正是「多 Agent 编排」的骨架：
 * 角色分工 + 并行 + 汇总。
 */
import type { Finding, Severity } from "./crew";
import type { CodeFile } from "./samples";

/** 评审员角色。 */
export type ReviewerRole = "security" | "performance" | "style";

/** 一个评审员：固定角色 + 对单文件产出发现。 */
export interface Reviewer {
  role: ReviewerRole;
  review: (file: CodeFile) => Finding[];
}

/** 一条规则：正则 + 严重度 + 提示信息。 */
interface Rule {
  rule: string;
  severity: Severity;
  pattern: RegExp;
  message: string;
}

/** 逐行套用规则，命中即产出带行号的发现。 */
function scan(file: CodeFile, role: ReviewerRole, rules: readonly Rule[]): Finding[] {
  const findings: Finding[] = [];
  const lines = file.content.split("\n");
  lines.forEach((line, i) => {
    for (const r of rules) {
      // 每行独立匹配，重置 lastIndex 防止带 g 标志的正则状态串味。
      r.pattern.lastIndex = 0;
      if (r.pattern.test(line)) {
        findings.push({ reviewer: role, severity: r.severity, rule: r.rule, message: r.message, path: file.path, line: i + 1 });
      }
    }
  });
  return findings;
}

const SECURITY_RULES: readonly Rule[] = [
  { rule: "hardcoded-secret", severity: "critical", pattern: /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']+["']|sk-[a-z0-9-]{8,}/i, message: "疑似硬编码密钥/口令，应改用环境变量或密钥管理。" },
  { rule: "sql-injection", severity: "critical", pattern: /(SELECT|INSERT|UPDATE|DELETE)\b.*["'`]\s*\+|\+\s*["'`].*(WHERE|VALUES)/i, message: "SQL 字符串拼接，存在注入风险，应使用参数化查询。" },
  { rule: "eval", severity: "critical", pattern: /\beval\s*\(/, message: "使用 eval 执行动态代码，攻击面巨大，应移除或换白名单解析。" },
  { rule: "command-injection", severity: "critical", pattern: /(exec|execSync|spawn)\s*\(\s*["'`][^"'`]*["'`]?\s*\+/, message: "命令拼接执行，存在命令注入风险，应校验/转义输入或用参数数组。" },
];

const STYLE_RULES: readonly Rule[] = [
  { rule: "no-var", severity: "minor", pattern: /(^|\s)var\s+\w+/, message: "使用 var，应改用 const/let。" },
  { rule: "loose-equality", severity: "minor", pattern: /[^=!]==[^=]/, message: "使用宽松相等 ==，应改用 ===。" },
  { rule: "explicit-any", severity: "minor", pattern: /:\s*any\b|\bany\[\]/, message: "显式 any 削弱类型安全，应收窄类型或用 unknown。" },
  { rule: "console-log", severity: "minor", pattern: /console\.log\s*\(/, message: "生产代码不应保留 console.log，应使用日志库。" },
];

/**
 * 性能评审员需要「跨行上下文」（await 是否在循环内），单行规则不够，单独实现。
 * 维护一个「当前是否在循环块内」的栈式深度，命中循环内 await / 嵌套循环。
 */
function reviewPerformance(file: CodeFile): Finding[] {
  const findings: Finding[] = [];
  const lines = file.content.split("\n");
  let loopDepth = 0;
  lines.forEach((line, i) => {
    const isLoopHead = /\b(for|while)\b\s*\(/.test(line);
    if (isLoopHead && loopDepth >= 1) {
      findings.push({ reviewer: "performance", severity: "major", rule: "nested-loop", message: "嵌套循环（疑似 O(n²)），数据量大时需改用索引/哈希表降复杂度。", path: file.path, line: i + 1 });
    }
    if (loopDepth >= 1 && /\bawait\b/.test(line)) {
      findings.push({ reviewer: "performance", severity: "major", rule: "await-in-loop", message: "循环体内 await 串行等待，建议 Promise.all 批量并发。", path: file.path, line: i + 1 });
    }
    if (loopDepth >= 1 && /JSON\.parse\s*\(/.test(line)) {
      findings.push({ reviewer: "performance", severity: "minor", rule: "json-parse-in-loop", message: "循环内反复 JSON.parse，注意开销。", path: file.path, line: i + 1 });
    }
    // 极简块计数：出现循环头则 +1，遇到 '}' 则 -1（够样本用，不追求完整解析）。
    if (isLoopHead) loopDepth += 1;
    else if (/^\s*\}/.test(line) && loopDepth > 0) loopDepth -= 1;
  });
  return findings;
}

/** 三个评审员。security/style 用逐行规则，performance 用跨行上下文。 */
export const REVIEWERS: readonly Reviewer[] = [
  { role: "security", review: (file) => scan(file, "security", SECURITY_RULES) },
  { role: "performance", review: reviewPerformance },
  { role: "style", review: (file) => scan(file, "style", STYLE_RULES) },
];
