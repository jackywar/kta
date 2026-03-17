-- Lien d'un profil (user) vers un catéchumène

alter table public.profiles
  add column if not exists catechumene_id uuid
    references public.catechumenes (id) on delete set null;

