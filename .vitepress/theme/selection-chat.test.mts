import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createSelectionChatFrameParser,
  createSelectionChatPayload,
  normalizeSelectedText,
  shouldOfferSelectionChat,
} from "./selection-chat";

assert.equal(normalizeSelectedText("  第一行\n\n第二行\t第三行  "), "第一行 第二行 第三行");
assert.equal(normalizeSelectedText("abcdef", 4), "abcd...");
assert.equal(normalizeSelectedText("   "), "");

assert.equal(shouldOfferSelectionChat({ inArticle: true, text: "正文内容", collapsed: false }), true);
assert.equal(shouldOfferSelectionChat({ inArticle: false, text: "正文内容", collapsed: false }), false);
assert.equal(shouldOfferSelectionChat({ inArticle: true, text: "", collapsed: false }), false);
assert.equal(shouldOfferSelectionChat({ inArticle: true, text: "正文内容", collapsed: true }), false);

const payload = createSelectionChatPayload({
  selectedText: "  选中的课程正文  ",
  question: "  解释这段  ",
  pageTitle: "章节标题",
  pagePath: "/lessons/01/",
  messages: [
    { role: "assistant", content: "旧回答" },
    { role: "user", content: "追问" },
  ],
});
assert.deepEqual(payload, {
  selectedText: "选中的课程正文",
  question: "解释这段",
  pageTitle: "章节标题",
  pagePath: "/lessons/01/",
  messages: [
    { role: "assistant", content: "旧回答" },
    { role: "user", content: "追问" },
  ],
});

const frames: unknown[] = [];
const parser = createSelectionChatFrameParser((frame) => frames.push(frame));
parser.push('{"type":"thinking","data":"分析"}\n{"type":"text","data":"回答');
parser.push('一"}\n{"type":"done","data":{"usage":{"inputTokens":1,"outputTokens":2}}}');
parser.flush();
assert.deepEqual(frames, [
  { type: "thinking", data: "分析" },
  { type: "text", data: "回答一" },
  { type: "done", data: { usage: { inputTokens: 1, outputTokens: 2 } } },
]);

const source = readFileSync(".vitepress/theme/selection-chat.ts", "utf8");
const themeEntry = readFileSync(".vitepress/theme/index.ts", "utf8");
const styles = readFileSync(".vitepress/theme/custom.css", "utf8");

assert.match(source, /window\.getSelection\(\)/);
assert.match(source, /querySelector\(".vp-doc"\)/);
assert.match(source, /selection-chat-popover/);
assert.match(source, /selection-chat-drawer/);
assert.match(source, /\/api\/selection-chat/);
assert.match(source, /TextDecoderStream/);
assert.match(source, /frame\.type === "thinking"/);
assert.match(source, /AbortController/);
assert.match(source, /aria-label", "关闭对话"/);
assert.match(themeEntry, /import "\.\/selection-chat"/);
assert.match(styles, /\.selection-chat-popover/);
assert.match(styles, /\.selection-chat-drawer/);
assert.match(styles, /\.selection-chat-thinking/);

console.log("selection-chat.test.mts: ok");
