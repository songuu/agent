declare const __DEMO_RUNNER_TOKEN__: string | undefined;
declare const __DEMO_RUNNER_BASE_URL__: string | undefined;
declare const __DEMO_RUNNER_CLIENT_ENABLED__: boolean | undefined;

type SelectionChatFrameType = "thinking" | "text" | "done" | "error";
type SelectionChatRole = "user" | "assistant";

interface SelectionChatFrame {
  type: SelectionChatFrameType;
  data: unknown;
}

interface SelectionChatMessage {
  role: SelectionChatRole;
  content: string;
}

interface SelectionOfferInput {
  inArticle: boolean;
  text: string;
  collapsed: boolean;
}

interface SelectionChatPayloadInput {
  selectedText: string;
  question: string;
  pageTitle?: string;
  pagePath?: string;
  messages?: SelectionChatMessage[];
}

interface SelectionChatPayload {
  selectedText: string;
  question: string;
  pageTitle?: string;
  pagePath?: string;
  messages: SelectionChatMessage[];
}

interface DrawerElements {
  root: HTMLElement;
  excerpt: HTMLElement;
  messages: HTMLElement;
  textarea: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  stopButton: HTMLButtonElement;
  status: HTMLElement;
}

interface ChatTurnElements {
  thinking: HTMLElement;
  answer: HTMLElement;
}

interface SelectionChatState {
  selectedText: string;
  drawerSelectedText?: string;
  messages: SelectionChatMessage[];
  abortController?: AbortController;
}

const MAX_SELECTED_TEXT_LENGTH = 6_000;
const MAX_QUESTION_LENGTH = 1_000;
const MAX_HISTORY_MESSAGES = 8;
const POPOVER_MARGIN = 12;
const state: SelectionChatState = {
  selectedText: "",
  messages: [],
};

let popover: HTMLElement | undefined;
let drawer: DrawerElements | undefined;
let selectionTimer: number | undefined;

if (typeof window !== "undefined" && isSelectionChatEnabled()) {
  installSelectionChat();
}

// Mirror the demo-runner client's enablement contract (shouldInstallDemoRunnerPanel):
// only mount when the runner client is enabled at build time or a dev token exists.
// Otherwise a runner-less build would still show the popover/drawer and every send
// would fetch a dead 127.0.0.1:5174 endpoint, surfacing a confusing "对话失败".
function isSelectionChatEnabled(): boolean {
  const enabled =
    typeof __DEMO_RUNNER_CLIENT_ENABLED__ === "boolean" ? __DEMO_RUNNER_CLIENT_ENABLED__ : false;
  return enabled || Boolean(readBuildConstant(__DEMO_RUNNER_TOKEN__));
}

export function normalizeSelectedText(text: string, maxLength = MAX_SELECTED_TEXT_LENGTH): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

export function shouldOfferSelectionChat(input: SelectionOfferInput): boolean {
  return input.inArticle && !input.collapsed && normalizeSelectedText(input.text).length > 0;
}

export function createSelectionChatPayload(input: SelectionChatPayloadInput): SelectionChatPayload {
  return {
    selectedText: normalizeSelectedText(input.selectedText),
    question: normalizeSelectedText(input.question, MAX_QUESTION_LENGTH),
    pageTitle: normalizeSelectedText(input.pageTitle ?? "", 160) || undefined,
    pagePath: normalizeSelectedText(input.pagePath ?? "", 240) || undefined,
    messages: (input.messages ?? [])
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role,
        content: normalizeSelectedText(message.content, 2_000),
      }))
      .filter((message) => message.content.length > 0)
      .slice(-MAX_HISTORY_MESSAGES),
  };
}

export interface SelectionChatFrameParser {
  push(chunk: string): void;
  flush(): void;
}

export function createSelectionChatFrameParser(
  onFrame: (frame: SelectionChatFrame) => void,
): SelectionChatFrameParser {
  let buffer = "";

  function readLine(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parsed = JSON.parse(trimmed) as SelectionChatFrame;
    if (!isSelectionChatFrame(parsed)) {
      throw new Error(`Invalid selection chat frame: ${trimmed}`);
    }
    onFrame(parsed);
  }

  return {
    push(chunk) {
      buffer += chunk;
      while (true) {
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex === -1) break;
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        readLine(line);
      }
    },
    flush() {
      if (!buffer.trim()) {
        buffer = "";
        return;
      }
      const line = buffer;
      buffer = "";
      readLine(line);
    },
  };
}

function installSelectionChat(): void {
  ensurePopover();
  ensureDrawer();
  document.addEventListener("selectionchange", scheduleSelectionRead);
  document.addEventListener("mouseup", scheduleSelectionRead);
  document.addEventListener("keyup", scheduleSelectionRead);
  document.addEventListener("pointerdown", (event) => {
    const target = event.target instanceof Element ? event.target : undefined;
    if (target?.closest(".selection-chat-popover, .selection-chat-drawer")) return;
    hidePopover();
  });
  window.addEventListener("scroll", hidePopover, { passive: true });
  window.addEventListener("resize", hidePopover, { passive: true });
}

function scheduleSelectionRead(): void {
  if (selectionTimer !== undefined) window.clearTimeout(selectionTimer);
  selectionTimer = window.setTimeout(readCurrentSelection, 20);
}

function readCurrentSelection(): void {
  selectionTimer = undefined;
  const selection = window.getSelection();
  const article = document.querySelector(".vp-doc");
  const text = selection ? normalizeSelectedText(selection.toString()) : "";
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : undefined;
  const inArticle = Boolean(article && range && containsRange(article, range) && !isExcludedRange(range));

  if (!selection || !range || !shouldOfferSelectionChat({ inArticle, text, collapsed: selection.isCollapsed })) {
    hidePopover();
    return;
  }

  state.selectedText = text;
  positionPopover(range);
}

function ensurePopover(): HTMLElement {
  if (popover) return popover;
  const root = document.createElement("div");
  root.className = "selection-chat-popover";
  root.hidden = true;
  root.setAttribute("role", "toolbar");

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "对话";
  button.addEventListener("click", () => {
    hidePopover();
    openDrawer(state.selectedText);
  });
  root.append(button);
  document.body.append(root);
  popover = root;
  return root;
}

function ensureDrawer(): DrawerElements {
  if (drawer) return drawer;
  const root = document.createElement("aside");
  root.className = "selection-chat-drawer";
  root.dataset.open = "false";
  root.setAttribute("aria-label", "选区对话");

  const header = document.createElement("div");
  header.className = "selection-chat-drawer-header";
  const title = document.createElement("p");
  title.className = "selection-chat-title";
  title.textContent = "选区对话";
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "selection-chat-icon-button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "关闭对话");
  closeButton.addEventListener("click", closeDrawer);
  header.append(title, closeButton);

  const excerpt = document.createElement("blockquote");
  excerpt.className = "selection-chat-excerpt";

  const messages = document.createElement("div");
  messages.className = "selection-chat-messages";

  const status = document.createElement("p");
  status.className = "selection-chat-status";
  status.textContent = "选中正文后提问。";

  const form = document.createElement("form");
  form.className = "selection-chat-form";
  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.maxLength = MAX_QUESTION_LENGTH;
  textarea.placeholder = "围绕选中的内容提问";
  const actions = document.createElement("div");
  actions.className = "selection-chat-actions";
  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.textContent = "停止";
  stopButton.disabled = true;
  stopButton.addEventListener("click", () => stopCurrentChat());
  const sendButton = document.createElement("button");
  sendButton.type = "submit";
  sendButton.textContent = "发送";
  actions.append(stopButton, sendButton);
  form.append(textarea, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitQuestion();
  });

  root.append(header, excerpt, messages, status, form);
  document.body.append(root);
  drawer = { root, excerpt, messages, textarea, sendButton, stopButton, status };
  return drawer;
}

function openDrawer(selectedText: string): void {
  const elements = ensureDrawer();
  if (state.drawerSelectedText !== selectedText) {
    state.messages = [];
    elements.messages.replaceChildren();
  }
  state.selectedText = selectedText;
  state.drawerSelectedText = selectedText;
  elements.excerpt.textContent = selectedText;
  elements.root.dataset.open = "true";
  elements.status.textContent = "输入问题后发送。";
  requestAnimationFrame(() => elements.textarea.focus());
}

function closeDrawer(): void {
  if (state.abortController) stopCurrentChat();
  ensureDrawer().root.dataset.open = "false";
}

async function submitQuestion(): Promise<void> {
  const elements = ensureDrawer();
  const question = normalizeSelectedText(elements.textarea.value, MAX_QUESTION_LENGTH);
  // The pinned excerpt the drawer shows is the source of truth, NOT the live page
  // selection: while the drawer is open the user can select other body text, which
  // updates state.selectedText. Sending that would silently answer the wrong passage.
  const selectedText = state.drawerSelectedText ?? "";
  if (!question || !selectedText) return;

  elements.textarea.value = "";
  state.messages.push({ role: "user", content: question });
  renderUserMessage(question);
  const assistantTurn = renderAssistantMessage();
  setRunningState(true, "正在连接模型...");

  const abortController = new AbortController();
  state.abortController = abortController;
  // Capture the streamed answer BEFORE any error string is appended below, so a
  // partial answer survives into multi-turn history while the error text stays out.
  let answerForHistory = "";
  try {
    await streamSelectionChat(question, selectedText, assistantTurn, abortController.signal);
    answerForHistory = assistantTurn.answer.textContent ?? "";
    setRunningState(false, "回答完成。");
  } catch (error) {
    answerForHistory = assistantTurn.answer.textContent ?? "";
    if (isAbortError(error)) {
      setRunningState(false, "已停止。");
      return;
    }
    const detail = error instanceof Error ? error.message : "对话请求失败";
    assistantTurn.answer.textContent += `\n${detail}`;
    setRunningState(false, "对话失败。");
  } finally {
    // Record the assistant turn even on abort/error so follow-up questions keep
    // the partial reply in context. Skip empty turns (immediate failure).
    if (answerForHistory) {
      state.messages.push({ role: "assistant", content: answerForHistory });
    }
    if (state.abortController === abortController) state.abortController = undefined;
  }
}

async function streamSelectionChat(
  question: string,
  selectedText: string,
  turn: ChatTurnElements,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(`${readBaseUrl()}/api/selection-chat`, {
    method: "POST",
    headers: selectionChatHeaders(),
    body: JSON.stringify(createSelectionChatPayload({
      selectedText,
      question,
      pageTitle: document.title,
      pagePath: window.location.pathname,
      messages: state.messages.slice(0, -1),
    })),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`selection chat request failed: ${response.status}`);
  }

  const parser = createSelectionChatFrameParser((frame) => {
    if (frame.type === "thinking") {
      turn.thinking.hidden = false;
      turn.thinking.textContent += String(frame.data);
    } else if (frame.type === "text") {
      turn.answer.textContent += String(frame.data);
    } else if (frame.type === "error") {
      throw new Error(String(frame.data));
    }
  });
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  // try/finally so an error/malformed frame (which throws out of parser.push)
  // still releases the reader and tears down the underlying fetch connection.
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(value);
    }
    parser.flush();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

function renderUserMessage(content: string): void {
  const item = document.createElement("div");
  item.className = "selection-chat-message selection-chat-message-user";
  item.textContent = content;
  ensureDrawer().messages.append(item);
  item.scrollIntoView({ block: "end" });
}

function renderAssistantMessage(): ChatTurnElements {
  const root = document.createElement("div");
  root.className = "selection-chat-message selection-chat-message-assistant";
  const thinking = document.createElement("pre");
  thinking.className = "selection-chat-thinking";
  thinking.hidden = true;
  const answer = document.createElement("div");
  answer.className = "selection-chat-answer";
  root.append(thinking, answer);
  ensureDrawer().messages.append(root);
  root.scrollIntoView({ block: "end" });
  return { thinking, answer };
}

function setRunningState(running: boolean, status: string): void {
  const elements = ensureDrawer();
  elements.sendButton.disabled = running;
  elements.stopButton.disabled = !running;
  elements.textarea.disabled = running;
  elements.status.textContent = status;
}

function stopCurrentChat(): void {
  // Aborting the fetch closes the connection; the server's `res.on("close")`
  // handler then aborts the in-flight selection chat. We deliberately do NOT POST
  // /api/stop here — that endpoint ALSO aborts any in-flight demo run, and the
  // local abort already tears this stream down end to end.
  state.abortController?.abort();
  state.abortController = undefined;
  const elements = ensureDrawer();
  setRunningState(false, "已停止。");
  elements.textarea.disabled = false;
}

function positionPopover(range: Range): void {
  const root = ensurePopover();
  const rect = firstUsableRect(range);
  if (!rect) {
    hidePopover();
    return;
  }
  root.hidden = false;
  const width = root.offsetWidth || 80;
  const height = root.offsetHeight || 36;
  const left = clamp(rect.left + rect.width / 2 - width / 2, POPOVER_MARGIN, window.innerWidth - width - POPOVER_MARGIN);
  const top = clamp(rect.top - height - 8, POPOVER_MARGIN, window.innerHeight - height - POPOVER_MARGIN);
  root.style.left = `${Math.round(left)}px`;
  root.style.top = `${Math.round(top)}px`;
}

function firstUsableRect(range: Range): DOMRect | undefined {
  const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
  return rects[0] ?? undefined;
}

function hidePopover(): void {
  if (popover) popover.hidden = true;
}

function containsRange(root: Element, range: Range): boolean {
  return root.contains(range.startContainer) && root.contains(range.endContainer);
}

function isExcludedRange(range: Range): boolean {
  return Boolean(
    closestElement(range.startContainer)?.closest("pre, code, kbd, samp, textarea, input, button, a, .selection-chat-drawer, .selection-chat-popover") ||
    closestElement(range.endContainer)?.closest("pre, code, kbd, samp, textarea, input, button, a, .selection-chat-drawer, .selection-chat-popover"),
  );
}

function closestElement(node: Node): Element | undefined {
  if (node instanceof Element) return node;
  return node.parentElement ?? undefined;
}

function selectionChatHeaders(): HeadersInit {
  const token = readBuildConstant(__DEMO_RUNNER_TOKEN__);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Demo-Runner": "1",
  };
  if (token) headers["X-Demo-Runner-Token"] = token;
  return headers;
}

function readBaseUrl(): string {
  return readBuildConstant(__DEMO_RUNNER_BASE_URL__) || "http://127.0.0.1:5174";
}

function readBuildConstant(value: string | undefined): string {
  return typeof value === "string" ? value : "";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isSelectionChatFrame(value: unknown): value is SelectionChatFrame {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return type === "thinking" || type === "text" || type === "done" || type === "error";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
