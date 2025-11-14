<!-- ABOUTME: Root application component, main dashboard container -->
<!-- ABOUTME: Orchestrates all child components and loads initial data -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import TreasuryTotal from './lib/components/TreasuryTotal.svelte';
  import UserHoldings from './lib/components/UserHoldings.svelte';
  import Breakdown from './lib/components/Breakdown.svelte';
  import Charts from './lib/components/Charts.svelte';
  import HoldersList from './lib/components/HoldersList.svelte';
  import { loadTreasuryData, error } from './lib/stores/treasury.js';

  let midnightTimer = null;

  // Calculate milliseconds until next midnight
  function getMillisecondsUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }

  // Schedule refresh at midnight
  function scheduleMidnightRefresh() {
    const msUntilMidnight = getMillisecondsUntilMidnight();

    midnightTimer = setTimeout(async () => {
      console.log('Midnight refresh triggered');
      await loadTreasuryData();
      // Schedule the next midnight refresh
      scheduleMidnightRefresh();
    }, msUntilMidnight);

    console.log(`Next treasury refresh scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  }

  onMount(() => {
    // Load data immediately
    loadTreasuryData();

    // Schedule automatic midnight refresh
    scheduleMidnightRefresh();
  });

  onDestroy(() => {
    // Clean up timer on component unmount
    if (midnightTimer) {
      clearTimeout(midnightTimer);
      midnightTimer = null;
    }
  });
</script>

<Header />

<div class="container mx-auto px-4 py-8 max-w-6xl">
  {#if $error}
    <div class="alert-error mb-8">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <p class="font-semibold">{$error}</p>
          <p class="text-sm text-red-600 mt-1">
            Using cached data or unable to load treasury information.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <TreasuryTotal />
  <UserHoldings />
  <Breakdown />
  <Charts />
  <HoldersList />
</div>
