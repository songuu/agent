/**
 * 第 15 章 · 评估与测试 Agent
 *
 * 运行：npx tsx lessons/15-evaluation-and-testing/index.ts
 *
 * 本章演示一条完整的离线评估链路：
 *  1. 定义一份评估数据集（input → 期望/评分标准）
 *  2. 对每条跑「被测函数」extractContact（结构化抽取）
 *  3. 用「规则评分」+「LLM-as-judge」给输出打分
 *  4. 汇总通过率、平均分，并打印失败用例——这正是改 prompt 后做"回归测试"的依据
 */
import { divider, logger, color } from "../../src/shared";
import { extractContact } from "./extractContact";
import { runEval, type EvalCase } from "./evalHarness";
import { fieldsMatch, llmJudge } from "./scorers";

/**
 * 评估数据集：每条用例自带评分逻辑（数据集即测试集）。
 *
 * WHY 期望写"字段子集"：只断言我们真正关心的字段（intent / company），
 * name 的具体写法允许模型有空间，断言更稳，不会因无关字段抖动而误报失败。
 */
const dataset: EvalCase<string>[] = [
  {
    name: "明确的销售线索",
    input: "你好，我是 Acme 公司的张伟，想咨询你们企业版的批量采购报价。",
    // 规则评分：精确判定意图与公司，这类有标准答案的维度优先用规则（确定、免费）
    score: fieldsMatch({ intent: "sales", company: "Acme" }),
  },
  {
    name: "技术支持请求",
    input: "我的账号登录后一直 500 报错，麻烦帮忙看下，急用！——来自 Globex 的李娜",
    score: fieldsMatch({ intent: "support", company: "Globex" }),
  },
  {
    name: "垃圾推广",
    input: "【中奖通知】恭喜您获得 iPhone，点击链接领取：http://spam.example",
    // 没有公司也没有姓名，只断言意图，体现"子集断言"的灵活
    score: fieldsMatch({ intent: "spam" }),
  },
  {
    name: "信息含混（用 LLM 当裁判）",
    input: "在吗？想了解下合作的事，方便加个微信聊聊不？",
    /**
     * WHY 这条用 LLM-as-judge：意图模糊（像 sales 又像 other），没有唯一标准答案。
     * 规则评分会过于死板，改用裁判模型按"标准"打程度分，更贴近人类判断。
     */
    score: llmJudge(
      [
        "被评内容是一段结构化抽取结果（JSON）。",
        "若 intent 被合理地判为 sales 或 other（二者皆可接受），且 name/company 没有凭空捏造文本中不存在的信息，则给高分（8-10）。",
        "若 intent 判为 support 或 spam，或捏造了不存在的姓名/公司，给低分（0-4）。",
      ].join("\n"),
      7,
    ),
  },
];

async function main(): Promise<void> {
  logger.info(`开始评估「联系人抽取」函数，共 ${dataset.length} 条用例…`);

  // 把被测函数与数据集交给评估器。runEval 不关心 extractContact 内部如何实现
  const report = await runEval(extractContact, dataset);

  // ---- 逐条明细 ----
  divider("逐条结果");
  for (const c of report.cases) {
    const tag = c.passed ? color("PASS", "green") : color("FAIL", "red");
    const score = `${(c.score * 100).toFixed(0)}分`;
    // 失败原因或运行异常都打印出来，方便定位是"输出不达标"还是"函数抛错"
    const detail = c.error ? `异常：${c.error}` : (c.reason ?? "");
    console.log(`[${tag}] ${c.name}（${score}）${detail ? "— " + detail : ""}`);
  }

  // ---- 汇总 ----
  divider("汇总");
  logger.info(
    `通过率：${(report.passRate * 100).toFixed(0)}%（${report.passed}/${report.total}）` +
      ` | 平均分：${(report.avgScore * 100).toFixed(0)}`,
  );

  // WHY 用非零退出码：接入 CI 时，通过率不达标应让流水线变红，阻止退化的 prompt 被合并
  const PASS_RATE_GATE = 0.75;
  if (report.passRate >= PASS_RATE_GATE) {
    logger.success(`达到质量门槛（≥${PASS_RATE_GATE * 100}%），评估通过。`);
  } else {
    logger.error(`未达质量门槛（<${PASS_RATE_GATE * 100}%），视为回归失败。`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
