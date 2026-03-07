-- Dream Build Drive - v4: Harden attachment storage policies

drop policy if exists "Users can upload to attachments bucket" on storage.objects;
drop policy if exists "Users can delete own attachments" on storage.objects;

create policy "Users can upload attachments for owned projects"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and exists (
      select 1
      from public.projects
      where projects.id::text = split_part(name, '/', 1)
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete attachments for owned projects"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and exists (
      select 1
      from public.projects
      where projects.id::text = split_part(name, '/', 1)
        and projects.user_id = auth.uid()
    )
  );
