-- 每日 AI 资讯收集系统的存储表：
-- 本表由 news-collector 自动写入（机器数据），并作为第 20 章文章日历的数据源。
-- 自托管 Supabase(火山 AIDAP) 需先在 SQL Editor 执行本 DDL（PostgREST 不能建表）。

create extension if not exists pgcrypto;

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  -- 收集身份 = canonical URL 的 sha256（前 32 hex）；幂等 upsert 的冲突键。
  external_id text not null,
  source_key text not null,
  source_name text not null,
  source_kind text not null check (
    source_kind in ('cn-media', 'en-media', 'paper', 'community', 'vendor-blog', 'release')
  ),
  title text not null,
  url text not null,
  summary text not null default '',
  ecosystem_layer text not null default 'foundation' check (
    ecosystem_layer in (
      'foundation',
      'model-platform',
      'protocol',
      'runtime',
      'product-ui',
      'data-memory',
      'evaluation',
      'security-governance'
    )
  ),
  ecosystem_layer_label text not null default '基础综述',
  tags text[] not null default array[]::text[],
  lang text not null default 'en' check (lang in ('zh', 'en')),
  published_at timestamptz,
  published_date date,
  collected_at timestamptz not null default now(),
  collected_date date not null,
  enriched boolean not null default false,
  read_count integer not null default 0 check (read_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  search_text tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(source_name, '') || ' ' || coalesce(summary, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_items_external_id_key unique (external_id)
);

alter table public.news_items
  add column if not exists published_date date;

update public.news_items
set published_date = coalesce((published_at at time zone 'UTC')::date, collected_date)
where published_date is null;

alter table public.news_items
  alter column published_date set default current_date,
  alter column published_date set not null;

create index if not exists news_items_published_date_idx
  on public.news_items (published_date desc, published_at desc nulls last);

create index if not exists news_items_collected_date_idx
  on public.news_items (collected_date desc, collected_at desc);

create index if not exists news_items_layer_idx
  on public.news_items (ecosystem_layer, published_date desc, published_at desc nulls last);

create index if not exists news_items_source_idx
  on public.news_items (source_key, published_date desc, published_at desc nulls last);

create index if not exists news_items_url_idx
  on public.news_items (url);

create index if not exists news_items_tags_idx
  on public.news_items using gin (tags);

create index if not exists news_items_search_idx
  on public.news_items using gin (search_text);

create or replace function public.set_news_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_items_set_updated_at on public.news_items;

create trigger news_items_set_updated_at
before update on public.news_items
for each row
execute function public.set_news_items_updated_at();

alter table public.news_items enable row level security;

drop policy if exists "Public read news items" on public.news_items;

create policy "Public read news items"
  on public.news_items
  for select
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.news_items to anon, authenticated;
grant select, insert, update, delete on public.news_items to service_role;

comment on table public.news_items is
  'Auto-collected daily AI news from multiple RSS sources (news-collector subsystem). Machine-written; rendered by the lesson 20 article archive.';
comment on column public.news_items.external_id is
  'sha256 of canonical URL; idempotent upsert conflict key.';
comment on column public.news_items.summary is
  'Feed-provided excerpt only, truncated. Never a copy of the original article body.';
comment on column public.news_items.published_date is
  'Article date used by the calendar filter. Falls back to collected_date when published_at is unknown.';

notify pgrst, 'reload schema';
