import { motion } from 'framer-motion';
import { ExternalLink, Smartphone, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProviderLinks, openProviderLink, TrackProviderInfo, MusicProvider } from '@/lib/providers';
import { cn } from '@/lib/utils';

interface StreamingLinksProps {
  track: TrackProviderInfo;
  defaultProvider?: MusicProvider | null;
  onSetDefault?: (provider: MusicProvider) => void;
  compact?: boolean;
  className?: string;
}

const providerLogos: Record<string, string> = {
  spotify: '🎵',
  youtube: '▶️',
  apple_music: '🍎',
  deezer: '🎧',
  soundcloud: '☁️',
  amazon_music: '📦',
};

export function StreamingLinks({
  track,
  defaultProvider,
  onSetDefault,
  compact = false,
  className,
}: StreamingLinksProps) {
  const links = getProviderLinks(track);

  if (links.length === 0) {
    return (
      <div className={cn('text-muted-foreground text-sm flex items-center gap-2', className)}>
        <Music className="w-4 h-4" />
        <span>No streaming links available</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {links.map((link) => (
          <motion.button
            key={link.provider}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openProviderLink(link, false)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              'hover:opacity-90',
              defaultProvider === link.provider
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                : ''
            )}
            style={{ backgroundColor: `${link.color}20`, color: link.color }}
          >
            <span className="text-base">{providerLogos[link.provider] || '🎶'}</span>
            <span>{link.name}</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Music className="w-4 h-4" />
        Stream on
      </h4>
      <div className="grid gap-2">
        {links.map((link) => (
          <motion.div
            key={link.provider}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl transition-all',
              'bg-muted/50 hover:bg-muted'
            )}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${link.color}20` }}
            >
              {providerLogos[link.provider] || '🎶'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{link.name}</p>
              {defaultProvider === link.provider && (
                <span className="text-xs text-primary">Default</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {link.appUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openProviderLink(link, true)}
                  title="Open in app"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => openProviderLink(link, false)}
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
