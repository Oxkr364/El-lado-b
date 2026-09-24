-- UMBRAL EDITORES — Producción visual V1

alter table public.user_stories
  add column if not exists visual_status text not null default 'pending',
  add column if not exists visual_completed_at timestamptz,
  add column if not exists cover_storage_path text;

alter table public.user_stories drop constraint if exists user_stories_visual_status_check;
alter table public.user_stories add constraint user_stories_visual_status_check
  check (visual_status in ('pending', 'ready', 'not_required'));

alter table public.user_story_media
  add column if not exists media_role text not null default 'album';

alter table public.user_story_media drop constraint if exists user_story_media_role_check;
alter table public.user_story_media add constraint user_story_media_role_check
  check (media_role in ('cover', 'album'));

alter table public.user_story_media drop constraint if exists user_story_media_story_id_position_key;
alter table public.user_story_media drop constraint if exists user_story_media_story_role_position_key;
alter table public.user_story_media add constraint user_story_media_story_role_position_key
  unique (story_id, media_role, position);

drop policy if exists "owners manage media metadata" on public.user_story_media;
create policy "owners manage media metadata"
on public.user_story_media for all to authenticated
using (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.user_stories s
    where s.id = story_id and s.owner_id = (select auth.uid()) and s.status <> 'archived'
  )
)
with check (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.user_stories s
    where s.id = story_id and s.owner_id = (select auth.uid()) and s.status <> 'archived'
  )
);

drop policy if exists "owners manage characters" on public.user_story_characters;
create policy "owners manage characters"
on public.user_story_characters for all to authenticated
using (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.user_stories s
    where s.id = story_id and s.owner_id = (select auth.uid()) and s.status <> 'archived'
  )
)
with check (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.user_stories s
    where s.id = story_id and s.owner_id = (select auth.uid()) and s.status <> 'archived'
  )
);

drop policy if exists "public reads published story files" on storage.objects;
create policy "public reads published story files"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'story-media' and (
    exists (
      select 1 from public.user_story_media m
      join public.user_stories s on s.id = m.story_id
      where m.storage_path = name and m.deleted_at is null and m.status = 'ready'
        and s.status = 'published' and s.visibility = 'public' and s.published_at is not null
    )
    or exists (
      select 1 from public.user_story_characters c
      join public.user_stories s on s.id = c.story_id
      where c.portrait_storage_path = name and c.portrait_status = 'ready'
        and s.status = 'published' and s.visibility = 'public' and s.published_at is not null
    )
  )
);

update public.user_stories
set visual_status = case
  when cover_config->>'source' = 'ai' then 'pending'
  else 'ready'
end
where visual_completed_at is null;
