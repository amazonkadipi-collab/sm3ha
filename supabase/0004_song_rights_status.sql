alter table public.songs
  add column if not exists rights_status text not null default 'demo'
  check (rights_status in ('demo', 'licensed', 'metadata_only', 'removed'));

create index if not exists songs_rights_status_idx
  on public.songs(rights_status);
