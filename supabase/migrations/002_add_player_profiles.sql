-- Create the player_profiles table
CREATE TABLE public.player_profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text,
    last_name text,
    phone text,
    province text,
    city text,
    category text,
    matches_played integer DEFAULT 0 NOT NULL,
    matches_won integer DEFAULT 0 NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    avatar_url text,
    CONSTRAINT player_profiles_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security for the new table
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for player_profiles
-- 1. Allow users to view their own profile
CREATE POLICY "Allow individual read access"
ON public.player_profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Allow users to insert their own profile upon registration
CREATE POLICY "Allow individual insert access"
ON public.player_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Allow individual update access"
ON public.player_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
