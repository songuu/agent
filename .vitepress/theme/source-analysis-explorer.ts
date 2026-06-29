import {
  POPULAR_SOURCE_REPOSITORIES,
  SOURCE_ANALYSIS_PRESETS,
  analyzePreset,
  analyzeRepositoryTree,
  answerSourceQuestion,
  buildGitHubFileUrl,
  buildRepositoryCodeMap,
  normalizeRepositoryInput,
  presetForSlug,
  selectQuestionFiles,
  type PopularRepository,
  type RepositoryCodeMapEdge,
  type RepositoryCodeMapLayer,
  type RepositoryAnalysis,
  type RepositoryAreaRow,
  type RepositoryFileRow,
  type RepositoryTreeItem,
  type SourceDocument,
  type SourceQuestionAnswer,
  type SourceQuestionCitation,
} from "./source-analysis-engine";

interface GitHubRepoMeta {
  full_name?: string;
  description?: string | null;
  default_branch?: string;
  html_url?: string;
  updated_at?: string;
}

interface GitHubTreeResponse {
  tree?: Array<{ path?: string; type?: string; size?: number }>;
  truncated?: boolean;
}

type SourceConversationMode = "chat" | "codemap";

interface SourceConversationTurn {
  id: number;
  question: string;
  answer: SourceQuestionAnswer;
}

const initialized = new WeakSet<HTMLElement>();

if (typeof window !== "undefined") {
  installSourceAnalysisExplorers();
}

function installSourceAnalysisExplorers(): void {
  scanSourceAnalysisExplorers();
  const observer = new MutationObserver(() => scanSourceAnalysisExplorers());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanSourceAnalysisExplorers(): void {
  document.querySelectorAll<HTMLElement>("[data-source-analysis-explorer]").forEach((root) => {
    if (initialized.has(root)) return;
    initialized.add(root);
    renderExplorer(root);
  });
}

function renderExplorer(root: HTMLElement): void {
  root.classList.add("source-analysis-explorer");
  root.replaceChildren();

  const defaultAnalysis = analyzePreset(SOURCE_ANALYSIS_PRESETS[0]!);
  let current = defaultAnalysis;
  const sourceCache = new Map<string, string>();

  const shell = document.createElement("section");
  shell.className = "source-analysis-shell";
  shell.setAttribute("aria-label", "源码仓库解析器");

  const hero = document.createElement("header");
  hero.className = "source-analysis-hero";
  const titleGroup = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "source-analysis-eyebrow";
  eyebrow.textContent = "DeepWiki-style Repository Analysis";
  const title = document.createElement("h2");
  title.textContent = "Which repo would you like to understand?";
  const description = document.createElement("p");
  description.className = "source-analysis-desc";
  description.textContent =
    "选择热门仓库，或粘贴任意公开 GitHub repo，直接生成仓库矩阵、Relevant Source Files、源码问答和阅读路径。";
  titleGroup.append(eyebrow, title, description);

  const stats = document.createElement("div");
  stats.className = "source-analysis-hero-stats";
  hero.append(titleGroup, stats);

  const form = document.createElement("form");
  form.className = "source-analysis-form";
  const input = document.createElement("input");
  input.type = "search";
  input.value = defaultAnalysis.slug;
  input.placeholder = "Search for repositories (or paste a link)";
  input.setAttribute("aria-label", "GitHub 仓库");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "解析";
  form.append(input, submit);

  const popular = document.createElement("section");
  popular.className = "source-analysis-popular";

  const presets = document.createElement("nav");
  presets.className = "source-analysis-presets";
  presets.setAttribute("aria-label", "内置源码解析仓库");
  for (const preset of SOURCE_ANALYSIS_PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = preset.name;
    button.dataset.slug = preset.slug;
    button.addEventListener("click", () => {
      input.value = preset.slug;
      current = analyzePreset(preset);
      status.textContent = "已加载内置源码解析矩阵。";
      renderAnalysis();
    });
    presets.append(button);
  }

  const status = document.createElement("p");
  status.className = "source-analysis-status";

  const body = document.createElement("div");
  body.className = "source-analysis-body";

  async function setRepository(value: string): Promise<void> {
    submit.disabled = true;
    status.textContent = "正在读取 GitHub repo tree...";
    try {
      current = await loadRepository(value);
      input.value = current.slug;
      status.textContent =
        current.source === "github"
          ? `GitHub tree 已解析：${current.stats.totalFiles} files${current.truncated ? " · GitHub 返回 truncated" : ""}`
          : "已加载内置源码解析矩阵。";
      renderAnalysis();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const target = normalizeRepositoryInput(value);
      const preset = target ? presetForSlug(target.slug) : undefined;
      if (preset) {
        current = analyzePreset(preset);
        input.value = preset.slug;
        status.textContent = `GitHub 读取失败，已回退到内置矩阵：${message}`;
        renderAnalysis();
      } else {
        status.textContent = `解析失败：${message}`;
      }
    } finally {
      submit.disabled = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void setRepository(input.value);
  });

  function renderAnalysis(): void {
    stats.replaceChildren(
      statCard(String(current.stats.totalFiles), "files"),
      statCard(String(current.areas.length), "matrix rows"),
      statCard(String(current.keyFiles.length), "source files"),
    );

    for (const button of presets.querySelectorAll<HTMLButtonElement>("button")) {
      button.dataset.active = button.dataset.slug === current.slug ? "true" : "false";
    }

    renderPopularRepositories(popular, current.slug, {
      onAdd: () => {
        input.focus();
        input.select();
      },
      onAnalyze: (slug) => {
        input.value = slug;
        void setRepository(slug);
      },
    });

    body.replaceChildren(
      renderOverview(current),
      renderLanguages(current),
      renderAreaMatrix(current),
      renderFileMatrix(current),
      renderQuestionPanel(current, sourceCache),
      renderReadingPath(current),
    );
  }

  renderAnalysis();
  shell.append(hero, form, popular, presets, status, body);
  root.append(shell);
}

async function loadRepository(input: string): Promise<RepositoryAnalysis> {
  const target = normalizeRepositoryInput(input);
  if (!target) throw new Error("请输入 GitHub owner/repo 或仓库 URL");

  const preset = presetForSlug(target.slug);
  const headers = { Accept: "application/vnd.github+json" };
  const metaResponse = await fetch(`https://api.github.com/repos/${target.slug}`, { headers });
  if (!metaResponse.ok) {
    if (preset) return analyzePreset(preset);
    throw new Error(`GitHub repo meta ${metaResponse.status}`);
  }
  const meta = (await metaResponse.json()) as GitHubRepoMeta;
  const branch = meta.default_branch || preset?.defaultBranch || "main";
  const treeResponse = await fetch(
    `https://api.github.com/repos/${target.slug}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers },
  );
  if (!treeResponse.ok) {
    if (preset) return analyzePreset(preset);
    throw new Error(`GitHub tree ${treeResponse.status}`);
  }
  const tree = (await treeResponse.json()) as GitHubTreeResponse;
  const items: RepositoryTreeItem[] = (tree.tree ?? [])
    .filter((item) => item.path && (item.type === "blob" || item.type === "tree"))
    .map((item) => ({
      path: item.path!,
      type: item.type === "tree" ? "dir" : "file",
      size: item.size,
    }));

  if (items.length === 0) throw new Error("GitHub tree 为空");

  return analyzeRepositoryTree({
    slug: target.slug,
    name: meta.full_name ?? target.slug,
    description: meta.description ?? preset?.description ?? "公开 GitHub 仓库源码矩阵",
    defaultBranch: branch,
    sourceUrl: meta.html_url ?? `https://github.com/${target.slug}`,
    indexedAt: (meta.updated_at ?? new Date().toISOString()).slice(0, 10),
    focus: preset?.focus,
    items,
    source: "github",
    truncated: tree.truncated,
  });
}

function renderOverview(analysis: RepositoryAnalysis): HTMLElement {
  const section = document.createElement("section");
  section.className = "source-analysis-panel source-analysis-overview";
  section.append(panelHeading("仓库总览", analysis.description));

  const list = document.createElement("dl");
  list.className = "source-analysis-definition-grid";
  definition(list, "仓库", analysis.slug);
  definition(list, "默认分支", analysis.defaultBranch);
  definition(list, "索引时间", analysis.indexedAt);
  definition(list, "核心复杂度", analysis.focus);
  definition(list, "来源", analysis.source === "github" ? "GitHub live tree" : "内置源码矩阵");
  section.append(list);

  const link = document.createElement("a");
  link.className = "source-analysis-primary-link";
  link.href = analysis.sourceUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "打开 GitHub 仓库";
  section.append(link);
  return section;
}

function renderLanguages(analysis: RepositoryAnalysis): HTMLElement {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("语言与文件构成", "先看代码/测试/文档比例，判断该从实现、测试还是文档下手。"));
  const grid = document.createElement("div");
  grid.className = "source-analysis-language-grid";
  const max = Math.max(...analysis.languages.map((row) => row.files), 1);
  for (const row of analysis.languages) {
    const item = document.createElement("div");
    item.className = "source-analysis-language";
    const head = document.createElement("span");
    head.textContent = `${row.language} · ${row.files}`;
    const bar = document.createElement("i");
    bar.style.width = `${Math.max(6, (row.files / max) * 100)}%`;
    item.append(head, bar);
    grid.append(item);
  }
  section.append(grid);
  return section;
}

function renderAreaMatrix(analysis: RepositoryAnalysis): HTMLElement {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("仓库矩阵", "按目录/包聚合，定位每块代码的职责、信号和首读文件。"));
  const table = document.createElement("table");
  table.className = "source-analysis-table";
  table.append(tableHead(["区域", "层", "文件", "代码", "测试", "文档", "信号", "先读"]));
  const body = document.createElement("tbody");
  for (const row of analysis.areas) body.append(areaRow(row, analysis));
  table.append(body);
  section.append(table);
  return section;
}

function renderFileMatrix(analysis: RepositoryAnalysis): HTMLElement {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("Relevant Source Files", "DeepWiki 式高信号文件入口：从这些文件追 runtime 主链。"));
  const list = document.createElement("ol");
  list.className = "source-analysis-file-list";
  for (const file of analysis.keyFiles) list.append(fileRow(file, analysis));
  section.append(list);
  return section;
}

function renderPopularRepositories(
  container: HTMLElement,
  activeSlug: string,
  actions: { onAdd: () => void; onAnalyze: (slug: string) => void },
): void {
  const header = document.createElement("header");
  header.className = "source-analysis-popular-heading";
  const title = document.createElement("h3");
  title.textContent = "热门库直接解读";
  const desc = document.createElement("p");
  desc.textContent = "参照 DeepWiki 首页形态，把热门仓库做成可点击的源码解析入口。";
  header.append(title, desc);

  const grid = document.createElement("div");
  grid.className = "source-analysis-popular-grid";

  const add = document.createElement("button");
  add.type = "button";
  add.className = "source-analysis-popular-card source-analysis-popular-card--add";
  add.addEventListener("click", actions.onAdd);
  const plus = document.createElement("span");
  plus.className = "source-analysis-popular-plus";
  plus.textContent = "+";
  const addTitle = document.createElement("strong");
  addTitle.textContent = "Add repo";
  const addHint = document.createElement("span");
  addHint.className = "source-analysis-popular-add-hint";
  addHint.textContent = "Paste GitHub URL";
  const addArrow = document.createElement("span");
  addArrow.className = "source-analysis-popular-arrow";
  addArrow.textContent = "→";
  add.append(plus, addTitle, addHint, addArrow);
  grid.append(add);

  for (const repo of POPULAR_SOURCE_REPOSITORIES) {
    grid.append(popularRepositoryCard(repo, activeSlug, actions.onAnalyze));
  }

  container.replaceChildren(header, grid);
}

function popularRepositoryCard(
  repo: PopularRepository,
  activeSlug: string,
  onAnalyze: (slug: string) => void,
): HTMLButtonElement {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "source-analysis-popular-card";
  card.dataset.slug = repo.slug;
  card.dataset.active = repo.slug.toLowerCase() === activeSlug.toLowerCase() ? "true" : "false";
  card.setAttribute("aria-label", `解析 ${repo.slug}`);
  card.addEventListener("click", () => onAnalyze(repo.slug));

  const head = document.createElement("span");
  head.className = "source-analysis-popular-card-head";
  const name = document.createElement("strong");
  name.textContent = repo.slug.replace("/", " / ");
  const arrow = document.createElement("span");
  arrow.className = "source-analysis-popular-arrow";
  arrow.textContent = "→";
  head.append(name, arrow);

  const desc = document.createElement("span");
  desc.className = "source-analysis-popular-desc";
  desc.textContent = repo.description;

  const meta = document.createElement("span");
  meta.className = "source-analysis-popular-meta";
  const stars = document.createElement("span");
  stars.textContent = repo.starsLabel ? `★ ${repo.starsLabel}` : "GitHub";
  const mode = document.createElement("span");
  mode.textContent = presetForSlug(repo.slug) ? "内置矩阵" : "Live tree";
  meta.append(stars, mode);

  card.append(head, desc, meta);
  return card;
}
function renderReadingPath(analysis: RepositoryAnalysis): HTMLElement {
  const section = document.createElement("section");
  section.className = "source-analysis-panel";
  section.append(panelHeading("阅读路径", "从 API 入口到 runtime，再到状态/工具/检索边界。"));
  const list = document.createElement("ol");
  list.className = "source-analysis-reading-path";
  for (const step of analysis.readingPath) {
    const item = document.createElement("li");
    item.textContent = step;
    list.append(item);
  }
  section.append(list);
  return section;
}

function areaRow(row: RepositoryAreaRow, analysis: RepositoryAnalysis): HTMLTableRowElement {
  const tr = document.createElement("tr");
  appendCell(tr, row.area);
  appendBadgeCell(tr, row.layer);
  appendCell(tr, String(row.fileCount));
  appendCell(tr, String(row.codeFiles));
  appendCell(tr, String(row.testFiles));
  appendCell(tr, String(row.docsFiles));
  appendCell(tr, row.signal);
  const link = document.createElement("a");
  link.href = buildGitHubFileUrl(analysis.slug, analysis.defaultBranch, row.readFirst);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = row.readFirst;
  const td = document.createElement("td");
  td.append(link);
  tr.append(td);
  return tr;
}

function fileRow(file: RepositoryFileRow, analysis: RepositoryAnalysis): HTMLLIElement {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = buildGitHubFileUrl(analysis.slug, analysis.defaultBranch, file.path);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = file.path;
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = file.layer;
  const reason = document.createElement("p");
  reason.textContent = file.reason;
  item.append(link, badge, reason);
  return item;
}

function panelHeading(title: string, desc: string): HTMLElement {
  const header = document.createElement("header");
  header.className = "source-analysis-panel-heading";
  const h3 = document.createElement("h3");
  h3.textContent = title;
  const p = document.createElement("p");
  p.textContent = desc;
  header.append(h3, p);
  return header;
}

function tableHead(labels: string[]): HTMLTableSectionElement {
  const head = document.createElement("thead");
  const row = document.createElement("tr");
  for (const label of labels) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    row.append(th);
  }
  head.append(row);
  return head;
}

function appendCell(row: HTMLTableRowElement, text: string): void {
  const td = document.createElement("td");
  td.textContent = text;
  row.append(td);
}

function appendBadgeCell(row: HTMLTableRowElement, text: string): void {
  const td = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = text;
  td.append(badge);
  row.append(td);
}

function definition(list: HTMLDListElement, term: string, value: string): void {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  dd.textContent = value;
  list.append(dt, dd);
}

function statCard(value: string, label: string): HTMLElement {
  const item = document.createElement("div");
  item.className = "source-analysis-stat";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  return item;
}


function renderQuestionPanel(analysis: RepositoryAnalysis, sourceCache: Map<string, string>): HTMLElement {
  const section = document.createElement("section");
  section.className = "source-analysis-panel source-analysis-question-panel";
  section.append(panelHeading("源码对话与 CodeMap", "连续提问时只检索已读取的 GitHub raw source，并把命中的文件同步到 CodeMap。"));

  let mode: SourceConversationMode = "chat";
  let lastQuestion = "";
  const turns: SourceConversationTurn[] = [];

  const tabs = document.createElement("div");
  tabs.className = "source-analysis-dialog-tabs";
  const chatTab = dialogModeButton("对话", "chat");
  const codeMapTab = dialogModeButton("CodeMap", "codemap");
  tabs.append(chatTab, codeMapTab);

  const guard = document.createElement("p");
  guard.className = "source-analysis-answer-guard";
  guard.textContent = "回答只来自已读取的源码行；没有源码证据时只给候选文件，不编造实现结论。";

  const stage = document.createElement("div");
  stage.className = "source-analysis-dialog-stage";

  const form = document.createElement("form");
  form.className = "source-analysis-question-form";
  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "例如：ToolNode 如何执行工具调用？checkpoint 在哪里保存状态？";
  input.setAttribute("aria-label", "源码问题");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "基于源码回答";
  form.append(input, submit);

  const status = document.createElement("p");
  status.className = "source-analysis-question-status";

  chatTab.addEventListener("click", () => setMode("chat"));
  codeMapTab.addEventListener("click", () => setMode("codemap"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      status.textContent = "请输入源码问题。";
      return;
    }
    input.value = "";
    await askQuestion(question);
  });

  function dialogModeButton(label: string, value: SourceConversationMode): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.mode = value;
    return button;
  }

  function setMode(nextMode: SourceConversationMode): void {
    mode = nextMode;
    renderConversationSurface();
  }

  async function askQuestion(question: string): Promise<void> {
    submit.disabled = true;
    status.textContent = "正在选择候选文件并读取源码...";
    const files = selectQuestionFiles(analysis, question, 8);
    try {
      const documents = await loadSourceDocuments(analysis, files.map((file) => file.path), sourceCache);
      const answer = answerSourceQuestion({
        analysis,
        question,
        documents,
        requestedFiles: files.map((file) => file.path),
        maxCitations: 4,
      });
      turns.push({ id: Date.now(), question, answer });
      lastQuestion = question;
      status.textContent = `已检索 ${answer.searchedFiles.length} 个源码文件${answer.missingFiles.length ? `，${answer.missingFiles.length} 个读取失败` : ""}。`;
      renderConversationSurface();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status.textContent = `源码对话失败：${message}`;
    } finally {
      submit.disabled = false;
    }
  }

  function renderConversationSurface(): void {
    chatTab.dataset.active = mode === "chat" ? "true" : "false";
    codeMapTab.dataset.active = mode === "codemap" ? "true" : "false";
    if (mode === "chat") {
      stage.replaceChildren(renderChatHistory(turns, (question) => {
        input.value = question;
        input.focus();
      }));
      return;
    }
    stage.replaceChildren(renderCodeMapView(analysis, lastQuestion));
  }

  renderConversationSurface();
  section.append(tabs, guard, stage, form, status);
  return section;
}

function renderChatHistory(turns: readonly SourceConversationTurn[], onExample: (question: string) => void): HTMLElement {
  const log = document.createElement("div");
  log.className = "source-analysis-chat-log";

  if (turns.length === 0) {
    const empty = document.createElement("div");
    empty.className = "source-analysis-chat-empty";
    const title = document.createElement("strong");
    title.textContent = "从源码问题开始";
    const examples = document.createElement("div");
    examples.className = "source-analysis-question-examples";
    for (const question of ["入口函数如何接到 runtime？", "工具调用在哪里执行并回写消息？", "checkpoint 或状态在哪里保存？"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = question;
      button.addEventListener("click", () => onExample(question));
      examples.append(button);
    }
    empty.append(title, examples);
    log.append(empty);
    return log;
  }

  for (const turn of turns) {
    const user = document.createElement("article");
    user.className = "source-analysis-chat-turn source-analysis-chat-turn--user";
    const question = document.createElement("p");
    question.textContent = turn.question;
    user.append(question);

    const assistant = document.createElement("article");
    assistant.className = "source-analysis-chat-turn source-analysis-chat-turn--assistant";
    assistant.append(renderQuestionAnswer(turn.answer));

    log.append(user, assistant);
  }
  return log;
}

function renderCodeMapView(analysis: RepositoryAnalysis, question: string): HTMLElement {
  const codeMap = buildRepositoryCodeMap(analysis, { question: question || undefined, limitPerLayer: 5 });
  const wrap = document.createElement("article");
  wrap.className = "source-analysis-codemap";

  const summary = document.createElement("p");
  summary.className = "source-analysis-codemap-summary";
  summary.textContent = codeMap.summary;
  wrap.append(summary);

  const grid = document.createElement("div");
  grid.className = "source-analysis-codemap-grid";
  for (const layer of codeMap.layers) grid.append(renderCodeMapLayer(layer));
  wrap.append(grid);

  if (codeMap.edges.length > 0) wrap.append(renderCodeMapEdges(codeMap.edges));
  return wrap;
}

function renderCodeMapLayer(layer: RepositoryCodeMapLayer): HTMLElement {
  const group = document.createElement("section");
  group.className = "source-analysis-codemap-layer";

  const head = document.createElement("header");
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = layer.layer;
  const count = document.createElement("span");
  count.textContent = `${layer.files.length} files`;
  head.append(badge, count);

  const signal = document.createElement("p");
  signal.textContent = layer.signal;
  group.append(head, signal);

  const list = document.createElement("ol");
  for (const file of layer.files) {
    const item = document.createElement("li");
    item.dataset.focus = file.questionMatched ? "true" : "false";
    const link = document.createElement("a");
    link.href = file.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = file.path;
    const reason = document.createElement("p");
    reason.textContent = file.reason;
    item.append(link, reason);
    list.append(item);
  }
  group.append(list);

  if (layer.areas.length > 0) {
    const areas = document.createElement("small");
    areas.textContent = `区域：${layer.areas.slice(0, 3).join(" / ")}${layer.areas.length > 3 ? " ..." : ""}`;
    group.append(areas);
  }

  return group;
}

function renderCodeMapEdges(edges: readonly RepositoryCodeMapEdge[]): HTMLElement {
  const wrap = document.createElement("aside");
  wrap.className = "source-analysis-codemap-edges";
  const title = document.createElement("strong");
  title.textContent = "关系线索";
  const list = document.createElement("ul");
  for (const edge of edges.slice(0, 14)) {
    const item = document.createElement("li");
    item.textContent = `${edge.from} -> ${edge.to} · ${relationLabel(edge.relation)} · ${edge.reason}`;
    list.append(item);
  }
  wrap.append(title, list);
  return wrap;
}

function relationLabel(relation: RepositoryCodeMapEdge["relation"]): string {
  if (relation === "question-focus") return "问题聚焦";
  if (relation === "reading-order") return "阅读顺序";
  return "先读文件";
}
async function loadSourceDocuments(
  analysis: RepositoryAnalysis,
  paths: readonly string[],
  sourceCache: Map<string, string>,
): Promise<SourceDocument[]> {
  const uniquePaths = [...new Set(paths)].slice(0, 8);
  const documents: SourceDocument[] = [];
  for (const path of uniquePaths) {
    const cacheKey = `${analysis.slug}@${analysis.defaultBranch}:${path}`;
    const cached = sourceCache.get(cacheKey);
    if (cached !== undefined) {
      documents.push({ path, content: cached });
      continue;
    }

    const response = await fetch(buildRawGitHubUrl(analysis.slug, analysis.defaultBranch, path), {
      headers: { Accept: "text/plain" },
    });
    if (!response.ok) continue;
    const content = await response.text();
    const boundedContent = content.length > 160_000 ? content.slice(0, 160_000) : content;
    sourceCache.set(cacheKey, boundedContent);
    documents.push({ path, content: boundedContent });
  }
  return documents;
}

function buildRawGitHubUrl(slug: string, branch: string, path: string): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${slug}/${encodeURIComponent(branch)}/${encodedPath}`;
}

function renderQuestionAnswer(answer: SourceQuestionAnswer): HTMLElement {
  const wrap = document.createElement("article");
  wrap.className = "source-analysis-answer";

  const summary = document.createElement("p");
  summary.className = "source-analysis-answer-summary";
  summary.textContent = answer.summary;
  wrap.append(summary);

  if (answer.citations.length > 0) {
    const list = document.createElement("ol");
    list.className = "source-analysis-citation-list";
    for (const citation of answer.citations) list.append(renderCitation(citation));
    wrap.append(list);
  }

  if (answer.missingFiles.length > 0) {
    const details = document.createElement("details");
    details.className = "source-analysis-missing-files";
    const summaryNode = document.createElement("summary");
    summaryNode.textContent = "读取失败的候选文件";
    const list = document.createElement("ul");
    for (const path of answer.missingFiles) {
      const item = document.createElement("li");
      item.textContent = path;
      list.append(item);
    }
    details.append(summaryNode, list);
    wrap.append(details);
  }

  return wrap;
}

function renderCitation(citation: SourceQuestionCitation): HTMLLIElement {
  const item = document.createElement("li");
  const header = document.createElement("div");
  header.className = "source-analysis-citation-head";
  const link = document.createElement("a");
  link.href = citation.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = `${citation.path}:${citation.startLine}-${citation.endLine}`;
  const badge = document.createElement("span");
  badge.className = "source-analysis-layer-badge";
  badge.textContent = citation.layer;
  header.append(link, badge);

  const explanation = document.createElement("p");
  explanation.textContent = citation.explanation;
  item.append(header, explanation);

  if (citation.excerpt) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = citation.excerpt;
    pre.append(code);
    item.append(pre);
  }

  return item;
}
