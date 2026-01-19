import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  onClose?: () => void;
  className?: string;
}

export function YouTubeEmbed({ videoId, title, onClose, className }: YouTubeEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build embed URL with parameters for inline playback
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

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
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* YouTube iframe - allow attribute ensures playback without blur/focus issues */}
      <iframe
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
