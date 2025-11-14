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

<header class="border-b-4 border-red-600/30 pb-8 mb-12">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
    <div>
      <h1 class="mb-4">Crisis DAO Treasury Dashboard</h1>
      {#if $lastUpdated}
        <p class="text-sm font-mono font-medium text-yellow-200/80 tracking-wide">
          <span class="success-dot mr-3"></span>
          LAST UPDATED: {formatTimeAgo($lastUpdated).toUpperCase()}
        </p>
      {/if}
    </div>

    <div class="flex items-center gap-4">
      <WalletConnect />
      <button
        on:click={handleRefresh}
        disabled={isRefreshing}
        class="btn-secondary"
      >
        {#if isRefreshing}
          <span class="inline-block mr-2 animate-spin">⟳</span>
        {/if}
        {isRefreshing ? 'Refreshing' : 'Refresh'}
      </button>
    </div>
  </div>
</header>
