<!-- ABOUTME: Historical treasury timeline view showing all past snapshots -->
<!-- ABOUTME: Displays timeline chart with clickable dates to navigate to historical dashboard views -->
<script>
  import { onMount } from 'svelte';
  import { loadHistoryIndex, historyIndex, isLoadingIndex, indexError } from '../lib/stores/historyStore.js';
  import TimelineChart from '../lib/components/TimelineChart.svelte';
  import Header from '../lib/components/Header.svelte';

  /**
   * Handle date selection from timeline chart
   * Navigate to historical dashboard view for that date
   */
  function handleDateSelect(event) {
    const date = event.detail.date;
    window.location.hash = `#/history/${date}`;
  }

  /**
   * Navigate back to main dashboard
   */
  function goToDashboard() {
    window.location.hash = '#/';
  }

  onMount(() => {
    loadHistoryIndex();
  });
</script>

<Header />

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <!-- Back to Dashboard Button -->
  <div class="mb-6">
    <button
      on:click={goToDashboard}
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <span>←</span>
      <span>Back to Dashboard</span>
    </button>
  </div>

  <!-- Page Title -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 mb-2">Treasury History</h1>
    <p class="text-slate-600">
      View historical treasury performance and click any point to see the full dashboard snapshot
    </p>
  </div>

  <!-- Loading State -->
  {#if $isLoadingIndex}
    <div class="card p-12 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-800 mb-4"></div>
      <p class="text-slate-600">Loading history...</p>
    </div>
  {:else if $indexError}
    <!-- Error State -->
    <div class="alert-error mb-8">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <p class="font-semibold">{$indexError}</p>
          <p class="text-sm text-red-600 mt-1">
            Unable to load historical data. Please try again later.
          </p>
        </div>
      </div>
    </div>
  {:else if $historyIndex?.dates?.length}
    <!-- Timeline Chart -->
    <TimelineChart on:dateSelect={handleDateSelect} />
  {:else}
    <!-- No Data State -->
    <div class="card p-12 text-center">
      <p class="text-slate-600 text-lg mb-2">No historical data available yet</p>
      <p class="text-sm text-slate-500">
        Historical snapshots will be collected starting from the first data capture
      </p>
    </div>
  {/if}
</div>

<style>
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .alert-error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
  }
</style>
