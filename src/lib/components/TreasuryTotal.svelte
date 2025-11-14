<!-- ABOUTME: Large display of total treasury value -->
<!-- ABOUTME: Shows value in both ETH and USD -->
<script>
  import { totalTreasuryValue, treasuryData, isLoading } from '../stores/treasury.js';
  import { formatUSD, formatETH } from '../utils/formatters.js';

  $: ethValue = formatETH($totalTreasuryValue / ($treasuryData?.ethPrice || 1));
  $: usdValue = formatUSD($totalTreasuryValue);
</script>

<section class="bg-gray-50 rounded-lg p-6 mb-8">
  <h2 class="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
    Total Treasury Value
  </h2>

  {#if $isLoading}
    <div class="h-16 bg-gray-200 animate-pulse rounded"></div>
  {:else}
    <p class="text-5xl font-bold text-gray-900">
      {ethValue} / {usdValue}
    </p>
  {/if}
</section>
