// ABOUTME: LocalStorage cache management utilities
// ABOUTME: Handles persistent storage of treasury data with expiration
import { CACHE_DURATION } from '../../config.js';

const CACHE_KEY = 'treasury_cache';

/**
 * Save data to localStorage cache
 */
export function saveToCache(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Failed to save to cache:', err);
  }
}

/**
 * Load data from localStorage cache
 */
export function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > CACHE_DURATION) {
      clearCache();
      return null;
    }

    return { data, timestamp };
  } catch (err) {
    console.error('Failed to load from cache:', err);
    return null;
  }
}

/**
 * Clear localStorage cache
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.error('Failed to clear cache:', err);
  }
}

/**
 * Check if cache is stale
 */
export function isCacheStale() {
  const cached = loadFromCache();
  return !cached;
}
