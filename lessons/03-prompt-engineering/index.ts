/**
 * 第 03 章 · 提示工程（Prompt Engineering）
 *
 * 运行：npx tsx lessons/03-prompt-engineering/index.ts
 *
 * 提示就是 agent 行为的「程序」。同一个模型，提示写得好不好，输出质量天差地别。
 * 本章用 4 个对照实验，把"提示工程"从玄学变成可观测、可复现的工程实践：
 *
 *  1. 模糊提示 vs. 精心设计提示  —— system + 明确指令的威力
 *  2. few-shot 文本分类         —— 用几个示例「教会」模型遵循你的标签体系
 *  3. 思维链(CoT)               —— 让模型先推理再回答，正确率显著提升
 *  4. temperature 0 vs. 1       —— 确定性与多样性的权衡
 *
 * 所有调用统一走 getLLM().chat()，不直接耦合任何厂商 SDK。
 */
import { getLLM } from "../../src/shared/llm";
import { divider, logger } from "../../src/shared";

/**
 * 实验一：模糊提示 vs. 精心设计提示。
 *
 * WHY: 初学者最常见的误区是「把模型当人，随口一问」。但模型只能依据你给的字面信息推理，
 * 它不知道你心里默认的格式、受众、长度。把这些「隐含期望」显式写进提示，
 * 输出的可用性会立刻提升——这就是提示工程最朴素也最有效的一步。
 */
async function comparePrompts(llm: ReturnType<typeof getLLM>): Promise<void> {
  divider("实验一：模糊提示 vs. 精心设计提示");

  // 模糊版：没有角色、没有受众、没有格式约束，模型只能自由发挥
  const vague = await llm.chat({
    messages: [{ role: "user", content: "讲讲闭包。" }],
  });
  logger.info("【模糊提示】输出（节选）：");
  console.log(truncate(vague.text, 240));

  // 精心设计版：用 system 设定角色 + 受众，用 user 给出明确的结构和长度约束
  const crafted = await llm.chat({
    system: "你是一位耐心的 JavaScript 讲师，面向零基础学员，用生活化类比解释概念。",
    messages: [
      {
        role: "user",
        content: [
          "解释 JavaScript 的「闭包」，要求：",
          "1. 先用一句话给出生活化类比；",
          "2. 再给一个不超过 8 行的最小代码示例；",
          "3. 最后用一句话说明它在实际开发中的一个典型用途。",
          "总字数控制在 150 字以内。",
        ].join("\n"),
      },
    ],
  });
  logger.success("【精心设计提示】输出：");
  console.log(crafted.text);

  logger.info("对比要点：同一个模型，约束越具体，输出越贴近你真正想要的形态。");
}

/**
 * 实验二：few-shot 文本分类。
 *
 * WHY: 当任务有「你自定义的标签体系」时，光靠描述很难让模型精确对齐。
 * 给几个「输入 → 期望输出」的示范（few-shot），相当于不训练模型就「现场教学」，
 * 模型会模仿示例的格式与判断标准。这是无需微调就能稳定行为的高性价比手段。
 */
async function fewShotClassification(llm: ReturnType<typeof getLLM>): Promise<void> {
  divider("实验二：few-shot 文本分类（情感 + 紧急度）");

  // 把示范直接编进 system，告诉模型「看着这些例子的样子来做」
  const system = [
    "你是客服工单分类器。把用户反馈分类为情感(positive/neutral/negative)与紧急度(low/high)。",
    "严格只输出一行，格式：情感|紧急度。不要任何解释、不要标点之外的多余字符。",
    "",
    "示例：",
    '输入："东西很好用，谢谢！" → positive|low',
    '输入："账号被盗了，钱也没了，赶紧处理！" → negative|high',
    '输入："请问发票什么时候开？" → neutral|low',
    '输入："系统崩了，整个团队都没法上班！" → negative|high',
  ].join("\n");

  // 待分类的新样本（不在示例里，考验模型的泛化）
  const samples = [
    "你们的更新把我常用的功能弄没了，太失望了。",
    "想咨询一下会员价格。",
    "服务器一直 500，订单全卡住，损失很大！",
  ];

  for (const text of samples) {
    const result = await llm.chat({
      system,
      // few-shot 任务通常把 temperature 设为 0：我们要的是稳定一致的判断，不要创意
      temperature: 0,
      messages: [{ role: "user", content: `输入："${text}"` }],
    });
    // 模型可能带换行/空格，统一清洗后展示，体现「约束输出」的后处理思路
    const label = result.text.trim().split("\n")[0]?.trim() ?? "(空)";
    console.log(`  ${color2(label)}  ←  ${text}`);
  }

  logger.info("对比要点：示例越能覆盖边界情况，模型对新样本的判断越稳。");
}

/**
 * 实验三：思维链（Chain-of-Thought, CoT）。
 *
 * WHY: 对需要多步推理的题目（数学、逻辑、规则判断），直接让模型「报答案」容易翻车，
 * 因为它把整个推理压缩进了一次性输出。让它「先写出推理步骤，再给结论」，
 * 等于给了模型「打草稿」的空间，正确率通常明显提升。
 *
 * 本实验对照「直接回答」与「先推理再回答」两种提示在同一道易错题上的表现。
 */
async function chainOfThought(llm: ReturnType<typeof getLLM>): Promise<void> {
  divider("实验三：思维链（CoT）让模型先推理再回答");

  // 一道容易「想当然」答错的题：先涨后跌，百分比不能直接相加
  const question =
    "一件商品原价 100 元，先涨价 20%，再在涨价后的基础上降价 20%。最终价格是多少？";

  // 直接回答版：强制只给数字，剥夺推理空间，更容易出错
  const direct = await llm.chat({
    system: "只回答最终的数字结果，不要任何推理过程和单位。",
    temperature: 0,
    messages: [{ role: "user", content: question }],
  });
  logger.info(`【直接回答】${direct.text.trim()}`);

  // CoT 版：显式要求「先列步骤，最后一行用『答案：』给结论」
  const cot = await llm.chat({
    system: "你是严谨的数学助教。先分步写出计算过程，最后单独一行用『答案：』给出最终结果。",
    temperature: 0,
    messages: [{ role: "user", content: question }],
  });
  logger.success("【思维链回答】：");
  console.log(cot.text.trim());

  logger.info("对比要点：正确结果是 96 元。给模型「打草稿」的空间，往往就能避免低级错误。");
}

/**
 * 实验四：用 system 强约束输出格式（为第 13 章「结构化输出」铺垫）。
 *
 * WHY: agent 的输出常常要被「下游代码」消费（解析、入库、再调用）。
 * 自然语言对人友好、对程序极不友好。用 system 把输出锁定成固定格式（如 JSON），
 * 下游就能稳定解析——这是把 LLM 接入真实系统的关键一步。
 * （第 13 章会进一步用 schema 校验把这件事做扎实，本章先打地基。）
 */
async function constrainedOutput(llm: ReturnType<typeof getLLM>): Promise<void> {
  divider("实验四：用 system 把输出强约束为固定 JSON");

  const system = [
    "你是信息抽取引擎。从用户文本中抽取联系人信息。",
    "只输出一个 JSON 对象，不要 Markdown 代码块、不要任何解释文字。",
    "字段固定为：{ name: string, company: string, email: string }。",
    "若某字段缺失，用空字符串占位。",
  ].join("\n");

  const text = "你好，我是字节跳动的张伟，有合作可以发我邮箱 zhangwei@example.com。";

  const result = await llm.chat({
    system,
    temperature: 0, // 结构化输出要的是确定性，必须用 0
    messages: [{ role: "user", content: text }],
  });

  const rawOutput = result.text.trim();
  logger.info("模型原始输出：");
  console.log(rawOutput);

  // 关键一步：尝试把模型输出解析成程序能用的对象。显式 try-catch，失败要给出有意义的上下文，
  // 而不是让 JSON.parse 抛一个看不懂的错——这正是「不信任外部数据」的边界校验思想。
  try {
    const parsed = JSON.parse(rawOutput) as Record<string, unknown>;
    logger.success("成功解析为对象，下游代码可直接使用：");
    console.log(`  name    = ${String(parsed.name ?? "")}`);
    console.log(`  company = ${String(parsed.company ?? "")}`);
    console.log(`  email   = ${String(parsed.email ?? "")}`);
  } catch (err) {
    logger.warn(
      `解析失败（${(err as Error).message}）：说明约束还不够强。第 13 章会用 schema 校验 + 重试兜底。`,
    );
  }
}

/**
 * 实验五：temperature 0 vs. 1 对稳定性的影响。
 *
 * WHY: temperature 控制采样的「随机性」。0 ≈ 每次都选概率最高的词，输出高度确定、可复现；
 * 越高（接近 1）越发散、越有创意，但也越不可控。
 *  - 需要确定性的场景（分类、抽取、计算、单测）→ 用 0
 *  - 需要多样性的场景（头脑风暴、文案、起名）→ 用更高的值
 * 本实验对同一个 prompt 在两种温度下各跑两次，直观感受「确定 vs. 发散」。
 */
async function temperatureEffect(llm: ReturnType<typeof getLLM>): Promise<void> {
  divider("实验五：temperature 0 vs. 1 —— 确定性 vs. 多样性");

  const ask = { role: "user" as const, content: "给一个做番茄钟的 App 起一个中文名字，只回名字。" };

  // temperature=0：跑两次，结果应高度一致甚至完全相同
  logger.info("temperature = 0（追求稳定、可复现）：");
  for (let i = 1; i <= 2; i++) {
    const r = await llm.chat({ temperature: 0, messages: [ask] });
    console.log(`  第 ${i} 次：${r.text.trim()}`);
  }

  // temperature=1：跑两次，结果通常各不相同，体现「多样性」
  logger.info("temperature = 1（追求多样、有创意）：");
  for (let i = 1; i <= 2; i++) {
    const r = await llm.chat({ temperature: 1, messages: [ask] });
    console.log(`  第 ${i} 次：${r.text.trim()}`);
  }

  logger.info("对比要点：选 temperature 不是越高越好，而是「按任务对确定性的需求」来选。");
}

/** 截断长文本用于节选展示，避免刷屏。 */
function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…（已截断）`;
}

/** 给分类标签上个底色，让对照实验的输出更醒目（纯展示，无业务含义）。 */
function color2(label: string): string {
  return `「${label}」`;
}

async function main(): Promise<void> {
  const llm = getLLM();
  logger.info(`当前厂商：${llm.provider} | 模型：${llm.model}`);

  // 五个实验相互独立，但为了输出可读、便于逐段对照，这里按顺序串行执行
  await comparePrompts(llm);
  await fewShotClassification(llm);
  await chainOfThought(llm);
  await constrainedOutput(llm);
  await temperatureEffect(llm);

  divider("小结");
  logger.success("提示就是 agent 的「程序」：角色、指令、示例、推理空间、输出格式、temperature，每一项都在塑造行为。");
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
