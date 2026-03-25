-- Politique INSERT plus robuste : évite les soucis d'évaluation des helpers private.*
-- en vérifiant directement le profil courant (lisible via profiles_select_own).

drop policy if exists catechumenes_insert_admin_or_responsable on public.catechumenes;

create policy catechumenes_insert_admin_or_responsable
on public.catechumenes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'responsable')
  )
);

grant insert on table public.catechumenes to authenticated;
