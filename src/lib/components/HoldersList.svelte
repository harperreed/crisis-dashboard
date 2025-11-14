<!-- ABOUTME: Table showing all token holders and their shares -->
<!-- ABOUTME: Displays address, token count, percentage, share value, and PnL -->
<script>
  import { treasuryData, totalTreasuryValue, isLoading } from '../stores/treasury.js';
  import { formatAddress, formatUSD, formatETH, formatPercent, formatCompact } from '../utils/formatters.js';
  import { calculateSharePercent, calculateShareValue, calculateBuyInETH } from '../utils/calculations.js';
  import { ADDRESSES, BUY_IN_ETH_PRICE } from '../../config.js';

  let showAll = false;

  // Exclude safe addresses from holder calculations
  $: filteredHolders = $treasuryData?.holders?.filter(h =>
    h.address.toLowerCase() !== ADDRESSES.mainSafe.toLowerCase() &&
    h.address.toLowerCase() !== ADDRESSES.hotSafe.toLowerCase()
  ) || [];

  // Calculate circulating supply (excluding safe addresses)
  $: safeHoldings = $treasuryData?.holders?.reduce((total, h) => {
    if (h.address.toLowerCase() === ADDRESSES.mainSafe.toLowerCase() ||
        h.address.toLowerCase() === ADDRESSES.hotSafe.toLowerCase()) {
      return total + h.balance;
    }
    return total;
  }, 0) || 0;

  $: circulatingSupply = ($treasuryData?.totalSupply || 0) - safeHoldings;

  function getEtherscanAddressLink(address) {
    return `https://etherscan.io/address/${address}`;
  }
</script>

<section class="bg-white border border-gray-200 rounded-lg p-6">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="mb-1">📋 All Holders</h2>
      <p class="text-sm text-gray-500">
        Buy-in Rate: 1M tokens per 1 ETH @ ${BUY_IN_ETH_PRICE.toFixed(2)} USD/ETH
      </p>
    </div>
    {#if filteredHolders.length > 10}
      <button
        on:click={() => showAll = !showAll}
        class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
      >
        {showAll ? `Show Top 10` : `Show All (${filteredHolders.length})`}
      </button>
    {/if}
  </div>

  {#if $isLoading}
    <div class="space-y-2">
      {#each Array(5) as _}
        <div class="h-12 bg-gray-200 animate-pulse rounded"></div>
      {/each}
    </div>
  {:else if filteredHolders.length > 0}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="border-b border-gray-200">
          <tr class="text-left text-sm text-gray-600">
            <th class="pb-2 font-medium">Address</th>
            <th class="pb-2 font-medium text-right">Tokens</th>
            <th class="pb-2 font-medium text-right">Share %</th>
            <th class="pb-2 font-medium text-right">Buy-in (ETH)</th>
            <th class="pb-2 font-medium text-right">Buy-in (USD)</th>
            <th class="pb-2 font-medium text-right">ETH Value</th>
            <th class="pb-2 font-medium text-right">USD Value</th>
            <th class="pb-2 font-medium text-right">PnL (ETH)</th>
            <th class="pb-2 font-medium text-right">PnL (USD)</th>
            <th class="pb-2 font-medium text-right">PnL %</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          {#each (showAll ? filteredHolders : filteredHolders.slice(0, 10)) as holder}
            {@const sharePercent = calculateSharePercent(holder.balance, circulatingSupply)}
            {@const shareValue = calculateShareValue(holder.balance, circulatingSupply, $totalTreasuryValue)}
            {@const buyInETH = calculateBuyInETH(holder.balance)}
            {@const buyInUSD = buyInETH * BUY_IN_ETH_PRICE}
            {@const valueETH = shareValue / ($treasuryData?.ethPrice || 1)}
            {@const valueUSD = shareValue}
            {@const pnlETH = valueETH - buyInETH}
            {@const pnlUSD = valueUSD - buyInUSD}
            {@const pnlPercentETH = buyInETH > 0 ? (pnlETH / buyInETH) * 100 : 0}
            {@const pnlPercentUSD = buyInUSD > 0 ? (pnlUSD / buyInUSD) * 100 : 0}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3">
                <a
                  href={getEtherscanAddressLink(holder.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-mono text-xs text-blue-600 hover:underline"
                >
                  {formatAddress(holder.address)}
                </a>
              </td>
              <td class="py-3 text-right">{formatCompact(holder.balance)}</td>
              <td class="py-3 text-right">{formatPercent(sharePercent)}</td>
              <td class="py-3 text-right text-gray-600">{formatETH(buyInETH)}</td>
              <td class="py-3 text-right text-gray-600">{formatUSD(buyInUSD)}</td>
              <td class="py-3 text-right font-semibold">{formatETH(valueETH)}</td>
              <td class="py-3 text-right font-semibold">{formatUSD(valueUSD)}</td>
              <td class="py-3 text-right font-semibold" class:text-green-600={pnlETH >= 0} class:text-red-600={pnlETH < 0}>
                {pnlETH >= 0 ? '+' : ''}{formatETH(pnlETH)}
              </td>
              <td class="py-3 text-right font-semibold" class:text-green-600={pnlUSD >= 0} class:text-red-600={pnlUSD < 0}>
                {pnlUSD >= 0 ? '+' : ''}{formatUSD(pnlUSD)}
              </td>
              <td class="py-3 text-right font-semibold" class:text-green-600={pnlPercentUSD >= 0} class:text-red-600={pnlPercentUSD < 0}>
                {pnlPercentUSD >= 0 ? '+' : ''}{formatPercent(pnlPercentUSD)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="text-gray-500 text-center py-8">No holder data available</p>
  {/if}
</section>
