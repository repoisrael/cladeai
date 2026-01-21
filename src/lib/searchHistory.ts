/**
 * Search History Utility
 * 
 * Manages search history in localStorage
 */

import { Track } from '@/types';

const HISTORY_KEY = 'clade_search_history';
const MAX_HISTORY_ITEMS = 20;

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'song' | 'chord';
  track?: Track; // Store track if it was a song search result
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    
    const history: SearchHistoryItem[] = JSON.parse(stored);
    // Sort by most recent first
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
}

export function addToSearchHistory(item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) {
  try {
    const history = getSearchHistory();
    
    // Don't add duplicate queries (same query and type within last 5 items)
    const isDuplicate = history.slice(0, 5).some(
      h => h.query.toLowerCase() === item.query.toLowerCase() && h.type === item.type
    );
    
    if (isDuplicate) return;
    
    const newItem: SearchHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    
    // Add to beginning and limit size
    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

export function removeFromHistory(id: string) {
  try {
    const history = getSearchHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from search history:', error);
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}
