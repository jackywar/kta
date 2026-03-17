-- Présences des catéchumènes aux évènements
create table if not exists public.event_attendances (
  event_id uuid not null references public.events (id) on delete cascade,
  catechumene_id uuid not null references public.catechumenes (id) on delete cascade,
  absence_justifiee boolean not null default false,
  justificatif text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, catechumene_id)
);

alter table public.event_attendances enable row level security;

-- updated_at auto
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_event_attendances_updated_at on public.event_attendances;
create trigger set_event_attendances_updated_at
before update on public.event_attendances
for each row execute procedure public.set_updated_at();

-- =========================================================
-- POLICIES EVENT_ATTENDANCES
-- =========================================================

-- Lecture pour tous les utilisateurs authentifiés
create policy event_attendances_select_all
on public.event_attendances
for select
to authenticated
using (true);

-- Saisie/modification/suppression: admins ou responsables
create policy event_attendances_insert_admin_or_responsable
on public.event_attendances
for insert
to authenticated
with check ((select private.is_admin()) or (select private.is_responsable()));

create policy event_attendances_update_admin_or_responsable
on public.event_attendances
for update
to authenticated
using ((select private.is_admin()) or (select private.is_responsable()))
with check ((select private.is_admin()) or (select private.is_responsable()));

create policy event_attendances_delete_admin_or_responsable
on public.event_attendances
for delete
to authenticated
using ((select private.is_admin()) or (select private.is_responsable()));

