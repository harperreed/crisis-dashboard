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

<header class="border-b border-gray-200 pb-6 mb-8">
  <div class="flex items-center justify-between">
    <div>
      <h1>Crisis DAO Treasury Dashboard</h1>
      {#if $lastUpdated}
        <p class="text-sm text-gray-500">
          Last updated: {formatTimeAgo($lastUpdated)}
        </p>
      {/if}
    </div>

    <div class="flex items-center gap-4">
      <WalletConnect />
      <button
        on:click={handleRefresh}
        disabled={isRefreshing}
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </div>
</header>
