import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { INTERVIEW_QUESTIONS } from "./interview-questions.ts";

const BASELINE_COUNT = 233;
const EXPECTED_ADDITION_COUNT = 126;
const EXPECTED_TOTAL_COUNT = BASELINE_COUNT + EXPECTED_ADDITION_COUNT;
const WORKSPACE_ROOT = join(import.meta.dirname, "..", "..");
const OFFICIAL_SOURCE_HOSTS = new Set([
  "a2a-protocol.org",
  "arxiv.org",
  "cdn.openai.com",
  "developers.cloudflare.com",
  "docs.crewai.com",
  "docs.langchain.com",
  "genai.owasp.org",
  "github.com",
  "google.github.io",
  "learn.microsoft.com",
  "modelcontextprotocol.io",
  "microsoft.github.io",
  "nvlpubs.nist.gov",
  "openai.github.io",
  "opentelemetry.io",
  "platform.openai.com",
  "www.anthropic.com",
]);

function normalizeQuestion(question: string): string {
  return question
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

test("interview question bank has the expected complete and unique questions", () => {
  assert.equal(
    INTERVIEW_QUESTIONS.length,
    EXPECTED_TOTAL_COUNT,
  );

  const slugs = INTERVIEW_QUESTIONS.map((question) => question.slug);
  assert.equal(new Set(slugs).size, slugs.length, "slug must be unique");
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `invalid slug: ${slug}`);
  }

  const normalizedQuestions = INTERVIEW_QUESTIONS.map((question) =>
    normalizeQuestion(question.question),
  );
  assert.equal(
    new Set(normalizedQuestions).size,
    normalizedQuestions.length,
    "normalized question text must be unique",
  );

  for (const question of INTERVIEW_QUESTIONS) {
    assert.ok(
      question.summaryExcerpt?.trim(),
      `${question.slug} must include an answer summary`,
    );
  }
});

test("difficulty defaults are stable and the curated additions are balanced", () => {
  const expectedDefaultDifficulty = {
    principle: "simple",
    engineering: "medium",
    project: "complex",
  } as const;

  for (const question of INTERVIEW_QUESTIONS.slice(0, BASELINE_COUNT)) {
    assert.equal(
      question.difficulty,
      expectedDefaultDifficulty[question.category],
      `${question.slug} must keep the category-derived legacy default`,
    );
    assert.ok(question.difficultyLabel.trim());
  }

  const additions = INTERVIEW_QUESTIONS.slice(BASELINE_COUNT);
  assert.equal(additions.length, EXPECTED_ADDITION_COUNT);
  assert.deepEqual(
    Object.fromEntries(
      ["simple", "medium", "complex"].map((difficulty) => [
        difficulty,
        additions.filter((question) => question.difficulty === difficulty)
          .length,
      ]),
    ),
    { simple: 40, medium: 46, complex: 40 },
  );
  assert.deepEqual(
    Object.fromEntries(
      ["principle", "engineering", "project"].map((category) => [
        category,
        additions.filter((question) => question.category === category).length,
      ]),
    ),
    { principle: 50, engineering: 24, project: 52 },
  );

  for (const difficulty of ["simple", "medium", "complex"] as const) {
    assert.ok(
      INTERVIEW_QUESTIONS.filter((question) => question.difficulty === difficulty)
        .length >= 40,
    );
  }
});

test("the curated additions use high-confidence official primary sources", () => {
  for (const question of INTERVIEW_QUESTIONS.slice(BASELINE_COUNT)) {
    assert.equal(question.confidence, "high", `${question.slug} confidence`);
    assert.ok(question.sourceTitles.length > 0, `${question.slug} source title`);
    assert.ok(question.sourceUrls.length > 0, `${question.slug} source URL`);
    assert.equal(
      question.sourceTitles.length,
      question.sourceUrls.length,
      `${question.slug} source title/URL pairing`,
    );
    const answerSentences = question.summaryExcerpt
      ?.split(/[。！？!?]+/)
      .filter((sentence) => sentence.trim()).length;
    assert.ok(
      answerSentences && answerSentences <= 2,
      `${question.slug} summary must contain one or two answer sentences`,
    );
    assert.doesNotMatch(
      question.summaryExcerpt ?? "",
      /^本题(?:来自|覆盖|对应)/,
      `${question.slug} summary must be an answer, not a selection rationale`,
    );

    for (const sourceUrl of question.sourceUrls) {
      const url = new URL(sourceUrl);
      assert.equal(url.protocol, "https:", `${question.slug} source protocol`);
      assert.ok(
        OFFICIAL_SOURCE_HOSTS.has(url.hostname),
        `${question.slug} uses an unapproved source host: ${url.hostname}`,
      );
    }
  }

  const coverageText = INTERVIEW_QUESTIONS.slice(BASELINE_COUNT)
    .flatMap((question) => [question.question, ...question.sourceTitles])
    .join("\n");
  for (const expectedTopic of [
    "OpenAI Agents SDK",
    "LangGraph",
    "Google ADK",
    "AutoGen",
    "CrewAI",
    "Semantic Kernel",
    "Model Context Protocol",
    "Agent2Agent",
    "OpenTelemetry",
    "OWASP",
    "NIST",
    "ReAct",
    "Retrieval-Augmented Generation",
  ]) {
    assert.ok(
      coverageText.includes(expectedTopic),
      `missing coverage: ${expectedTopic}`,
    );
  }
});

test("generated SQL and the human-readable guide mirror all questions", () => {
  const careerGuide = readFileSync(
    join(WORKSPACE_ROOT, "docs", "career-guide.md"),
    "utf8",
  );
  const listStart = careerGuide.indexOf("<!-- interview-question-list:start -->");
  const listEnd = careerGuide.indexOf("<!-- interview-question-list:end -->");
  assert.ok(listStart >= 0 && listEnd > listStart, "career guide list markers");
  const questionList = careerGuide.slice(listStart, listEnd);
  assert.equal(questionList.match(/^\d+\. \*\*\[/gm)?.length, EXPECTED_TOTAL_COUNT);
  for (const question of INTERVIEW_QUESTIONS) {
    assert.ok(
      questionList.includes(question.question),
      `${question.slug} is missing from career-guide.md`,
    );
  }

  const seed = readFileSync(
    join(WORKSPACE_ROOT, "supabase", "seed", "interview_questions.sql"),
    "utf8",
  );
  assert.match(seed, new RegExp(`-- Rows: ${EXPECTED_TOTAL_COUNT}(?:\\r?\\n)`));
  assert.equal(seed.match(/^  \('iq-/gm)?.length, EXPECTED_TOTAL_COUNT);
  assert.equal(seed.match(/"difficulty":/g)?.length, EXPECTED_TOTAL_COUNT);
  assert.equal(seed.match(/"difficultyLabel":/g)?.length, EXPECTED_TOTAL_COUNT);
});
