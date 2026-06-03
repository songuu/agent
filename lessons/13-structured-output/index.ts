/**
 * 第 13 章 · 结构化输出与校验
 *
 * 运行：npx tsx lessons/13-structured-output/index.ts
 *
 * 本章演示「让模型稳定吐出结构化数据」的两条路：
 *  1) 手写通用 generateStructured()：强约束提示 + zod 校验 + 失败回传错误重试（retry-repair）。
 *     从一段简历文本里抽取 { name, skills, years }。
 *  2) 对照：用 Vercel AI SDK 的 generateObject() —— 框架把「要 JSON + 按 schema 校验」内建了，
 *     一行调用拿到类型安全的对象。理解了第 1 条，你才知道框架替你省了什么。
 *
 * 注意：第 2 条直接用 @ai-sdk/anthropic SDK（本章属第五部分「工程化与框架」，是允许的例外）。
 * 它固定走 Anthropic，需要 .env 里有 ANTHROPIC_API_KEY；没有 key 时本章会优雅跳过这段。
 */
import { z } from "zod";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getLLM } from "../../src/shared/llm";
import { divider, logger, getEnv } from "../../src/shared";
import { generateStructured } from "./generateStructured";

// 我们要从简历里抽取的目标结构。zod schema 是「单一事实来源」：
// 既用来约束模型输出，又用来运行期校验，类型也由它推导出来（见下方 Resume）。
const resumeSchema = z.object({
  name: z.string().describe("候选人姓名"),
  skills: z.array(z.string()).describe("技能关键词列表，如 TypeScript、React"),
  years: z.number().int().min(0).max(60).describe("总工作年限（整数年）"),
});

// 用 z.infer 从 schema 反推类型——不必手写 interface，schema 改了类型自动跟着变。
type Resume = z.infer<typeof resumeSchema>;

// 一段「自由文本」简历：人读没问题，但程序无法可靠地正则解析出字段。
const RESUME_TEXT = `
张伟，资深前端工程师。2016 年本科毕业后进入互联网行业，至今约 8 年经验。
擅长 TypeScript、React、Node.js，近两年主导过基于 LangGraph 的 Agent 平台建设，
对前端工程化、性能优化也有较深积累。期望负责 AI 应用方向。
`.trim();

async function main(): Promise<void> {
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  // ---- 路线一：手写 generateStructured（provider 无关，可切厂商）----
  divider("路线一：generateStructured() —— 提示约束 + zod 校验 + 自我修复重试");
  const structured = await generateStructured<Resume>({
    client: llm,
    schema: resumeSchema,
    prompt: `下面是一段简历文本，请抽取候选人的姓名、技能列表与总工作年限：\n\n${RESUME_TEXT}`,
    maxRetries: 2,
    // 观察每一次尝试：成功几次命中、是否触发了「修复重试」一目了然。
    onAttempt: ({ attempt, error }) => {
      if (error) {
        // 只取错误首行做摘要；noUncheckedIndexedAccess 下下标结果是 string | undefined，需兜底。
        const firstLine = error.split("\n")[0] ?? error;
        logger.warn(`第 ${attempt} 次尝试失败，将回传错误让模型修复：${firstLine}`);
      } else {
        logger.success(`第 ${attempt} 次尝试通过校验`);
      }
    },
  });

  const resume = structured.data; // 已通过 zod 校验，这里是 100% 类型安全的 Resume
  logger.info(`共尝试 ${structured.attempts} 次后得到合法结构。`);
  console.log("姓名：", resume.name);
  console.log("技能：", resume.skills.join("、"));
  console.log("年限：", `${resume.years} 年`);

  // ---- 路线二：对照 Vercel AI SDK 的 generateObject（框架内建结构化）----
  divider("路线二：generateObject() —— 框架把「要 JSON + schema 校验」内建了");
  const anthropicKey = getEnv("ANTHROPIC_API_KEY", "");
  if (!anthropicKey) {
    logger.warn("未检测到 ANTHROPIC_API_KEY，跳过 generateObject 对照演示（它固定走 Anthropic）。");
  } else {
    // 同一个 zod schema 直接交给框架：它负责强制模型按 schema 产出，并替你校验、解析、报类型。
    const { object, usage } = await generateObject({
      model: anthropic("claude-3-5-sonnet-latest"),
      schema: resumeSchema,
      prompt: `从这段简历文本中抽取姓名、技能列表与总工作年限：\n\n${RESUME_TEXT}`,
    });
    // object 的类型就是 Resume（由同一个 schema 推导），无需手动 parse。
    const fromSdk: Resume = object;
    console.log("姓名：", fromSdk.name);
    console.log("技能：", fromSdk.skills.join("、"));
    console.log("年限：", `${fromSdk.years} 年`);
    logger.info(`用量：输入 ${usage.promptTokens} / 输出 ${usage.completionTokens} token`);
  }

  divider("小结");
  logger.success(
    "手写版让你看清原理（提示约束 + zod 校验 + 错误回传重试）；框架版让你少写样板。两者用的是同一个 zod schema。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
