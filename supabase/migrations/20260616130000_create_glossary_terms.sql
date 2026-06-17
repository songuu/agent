create extension if not exists pgcrypto;

create table if not exists public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term_id text not null,
  slug text not null,
  topic text not null check (topic in (
    'llm-basics',
    'prompt-engineering',
    'agents-reasoning',
    'tool-use',
    'embeddings-rag',
    'multi-agent',
    'output-eval-observability',
    'safety-guardrails'
  )),
  topic_label text not null,
  term text not null,
  definition text not null,
  related_chapters text[] not null default array[]::text[],
  aliases text[] not null default array[]::text[],
  sort_order integer not null,
  tags text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  -- 仅覆盖文本列 term + definition；aliases 是 text[]，array_to_string 在生成列里非 immutable
  -- （PG 报 "generation expression is not immutable"），故不并入。aliases 仍可用 = any / && 查询。
  search_text tsvector generated always as (
    to_tsvector('simple'::regconfig,
      coalesce(term, '') || ' ' || coalesce(definition, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- slug 唯一标识术语身份并作为 upsert 的 on-conflict 目标。
  -- term_id(gl-NN) 是按数组下标派生的展示用代理键，故刻意不设 unique：
  -- 否则在母本里增删/重排术语后重跑 seed，会让 term_id UPDATE 撞上他行而整条 upsert 失败
  -- （沿用 interview_questions / frontier_ecosystem_articles 的同一教训）。
  constraint glossary_terms_slug_key unique (slug)
);

create index if not exists glossary_terms_topic_sort_idx
  on public.glossary_terms (topic, sort_order);

create index if not exists glossary_terms_related_chapters_idx
  on public.glossary_terms using gin (related_chapters);

create index if not exists glossary_terms_tags_idx
  on public.glossary_terms using gin (tags);

create index if not exists glossary_terms_search_idx
  on public.glossary_terms using gin (search_text);

create or replace function public.set_glossary_terms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists glossary_terms_set_updated_at
  on public.glossary_terms;

create trigger glossary_terms_set_updated_at
before update on public.glossary_terms
for each row
execute function public.set_glossary_terms_updated_at();

alter table public.glossary_terms enable row level security;

drop policy if exists "Public read glossary terms"
  on public.glossary_terms;

create policy "Public read glossary terms"
  on public.glossary_terms
  for select
  using (true);

comment on table public.glossary_terms is
  'Structured glossary terms for the Agent course (mirror of docs/glossary.ts / docs/glossary.md).';
comment on column public.glossary_terms.aliases is
  'Alternate names (English / short Chinese / synonyms) for alias/substring search; kept as a separate text[] column (not folded into search_text, which only covers term + definition).';
comment on column public.glossary_terms.related_chapters is
  'Chapter ids where the term is explained best; "capstone" denotes the graduation project.';
