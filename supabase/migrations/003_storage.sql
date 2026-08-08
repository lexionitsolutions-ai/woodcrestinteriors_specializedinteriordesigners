insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-chat-media',
  'private-chat-media',
  false,
  104857600,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','application/pdf','text/plain','application/zip','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do nothing;

create policy "private media read with valid session"
on storage.objects for select
using (
  bucket_id = 'private-chat-media'
  and public.current_private_user_id() is not null
);

create policy "private media upload by valid participant"
on storage.objects for insert
with check (
  bucket_id = 'private-chat-media'
  and public.current_private_user_id() is not null
  and (storage.foldername(name))[1] = public.current_private_user_id()::text
);

create policy "private media delete by valid participant"
on storage.objects for delete
using (
  bucket_id = 'private-chat-media'
  and public.current_private_user_id() is not null
);
