import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

/**
 * DRY hook for managing ALL user-track interactions
 * Replaces separate useLike, useSave, useHarmony hooks
 * Single source of truth for liked, harmony_saved, bookmarked states
 */

export interface TrackInteraction {
  liked: boolean;
  harmonySaved: boolean;
  bookmarked: boolean;
  playCount: number;
  lastPlayedAt: string | null;
}

export function useInteractions(trackId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [interaction, setInteraction] = useState<TrackInteraction>({
    liked: false,
    harmonySaved: false,
    bookmarked: false,
    playCount: 0,
    lastPlayedAt: null,
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch interaction state from database
  const fetchInteraction = useCallback(async () => {
    if (!user || !trackId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_interaction_state', {
          p_user_id: user.id,
          p_track_id: trackId,
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const state = data[0];
        setInteraction({
          liked: state.liked || false,
          harmonySaved: state.harmony_saved || false,
          bookmarked: state.bookmarked || false,
          playCount: state.play_count || 0,
          lastPlayedAt: state.last_played_at,
        });
      }
    } catch (error) {
      console.error('Error fetching interaction state:', error);
    } finally {
      setLoading(false);
    }
  }, [user, trackId]);

  useEffect(() => {
    fetchInteraction();
  }, [fetchInteraction]);

  // Toggle like (DRY implementation)
  const toggleLike = useCallback(async () => {
    if (!user || !trackId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like tracks',
        variant: 'destructive',
      });
      return;
    }

    // Optimistic update
    const previousState = interaction.liked;
    setInteraction((prev) => ({ ...prev, liked: !prev.liked }));

    try {
      const { data, error } = await supabase
        .rpc('toggle_like', {
          p_user_id: user.id,
          p_track_id: trackId,
        });

      if (error) throw error;

      // Confirm final state from server
      setInteraction((prev) => ({ ...prev, liked: data }));

      toast({
        title: data ? 'Track liked' : 'Like removed',
        description: data 
          ? 'Added to your Liked Songs' 
          : 'Removed from Liked Songs',
      });
    } catch (error) {
      // Rollback on error
      setInteraction((prev) => ({ ...prev, liked: previousState }));
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  }, [user, trackId, interaction.liked, toast]);

  // Toggle harmony save (DRY implementation)
  const toggleHarmonySave = useCallback(async () => {
    if (!user || !trackId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save harmonies',
        variant: 'destructive',
      });
      return;
    }

    const previousState = interaction.harmonySaved;
    setInteraction((prev) => ({ ...prev, harmonySaved: !prev.harmonySaved }));

    try {
      const { data, error } = await supabase
        .rpc('toggle_harmony_save', {
          p_user_id: user.id,
          p_track_id: trackId,
        });

      if (error) throw error;

      setInteraction((prev) => ({ ...prev, harmonySaved: data }));

      toast({
        title: data ? 'Harmony saved' : 'Harmony removed',
        description: data 
          ? 'Added to Harmony Collection' 
          : 'Removed from Harmony Collection',
      });
    } catch (error) {
      setInteraction((prev) => ({ ...prev, harmonySaved: previousState }));
      console.error('Error toggling harmony save:', error);
      toast({
        title: 'Error',
        description: 'Failed to update harmony save',
        variant: 'destructive',
      });
    }
  }, [user, trackId, interaction.harmonySaved, toast]);

  // Toggle bookmark (DRY implementation)
  const toggleBookmark = useCallback(async () => {
    if (!user || !trackId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to bookmark tracks',
        variant: 'destructive',
      });
      return;
    }

    const previousState = interaction.bookmarked;
    setInteraction((prev) => ({ ...prev, bookmarked: !prev.bookmarked }));

    try {
      const { data, error } = await supabase
        .rpc('toggle_bookmark', {
          p_user_id: user.id,
          p_track_id: trackId,
        });

      if (error) throw error;

      setInteraction((prev) => ({ ...prev, bookmarked: data }));

      toast({
        title: data ? 'Track bookmarked' : 'Bookmark removed',
        description: data 
          ? 'Added to Bookmarked' 
          : 'Removed from Bookmarked',
      });
    } catch (error) {
      setInteraction((prev) => ({ ...prev, bookmarked: previousState }));
      console.error('Error toggling bookmark:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    }
  }, [user, trackId, interaction.bookmarked, toast]);

  // Record play event (analytics)
  const recordPlay = useCallback(async (durationMs = 0, skipped = false) => {
    if (!user || !trackId) return;

    try {
      await supabase.rpc('record_play', {
        p_user_id: user.id,
        p_track_id: trackId,
        p_duration_ms: durationMs,
        p_skipped: skipped,
      });

      // Update local state
      setInteraction((prev) => ({
        ...prev,
        playCount: prev.playCount + 1,
        lastPlayedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error recording play:', error);
    }
  }, [user, trackId]);

  return {
    interaction,
    loading,
    toggleLike,
    toggleHarmonySave,
    toggleBookmark,
    recordPlay,
    refetch: fetchInteraction,
  };
}

/**
 * Hook to fetch user's liked tracks (for Liked Songs playlist)
 * DRY implementation for feed pages
 */
export function useLikedTracks(limit = 50, offset = 0) {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Array<{
    trackId: string;
    likedAt: string;
    playCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLikedTracks = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_liked_tracks', {
            p_user_id: user.id,
            p_limit: limit,
            p_offset: offset,
          });

        if (error) throw error;

        setTracks(
          data?.map((t: any) => ({
            trackId: t.track_id,
            likedAt: t.liked_at,
            playCount: t.play_count,
          })) || []
        );
      } catch (error) {
        console.error('Error fetching liked tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedTracks();
  }, [user, limit, offset]);

  return { tracks, loading };
}

/**
 * Hook to manage user playlists (DRY for playlist operations)
 */
export function usePlaylists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const createPlaylist = useCallback(async (
    name: string,
    description?: string,
    isPublic = true
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name,
          description,
          is_public: isPublic,
          type: 'custom',
        })
        .select()
        .single();

      if (error) throw error;

      setPlaylists((prev) => [data, ...prev]);
      toast({
        title: 'Playlist created',
        description: `"${name}" has been created`,
      });

      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const addToPlaylist = useCallback(async (
    playlistId: string,
    trackId: string
  ) => {
    if (!user) return false;

    try {
      // Get max position
      const { data: existingTracks } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = existingTracks?.[0]?.position || 0;

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: maxPosition + 1,
          added_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already in playlist',
            description: 'This track is already in the playlist',
          });
          return false;
        }
        throw error;
      }

      toast({
        title: 'Added to playlist',
        description: 'Track added successfully',
      });

      return true;
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add track to playlist',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return {
    playlists,
    loading,
    createPlaylist,
    addToPlaylist,
    refetch: fetchPlaylists,
  };
}
