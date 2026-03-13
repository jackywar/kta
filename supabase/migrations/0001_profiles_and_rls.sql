-- Profiles table linked to auth.users (application data only)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'catechumene' check (role in ('admin', 'responsable', 'catechumene')),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique on public.profiles (email);

alter table public.profiles enable row level security;

-- Create a profile row when a new auth user is created.
-- Never write directly to auth.users via SQL.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'catechumene')
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS policies

-- =========================================================
-- CLEAN
-- =========================================================

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_insert_admin on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_delete_admin on public.profiles;

drop function if exists private.is_admin();
drop schema if exists private cascade;


-- =========================================================
-- PRIVATE HELPER
-- =========================================================
-- Ne pas mettre cette fonction dans un schéma exposé par l'API.
-- Supabase recommande de placer les fonctions security definer
-- dans un schéma non exposé. 

create schema private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;


-- =========================================================
-- POLICIES
-- =========================================================

-- 1) Un utilisateur connecté peut lire son propre profil
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- 2) Un utilisateur connecté peut mettre à jour son propre profil
-- USING = quelles lignes il peut cibler
-- WITH CHECK = quelles nouvelles valeurs il a le droit d'écrire
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- 3) Un utilisateur connecté peut créer sa propre ligne de profil
-- utile si tu crées le profil côté app à l'inscription
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- 4) Admin: lecture de tous les profils
create policy profiles_select_admin
on public.profiles
for select
to authenticated
using ((select private.is_admin()));

-- 5) Admin: création de tous les profils
create policy profiles_insert_admin
on public.profiles
for insert
to authenticated
with check ((select private.is_admin()));

-- 6) Admin: modification de tous les profils
create policy profiles_update_admin
on public.profiles
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- 7) Admin: suppression de tous les profils
create policy profiles_delete_admin
on public.profiles
for delete
to authenticated
using ((select private.is_admin()));

-- Optionnel mais recommandé :
-- empêcher les utilisateurs connectés de modifier directement la colonne role
revoke update (role) on public.profiles from authenticated;