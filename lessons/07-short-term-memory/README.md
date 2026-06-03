# 第 07 章 · 短期记忆与上下文管理

> 所属阶段：**第二部分 · 从零手写核心**
> 预计用时：40 分钟 | 难度：⭐⭐☆☆☆

## 学习目标

学完本章你能够：

- [ ] 说清「对话记忆」的本质：**不是模型记住了，而是你把历史塞回了 `messages`**。
- [ ] 理解上下文窗口的**容量上限**与**成本**——为什么不能无脑堆历史。
- [ ] 实现**滑动窗口**：只保留最近 N 轮原文，控制每次请求的规模。
- [ ] 实现 **LLM 摘要压缩**：历史过长时把旧对话压成一条摘要，省 token 且不失忆。

## 前置知识

- 已读 [第 02 章 · 你的第一次 LLM 调用](../02-first-llm-call/README.md)——尤其是「LLM 无状态」那段。
- 已读 [第 06 章 · 构建工具系统](../06-building-a-tool-system/README.md)，熟悉 `messages` 数组的来回传递。
- 已按 [环境搭建](../../docs/setup.md) 配好 `.env`（至少一个厂商的 key）。

---

## 一、原理：「记忆」是你手动维护的一个数组

第 02 章讲过：LLM 是**无状态**的。它不会记得你上一句说了什么——除非你把历史再次放进输入里。

所以「对话记忆」根本没有魔法，它就是一个数组：

```
第 1 轮：messages = [u1]                         → 模型答 a1
第 2 轮：messages = [u1, a1, u2]                  → 模型答 a2   ← 把历史一起送回去
第 3 轮：messages = [u1, a1, u2, a2, u3]          → 模型答 a3
                    └──────── 你手动维护的历史 ────────┘
```

模型之所以「记得」你叫什么、讨厌什么，是因为**每次调用你都把前文一并发了过去**。

### 为什么不能无脑堆历史？两个硬约束

1. **窗口有限**：每个模型有最大上下文长度（token 上限）。历史无限增长，迟早撑爆请求直接报错。
2. **成本随长度上升**：你为**每次请求里的全部 token**付费。下面是「无脑堆历史」的成本曲线——

```
每次请求的输入 token
  ▲
  │                                   ╱  ← 第 N 轮要重发前 N-1 轮的全部内容
  │                              ╱        轮次越多，单轮越贵（近似 O(n²) 累计）
  │                         ╱
  │                    ╱
  │               ╱
  │          ╱
  │     ╱
  └──────────────────────────────────▶ 对话轮次
```

第 5 轮你不只发第 5 句，而是把前 4 轮**全部重发一遍**。轮次越多，每一轮都更贵。

### 解法：滑动窗口 + 摘要压缩

| 策略 | 做什么 | 代价 |
|------|--------|------|
| **滑动窗口** | 只保留最近 N 轮原文，更早的直接丢弃 | 简单，但会丢掉早期细节 |
| **LLM 摘要压缩** | 把窗口外的旧历史交给模型，压成一条短摘要 | 多一次 LLM 调用，但保住了关键信息 |

本章把两者**组合**起来，发送给模型的结构是：

```
[system]  +  [一条「前情摘要」]  +  [最近 N 轮原文]
   固定          压缩的旧历史           近距离细节不失真
```

最近的对话保留原文（细节准），更早的对话压成摘要（省空间），系统提示始终单独保留。

---

## 二、代码走读

核心是自写的 `Conversation` 类（完整代码见 [`conversation.ts`](./conversation.ts)），它内部把消息分成三段：**摘要 + 最近窗口**，系统提示单独存。

### 1）每轮把历史回灌——记忆就此生效

```ts
async ask(userInput: string, onSummarize?: OnSummarize): Promise<string> {
  this.append({ role: "user", content: userInput });

  // 发送前先压缩，确保规模受控
  await this.compactIfNeeded(onSummarize);

  const result = await this.client.chat({
    system: this.system,
    messages: this.buildMessages(), // ← 摘要 + 最近窗口，一并送回
  });

  this.append({ role: "assistant", content: result.text });
  return result.text;
}
```

`buildMessages()` 负责拼装：摘要（若有）放最前，再接最近窗口的原文。

```ts
buildMessages(): Message[] {
  const result: Message[] = [];
  if (this.summary) {
    // 用 assistant 角色承载摘要：像模型「自己记下的笔记」，比塞进 system 更自然
    result.push({ role: "assistant", content: `【前情摘要】${this.summary}` });
  }
  return [...result, ...this.recent];
}
```

### 2）滑动窗口 + 摘要压缩——规模超阈值才动手

```ts
private async compactIfNeeded(onSummarize?: OnSummarize): Promise<void> {
  // 窗口要保留的「最近原文」之外，还剩多少条旧历史
  const overflow = this.recent.length - this.keepRecentMessages;
  if (overflow < this.summarizeThreshold) return; // 没攒够，先不压

  const toSummarize = this.recent.slice(0, overflow); // 窗口外，待压缩
  const kept = this.recent.slice(overflow);           // 最近 N 轮，保留原文

  const newSummary = await this.summarize(toSummarize);

  this.summary = newSummary; // 一条短摘要换掉一大段旧历史
  this.recent = kept;        // 窗口收缩
  onSummarize?.({ removedMessages: toSummarize.length, summary: newSummary });
}
```

> WHY 攒够一批再压：摘要本身也是一次 LLM 调用（要花钱）。每来一条就压反而更贵，所以用 `summarizeThreshold` 控制频率。

### 3）压缩提示词决定「失忆」与否

摘要是一次普通的 `getLLM().chat()` 调用，关键在 system 提示明确「该保住什么」：

```ts
system:
  "你是对话记忆压缩器。把给定对话压成一段中文摘要，" +
  "务必保留：人名、数字、用户偏好、已做的决定、尚未解决的事项。" +
  "不要编造、不要寒暄，直接输出摘要本身。",
```

若已有旧摘要，会把它一并喂回去做**滚动摘要**，防止「越早的信息越容易丢」。

完整可运行示例见 [`index.ts`](./index.ts)：演示一证明它记得名字/偏好；演示二用一串闲聊把早期「暗号」顶出窗口、触发压缩，再验证暗号仍能从摘要里取回。

---

## 三、运行

```bash
# 默认厂商（.env 里的 LLM_PROVIDER），跑两段自动演示
npx tsx lessons/07-short-term-memory/index.ts

# 交互模式：自己多聊几句，感受「它记得」与「自动压缩」
npx tsx lessons/07-short-term-memory/index.ts --chat
```

临时切换厂商（仅本次运行）：

```bash
# PowerShell:
$env:LLM_PROVIDER="openai"; npx tsx lessons/07-short-term-memory/index.ts
# macOS / Linux:
LLM_PROVIDER=openai npx tsx lessons/07-short-term-memory/index.ts
```

想看到摘要的具体内容，可开启调试日志：

```bash
# PowerShell:
$env:DEBUG="1"; npx tsx lessons/07-short-term-memory/index.ts
# macOS / Linux:
DEBUG=1 npx tsx lessons/07-short-term-memory/index.ts
```

预期输出：演示一里它准确引用「林小满 / 讨厌香菜 / TypeScript」；演示二里会打印一行「触发摘要压缩」，且最后仍答得出会员编号 `A7-2025`。

---

## 四、练习

1. **改窗口大小**：把演示二的 `keepRecentTurns` 调大到 5，观察压缩触发得更晚、单次请求更贵。
2. **故意「失忆」**：把 `summarize()` 的 system 提示改成「随便概括两个字」，再跑演示二，观察会员编号被丢掉——体会摘要质量决定记忆质量。
3. **统计 token 成本**：在 `ask()` 里打印 `result.usage.inputTokens`，对比「开压缩」与「关压缩」两种情况下，靠后轮次的输入 token 差距。
4. **按 token 而非条数压缩**：把 `summarizeThreshold` 的判断从「消息条数」换成「估算字符数 / 4」（粗略 token 数），更贴近真实窗口约束。
5. **进阶**：让 `Conversation` 支持 `tool` 角色消息（配合第 06 章的工具系统），保证压缩时不破坏 `toolCallId` 的对应关系。

---

## 五、小结与延伸

- 对话记忆 = 手动维护并回灌 `messages`，模型本身仍是无状态的。
- 窗口有限、成本随轮次上升 → 必须管理历史：**滑动窗口**控规模，**LLM 摘要**保信息。
- 上一章 [第 06 章 · 构建工具系统](../06-building-a-tool-system/README.md) 让 Agent 会「动手」；本章让它会「记事」。
- 下一章 [第 08 章 · 嵌入与向量检索](../08-embeddings-and-vector-search/README.md) 解决「长期记忆」——把信息存进向量库，用到时再检索回来。

> 💡 **面试会问**：LLM 既然无状态，多轮对话的「记忆」是怎么实现的？上下文窗口满了怎么办？滑动窗口和摘要压缩各自的取舍是什么？
