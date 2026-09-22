alter table public.songs
  add column if not exists provider_url text,
  add column if not exists mp3_url text,
  add column if not exists mp4_url text;

create index if not exists songs_provider_url_idx on public.songs(provider_url) where provider_url is not null;
