-- Enable needed extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Clubs
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Courts
create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  court_id uuid not null references public.courts(id) on delete cascade,
  title text,
  scheduled_at timestamptz,
  video_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Highlights
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  title text,
  t_in integer not null check (t_in >= 0),
  t_out integer not null check (t_out > t_in),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.clubs enable row level security;
alter table public.courts enable row level security;
alter table public.matches enable row level security;
alter table public.highlights enable row level security;

-- Public read policies (anyone can view matches and highlights)
create policy if not exists "public_read_clubs" on public.clubs for select using (true);
create policy if not exists "public_read_courts" on public.courts for select using (true);
create policy if not exists "public_read_matches" on public.matches for select using (true);
create policy if not exists "public_read_highlights" on public.highlights for select using (true);

-- Authenticated users can insert/update within reason
create policy if not exists "auth_write_clubs" on public.clubs
for insert with check (auth.role() = 'authenticated');

create policy if not exists "auth_write_courts" on public.courts
for insert with check (auth.role() = 'authenticated');

create policy if not exists "auth_write_matches" on public.matches
for insert with check (auth.role() = 'authenticated');

create policy if not exists "auth_write_highlights" on public.highlights
for insert with check (auth.role() = 'authenticated');

-- Owners can update their own objects (simplified)
create policy if not exists "auth_update_matches" on public.matches
for update using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy if not exists "auth_update_highlights" on public.highlights
for update using (created_by = auth.uid()) with check (created_by = auth.uid());
