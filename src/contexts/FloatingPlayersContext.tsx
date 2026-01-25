import { createContext, useContext, ReactNode } from 'react';
import { usePlayer } from '@/player/PlayerContext';

interface FloatingPlayerState {
  type: 'spotify' | 'youtube';
  trackId: string;
  title?: string;
  artist?: string;
}

interface FloatingPlayersContextType {
  spotifyPlayer: FloatingPlayerState | null;
  youtubePlayer: FloatingPlayerState | null;
  activePlayer: 'spotify' | 'youtube' | null;
  playSpotify: (trackId: string, title?: string, artist?: string) => void;
  playYouTube: (videoId: string, title?: string, artist?: string) => void;
  seekYouTube: (seconds: number) => void;
  closeSpotify: () => void;
  closeYouTube: () => void;
  setActivePlayer: (player: 'spotify' | 'youtube') => void;
}

// const FloatingPlayersContext = createContext<FloatingPlayersContextType | undefined>(undefined);

export function FloatingPlayersProvider({ children }: { children: ReactNode }) {
  // Delegate to PlayerContext to avoid duplicate UI/providers
  const player = usePlayer();

  const spotifyPlayer = player.spotifyTrackId ? { type: 'spotify' as const, trackId: player.spotifyTrackId } : null;
  const youtubePlayer = player.youtubeTrackId ? { type: 'youtube' as const, trackId: player.youtubeTrackId } : null;
  const activePlayer = player.spotifyOpen ? 'spotify' : player.youtubeOpen ? 'youtube' : null;

  const playSpotify = (trackId: string, title?: string, artist?: string) => {
    player.openPlayer({ canonicalTrackId: null, provider: 'spotify', providerTrackId: trackId, autoplay: true });
  };

  const playYouTube = (videoId: string, title?: string, artist?: string) => {
    player.openPlayer({ canonicalTrackId: null, provider: 'youtube', providerTrackId: videoId, autoplay: true });
  };

  const seekYouTube = (seconds: number) => {
    player.seekTo(seconds);
  };

  const closeSpotify = () => player.closeSpotify();
  const closeYouTube = () => player.closeYoutube();

  const setActivePlayer = (p: 'spotify' | 'youtube') => {
    // switchProvider will open the requested provider while closing the other
    player.switchProvider(p, p === 'spotify' ? player.spotifyTrackId : player.youtubeTrackId, player.canonicalTrackId ?? undefined);
  };

  return (
    <FloatingPlayersContext.Provider
      value={{
        spotifyPlayer,
        youtubePlayer,
        activePlayer,
        playSpotify,
        playYouTube,
        seekYouTube,
        closeSpotify,
        closeYouTube,
        setActivePlayer,
      }}
    >
      {children}
    </FloatingPlayersContext.Provider>
  );
}

// export function useFloatingPlayers() {
//   const context = useContext(FloatingPlayersContext);
//   if (!context) {
//     throw new Error('useFloatingPlayers must be used within FloatingPlayersProvider');
//   }
//   return context;
// }
// >>>>>>> Stashed changes
