-- Table des catéchumènes
create table if not exists public.catechumenes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text,
  date_naissance date,
  observations text,
  aine_dans_la_foi text,
  annee_bapteme_previsionnelle smallint,
  rencontre_individuelle_date date,
  rencontre_individuelle_texte text,
  date_entree_catechumenat date not null,
  frat_id uuid references public.frats (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.catechumenes enable row level security;

-- =========================================================
-- POLICIES CATECHUMENES
-- =========================================================

-- Lecture pour tous les utilisateurs authentifiés
create policy catechumenes_select_all
on public.catechumenes
for select
to authenticated
using (true);

-- Création / modification / suppression réservées aux admins
create policy catechumenes_insert_admin
on public.catechumenes
for insert
to authenticated
with check ((select private.is_admin()));

create policy catechumenes_update_admin
on public.catechumenes
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy catechumenes_delete_admin
on public.catechumenes
for delete
to authenticated
using ((select private.is_admin()));
