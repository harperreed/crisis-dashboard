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
    throw new Error('ETHERSCAN_API_KEY not set. Get one at https://etherscan.io/apis');
  }
  const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${config.etherscanApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== '1') throw new Error(`Etherscan API error: ${data.message}`);
  return parseFloat(data.result) / 1e18; // Convert Wei to ETH
}

async function fetchTokenHolders() {
  if (!config.etherscanApiKey) {
    throw new Error('ETHERSCAN_API_KEY required for token holder data');
  }

  // Get total supply
  const supplyUrl = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${config.addresses.governanceToken}&apikey=${config.etherscanApiKey}`;
  const supplyResponse = await fetch(supplyUrl);
  const supplyData = await supplyResponse.json();
  if (supplyData.status !== '1') throw new Error(`Failed to fetch total supply: ${supplyData.message}`);
  const totalSupply = parseInt(supplyData.result);

  await delay(200);

  // Get token holder list (this returns top 10000 holders)
  // Note: Free Etherscan API doesn't have a dedicated "get all holders" endpoint
  // We'll use the token transfer events to build a holder list
  console.log('⚠️  Note: Token holder fetching requires additional API calls or a subgraph');
  console.log('⚠️  For now, returning empty holder list. Consider using The Graph or Alchemy for full holder data.');

  return {
    holders: [],
    totalSupply
  };
}

async function fetchNFTs() {
  console.log('⚠️  NFT fetching not yet implemented');
  console.log('⚠️  Requires Alchemy NFT API or Moralis to scan Safe wallets for NFTs');
  console.log('⚠️  Returning empty NFT list');

  // TODO: Implement NFT fetching
  // - Use Alchemy getNFTsForOwner API for both Safe addresses
  // - Get floor prices from OpenSea or Reservoir API
  // - Return array of: { name, contractAddress, quantity, floorPrice }

  return [];
}

function calculateTotal(data) {
  const ethValue = data.ethBalance * data.ethPrice;
  const nftsValue = data.nfts.reduce((sum, nft) => sum + (nft.quantity * nft.floorPrice * data.ethPrice), 0);
  return (ethValue + nftsValue).toFixed(0);
}

main();
