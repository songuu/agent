create extension if not exists pgcrypto;

create table if not exists public.frontier_ecosystem_articles (
  id uuid primary key default gen_random_uuid(),
  article_id text not null,
  slug text not null,
  chapter_id text not null default '19',
  chapter_slug text not null default '19-agent-ecosystem-and-frontier',
  title text not null,
  source text not null,
  source_url text not null,
  kind text not null check (kind in ('paper', 'doc', 'blog', 'video', 'internal')),
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
  summary text not null default '',
  collected_date date not null,
  collected_at timestamptz not null default now(),
  read_count integer not null default 0 check (read_count >= 0),
  sort_order integer not null,
  tags text[] not null default array[]::text[],
  detail_paragraphs text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  search_text tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(source, '') || ' ' || coalesce(summary, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- slug 与 source_url 已唯一标识文章身份；article_id(frontier-NN) 仅为按数组下标派生的展示用代理键，
  -- 故不设 unique：否则 graph.ts 增删/重排后对已有库重跑 seed 会让 article_id UPDATE 撞上他行而整条 upsert 失败。
  constraint frontier_ecosystem_articles_slug_key unique (slug),
  constraint frontier_ecosystem_articles_source_url_key unique (source_url)
);

create index if not exists frontier_ecosystem_articles_chapter_sort_idx
  on public.frontier_ecosystem_articles (chapter_id, sort_order);

create index if not exists frontier_ecosystem_articles_collected_date_idx
  on public.frontier_ecosystem_articles (collected_date desc, sort_order);

create index if not exists frontier_ecosystem_articles_tags_idx
  on public.frontier_ecosystem_articles using gin (tags);

create index if not exists frontier_ecosystem_articles_layer_sort_idx
  on public.frontier_ecosystem_articles (ecosystem_layer, sort_order);

create index if not exists frontier_ecosystem_articles_search_idx
  on public.frontier_ecosystem_articles using gin (search_text);

create or replace function public.set_frontier_ecosystem_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists frontier_ecosystem_articles_set_updated_at
  on public.frontier_ecosystem_articles;

create trigger frontier_ecosystem_articles_set_updated_at
before update on public.frontier_ecosystem_articles
for each row
execute function public.set_frontier_ecosystem_articles_updated_at();

alter table public.frontier_ecosystem_articles enable row level security;

drop policy if exists "Public read frontier ecosystem articles"
  on public.frontier_ecosystem_articles;

create policy "Public read frontier ecosystem articles"
  on public.frontier_ecosystem_articles
  for select
  using (true);

comment on table public.frontier_ecosystem_articles is
  'Source-backed articles collected for lesson 19: Agent frontier and ecosystem.';
comment on column public.frontier_ecosystem_articles.source_url is
  'Original article URL; UI renders this as the clickable source link.';
comment on column public.frontier_ecosystem_articles.detail_paragraphs is
  'Short course-authored detail paragraphs for the article detail card; not a copy of the original article.';
comment on column public.frontier_ecosystem_articles.ecosystem_layer is
  'Systematic layer used by the chapter 19 archive UI: foundation, model-platform, protocol, runtime, product-ui, data-memory, evaluation, security-governance.';
