-- Responsable référent pour une fiche (notamment candidat).

alter table public.catechumenes
  add column if not exists responsable_profile_id uuid
    references public.profiles (id) on delete set null;

create index if not exists catechumenes_responsable_profile_id_idx
  on public.catechumenes (responsable_profile_id);

comment on column public.catechumenes.responsable_profile_id is
  'Profil responsable référent (suivi / accompagnement).';
