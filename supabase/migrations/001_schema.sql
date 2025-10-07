-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.clubs (
  id bigserial primary key,
  name text not null,
  address text,
  phone text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null
);

create table if not exists public.courts (
  id bigserial primary key,
  club_id bigint references public.clubs(id) on delete cascade,
  name text not null,
  surface text
);

create table if not exists public.schedules (
    id bigserial primary key,
    club_id bigint references public.clubs(id) on delete cascade,
    court_id bigint references public.courts(id) on delete cascade,
    day_of_week int not null, -- 0 for Sunday, 1 for Monday, etc.
    start_time time not null,
    end_time time not null,
    price decimal(10, 2)
);

create table if not exists public.reservations (
  id bigserial primary key,
  court_id bigint references public.courts(id) on delete cascade,
  player_id uuid references auth.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'confirmed'
);

create table if not exists public.tournaments (
    id bigserial primary key,
    club_id bigint references public.clubs(id) on delete cascade,
    name text not null,
    description text,
    start_date date,
    end_date date,
    max_teams int,
    entry_fee decimal(10, 2),
    created_at timestamptz default now() not null
);

create table if not exists public.teams (
    id bigserial primary key,
    name text,
    player1_id uuid references auth.users(id) on delete set null,
    player2_id uuid references auth.users(id) on delete set null,
    tournament_id bigint references public.tournaments(id) on delete cascade
);

create table if not exists public.matches (
    id bigserial primary key,
    tournament_id bigint references public.tournaments(id) on delete cascade,
    round_number int,
    match_number int,
    team1_id bigint references public.teams(id) on delete cascade,
    team2_id bigint references public.teams(id) on delete cascade,
    winner_team_id bigint references public.teams(id),
    score text, -- e.g., "6-4, 6-3"
    match_date timestamptz,
    court_id bigint references public.courts(id)
);

create table if not exists public.highlights (
  id bigserial primary key,
  match_id bigint references public.matches(id) on delete cascade,
  video_url text not null,
  description text,
  created_at timestamptz default now()
);

-- Enable Row Level Security for all tables
alter table public.clubs enable row level security;
alter table public.courts enable row level security;
alter table public.schedules enable row level security;
alter table public.reservations enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.highlights enable row level security;


-- POLICIES (Corrected Syntax)

-- Public read policies
DROP POLICY IF EXISTS "public_read_clubs" ON public.clubs;
CREATE POLICY "public_read_clubs" ON public.clubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_courts" ON public.courts;
CREATE POLICY "public_read_courts" ON public.courts FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_schedules" ON public.schedules;
CREATE POLICY "public_read_schedules" ON public.schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_tournaments" ON public.tournaments;
CREATE POLICY "public_read_tournaments" ON public.tournaments FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_teams" ON public.teams;
CREATE POLICY "public_read_teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_matches" ON public.matches;
CREATE POLICY "public_read_matches" ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_highlights" ON public.highlights;
CREATE POLICY "public_read_highlights" ON public.highlights FOR SELECT USING (true);

-- Club owner policies
DROP POLICY IF EXISTS "owner_manage_clubs" ON public.clubs;
CREATE POLICY "owner_manage_clubs" ON public.clubs FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_manage_courts" ON public.courts;
CREATE POLICY "owner_manage_courts" ON public.courts FOR ALL USING (
    (select owner_id from public.clubs where id = courts.club_id) = auth.uid()
);

DROP POLICY IF EXISTS "owner_manage_schedules" ON public.schedules;
CREATE POLICY "owner_manage_schedules" ON public.schedules FOR ALL USING (
    (select owner_id from public.clubs where id = schedules.club_id) = auth.uid()
);

DROP POLICY IF EXISTS "owner_manage_tournaments" ON public.tournaments;
CREATE POLICY "owner_manage_tournaments" ON public.tournaments FOR ALL USING (
    (select owner_id from public.clubs where id = tournaments.club_id) = auth.uid()
);

-- Authenticated user policies
DROP POLICY IF EXISTS "auth_users_manage_reservations" ON public.reservations;
CREATE POLICY "auth_users_manage_reservations" ON public.reservations FOR ALL USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "auth_users_manage_teams" ON public.teams;
CREATE POLICY "auth_users_manage_teams" ON public.teams FOR ALL USING (
    auth.uid() = player1_id OR auth.uid() = player2_id
);
