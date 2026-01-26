import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { useCallback } from 'react';
import { TrackProviderInfo, getProviderLinks, openProviderLink } from '@/lib/providers';
import { getPreferredProvider, setPreferredProvider } from '@/lib/preferences';
import { usePlayer } from '@/player/PlayerContext';
import { cn } from '@/lib/utils';

interface QuickStreamButtonsProps {
  track: TrackProviderInfo;
  canonicalTrackId?: string | null;
  trackTitle?: string;
  trackArtist?: string;
  const links = getProviderLinks(track);
  const spotifyLink = links.find(l => l.provider === 'spotify');
  const youtubeLink = links.find(l => l.provider === 'youtube');
  const preferredProvider = getPreferredProvider();
  const { openPlayer } = usePlayer();

  const hasSpotify = Boolean(track.spotifyId || spotifyLink);
  const hasYouTube = Boolean(track.youtubeId || youtubeLink);
  const unavailable = !hasSpotify && !hasYouTube;

  const handleSpotifyClick = useCallback(() => {
    if (!hasSpotify) return;
    if (track.spotifyId) {
      setPreferredProvider('spotify');
      openPlayer({
        canonicalTrackId,
        provider: 'spotify',
        providerTrackId: track.spotifyId,
        autoplay: true,
        context: 'quick-stream',
        title: trackTitle,
        artist: trackArtist,
      });
      return;
    }

    if (spotifyLink) {
      openProviderLink(spotifyLink);
    }
  }, [hasSpotify, canonicalTrackId, track.spotifyId, trackTitle, trackArtist, openPlayer, spotifyLink]);

  const handleYouTubeClick = useCallback(() => {
    if (!hasYouTube) return;
    if (track.youtubeId) {
      setPreferredProvider('youtube');
      openPlayer({
        canonicalTrackId,
        provider: 'youtube',
        providerTrackId: track.youtubeId,
        autoplay: true,
        context: 'quick-stream',
        title: trackTitle,
        artist: trackArtist,
      });
      return;
    }

    if (youtubeLink) {
      openProviderLink(youtubeLink);
    }
  }, [hasYouTube, canonicalTrackId, track.youtubeId, trackTitle, trackArtist, openPlayer, youtubeLink]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (unavailable) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Music className="w-4 h-4" />
        <span className="text-sm">No streaming links</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        whileHover={{ scale: hasSpotify ? 1.1 : 1 }}
        whileTap={{ scale: hasSpotify ? 0.95 : 1 }}
        onClick={hasSpotify ? handleSpotifyClick : undefined}
        data-provider="spotify"
        disabled={!hasSpotify}
        className={cn(
          sizeClasses[size],
          'rounded-full flex items-center justify-center transition-all',
          hasSpotify
            ? 'bg-[#1DB954] hover:bg-[#1ed760] text-white shadow-lg'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70',
          preferredProvider === 'spotify' && hasSpotify && 'ring-2 ring-white ring-offset-2 ring-offset-background'
        )}
        title={hasSpotify ? 'Play in Spotify' : 'Spotify unavailable'}
        aria-label={hasSpotify ? `Play ${trackTitle} in Spotify` : 'Spotify unavailable'}
      >
        <SpotifyIcon className={iconSizes[size]} />
      </motion.button>

      <motion.button
        whileHover={{ scale: hasYouTube ? 1.1 : 1 }}
        whileTap={{ scale: hasYouTube ? 0.95 : 1 }}
        onClick={hasYouTube ? handleYouTubeClick : undefined}
        data-provider="youtube"
        disabled={!hasYouTube}
        className={cn(
          sizeClasses[size],
          'rounded-full flex items-center justify-center transition-all',
          hasYouTube
            ? 'bg-[#FF0000] hover:bg-[#cc0000] text-white shadow-lg'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70',
          preferredProvider === 'youtube' && hasYouTube && 'ring-2 ring-white ring-offset-2 ring-offset-background'
        )}
        title={hasYouTube ? 'Play on YouTube' : 'YouTube unavailable'}
        aria-label={hasYouTube ? `Play ${trackTitle} on YouTube` : 'YouTube unavailable'}
      >
        <YouTubeIcon className={iconSizes[size]} />
      </motion.button>
    </div>
  );
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Spotify button */}
      {spotifyLink && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSpotifyClick}
          data-provider="spotify"
          className={cn(
            sizeClasses[size],
            'rounded-full flex items-center justify-center transition-all',
            'bg-[#1DB954] hover:bg-[#1ed760] text-white shadow-lg',
            preferredProvider === 'spotify' && 'ring-2 ring-white ring-offset-2 ring-offset-background'
          )}
          title="Play in Spotify"
          aria-label={`Play ${trackTitle} in Spotify`}
        >
          <SpotifyIcon className={iconSizes[size]} />
        </motion.button>
      )}

      {/* YouTube button */}
      {youtubeLink && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleYouTubeClick}
          data-provider="youtube"
          className={cn(
            sizeClasses[size],
            'rounded-full flex items-center justify-center transition-all',
            'bg-[#FF0000] hover:bg-[#cc0000] text-white shadow-lg',
            preferredProvider === 'youtube' && 'ring-2 ring-white ring-offset-2 ring-offset-background'
          )}
          title="Play on YouTube"
          aria-label={`Play ${trackTitle} on YouTube`}
        >
          <YouTubeIcon className={iconSizes[size]} />
        </motion.button>
      )}
    </div>
  );
}

// Export individual icons for reuse
export { SpotifyIcon, AppleMusicIcon, YouTubeIcon };
