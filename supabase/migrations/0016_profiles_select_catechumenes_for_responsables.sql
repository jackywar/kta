-- Permettre aux responsables (et admins) de lire les profils
-- des utilisateurs dont le rôle est "catechumene" pour savoir
-- si un user est déjà lié à une fiche catéchumène.

drop policy if exists profiles_select_catechumenes_for_responsables on public.profiles;

create policy profiles_select_catechumenes_for_responsables
on public.profiles
for select
to authenticated
using (
  (role = 'catechumene')
  and ((select private.is_admin()) or (select private.is_responsable()))
);

