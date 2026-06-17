-- Notion 文章同步系统的存储表：
-- 由 notion-sync 子系统自动写入（service_role），站内列表页/详情页运行时 anon 只读渲染。
-- 自托管 Supabase(火山 AIDAP) 需先在 SQL Editor 执行本 DDL（PostgREST 不能建表）。
--
-- 与 news_items 的关键差异：
-- - 身份键是 notion_page_id（Notion 页 UUID，跨编辑稳定），不是 URL sha256。
-- - 存**全文** body_markdown（news_items 只存摘要、绝不存正文）。
-- - anon RLS 限定 status='published'：草稿/归档绝不漏给前端 bundle（news_items 是 USING(true)）。

create extension if not exists pgcrypto;

create table if not exists public.notion_articles (
  id uuid primary key default gen_random_uuid(),
  -- Notion 页 UUID（带连字符）；幂等 upsert 的冲突键。
  notion_page_id text not null,
  -- 详情页路由键 /docs/notion/article?slug=<slug>。
  slug text not null,
  -- 来源注册键（notion-sources.ts 的 key），按源算增量水位与溯源。
  source_key text not null,
  title text not null,
  summary text not null default '',
  -- 全文 markdown（blocks→markdown，图片已重托管成稳定 URL）。
  body_markdown text not null default '',
  cover_image_url text,
  tags text[] not null default array[]::text[],
  status text not null default 'draft' check (
    status in ('draft', 'published', 'archived')
  ),
  published_at timestamptz,
  published_date date not null default current_date,
  notion_url text not null default '',
  -- Notion last_edited_time；增量同步高水位（取 max() 当游标）。
  notion_last_edited_time timestamptz not null,
  read_count integer not null default 0 check (read_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  search_text tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body_markdown, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notion_articles_notion_page_id_key unique (notion_page_id),
  constraint notion_articles_slug_key unique (slug)
);

create index if not exists notion_articles_published_date_idx
  on public.notion_articles (published_date desc, published_at desc nulls last);

create index if not exists notion_articles_last_edited_idx
  on public.notion_articles (source_key, notion_last_edited_time desc);

create index if not exists notion_articles_status_idx
  on public.notion_articles (status, published_date desc);

create index if not exists notion_articles_tags_idx
  on public.notion_articles using gin (tags);

create index if not exists notion_articles_search_idx
  on public.notion_articles using gin (search_text);

create or replace function public.set_notion_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notion_articles_set_updated_at on public.notion_articles;

create trigger notion_articles_set_updated_at
before update on public.notion_articles
for each row
execute function public.set_notion_articles_updated_at();

alter table public.notion_articles enable row level security;

drop policy if exists "Public read published notion articles" on public.notion_articles;

-- 安全不变量：anon/authenticated 只能读 published；草稿/归档仅 service_role（绕过 RLS）可见。
create policy "Public read published notion articles"
  on public.notion_articles
  for select
  using (status = 'published');

grant usage on schema public to anon, authenticated;
grant select on public.notion_articles to anon, authenticated;
grant select, insert, update, delete on public.notion_articles to service_role;

comment on table public.notion_articles is
  'Full-text articles synced from Notion (notion-sync subsystem). service_role writes; anon reads only status=published. Rendered by the /docs/notion list + detail pages.';
comment on column public.notion_articles.notion_page_id is
  'Notion page UUID; stable across edits; idempotent upsert conflict key.';
comment on column public.notion_articles.body_markdown is
  'Full page body converted to markdown; image URLs rehosted to durable storage (never the expiring Notion S3 URL).';
comment on column public.notion_articles.notion_last_edited_time is
  'Notion last_edited_time; incremental sync high-water mark (max() per source_key drives the next on_or_after filter).';

notify pgrst, 'reload schema';
