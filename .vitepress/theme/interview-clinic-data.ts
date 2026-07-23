import {
  INTERVIEW_QUESTIONS,
  type InterviewQuestion,
  type InterviewQuestionCategory,
} from "../../knowledge-graph/data/interview-questions";
import { fetchAllPostgrestRows, type PostgrestReadConfig } from "./postgrest-pagination";

declare const __FRONTIER_SUPABASE_CONFIG__:
  | {
      url: string;
      anonKey: string;
      schema: string;
    }
  | null
  | undefined;

interface InterviewQuestionRow {
  question_id?: unknown;
  slug?: unknown;
  category?: unknown;
  category_label?: unknown;
  question?: unknown;
  related_chapters?: unknown;
  answer_source?: unknown;
  collected_date?: unknown;
  collected_at?: unknown;
  sort_order?: unknown;
  tags?: unknown;
  metadata?: unknown;
}

interface InterviewQuestionMetadata {
  sourceTitles?: unknown;
  sourceUrls?: unknown;
  confidence?: unknown;
  rationale?: unknown;
  plainTextDescription?: unknown;
  faqList?: unknown;
  sourceCreatedAt?: unknown;
  sourceUpdatedAt?: unknown;
}

export interface InterviewClinicDataResult {
  questions: readonly InterviewQuestion[];
  source: "supabase" | "bundle";
  note: string;
}

const INTERVIEW_COLUMNS = [
  "question_id",
  "slug",
  "category",
  "category_label",
  "question",
  "related_chapters",
  "answer_source",
  "collected_date",
  "collected_at",
  "sort_order",
  "tags",
  "metadata",
].join(",");

const CATEGORY_LABELS: Record<InterviewQuestionCategory, string> = {
  principle: "原理类",
  engineering: "工程类",
  project: "项目深挖类",
};

const LOCAL_QUESTION_BY_SLUG = new Map(INTERVIEW_QUESTIONS.map((question) => [question.slug, question]));

export async function loadInterviewClinicData(
  fetchImpl?: typeof fetch,
): Promise<InterviewClinicDataResult> {
  const config = readSupabaseConfig();
  if (!config?.url || !config.anonKey) {
    return {
      questions: INTERVIEW_QUESTIONS,
      source: "bundle",
      note: "当前显示本地题库（缺少公开 Supabase 配置）。",
    };
  }

  try {
    const rows = await fetchAllPostgrestRows<InterviewQuestionRow>({
      config,
      table: "interview_questions",
      select: INTERVIEW_COLUMNS,
      order: ["sort_order.asc"],
      pageSize: 100,
      fetchImpl,
    });
    const questions = rows
      .map(normalizeInterviewQuestionRow)
      .filter((question) => question.question.trim().length > 0);

    if (questions.length === 0) {
      return {
        questions: INTERVIEW_QUESTIONS,
        source: "bundle",
        note: "Supabase 题库为空，已回退本地题库。",
      };
    }

    return {
      questions,
      source: "supabase",
      note: `当前显示 Supabase 题库（${questions.length} 题）。`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      questions: INTERVIEW_QUESTIONS,
      source: "bundle",
      note: `Supabase 读取失败，已回退本地题库：${message}`,
    };
  }
}

export function normalizeInterviewQuestionRow(row: InterviewQuestionRow): InterviewQuestion {
  const category = categoryValue(row.category);
  const metadata = metadataValue(row.metadata);
  const slug = stringValue(row.slug, "");
  const localFallback = LOCAL_QUESTION_BY_SLUG.get(slug);
  const remoteRationale = optionalStringValue(metadata.rationale);
  const remoteSummaryExcerpt = excerptValue(metadata.plainTextDescription);
  const rationale = remoteRationale ?? localFallback?.rationale;
  const summaryExcerpt = preferredSummaryExcerpt(remoteSummaryExcerpt, remoteRationale, localFallback?.summaryExcerpt);
  const faqList = faqListValue(metadata.faqList) ?? localFallback?.faqList;
  const displayDate = preferredInterviewDate(
    optionalStringValue(metadata.sourceUpdatedAt),
    optionalStringValue(metadata.sourceCreatedAt),
    optionalStringValue(row.collected_date),
    localFallback?.collectedDate,
  );
  return {
    id: stringValue(row.question_id, stringValue(row.slug, "")),
    slug,
    category,
    categoryLabel: stringValue(row.category_label, CATEGORY_LABELS[category]),
    question: stringValue(row.question, ""),
    relatedChapters: stringArrayValue(row.related_chapters),
    answerSource: stringValue(row.answer_source, ""),
    collectedDate: displayDate,
    collectedAt: stringValue(row.collected_at, "2026-06-24T09:00:00+08:00"),
    sortOrder: numberValue(row.sort_order, 0),
    tags: stringArrayValue(row.tags),
    sourceTitles: stringArrayValue(metadata.sourceTitles),
    sourceUrls: stringArrayValue(metadata.sourceUrls),
    confidence: confidenceValue(metadata.confidence),
    rationale,
    summaryExcerpt,
    faqList,
  };
}

function readSupabaseConfig(): PostgrestReadConfig | null {
  const injected =
    typeof __FRONTIER_SUPABASE_CONFIG__ !== "undefined"
      ? __FRONTIER_SUPABASE_CONFIG__
      : ((globalThis as { __FRONTIER_SUPABASE_CONFIG__?: PostgrestReadConfig | null })
          .__FRONTIER_SUPABASE_CONFIG__ ?? null);
  if (!injected?.url || !injected.anonKey) return null;
  return {
    url: injected.url,
    anonKey: injected.anonKey,
    schema: injected.schema || "public",
  };
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function optionalStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function preferredInterviewDate(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeInterviewDate(candidate);
    if (normalized) return normalized;
  }
  return "2026-06-24";
}

function normalizeInterviewDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (match) return match[1];
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function excerptValue(value: unknown): string | undefined {
  const text = optionalStringValue(value)?.replace(/\s+/g, " ");
  if (!text) return undefined;
  return text.length > 320 ? `${text.slice(0, 320)}...` : text;
}

function looksLikeAnswerSource(text: string): boolean {
  return /^(标准答案来源|答案来源|来源)[:：]/.test(text.trim());
}

function looksLikeSelectionRationale(text: string): boolean {
  return /^(本题(?:直接)?来自|本题覆盖|本题对应)/.test(text.trim());
}

function preferredSummaryExcerpt(
  remoteSummaryExcerpt: string | undefined,
  remoteRationale: string | undefined,
  localSummaryExcerpt: string | undefined,
): string | undefined {
  const remote = remoteSummaryExcerpt && !looksLikeAnswerSource(remoteSummaryExcerpt) ? remoteSummaryExcerpt : undefined;
  if (remote && remote !== remoteRationale && !looksLikeSelectionRationale(remote)) return remote;
  if (localSummaryExcerpt) return localSummaryExcerpt;
  return remote ?? remoteRationale;
}

function faqListValue(value: unknown): Array<{ question: string; answer: string }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const question = optionalStringValue((entry).question);
      const answer = optionalStringValue((entry).answer);
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item) => item !== null);
  return items.length > 0 ? items : undefined;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArrayValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function metadataValue(value: unknown): InterviewQuestionMetadata {
  return value && typeof value === "object" ? (value as InterviewQuestionMetadata) : {};
}

function categoryValue(value: unknown): InterviewQuestionCategory {
  if (value === "principle" || value === "engineering" || value === "project") return value;
  return "principle";
}

function confidenceValue(value: unknown): InterviewQuestion["confidence"] | undefined {
  if (value === "high" || value === "medium" || value === "low") return value;
  return undefined;
}
