const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
function replaceOnce(text, search, replacement, label) {
  if (!text.includes(search)) throw new Error(`missing pattern: ${label}`);
  return text.replace(search, replacement);
}

const syncPath = path.join(root, "scripts", "sync-codefather-interview-to-supabase.ts");
let sync = fs.readFileSync(syncPath, "utf8");
sync = replaceOnce(sync, `interface CodefatherFaq {
  readonly question?: unknown;
  readonly answer?: unknown;
}
`, `interface CodefatherFaq {
  readonly question?: unknown;
  readonly answer?: unknown;
}

interface CodefatherAnswerVariant {
  readonly title: string;
  readonly answer: string;
  readonly kind: "summary" | "section" | "faq";
}

interface CodefatherContentSection {
  readonly heading: string;
  readonly body: string;
  readonly level: number;
}
`, "add types");
sync = replaceOnce(sync, `    const sourceTags = stringArrayValue(post.tags);
    const faqList = faqListValue(post.faqList);
    const sourceTitles = [title];
`, `    const sourceTags = stringArrayValue(post.tags);
    const faqList = faqListValue(post.faqList);
    const sourceTitles = [title];
    const contentMarkdown = normalizeContentMarkdown(firstNonEmpty(post.content, post.description, post.plainTextDescription, ""));
    const contentSections = extractContentSections(contentMarkdown);
    const summaryText = extractSummaryText(contentMarkdown, firstNonEmpty(post.plainTextDescription, post.description, title));
    const answerVariants = buildAnswerVariants({ title, summaryText, faqList, contentSections });
`, "inject parse vars");
sync = replaceOnce(sync, `        sourceTitles,
        sourceUrls: [sourceUrl],
        sourceListUrl: "https://ai.codefather.cn/essay",
        plainTextDescription: truncate(firstNonEmpty(post.plainTextDescription, post.description, post.content, ""), 6000),
        faqList,
`, `        sourceTitles,
        sourceUrls: [sourceUrl],
        sourceListUrl: "https://ai.codefather.cn/essay",
        plainTextDescription: truncate(summaryText, 1200),
        contentMarkdown: truncate(contentMarkdown, 30000),
        contentSections,
        answerVariants,
        faqList,
`, "store richer metadata");
sync = replaceOnce(sync, `        confidence: "high",
        rationale: "来自 Codefather 公开列表 API 的面试题标签记录；标题用于面试清单展示，摘要与 FAQ 存入 metadata 便于追溯。",
`, `        confidence: "high",
        rationale: "来自 Codefather 公开列表 API 的面试题标签记录；标题、完整正文分段、FAQ 与原文链接一并存入 metadata，详情页可直接展示多个答案与完整解析。",
`, "update rationale");
sync = replaceOnce(sync, `function faqListValue(value: unknown): Array<{ question: string; answer: string }> {
  return arrayValue<CodefatherFaq>(value)
    .map((item) => ({
      question: stringValue(item.question),
      answer: truncate(stringValue(item.answer), 2400),
    }))
    .filter((item) => item.question || item.answer)
    .slice(0, 20);
}
`, `function faqListValue(value: unknown): Array<{ question: string; answer: string }> {
  return arrayValue<CodefatherFaq>(value)
    .map((item) => ({
      question: stringValue(item.question),
      answer: truncate(stringValue(item.answer), 2400),
    }))
    .filter((item) => item.question || item.answer)
    .slice(0, 20);
}

function normalizeContentMarkdown(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
}

function extractSummaryText(contentMarkdown: string, fallback: string): string {
  const cleaned = stripMarkdown(contentMarkdown);
  if (cleaned) return truncate(cleaned, 1200);
  return truncate(stripMarkdown(fallback), 1200);
}

function extractContentSections(contentMarkdown: string): CodefatherContentSection[] {
  const normalized = normalizeContentMarkdown(contentMarkdown);
  if (!normalized) return [];
  const lines = normalized.split("\n");
  const sections: CodefatherContentSection[] = [];
  let current: { heading: string; level: number; body: string[] } | null = null;

  const pushCurrent = () => {
    if (!current) return;
    const body = current.body.join("\n").trim();
    if (body) {
      sections.push({ heading: current.heading, body: truncate(body, 8000), level: current.level });
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      pushCurrent();
      current = { heading: stripMarkdown(headingMatch[2]), level: headingMatch[1].length, body: [] };
      continue;
    }
    if (!current) current = { heading: "概览", level: 2, body: [] };
    current.body.push(line);
  }

  pushCurrent();
  return sections.slice(0, 16);
}

function buildAnswerVariants(input: {
  title: string;
  summaryText: string;
  faqList: readonly { question: string; answer: string }[];
  contentSections: readonly CodefatherContentSection[];
}): CodefatherAnswerVariant[] {
  const variants: CodefatherAnswerVariant[] = [];
  const seen = new Set<string>();

  const pushVariant = (title: string, answer: string, kind: "summary" | "section" | "faq") => {
    const normalizedAnswer = normalizeText(stripMarkdown(answer));
    const normalizedTitle = normalizeText(stripMarkdown(title));
    if (!normalizedTitle || !normalizedAnswer) return;
    const key = `${normalizedTitle}::${normalizedAnswer}`;
    if (seen.has(key)) return;
    seen.add(key);
    variants.push({ title: normalizedTitle, answer: truncate(normalizedAnswer, 900), kind });
  };

  pushVariant("这道题怎么答", input.summaryText, "summary");
  for (const faq of input.faqList) pushVariant(faq.question, faq.answer, "faq");
  for (const section of input.contentSections) {
    if (section.heading !== "概览") pushVariant(section.heading, section.body, "section");
  }
  if (variants.length === 0 && input.contentSections[0]) {
    pushVariant(input.title, input.contentSections[0].body, "section");
  }
  return variants.slice(0, 10);
}

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[>*_~|]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
`, "add parser helpers");
fs.writeFileSync(syncPath, sync, "utf8");

const cronPath = path.join(root, "scripts", "codefather-interview-cron.ts");
let cron = fs.readFileSync(cronPath, "utf8");
cron = cron.replace('const DEFAULT_CRON = "15 8 * * *";', 'const DEFAULT_CRON = "5 */2 * * *";');
cron = cron.replace('// Daily Codefather interview sync daemon.\n// PM2 owns the process in production; node-cron owns the daily schedule.', '// Codefather interview sync daemon.\n// PM2 owns the process in production; node-cron triggers every 2 hours by default.');
fs.writeFileSync(cronPath, cron, "utf8");

const ecoPath = path.join(root, "scripts", "codefather-interview-ecosystem.config.cjs");
let eco = fs.readFileSync(ecoPath, "utf8");
eco = eco.replace('// PM2 config for daily Codefather interview sync.', '// PM2 config for 2-hour Codefather interview sync.');
eco = eco.replace('CODEFATHER_INTERVIEW_CRON: "15 8 * * *",', 'CODEFATHER_INTERVIEW_CRON: "5 */2 * * *",');
fs.writeFileSync(ecoPath, eco, "utf8");

const detailPath = path.join(root, '.vitepress', 'theme', 'interview-article-detail.ts');
let detail = fs.readFileSync(detailPath, 'utf8');
detail = replaceOnce(detail, `interface InterviewMetadata {
  sourceTitles?: unknown;
  sourceUrls?: unknown;
  rationale?: unknown;
  plainTextDescription?: unknown;
  faqList?: unknown;
}
`, `interface InterviewMetadata {
  sourceTitles?: unknown;
  sourceUrls?: unknown;
  rationale?: unknown;
  plainTextDescription?: unknown;
  faqList?: unknown;
  answerVariants?: unknown;
  contentSections?: unknown;
  contentMarkdown?: unknown;
}

interface InterviewAnswerVariant {
  title?: unknown;
  answer?: unknown;
  kind?: unknown;
}

interface InterviewContentSection {
  heading?: unknown;
  body?: unknown;
  level?: unknown;
}
`, 'extend metadata types');
detail = replaceOnce(detail, `  const remoteSummary = asString(metadata.plainTextDescription);
  const remoteRationale = asString(metadata.rationale);
  const remoteFaqList = faqListValue(metadata.faqList);
  const url = firstString(metadata.sourceUrls) || localFallback?.sourceUrls?.[0] || "";
`, `  const remoteSummary = asString(metadata.plainTextDescription);
  const remoteRationale = asString(metadata.rationale);
  const remoteFaqList = faqListValue(metadata.faqList);
  const answerVariants = answerVariantValue(metadata.answerVariants, remoteFaqList, remoteSummary);
  const contentSections = contentSectionValue(metadata.contentSections, metadata.contentMarkdown, remoteRationale, remoteSummary);
  const url = firstString(metadata.sourceUrls) || localFallback?.sourceUrls?.[0] || "";
`, 'inject answer data');
detail = replaceOnce(detail, `  const body = el("div", "news-detail-body vp-doc");
  for (const paragraph of paragraphs) {
    body.append(el("p", "news-detail-paragraph", paragraph));
  }
`, `  const body = el("div", "news-detail-body vp-doc");
  const leadParagraphs = paragraphs.slice(0, answerVariants.length > 0 || contentSections.length > 0 ? 1 : paragraphs.length);
  for (const paragraph of leadParagraphs) {
    body.append(el("p", "news-detail-paragraph", paragraph));
  }
  if (answerVariants.length > 0) body.append(buildAnswerSection(answerVariants));
  if (contentSections.length > 0) {
    body.append(buildAnalysisSection(contentSections));
  } else {
    for (const paragraph of paragraphs.slice(leadParagraphs.length)) body.append(el("p", "news-detail-paragraph", paragraph));
  }
`, 'render answer sections');
detail = replaceOnce(detail, `function faqListValue(value: unknown): Array<{ question: string; answer: string }> {
`, `function buildAnswerSection(items: Array<{ title: string; answer: string; kind: string }>): HTMLElement {
  const section = el("section", "interview-detail-section interview-answer-section");
  section.append(sectionHeading("直接可背的答案"));
  const grid = el("div", "interview-answer-grid");
  for (const item of items) {
    const card = el("article", "interview-answer-card");
    card.append(el("span", "interview-answer-kind", answerKindLabel(item.kind)));
    card.append(el("h3", "interview-answer-title", item.title));
    card.append(el("p", "interview-answer-body", item.answer));
    grid.append(card);
  }
  section.append(grid);
  return section;
}

function buildAnalysisSection(items: Array<{ heading: string; body: string; level: number }>): HTMLElement {
  const section = el("section", "interview-detail-section interview-analysis-section");
  section.append(sectionHeading("完整解析"));
  for (const item of items) {
    const block = el("article", "interview-analysis-block");
    const headingTag = item.level >= 3 ? "h3" : "h2";
    block.append(el(headingTag, "interview-analysis-heading", item.heading));
    for (const paragraph of splitSectionParagraphs(item.body)) {
      if (paragraph.startsWith("```") && paragraph.endsWith("```")) {
        const pre = el("pre", "interview-analysis-pre");
        const code = document.createElement("code");
        code.textContent = paragraph.slice(3, -3).trim();
        pre.append(code);
        block.append(pre);
      } else {
        block.append(el("p", "interview-analysis-body", paragraph));
      }
    }
    section.append(block);
  }
  return section;
}

function splitSectionParagraphs(body: string): string[] {
  return body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

function answerKindLabel(kind: string): string {
  if (kind === "faq") return "追问回答";
  if (kind === "section") return "分层拆解";
  return "速答版";
}

function answerVariantValue(value: unknown, faqList: Array<{ question: string; answer: string }>, summary: string): Array<{ title: string; answer: string; kind: string }> {
  const fromMetadata = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const record = item as InterviewAnswerVariant;
          const title = asString(record.title).trim();
          const answer = normalizeText(asString(record.answer));
          const kind = asString(record.kind).trim() || "summary";
          if (!title || !answer) return null;
          return { title, answer, kind };
        })
        .filter((item): item is { title: string; answer: string; kind: string } => item !== null)
    : [];
  if (fromMetadata.length > 0) return fromMetadata;
  const fallback: Array<{ title: string; answer: string; kind: string }> = [];
  const cleanSummary = normalizeText(summary);
  if (cleanSummary && !looksLikeAnswerSource(cleanSummary)) fallback.push({ title: "这道题怎么答", answer: cleanSummary, kind: "summary" });
  for (const item of faqList.slice(0, 6)) fallback.push({ title: item.question, answer: normalizeText(item.answer), kind: "faq" });
  return fallback;
}

function contentSectionValue(value: unknown, markdown: unknown, rationale: string, summary: string): Array<{ heading: string; body: string; level: number }> {
  const fromMetadata = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const record = item as InterviewContentSection;
          const heading = asString(record.heading).trim();
          const body = normalizeText(asString(record.body));
          const level = Number(record.level);
          if (!heading || !body) return null;
          return { heading, body, level: Number.isFinite(level) && level > 0 ? level : 2 };
        })
        .filter((item): item is { heading: string; body: string; level: number } => item !== null)
    : [];
  if (fromMetadata.length > 0) return fromMetadata;
  const text = asString(markdown).trim();
  if (text) {
    const sections = text
      .split(/\n(?=##\s+)/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const match = chunk.match(/^(#{2,4})\s+(.+)\n([\s\S]*)$/);
        if (!match) return null;
        return { heading: match[2].trim(), body: normalizeText(match[3]), level: match[1].length };
      })
      .filter((item): item is { heading: string; body: string; level: number } => item !== null && item.body.length > 0);
    if (sections.length > 0) return sections;
  }
  const fallback: Array<{ heading: string; body: string; level: number }> = [];
  const cleanSummary = normalizeText(summary);
  const cleanRationale = normalizeText(rationale);
  if (cleanSummary && !looksLikeAnswerSource(cleanSummary)) fallback.push({ heading: "概览", body: cleanSummary, level: 2 });
  if (cleanRationale && cleanRationale !== cleanSummary) fallback.push({ heading: "解析", body: cleanRationale, level: 2 });
  return fallback;
}

function faqListValue(value: unknown): Array<{ question: string; answer: string }> {
`, 'add render helpers');
fs.writeFileSync(detailPath, detail, 'utf8');

const cssPath = path.join(root, '.vitepress', 'theme', 'custom.css');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.interview-answer-grid')) {
  css += `

.interview-answer-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.interview-answer-card,
.interview-analysis-block {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--frontier-card-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--frontier-card-bg) 92%, var(--vp-c-bg));
}

.interview-answer-kind {
  color: var(--frontier-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.vp-doc h3.interview-answer-title,
.interview-answer-title,
.vp-doc h3.interview-analysis-heading,
.interview-analysis-heading {
  margin: 0;
  border: 0;
  padding: 0;
  color: var(--frontier-text-strong);
  font-size: 18px;
  line-height: 1.45;
}

.interview-answer-body,
.interview-analysis-body {
  margin: 0;
  color: var(--frontier-text);
  font-size: 15px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.interview-analysis-section {
  display: grid;
  gap: 14px;
}

.interview-analysis-block {
  padding: 20px;
}

.interview-analysis-pre {
  margin: 0;
  overflow: auto;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .interview-answer-grid {
    grid-template-columns: 1fr;
  }
}
`;
}
fs.writeFileSync(cssPath, css, 'utf8');

const testPath = path.join(root, 'scripts', 'sync-codefather-interview-to-supabase.test.mts');
let test = fs.readFileSync(testPath, 'utf8');
test = replaceOnce(test, `  assert.deepEqual(row.metadata.sourceUrls, ["https://ai.codefather.cn/post/207"]);
  assert.equal((row.metadata.faqList as Array<{ question: string }>)[0].question, "上下文快满了怎么办？");
});
`, `  assert.deepEqual(row.metadata.sourceUrls, ["https://ai.codefather.cn/post/207"]);
  assert.equal((row.metadata.faqList as Array<{ question: string }>)[0].question, "上下文快满了怎么办？");
  assert.ok(Array.isArray(row.metadata.answerVariants));
  assert.ok(Array.isArray(row.metadata.contentSections));
  assert.equal((row.metadata.answerVariants as Array<{ title: string }>)[0]?.title, "这道题怎么答");
  assert.equal((row.metadata.contentSections as Array<{ heading: string }>)[0]?.heading, "概览");
});
`, 'extend test');
fs.writeFileSync(testPath, test, 'utf8');
