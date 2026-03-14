-- Table principale des Frats
create table if not exists public.frats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_oklch text not null,
  created_at timestamptz not null default now()
);

-- Relation n-n entre frats et responsables (profiles)
create table if not exists public.frat_responsables (
  frat_id uuid not null references public.frats (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (frat_id, profile_id)
);

alter table public.frats enable row level security;
alter table public.frat_responsables enable row level security;

-- =========================================================
-- POLICIES FRATS
-- =========================================================

-- Tous les utilisateurs authentifiés peuvent lire les frats
create policy frats_select_all
on public.frats
for select
to authenticated
using (true);

-- Seuls les admins peuvent créer / modifier / supprimer des frats
create policy frats_insert_admin
on public.frats
for insert
to authenticated
with check ((select private.is_admin()));

create policy frats_update_admin
on public.frats
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy frats_delete_admin
on public.frats
for delete
to authenticated
using ((select private.is_admin()));

-- =========================================================
-- POLICIES FRAT_RESPONSABLES
-- =========================================================

-- Lecture des responsables de frats ouverte aux utilisateurs authentifiés
create policy frat_responsables_select_all
on public.frat_responsables
for select
to authenticated
using (true);

-- Gestion des responsables réservée aux admins
create policy frat_responsables_insert_admin
on public.frat_responsables
for insert
to authenticated
with check ((select private.is_admin()));

create policy frat_responsables_delete_admin
on public.frat_responsables
for delete
to authenticated
using ((select private.is_admin()));

