-- Date effective du baptême du catéchumène.
-- Distincte de l'année de baptême prévisionnelle déjà présente.
alter table public.catechumenes
  add column if not exists date_bapteme date;
