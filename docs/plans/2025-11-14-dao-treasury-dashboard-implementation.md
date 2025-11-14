# DAO Treasury Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a client-side Svelte dashboard that shows DAO treasury value, NFT holdings, and per-holder share with ETH/USD toggle.

**Architecture:** Static Svelte SPA with build-time data fetching via Node.js script. GitHub Actions runs daily at midnight to fetch fresh data and deploy to Vercel. Client loads pre-built JSON snapshot for instant display.

**Tech Stack:** Svelte 4, Vite 5, Tailwind CSS, Ethers.js, Node.js for build script

---

## Task 1: Initialize Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `src/main.js`
- Create: `src/App.svelte`
- Create: `src/app.css`
- Create: `index.html`
- Create: `.gitignore`

**Step 1: Initialize Node.js project**

Run:
```bash
npm init -y
```

Expected: Creates `package.json`

**Step 2: Install dependencies**

Run:
```bash
npm install svelte@4 vite@5 @sveltejs/vite-plugin-svelte tailwindcss postcss autoprefixer ethers@6
npm install -D prettier prettier-plugin-svelte
```

Expected: Dependencies added to package.json

**Step 3: Create Vite config**

Create `vite.config.js`:
```javascript
// ABOUTME: Vite configuration for Svelte with build settings
// ABOUTME: Configures dev server and production build output
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000
  }
});
```

**Step 4: Initialize Tailwind**

Run:
```bash
npx tailwindcss init -p
```

Expected: Creates `tailwind.config.js` and `postcss.config.js`

**Step 5: Configure Tailwind**

Modify `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{svelte,js,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
```

**Step 6: Create main CSS file**

Create `src/app.css`:
```css
/* ABOUTME: Main stylesheet with Tailwind directives and global styles */
/* ABOUTME: Defines base typography and spacing for clean minimal design */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-white text-gray-900 antialiased;
  }

  h1 {
    @apply text-3xl font-bold mb-4;
  }

  h2 {
    @apply text-2xl font-semibold mb-3;
  }

  h3 {
    @apply text-xl font-semibold mb-2;
  }
}
```

**Step 7: Create entry HTML**

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DAO Treasury Dashboard</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

**Step 8: Create main.js entry point**

Create `src/main.js`:
```javascript
// ABOUTME: Application entry point that mounts Svelte app to DOM
// ABOUTME: Imports global styles and initializes root App component
import './app.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')
});

export default app;
```

**Step 9: Create basic App component**

Create `src/App.svelte`:
```svelte
<!-- ABOUTME: Root application component, main dashboard container -->
<!-- ABOUTME: Orchestrates all child components and global state -->
<script>
  let message = 'DAO Treasury Dashboard';
</script>

<div class="container mx-auto px-4 py-8">
  <h1>{message}</h1>
  <p class="text-gray-600">Loading...</p>
</div>
```

**Step 10: Create .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
.DS_Store
*.log
.env
.env.local
```

**Step 11: Add scripts to package.json**

Modify `package.json` scripts section:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Step 12: Test dev server**

Run:
```bash
npm run dev
```

Expected: Dev server starts on http://localhost:3000, shows "DAO Treasury Dashboard"

**Step 13: Commit**

```bash
git add .
git commit -m "feat: initialize Svelte project with Vite and Tailwind

Set up basic project structure:
- Svelte 4 + Vite 5 + Tailwind CSS
- Basic App component
- Dev server on port 3000

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Configuration Constants

**Files:**
- Create: `src/config.js`

**Step 1: Create config file**

Create `src/config.js`:
```javascript
// ABOUTME: Application configuration constants for addresses and rates
// ABOUTME: Central location for all blockchain addresses and buy-in calculations

export const ADDRESSES = {
  mainSafe: '0x2f61cD8f256eF199cE0cd3094Bdce77F1B7e91f5',
  hotSafe: '0x3d321A75Ca6666A23ca3D68C94f317C0190868DA',
  governanceToken: '0x992f9Bb313368Ac11977b62490a83eeee54D9e1F'
};

export const BUY_IN_RATE = 1_000_000; // tokens per 1 ETH

export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export const API_ENDPOINTS = {
  etherscan: 'https://api.etherscan.io/api',
  opensea: 'https://api.opensea.io/api/v2',
  coingecko: 'https://api.coingecko.com/api/v3'
};
```

**Step 2: Commit**

```bash
git add src/config.js
git commit -m "feat: add configuration constants

Add addresses, buy-in rate, and API endpoints

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create Utility Functions

**Files:**
- Create: `src/lib/utils/formatters.js`
- Create: `src/lib/utils/calculations.js`

**Step 1: Create formatters utility**

Create `src/lib/utils/formatters.js`:
```javascript
// ABOUTME: Number and date formatting utilities for display
// ABOUTME: Handles currency, percentage, and address formatting

/**
 * Format number as USD currency
 */
export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format number as ETH with symbol
 */
export function formatETH(amount) {
  return `Ξ ${amount.toFixed(2)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

/**
 * Shorten Ethereum address
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format relative time
 */
export function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompact(num) {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
```

**Step 2: Create calculations utility**

Create `src/lib/utils/calculations.js`:
```javascript
// ABOUTME: Treasury value and share calculation functions
// ABOUTME: Implements core business logic for value computations

import { BUY_IN_RATE } from '../../config.js';

/**
 * Calculate holder's share percentage
 */
export function calculateSharePercent(holderBalance, totalSupply) {
  if (!totalSupply || totalSupply === 0) return 0;
  return (holderBalance / totalSupply) * 100;
}

/**
 * Calculate holder's share value
 */
export function calculateShareValue(holderBalance, totalSupply, treasuryValue) {
  if (!totalSupply || totalSupply === 0) return 0;
  return treasuryValue * (holderBalance / totalSupply);
}

/**
 * Calculate ETH paid at buy-in
 */
export function calculateBuyInETH(tokenBalance) {
  return tokenBalance / BUY_IN_RATE;
}

/**
 * Calculate USD value at buy-in
 */
export function calculateBuyInUSD(tokenBalance, ethPriceAtBuyIn) {
  const ethPaid = calculateBuyInETH(tokenBalance);
  return ethPaid * ethPriceAtBuyIn;
}

/**
 * Calculate change percentage
 */
export function calculateChangePercent(currentValue, buyInValue) {
  if (!buyInValue || buyInValue === 0) return 0;
  return ((currentValue - buyInValue) / buyInValue) * 100;
}

/**
 * Calculate total NFT collection value
 */
export function calculateNFTCollectionValue(quantity, floorPrice) {
  return quantity * floorPrice;
}

/**
 * Sum array of values
 */
export function sum(values) {
  return values.reduce((acc, val) => acc + val, 0);
}
```

**Step 3: Commit**

```bash
git add src/lib/utils/
git commit -m "feat: add utility functions for formatting and calculations

Add formatters for USD, ETH, percentages, addresses, time
Add calculations for shares, buy-in values, NFT valuations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Svelte Stores

**Files:**
- Create: `src/lib/stores/currency.js`
- Create: `src/lib/stores/treasury.js`
- Create: `src/lib/stores/cache.js`

**Step 1: Create currency store**

Create `src/lib/stores/currency.js`:
```javascript
// ABOUTME: Svelte store for ETH/USD currency toggle state
// ABOUTME: Manages global currency display preference
import { writable } from 'svelte/store';

export const currency = writable('USD'); // 'USD' or 'ETH'

export function toggleCurrency() {
  currency.update(current => current === 'USD' ? 'ETH' : 'USD');
}
```

**Step 2: Create treasury store**

Create `src/lib/stores/treasury.js`:
```javascript
// ABOUTME: Svelte store for treasury data and loading state
// ABOUTME: Central state management for all dashboard data
import { writable, derived } from 'svelte/store';
import { sum } from '../utils/calculations.js';

export const treasuryData = writable(null);
export const isLoading = writable(true);
export const lastUpdated = writable(null);
export const error = writable(null);

/**
 * Derived store for total treasury value
 */
export const totalTreasuryValue = derived(treasuryData, $data => {
  if (!$data) return 0;

  const ethValue = $data.ethBalance * $data.ethPrice;
  const stablecoinsValue = sum(Object.values($data.stablecoins || {}));
  const tokensValue = sum($data.tokens?.map(t => t.balance * t.price) || []);
  const nftsValue = sum($data.nfts?.map(n => n.quantity * n.floorPrice) || []);

  return ethValue + stablecoinsValue + tokensValue + nftsValue;
});

/**
 * Load treasury data from snapshot or cache
 */
export async function loadTreasuryData() {
  isLoading.set(true);
  error.set(null);

  try {
    const response = await fetch('/data/treasury-snapshot.json');
    if (!response.ok) throw new Error('Failed to load treasury data');

    const data = await response.json();
    treasuryData.set(data);
    lastUpdated.set(data.timestamp);
  } catch (err) {
    error.set(err.message);
    console.error('Error loading treasury data:', err);
  } finally {
    isLoading.set(false);
  }
}
```

**Step 3: Create cache store**

Create `src/lib/stores/cache.js`:
```javascript
// ABOUTME: LocalStorage cache management utilities
// ABOUTME: Handles persistent storage of treasury data with expiration
import { CACHE_DURATION } from '../../config.js';

const CACHE_KEY = 'treasury_cache';

/**
 * Save data to localStorage cache
 */
export function saveToCache(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Failed to save to cache:', err);
  }
}

/**
 * Load data from localStorage cache
 */
export function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > CACHE_DURATION) {
      clearCache();
      return null;
    }

    return { data, timestamp };
  } catch (err) {
    console.error('Failed to load from cache:', err);
    return null;
  }
}

/**
 * Clear localStorage cache
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.error('Failed to clear cache:', err);
  }
}

/**
 * Check if cache is stale
 */
export function isCacheStale() {
  const cached = loadFromCache();
  return !cached;
}
```

**Step 4: Commit**

```bash
git add src/lib/stores/
git commit -m "feat: add Svelte stores for state management

Add currency toggle store
Add treasury data store with derived total value
Add localStorage cache utilities

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create UI Components (Part 1 - Header)

**Files:**
- Create: `src/lib/components/Header.svelte`

**Step 1: Create Header component**

Create `src/lib/components/Header.svelte`:
```svelte
<!-- ABOUTME: Dashboard header with title, currency toggle, and refresh button -->
<!-- ABOUTME: Displays last updated timestamp and controls -->
<script>
  import { currency, toggleCurrency } from '../stores/currency.js';
  import { lastUpdated, loadTreasuryData } from '../stores/treasury.js';
  import { formatTimeAgo } from '../utils/formatters.js';

  let isRefreshing = false;

  async function handleRefresh() {
    isRefreshing = true;
    await loadTreasuryData();
    isRefreshing = false;
  }
</script>

<header class="border-b border-gray-200 pb-6 mb-8">
  <div class="flex items-center justify-between">
    <div>
      <h1>DAO Treasury Dashboard</h1>
      {#if $lastUpdated}
        <p class="text-sm text-gray-500">
          Last updated: {formatTimeAgo($lastUpdated)}
        </p>
      {/if}
    </div>

    <div class="flex items-center gap-4">
      <button
        on:click={toggleCurrency}
        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {$currency === 'USD' ? '💵 USD' : 'Ξ ETH'}
      </button>

      <button
        on:click={handleRefresh}
        disabled={isRefreshing}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </div>
</header>
```

**Step 2: Commit**

```bash
git add src/lib/components/Header.svelte
git commit -m "feat: add Header component

Add header with title, currency toggle, and refresh button
Display last updated timestamp

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create UI Components (Part 2 - Treasury Total)

**Files:**
- Create: `src/lib/components/TreasuryTotal.svelte`

**Step 1: Create TreasuryTotal component**

Create `src/lib/components/TreasuryTotal.svelte`:
```svelte
<!-- ABOUTME: Large display of total treasury value -->
<!-- ABOUTME: Shows value in selected currency with skeleton loader -->
<script>
  import { currency } from '../stores/currency.js';
  import { totalTreasuryValue, treasuryData, isLoading } from '../stores/treasury.js';
  import { formatUSD, formatETH } from '../utils/formatters.js';

  $: displayValue = $currency === 'USD'
    ? formatUSD($totalTreasuryValue)
    : formatETH($totalTreasuryValue / ($treasuryData?.ethPrice || 1));
</script>

<section class="bg-gray-50 rounded-lg p-6 mb-8">
  <h2 class="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
    Total Treasury Value
  </h2>

  {#if $isLoading}
    <div class="h-16 bg-gray-200 animate-pulse rounded"></div>
  {:else}
    <p class="text-5xl font-bold text-gray-900">
      {displayValue}
    </p>
  {/if}
</section>
```

**Step 2: Commit**

```bash
git add src/lib/components/TreasuryTotal.svelte
git commit -m "feat: add TreasuryTotal component

Display total treasury value with loading skeleton
Support USD/ETH currency toggle

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Create UI Components (Part 3 - Breakdown)

**Files:**
- Create: `src/lib/components/Breakdown.svelte`

**Step 1: Create Breakdown component**

Create `src/lib/components/Breakdown.svelte`:
```svelte
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
```

**Step 2: Commit**

```bash
git add src/lib/components/Breakdown.svelte
git commit -m "feat: add Breakdown component

Display treasury breakdown by asset type
Show top NFT collections with values
Support loading skeleton

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Create UI Components (Part 4 - Holders List)

**Files:**
- Create: `src/lib/components/HoldersList.svelte`

**Step 1: Create HoldersList component**

Create `src/lib/components/HoldersList.svelte`:
```svelte
<!-- ABOUTME: Table showing top token holders and their shares -->
<!-- ABOUTME: Displays address, token count, percentage, and share value -->
<script>
  import { currency } from '../stores/currency.js';
  import { treasuryData, totalTreasuryValue, isLoading } from '../stores/treasury.js';
  import { formatAddress, formatUSD, formatETH, formatPercent, formatCompact } from '../utils/formatters.js';
  import { calculateSharePercent, calculateShareValue } from '../utils/calculations.js';

  function formatValue(value) {
    if ($currency === 'USD') return formatUSD(value);
    return formatETH(value / ($treasuryData?.ethPrice || 1));
  }
</script>

<section class="bg-white border border-gray-200 rounded-lg p-6">
  <h2 class="mb-4">📋 Top Holders</h2>

  {#if $isLoading}
    <div class="space-y-2">
      {#each Array(5) as _}
        <div class="h-12 bg-gray-200 animate-pulse rounded"></div>
      {/each}
    </div>
  {:else if $treasuryData?.holders}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="border-b border-gray-200">
          <tr class="text-left text-sm text-gray-600">
            <th class="pb-2 font-medium">Address</th>
            <th class="pb-2 font-medium text-right">Tokens</th>
            <th class="pb-2 font-medium text-right">Share %</th>
            <th class="pb-2 font-medium text-right">Value</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          {#each $treasuryData.holders.slice(0, 10) as holder}
            {@const sharePercent = calculateSharePercent(holder.balance, $treasuryData.totalSupply)}
            {@const shareValue = calculateShareValue(holder.balance, $treasuryData.totalSupply, $totalTreasuryValue)}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 font-mono text-xs">{formatAddress(holder.address)}</td>
              <td class="py-3 text-right">{formatCompact(holder.balance)}</td>
              <td class="py-3 text-right">{formatPercent(sharePercent)}</td>
              <td class="py-3 text-right font-semibold">{formatValue(shareValue)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="text-gray-500 text-center py-8">No holder data available</p>
  {/if}
</section>
```

**Step 2: Commit**

```bash
git add src/lib/components/HoldersList.svelte
git commit -m "feat: add HoldersList component

Display top 10 token holders table
Show address, tokens, share %, and value
Support loading skeleton

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Update App Component

**Files:**
- Modify: `src/App.svelte`

**Step 1: Import components and load data**

Replace `src/App.svelte` with:
```svelte
<!-- ABOUTME: Root application component, main dashboard container -->
<!-- ABOUTME: Orchestrates all child components and loads initial data -->
<script>
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import TreasuryTotal from './lib/components/TreasuryTotal.svelte';
  import Breakdown from './lib/components/Breakdown.svelte';
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
  <Breakdown />
  <HoldersList />
</div>
```

**Step 2: Test in browser**

Run:
```bash
npm run dev
```

Expected: Dashboard displays with loading skeletons, then "Failed to load treasury data" error (expected, we haven't created the snapshot yet)

**Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "feat: wire up dashboard components in App

Import and display all dashboard components
Load treasury data on mount
Show error state when data unavailable

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Create Data Fetching Script (Part 1 - Setup)

**Files:**
- Create: `scripts/fetch-treasury-data.js`
- Create: `.env.example`

**Step 1: Install Node dependencies for script**

Run:
```bash
npm install node-fetch dotenv
```

Expected: Dependencies added

**Step 2: Create .env.example**

Create `.env.example`:
```
ETHERSCAN_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here
```

**Step 3: Create script skeleton**

Create `scripts/fetch-treasury-data.js`:
```javascript
#!/usr/bin/env node
// ABOUTME: Data fetching script that queries blockchain APIs and generates treasury snapshot
// ABOUTME: Run by GitHub Actions daily to update treasury data
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  addresses: {
    mainSafe: '0x2f61cD8f256eF199cE0cd3094Bdce77F1B7e91f5',
    hotSafe: '0x3d321A75Ca6666A23ca3D68C94f317C0190868DA',
    governanceToken: '0x992f9Bb313368Ac11977b62490a83eeee54D9e1F'
  },
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
  coingeckoApiKey: process.env.COINGECKO_API_KEY || ''
};

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting treasury data fetch...');

  try {
    const data = {
      timestamp: Date.now(),
      ethBalance: 0,
      ethPrice: 0,
      stablecoins: {},
      tokens: [],
      nfts: [],
      holders: [],
      totalSupply: 0
    };

    console.log('✅ Fetching ETH price...');
    data.ethPrice = await fetchETHPrice();

    console.log('✅ Fetching wallet balances...');
    data.ethBalance = await fetchETHBalances();

    console.log('✅ Fetching token holders...');
    const holdersData = await fetchTokenHolders();
    data.holders = holdersData.holders;
    data.totalSupply = holdersData.totalSupply;

    console.log('✅ Fetching NFTs...');
    data.nfts = await fetchNFTs();

    // Save to public/data/
    const outputDir = path.join(__dirname, '../public/data');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'treasury-snapshot.json');
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    console.log(`✅ Treasury data saved to ${outputPath}`);
    console.log(`📊 Total treasury value: $${calculateTotal(data)}`);

  } catch (error) {
    console.error('❌ Error fetching treasury data:', error);
    process.exit(1);
  }
}

async function fetchETHPrice() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
  const response = await fetch(url);
  const data = await response.json();
  return data.ethereum.usd;
}

async function fetchETHBalances() {
  // Fetch balance for both Safes
  const mainBalance = await fetchBalance(config.addresses.mainSafe);
  await delay(200);
  const hotBalance = await fetchBalance(config.addresses.hotSafe);
  return mainBalance + hotBalance;
}

async function fetchBalance(address) {
  const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${config.etherscanApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== '1') throw new Error(`Etherscan API error: ${data.message}`);
  return parseFloat(data.result) / 1e18; // Convert Wei to ETH
}

async function fetchTokenHolders() {
  // For now, return mock data
  // In production, you'd query token contract or use a subgraph
  return {
    holders: [
      { address: '0x1234567890123456789012345678901234567890', balance: 5000000 },
      { address: '0x2345678901234567890123456789012345678901', balance: 3000000 },
      { address: '0x3456789012345678901234567890123456789012', balance: 2000000 }
    ],
    totalSupply: 20000000
  };
}

async function fetchNFTs() {
  // For now, return mock data
  // In production, query OpenSea or Alchemy for NFT holdings
  return [
    { name: 'Bored Ape Yacht Club', quantity: 2, floorPrice: 30 },
    { name: 'Mutant Ape Yacht Club', quantity: 3, floorPrice: 5 }
  ];
}

function calculateTotal(data) {
  const ethValue = data.ethBalance * data.ethPrice;
  const nftsValue = data.nfts.reduce((sum, nft) => sum + (nft.quantity * nft.floorPrice * data.ethPrice), 0);
  return (ethValue + nftsValue).toFixed(0);
}

main();
```

**Step 4: Make script executable**

Run:
```bash
chmod +x scripts/fetch-treasury-data.js
```

**Step 5: Add package.json script**

Modify `package.json` to add:
```json
{
  "scripts": {
    "fetch-data": "node scripts/fetch-treasury-data.js",
    "prebuild": "npm run fetch-data"
  }
}
```

**Step 6: Test script**

Run:
```bash
npm run fetch-data
```

Expected: Creates `public/data/treasury-snapshot.json` with mock data

**Step 7: Test dashboard loads data**

Run:
```bash
npm run dev
```

Expected: Dashboard now displays mock treasury data

**Step 8: Commit**

```bash
git add scripts/ .env.example package.json public/data/
git commit -m "feat: add treasury data fetching script

Create Node.js script to fetch blockchain data
Add mock data for initial testing
Script generates treasury-snapshot.json

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily-build.yml`

**Step 1: Create workflow file**

Create `.github/workflows/daily-build.yml`:
```yaml
# ABOUTME: GitHub Actions workflow for daily treasury data updates
# ABOUTME: Runs at midnight UTC, fetches data, builds, and deploys to Vercel
name: Daily Treasury Update

on:
  schedule:
    - cron: '0 0 * * *'  # Midnight UTC every day
  workflow_dispatch:      # Allow manual trigger
  push:
    branches: [main]      # Also run on pushes to main

env:
  ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
  COINGECKO_API_KEY: ${{ secrets.COINGECKO_API_KEY }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Fetch treasury data
        run: npm run fetch-data

      - name: Build project
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Step 2: Commit**

```bash
git add .github/
git commit -m "feat: add GitHub Actions daily build workflow

Add workflow to fetch data and deploy at midnight UTC
Support manual trigger and push-to-main deployments
Configure Vercel integration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Add README and Documentation

**Files:**
- Create: `README.md`
- Create: `docs/SETUP.md`

**Step 1: Create README**

Create `README.md`:
```markdown
# DAO Treasury Dashboard

A client-side dashboard showing DAO treasury value, NFT holdings, and token holder shares.

## Features

- 📊 Real-time treasury value display
- 💎 NFT holdings with floor prices
- 👥 Top token holders list
- 💱 Toggle between ETH and USD
- 🔄 Daily automated updates
- 📱 Mobile responsive

## Tech Stack

- Svelte 4 + Vite 5
- Tailwind CSS
- Ethers.js
- GitHub Actions for daily data fetching

## Development

```bash
# Install dependencies
npm install

# Fetch treasury data
npm run fetch-data

# Start dev server
npm run dev

# Build for production
npm run build
```

## Configuration

Set environment variables in `.env`:

```
ETHERSCAN_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here
```

## Deployment

Dashboard deploys automatically to Vercel via GitHub Actions:
- Daily at midnight UTC
- On every push to main
- Manual trigger available

## License

MIT
```

**Step 2: Create setup docs**

Create `docs/SETUP.md`:
```markdown
# Setup Guide

## Prerequisites

- Node.js 20+
- npm or yarn
- Vercel account
- API keys (Etherscan, CoinGecko)

## Local Development

1. Clone repository
2. Copy `.env.example` to `.env`
3. Add your API keys to `.env`
4. Run `npm install`
5. Run `npm run fetch-data` to generate initial data
6. Run `npm run dev` to start dev server

## GitHub Secrets

Add these secrets to your GitHub repository:

- `ETHERSCAN_API_KEY` - From https://etherscan.io/apis
- `COINGECKO_API_KEY` - From https://www.coingecko.com/en/api
- `VERCEL_TOKEN` - From Vercel account settings
- `VERCEL_ORG_ID` - From Vercel project settings
- `VERCEL_PROJECT_ID` - From Vercel project settings

## Vercel Setup

1. Create new project on Vercel
2. Connect GitHub repository
3. Framework preset: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Copy project ID and org ID to GitHub secrets

## Testing Deployment

Manually trigger GitHub Actions workflow to test:
1. Go to Actions tab
2. Select "Daily Treasury Update"
3. Click "Run workflow"
```

**Step 3: Commit**

```bash
git add README.md docs/SETUP.md
git commit -m "docs: add README and setup guide

Add project README with features and tech stack
Add detailed setup instructions for deployment

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 13: Final Polish and Testing

**Files:**
- Modify: `src/app.css`
- Create: `public/favicon.svg`

**Step 1: Add final styling touches**

Modify `src/app.css` to add at the end:
```css
/* Loading skeleton animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Smooth transitions */
* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

**Step 2: Create favicon**

Create `public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#2563eb"/>
  <text x="50" y="70" font-size="60" text-anchor="middle" fill="white" font-weight="bold">Ξ</text>
</svg>
```

**Step 3: Update HTML to use favicon**

Modify `index.html` to add in `<head>`:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

**Step 4: Test full build**

Run:
```bash
npm run build
npm run preview
```

Expected: Production build works, preview shows dashboard

**Step 5: Commit**

```bash
git add src/app.css public/favicon.svg index.html
git commit -m "style: add final polish and favicon

Add smooth transitions and loading animations
Add favicon with ETH symbol

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Done!

All implementation tasks complete. The dashboard is ready for deployment.

**To deploy:**
1. Push to GitHub
2. Set up GitHub secrets (see `docs/SETUP.md`)
3. Connect Vercel project
4. Trigger GitHub Actions workflow

**Next steps (future enhancements):**
- Implement real token holder fetching (via Etherscan or The Graph)
- Add real NFT data from OpenSea/Alchemy APIs
- Add wallet connection feature for "Your Share" section
- Add historical price data for accurate buy-in calculations
- Implement error retry logic with exponential backoff
