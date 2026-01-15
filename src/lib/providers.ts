// Music provider utilities and link generation

export type MusicProvider = 'spotify' | 'youtube';

export interface ProviderLink {
  provider: MusicProvider;
  name: string;
  icon: string;
  webUrl: string;
  appUrl?: string;
  color: string;
}

export interface TrackProviderInfo {
  spotifyId?: string;
  youtubeId?: string;
  urlSpotifyWeb?: string;
  urlSpotifyApp?: string;
  urlYoutube?: string;
}

// Generate Spotify URLs from track ID
export function generateSpotifyLinks(spotifyId: string): { web: string; app: string } {
  return {
    web: `https://open.spotify.com/track/${spotifyId}`,
    app: `spotify:track:${spotifyId}`,
  };
}

// Generate YouTube URL from video ID
export function generateYoutubeLink(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

// Get all available provider links for a track
export function getProviderLinks(track: TrackProviderInfo): ProviderLink[] {
  const links: ProviderLink[] = [];

  if (track.spotifyId || track.urlSpotifyWeb) {
    const spotifyLinks = track.spotifyId 
      ? generateSpotifyLinks(track.spotifyId)
      : { web: track.urlSpotifyWeb!, app: track.urlSpotifyApp };
    
    links.push({
      provider: 'spotify',
      name: 'Spotify',
      icon: '🎵',
      webUrl: spotifyLinks.web,
      appUrl: spotifyLinks.app,
      color: '#1DB954',
    });
  }

  if (track.youtubeId || track.urlYoutube) {
    const youtubeUrl = track.youtubeId 
      ? generateYoutubeLink(track.youtubeId) 
      : track.urlYoutube!;
    
    links.push({
      provider: 'youtube',
      name: 'YouTube (Free)',
      icon: '▶️',
      webUrl: youtubeUrl,
      color: '#FF0000',
    });
  }

  return links;
}

// Open provider link (tries app first, falls back to web)
export function openProviderLink(link: ProviderLink, preferApp = true): void {
  if (preferApp && link.appUrl) {
    // Try to open app, will fall back to web if app not installed
    const start = Date.now();
    window.location.href = link.appUrl;
    
    // If still on page after 1.5s, app probably not installed
    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(link.webUrl, '_blank');
      }
    }, 1500);
  } else {
    window.open(link.webUrl, '_blank');
  }
}

// Provider display info
export const PROVIDER_INFO: Record<MusicProvider, { name: string; icon: string; color: string }> = {
  spotify: { name: 'Spotify', icon: '🎵', color: '#1DB954' },
  youtube: { name: 'YouTube', icon: '▶️', color: '#FF0000' },
};
