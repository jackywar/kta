-- Candidats : même table que les catéchumènes, avec indicateur « candidat »
-- (hors liste catéchumènes responsable tant que non basculé en catéchumène).

alter table public.catechumenes
  add column if not exists est_candidat boolean not null default false;

comment on column public.catechumenes.est_candidat is
  'Si true, fiche candidat (vue dédiée responsable ; exclu de la liste catéchumènes).';
