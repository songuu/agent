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
  return {
    id: stringValue(row.question_id, stringValue(row.slug, "")),
    slug: stringValue(row.slug, ""),
    category,
    categoryLabel: stringValue(row.category_label, CATEGORY_LABELS[category]),
    question: stringValue(row.question, ""),
    relatedChapters: stringArrayValue(row.related_chapters),
    answerSource: stringValue(row.answer_source, ""),
    collectedDate: stringValue(row.collected_date, "2026-06-24"),
    collectedAt: stringValue(row.collected_at, "2026-06-24T09:00:00+08:00"),
    sortOrder: numberValue(row.sort_order, 0),
    tags: stringArrayValue(row.tags),
    sourceTitles: stringArrayValue(metadata.sourceTitles),
    sourceUrls: stringArrayValue(metadata.sourceUrls),
    confidence: confidenceValue(metadata.confidence),
    rationale: optionalStringValue(metadata.rationale),
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
  return typeof value === "string" && value.trim() ? value : undefined;
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
