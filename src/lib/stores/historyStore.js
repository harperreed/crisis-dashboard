// ABOUTME: Svelte store for historical treasury data tracking
// ABOUTME: Manages history index, selected dates, and historical snapshot data
import { writable, derived } from 'svelte/store';

// History index data (list of all available historical dates)
export const historyIndex = writable(null);

// Currently selected historical date (null means viewing current/live data)
export const selectedDate = writable(null);

// Historical snapshot data for the selected date
export const historicalSnapshot = writable(null);

// Loading states
export const isLoadingIndex = writable(false);
export const isLoadingSnapshot = writable(false);

// Error states
export const indexError = writable(null);
export const snapshotError = writable(null);

/**
 * Derived store - true if we're currently viewing historical data
 */
export const isViewingHistory = derived(selectedDate, $date => $date !== null);

/**
 * Derived store - total count of historical snapshots available
 */
export const historyCount = derived(historyIndex, $index => {
  return $index?.dates?.length || 0;
});

/**
 * Load the history index (list of all available dates)
 */
export async function loadHistoryIndex() {
  isLoadingIndex.set(true);
  indexError.set(null);

  try {
    const response = await fetch('/data/history/index.json');
    if (!response.ok) throw new Error('Failed to load history index');

    const data = await response.json();
    historyIndex.set(data);
  } catch (err) {
    indexError.set(err.message);
    console.error('Error loading history index:', err);
  } finally {
    isLoadingIndex.set(false);
  }
}

/**
 * Load a specific historical snapshot by date
 * @param {string} date - ISO date string (YYYY-MM-DD)
 */
export async function loadHistoricalSnapshot(date) {
  if (!date) {
    // Clear historical view - return to live data
    selectedDate.set(null);
    historicalSnapshot.set(null);
    snapshotError.set(null);
    return;
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }

  isLoadingSnapshot.set(true);
  snapshotError.set(null);

  try {
    const response = await fetch(`/data/history/${date}.json`);
    if (!response.ok) throw new Error(`Failed to load snapshot for ${date}`);

    const data = await response.json();
    historicalSnapshot.set(data);
    selectedDate.set(date);
  } catch (err) {
    snapshotError.set(err.message);
    console.error(`Error loading historical snapshot for ${date}:`, err);
  } finally {
    isLoadingSnapshot.set(false);
  }
}

/**
 * Clear historical view and return to live data
 */
export function clearHistoricalView() {
  loadHistoricalSnapshot(null);
}

/**
 * Navigate to the next date in history (newer)
 */
export function goToNextDate() {
  let currentIndex;
  let currentDateVal;

  const unsubIndex = historyIndex.subscribe(value => { currentIndex = value; });
  const unsubDate = selectedDate.subscribe(value => { currentDateVal = value; });

  unsubIndex();
  unsubDate();

  if (!currentIndex?.dates?.length || !currentDateVal) return;

  const idx = currentIndex.dates.findIndex(d => d.date === currentDateVal);
  if (idx < currentIndex.dates.length - 1) {
    loadHistoricalSnapshot(currentIndex.dates[idx + 1].date);
  }
}

/**
 * Navigate to the previous date in history (older)
 */
export function goToPreviousDate() {
  let currentIndex;
  let currentDateVal;

  const unsubIndex = historyIndex.subscribe(value => { currentIndex = value; });
  const unsubDate = selectedDate.subscribe(value => { currentDateVal = value; });

  unsubIndex();
  unsubDate();

  if (!currentIndex?.dates?.length || !currentDateVal) return;

  const idx = currentIndex.dates.findIndex(d => d.date === currentDateVal);
  if (idx > 0) {
    loadHistoricalSnapshot(currentIndex.dates[idx - 1].date);
  }
}
