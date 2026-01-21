/**
 * Persistent YouTube Player Context
 * 
 * Manages a global YouTube player that continues playing across navigation
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoData {
  videoId: string;
  title: string;
  artist: string;
  startSeconds?: number;
}

interface YouTubePlayerContextValue {
  currentVideo: VideoData | null;
  isPlaying: boolean;
  playVideo: (video: VideoData) => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  setIsPlaying: (playing: boolean) => void;
}

const YouTubePlayerContext = createContext<YouTubePlayerContextValue | null>(null);

export function YouTubePlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = (video: VideoData) => {
    setCurrentVideo(video);
    setIsPlaying(true);
  };

  const pauseVideo = () => {
    setIsPlaying(false);
  };

  const stopVideo = () => {
    setCurrentVideo(null);
    setIsPlaying(false);
  };

  return (
    <YouTubePlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        playVideo,
        pauseVideo,
        stopVideo,
        setIsPlaying,
      }}
    >
      {children}
    </YouTubePlayerContext.Provider>
  );
}

export function useYouTubePlayer() {
  const context = useContext(YouTubePlayerContext);
  if (!context) {
    throw new Error('useYouTubePlayer must be used within YouTubePlayerProvider');
  }
  return context;
}
