-- Niveaux de visibilite des evenements.

create type public.event_visibility as enum (
  'tout',
  'annee_1',
  'annee_2',
  'equipe'
);

alter table public.events
  add column if not exists visibility public.event_visibility not null default 'tout';

update public.events
set visibility = 'tout'
where visibility is null;

comment on column public.events.visibility is
  'Niveau de visibilite: tout, annee_1, annee_2, equipe.';

drop policy if exists events_select_all on public.events;

create policy events_select_by_visibility
on public.events
for select
to authenticated
using (
  (select private.is_admin())
  or (select private.is_responsable())
  or visibility = 'tout'
  or (
    visibility = 'annee_1'
    and exists (
      select 1
      from public.profiles p
      join public.catechumenes c on c.id = p.catechumene_id
      where p.id = auth.uid()
        and p.role = 'catechumene'
        and c.date_entree_catechumenat is null
    )
  )
  or (
    visibility = 'annee_2'
    and exists (
      select 1
      from public.profiles p
      join public.catechumenes c on c.id = p.catechumene_id
      where p.id = auth.uid()
        and p.role = 'catechumene'
        and c.date_entree_catechumenat is not null
    )
  )
);
