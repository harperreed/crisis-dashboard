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
  $: currentETHPrice = $treasuryData?.ethPrice || 1;
  $: valueETH = shareValue / currentETHPrice;
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
  <section class="card-gradient mb-8 p-6">
    <h2 class="mb-6 flex items-center gap-2">
      <span>🎯 Your Holdings</span>
    </h2>

    {#if isLoading}
      <div class="h-32 bg-slate-200 animate-pulse rounded-lg"></div>
    {:else if userBalance > 0}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Token Balance -->
        <div class="stat-card p-5">
          <p class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Crisis Tokens</p>
          <p class="text-3xl font-bold text-slate-900 mb-1">{formatCompact(userBalance)}</p>
          <div class="badge badge-warning mt-2">
            {formatPercent(sharePercent)} of supply
          </div>
        </div>

        <!-- Current Value -->
        <div class="stat-card p-5">
          <p class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Current Value</p>
          <p class="text-2xl font-bold text-slate-900">{formatETH(valueETH)}</p>
          <p class="text-xl font-semibold text-slate-600">{formatUSD(valueUSD)}</p>
        </div>

        <!-- PnL -->
        <div class="stat-card p-5">
          <p class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Profit / Loss</p>
          <p class="text-2xl font-bold {pnlETH >= 0 ? 'text-emerald-600' : 'text-red-600'}">
            {pnlETH >= 0 ? '+' : ''}{formatETH(pnlETH)}
          </p>
          <p class="text-xl font-semibold {pnlUSD >= 0 ? 'text-emerald-600' : 'text-red-600'}">
            {pnlUSD >= 0 ? '+' : ''}{formatUSD(pnlUSD)}
          </p>
          <div class="mt-2 space-y-0.5">
            <div class="{pnlPercentUSD >= 0 ? 'badge-success' : 'badge-danger'} badge">
              {pnlPercentUSD >= 0 ? '+' : ''}{formatPercent(pnlPercentUSD)}
            </div>
            <p class="text-xs text-slate-500 mt-2">
              Buy-in: {formatETH(buyInETH)} @ ${BUY_IN_ETH_PRICE.toLocaleString()}/ETH
            </p>
            <p class="text-xs text-slate-500">
              Current: ETH @ ${currentETHPrice.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    {:else}
      <div class="stat-card p-8 text-center">
        <p class="text-slate-600 text-lg font-medium">You don't own any Crisis tokens</p>
        <p class="text-sm text-slate-400 mt-2">Buy-in rate: 1M tokens per 1 ETH</p>
      </div>
    {/if}
  </section>
{/if}
