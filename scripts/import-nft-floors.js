#!/usr/bin/env node
// ABOUTME: Import historical NFT floor prices from Dune API or CSV
// ABOUTME: Updates backfilled history files with accurate NFT valuations

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dune query ID for NFT floor prices (create this query in Dune first)
const DUNE_QUERY_ID = process.env.DUNE_NFT_QUERY_ID || '6342986';
const DUNE_API_KEY = process.env.DUNE_API_KEY;

// NFT collections in the treasury with their contract addresses
const COLLECTIONS = {
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': { name: 'BoredApeYachtClub', tokens: 1 },
  '0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d': { name: 'V1 Cryptopunks (Wrapped)', tokens: 1 },
  '0x22c36bfdcef207f9c0cc941936eff94d4246d14a': { name: 'Unknown Collection', tokens: 2 },
  '0x1cb1a5e65610aeff2551a50f76a87a7d3fb649c6': { name: 'Cryptoadz', tokens: 1 },
  '0x08d7c0242953446436f34b4c78fe9da38c73668d': { name: 'PROOF Collective', tokens: 1 },
  '0xe785e82358879f061bc3dcac6f0444462d4b5330': { name: 'World Of Women', tokens: 2 },
  '0xc3f733ca98e0dad0386979eb96fb1722a1a05e69': { name: 'AcclimatedMoonCats', tokens: 5 },
  '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258': { name: 'Otherdeed', tokens: 1 },
  '0x3bf2922f4520a8ba0c2efc3d2a1539678dad5e9d': { name: '0N1 Force', tokens: 3 },
};

/**
 * Fetch results from Dune API
 */
async function fetchFromDune() {
  if (!DUNE_API_KEY) {
    throw new Error('DUNE_API_KEY not set');
  }

  console.log(`📡 Fetching from Dune query ${DUNE_QUERY_ID}...`);

  const url = `https://api.dune.com/api/v1/query/${DUNE_QUERY_ID}/results?limit=10000`;
  const response = await fetch(url, {
    headers: {
      'x-dune-api-key': DUNE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Dune API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.result?.rows) {
    throw new Error('No results in Dune response');
  }

  return data.result.rows;
}

async function main() {
  const args = process.argv.slice(2);
  const useApi = args.includes('--api') || (!args.length && DUNE_API_KEY);
  const csvPath = args.find(a => !a.startsWith('--'));

  if (!useApi && !csvPath) {
    console.log(`
📊 NFT Floor Price Import Script

Usage:
  node scripts/import-nft-floors.js --api          # Fetch from Dune API
  node scripts/import-nft-floors.js <csv-file>    # Import from CSV file

Environment variables:
  DUNE_API_KEY         Your Dune API key
  DUNE_NFT_QUERY_ID    Dune query ID (default: 6342986)

Dune Query for your collections:
────────────────────────────────
${generateDuneQuery()}
────────────────────────────────

Save this query at: https://dune.com/queries
Then either:
  - Set DUNE_API_KEY and run with --api
  - Export CSV and run with the file path
`);
    process.exit(0);
  }

  console.log('📊 NFT Floor Price Import');
  console.log('=========================');

  let records;

  if (useApi) {
    // Fetch from Dune API
    console.log('Source: Dune API');
    console.log('');
    records = await fetchFromDune();
    console.log(`📄 Fetched ${records.length} rows from Dune`);
  } else {
    // Read from CSV
    console.log(`Source: CSV file`);
    console.log(`File: ${csvPath}`);
    console.log('');

    let csvContent;
    try {
      csvContent = await fs.readFile(csvPath, 'utf-8');
    } catch (error) {
      console.error(`❌ Could not read CSV file: ${error.message}`);
      process.exit(1);
    }

    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });
    console.log(`📄 Parsed ${records.length} rows from CSV`);
  }

  // Group by date
  const floorsByDate = new Map();

  for (const row of records) {
    const date = row.date || row.day;  // Handle different column names
    const contract = (row.nft_contract_address || row.contract_address || '').toLowerCase();
    const floor = parseFloat(row.floor_price_eth || row.floor_price || 0);

    if (!date || !contract) continue;

    if (!floorsByDate.has(date)) {
      floorsByDate.set(date, new Map());
    }
    floorsByDate.get(date).set(contract, floor);
  }

  console.log(`📅 Found data for ${floorsByDate.size} dates`);
  console.log('');

  // Update history files
  const historyDir = path.join(__dirname, '../public/data/history');
  const indexPath = path.join(historyDir, 'index.json');

  let index;
  try {
    index = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Could not read history index.json');
    process.exit(1);
  }

  let updatedCount = 0;

  for (const [date, floors] of floorsByDate) {
    const snapshotPath = path.join(historyDir, `${date}.json`);

    try {
      const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf-8'));

      // Update NFT floor prices
      let nftValueChange = 0;
      for (const nft of snapshot.nfts) {
        const contract = nft.contractAddress.toLowerCase();
        if (floors.has(contract)) {
          const oldFloor = nft.floorPrice;
          const newFloor = floors.get(contract);
          nft.floorPrice = newFloor;
          nftValueChange += (newFloor - oldFloor) * nft.tokens.length * snapshot.ethPrice;
        }
      }

      // Save updated snapshot
      await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));

      // Update index entry
      const indexEntry = index.dates.find(e => e.date === date);
      if (indexEntry) {
        indexEntry.totalValue = calculateTotal(snapshot);
      }

      console.log(`✓ ${date}: Updated NFT floors (value change: ${nftValueChange >= 0 ? '+' : ''}$${nftValueChange.toFixed(0)})`);
      updatedCount++;

    } catch (error) {
      // File doesn't exist for this date, skip
      continue;
    }
  }

  // Save updated index
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

  console.log('');
  console.log('=========================');
  console.log(`✅ Updated ${updatedCount} history files`);
}

function calculateTotal(data) {
  const ethValue = data.ethBalance * data.ethPrice;
  const stableValue = Object.values(data.stablecoins || {}).reduce((sum, val) => sum + val, 0);
  const nftsValue = (data.nfts || []).reduce((sum, nft) =>
    sum + (nft.tokens.length * nft.floorPrice * data.ethPrice), 0);
  const tokensValue = (data.tokens || []).reduce((sum, token) =>
    sum + (token.balance * token.price), 0);
  return ethValue + stableValue + nftsValue + tokensValue;
}

function generateDuneQuery() {
  const contracts = Object.keys(COLLECTIONS);
  const contractList = contracts.map(c => `'${c}'`).join(',\n    ');

  return `-- Historical NFT Floor Prices for Crisis DAO Treasury
-- Export as CSV after running

WITH daily_floors AS (
  SELECT
    date_trunc('day', block_time) as date,
    nft_contract_address,
    MIN(amount_original) as floor_price_eth
  FROM nft.trades
  WHERE blockchain = 'ethereum'
    AND nft_contract_address IN (
    ${contractList}
    )
    AND amount_original > 0
    AND block_time >= DATE '2024-01-01'
  GROUP BY 1, 2
)
SELECT
  date,
  nft_contract_address,
  floor_price_eth
FROM daily_floors
ORDER BY date, nft_contract_address`;
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
