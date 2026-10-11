-- Kvittana- og ábyrgðageymsla (keyrt sem migration `receipt_archive_warranties`, 11. okt 2026)
alter table public.purchases add column if not exists receipt_path text;
alter table public.purchases add column if not exists return_until date;
alter table public.purchases add column if not exists return_reminded_at timestamptz;
alter table public.purchase_items add column if not exists warranty_until date;
alter table public.purchase_items add column if not exists warranty_reminded_at timestamptz;

create index if not exists purchase_items_warranty_idx on public.purchase_items (warranty_until) where warranty_until is not null;
create index if not exists purchases_return_idx on public.purchases (return_until) where return_until is not null;

-- Einka-geymsla fyrir kvittanamyndir: <user_id>/<skrá>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Lesa: eigin mappa, EÐA kvittun á sameiginlegum lista sem notandi er meðlimur í.
drop policy if exists receipts_read on storage.objects;
create policy receipts_read on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.purchases p where p.receipt_path = storage.objects.name and p.list_id is not null and public.is_member(p.list_id))
  )
);
-- Skrifa/eyða: aðeins í eigin möppu.
drop policy if exists receipts_insert on storage.objects;
create policy receipts_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists receipts_update on storage.objects;
create policy receipts_update on storage.objects for update to authenticated using (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists receipts_delete on storage.objects;
create policy receipts_delete on storage.objects for delete to authenticated using (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
);
