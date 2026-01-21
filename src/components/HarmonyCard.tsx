import { motion } from 'framer-motion';
import { ChordBadge } from './ChordBadge';
import { Music, Key, RotateCcw } from 'lucide-react';

interface HarmonyCardProps {
  progression: string[];
  detectedKey?: string;
  detectedMode?: 'major' | 'minor' | 'unknown';
  cadenceType?: string;
  confidenceScore?: number;
  matchReason?: string;
}

export function HarmonyCard({
  progression,
  detectedKey,
  detectedMode,
  cadenceType,
  confidenceScore,
  matchReason,
}: HarmonyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-4 space-y-3"
    >
      {/* Key signature */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Key className="w-4 h-4" />
          <span className="text-sm font-medium">
            {detectedKey || 'Unknown'} {detectedMode && detectedMode !== 'unknown' ? detectedMode : ''}
          </span>
        </div>
        {cadenceType && cadenceType !== 'none' && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCcw className="w-3 h-3" />
            <span className="capitalize">{cadenceType}</span>
          </div>
        )}
      </div>

      {/* Chord progression */}
      <div className="flex items-center gap-2 flex-wrap">
        <Music className="w-4 h-4 text-primary shrink-0" />
        <div className="flex flex-wrap gap-1.5">
          {progression.map((chord, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <ChordBadge 
                chord={chord} 
                size="md" 
                keySignature={track.detected_key}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Match reason */}
      {matchReason && (
        <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
          {matchReason}
        </p>
      )}

      {/* Confidence indicator */}
      {confidenceScore !== undefined && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidenceScore * 100}%` }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(confidenceScore * 100)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
