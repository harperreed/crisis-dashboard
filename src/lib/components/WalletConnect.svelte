<!-- ABOUTME: Wallet connection button and status display -->
<!-- ABOUTME: Shows connect button or connected address with disconnect option -->
<script>
  import { walletAddress, isConnected, isConnecting, connectWallet, disconnectWallet } from '../stores/wallet.js';
  import { formatAddress } from '../utils/formatters.js';
</script>

<div class="flex items-center gap-2">
  {#if $isConnected}
    <div class="flex items-center gap-3 px-4 py-2 bg-emerald-50 border-2 border-emerald-200 rounded-lg shadow-sm">
      <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      <span class="text-sm font-mono font-semibold text-emerald-900">{formatAddress($walletAddress)}</span>
      <button
        on:click={disconnectWallet}
        class="ml-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium underline transition-colors"
      >
        Disconnect
      </button>
    </div>
  {:else}
    <button
      on:click={connectWallet}
      disabled={$isConnecting}
      class="btn-primary"
    >
      {#if $isConnecting}
        <span class="inline-block mr-2">⟳</span>
      {/if}
      {$isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  {/if}
</div>
