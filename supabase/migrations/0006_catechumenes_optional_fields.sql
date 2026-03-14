-- Rendre optionnels : email, date d'entrée en catéchuménat (date_naissance déjà nullable)
alter table public.catechumenes
  alter column email drop not null,
  alter column date_entree_catechumenat drop not null;
