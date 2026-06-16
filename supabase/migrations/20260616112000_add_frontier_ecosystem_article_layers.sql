alter table public.frontier_ecosystem_articles
  add column if not exists ecosystem_layer text not null default 'foundation',
  add column if not exists ecosystem_layer_label text not null default '基础综述';

alter table public.frontier_ecosystem_articles
  drop constraint if exists frontier_ecosystem_articles_ecosystem_layer_check;

alter table public.frontier_ecosystem_articles
  add constraint frontier_ecosystem_articles_ecosystem_layer_check
  check (
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
  );

create index if not exists frontier_ecosystem_articles_layer_sort_idx
  on public.frontier_ecosystem_articles (ecosystem_layer, sort_order);

comment on column public.frontier_ecosystem_articles.ecosystem_layer is
  'Systematic layer used by the chapter 19 archive UI: foundation, model-platform, protocol, runtime, product-ui, data-memory, evaluation, security-governance.';
