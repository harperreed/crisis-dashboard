<!-- ABOUTME: Wallet connection button and status display -->
<!-- ABOUTME: Shows connect button or connected address with disconnect option -->
<script>
  import { walletAddress, isConnected, isConnecting, connectWallet, disconnectWallet } from '../stores/wallet.js';
  import { formatAddress } from '../utils/formatters.js';
</script>

<div class="flex items-center gap-2">
  {#if $isConnected}
    <div class="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
      <span class="text-sm font-mono text-green-900">{formatAddress($walletAddress)}</span>
      <button
        on:click={disconnectWallet}
        class="ml-2 text-xs text-green-700 hover:text-green-900 underline"
      >
        Disconnect
      </button>
    </div>
  {:else}
    <button
      on:click={connectWallet}
      disabled={$isConnecting}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {$isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  {/if}
</div>
