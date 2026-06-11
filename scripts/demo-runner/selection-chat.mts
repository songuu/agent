const MAX_SELECTED_TEXT_LENGTH = 6_000;
const MAX_QUESTION_LENGTH = 1_000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CONTENT_LENGTH = 2_000;
const MAX_PAGE_TITLE_LENGTH = 160;
const MAX_PAGE_PATH_LENGTH = 240;

export type SelectionChatMessageRole = "user" | "assistant";

export interface SelectionChatHistoryMessage {
  role: SelectionChatMessageRole;
  content: string;
}

export interface SelectionChatRequest {
  selectedText: string;
  question: string;
  pageTitle?: string;
  pagePath?: string;
  messages?: SelectionChatHistoryMessage[];
}

export interface NormalizedSelectionChatRequest extends SelectionChatRequest {
  messages: SelectionChatHistoryMessage[];
}

export interface SelectionChatFrame {
  type: "thinking" | "text" | "done" | "error";
  data: string | Record<string, unknown>;
}

export interface SelectionChatContext {
  request: NormalizedSelectionChatRequest;
  signal: AbortSignal;
  writeFrame: (frame: SelectionChatFrame) => void;
}

export type SelectionChatHandler = (context: SelectionChatContext) => Promise<void>;

interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

interface LLMStreamChunk {
  type: "text" | "thinking" | "done";
  text?: string;
  result?: {
    stopReason: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
  };
}

interface LLMClientLike {
  provider: string;
  model: string;
  stream(options: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  }): AsyncIterable<LLMStreamChunk>;
}

export function normalizeSelectionChatRequest(input: unknown): NormalizedSelectionChatRequest {
  if (!input || typeof input !== "object") {
    throw new Error("request body must be an object");
  }
  const record = input as Record<string, unknown>;
  const selectedText = normalizeTextField(record.selectedText, MAX_SELECTED_TEXT_LENGTH);
  const question = normalizeTextField(record.question, MAX_QUESTION_LENGTH);
  if (!selectedText) throw new Error("selectedText is required");
  if (!question) throw new Error("question is required");

  return {
    selectedText,
    question,
    pageTitle: normalizeOptionalTextField(record.pageTitle, MAX_PAGE_TITLE_LENGTH),
    pagePath: normalizeOptionalTextField(record.pagePath, MAX_PAGE_PATH_LENGTH),
    messages: normalizeHistoryMessages(record.messages),
  };
}

export function buildSelectionChatMessages(request: SelectionChatRequest): LLMMessage[] {
  const pageMeta = [
    request.pageTitle ? `页面标题：${request.pageTitle}` : "",
    request.pagePath ? `页面路径：${request.pagePath}` : "",
  ].filter(Boolean).join("\n");

  return [
    {
      role: "system",
      content:
        "你是 Agent 课程助教。只围绕用户选中的课程内容解释，先指出概念边界，再给出可执行学习建议。回答中文，保持简洁、准确；如果选区不足以回答，要明确说明缺口。",
    },
    ...(request.messages ?? []).map((message): LLMMessage => ({
      role: message.role,
      content: message.content,
    })),
    {
      role: "user",
      content: [
        pageMeta,
        "用户选中的课程内容：",
        request.selectedText,
        "",
        "用户问题：",
        request.question,
      ].filter((part) => part !== "").join("\n"),
    },
  ];
}

export function createSelectionChatHandler(
  llmFactory?: () => LLMClientLike,
): SelectionChatHandler {
  return async ({ request, signal, writeFrame }) => {
    const llm = llmFactory ? llmFactory() : await loadDefaultLLM();
    let finalUsage: { inputTokens: number; outputTokens: number } | undefined;
    let stopReason = "other";

    try {
      for await (const chunk of llm.stream({
        messages: buildSelectionChatMessages(request),
        temperature: 0.2,
        maxTokens: 1_200,
        signal,
      })) {
        if (signal.aborted) return;
        if (chunk.type === "thinking" && chunk.text) {
          writeFrame({ type: "thinking", data: chunk.text });
          continue;
        }
        if (chunk.type === "text" && chunk.text) {
          writeFrame({ type: "text", data: chunk.text });
          continue;
        }
        if (chunk.type === "done") {
          finalUsage = chunk.result?.usage;
          stopReason = chunk.result?.stopReason ?? "other";
        }
      }
    } catch (error) {
      // Intentional abort cancels the upstream SDK request, which surfaces here as
      // an abort error. Swallow it (the connection is already closing); re-throw
      // anything else so the server emits an error frame to the client.
      if (signal.aborted) return;
      throw error;
    }

    writeFrame({
      type: "done",
      data: {
        provider: llm.provider,
        model: llm.model,
        stopReason,
        usage: finalUsage ?? { inputTokens: 0, outputTokens: 0 },
      },
    });
  };
}

async function loadDefaultLLM(): Promise<LLMClientLike> {
  const modulePath = "../../src/shared/llm/index.js";
  const module = (await import(modulePath)) as { getLLM: () => LLMClientLike };
  return module.getLLM();
}

function normalizeTextField(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

function normalizeOptionalTextField(value: unknown, maxLength: number): string | undefined {
  const normalized = normalizeTextField(value, maxLength);
  return normalized || undefined;
}

function normalizeHistoryMessages(value: unknown): SelectionChatHistoryMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item): SelectionChatHistoryMessage | undefined => {
      if (!item || typeof item !== "object") return undefined;
      const record = item as Record<string, unknown>;
      if (record.role !== "user" && record.role !== "assistant") return undefined;
      const content = normalizeTextField(record.content, MAX_HISTORY_CONTENT_LENGTH);
      if (!content) return undefined;
      return { role: record.role, content };
    })
    .filter((item): item is SelectionChatHistoryMessage => Boolean(item));
}
