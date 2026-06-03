# 第 05 章 · 工具调用基础 (Function Calling)

> 所属阶段：**第二部分 · 从零手写核心**
> 预计用时：40 分钟 | 难度：⭐⭐☆☆☆

## 学习目标

学完本章你能够：

- [ ] 说清「工具调用」的本质：模型**请求**调用工具，**执行权**始终在你手里。
- [ ] 手写一份 `ToolSpec`（含原始 JSON Schema 的 `parameters`），理解它如何「教会」模型用工具。
- [ ] 走通一次完整往返：`chat()` → 读 `toolCalls` → 执行 → 回传 `role:"tool"` 消息 → 再 `chat()`。
- [ ] 用 `stopReason === "tool_use"` 控制循环，知道何时该停。
- [ ] 对比第 04 章的「文本解析触发工具」，说出原生工具调用为什么更可靠。

## 前置知识

- 已读 [第 04 章 · The Agent Loop](../04-the-agent-loop/README.md)（用「文本解析」手动驱动工具）。
- 已读 [第 02 章 · 你的第一次 LLM 调用](../02-first-llm-call/README.md)，熟悉 `getLLM()` 与 `chat()`。

---

## 一、原理：模型只会「点菜」，下厨的还是你

第 04 章里，我们让模型输出一段约定格式的文本（比如 `ACTION: get_weather(北京)`），再用正则把它解析出来。这条路能走通，但很脆：模型多打一个空格、换个说法、参数里带了括号，解析就崩了。

现代模型支持**原生工具调用**（OpenAI 叫 function calling，Claude 叫 tool use）。流程变成这样：

```
你：这是问题 + 一份工具清单(每个工具带 JSON Schema)
        ↓
模型：我决定调用 get_weather，参数 {"city":"北京"}   ← 结构化，不是裸文本
        ↓  (stopReason === "tool_use")
你：在本地执行 get_weather("北京") → "北京：晴，26℃"
        ↓
你：把结果作为 role:"tool" 消息回传，再问一次
        ↓
模型：北京今天晴，26℃。                              ← stopReason === "stop"
```

**三个关键认知：**

1. **模型不执行任何东西**。它只返回一个「调用意图」（`ChatResult.toolCalls`）。真正的副作用——查数据库、调 API、读文件——都发生在你的代码里。这是工具调用的安全边界。
2. **schema 就是说明书**。你传给模型的 `parameters` 是一份 JSON Schema，描述参数名、类型、是否必填。模型靠它决定**何时调用**、**参数怎么填**。写得越清楚，模型用得越准。
3. **结果要原路回传**。执行完工具，你得把输出包成一条 `role:"tool"` 消息塞回 `messages`，并用 `toolCallId` 对应上是哪一次调用——然后再 `chat()` 一次，模型才能基于结果给出最终答案。

### 和第 04 章比，可靠在哪？

| 维度 | 第 04 章：文本解析 | 第 05 章：原生工具调用 |
|------|------------------|----------------------|
| 触发方式 | 模型输出特定文本，你正则解析 | 模型返回结构化 `toolCalls` |
| 参数 | 自己从字符串里抠，类型全靠猜 | 已是对象，schema 还做了类型/枚举约束 |
| 多工具/多调用 | 解析逻辑迅速失控 | 天然支持一回合多个调用 |
| 出错率 | 高（格式一变就崩） | 低（厂商保证结构合法） |

---

## 二、代码走读

完整代码见 [`index.ts`](./index.ts)。本章**故意不用** shared 的 `ToolRegistry` / `runAgent`，全部手写，好让你看清底层在做什么。

### 1) 手写 ToolSpec：parameters 的原始形态

这就是发给模型的「工具说明书」。注意 `parameters` 是手写的 JSON Schema：

```ts
const TOOL_SPECS: ToolSpec[] = [
  {
    name: "calculate",
    description: "做一次基础四则运算。涉及精确计算时调用，不要自己心算。",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number", description: "第一个操作数" },
        b: { type: "number", description: "第二个操作数" },
        op: {
          type: "string",
          enum: ["add", "sub", "mul", "div"], // 把可选值钉死
          description: "运算符：add 加 / sub 减 / mul 乘 / div 除",
        },
      },
      required: ["a", "b", "op"],
    },
  },
];
```

`enum` 让模型几乎不会传出范围外的运算符，`required` 保证必填项不缺——这就是 schema 约束的价值。

### 2) 读 toolCalls 并手动 dispatch

`chat()` 回来后，模型的调用意图在 `result.toolCalls` 里。我们按 `name` 找到本地实现去执行：

```ts
function dispatchTool(call: ToolCall): string {
  const impl = TOOL_IMPLEMENTATIONS[call.name];
  if (!impl) return `Error: 未知工具 "${call.name}"`;
  try {
    return impl(call.arguments);
  } catch (err) {
    // 把异常转成字符串回传，让模型有机会换参数重试，而不是让程序崩掉
    return `Error: 工具 "${call.name}" 执行异常 — ${(err as Error).message}`;
  }
}
```

### 3) 往返循环：直到 stopReason 不是 tool_use

核心就是一个循环：发消息 → 若有工具调用就执行回传 → 再发，直到模型给出最终文本。

```ts
for (let step = 0; step < MAX_STEPS; step++) {
  const result = await llm.chat({ messages, system, tools: TOOL_SPECS });

  // 记下本回合 assistant 消息（含它发起的 toolCalls），作为下一轮上下文
  messages.push({
    role: "assistant",
    content: result.text,
    ...(result.toolCalls.length ? { toolCalls: result.toolCalls } : {}),
  });

  // 模型不再要求工具 → 得到最终答案，结束
  if (result.stopReason !== "tool_use" || result.toolCalls.length === 0) {
    console.log(result.text);
    return;
  }

  // 否则：逐个执行，每个结果回传一条 role:"tool" 消息
  for (const call of result.toolCalls) {
    const output = dispatchTool(call);
    messages.push({
      role: "tool",
      content: output,
      toolCallId: call.id, // 关键：用 id 把结果绑回「哪一次调用」
      name: call.name,
    });
  }
}
```

> **铁律**：assistant 发起的**每一个** `toolCall`，都必须有一条 `toolCallId` 与之对应的 `tool` 结果消息回传。漏一个，下一轮请求就会因「悬空的工具调用」而报错。

> **类型提醒**：本工程开了 `noUncheckedIndexedAccess`，所以 `TOOL_IMPLEMENTATIONS[call.name]` 的结果是 `fn | undefined`，必须先判空再用——代码里的 `if (!impl)` 守卫正是为此。

---

## 三、运行

```bash
# 默认厂商（.env 里的 LLM_PROVIDER）
npx tsx lessons/05-tool-use-basics/index.ts
```

切换厂商（原生工具调用 Claude / OpenAI 都支持，课程已统一抽象）：

```bash
# PowerShell:
$env:LLM_PROVIDER="openai"; npx tsx lessons/05-tool-use-basics/index.ts
# macOS / Linux:
LLM_PROVIDER=openai npx tsx lessons/05-tool-use-basics/index.ts
```

预期输出：你会看到 1～2 轮 `chat()`，每轮打印模型请求了哪些工具、传了什么参数、本地返回了什么，最后一轮 `stopReason` 变为 `stop`，给出融合了天气与计算结果的最终回答。

---

## 四、练习

1. **加一个工具**：手写一个 `get_time`（返回当前时间字符串）的 `ToolSpec` 和实现，问模型「现在几点」，观察它是否主动调用。
2. **故意写坏 schema**：把 `calculate` 的 `op` 描述删掉、或把 `enum` 去掉，看模型传参的准确率怎么变——体会 description / enum 的作用。
3. **制造工具错误**：问一个除以 0 的算式，观察 `Error: 除数不能为 0` 回传后，模型会不会换个说法解释给用户。
4. **打印往返轮数**：统计跑完一次共调用了几次 `chat()`、几次工具，理解「往返」的成本。
5. **进阶**：把问题改成需要「先查北京、再查上海、最后算温差」，验证一回合可能返回**多个** `toolCalls`，以及你的回传循环是否都覆盖到了。

---

## 五、小结与延伸

- 工具调用 = 模型**请求**、你**执行**、结果**回传**，再让模型基于结果作答。
- 用 `stopReason === "tool_use"` 驱动循环，用 `toolCallId` 把结果绑回调用。
- 手写 JSON Schema 能跑，但**易错、难维护、不可扩展**：字段一多就容易漏 `required`、类型写错、和真实执行逻辑对不上。下一章 [第 06 章 · 构建工具系统](../06-building-a-tool-system/README.md) 用 **zod** 一份 schema 同时搞定「给模型的描述」和「执行前的运行期校验」，彻底告别手写。

> 💡 **面试会问**：function calling 的完整往返是怎样的？模型会自己执行工具吗？为什么工具调用比「让模型输出固定格式再正则解析」更可靠？`toolCallId` 是干什么用的？
