<!-- ABOUTME: Wallet connection button and status display -->
<!-- ABOUTME: Shows connect button or connected address with disconnect option -->
<script>
  import { walletAddress, isConnected, isConnecting, connectWallet, disconnectWallet } from '../stores/wallet.js';
  import { formatAddress } from '../utils/formatters.js';
</script>

<div class="flex items-center gap-2">
  {#if $isConnected}
    <div class="flex items-center gap-3 px-4 py-3 bg-emerald-900/20 border-2 border-emerald-400/50 rounded-none shadow-lg backdrop-blur-sm">
      <span class="success-dot"></span>
      <span class="text-sm font-mono font-bold text-emerald-300 tracking-wider">{formatAddress($walletAddress)}</span>
      <button
        on:click={disconnectWallet}
        class="ml-2 px-2 py-1 text-xs text-emerald-300 hover:text-white border border-emerald-400/50 hover:border-emerald-300 rounded-none font-bold uppercase tracking-wider transition-all"
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
        <span class="inline-block mr-2 animate-spin">⟳</span>
      {/if}
      {$isConnecting ? 'Connecting' : 'Connect Wallet'}
    </button>
  {/if}
</div>
