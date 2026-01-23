/**
 * Recommendation Service
 * 
 * Provides personalized track recommendations based on:
 * - User's Taste DNA (chord progressions, modes, energy, tempo)
 * - Global recently played tracks
 * - Collaborative filtering hints
 */

import { Track } from '@/types';
import { TasteDNAProfile } from '@/api/tasteDNA';

interface RecommendationScore {
  track: Track;
  score: number;
  reasons: string[];
}

/**
 * Score a track based on user's taste profile
 */
export function scoreTrackByTaste(track: Track, tasteDNA: TasteDNAProfile | null): RecommendationScore {
  if (!tasteDNA) {
    // No taste data available - return neutral score
    return {
      track,
      score: 0.5,
      reasons: ['New user - exploring catalog'],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  // 1. Chord progression match (40% weight)
  if (track.progression_roman && tasteDNA.favoriteProgressions.length > 0) {
    const trackProgression = track.progression_roman.join('→');
    const matchingProg = tasteDNA.favoriteProgressions.find(
      fp => fp.progression.join('→') === trackProgression
    );
    
    if (matchingProg) {
      const progressionScore = 0.4 * (matchingProg.count / tasteDNA.totalTracksAnalyzed);
      score += progressionScore;
      reasons.push(`Matches your favorite progression: ${matchingProg.progression.join('-')}`);
    }
  }

  // 2. Mode preference match (20% weight)
  if (track.detected_mode && tasteDNA.preferredModes.length > 0) {
    const userModePreference = tasteDNA.preferredModes.find(
      pm => pm.mode === track.detected_mode
    );
    
    if (userModePreference) {
      const modeScore = 0.2 * (userModePreference.percentage / 100);
      score += modeScore;
      reasons.push(`${track.detected_mode} mode (${Math.round(userModePreference.percentage)}% of your taste)`);
    }
  }

  // 3. Energy level match (20% weight)
  if (typeof track.energy === 'number' && typeof tasteDNA.energyPreference === 'number') {
    const energyDiff = Math.abs(track.energy - tasteDNA.energyPreference);
    const energyScore = 0.2 * (1 - energyDiff); // Closer = higher score
    score += energyScore;
    
    if (energyDiff < 0.2) {
      reasons.push('Perfect energy match');
    } else if (energyDiff < 0.4) {
      reasons.push('Good energy match');
    }
  }

  // 4. Tempo match (20% weight)
  if (typeof track.tempo === 'number' && typeof tasteDNA.averageTempo === 'number') {
    const tempoDiff = Math.abs(track.tempo - tasteDNA.averageTempo);
    const tempoScore = 0.2 * Math.max(0, 1 - tempoDiff / 100); // Normalize by 100 BPM
    score += tempoScore;
    
    if (tempoDiff < 15) {
      reasons.push('Similar tempo to your favorites');
    }
  }

  // Normalize score to 0-1 range
  score = Math.max(0, Math.min(1, score));

  // If no reasons were found, add a generic one
  if (reasons.length === 0) {
    reasons.push('Recommended for you');
  }

  return {
    track,
    score,
    reasons,
  };
}

/**
 * Sort and filter tracks based on taste DNA
 */
export function getRecommendedTracks(
  tracks: Track[],
  tasteDNA: TasteDNAProfile | null,
  limit?: number
): Track[] {
  // Score all tracks
  const scoredTracks = tracks.map(track => scoreTrackByTaste(track, tasteDNA));

  // Sort by score (highest first)
  scoredTracks.sort((a, b) => b.score - a.score);

  // Apply limit if specified
  const filtered = limit ? scoredTracks.slice(0, limit) : scoredTracks;

  // Return just the tracks
  return filtered.map(st => st.track);
}

/**
 * Get recommendation explanations for a track
 */
export function getRecommendationReasons(
  track: Track,
  tasteDNA: TasteDNAProfile | null
): string[] {
  return scoreTrackByTaste(track, tasteDNA).reasons;
}
