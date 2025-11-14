<!-- ABOUTME: Treasury value breakdown by asset type -->
<!-- ABOUTME: Shows ETH, stablecoins, tokens, and NFTs with values -->
<script>
  import { currency } from '../stores/currency.js';
  import { treasuryData, isLoading } from '../stores/treasury.js';
  import { formatUSD, formatETH } from '../utils/formatters.js';
  import { sum } from '../utils/calculations.js';

  let nftsExpanded = false;
  let ethExpanded = false;
  let tokensExpanded = false;

  $: ethValue = ($treasuryData?.ethBalance || 0) * ($treasuryData?.ethPrice || 0);
  $: stablecoinsValue = sum(Object.values($treasuryData?.stablecoins || {}));
  $: tokensValue = sum($treasuryData?.tokens?.map(t => t.balance * t.price) || []);
  $: nftsValue = sum($treasuryData?.nfts?.map(n => n.tokens.length * n.floorPrice * ($treasuryData?.ethPrice || 0)) || []);
  $: tokensWithValue = $treasuryData?.tokens?.filter(t => t.balance > 0 && (t.balance * t.price) > 0) || [];

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

  function toggleTokens() {
    tokensExpanded = !tokensExpanded;
  }

  function getEtherscanLink(contractAddress, tokenId) {
    return `https://etherscan.io/token/${contractAddress}?a=${tokenId}`;
  }

  function getOpenSeaLink(contractAddress, tokenId) {
    return `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
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
    <div class="space-y-4">
      <!-- ETH & Stablecoins Section -->
      <div class="border-b border-gray-200 pb-3">
        <button
          on:click={toggleETH}
          class="flex justify-between w-full hover:text-gray-900 transition-colors text-gray-700"
          class:text-gray-900={ethExpanded}
        >
          <span class="font-medium">
            {ethExpanded ? '▼' : '▶'} ETH & Stablecoins
          </span>
          <span class="font-semibold">{formatValue(ethValue + stablecoinsValue)}</span>
        </button>

        {#if ethExpanded}
          <table class="w-full mt-3 text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2">Asset</th>
                <th class="pb-2 text-right">Balance</th>
                <th class="pb-2 text-right">Price</th>
                <th class="pb-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody class="text-gray-700">
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2">ETH</td>
                <td class="py-2 text-right">{formatETH($treasuryData?.ethBalance || 0)}</td>
                <td class="py-2 text-right">{formatUSD($treasuryData?.ethPrice || 0)}</td>
                <td class="py-2 text-right font-medium">{formatValue(ethValue)}</td>
              </tr>
              {#if stablecoinsValue > 0}
                {#each Object.entries($treasuryData?.stablecoins || {}) as [symbol, balance]}
                  <tr class="border-b hover:bg-gray-50">
                    <td class="py-2">{symbol}</td>
                    <td class="py-2 text-right">{balance.toFixed(2)}</td>
                    <td class="py-2 text-right">$1.00</td>
                    <td class="py-2 text-right font-medium">{formatValue(balance)}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        {/if}
      </div>

      <!-- ERC-20 Tokens Section -->
      <div class="border-b border-gray-200 pb-3">
        <button
          on:click={toggleTokens}
          class="flex justify-between w-full hover:text-gray-900 transition-colors text-gray-700"
          class:text-gray-900={tokensExpanded}
        >
          <span class="font-medium">
            {tokensExpanded ? '▼' : '▶'} ERC-20 Tokens ({tokensWithValue.length})
          </span>
          <span class="font-semibold">{formatValue(tokensValue)}</span>
        </button>

        {#if tokensWithValue.length > 0 && tokensExpanded}
          <div class="mt-3 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b">
                  <th class="pb-2">Token</th>
                  <th class="pb-2 text-right">Balance</th>
                  <th class="pb-2 text-right">Price</th>
                  <th class="pb-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody class="text-gray-700">
                {#each tokensWithValue
                  .sort((a, b) => (b.balance * b.price) - (a.balance * a.price))
                  .slice(0, 20) as token}
                  <tr class="border-b hover:bg-gray-50">
                    <td class="py-2">{token.symbol}</td>
                    <td class="py-2 text-right">{token.balance.toFixed(4)}</td>
                    <td class="py-2 text-right">
                      {#if token.price > 0}
                        {formatUSD(token.price)}
                      {:else}
                        <span class="text-gray-400">—</span>
                      {/if}
                    </td>
                    <td class="py-2 text-right font-medium">{formatValue(token.balance * token.price)}</td>
                  </tr>
                {/each}
                {#if tokensWithValue.length > 20}
                  <tr class="text-gray-500">
                    <td class="py-2" colspan="3">+{tokensWithValue.length - 20} more tokens</td>
                    <td class="py-2 text-right font-medium">
                      {formatValue(sum(tokensWithValue.slice(20).map(t => t.balance * t.price)))}
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <!-- NFTs Section -->
      <div class="pb-3">
        <button
          on:click={toggleNFTs}
          class="flex justify-between w-full hover:text-gray-900 transition-colors text-gray-700"
          class:text-gray-900={nftsExpanded}
        >
          <span class="font-medium">
            {nftsExpanded ? '▼' : '▶'} NFTs ({$treasuryData?.nfts?.length || 0} collections)
          </span>
          <span class="font-semibold">{formatValue(nftsValue)}</span>
        </button>

        {#if $treasuryData?.nfts?.length > 0 && nftsExpanded}
          <div class="mt-3 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b">
                  <th class="pb-2">Collection</th>
                  <th class="pb-2 text-right">Quantity</th>
                  <th class="pb-2 text-right">Floor Price</th>
                  <th class="pb-2 text-right">Value</th>
                  <th class="pb-2 text-center">Links</th>
                </tr>
              </thead>
              <tbody class="text-gray-700">
                {#each $treasuryData.nfts
                  .sort((a, b) => (b.tokens.length * b.floorPrice * ($treasuryData?.ethPrice || 0)) - (a.tokens.length * a.floorPrice * ($treasuryData?.ethPrice || 0))) as nft}
                  <tr class="border-b hover:bg-gray-50">
                    <td class="py-2">{nft.name}</td>
                    <td class="py-2 text-right">{nft.tokens.length}</td>
                    <td class="py-2 text-right">{formatETH(nft.floorPrice)}</td>
                    <td class="py-2 text-right font-medium">{formatValue(nft.tokens.length * nft.floorPrice * ($treasuryData?.ethPrice || 0))}</td>
                    <td class="py-2 text-center">
                      <div class="flex gap-2 justify-center">
                        <a
                          href={getEtherscanLink(nft.contractAddress, nft.tokens[0])}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-blue-600 hover:underline text-xs"
                        >
                          Etherscan ↗
                        </a>
                        <a
                          href={getOpenSeaLink(nft.contractAddress, nft.tokens[0])}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-blue-600 hover:underline text-xs"
                        >
                          OpenSea ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</section>
