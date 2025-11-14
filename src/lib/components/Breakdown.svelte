<!-- ABOUTME: Treasury value breakdown by asset type -->
<!-- ABOUTME: Shows ETH, stablecoins, tokens, and NFTs with values -->
<script>
  import { currency } from '../stores/currency.js';
  import { treasuryData, isLoading } from '../stores/treasury.js';
  import { formatUSD, formatETH } from '../utils/formatters.js';
  import { sum } from '../utils/calculations.js';

  let nftsExpanded = false;
  let ethExpanded = false;

  $: ethValue = ($treasuryData?.ethBalance || 0) * ($treasuryData?.ethPrice || 0);
  $: stablecoinsValue = sum(Object.values($treasuryData?.stablecoins || {}));
  $: tokensValue = sum($treasuryData?.tokens?.map(t => t.balance * t.price) || []);
  $: nftsValue = sum($treasuryData?.nfts?.map(n => n.quantity * n.floorPrice * ($treasuryData?.ethPrice || 0)) || []);

  function formatValue(value) {
    if ($currency === 'USD') return formatUSD(value);
    return formatETH(value / ($treasuryData?.ethPrice || 1));
  }

  function toggleNFTs() {
    nftsExpanded = !nftsExpanded;
  }

  function toggleETH() {
    ethExpanded = !ethExpanded;
  }

  function getEtherscanLink(contractAddress) {
    return `https://etherscan.io/address/${contractAddress}`;
  }

  function getOpenSeaLink(contractAddress) {
    return `https://opensea.io/assets/ethereum/${contractAddress}`;
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
        <button
          on:click={toggleETH}
          class="flex justify-between w-full hover:text-gray-900 transition-colors"
          class:text-gray-900={ethExpanded}
        >
          <span>
            {ethExpanded ? '▼' : '▶'} ETH & Stablecoins:
          </span>
          <span class="font-semibold">{formatValue(ethValue + stablecoinsValue)}</span>
        </button>
      </li>

      {#if ethExpanded}
        <li class="pl-4 space-y-2 mt-2">
          <div class="flex justify-between text-sm">
            <span>• ETH Balance: {formatETH($treasuryData?.ethBalance || 0)}</span>
            <span class="font-medium">{formatValue(ethValue)}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-500">
            <span>  @ {formatUSD($treasuryData?.ethPrice || 0)} per ETH</span>
          </div>
          {#if stablecoinsValue > 0}
            <div class="flex justify-between text-sm">
              <span>• Stablecoins:</span>
              <span class="font-medium">{formatValue(stablecoinsValue)}</span>
            </div>
          {/if}
        </li>
      {/if}

      <li class="flex justify-between">
        <span>ERC-20 Tokens:</span>
        <span class="font-semibold">{formatValue(tokensValue)}</span>
      </li>

      <li class="flex justify-between">
        <button
          on:click={toggleNFTs}
          class="flex justify-between w-full hover:text-gray-900 transition-colors"
          class:text-gray-900={nftsExpanded}
        >
          <span>
            {nftsExpanded ? '▼' : '▶'} NFTs ({$treasuryData?.nfts?.length || 0} collections):
          </span>
          <span class="font-semibold">{formatValue(nftsValue)}</span>
        </button>
      </li>

      {#if $treasuryData?.nfts?.length > 0 && nftsExpanded}
        <li class="pl-4 space-y-2 mt-2">
          <p class="text-sm text-gray-500 mb-2">Collections:</p>
          {#each $treasuryData.nfts as nft}
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span>• {nft.name}: {nft.quantity} @ {formatETH(nft.floorPrice)}</span>
                <span class="font-medium">{formatValue(nft.quantity * nft.floorPrice * ($treasuryData?.ethPrice || 0))}</span>
              </div>
              <div class="flex gap-3 text-xs text-blue-600 pl-4">
                <a
                  href={getEtherscanLink(nft.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:underline"
                >
                  Etherscan ↗
                </a>
                <a
                  href={getOpenSeaLink(nft.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:underline"
                >
                  OpenSea ↗
                </a>
              </div>
            </div>
          {/each}
        </li>
      {/if}
    </ul>
  {/if}
</section>
