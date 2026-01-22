import { useMemo } from 'react';
import { usePlayer } from './PlayerContext';
import { YouTubePlayer } from './providers/YouTubePlayer';
import { SpotifyEmbedPreview } from './providers/SpotifyEmbedPreview';

const providerMeta = {
  spotify: { label: 'Spotify', badge: '🎧', color: 'bg-green-900/80' },
  youtube: { label: 'YouTube', badge: '▶', color: 'bg-red-900/80' },
} as const;

export function EmbeddedPlayerDrawer() {
  const {
    spotifyOpen,
    youtubeOpen,
    spotifyTrackId,
    youtubeTrackId,
    autoplaySpotify,
    autoplayYoutube,
    closeSpotify,
    closeYoutube,
  } = usePlayer();

  // Determine which player is active
  const provider = spotifyOpen ? 'spotify' : youtubeOpen ? 'youtube' : null;
  const providerTrackId = spotifyOpen ? spotifyTrackId : youtubeOpen ? youtubeTrackId : null;
  const autoplay = spotifyOpen ? autoplaySpotify : youtubeOpen ? autoplayYoutube : false;
  const closePlayer = spotifyOpen ? closeSpotify : closeYoutube;

  const meta = useMemo(() => {
    return provider ? providerMeta[provider as keyof typeof providerMeta] ?? { label: 'Now Playing', badge: '♪', color: 'bg-neutral-900/80' } : { label: 'Now Playing', badge: '♪', color: 'bg-neutral-900/80' };
  }, [provider]);

  if (!provider || !providerTrackId) return null;

  // Slim, clickable, always on top, 12:1 aspect ratio, shows title
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 w-full flex items-center justify-center ${meta.color}`}
      style={{ aspectRatio: '12/1', minHeight: 0, height: '48px', maxHeight: '52px', boxShadow: '0 -2px 16px rgba(0,0,0,0.18)' }}
      role="region"
      aria-label="Now Playing"
    >
      <div className="flex flex-row items-center w-full max-w-lg mx-auto px-2 gap-2">
        <span className="text-xl select-none" aria-label={meta.label}>{meta.badge}</span>
        <span className="flex-1 truncate text-sm font-semibold text-white" title="Now Playing">Now Playing</span>
        <button
          type="button"
          onClick={closePlayer}
          className="ml-2 text-white/80 hover:text-white text-lg px-2 py-1 rounded"
          aria-label="Close player"
        >
          ×
        </button>
      </div>
      {/* Only one player visible at a time, always interactive */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 2 }}>
        {provider === 'spotify' ? (
          <SpotifyEmbedPreview providerTrackId={providerTrackId} autoplay={autoplay} slim />
        ) : (
          <YouTubePlayer providerTrackId={providerTrackId} autoplay={autoplay} slim />
        )}
      </div>
    </div>
  );
}