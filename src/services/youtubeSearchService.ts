/**
 * YouTube Search Service
 * 
 * Automatically search for music videos on YouTube
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchResult {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
    };
  }>;
}

export interface VideoResult {
  videoId: string;
  title: string;
  channel: string;
  type: 'official' | 'cover' | 'live' | 'lyric' | 'audio';
}

/**
 * Search YouTube for a song
 * Returns multiple video types: official, covers, live performances, etc.
 */
export async function searchYouTubeVideos(
  artist: string,
  title: string
): Promise<VideoResult[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return [];
  }

  try {
    const results: VideoResult[] = [];
    
    // Search 1: Official video/audio
    const officialQuery = `${artist} ${title} official`;
    const officialResults = await searchYouTube(officialQuery, apiKey, 3);
    results.push(...officialResults.map(r => ({ ...r, type: 'official' as const })));
    
    // Search 2: Live performances
    const liveQuery = `${artist} ${title} live`;
    const liveResults = await searchYouTube(liveQuery, apiKey, 2);
    results.push(...liveResults.map(r => ({ ...r, type: 'live' as const })));
    
    // Search 3: Covers
    const coverQuery = `${title} cover`;
    const coverResults = await searchYouTube(coverQuery, apiKey, 2);
    results.push(...coverResults.map(r => ({ ...r, type: 'cover' as const })));
    
    // Remove duplicates by videoId
    const unique = results.filter((v, i, arr) => 
      arr.findIndex(x => x.videoId === v.videoId) === i
    );
    
    return unique;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

/**
 * Search YouTube API
 */
async function searchYouTube(
  query: string,
  apiKey: string,
  maxResults: number
): Promise<Omit<VideoResult, 'type'>[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '10', // Music category
    maxResults: maxResults.toString(),
    key: apiKey,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
  
  if (!response.ok) {
    console.error('YouTube API error:', response.status);
    return [];
  }

  const data: YouTubeSearchResult = await response.json();
  
  return data.items.map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
  }));
}
