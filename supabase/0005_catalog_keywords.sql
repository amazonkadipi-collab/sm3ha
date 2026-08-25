create table if not exists public.catalog_keywords (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  slug text not null unique,
  title text not null,
  result_count integer not null default 0,
  result_slugs text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'hidden')),
  last_searched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_keywords add column if not exists result_slugs text[] not null default '{}';

create index if not exists catalog_keywords_updated_at_idx on public.catalog_keywords(updated_at desc);
create index if not exists catalog_keywords_status_updated_at_idx on public.catalog_keywords(status, updated_at desc);
alter table public.catalog_keywords enable row level security;
revoke all on public.catalog_keywords from anon, authenticated;
