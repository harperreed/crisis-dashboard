<!-- ABOUTME: Dashboard header with title and wallet connection -->
<!-- ABOUTME: Displays last updated timestamp, ETH price, and wallet controls -->
<script>
  import { lastUpdated, treasuryData } from '../stores/treasury.js';
  import { formatTimeAgo } from '../utils/formatters.js';
  import WalletConnect from './WalletConnect.svelte';
</script>

<style>
  .nav-link {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .nav-link:hover {
    color: var(--navy-dark);
  }

  .nav-link:active {
    opacity: 0.8;
  }
</style>

<header class="w-full bg-gradient-to-b from-cream to-stone border-b border-slate-border">
  <div class="container mx-auto">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 py-8">
      <div>
        <h1 class="mb-3">Crisis DAO Treasury Dashboard</h1>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          {#if $lastUpdated}
            <p class="subtitle flex items-center gap-2">
              <span class="status-dot"></span>
              Last updated {formatTimeAgo($lastUpdated)}
            </p>
          {/if}
          {#if $treasuryData?.ethPrice}
            <p class="subtitle flex items-center gap-2">
              <span class="text-gold">ETH</span>
              <span class="font-mono font-semibold text-navy-dark">${$treasuryData.ethPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          {/if}
          <button
            on:click={() => { window.location.hash = '#/history'; }}
            class="nav-link subtitle flex items-center gap-2 hover:text-navy-dark transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>View History</span>
          </button>
        </div>
      </div>

      <div class="flex items-center">
        <WalletConnect />
      </div>
    </div>
    <div class="divider-gold mb-0"></div>
  </div>
</header>
