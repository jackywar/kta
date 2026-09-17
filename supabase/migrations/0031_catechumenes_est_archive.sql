-- Catégorie archive : bascule manuelle (candidat, catéchumène ou néophyte).
-- Les flags est_candidat / est_neophyte sont conservés pour la restauration.

alter table public.catechumenes
  add column if not exists est_archive boolean not null default false;

comment on column public.catechumenes.est_archive is
  'Si true, fiche archivée : exclue des listes actives, sans frat ; la sous-catégorie d''origine est préservée.';

alter table public.catechumenes
  add constraint catechumenes_archive_has_no_frat
  check (not est_archive or frat_id is null);
