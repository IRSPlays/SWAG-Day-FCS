-- SWAG DAY FS — Supabase schema (optional cross-device persistence).
-- The app runs WITHOUT Supabase (local BroadcastChannel transport).
-- With these tables + the env keys, survey/vote data also persists server-side.

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  rating int not null check (rating between 1 and 4),
  best_moment text not null,
  one_word text,
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  emoji text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  option_key text not null,
  created_at timestamptz not null default now()
);

-- anonymous clients may insert, nobody reads raw rows client-side
alter table public.survey_responses enable row level security;
alter table public.reactions enable row level security;
alter table public.votes enable row level security;

create policy "anon insert surveys" on public.survey_responses
  for insert to anon with check (true);
create policy "anon insert reactions" on public.reactions
  for insert to anon with check (true);
create policy "anon insert votes" on public.votes
  for insert to anon with check (true);
