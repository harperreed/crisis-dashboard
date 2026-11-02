<!-- ABOUTME: Root application component, main dashboard container with hash-based routing -->
<!-- ABOUTME: Orchestrates all child components, routing, and loads initial data -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import TreasuryTotal from './lib/components/TreasuryTotal.svelte';
  import UserHoldings from './lib/components/UserHoldings.svelte';
  import Breakdown from './lib/components/Breakdown.svelte';
  import Charts from './lib/components/Charts.svelte';
  import HoldersList from './lib/components/HoldersList.svelte';
  import History from './routes/History.svelte';
  import HistoricalDashboard from './routes/HistoricalDashboard.svelte';
  import { loadTreasuryData, error } from './lib/stores/treasury.js';

  let currentRoute = { route: 'dashboard' };

  /**
   * Parse the current hash to determine which route to display
   * Returns an object with route type and optional date parameter
   */
  function parseHash() {
    const hash = window.location.hash || '#/';
    if (hash === '#/' || hash === '#' || hash === '') {
      return { route: 'dashboard' };
    } else if (hash === '#/history') {
      return { route: 'history' };
    } else if (hash.startsWith('#/history/')) {
      const date = hash.replace('#/history/', '');
      return { route: 'historical', date };
    }
    return { route: 'dashboard' }; // fallback
  }

  /**
   * Handle hash changes and update current route
   */
  function handleHashChange() {
    const newRoute = parseHash();
    // Load treasury data if navigating to dashboard
    if (newRoute.route === 'dashboard' && currentRoute.route !== 'dashboard') {
      loadTreasuryData();
    }
    currentRoute = newRoute;
  }

  onMount(() => {
    // Parse initial route first
    currentRoute = parseHash();

    // Only load treasury data if we're on the dashboard
    if (currentRoute.route === 'dashboard') {
      loadTreasuryData();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
  });

  onDestroy(() => {
    // Clean up hash change listener
    window.removeEventListener('hashchange', handleHashChange);
  });
</script>

{#if currentRoute.route === 'history'}
  <!-- Timeline view showing historical snapshots -->
  <History />
{:else if currentRoute.route === 'historical'}
  <!-- Historical dashboard for a specific date -->
  <HistoricalDashboard date={currentRoute.date} />
{:else}
  <!-- Default: Current dashboard view -->
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
{/if}
