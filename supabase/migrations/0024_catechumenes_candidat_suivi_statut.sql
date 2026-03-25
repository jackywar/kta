-- Statut de suivi pour les fiches candidat (catechumenes.est_candidat = true).

create type public.candidat_suivi_statut as enum (
  'contacte_rencontre',
  'rencontre',
  'contacte_pas_dispo',
  'contacte_ne_repond_pas'
);

alter table public.catechumenes
  add column if not exists candidat_suivi_statut public.candidat_suivi_statut;

create index if not exists catechumenes_candidat_suivi_statut_idx
  on public.catechumenes (candidat_suivi_statut);

comment on column public.catechumenes.candidat_suivi_statut is
  'Suivi candidat : contact / rencontre / indisponibilité / absence de réponse.';
