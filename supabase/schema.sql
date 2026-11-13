-- Rasoi Planner database (Phase 2)
-- Paste this whole file into Supabase → SQL Editor → New query, then press Run.
-- Safe to run more than once.

-- One row per family: everything from the Family screen.
create table if not exists public.families (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  profile    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per family: the current week's menu and ticked shopping items.
create table if not exists public.week_plans (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  plan       jsonb not null,
  grocery    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row level security: a signed-in family can only see and change its own rows.
alter table public.families   enable row level security;
alter table public.week_plans enable row level security;

drop policy if exists "Families manage their own profile" on public.families;
create policy "Families manage their own profile" on public.families
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Families manage their own menu" on public.week_plans;
create policy "Families manage their own menu" on public.week_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Handy view for you (the owner) in the Table Editor: who has signed up.
create or replace view public.family_overview
with (security_invoker = true) as
select
  f.user_id,
  u.email,
  f.profile ->> 'familyName'        as family_name,
  f.profile ->> 'diet'              as diet,
  f.profile -> 'cuisines'           as cuisines,
  f.profile ->> 'worldMealsPerWeek' as world_dinners,
  f.created_at,
  w.updated_at                      as menu_updated_at
from public.families f
join auth.users u on u.id = f.user_id
left join public.week_plans w on w.user_id = f.user_id;

revoke all on public.family_overview from anon, authenticated;
