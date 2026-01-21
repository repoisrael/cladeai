/**
 * Track Detail Page
 * 
 * Comprehensive track view with:
 * - Song sections (intro, verse, chorus, bridge)
 * - Hooktheory chord data
 * - WhoSampled connections
 * - Multiple YouTube videos in PiP
 * - Auto-start from intro timestamp
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrack } from '@/hooks/api/useTracks';
import { useYouTubePlayer } from '@/contexts/YouTubePlayerContext';
import { BottomNav } from '@/components/BottomNav';
import { ChordBadge } from '@/components/ChordBadge';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { getTrackSections } from '@/api/trackSections';
import { searchYouTubeVideos, VideoResult } from '@/services/youtubeSearchService';
import { TrackSection, Track } from '@/types';
import { ArrowLeft, Play, Music2, Link as LinkIcon, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VideoSource {
  id: string;
  videoId: string;
  title: string;
  type: 'official' | 'cover' | 'live' | 'instrumental' | 'lyric' | 'audio';
}

export default function TrackDetailPage() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { data: track, isLoading } = useTrack(decodeURIComponent(trackId || ''));
  const { playVideo, currentVideo } = useYouTubePlayer();
  
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [hooktheoryData, setHooktheoryData] = useState<any>(null);
  const [whoSampledData, setWhoSampledData] = useState<any>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<VideoSource[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  
  // Load sections when track is available
  useEffect(() => {
    if (!track?.id) return;
    
    loadSections();
    loadHooktheoryData();
    loadWhoSampledData();
    loadYouTubeVideos();
  }, [track?.id]);

  async function loadYouTubeVideos() {
    if (!track?.artist || !track?.title) return;
    
    setLoadingVideos(true);
    try {
      const results = await searchYouTubeVideos(track.artist, track.title);
      const videos: VideoSource[] = results.map(r => ({
        id: r.videoId,
        videoId: r.videoId,
        title: r.title,
        type: r.type,
      }));
      setYoutubeVideos(videos);
      
      // Auto-play first video using persistent player
      if (videos.length > 0 && track.artist && track.title) {
        const firstVideo = videos[0];
        setActiveVideoId(firstVideo.videoId);
        playVideo({
          videoId: firstVideo.videoId,
          title: track.title,
          artist: track.artist,
          startSeconds: 0,
        });
      }
    } catch (err) {
      console.error('Failed to load YouTube videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  }

  async function loadSections() {
    if (!track?.id) return;
    
    try {
      const data = await getTrackSections(track.id);
      setSections(data);
      
      // If no sections in DB, generate default ones from track duration
      if (data.length === 0 && track.duration_ms) {
        setSections(generateDefaultSections(track));
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
      // Generate default sections on error
      if (track.duration_ms) {
        setSections(generateDefaultSections(track));
      }
    }
  }

  async function loadHooktheoryData() {
    if (!track?.title || !track?.artist) return;
    
    try {
      // TODO: Integrate with actual Hooktheory API
      // For now, use track's existing chord data
      if (track.progression_roman) {
        setHooktheoryData({
          chords: track.progression_roman,
          key: track.detected_key,
          mode: track.detected_mode,
          source: 'local',
        });
      }
    } catch (err) {
      console.error('Failed to load Hooktheory data:', err);
    }
  }

  async function loadWhoSampledData() {
    if (!track?.title || !track?.artist) return;
    
    try {
      // TODO: Integrate with actual WhoSampled API
      // For now, return mock data
      setWhoSampledData({
        samples: [],
        sampledBy: [],
        covers: [],
        source: 'local',
      });
    } catch (err) {
      console.error('Failed to load WhoSampled data:', err);
    }
  }

  function generateDefaultSections(track: Track): TrackSection[] {
    const durationMs = track.duration_ms || 180000; // Default 3 minutes
    
    // Generate typical song structure
    return [
      {
        id: `${track.id}-intro`,
        track_id: track.id,
        label: 'intro',
        start_ms: 0,
        end_ms: Math.floor(durationMs * 0.08), // ~8%
        created_at: new Date().toISOString(),
      },
      {
        id: `${track.id}-verse1`,
        track_id: track.id,
        label: 'verse',
        start_ms: Math.floor(durationMs * 0.08),
        end_ms: Math.floor(durationMs * 0.3), // ~22%
        created_at: new Date().toISOString(),
      },
      {
        id: `${track.id}-chorus1`,
        track_id: track.id,
        label: 'chorus',
        start_ms: Math.floor(durationMs * 0.3),
        end_ms: Math.floor(durationMs * 0.45), // ~15%
        created_at: new Date().toISOString(),
      },
      {
        id: `${track.id}-verse2`,
        track_id: track.id,
        label: 'verse',
        start_ms: Math.floor(durationMs * 0.45),
        end_ms: Math.floor(durationMs * 0.6), // ~15%
        created_at: new Date().toISOString(),
      },
      {
        id: `${track.id}-chorus2`,
        track_id: track.id,
        label: 'chorus',
        start_ms: Math.floor(durationMs * 0.6),
        end_ms: Math.floor(durationMs * 0.75), // ~15%
        created_at: new Date().toISOString(),
      },
      {
        id: `${track.id}-bridge`,
        track_id: track.id,
        label: 'bridge',
        start_ms: Math.floor(durationMs * 0.75),
        end_ms: Math.floor(durationMs * 0.85), // ~10%
        created_at: new Date().toISOString(),
      },
      {
        id: `${track.id}-outro`,
        track_id: track.id,
        label: 'outro',
        start_ms: Math.floor(durationMs * 0.85),
        end_ms: durationMs, // ~15%
        created_at: new Date().toISOString(),
      },
    ];
  }

  function handleSectionClick(section: TrackSection) {
    if (!activeVideoId || !track?.artist || !track?.title) return;
    
    const startSeconds = Math.floor(section.start_ms / 1000);
    playVideo({
      videoId: activeVideoId,
      title: track.title,
      artist: track.artist,
      startSeconds,
    });
  }

  function handlePlayVideo(video: VideoSource) {
    if (!track?.artist || !track?.title) return;
    
    setActiveVideoId(video.videoId);
    playVideo({
      videoId: video.videoId,
      title: track.title,
      artist: track.artist,
      startSeconds: 0,
    });
  }

  // Use YouTube search results, or fallback to track's youtube_id if available
  const videoSources: VideoSource[] = youtubeVideos.length > 0 
    ? youtubeVideos
    : track?.youtube_id 
    ? [{
        id: 'official',
        videoId: track.youtube_id,
        title: `${track.title} - Official`,
        type: 'official',
      }]
    : [];

  if (isLoading || !track) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music2 className="w-12 h-12 text-muted-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading track...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong safe-top">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{track.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Track Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          {track.cover_url && (
            <img
              src={track.cover_url}
              alt={track.title}
              className="w-32 h-32 rounded-lg object-cover flex-shrink-0 shadow-lg"
            />
          )}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-bold">{track.title}</h2>
              <p className="text-lg text-muted-foreground">{track.artist}</p>
              {track.album && (
                <p className="text-sm text-muted-foreground">{track.album}</p>
              )}
            </div>
            
            {track.detected_key && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Key:</span>
                <span className="font-medium">
                  {track.detected_key} {track.detected_mode}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Embedded YouTube Player */}
        {currentVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${
                  currentVideo.startSeconds ? `&start=${currentVideo.startSeconds}` : ''
                }`}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="chords">Chords</TabsTrigger>
            <TabsTrigger value="samples">Samples</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-3">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Song Structure
              </h3>
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section)}
                    className="w-full p-3 glass rounded-lg text-left hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize flex items-center gap-2">
                          {section.label}
                          <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(section.start_ms)} - {formatTime(section.end_ms)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(section.end_ms - section.start_ms)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Chords Tab */}
          <TabsContent value="chords" className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Chord Progression
                </h3>
                {hooktheoryData?.source === 'local' && (
                  <span className="text-xs text-muted-foreground">Local data</span>
                )}
              </div>
              {track.progression_roman && track.progression_roman.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {track.progression_roman.map((chord, i) => (
                      <ChordBadge 
                        key={i} 
                        chord={chord} 
                        keySignature={track.detected_key}
                      />
                    ))}
                  </div>
                  {track.detected_key && (
                    <p className="text-sm text-muted-foreground">
                      Key: {track.detected_key} {track.detected_mode}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No chord data available
                </p>
              )}
            </Card>
          </TabsContent>

          {/* Samples Tab */}
          <TabsContent value="samples" className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Sample Connections
                </h3>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  WhoSampled
                </Button>
              </div>
              <div className="text-center py-8">
                <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No sample data available yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  WhoSampled integration coming soon
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-3">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Available Videos
              </h3>
              <div className="space-y-2">
                {loadingVideos ? (
                  <div className="text-center py-8">
                    <Music2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-muted-foreground">
                      Searching YouTube...
                    </p>
                  </div>
                ) : (
                  <>
                    {videoSources.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => handlePlayVideo(video)}
                        className="w-full p-3 glass rounded-lg text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                      >
                        <Play className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{video.title}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {video.type}
                          </div>
                        </div>
                        {activeVideoId === video.videoId && (
                          <span className="text-xs text-primary">Playing</span>
                        )}
                      </button>
                    ))}
                    {videoSources.length === 0 && (
                      <div className="text-center py-8">
                        <Music2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No videos available
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}
