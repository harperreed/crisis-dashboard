#!/usr/bin/env node
// ABOUTME: Backfill historical treasury data using CoinGecko historical prices
// ABOUTME: Run manually to populate history for dates before tracking started

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Delay helper for rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch historical ETH price from CoinGecko
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<number>} ETH price in USD
 */
async function fetchHistoricalETHPrice(date) {
  // CoinGecko expects DD-MM-YYYY format
  const [year, month, day] = date.split('-');
  const cgDate = `${day}-${month}-${year}`;

  const url = `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${cgDate}&localization=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.market_data?.current_price?.usd) {
    throw new Error(`No price data for ${date}`);
  }

  return data.market_data.current_price.usd;
}

/**
 * Generate dates between start and end (inclusive)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string[]} Array of dates
 */
function generateDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate + 'T12:00:00Z');
  const end = new Date(endDate + 'T12:00:00Z');

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Load current treasury snapshot as base for historical data
 */
async function loadCurrentSnapshot() {
  const snapshotPath = path.join(__dirname, '../public/data/treasury-snapshot.json');

  try {
    const content = await fs.readFile(snapshotPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Could not load current treasury-snapshot.json');
    console.error('   Run the main fetch script first to get current balances.');
    process.exit(1);
  }
}

/**
 * Calculate total treasury value with given ETH price
 */
function calculateTotal(data, ethPrice) {
  const ethValue = data.ethBalance * ethPrice;
  const stableValue = Object.values(data.stablecoins || {}).reduce((sum, val) => sum + val, 0);
  const nftsValue = (data.nfts || []).reduce((sum, nft) => sum + (nft.tokens.length * nft.floorPrice * ethPrice), 0);
  const tokensValue = (data.tokens || []).reduce((sum, token) => sum + (token.balance * token.price), 0);
  return ethValue + stableValue + nftsValue + tokensValue;
}

/**
 * Save historical snapshot for a specific date
 */
async function saveHistoricalSnapshot(baseData, date, ethPrice) {
  const historyDir = path.join(__dirname, '../public/data/history');
  await fs.mkdir(historyDir, { recursive: true });

  // Create snapshot with historical price
  const snapshot = {
    ...baseData,
    timestamp: new Date(date + 'T12:00:00Z').getTime(),
    ethPrice: ethPrice,
  };

  // Save daily snapshot
  const snapshotPath = path.join(historyDir, `${date}.json`);
  await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));

  return {
    date,
    totalValue: calculateTotal(snapshot, ethPrice),
    ethPrice
  };
}

/**
 * Update the history index with new entries
 */
async function updateIndex(entries) {
  const indexPath = path.join(__dirname, '../public/data/history/index.json');
  let index = { dates: [], firstDate: null, lastDate: null };

  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    index = JSON.parse(content);
  } catch (error) {
    // Index doesn't exist yet
  }

  // Add/update entries
  for (const entry of entries) {
    const existingIndex = index.dates.findIndex(e => e.date === entry.date);
    if (existingIndex >= 0) {
      index.dates[existingIndex] = entry;
    } else {
      index.dates.push(entry);
    }
  }

  // Sort by date
  index.dates.sort((a, b) => a.date.localeCompare(b.date));

  // Update firstDate and lastDate
  if (index.dates.length > 0) {
    index.firstDate = index.dates[0].date;
    index.lastDate = index.dates[index.dates.length - 1].date;
  }

  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  return index;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
📅 Treasury History Backfill Script

Usage: node scripts/backfill-history.js <start-date> [end-date]

Arguments:
  start-date    Start date in YYYY-MM-DD format
  end-date      End date in YYYY-MM-DD format (defaults to yesterday)

Examples:
  node scripts/backfill-history.js 2024-01-01              # Jan 1 2024 to yesterday
  node scripts/backfill-history.js 2024-01-01 2024-06-30   # Jan 1 to Jun 30 2024
  node scripts/backfill-history.js 2024-12-01 2024-12-10   # Dec 1-10 2024

⚠️  Note: This uses current wallet balances with historical ETH prices.
    Token balances are assumed unchanged. For accurate historical data,
    you'd need archive node access.

Rate limits: CoinGecko free tier allows ~10-30 requests/minute.
    The script includes delays to respect rate limits.
`);
    process.exit(0);
  }

  const startDate = args[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const endDate = args[1] || yesterday.toISOString().split('T')[0];

  // Validate dates
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    console.error('❌ Invalid date format. Use YYYY-MM-DD');
    process.exit(1);
  }

  if (startDate > endDate) {
    console.error('❌ Start date must be before end date');
    process.exit(1);
  }

  console.log('📅 Treasury History Backfill');
  console.log('============================');
  console.log(`Start date: ${startDate}`);
  console.log(`End date:   ${endDate}`);
  console.log('');

  // Load current snapshot as base
  console.log('📦 Loading current treasury snapshot as base...');
  const baseData = await loadCurrentSnapshot();
  console.log(`   ETH Balance: ${baseData.ethBalance.toFixed(4)} ETH`);
  console.log(`   Stablecoins: $${Object.values(baseData.stablecoins || {}).reduce((a, b) => a + b, 0).toFixed(2)}`);
  console.log('');

  // Generate date range
  const dates = generateDateRange(startDate, endDate);
  console.log(`📆 Processing ${dates.length} dates...`);
  console.log('');

  const entries = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const progress = `[${i + 1}/${dates.length}]`;

    try {
      process.stdout.write(`${progress} ${date}: Fetching ETH price... `);
      const ethPrice = await fetchHistoricalETHPrice(date);

      process.stdout.write(`$${ethPrice.toFixed(2)} → `);
      const entry = await saveHistoricalSnapshot(baseData, date, ethPrice);

      console.log(`✓ Total: $${entry.totalValue.toFixed(0)}`);
      entries.push(entry);
      successCount++;

      // Rate limit: CoinGecko free tier is ~10-30 req/min
      // Wait 2.5 seconds between requests to be safe
      if (i < dates.length - 1) {
        await delay(2500);
      }

    } catch (error) {
      console.log(`✗ ${error.message}`);
      failCount++;

      // Still wait on error (might be rate limited)
      await delay(3000);
    }
  }

  console.log('');
  console.log('📊 Updating history index...');
  const index = await updateIndex(entries);

  console.log('');
  console.log('============================');
  console.log(`✅ Backfill complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed:     ${failCount}`);
  console.log(`   Total in index: ${index.dates.length} entries`);
  console.log(`   Date range: ${index.firstDate} to ${index.lastDate}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
