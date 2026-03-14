-- Permettre aux responsables (role = 'responsable') de modifier les catéchumènes

create or replace function private.is_responsable()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'responsable'
  );
$$;

revoke all on function private.is_responsable() from public;
grant execute on function private.is_responsable() to authenticated;

drop policy if exists catechumenes_update_admin on public.catechumenes;

create policy catechumenes_update_admin_or_responsable
on public.catechumenes
for update
to authenticated
using ((select private.is_admin()) or (select private.is_responsable()))
with check ((select private.is_admin()) or (select private.is_responsable()));
