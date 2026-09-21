-- Runtime schema alignment for observability/admin features.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('page_view','search','song_view','media_view','conversion_start','admin_action')),
  path text not null,
  query text,
  metadata jsonb not null default '{}'::jsonb,
  session_hash text,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name, created_at desc);
create index if not exists analytics_events_path_idx on public.analytics_events(path, created_at desc);

alter table public.search_logs add column if not exists path text not null default '/search';
alter table public.search_logs add column if not exists result_count integer not null default 0;
alter table public.search_logs add column if not exists song_id uuid;
alter table public.search_logs add column if not exists hashed_ip text;
alter table public.search_logs add column if not exists user_agent text;
alter table public.search_logs enable row level security;
revoke all on public.search_logs from anon, authenticated;
create index if not exists search_logs_created_at_idx on public.search_logs(created_at desc);
create index if not exists search_logs_query_idx on public.search_logs(query);

alter table public.site_settings add column if not exists value_type text not null default 'text';
alter table public.site_settings add column if not exists description text;
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
create index if not exists site_settings_key_idx on public.site_settings(key);
