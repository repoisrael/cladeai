/**
 * Persistent YouTube Player Context
 *
 * Manages a global YouTube player that continues playing across navigation
 */

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

interface VideoData {
  videoId: string;
  title: string;
  artist: string;
  startSeconds?: number;
}

interface YouTubePlayerContextValue {
  currentVideo: VideoData | null;
  isPlaying: boolean;
  currentTime: number; // Current playback time in seconds
  duration: number; // Total duration in seconds
  playVideo: (video: VideoData) => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  setIsPlaying: (playing: boolean) => void;
  seekTo: (seconds: number) => void;
  /** Allow external players to set current playback time */
  setCurrentPlaybackTime: (seconds: number) => void;
}

const YouTubePlayerContext = createContext<YouTubePlayerContextValue | null>(null);

export function YouTubePlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number | null>(null);

  // Update current time while playing with elapsed-time based updates to avoid drift
  useEffect(() => {
    if (isPlaying && currentVideo) {
      lastUpdateRef.current = performance.now();
      intervalRef.current = window.setInterval(() => {
        const now = performance.now();
        const last = lastUpdateRef.current ?? now;
        const delta = (now - last) / 1000; // seconds
        lastUpdateRef.current = now;
        setCurrentTime(prev => prev + delta);
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastUpdateRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastUpdateRef.current = null;
    };
  }, [isPlaying, currentVideo]);

  const playVideo = (video: VideoData) => {
    setCurrentVideo(video);
    setIsPlaying(true);
    setCurrentTime(video.startSeconds || 0);
  };

  const pauseVideo = () => {
    setIsPlaying(false);
  };

  const stopVideo = () => {
    setCurrentVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
  };

  // Expose a method to set current time from external players (e.g., iframe onTimeUpdate)
  const setCurrentPlaybackTime = (seconds: number) => {
    setCurrentTime(seconds);
  };

  return (
    <YouTubePlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        currentTime,
        duration,
        playVideo,
        pauseVideo,
        stopVideo,
        setIsPlaying,
        seekTo,
        setCurrentPlaybackTime,
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
