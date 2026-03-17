-- Permettre aux utilisateurs "responsable" (et admins) de lire les profils
-- des utilisateurs dont le rôle est "responsable" (pour afficher les responsables de frats)

drop policy if exists profiles_select_responsables_for_responsables on public.profiles;

create policy profiles_select_responsables_for_responsables
on public.profiles
for select
to authenticated
using (
  (role = 'responsable')
  and ((select private.is_admin()) or (select private.is_responsable()))
);

