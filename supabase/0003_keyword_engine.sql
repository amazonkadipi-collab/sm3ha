create table if not exists public.catalog_keywords (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  slug text not null unique,
  title text not null,
  language text not null default 'ar',
  source text not null default 'catalog',
  result_count integer not null default 0 check (result_count >= 0),
  result_slugs text[] not null default '{}',
  indexable boolean not null default true,
  status text not null default 'active' check (status in ('active','hidden','noindex')),
  search_count integer not null default 0 check (search_count >= 0),
  last_searched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_keywords add column if not exists language text not null default 'ar';
alter table public.catalog_keywords add column if not exists source text not null default 'search';
alter table public.catalog_keywords add column if not exists result_count integer not null default 0;
alter table public.catalog_keywords add column if not exists result_slugs text[] not null default '{}';
alter table public.catalog_keywords add column if not exists indexable boolean not null default true;
alter table public.catalog_keywords add column if not exists search_count integer not null default 0;
alter table public.catalog_keywords add column if not exists last_searched_at timestamptz;
alter table public.catalog_keywords add column if not exists created_at timestamptz not null default now();
alter table public.catalog_keywords add column if not exists updated_at timestamptz not null default now();

update public.catalog_keywords
set result_count = coalesce(array_length(result_slugs, 1), 0),
    indexable = true,
    updated_at = coalesce(updated_at, now())
where result_count = 0 and coalesce(array_length(result_slugs, 1), 0) > 0;

create index if not exists catalog_keywords_indexable_idx
  on public.catalog_keywords(indexable, status, updated_at desc);
create index if not exists catalog_keywords_language_idx
  on public.catalog_keywords(language, status);
create index if not exists catalog_keywords_result_count_idx
  on public.catalog_keywords(result_count desc);

alter table public.catalog_keywords enable row level security;

drop policy if exists "public can read indexable keywords" on public.catalog_keywords;
create policy "public can read indexable keywords"
  on public.catalog_keywords
  for select to anon, authenticated
  using (indexable = true and status = 'active' and result_count > 0);
