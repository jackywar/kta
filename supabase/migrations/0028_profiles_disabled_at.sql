alter table public.profiles
add column if not exists disabled_at timestamptz;

create index if not exists profiles_disabled_at_idx on public.profiles (disabled_at);

