-- Catégorie néophyte : bascule manuelle après le baptême.
-- La présence d'une date de baptême ne déclenche aucune bascule automatique.

alter table public.catechumenes
  add column if not exists est_neophyte boolean not null default false;

comment on column public.catechumenes.est_neophyte is
  'Si true, fiche néophyte : baptême renseigné, exclue des catéchumènes actifs et sans frat.';

alter table public.catechumenes
  add constraint catechumenes_not_candidat_and_neophyte
  check (not (est_candidat and est_neophyte));

alter table public.catechumenes
  add constraint catechumenes_neophyte_has_baptism_date
  check (not est_neophyte or date_bapteme is not null);

alter table public.catechumenes
  add constraint catechumenes_neophyte_has_no_frat
  check (not est_neophyte or frat_id is null);
