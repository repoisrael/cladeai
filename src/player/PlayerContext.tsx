import { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';
import { recordPlayEvent } from '@/api/playEvents';
import { MusicProvider } from '@/types';
import { getPreferredProvider } from '@/lib/preferences';

export interface ConnectedProviders {
  spotify?: { connected: boolean; premium: boolean };
}

export interface PlayerState {
  spotifyOpen: boolean;
  youtubeOpen: boolean;
  canonicalTrackId: string | null;
  spotifyTrackId: string | null;
  youtubeTrackId: string | null;
  autoplaySpotify: boolean;
  autoplayYoutube: boolean;
  /** Start time in seconds for seeking (e.g., section navigation) */
  seekToSec: number | null;
  /** Currently active section ID */
  currentSectionId: string | null;
  /** Whether playback is active */
  isPlaying: boolean;
}

type OpenPlayerPayload = {
  canonicalTrackId: string | null;
  provider: MusicProvider;
  providerTrackId: string | null;
  autoplay?: boolean;
  context?: string;
  /** Optional start time in seconds */
  startSec?: number;
};

interface PlayerContextValue extends PlayerState {
  openPlayer: (payload: OpenPlayerPayload) => void;
  closeSpotify: () => void;
  closeYoutube: () => void;
  switchProvider: (provider: MusicProvider, providerTrackId: string | null, canonicalTrackId?: string | null) => void;
  /** Seek to a specific time (seconds). Used for section navigation. */
  seekTo: (sec: number) => void;
  /** Clear seekToSec after the player has performed the seek */
  clearSeek: () => void;
  /** Set the currently active section */
  setCurrentSection: (sectionId: string | null) => void;
  /** Set playback state */
  setIsPlaying: (playing: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    spotifyOpen: false,
    youtubeOpen: false,
    canonicalTrackId: null,
    spotifyTrackId: null,
    youtubeTrackId: null,
    autoplaySpotify: false,
    autoplayYoutube: false,
    seekToSec: null,
    currentSectionId: null,
    isPlaying: false,
  });

  const seekTo = useCallback((sec: number) => {
    setState((prev) => ({ ...prev, seekToSec: sec }));
  }, []);

  const clearSeek = useCallback(() => {
    setState((prev) => ({ ...prev, seekToSec: null }));
  }, []);

  const setCurrentSection = useCallback((sectionId: string | null) => {
    setState((prev) => ({ ...prev, currentSectionId: sectionId }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState((prev) => ({ ...prev, isPlaying: playing }));
  }, []);

  const value = useMemo<PlayerContextValue>(() => ({
    ...state,
    seekTo,
    clearSeek,
    setCurrentSection,
    setIsPlaying,
    openPlayer: (payload) => {
      setState((prev) => {
        const updates: Partial<PlayerState> = {
          canonicalTrackId: payload.canonicalTrackId ?? prev.canonicalTrackId,
          seekToSec: payload.startSec ?? null,
        };

        if (payload.provider === 'spotify') {
          updates.spotifyOpen = true;
          updates.spotifyTrackId = payload.providerTrackId;
          updates.autoplaySpotify = payload.autoplay ?? true;
        } else {
          updates.youtubeOpen = true;
          updates.youtubeTrackId = payload.providerTrackId;
          updates.autoplayYoutube = payload.autoplay ?? true;
        }

        return { ...prev, ...updates };
      });

      if (payload.canonicalTrackId) {
        recordPlayEvent({
          track_id: payload.canonicalTrackId,
          provider: payload.provider,
          action: 'preview',
          context: payload.context ?? 'player',
        }).catch((err) => {
          console.error('Failed to record play event', err);
        });
      }
    },
    closeSpotify: () => setState((prev) => ({ ...prev, spotifyOpen: false, autoplaySpotify: false })),
    closeYoutube: () => setState((prev) => ({ ...prev, youtubeOpen: false, autoplayYoutube: false })),
    switchProvider: (provider, providerTrackId, canonicalTrackId) => {
      setState((prev) => {
        const updates: Partial<PlayerState> = {
          canonicalTrackId: canonicalTrackId ?? prev.canonicalTrackId,
          seekToSec: null,
        };

        if (provider === 'spotify') {
          updates.spotifyOpen = true;
          updates.spotifyTrackId = providerTrackId;
          updates.autoplaySpotify = true;
        } else {
          updates.youtubeOpen = true;
          updates.youtubeTrackId = providerTrackId;
          updates.autoplayYoutube = true;
        }

        return { ...prev, ...updates };
      });

      const trackIdToLog = canonicalTrackId ?? state.canonicalTrackId;
      if (trackIdToLog) {
        recordPlayEvent({
          track_id: trackIdToLog,
          provider,
          action: 'preview',
          context: 'provider-switch',
        }).catch((err) => {
          console.error('Failed to record provider switch event', err);
        });
      }
    },
  }), [state, seekTo, clearSeek, setCurrentSection, setIsPlaying]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function resolveDefaultProvider(connected: ConnectedProviders): MusicProvider {
  // First check user's preferred provider from localStorage
  const preferred = getPreferredProvider();
  if (preferred) {
    // If user prefers Spotify, check if it's connected
    if (preferred === 'spotify' && connected?.spotify?.connected) {
      return 'spotify';
    }
    // For other providers, use the preference if it's valid
    if (preferred === 'youtube' || preferred === 'apple_music') {
      return preferred;
    }
  }
  
  // Fallback: if Spotify is connected, use it
  if (connected?.spotify?.connected) return 'spotify';
  
  // Default to YouTube
  return 'youtube';
}
