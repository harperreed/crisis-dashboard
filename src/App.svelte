<!-- ABOUTME: Root application component, main dashboard container -->
<!-- ABOUTME: Orchestrates all child components and loads initial data -->
<script>
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import TreasuryTotal from './lib/components/TreasuryTotal.svelte';
  import UserHoldings from './lib/components/UserHoldings.svelte';
  import Breakdown from './lib/components/Breakdown.svelte';
  import Charts from './lib/components/Charts.svelte';
  import HoldersList from './lib/components/HoldersList.svelte';
  import { loadTreasuryData, error } from './lib/stores/treasury.js';

  onMount(() => {
    loadTreasuryData();
  });
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <Header />

  {#if $error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
      <p class="text-red-800">⚠️ {$error}</p>
      <p class="text-sm text-red-600 mt-2">
        Using cached data or unable to load treasury information.
      </p>
    </div>
  {/if}

  <TreasuryTotal />
  <UserHoldings />
  <Breakdown />
  <Charts />
  <HoldersList />
</div>
