<!-- ABOUTME: Historical treasury timeline visualization using Chart.js -->
<!-- ABOUTME: Displays total treasury value over time with clickable data points and time range filters -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import { historyIndex } from '../stores/historyStore.js';
  import { createEventDispatcher } from 'svelte';

  Chart.register(...registerables);

  export let onDateSelect = null;

  const dispatch = createEventDispatcher();

  let chartCanvas;
  let chart;
  let timeRange = 'all'; // 1M, 3M, 6M, 1Y, all

  // Summary stats
  let currentValue = 0;
  let allTimeHigh = { value: 0, date: '' };
  let allTimeLow = { value: Infinity, date: '' };
  let firstTrackedDate = '';

  // Chart color
  const chartColor = '#627EEA';

  /**
   * Filter data based on selected time range
   */
  function getFilteredData(data, range) {
    if (!data || !data.length) return [];

    if (range === 'all') return data;

    const now = new Date(data[data.length - 1].date);
    const daysMap = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365
    };

    const days = daysMap[range];
    if (!days) return data;

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.filter(d => new Date(d.date) >= cutoffDate);
  }

  /**
   * Calculate summary statistics
   */
  function calculateStats(data) {
    if (!data || !data.length) {
      currentValue = 0;
      allTimeHigh = { value: 0, date: '' };
      allTimeLow = { value: Infinity, date: '' };
      firstTrackedDate = '';
      return;
    }

    currentValue = data[data.length - 1].totalValue;
    firstTrackedDate = data[0].date;

    let high = { value: -Infinity, date: '' };
    let low = { value: Infinity, date: '' };

    data.forEach(d => {
      if (d.totalValue > high.value) {
        high = { value: d.totalValue, date: d.date };
      }
      if (d.totalValue < low.value) {
        low = { value: d.totalValue, date: d.date };
      }
    });

    allTimeHigh = high;
    allTimeLow = low;
  }

  /**
   * Format date for display
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Handle data point click
   */
  function handleDataPointClick(date) {
    if (onDateSelect) {
      onDateSelect(date);
    }
    dispatch('dateSelect', { date });
  }

  /**
   * Create or update the chart
   */
  function createChart() {
    if (!$historyIndex?.dates?.length || !chartCanvas) return;

    const filteredData = getFilteredData($historyIndex.dates, timeRange);

    if (!filteredData.length) return;

    // Calculate stats
    calculateStats($historyIndex.dates);

    // Destroy existing chart
    if (chart) {
      chart.destroy();
      chart = null;
    }

    const ctx = chartCanvas.getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: filteredData.map(d => d.date),
        datasets: [{
          label: 'Total Treasury Value',
          data: filteredData.map(d => d.totalValue),
          borderColor: chartColor,
          backgroundColor: chartColor + '20',
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: chartColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const dataIndex = elements[0].index;
            const date = filteredData[dataIndex].date;
            handleDataPointClick(date);
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: timeRange === '1M' ? 'day' : timeRange === '3M' ? 'week' : 'month',
              displayFormats: {
                day: 'MMM d',
                week: 'MMM d',
                month: 'MMM yyyy'
              }
            },
            grid: {
              display: false
            },
            ticks: {
              font: { size: 11 }
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              },
              font: { size: 11 }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            callbacks: {
              title: function(context) {
                const dataIndex = context[0].dataIndex;
                return formatDate(filteredData[dataIndex].date);
              },
              label: function(context) {
                const dataIndex = context.dataIndex;
                const entry = filteredData[dataIndex];
                return [
                  `Total Value: $${entry.totalValue.toLocaleString()}`,
                  `ETH Price: $${entry.ethPrice.toLocaleString()}`
                ];
              }
            }
          }
        }
      }
    });
  }

  /**
   * Handle time range button click
   */
  function setTimeRange(range) {
    timeRange = range;
    createChart();
  }

  onMount(() => {
    if ($historyIndex?.dates?.length) {
      createChart();
    }
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<section class="mb-8">
  <h2 class="mb-6">📈 Treasury Timeline</h2>

  <!-- Summary Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="card p-4">
      <div class="text-sm text-slate-600 mb-1">Current Value</div>
      <div class="text-xl font-bold text-slate-900">
        ${currentValue.toLocaleString()}
      </div>
    </div>

    <div class="card p-4">
      <div class="text-sm text-slate-600 mb-1">All-Time High</div>
      <div class="text-xl font-bold text-green-600">
        ${allTimeHigh.value.toLocaleString()}
      </div>
      {#if allTimeHigh.date}
        <div class="text-xs text-slate-500 mt-1">{formatDate(allTimeHigh.date)}</div>
      {/if}
    </div>

    <div class="card p-4">
      <div class="text-sm text-slate-600 mb-1">All-Time Low</div>
      <div class="text-xl font-bold text-red-600">
        ${allTimeLow.value === Infinity ? 0 : allTimeLow.value.toLocaleString()}
      </div>
      {#if allTimeLow.date}
        <div class="text-xs text-slate-500 mt-1">{formatDate(allTimeLow.date)}</div>
      {/if}
    </div>

    <div class="card p-4">
      <div class="text-sm text-slate-600 mb-1">First Tracked</div>
      <div class="text-lg font-semibold text-slate-900">
        {firstTrackedDate ? formatDate(firstTrackedDate) : 'N/A'}
      </div>
    </div>
  </div>

  <!-- Chart Card -->
  <div class="card p-6">
    <!-- Time Range Buttons -->
    <div class="flex gap-2 mb-4 flex-wrap">
      {#each ['1M', '3M', '6M', '1Y', 'all'] as range}
        <button
          class="px-4 py-2 rounded text-sm font-medium transition-colors {timeRange === range
            ? 'bg-slate-800 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
          on:click={() => setTimeRange(range)}
        >
          {range === 'all' ? 'All Time' : range}
        </button>
      {/each}
    </div>

    <!-- Chart -->
    <div class="h-96">
      <canvas bind:this={chartCanvas}></canvas>
    </div>

    <!-- Help text -->
    <div class="text-xs text-slate-500 mt-4 text-center">
      Click on any data point to view that date's snapshot
    </div>
  </div>
</section>

<style>
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
</style>
