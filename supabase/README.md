# Supabase assets

This folder stores Supabase-ready SQL for the Agent course site.

## Frontier ecosystem articles

- Table migration: `migrations/20260616090000_create_frontier_ecosystem_articles.sql`
- Layer migration for existing installs: `migrations/20260616112000_add_frontier_ecosystem_article_layers.sql`
- Generated seed/upsert: `seed/frontier_ecosystem_articles.sql`
- Source of truth: `knowledge-graph/data/graph.ts` -> `FRONTIER_ARTICLES`
- Site chapter: `chapter_id=20`, `chapter_slug=20-agent-frontier-news`
- Rows: 77 articles across 8 ecosystem layers (foundation 6 / model-platform 8 / protocol 8 / runtime 10 / product-ui 8 / data-memory 10 / evaluation 16 / security-governance 11).

Apply order:

```bash
supabase db push
node node_modules/tsx/dist/cli.mjs scripts/generate-frontier-ecosystem-supabase-seed.ts
```

Then run the generated `supabase/seed/frontier_ecosystem_articles.sql` in the Supabase SQL editor or through your database connection.

Windows note:

- If `npm run supabase:frontier-seed` or `npm run supabase:frontier-push` hits `tsx/esbuild -> spawn EPERM`, use Node 24 native type stripping for seed generation:
  `node --experimental-transform-types scripts/generate-frontier-ecosystem-supabase-seed.ts`
- For push, follow the hardened fallback:
  `node scripts/push-frontier-seed-to-supabase.mjs`

## Interview questions

- Table migration: `migrations/20260616120000_create_interview_questions.sql`
- Generated seed/upsert: `seed/interview_questions.sql`
- Source of truth: `knowledge-graph/data/interview-questions.ts` -> `INTERVIEW_QUESTIONS`
- Companion human-readable list: `docs/career-guide.md` section 4; per-question standard answers live in each chapter README's `💡 面试会问`.
- Rows: 30 questions (9 principle / 13 engineering / 8 project).

Apply order:

```bash
supabase db push
node node_modules/tsx/dist/cli.mjs scripts/generate-interview-questions-supabase-seed.ts
```

Then run the generated `supabase/seed/interview_questions.sql` in the Supabase SQL editor or through your database connection.

Windows note:

- If `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` hits `spawn EPERM`, use:
  `node --env-file=.env --experimental-transform-types scripts/push-interview-questions-to-supabase.ts`

## Glossary terms

- Table migration: `migrations/20260616130000_create_glossary_terms.sql`
- Generated seed/upsert: `seed/glossary_terms.sql`
- Source of truth: `knowledge-graph/data/glossary.ts` -> `GLOSSARY_TERMS`
- Companion human-readable list: `docs/glossary.md` (also the no-JS fallback). The site renders an interactive, topic-filtered + searchable panel from the bundled TS (no runtime fetch), mirroring the interview-questions pipeline.
- Rows: 51 terms across 8 topics (llm-basics / prompt-engineering / agents-reasoning / tool-use / embeddings-rag / multi-agent / output-eval-observability / safety-guardrails).

Apply order:

```bash
supabase db push
node node_modules/tsx/dist/cli.mjs scripts/generate-glossary-supabase-seed.ts
```

Then run the generated `supabase/seed/glossary_terms.sql` in the Supabase SQL editor or through your database connection.

This repository currently does not contain Supabase connection settings, so the scripts generate auditable SQL instead of writing to a remote project implicitly.
