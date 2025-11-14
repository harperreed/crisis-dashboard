// ABOUTME: Svelte store for ETH/USD currency toggle state
// ABOUTME: Manages global currency display preference
import { writable } from 'svelte/store';

export const currency = writable('USD'); // 'USD' or 'ETH'

export function toggleCurrency() {
  currency.update(current => current === 'USD' ? 'ETH' : 'USD');
}
