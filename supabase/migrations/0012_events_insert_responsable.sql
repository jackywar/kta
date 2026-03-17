-- Permettre aux responsables de créer des évènements

drop policy if exists events_insert_admin on public.events;

create policy events_insert_admin_or_responsable
on public.events
for insert
to authenticated
with check ((select private.is_admin()) or (select private.is_responsable()));

