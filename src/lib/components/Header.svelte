<!-- ABOUTME: Dashboard header with title, currency toggle, and refresh button -->
<!-- ABOUTME: Displays last updated timestamp and controls -->
<script>
  import { lastUpdated, loadTreasuryData } from '../stores/treasury.js';
  import { formatTimeAgo } from '../utils/formatters.js';

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
      <h1>DAO Treasury Dashboard</h1>
      {#if $lastUpdated}
        <p class="text-sm text-gray-500">
          Last updated: {formatTimeAgo($lastUpdated)}
        </p>
      {/if}
    </div>

    <div class="flex items-center gap-4">
      <button
        on:click={handleRefresh}
        disabled={isRefreshing}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </div>
</header>
