-- Create user_follows table for social following
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

-- RLS Policies
CREATE POLICY "Users can view all follows"
ON public.user_follows
FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.user_follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows
FOR DELETE
USING (auth.uid() = follower_id);

-- Create play_history table to track what users are listening to
CREATE TABLE public.play_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_ms INTEGER, -- How long they listened
  source TEXT DEFAULT 'feed' -- Where they played from
);

-- Enable RLS
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_play_history_user ON public.play_history(user_id);
CREATE INDEX idx_play_history_track ON public.play_history(track_id);
CREATE INDEX idx_play_history_played_at ON public.play_history(played_at DESC);

-- RLS Policies
CREATE POLICY "Users can view their own play history"
ON public.play_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view followed users play history"
ON public.play_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE follower_id = auth.uid() AND following_id = play_history.user_id
  )
);

CREATE POLICY "Users can record their own plays"
ON public.play_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);