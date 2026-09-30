-- Remove legacy demo records from the production catalog without deleting history.
update public.songs
set status = 'removed'
where rights_status = 'demo';

alter table public.songs
  alter column rights_status set default 'metadata_only';

alter table public.songs
  alter column provider set default 'youtube';
