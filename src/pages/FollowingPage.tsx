import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Music, Play, Heart, Clock, User, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AudioPreview } from '@/components/AudioPreview';
import { StreamingLinks } from '@/components/StreamingLinks';
import { useAuth } from '@/hooks/useAuth';
import { useFollowingFeed, useFollowing, useRecordPlay } from '@/hooks/api/useFollowing';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: feed, isLoading: feedLoading } = useFollowingFeed();
  const { data: following, isLoading: followingLoading } = useFollowing();
  const recordPlay = useRecordPlay();
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-40 glass-strong safe-top">
          <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
            <h1 className="text-lg font-bold gradient-text">Following</h1>
          </div>
        </header>

        <main className="flex-1 pt-20 pb-24 flex flex-col items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Sign in to see what people are listening to</h2>
            <p className="text-muted-foreground">
              Follow other music lovers and discover new tracks through their listening activity.
            </p>
            <Button onClick={() => navigate('/auth')} className="gap-2">
              <User className="w-4 h-4" />
              Sign in
            </Button>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  const isLoading = feedLoading || followingLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong safe-top">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-lg font-bold gradient-text">Following</h1>
          <span className="text-sm text-muted-foreground">
            {following?.length || 0} following
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pt-16 pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-4">
          {isLoading ? (
            <div className="space-y-4 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !feed || feed.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Music className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No activity yet</h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {following && following.length > 0
                  ? "The people you follow haven't played any tracks recently."
                  : 'Follow some music lovers to see what they\'re listening to!'}
              </p>
              {(!following || following.length === 0) && (
                <Button onClick={() => navigate('/search')} variant="outline" className="gap-2">
                  <Users className="w-4 h-4" />
                  Find people to follow
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {feed.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden"
                >
                  {/* User info header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border/30">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={item.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {item.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.profile?.display_name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(item.played_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Play className="w-3 h-3" />
                      <span>Played</span>
                    </div>
                  </div>

                  {/* Track card */}
                  {item.track && (
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedTrack(expandedTrack === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Cover art */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          {item.track.cover_url ? (
                            <img
                              src={item.track.cover_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{item.track.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{item.track.artist}</p>
                          {item.track.album && (
                            <p className="text-xs text-muted-foreground/70 truncate">{item.track.album}</p>
                          )}
                        </div>

                        {/* Quick play indicator */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            recordPlay.mutate({ trackId: item.track_id, source: 'following-feed' });
                          }}
                        >
                          <Play className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {expandedTrack === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 space-y-4 border-t border-border/30 mt-4">
                              {/* Audio preview */}
                              {item.track.preview_url && (
                                <AudioPreview
                                  previewUrl={item.track.preview_url}
                                  title={item.track.title}
                                  artist={item.track.artist}
                                  coverUrl={item.track.cover_url}
                                  compact
                                />
                              )}

                              {/* Streaming links */}
                              <StreamingLinks
                                track={{
                                  spotifyId: item.track.spotify_id || undefined,
                                  youtubeId: item.track.youtube_id || undefined,
                                }}
                                compact
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
