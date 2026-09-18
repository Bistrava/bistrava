begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-media',
    'product-media',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'private-documents',
    'private-documents',
    false,
    20971520,
    array['application/pdf']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "product_media_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-media');

create policy "product_media_staff_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-media'
  and public.has_admin_role()
  and lower(storage.extension(name)) = any(array['jpg', 'jpeg', 'png', 'webp', 'avif'])
);

create policy "product_media_staff_update"
on storage.objects for update
to authenticated
using (bucket_id = 'product-media' and public.has_admin_role())
with check (
  bucket_id = 'product-media'
  and public.has_admin_role()
  and lower(storage.extension(name)) = any(array['jpg', 'jpeg', 'png', 'webp', 'avif'])
);

create policy "product_media_staff_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-media' and public.has_admin_role());

create policy "private_documents_staff_read"
on storage.objects for select
to authenticated
using (bucket_id = 'private-documents' and public.has_admin_role());

create policy "private_documents_staff_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private-documents'
  and public.has_admin_role()
  and lower(storage.extension(name)) = 'pdf'
);

create policy "private_documents_staff_update"
on storage.objects for update
to authenticated
using (bucket_id = 'private-documents' and public.has_admin_role())
with check (
  bucket_id = 'private-documents'
  and public.has_admin_role()
  and lower(storage.extension(name)) = 'pdf'
);

create policy "private_documents_staff_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'private-documents' and public.has_admin_role());

commit;
