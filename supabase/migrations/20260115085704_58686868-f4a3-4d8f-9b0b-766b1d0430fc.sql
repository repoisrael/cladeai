-- Extend tracks table with provider link columns and ISRC
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS isrc text,
ADD COLUMN IF NOT EXISTS url_spotify_web text,
ADD COLUMN IF NOT EXISTS url_spotify_app text,
ADD COLUMN IF NOT EXISTS spotify_id text,
ADD COLUMN IF NOT EXISTS url_youtube text,
ADD COLUMN IF NOT EXISTS youtube_id text;

-- Create index on ISRC for deduplication
CREATE INDEX IF NOT EXISTS idx_tracks_isrc ON public.tracks(isrc) WHERE isrc IS NOT NULL;

-- Add 2FA fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS twofa_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS twofa_secret text,
ADD COLUMN IF NOT EXISTS twofa_backup_codes text[],
ADD COLUMN IF NOT EXISTS preferred_provider text DEFAULT 'none';

-- Create search cache table
CREATE TABLE IF NOT EXISTS public.search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  market text,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_search_cache_query ON public.search_cache(query);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON public.search_cache(expires_at);

-- Enable RLS on search_cache
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cache (public feature)
CREATE POLICY "Anyone can read search cache"
ON public.search_cache
FOR SELECT
USING (true);

-- Only authenticated users can write to cache
CREATE POLICY "Authenticated users can insert cache"
ON public.search_cache
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create feed_items table for home feed ordering
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL DEFAULT 'seed',
  rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_items_rank ON public.feed_items(rank);

-- Enable RLS on feed_items
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view feed items
CREATE POLICY "Anyone can view feed items"
ON public.feed_items
FOR SELECT
USING (true);

-- Only admins can manage feed items
CREATE POLICY "Admins can manage feed items"
ON public.feed_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_provider_preferences for default provider per user
CREATE TABLE IF NOT EXISTS public.user_provider_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_provider_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage own provider preferences"
ON public.user_provider_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Update profiles RLS to allow updating 2FA and provider fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);