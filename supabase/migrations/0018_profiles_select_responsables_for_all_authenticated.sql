-- Simplifier l'accès aux profils "responsable" :
-- Tous les utilisateurs authentifiés peuvent lire les profils dont le rôle est "responsable".
-- (utile notamment pour les catéchumènes qui doivent voir leurs responsables de frat)

drop policy if exists profiles_select_responsables_for_catechumenes on public.profiles;

create policy profiles_select_responsables_for_all_authenticated
on public.profiles
for select
to authenticated
using (
  role = 'responsable'
);

