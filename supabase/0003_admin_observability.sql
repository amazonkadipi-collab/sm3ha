create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('page_view', 'search', 'song_view', 'media_view', 'conversion_start', 'admin_action')),
  path text not null,
  query text,
  metadata jsonb not null default '{}'::jsonb,
  session_hash text,
  created_at timestamptz not null default now()
);

alter table public.search_logs add column if not exists path text not null default '/search';
alter table public.search_logs add column if not exists result_count integer not null default 0;

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  value_type text not null default 'text' check (value_type in ('text', 'boolean', 'number', 'json')),
  description text,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.takedown_requests add column if not exists evidence_url text;
alter table public.takedown_requests add column if not exists admin_notes text;
alter table public.takedown_requests add column if not exists updated_at timestamptz not null default now();
alter table public.takedown_requests add column if not exists updated_by text;

create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name, created_at desc);
create index if not exists analytics_events_path_idx on public.analytics_events(path, created_at desc);
create index if not exists search_logs_created_at_idx on public.search_logs(created_at desc);
create index if not exists search_logs_query_idx on public.search_logs(query);
create index if not exists takedown_requests_created_at_idx on public.takedown_requests(created_at desc);

alter table public.analytics_events enable row level security;
alter table public.search_logs enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.analytics_events from anon, authenticated;
revoke all on public.search_logs from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;

insert into public.site_settings (key, value, value_type, description)
values
  ('site_name', 'نغمة', 'text', 'الاسم الظاهر للموقع'),
  ('site_description', 'مساحة عربية لاكتشاف الأغاني والموسيقى.', 'text', 'الوصف العام وSEO'),
  ('ads_enabled', 'false', 'boolean', 'تفعيل خانات الإعلانات المصرح بها'),
  ('ads_provider', 'none', 'text', 'مزود الإعلانات الحالي'),
  ('contact_email', '', 'text', 'بريد التواصل وطلبات السحب')
on conflict (key) do nothing;
