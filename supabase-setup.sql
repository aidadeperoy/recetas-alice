-- Run this in the Supabase SQL editor for the project.

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'Otros',
  descripcion text default '',
  tiempo_prep integer default 0,
  tiempo_coccion integer default 0,
  raciones integer default 0,
  ingredientes text[] default '{}',
  pasos text[] default '{}',
  consejos text default '',
  video_youtube text default '',
  foto_url text default '',
  fecha_creacion timestamptz not null default now()
);

alter table public.recipes enable row level security;

-- Anyone (even anonymous) can read recipes.
create policy "recipes_public_read"
  on public.recipes for select
  using (true);

-- Only authenticated users (Alice) can write.
create policy "recipes_auth_insert"
  on public.recipes for insert
  to authenticated with check (true);

create policy "recipes_auth_update"
  on public.recipes for update
  to authenticated using (true) with check (true);

create policy "recipes_auth_delete"
  on public.recipes for delete
  to authenticated using (true);

-- Storage bucket for cover photos (public read).
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

create policy "fotos_public_read"
  on storage.objects for select
  using (bucket_id = 'fotos');

create policy "fotos_auth_write"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'fotos');
