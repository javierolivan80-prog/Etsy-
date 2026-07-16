-- ============================================================
-- PaceAI — Supabase schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Every table is owned by a user and protected with RLS: a user
-- can only ever see and modify their own rows.
-- ============================================================

-- ---------- Profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  max_hr integer not null default 190 check (max_hr between 120 and 230),
  rest_hr integer not null default 55 check (rest_hr between 25 and 110),
  weight_kg numeric(5, 2) check (weight_kg between 25 and 250),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Auto-create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Activities ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date timestamptz not null,
  name text not null,
  sport text not null default 'running',
  type text not null check (type in ('easy', 'long', 'tempo', 'intervals', 'recovery', 'race')),
  distance_km numeric(7, 3) not null check (distance_km > 0 and distance_km < 1000),
  duration_sec integer not null check (duration_sec > 0),
  avg_pace_sec_km numeric(8, 2) not null check (avg_pace_sec_km > 0),
  avg_hr integer check (avg_hr between 40 and 240),
  max_hr integer check (max_hr between 40 and 250),
  elevation_gain_m integer check (elevation_gain_m >= 0),
  cadence_spm integer check (cadence_spm between 60 and 260),
  stride_len_m numeric(4, 2),
  power_w integer check (power_w between 0 and 2000),
  calories integer check (calories >= 0),
  splits jsonb not null default '[]'::jsonb,
  source text not null default 'manual',
  external_id text,
  created_at timestamptz not null default now(),
  -- Dedupe key for synced/imported activities.
  unique (user_id, source, external_id)
);

create index if not exists activities_user_date_idx on public.activities (user_id, date desc);

alter table public.activities enable row level security;

create policy "activities_select_own" on public.activities
  for select using ((select auth.uid()) = user_id);
create policy "activities_insert_own" on public.activities
  for insert with check ((select auth.uid()) = user_id);
create policy "activities_update_own" on public.activities
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "activities_delete_own" on public.activities
  for delete using ((select auth.uid()) = user_id);

-- ---------- Goals ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  distance_km numeric(7, 3) not null check (distance_km > 0 and distance_km < 1000),
  target_seconds integer not null check (target_seconds > 0),
  created_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id, created_at desc);

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals
  for select using ((select auth.uid()) = user_id);
create policy "goals_insert_own" on public.goals
  for insert with check ((select auth.uid()) = user_id);
create policy "goals_update_own" on public.goals
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals_delete_own" on public.goals
  for delete using ((select auth.uid()) = user_id);

-- ---------- Chat history ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now()
);

create index if not exists chat_user_created_idx on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "chat_select_own" on public.chat_messages
  for select using ((select auth.uid()) = user_id);
create policy "chat_insert_own" on public.chat_messages
  for insert with check ((select auth.uid()) = user_id);
create policy "chat_delete_own" on public.chat_messages
  for delete using ((select auth.uid()) = user_id);

-- ---------- updated_at maintenance ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
