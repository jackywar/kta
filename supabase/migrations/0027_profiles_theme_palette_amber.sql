-- Add "amber" palette option for persisted profile preferences.
-- Safe to run multiple times.

alter table public.profiles
  drop constraint if exists profiles_theme_palette_check;

alter table public.profiles
  add constraint profiles_theme_palette_check
  check (theme_palette in ('default', 'blue', 'red', 'amber'));
