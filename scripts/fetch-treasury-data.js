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
  if (!config.etherscanApiKey) {
    console.log('⚠️  No Etherscan API key found, using mock balance');
    return 10.5; // Mock balance in ETH
  }
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
