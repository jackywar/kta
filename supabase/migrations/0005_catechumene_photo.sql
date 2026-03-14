-- Colonne photo : chemin dans le bucket Storage (ex: "uuid/photo.jpg")
alter table public.catechumenes
  add column if not exists photo_path text;
