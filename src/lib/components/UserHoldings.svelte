<!-- ABOUTME: Display connected user's Crisis token holdings and PnL -->
<!-- ABOUTME: Shows token balance, share %, value, and profit/loss -->
<script>
  import { walletAddress, isConnected, provider } from '../stores/wallet.js';
  import { treasuryData, totalTreasuryValue } from '../stores/treasury.js';
  import { formatUSD, formatETH, formatPercent, formatCompact } from '../utils/formatters.js';
  import { calculateSharePercent, calculateShareValue, calculateBuyInETH } from '../utils/calculations.js';
  import { ADDRESSES, BUY_IN_ETH_PRICE } from '../../config.js';
  import { ethers } from 'ethers';
  import { onMount } from 'svelte';

  let userBalance = 0;
  let isLoading = false;

  // Exclude safe addresses from circulating supply calculation
  $: safeHoldings = $treasuryData?.holders?.reduce((total, h) => {
    if (h.address.toLowerCase() === ADDRESSES.mainSafe.toLowerCase() ||
        h.address.toLowerCase() === ADDRESSES.hotSafe.toLowerCase()) {
      return total + h.balance;
    }
    return total;
  }, 0) || 0;

  $: circulatingSupply = ($treasuryData?.totalSupply || 0) - safeHoldings;

  // Calculate user's holdings and PnL
  $: sharePercent = calculateSharePercent(userBalance, circulatingSupply);
  $: shareValue = calculateShareValue(userBalance, circulatingSupply, $totalTreasuryValue);
  $: buyInETH = calculateBuyInETH(userBalance);
  $: buyInUSD = buyInETH * BUY_IN_ETH_PRICE;
  $: valueETH = shareValue / ($treasuryData?.ethPrice || 1);
  $: valueUSD = shareValue;
  $: pnlETH = valueETH - buyInETH;
  $: pnlUSD = valueUSD - buyInUSD;
  $: pnlPercentUSD = buyInUSD > 0 ? (pnlUSD / buyInUSD) * 100 : 0;

  async function fetchUserBalance() {
    if (!$isConnected || !$provider || !$walletAddress) return;

    isLoading = true;
    try {
      const tokenContract = new ethers.Contract(
        ADDRESSES.governanceToken,
        ['function balanceOf(address) view returns (uint256)'],
        $provider
      );

      const balance = await tokenContract.balanceOf($walletAddress);
      userBalance = Number(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching user balance:', error);
      userBalance = 0;
    } finally {
      isLoading = false;
    }
  }

  // Fetch balance when wallet connects or changes
  $: if ($isConnected && $walletAddress) {
    fetchUserBalance();
  }

  $: if (!$isConnected) {
    userBalance = 0;
  }
</script>

{#if $isConnected}
  <section class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
    <h2 class="mb-4 text-blue-900">🎯 Your Holdings</h2>

    {#if isLoading}
      <div class="h-24 bg-white/50 animate-pulse rounded"></div>
    {:else if userBalance > 0}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Token Balance -->
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600 mb-1">Crisis Tokens</p>
          <p class="text-2xl font-bold text-gray-900">{formatCompact(userBalance)}</p>
          <p class="text-xs text-gray-500 mt-1">{formatPercent(sharePercent)} of supply</p>
        </div>

        <!-- Current Value -->
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600 mb-1">Current Value</p>
          <p class="text-xl font-bold text-gray-900">{formatETH(valueETH)}</p>
          <p class="text-lg font-semibold text-gray-700">{formatUSD(valueUSD)}</p>
        </div>

        <!-- PnL -->
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600 mb-1">Profit / Loss</p>
          <p class="text-xl font-bold" class:text-green-600={pnlETH >= 0} class:text-red-600={pnlETH < 0}>
            {pnlETH >= 0 ? '+' : ''}{formatETH(pnlETH)}
          </p>
          <p class="text-lg font-semibold" class:text-green-600={pnlUSD >= 0} class:text-red-600={pnlUSD < 0}>
            {pnlUSD >= 0 ? '+' : ''}{formatUSD(pnlUSD)} ({pnlPercentUSD >= 0 ? '+' : ''}{formatPercent(pnlPercentUSD)})
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Buy-in: {formatETH(buyInETH)} / {formatUSD(buyInUSD)}
          </p>
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-lg p-8 text-center">
        <p class="text-gray-500">You don't own any Crisis tokens</p>
        <p class="text-sm text-gray-400 mt-2">Buy-in rate: 1M tokens per 1 ETH</p>
      </div>
    {/if}
  </section>
{/if}
