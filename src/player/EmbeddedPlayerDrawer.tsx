import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Menu } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { YouTubePlayer } from './providers/YouTubePlayer';
import { SpotifyEmbedPreview } from './providers/SpotifyEmbedPreview';
import { QueueSheet } from './QueueSheet';

const providerMeta = {
  spotify: { label: 'Spotify', badge: '🎧', color: 'from-green-500/20 to-green-600/10' },
  youtube: { label: 'YouTube', badge: '▶', color: 'from-red-500/20 to-red-600/10' },
} as const;

export function EmbeddedPlayerDrawer() {
  const { open, provider, providerTrackId, autoplay, closePlayer } = usePlayer();
  const meta = useMemo(() => {
    return provider ? providerMeta[provider as keyof typeof providerMeta] ?? { label: 'Now Playing', badge: '♪' } : { label: 'Now Playing', badge: '♪' };
  }, [provider]);

  // Only render if open and provider/trackId are set
  if (!open || !provider || !providerTrackId) return null;

  // Responsive: full-width, fixed bottom, mobile-first
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-full pointer-events-auto"
      style={{
        // On mobile, take full width and height up to 40% of screen
        maxWidth: '100vw',
      }}
    >
      <div
        className="mx-auto w-full sm:max-w-md lg:max-w-lg bg-gradient-to-br shadow-2xl backdrop-blur-xl border-t border-border/50 rounded-t-2xl overflow-hidden"
        style={{
          borderRadius: '1.25rem 1.25rem 0 0',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 bg-background/80">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-xl shadow-inner">{meta.badge}</span>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Now Playing</span>
            <span className="text-sm font-bold text-foreground">{meta.label}</span>
          </div>
          <button
            type="button"
            onClick={closePlayer}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-muted/60 text-muted-foreground transition hover:border-border hover:bg-background hover:text-foreground"
            aria-label="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="w-full px-2 pb-2 pt-1 flex flex-col items-center justify-center bg-background">
          {/* Only one player visible at a time, full width, touch-friendly */}
          <div className="w-full">
            {provider === 'spotify' ? (
              <SpotifyEmbedPreview providerTrackId={providerTrackId} autoplay={autoplay} />
            ) : (
              <YouTubePlayer providerTrackId={providerTrackId} autoplay={autoplay} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}