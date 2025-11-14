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

<Header />

<div class="container mx-auto px-4 py-8 max-w-6xl">
  {#if $error}
    <div class="alert-error mb-8">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <p class="font-semibold">{$error}</p>
          <p class="text-sm text-red-600 mt-1">
            Using cached data or unable to load treasury information.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <TreasuryTotal />
  <UserHoldings />
  <Breakdown />
  <Charts />
  <HoldersList />
</div>
