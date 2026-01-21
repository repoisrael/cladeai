import { createContext, useContext, useState, ReactNode } from 'react';
import { FloatingPlayer } from '@/components/FloatingPlayer';

interface FloatingPlayerState {
  type: 'spotify' | 'youtube';
  trackId: string;
  title: string;
  artist?: string;
}

interface FloatingPlayersContextType {
  spotifyPlayer: FloatingPlayerState | null;
  youtubePlayer: FloatingPlayerState | null;
  playSpotify: (trackId: string, title: string, artist?: string) => void;
  playYouTube: (videoId: string, title: string, artist?: string) => void;
  closeSpotify: () => void;
  closeYouTube: () => void;
}

const FloatingPlayersContext = createContext<FloatingPlayersContextType | undefined>(undefined);

export function FloatingPlayersProvider({ children }: { children: ReactNode }) {
  const [spotifyPlayer, setSpotifyPlayer] = useState<FloatingPlayerState | null>(null);
  const [youtubePlayer, setYoutubePlayer] = useState<FloatingPlayerState | null>(null);

  const playSpotify = (trackId: string, title: string, artist?: string) => {
    setSpotifyPlayer({ type: 'spotify', trackId, title, artist });
  };

  const playYouTube = (videoId: string, title: string, artist?: string) => {
    setYoutubePlayer({ type: 'youtube', trackId: videoId, title, artist });
  };

  const closeSpotify = () => setSpotifyPlayer(null);
  const closeYouTube = () => setYoutubePlayer(null);

  return (
    <FloatingPlayersContext.Provider
      value={{
        spotifyPlayer,
        youtubePlayer,
        playSpotify,
        playYouTube,
        closeSpotify,
        closeYouTube,
      }}
    >
      {children}
      
      {/* Render floating players - stacked vertically in bottom-right */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          {youtubePlayer && (
            <FloatingPlayer
              key="youtube-player"
              type="youtube"
              trackId={youtubePlayer.trackId}
              title={youtubePlayer.title}
              artist={youtubePlayer.artist}
              onClose={closeYouTube}
            />
          )}
        </div>
        <div className="pointer-events-auto">
          {spotifyPlayer && (
            <FloatingPlayer
              key="spotify-player"
              type="spotify"
              trackId={spotifyPlayer.trackId}
              title={spotifyPlayer.title}
              artist={spotifyPlayer.artist}
              onClose={closeSpotify}
            />
          )}
        </div>
      </div>
    </FloatingPlayersContext.Provider>
  );
}

export function useFloatingPlayers() {
  const context = useContext(FloatingPlayersContext);
  if (!context) {
    throw new Error('useFloatingPlayers must be used within FloatingPlayersProvider');
  }
  return context;
}
