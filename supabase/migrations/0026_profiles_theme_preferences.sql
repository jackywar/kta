-- Preferences UI (mode + palette) for next-themes + data-theme.
-- Safe to run multiple times.

alter table public.profiles
  add column if not exists theme_mode text not null default 'system',
  add column if not exists theme_palette text not null default 'default';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_mode_check'
  ) then
    alter table public.profiles
      add constraint profiles_theme_mode_check
      check (theme_mode in ('light', 'dark', 'system'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_palette_check'
  ) then
    alter table public.profiles
      add constraint profiles_theme_palette_check
      check (theme_palette in ('default', 'blue', 'red'));
  end if;
end;
$$;

