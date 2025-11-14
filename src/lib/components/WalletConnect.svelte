<!-- ABOUTME: Wallet connection button and status display -->
<!-- ABOUTME: Shows connect button or connected address with disconnect option -->
<script>
  import { walletAddress, isConnected, isConnecting, connectWallet, disconnectWallet } from '../stores/wallet.js';
  import { formatAddress } from '../utils/formatters.js';
</script>

<div class="flex items-center gap-2">
  {#if $isConnected}
    <div class="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/80 border border-emerald-200/60 rounded-xl shadow-sm backdrop-blur-sm">
      <span class="status-dot"></span>
      <span class="text-sm font-mono font-semibold text-emerald-900">{formatAddress($walletAddress)}</span>
      <button
        on:click={disconnectWallet}
        class="ml-2 px-2 py-1 text-xs text-slate-600 border border-slate-300 rounded-md font-medium transition-all hover:text-navy-dark hover:border-gold"
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
