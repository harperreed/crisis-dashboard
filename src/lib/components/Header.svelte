<!-- ABOUTME: Dashboard header with title, wallet connection, and refresh button -->
<!-- ABOUTME: Displays last updated timestamp and controls -->
<script>
  import { lastUpdated, loadTreasuryData } from '../stores/treasury.js';
  import { formatTimeAgo } from '../utils/formatters.js';
  import WalletConnect from './WalletConnect.svelte';

  let isRefreshing = false;

  async function handleRefresh() {
    isRefreshing = true;
    try {
      await loadTreasuryData();
    } finally {
      isRefreshing = false;
    }
  }
</script>

<header class="border-b-2 border-slate-200 pb-8 mb-8">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="mb-2">Crisis DAO Treasury Dashboard</h1>
      {#if $lastUpdated}
        <p class="text-sm text-slate-500 font-medium">
          <span class="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
          Last updated: {formatTimeAgo($lastUpdated)}
        </p>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <WalletConnect />
      <button
        on:click={handleRefresh}
        disabled={isRefreshing}
        class="btn-secondary"
      >
        {#if isRefreshing}
          <span class="inline-block mr-2">⟳</span>
        {/if}
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </div>
</header>
