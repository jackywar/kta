-- Permettre aux responsables de créer des catéchumènes

drop policy if exists catechumenes_insert_admin on public.catechumenes;

create policy catechumenes_insert_admin_or_responsable
on public.catechumenes
for insert
to authenticated
with check ((select private.is_admin()) or (select private.is_responsable()));
