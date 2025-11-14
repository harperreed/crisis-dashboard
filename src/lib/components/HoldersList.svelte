<!-- ABOUTME: Table showing top token holders and their shares -->
<!-- ABOUTME: Displays address, token count, percentage, and share value -->
<script>
  import { currency } from '../stores/currency.js';
  import { treasuryData, totalTreasuryValue, isLoading } from '../stores/treasury.js';
  import { formatAddress, formatUSD, formatETH, formatPercent, formatCompact } from '../utils/formatters.js';
  import { calculateSharePercent, calculateShareValue } from '../utils/calculations.js';

  function formatValue(value) {
    if ($currency === 'USD') return formatUSD(value);
    return formatETH(value / ($treasuryData?.ethPrice || 1));
  }
</script>

<section class="bg-white border border-gray-200 rounded-lg p-6">
  <h2 class="mb-4">📋 Top Holders</h2>

  {#if $isLoading}
    <div class="space-y-2">
      {#each Array(5) as _}
        <div class="h-12 bg-gray-200 animate-pulse rounded"></div>
      {/each}
    </div>
  {:else if $treasuryData?.holders}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="border-b border-gray-200">
          <tr class="text-left text-sm text-gray-600">
            <th class="pb-2 font-medium">Address</th>
            <th class="pb-2 font-medium text-right">Tokens</th>
            <th class="pb-2 font-medium text-right">Share %</th>
            <th class="pb-2 font-medium text-right">Value</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          {#each $treasuryData.holders.slice(0, 10) as holder}
            {@const sharePercent = calculateSharePercent(holder.balance, $treasuryData.totalSupply)}
            {@const shareValue = calculateShareValue(holder.balance, $treasuryData.totalSupply, $totalTreasuryValue)}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 font-mono text-xs">{formatAddress(holder.address)}</td>
              <td class="py-3 text-right">{formatCompact(holder.balance)}</td>
              <td class="py-3 text-right">{formatPercent(sharePercent)}</td>
              <td class="py-3 text-right font-semibold">{formatValue(shareValue)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="text-gray-500 text-center py-8">No holder data available</p>
  {/if}
</section>
