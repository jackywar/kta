-- Table des évènements
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null,
  libelle text not null,
  lieu text not null,
  descriptif text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- =========================================================
-- POLICIES EVENTS
-- =========================================================

-- Lecture pour tous les utilisateurs authentifiés
create policy events_select_all
on public.events
for select
to authenticated
using (true);

-- Création / modification / suppression réservées aux admins
create policy events_insert_admin
on public.events
for insert
to authenticated
with check ((select private.is_admin()));

create policy events_update_admin
on public.events
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy events_delete_admin
on public.events
for delete
to authenticated
using ((select private.is_admin()));

