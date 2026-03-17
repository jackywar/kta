-- Permettre aux utilisateurs "catechumene" de lire les profils
-- des utilisateurs dont le rôle est "responsable" pour afficher
-- la liste de leurs responsables de frat.

drop policy if exists profiles_select_responsables_for_catechumenes on public.profiles;

create policy profiles_select_responsables_for_catechumenes
on public.profiles
for select
to authenticated
using (
  (role = 'responsable')
  and (
    (select private.is_admin())
    or (select private.is_responsable())
    or (select private.is_catechumene())
  )
);

