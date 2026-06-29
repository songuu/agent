import {
  SOURCE_ANALYSIS_PRESETS,
  analyzePreset,
  analyzeRepositoryTree,
  buildGitHubFileUrl,
  normalizeRepositoryInput,
  presetForSlug,
  type RepositoryAnalysis,
  type RepositoryAreaRow,
  type RepositoryFileRow,
  type RepositoryTreeItem,
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
  title.textContent = "指定仓库 -> 仓库矩阵 -> 源码阅读路径";
  const description = document.createElement("p");
  description.className = "source-analysis-desc";
  description.textContent =
    "输入公开 GitHub 仓库，前端直接读取 repo tree，生成目录矩阵、关键文件、语言分布和阅读顺序；无 token 时仍可使用三套内置源码解析。";
  titleGroup.append(eyebrow, title, description);

  const stats = document.createElement("div");
  stats.className = "source-analysis-hero-stats";
  hero.append(titleGroup, stats);

  const form = document.createElement("form");
  form.className = "source-analysis-form";
  const input = document.createElement("input");
  input.type = "search";
  input.value = defaultAnalysis.slug;
  input.placeholder = "例如 langchain-ai/langgraph 或 https://github.com/run-llama/llama_index";
  input.setAttribute("aria-label", "GitHub 仓库");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "解析仓库";
  form.append(input, submit);

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
      renderAnalysis();
    });
    presets.append(button);
  }

  const status = document.createElement("p");
  status.className = "source-analysis-status";

  const body = document.createElement("div");
  body.className = "source-analysis-body";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    status.textContent = "正在读取 GitHub repo tree...";
    try {
      current = await loadRepository(input.value);
      status.textContent =
        current.source === "github"
          ? `GitHub tree 已解析：${current.stats.totalFiles} files${current.truncated ? " · GitHub 返回 truncated" : ""}`
          : "已加载内置源码解析矩阵。";
      renderAnalysis();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const target = normalizeRepositoryInput(input.value);
      const preset = target ? presetForSlug(target.slug) : undefined;
      if (preset) {
        current = analyzePreset(preset);
        status.textContent = `GitHub 读取失败，已回退到内置矩阵：${message}`;
        renderAnalysis();
      } else {
        status.textContent = `解析失败：${message}`;
      }
    } finally {
      submit.disabled = false;
    }
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

    body.replaceChildren(
      renderOverview(current),
      renderLanguages(current),
      renderAreaMatrix(current),
      renderFileMatrix(current),
      renderReadingPath(current),
    );
  }

  renderAnalysis();
  shell.append(hero, form, presets, status, body);
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

