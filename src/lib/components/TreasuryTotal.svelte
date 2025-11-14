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

<section class="card-gradient mb-8 p-8">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div class="space-y-2">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
        🔥 Crisis Token Price
      </h3>

      {#if $isLoading}
        <div class="h-14 bg-slate-200 animate-pulse rounded-lg"></div>
      {:else}
        <div class="space-y-1">
          <p class="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {formattedTokenPriceUSD}
          </p>
          <p class="text-2xl font-semibold text-slate-600">
            {formattedTokenPriceETH}
          </p>
        </div>
      {/if}
    </div>

    <div class="space-y-2 md:text-right">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
        💰 Total Treasury Value
      </h3>

      {#if $isLoading}
        <div class="h-14 bg-slate-200 animate-pulse rounded-lg md:ml-auto"></div>
      {:else}
        <div class="space-y-1">
          <p class="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {usdValue}
          </p>
          <p class="text-2xl font-semibold text-slate-600">
            {ethValue}
          </p>
        </div>
      {/if}
    </div>
  </div>
</section>
