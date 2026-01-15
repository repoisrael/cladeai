import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProviderPicker } from './ProviderPicker';
import { 
  TrackProviderInfo, 
  MusicProvider, 
  getProviderLinks, 
  openProviderLink 
} from '@/lib/providers';

interface PlayButtonProps {
  track: TrackProviderInfo & { title: string; artist: string };
  defaultProvider?: MusicProvider | null;
  onSetDefault?: (provider: MusicProvider) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayButton({ 
  track, 
  defaultProvider, 
  onSetDefault,
  size = 'md',
  className = ''
}: PlayButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const links = getProviderLinks(track);
  const hasDefault = defaultProvider && links.some(l => l.provider === defaultProvider);

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handlePlay = () => {
    if (hasDefault) {
      const defaultLink = links.find(l => l.provider === defaultProvider);
      if (defaultLink) {
        openProviderLink(defaultLink, true);
        return;
      }
    }
    setShowPicker(true);
  };

  const handleLongPress = () => {
    setShowPicker(true);
  };

  if (links.length === 0) {
    return (
      <Button 
        disabled 
        variant="secondary" 
        className={`${sizeClasses[size]} ${className}`}
      >
        <Play className={iconSizes[size]} />
        <span className="ml-2">Unavailable</span>
      </Button>
    );
  }

  return (
    <>
      <motion.div 
        className={`inline-flex ${className}`}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handlePlay}
          onContextMenu={(e) => {
            e.preventDefault();
            handleLongPress();
          }}
          className={`${sizeClasses[size]} rounded-r-none bg-primary hover:bg-primary/90`}
        >
          <Play className={`${iconSizes[size]} fill-current`} />
          <span className="ml-2">Play</span>
          {hasDefault && (
            <span className="ml-1 text-xs opacity-70">
              ({defaultProvider === 'spotify' ? '🎵' : '▶️'})
            </span>
          )}
        </Button>
        <Button
          onClick={() => setShowPicker(true)}
          variant="secondary"
          className={`${sizeClasses[size]} rounded-l-none border-l border-primary/20 px-2`}
        >
          <ChevronDown className={iconSizes[size]} />
        </Button>
      </motion.div>

      <ProviderPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        track={track}
        defaultProvider={defaultProvider}
        onSetDefault={onSetDefault}
      />
    </>
  );
}
