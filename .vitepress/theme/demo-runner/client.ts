import { createDemoFrameParser, type DemoFrame } from "./stream";

declare const __DEMO_RUNNER_TOKEN__: string | undefined;
declare const __DEMO_RUNNER_BASE_URL__: string | undefined;
declare const __DEMO_RUNNER_CLIENT_ENABLED__: boolean | undefined;

type NeedsKey = "none" | "llm" | "embedding";
type BadgeTone = "ok" | "warn" | "bad" | "";

interface RunnerConfig {
  provider: string;
  model: string;
  hasKey: boolean;
  baseURL: "official" | "localhost" | "custom";
  ollamaReachable: "unknown" | "yes" | "no";
}

interface RunnerState {
  baseURL: string;
  token: string;
  available: boolean;
  canRun: boolean;
  running: boolean;
  message: string;
  config?: RunnerConfig;
}

class RunnerHttpError extends Error {
  constructor(readonly statusCode: number) {
    super(`runner request failed: ${statusCode}`);
  }
}

interface PanelElements {
  root: HTMLElement;
  runButton: HTMLButtonElement;
  stopButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  statusBadge: HTMLElement;
  providerBadge: HTMLElement;
  keyBadge: HTMLElement;
  terminalMount: HTMLElement;
  message: HTMLElement;
}

const initialized = new WeakSet<HTMLElement>();

if (typeof window !== "undefined") {
  installDemoRunnerPanels();
}

function installDemoRunnerPanels(): void {
  scanDemoRunnerPanels();
  const observer = new MutationObserver(() => scanDemoRunnerPanels());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanDemoRunnerPanels(): void {
  document.querySelectorAll<HTMLElement>("[data-demo-runner]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    createPanel(root);
  });
}

function createPanel(root: HTMLElement): void {
  const token = readBuildConstant("__DEMO_RUNNER_TOKEN__", __DEMO_RUNNER_TOKEN__);
  if (!shouldInstallDemoRunnerPanel(__DEMO_RUNNER_CLIENT_ENABLED__, token)) {
    root.hidden = true;
    root.replaceChildren();
    return;
  }

  const demoId = root.dataset.demoId?.trim() ?? "";
  const demoTitle = root.dataset.demoTitle?.trim() || `Demo ${demoId}`;
  const needsKey = (root.dataset.needsKey as NeedsKey | undefined) ?? "llm";
  const state: RunnerState = {
    baseURL: readBuildConstant("__DEMO_RUNNER_BASE_URL__", __DEMO_RUNNER_BASE_URL__) || "http://127.0.0.1:5174",
    token,
    available: false,
    canRun: false,
    running: false,
    message: "正在检测本地 runner...",
  };

  root.classList.add("demo-runner-card");
  root.innerHTML = "";

  const header = document.createElement("div");
  header.className = "demo-runner-header";

  const titleWrap = document.createElement("div");
  const title = document.createElement("p");
  title.className = "demo-runner-title";
  title.textContent = `本章代码演示：${demoTitle}`;

  const meta = document.createElement("div");
  meta.className = "demo-runner-meta";

  const statusBadge = createBadge("检测中", "warn");
  const providerBadge = createBadge("provider: -", "");
  const keyBadge = createBadge(needsKey === "none" ? "无需 key" : "key: 检测中", "");
  meta.append(statusBadge, providerBadge, keyBadge);
  titleWrap.append(title, meta);

  const toolbar = document.createElement("div");
  toolbar.className = "demo-runner-toolbar";
  const runButton = createButton("运行");
  const stopButton = createButton("停止");
  const clearButton = createButton("清屏");
  stopButton.disabled = true;
  toolbar.append(runButton, stopButton, clearButton);

  header.append(titleWrap, toolbar);

  const terminalMount = document.createElement("div");
  terminalMount.className = "demo-runner-terminal";

  const message = document.createElement("div");
  message.className = "demo-runner-message";
  message.textContent = state.message;

  root.append(header, terminalMount, message);

  const elements: PanelElements = {
    root,
    runButton,
    stopButton,
    clearButton,
    statusBadge,
    providerBadge,
    keyBadge,
    terminalMount,
    message,
  };

  renderState(elements, state, needsKey);

  let terminalState: Awaited<ReturnType<typeof ensureTerminal>> | undefined;
  let terminalWriter: ReturnType<typeof createBufferedTerminalWriter> | undefined;
  let abortController: AbortController | undefined;

  runButton.addEventListener("click", async () => {
    if (!demoId || !state.canRun || state.running) return;
    terminalState ??= await ensureTerminal(terminalMount);
    terminalWriter ??= createBufferedTerminalWriter(terminalState.term);
    terminalState.term.clear();
    terminalState.term.writeln(`$ pnpm lesson ${demoId}`);
    terminalState.term.writeln("");
    state.running = true;
    state.message = "运行中...";
    renderState(elements, state, needsKey);
    abortController = new AbortController();

    try {
      await runDemo({
        baseURL: state.baseURL,
        token: state.token,
        demoId,
        signal: abortController.signal,
        onFrame(frame) {
          terminalWriter!.writeFrame(frame);
        },
      });
      terminalWriter.flush();
      state.message = "运行结束。";
    } catch (error) {
      terminalWriter?.flush();
      const detail = error instanceof Error ? error.message : "unknown error";
      terminalState.term.writeln(`\x1b[31m${detail}\x1b[0m`);
      state.message = "运行失败。";
    } finally {
      state.running = false;
      abortController = undefined;
      renderState(elements, state, needsKey);
    }
  });

  stopButton.addEventListener("click", async () => {
    abortController?.abort();
    await stopDemo(state.baseURL, state.token).catch(() => undefined);
  });

  clearButton.addEventListener("click", async () => {
    terminalState ??= await ensureTerminal(terminalMount);
    terminalState.term.clear();
  });

  void probeConfig(state, elements, needsKey);
}

async function probeConfig(
  state: RunnerState,
  elements: PanelElements,
  needsKey: NeedsKey,
): Promise<void> {
  try {
    const response = await fetch(`${state.baseURL}/api/config`, {
      method: "GET",
      headers: runnerHeaders(state.token),
    });
    if (!response.ok) throw new RunnerHttpError(response.status);
    const payload = (await response.json()) as { ok?: boolean; config?: RunnerConfig };
    if (!payload.ok || !payload.config) throw new Error("runner config payload is invalid");
    state.config = payload.config;
    state.available = true;
    state.canRun = canRunWithConfig(payload.config, needsKey);
    state.message = state.canRun
      ? "本地 runner 已就绪。"
      : missingKeyMessage(payload.config, needsKey);
  } catch (error) {
    state.available = false;
    state.canRun = false;
    state.message = configErrorMessage(error);
  }
  renderState(elements, state, needsKey);
}

async function runDemo(options: {
  baseURL: string;
  token: string;
  demoId: string;
  signal: AbortSignal;
  onFrame: (frame: DemoFrame) => void;
}): Promise<void> {
  const response = await fetch(`${options.baseURL}/api/run?demo=${encodeURIComponent(options.demoId)}`, {
    method: "POST",
    headers: runnerHeaders(options.token),
    signal: options.signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`runner request failed: ${response.status}`);
  }

  const parser = createDemoFrameParser(options.onFrame);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(value);
  }
  parser.flush();
}

async function stopDemo(baseURL: string, token: string): Promise<void> {
  if (!token) return;
  await fetch(`${baseURL}/api/stop`, {
    method: "POST",
    headers: runnerHeaders(token),
  });
}

async function ensureTerminal(mount: HTMLElement) {
  const [{ Terminal }, { FitAddon }] = await Promise.all([
    import("@xterm/xterm"),
    import("@xterm/addon-fit"),
    import("@xterm/xterm/css/xterm.css"),
  ]);
  if (mount.dataset.ready === "1") {
    return (mount as HTMLElement & { __terminalState: { term: InstanceType<typeof Terminal>; fit: InstanceType<typeof FitAddon> } }).__terminalState;
  }
  const term = new Terminal({
    convertEol: true,
    cursorBlink: false,
    fontFamily: "JetBrains Mono, Consolas, monospace",
    fontSize: 13,
    theme: {
      background: "#0f172a",
      foreground: "#e5e7eb",
    },
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(mount);
  fit.fit();
  const resizeObserver = new ResizeObserver(() => fit.fit());
  resizeObserver.observe(mount);
  mount.dataset.ready = "1";
  const state = { term, fit };
  (mount as HTMLElement & { __terminalState: typeof state }).__terminalState = state;
  return state;
}

export function createBufferedTerminalWriter(
  term: { write: (value: string) => void; writeln: (value: string) => void },
  schedule: (flush: () => void) => void = scheduleTerminalFlush,
): { writeFrame(frame: DemoFrame): void; flush(): void } {
  let queue: DemoFrame[] = [];
  let scheduled = false;
  let activeSegment: DemoFrame["type"] | undefined;

  const flush = () => {
    scheduled = false;
    const frames = queue;
    queue = [];
    for (const frame of frames) {
      writeFrameNow(term, frame, activeSegment);
      activeSegment = nextSegment(activeSegment, frame);
    }
  };

  return {
    writeFrame(frame) {
      queue.push(frame);
      if (scheduled) return;
      scheduled = true;
      schedule(flush);
    },
    flush,
  };
}

function writeFrameNow(
  term: { write: (value: string) => void; writeln: (value: string) => void },
  frame: DemoFrame,
  activeSegment: DemoFrame["type"] | undefined,
): void {
  if (frame.type === "stdout") {
    closeDecoratedSegment(term, activeSegment);
    term.write(String(frame.data));
    return;
  }
  if (frame.type === "stderr") {
    if (activeSegment !== "stderr") {
      closeDecoratedSegment(term, activeSegment);
      term.write(`\x1b[33m[stderr]\x1b[0m \x1b[33m${String(frame.data)}\x1b[0m`);
      return;
    }
    term.write(`\x1b[33m${String(frame.data)}\x1b[0m`);
    return;
  }
  if (frame.type === "thinking") {
    if (activeSegment !== "thinking") {
      closeDecoratedSegment(term, activeSegment);
      term.write(`\x1b[36m[thinking]\x1b[0m \x1b[2m${String(frame.data)}`);
      return;
    }
    term.write(String(frame.data));
    return;
  }
  if (frame.type === "exit") {
    closeDecoratedSegment(term, activeSegment);
    term.writeln("");
    term.writeln(`exit: ${String(frame.data)}`);
  }
}

function closeDecoratedSegment(
  term: { write: (value: string) => void },
  activeSegment: DemoFrame["type"] | undefined,
): void {
  if (activeSegment === "thinking" || activeSegment === "stderr") {
    term.write("\x1b[0m\n");
  }
}

function nextSegment(
  activeSegment: DemoFrame["type"] | undefined,
  frame: DemoFrame,
): DemoFrame["type"] | undefined {
  if (frame.type === "thinking" || frame.type === "stderr") return frame.type;
  if (frame.type === "stdout") return "stdout";
  if (frame.type === "exit") return undefined;
  return activeSegment;
}

function scheduleTerminalFlush(flush: () => void): void {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(flush);
    return;
  }
  setTimeout(flush, 16);
}

function renderState(elements: PanelElements, state: RunnerState, needsKey: NeedsKey): void {
  elements.runButton.disabled = !state.canRun || state.running;
  elements.stopButton.disabled = !state.running;
  elements.message.textContent = state.message;

  if (state.running) {
    setBadge(elements.statusBadge, "运行中", "warn");
  } else if (state.available && state.canRun) {
    setBadge(elements.statusBadge, "runner ready", "ok");
  } else {
    setBadge(elements.statusBadge, "runner offline", "bad");
  }

  if (state.config) {
    setBadge(elements.providerBadge, `${state.config.provider} / ${state.config.model}`, "");
    const keyRequired = needsKey !== "none" && state.config.provider !== "ollama";
    setBadge(
      elements.keyBadge,
      keyRequired ? (state.config.hasKey ? "key ready" : "key missing") : "无需 key",
      keyRequired ? (state.config.hasKey ? "ok" : "bad") : "ok",
    );
  } else {
    setBadge(elements.providerBadge, "provider: -", "");
    setBadge(elements.keyBadge, needsKey === "none" ? "无需 key" : "key: -", "");
  }
}

function canRunWithConfig(config: RunnerConfig, needsKey: NeedsKey): boolean {
  if (needsKey === "none") return true;
  if (config.provider === "ollama") return true;
  return config.hasKey;
}

function missingKeyMessage(config: RunnerConfig, needsKey: NeedsKey): string {
  if (needsKey === "embedding") {
    return `当前 ${config.provider} 配置缺少可用 key；该 demo 需要 embedding key。`;
  }
  return `当前 ${config.provider} 配置缺少可用 key；请检查 .env。`;
}

function runnerHeaders(token: string): HeadersInit {
  const headers: Record<string, string> = {
    "X-Demo-Runner": "1",
  };
  if (token) headers["X-Demo-Runner-Token"] = token;
  return headers;
}

function configErrorMessage(error: unknown): string {
  if (error instanceof RunnerHttpError && error.statusCode === 401) {
    return "生产 runner 需要先登录 songuu.top。";
  }
  if (error instanceof RunnerHttpError && error.statusCode === 403) {
    return "生产 runner 拒绝当前请求。请确认登录状态与访问域名。";
  }
  return "runner 未启动或无法连接。";
}

function createButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "demo-runner-button";
  button.textContent = label;
  return button;
}

function createBadge(label: string, tone: BadgeTone): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "demo-runner-badge";
  setBadge(badge, label, tone);
  return badge;
}

function setBadge(badge: HTMLElement, label: string, tone: BadgeTone): void {
  badge.textContent = label;
  if (tone) badge.dataset.tone = tone;
  else delete badge.dataset.tone;
}

function readBuildConstant(_name: string, value: string | undefined): string {
  return typeof value === "string" ? value : "";
}

export function shouldInstallDemoRunnerPanel(clientEnabled: boolean | undefined, token: string | undefined): boolean {
  return clientEnabled === true || Boolean(token);
}
