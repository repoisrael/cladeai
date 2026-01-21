import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, PictureInPicture2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  startTime?: number; // Start time in seconds (legacy prop)
  startSeconds?: number; // Start time in seconds (new prop)
  endTime?: number; // End time in seconds
  onClose?: () => void;
  onPipModeChange?: (isPip: boolean) => void;
  className?: string;
}

export function YouTubeEmbed({ videoId, title, startTime, startSeconds, endTime, onClose, onPipModeChange, className }: YouTubeEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPipMode, setIsPipMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use startSeconds if provided, otherwise fall back to startTime
  const effectiveStartTime = startSeconds !== undefined ? startSeconds : startTime;

  // Build embed URL with parameters for inline playback and timestamps
  const buildEmbedUrl = () => {
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
    });
    
    if (effectiveStartTime !== undefined) {
      params.append('start', Math.floor(effectiveStartTime).toString());
    }
    
    if (endTime !== undefined) {
      params.append('end', Math.floor(endTime).toString());
    }
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };
  
  const embedUrl = buildEmbedUrl();

  const togglePipMode = () => {
    const newPipState = !isPipMode;
    setIsPipMode(newPipState);
    onPipModeChange?.(newPipState);
  };

  const handleClose = () => {
    setIsPipMode(false);
    onPipModeChange?.(false);
    onClose?.();
  };

  // PiP mode renders a fixed mini player in bottom-right
  if (isPipMode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        drag
        dragConstraints={{ left: -300, right: 0, top: -400, bottom: 0 }}
        className="fixed bottom-24 right-4 z-50 w-[280px] aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-border"
        style={{ touchAction: 'none' }}
      >
        {/* Mini control bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/80 to-transparent">
          <span className="text-white text-xs font-medium truncate px-1 max-w-[150px]">{title}</span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={togglePipMode}
              title="Exit mini player"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title || 'YouTube video player'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'relative rounded-xl overflow-hidden bg-black shadow-2xl',
        isExpanded ? 'fixed inset-4 z-50' : 'w-full aspect-video',
        className
      )}
    >
      {/* Control bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-gradient-to-b from-black/60 to-transparent">
        {title && (
          <span className="text-white text-sm font-medium truncate px-2">{title}</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={togglePipMode}
            title="Mini player (keeps playing while you browse)"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* YouTube iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title || 'YouTube video player'}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />

      {/* Backdrop for expanded mode */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/80 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </motion.div>
  );
}
