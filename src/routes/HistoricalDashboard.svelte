<!-- ABOUTME: Historical dashboard view showing treasury snapshot from a past date -->
<!-- ABOUTME: Reuses main dashboard components but populates them with historical data -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import TimeTravelBanner from '../lib/components/TimeTravelBanner.svelte';
  import Header from '../lib/components/Header.svelte';
  import TreasuryTotal from '../lib/components/TreasuryTotal.svelte';
  import Breakdown from '../lib/components/Breakdown.svelte';
  import Charts from '../lib/components/Charts.svelte';
  import HoldersList from '../lib/components/HoldersList.svelte';
  import {
    loadHistoricalSnapshot,
    historicalSnapshot,
    isLoadingSnapshot,
    snapshotError
  } from '../lib/stores/historyStore.js';
  import { treasuryData, isLoading } from '../lib/stores/treasury.js';

  export let date;

  let originalTreasuryData = null;
  let unsubscribeSnapshot;
  let unsubscribeLoading;

  onMount(async () => {
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      snapshotError.set('Invalid date format');
      return;
    }

    // Save the current treasury data
    const unsubscribe = treasuryData.subscribe(value => {
      originalTreasuryData = value;
    });
    unsubscribe();

    // Load the historical snapshot
    await loadHistoricalSnapshot(date);

    // Subscribe to historical snapshot and populate treasury store
    unsubscribeSnapshot = historicalSnapshot.subscribe(snapshot => {
      if (snapshot) {
        treasuryData.set(snapshot);
        isLoading.set(false);
      }
    });

    // Subscribe to loading state
    unsubscribeLoading = isLoadingSnapshot.subscribe(loading => {
      isLoading.set(loading);
    });
  });

  onDestroy(() => {
    // Clean up subscriptions
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    if (unsubscribeLoading) unsubscribeLoading();

    // Restore original treasury data when leaving historical view
    if (originalTreasuryData) {
      treasuryData.set(originalTreasuryData);
      isLoading.set(false);
    }
  });
</script>

<TimeTravelBanner />
<Header />

<div class="container mx-auto px-4 py-8 max-w-6xl">
  {#if $snapshotError}
    <div class="alert-error mb-8">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <p class="font-semibold">{$snapshotError}</p>
          <p class="text-sm text-red-600 mt-1">
            Unable to load historical data for this date.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <TreasuryTotal />
  <!-- UserHoldings intentionally omitted - not relevant for historical view -->
  <Breakdown />
  <Charts />
  <HoldersList />
</div>
