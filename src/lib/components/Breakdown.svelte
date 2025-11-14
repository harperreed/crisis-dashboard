<!-- ABOUTME: Treasury value breakdown by asset type -->
<!-- ABOUTME: Shows ETH, stablecoins, tokens, and NFTs with values -->
<script>
  import { currency } from '../stores/currency.js';
  import { treasuryData, isLoading } from '../stores/treasury.js';
  import { formatUSD, formatETH } from '../utils/formatters.js';
  import { sum } from '../utils/calculations.js';

  $: ethValue = ($treasuryData?.ethBalance || 0) * ($treasuryData?.ethPrice || 0);
  $: stablecoinsValue = sum(Object.values($treasuryData?.stablecoins || {}));
  $: tokensValue = sum($treasuryData?.tokens?.map(t => t.balance * t.price) || []);
  $: nftsValue = sum($treasuryData?.nfts?.map(n => n.quantity * n.floorPrice) || []);

  function formatValue(value) {
    if ($currency === 'USD') return formatUSD(value);
    return formatETH(value / ($treasuryData?.ethPrice || 1));
  }
</script>

<section class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
  <h2 class="mb-4">💰 Breakdown</h2>

  {#if $isLoading}
    <div class="space-y-3">
      {#each Array(4) as _}
        <div class="h-6 bg-gray-200 animate-pulse rounded"></div>
      {/each}
    </div>
  {:else}
    <ul class="space-y-3 text-gray-700">
      <li class="flex justify-between">
        <span>ETH & Stablecoins:</span>
        <span class="font-semibold">{formatValue(ethValue + stablecoinsValue)}</span>
      </li>

      <li class="flex justify-between">
        <span>ERC-20 Tokens:</span>
        <span class="font-semibold">{formatValue(tokensValue)}</span>
      </li>

      <li class="flex justify-between">
        <span>NFTs ({$treasuryData?.nfts?.length || 0} collections):</span>
        <span class="font-semibold">{formatValue(nftsValue)}</span>
      </li>

      {#if $treasuryData?.nfts?.length > 0}
        <li class="pl-4 space-y-2 mt-4">
          <p class="text-sm text-gray-500 mb-2">Top Collections:</p>
          {#each $treasuryData.nfts.slice(0, 3) as nft}
            <div class="flex justify-between text-sm">
              <span>• {nft.name}: {nft.quantity} @ {formatETH(nft.floorPrice)}</span>
              <span class="font-medium">{formatValue(nft.quantity * nft.floorPrice)}</span>
            </div>
          {/each}
          {#if $treasuryData.nfts.length > 3}
            <div class="flex justify-between text-sm text-gray-500">
              <span>• +{$treasuryData.nfts.length - 3} other collections</span>
              <span class="font-medium">
                {formatValue(sum($treasuryData.nfts.slice(3).map(n => n.quantity * n.floorPrice)))}
              </span>
            </div>
          {/if}
        </li>
      {/if}
    </ul>
  {/if}
</section>
