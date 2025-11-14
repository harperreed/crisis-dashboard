<!-- ABOUTME: Data visualization charts for treasury analytics -->
<!-- ABOUTME: Shows asset type breakdown, all assets, and holder distribution -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { treasuryData, totalTreasuryValue } from '../stores/treasury.js';
  import { sum } from '../utils/calculations.js';
  import { ADDRESSES } from '../../config.js';

  Chart.register(...registerables);

  let assetTypeChart;
  let allAssetsChart;
  let assetTypeCanvas;
  let allAssetsCanvas;

  // Chart colors
  const colors = {
    eth: '#627EEA',
    stablecoins: '#26A17B',
    tokens: '#F6851B',
    nfts: '#E4761B'
  };

  // Generate colors for individual assets
  function generateColors(count) {
    const palette = [
      '#627EEA', '#26A17B', '#F6851B', '#E4761B', '#6F4CFF',
      '#FF6B9D', '#00D4AA', '#FFC107', '#9C27B0', '#00BCD4',
      '#4CAF50', '#FF5722', '#795548', '#607D8B', '#E91E63'
    ];
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  }

  function createAssetTypeChart() {
    if (!$treasuryData || assetTypeChart) return;

    const ethValue = $treasuryData.ethBalance * $treasuryData.ethPrice;
    const stablecoinsValue = sum(Object.values($treasuryData.stablecoins || {}));
    const tokensValue = sum($treasuryData.tokens?.map(t => t.balance * t.price) || []);
    const nftsValue = sum($treasuryData.nfts?.map(n => n.tokens.length * n.floorPrice * $treasuryData.ethPrice) || []);

    const ctx = assetTypeCanvas.getContext('2d');
    assetTypeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['ETH/Stablecoins', 'ERC-20 Tokens', 'NFTs'],
        datasets: [{
          data: [ethValue + stablecoinsValue, tokensValue, nftsValue],
          backgroundColor: [colors.eth, colors.tokens, colors.nfts],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  function createAllAssetsChart() {
    if (!$treasuryData || allAssetsChart) return;

    const assets = [];

    // Add ETH
    assets.push({
      name: 'ETH',
      value: $treasuryData.ethBalance * $treasuryData.ethPrice
    });

    // Add stablecoins
    Object.entries($treasuryData.stablecoins || {}).forEach(([name, value]) => {
      if (value > 0) {
        assets.push({ name, value });
      }
    });

    // Add top ERC-20 tokens by value
    ($treasuryData.tokens || [])
      .filter(t => t.balance * t.price > 0)
      .sort((a, b) => (b.balance * b.price) - (a.balance * a.price))
      .slice(0, 10)
      .forEach(t => {
        assets.push({
          name: t.symbol,
          value: t.balance * t.price
        });
      });

    // Add NFTs grouped
    const nftsValue = sum($treasuryData.nfts?.map(n => n.tokens.length * n.floorPrice * $treasuryData.ethPrice) || []);
    if (nftsValue > 0) {
      assets.push({ name: 'NFTs', value: nftsValue });
    }

    const ctx = allAssetsCanvas.getContext('2d');
    allAssetsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: assets.map(a => a.name),
        datasets: [{
          data: assets.map(a => a.value),
          backgroundColor: generateColors(assets.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  onMount(() => {
    if ($treasuryData) {
      createAssetTypeChart();
      createAllAssetsChart();
    }
  });

  // Recreate charts when data changes
  $: if ($treasuryData && assetTypeCanvas && allAssetsCanvas) {
    if (assetTypeChart) assetTypeChart.destroy();
    if (allAssetsChart) allAssetsChart.destroy();

    assetTypeChart = null;
    allAssetsChart = null;

    createAssetTypeChart();
    createAllAssetsChart();
  }

  onDestroy(() => {
    if (assetTypeChart) assetTypeChart.destroy();
    if (allAssetsChart) allAssetsChart.destroy();
  });
</script>

<section class="mb-8">
  <h2 class="mb-6">📊 Treasury Analytics</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Asset Type Breakdown -->
    <div class="bg-white rounded-lg p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Asset Categories</h3>
      <div class="h-64">
        <canvas bind:this={assetTypeCanvas}></canvas>
      </div>
    </div>

    <!-- All Assets Breakdown -->
    <div class="bg-white rounded-lg p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Assets</h3>
      <div class="h-64">
        <canvas bind:this={allAssetsCanvas}></canvas>
      </div>
    </div>
  </div>
</section>
