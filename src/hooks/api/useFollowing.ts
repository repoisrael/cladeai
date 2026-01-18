import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FollowRecord {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

interface PlayHistoryItem {
  id: string;
  user_id: string;
  track_id: string;
  played_at: string;
  duration_ms: number | null;
  source: string | null;
  track?: {
    id: string;
    title: string;
    artist: string;
    album: string | null;
    cover_url: string | null;
    preview_url: string | null;
    spotify_id: string | null;
    youtube_id: string | null;
  };
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface FollowingFeedItem extends PlayHistoryItem {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Fetch users the current user is following
 */
export function useFollowing() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following', user?.id],
    queryFn: async (): Promise<FollowRecord[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

/**
 * Fetch users who follow the current user
 */
export function useFollowers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async (): Promise<FollowRecord[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('following_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

/**
 * Check if current user follows a specific user
 */
export function useIsFollowing(userId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-following', user?.id, userId],
    queryFn: async (): Promise<boolean> => {
      if (!user || !userId) return false;

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!userId,
  });
}

/**
 * Follow a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: followingId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, followingId) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, followingId] });
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
    },
  });
}

/**
 * Unfollow a user
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;
    },
    onSuccess: (_, followingId) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, followingId] });
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
    },
  });
}

/**
 * Record a play event
 */
export function useRecordPlay() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      trackId,
      durationMs,
      source = 'feed',
    }: {
      trackId: string;
      durationMs?: number;
      source?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('play_history')
        .insert({
          user_id: user.id,
          track_id: trackId,
          duration_ms: durationMs,
          source,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Get the feed of tracks from followed users
 */
export function useFollowingFeed(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following-feed', user?.id, limit],
    queryFn: async (): Promise<FollowingFeedItem[]> => {
      if (!user) return [];

      // First get the list of users we're following
      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;
      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map((f) => f.following_id);

      // Get play history from followed users
      const { data: history, error: historyError } = await supabase
        .from('play_history')
        .select(`
          id,
          user_id,
          track_id,
          played_at,
          duration_ms,
          source
        `)
        .in('user_id', followingIds)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (historyError) throw historyError;
      if (!history || history.length === 0) return [];

      // Get unique track IDs and user IDs
      const trackIds = [...new Set(history.map((h) => h.track_id))];
      const userIds = [...new Set(history.map((h) => h.user_id))];

      // Fetch tracks
      const { data: tracks, error: tracksError } = await supabase
        .from('tracks')
        .select('id, title, artist, album, cover_url, preview_url, spotify_id, youtube_id')
        .in('id', trackIds);

      if (tracksError) throw tracksError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map everything together
      const trackMap = new Map(tracks?.map((t) => [t.id, t]));
      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      return history.map((h) => ({
        ...h,
        track: trackMap.get(h.track_id),
        profile: profileMap.get(h.user_id) || { display_name: null, avatar_url: null },
      }));
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Get the current user's play history
 */
export function useMyPlayHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-play-history', user?.id, limit],
    queryFn: async (): Promise<PlayHistoryItem[]> => {
      if (!user) return [];

      const { data: history, error: historyError } = await supabase
        .from('play_history')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (historyError) throw historyError;
      if (!history || history.length === 0) return [];

      // Fetch tracks
      const trackIds = [...new Set(history.map((h) => h.track_id))];
      const { data: tracks, error: tracksError } = await supabase
        .from('tracks')
        .select('id, title, artist, album, cover_url, preview_url, spotify_id, youtube_id')
        .in('id', trackIds);

      if (tracksError) throw tracksError;

      const trackMap = new Map(tracks?.map((t) => [t.id, t]));

      return history.map((h) => ({
        ...h,
        track: trackMap.get(h.track_id),
      }));
    },
    enabled: !!user,
  });
}
