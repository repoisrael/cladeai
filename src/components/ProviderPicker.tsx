import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Smartphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  ProviderLink, 
  getProviderLinks, 
  openProviderLink, 
  TrackProviderInfo,
  MusicProvider 
} from '@/lib/providers';

interface ProviderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  track: TrackProviderInfo & { title: string; artist: string };
  defaultProvider?: MusicProvider | null;
  onSetDefault?: (provider: MusicProvider) => void;
}

export function ProviderPicker({ 
  isOpen, 
  onClose, 
  track, 
  defaultProvider,
  onSetDefault 
}: ProviderPickerProps) {
  const [selectedProvider, setSelectedProvider] = useState<MusicProvider | null>(null);
  const links = getProviderLinks(track);

  const handleProviderClick = (link: ProviderLink, openInApp: boolean) => {
    openProviderLink(link, openInApp);
    onClose();
  };

  const handleSetDefault = (provider: MusicProvider) => {
    setSelectedProvider(provider);
    onSetDefault?.(provider);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Play with</h3>
                  <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                    {track.title} • {track.artist}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Provider List */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[50vh]">
              {links.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No streaming links available for this track
                </p>
              ) : (
                links.map((link) => (
                  <div
                    key={link.provider}
                    className="bg-muted/50 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${link.color}20` }}
                        >
                          {link.icon}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{link.name}</p>
                          {defaultProvider === link.provider && (
                            <span className="text-xs text-primary">Default</span>
                          )}
                        </div>
                      </div>
                      
                      {defaultProvider !== link.provider && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleSetDefault(link.provider)}
                        >
                          Set default
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {link.appUrl && (
                        <Button
                          variant="secondary"
                          className="flex-1 gap-2"
                          onClick={() => handleProviderClick(link, true)}
                        >
                          <Smartphone className="w-4 h-4" />
                          Open App
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => handleProviderClick(link, false)}
                      >
                        <Globe className="w-4 h-4" />
                        Open Web
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <p className="text-xs text-center text-muted-foreground">
                Tip: Set a default provider and tap Play for one-tap playback
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
