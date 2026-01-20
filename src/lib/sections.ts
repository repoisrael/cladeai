/**
 * Section Utilities
 * 
 * Helper functions for working with track sections and timestamps.
 * Provider-agnostic - works with any player that supports seek.
 */

import type { TrackSection, SongSectionType } from '@/types';

/**
 * Convert section start time from milliseconds to seconds (for player APIs)
 */
export function sectionStartSeconds(section: TrackSection): number {
  return Math.floor(section.start_ms / 1000);
}

/**
 * Convert section end time from milliseconds to seconds
 */
export function sectionEndSeconds(section: TrackSection): number {
  return Math.floor(section.end_ms / 1000);
}

/**
 * Get section duration in seconds
 */
export function sectionDurationSeconds(section: TrackSection): number {
  return Math.floor((section.end_ms - section.start_ms) / 1000);
}

/**
 * Format milliseconds as mm:ss
 */
export function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format seconds as mm:ss
 */
export function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get display label for section type
 */
export function getSectionDisplayLabel(label: SongSectionType): string {
  const labels: Record<SongSectionType, string> = {
    intro: 'Intro',
    verse: 'Verse',
    'pre-chorus': 'Pre-Chorus',
    chorus: 'Chorus',
    bridge: 'Bridge',
    outro: 'Outro',
    breakdown: 'Breakdown',
    drop: 'Drop',
  };
  return labels[label] || label;
}

/**
 * Get color class for section type (Tailwind)
 */
export function getSectionColor(label: SongSectionType): string {
  const colors: Record<SongSectionType, string> = {
    intro: 'bg-slate-500',
    verse: 'bg-blue-500',
    'pre-chorus': 'bg-purple-500',
    chorus: 'bg-pink-500',
    bridge: 'bg-amber-500',
    outro: 'bg-slate-500',
    breakdown: 'bg-orange-500',
    drop: 'bg-red-500',
  };
  return colors[label] || 'bg-muted';
}

/**
 * Get gradient color for section (for visual waveforms)
 */
export function getSectionGradient(label: SongSectionType): string {
  const gradients: Record<SongSectionType, string> = {
    intro: 'from-slate-500/50 to-slate-500/20',
    verse: 'from-blue-500/50 to-blue-500/20',
    'pre-chorus': 'from-purple-500/50 to-purple-500/20',
    chorus: 'from-pink-500/50 to-pink-500/20',
    bridge: 'from-amber-500/50 to-amber-500/20',
    outro: 'from-slate-500/50 to-slate-500/20',
    breakdown: 'from-orange-500/50 to-orange-500/20',
    drop: 'from-red-500/50 to-red-500/20',
  };
  return gradients[label] || 'from-muted/50 to-muted/20';
}

/**
 * Calculate section width as percentage of total duration
 */
export function getSectionWidthPercent(section: TrackSection, totalDurationMs: number): number {
  if (totalDurationMs <= 0) return 0;
  return ((section.end_ms - section.start_ms) / totalDurationMs) * 100;
}

/**
 * Calculate section start position as percentage of total duration
 */
export function getSectionStartPercent(section: TrackSection, totalDurationMs: number): number {
  if (totalDurationMs <= 0) return 0;
  return (section.start_ms / totalDurationMs) * 100;
}
