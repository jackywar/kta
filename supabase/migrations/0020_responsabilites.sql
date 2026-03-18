-- Table des responsabilités
create table if not exists public.responsabilites (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  descriptif text,
  created_at timestamptz not null default now()
);

-- Table de liaison responsable <-> responsabilités (n-n)
create table if not exists public.responsable_responsabilites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  responsabilite_id uuid not null references public.responsabilites (id) on delete cascade,
  primary key (profile_id, responsabilite_id)
);

alter table public.responsabilites enable row level security;
alter table public.responsable_responsabilites enable row level security;

-- =========================================================
-- POLICIES RESPONSABILITES
-- =========================================================

-- Lecture ouverte à tous les utilisateurs authentifiés
create policy responsabilites_select_all
on public.responsabilites
for select
to authenticated
using (true);

-- Seuls les admins peuvent créer / modifier / supprimer
create policy responsabilites_insert_admin
on public.responsabilites
for insert
to authenticated
with check ((select private.is_admin()));

create policy responsabilites_update_admin
on public.responsabilites
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy responsabilites_delete_admin
on public.responsabilites
for delete
to authenticated
using ((select private.is_admin()));

-- =========================================================
-- POLICIES RESPONSABLE_RESPONSABILITES
-- =========================================================

-- Lecture ouverte à tous les utilisateurs authentifiés
create policy responsable_responsabilites_select_all
on public.responsable_responsabilites
for select
to authenticated
using (true);

-- Seuls les admins peuvent associer / dissocier
create policy responsable_responsabilites_insert_admin
on public.responsable_responsabilites
for insert
to authenticated
with check ((select private.is_admin()));

create policy responsable_responsabilites_delete_admin
on public.responsable_responsabilites
for delete
to authenticated
using ((select private.is_admin()));
