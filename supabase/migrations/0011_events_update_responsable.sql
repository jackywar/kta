-- Permettre aux responsables de modifier les évènements

drop policy if exists events_update_admin on public.events;

create policy events_update_admin_or_responsable
on public.events
for update
to authenticated
using ((select private.is_admin()) or (select private.is_responsable()))
with check ((select private.is_admin()) or (select private.is_responsable()));

