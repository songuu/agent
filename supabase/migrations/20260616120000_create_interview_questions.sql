create extension if not exists pgcrypto;

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  question_id text not null,
  slug text not null,
  category text not null check (category in ('principle', 'engineering', 'project')),
  category_label text not null,
  question text not null,
  related_chapters text[] not null default array[]::text[],
  answer_source text not null default '',
  collected_date date not null,
  collected_at timestamptz not null default now(),
  sort_order integer not null,
  tags text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  search_text tsvector generated always as (
    to_tsvector('simple', coalesce(question, '') || ' ' || coalesce(category_label, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- slug 唯一标识题目身份并作为 upsert 的 on-conflict 目标。
  -- question_id(iq-NN) 是按数组下标派生的展示用代理键，故刻意不设 unique：
  -- 否则在母本里增删/重排题目后重跑 seed，会让 question_id UPDATE 撞上他行而整条 upsert 失败
  -- （沿用 frontier_ecosystem_articles 的同一教训）。
  constraint interview_questions_slug_key unique (slug)
);

create index if not exists interview_questions_category_sort_idx
  on public.interview_questions (category, sort_order);

create index if not exists interview_questions_related_chapters_idx
  on public.interview_questions using gin (related_chapters);

create index if not exists interview_questions_tags_idx
  on public.interview_questions using gin (tags);

create index if not exists interview_questions_search_idx
  on public.interview_questions using gin (search_text);

create or replace function public.set_interview_questions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists interview_questions_set_updated_at
  on public.interview_questions;

create trigger interview_questions_set_updated_at
before update on public.interview_questions
for each row
execute function public.set_interview_questions_updated_at();

alter table public.interview_questions enable row level security;

drop policy if exists "Public read interview questions"
  on public.interview_questions;

create policy "Public read interview questions"
  on public.interview_questions
  for select
  using (true);

comment on table public.interview_questions is
  'Structured high-frequency interview questions for the Agent course (mirror of docs/career-guide.md section 4).';
comment on column public.interview_questions.answer_source is
  'Human pointer to the standard-answer source: the related chapters'' README "💡 面试会问" blockquote.';
comment on column public.interview_questions.related_chapters is
  'Chapter ids that answer this question; "capstone" denotes the graduation project.';
