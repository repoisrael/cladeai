import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  user_display_name?: string;
  user_avatar_url?: string;
}

export function useTrackComments(trackId: string) {
  return useQuery({
    queryKey: ['track-comments', trackId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('track_comments')
          .select(`
            *,
            profiles:user_id (
              display_name,
              avatar_url
            )
          `)
          .eq('track_id', trackId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map((comment: any) => ({
          ...comment,
          user_display_name: comment.profiles?.display_name || 'Anonymous',
          user_avatar_url: comment.profiles?.avatar_url,
        })) as Comment[];
      } catch (error) {
        console.error('Failed to load track comments:', error);
        return [];
      }
    },
    enabled: !!trackId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      trackId, 
      content, 
      parentId 
    }: { 
      trackId: string; 
      content: string; 
      parentId?: string;
    }) => {
      try {
        if (!user) throw new Error('Must be logged in to comment');

        const { data, error } = await supabase
          .from('track_comments')
          .insert({
            track_id: trackId,
            user_id: user.id,
            content,
            parent_id: parentId || null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Failed to add comment:', error);
        return null;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['track-comments', variables.trackId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, trackId }: { commentId: string; trackId: string }) => {
      try {
        const { error } = await supabase
          .from('track_comments')
          .delete()
          .eq('id', commentId);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['track-comments', variables.trackId] });
    },
  });
}

export function useCommentCount(trackId: string) {
  return useQuery({
    queryKey: ['comment-count', trackId],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('track_comments')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', trackId);

        if (error) throw error;
        return count || 0;
      } catch (error) {
        console.error('Failed to load comment count:', error);
        return 0;
      }
    },
    enabled: !!trackId,
  });
}
