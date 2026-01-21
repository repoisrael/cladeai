import { cn } from '@/lib/utils';
import { ROMAN_NUMERALS } from '@/types';

interface ChordBadgeProps {
  chord: string;
  keySignature?: string; // e.g., "C", "D", "F#"
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Convert roman numeral to actual chord letter
 */
function romanToChordLetter(roman: string, key: string = 'C'): string {
  const isMinorChord = roman === roman.toLowerCase();
  const baseRoman = roman.toUpperCase().replace(/[^IVX]/g, '');
  
  // Scale degrees from root
  const majorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const romanMap: Record<string, number> = {
    'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6
  };
  
  const keyIndex = majorScale.indexOf(key.charAt(0).toUpperCase());
  if (keyIndex === -1) return roman; // Invalid key
  
  const degree = romanMap[baseRoman];
  if (degree === undefined) return roman; // Invalid roman numeral
  
  const chordRootIndex = (keyIndex + degree) % 7;
  const chordRoot = majorScale[chordRootIndex];
  
  return isMinorChord ? `${chordRoot}m` : chordRoot;
}

export function ChordBadge({ chord, keySignature, size = 'md', className }: ChordBadgeProps) {
  const config = ROMAN_NUMERALS[chord as keyof typeof ROMAN_NUMERALS];
  const chordLetter = keySignature ? romanToChordLetter(chord, keySignature) : null;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex flex-col items-center justify-center font-mono font-semibold rounded-lg border transition-all duration-200',
        sizeClasses[size],
        config?.class || 'chord-i',
        className
      )}
    >
      <span className="leading-tight">{config?.label || chord}</span>
      {chordLetter && (
        <span className="text-[0.65em] opacity-60 leading-tight mt-0.5">
          {chordLetter}
        </span>
      )}
    </span>
  );
}
