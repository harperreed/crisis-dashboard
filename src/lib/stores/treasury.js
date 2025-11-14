// ABOUTME: Svelte store for treasury data and loading state
// ABOUTME: Central state management for all dashboard data
import { writable, derived } from 'svelte/store';
import { sum } from '../utils/calculations.js';

export const treasuryData = writable(null);
export const isLoading = writable(true);
export const lastUpdated = writable(null);
export const error = writable(null);

/**
 * Derived store for total treasury value
 */
export const totalTreasuryValue = derived(treasuryData, $data => {
  if (!$data) return 0;

  const ethValue = $data.ethBalance * $data.ethPrice;
  const stablecoinsValue = sum(Object.values($data.stablecoins || {}));
  const tokensValue = sum($data.tokens?.map(t => t.balance * t.price) || []);
  const nftsValue = sum($data.nfts?.map(n => n.quantity * n.floorPrice) || []);

  return ethValue + stablecoinsValue + tokensValue + nftsValue;
});

/**
 * Load treasury data from snapshot or cache
 */
export async function loadTreasuryData() {
  isLoading.set(true);
  error.set(null);

  try {
    const response = await fetch('/data/treasury-snapshot.json');
    if (!response.ok) throw new Error('Failed to load treasury data');

    const data = await response.json();
    treasuryData.set(data);
    lastUpdated.set(data.timestamp);
  } catch (err) {
    error.set(err.message);
    console.error('Error loading treasury data:', err);
  } finally {
    isLoading.set(false);
  }
}
