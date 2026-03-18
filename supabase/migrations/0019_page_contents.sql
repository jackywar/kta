-- Table pour stocker du contenu markdown par clé (ex: home_catechumene, home_responsable)

create table if not exists public.page_contents (
  key text primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.page_contents enable row level security;

-- Lecture ouverte à tous les utilisateurs authentifiés
create policy page_contents_select_all
on public.page_contents
for select
to authenticated
using (true);

-- Seuls les admins peuvent créer / modifier / supprimer
create policy page_contents_insert_admin
on public.page_contents
for insert
to authenticated
with check ((select private.is_admin()));

create policy page_contents_update_admin
on public.page_contents
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy page_contents_delete_admin
on public.page_contents
for delete
to authenticated
using ((select private.is_admin()));

-- Insérer les clés par défaut
insert into public.page_contents (key, content) values
  ('home_catechumene', '# Bienvenue

Bienvenue sur votre espace catéchumène.'),
  ('home_responsable', '# Bienvenue

Bienvenue sur votre espace responsable.')
on conflict (key) do nothing;
