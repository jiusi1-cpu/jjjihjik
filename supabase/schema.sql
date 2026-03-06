create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  mime_type text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists files_user_id_created_at_idx on public.files (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.files enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can manage own files" on public.files;
create policy "Users can manage own files"
on public.files
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-files',
  'user-files',
  false,
  10485760,
  array[
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own storage files" on storage.objects;
create policy "Users can upload their own storage files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can view their own storage files" on storage.objects;
create policy "Users can view their own storage files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own storage files" on storage.objects;
create policy "Users can delete their own storage files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);