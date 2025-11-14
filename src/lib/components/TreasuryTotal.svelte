<!-- ABOUTME: Large display of total treasury value -->
<!-- ABOUTME: Shows value in both ETH and USD, plus token price -->
<script>
  import { totalTreasuryValue, treasuryData, isLoading } from '../stores/treasury.js';
  import { formatUSD, formatETH, formatTokenPrice } from '../utils/formatters.js';
  import { ADDRESSES } from '../../config.js';

  $: ethValue = formatETH($totalTreasuryValue / ($treasuryData?.ethPrice || 1));
  $: usdValue = formatUSD($totalTreasuryValue);

  // Exclude safe addresses from circulating supply calculation
  $: safeHoldings = $treasuryData?.holders?.reduce((total, h) => {
    if (h.address.toLowerCase() === ADDRESSES.mainSafe.toLowerCase() ||
        h.address.toLowerCase() === ADDRESSES.hotSafe.toLowerCase()) {
      return total + h.balance;
    }
    return total;
  }, 0) || 0;

  $: circulatingSupply = ($treasuryData?.totalSupply || 0) - safeHoldings;
  $: tokenPriceUSD = circulatingSupply > 0 ? $totalTreasuryValue / circulatingSupply : 0;
  $: tokenPriceETH = circulatingSupply > 0 ? ($totalTreasuryValue / circulatingSupply) / ($treasuryData?.ethPrice || 1) : 0;

  // Format token prices with appropriate decimals for small values
  $: formattedTokenPriceETH = tokenPriceETH > 0 ? `Ξ ${tokenPriceETH.toFixed(8)}` : 'Ξ 0.00';
  $: formattedTokenPriceUSD = formatTokenPrice(tokenPriceUSD);
</script>

<section class="bg-gray-50 rounded-lg p-6 mb-8">
  <div class="flex items-end justify-between">
    <div class="flex-1">
      <h2 class="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
        Crisis Token Price
      </h2>

      {#if $isLoading}
        <div class="h-12 bg-gray-200 animate-pulse rounded"></div>
      {:else}
        <p class="text-3xl font-bold text-gray-900">
          {formattedTokenPriceETH} / {formattedTokenPriceUSD}
        </p>
      {/if}
    </div>

    <div class="flex-1 text-right">
      <h2 class="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
        Total Treasury Value
      </h2>

      {#if $isLoading}
        <div class="h-12 bg-gray-200 animate-pulse rounded ml-auto"></div>
      {:else}
        <p class="text-3xl font-bold text-gray-900">
          {ethValue} / {usdValue}
        </p>
      {/if}
    </div>
  </div>
</section>
