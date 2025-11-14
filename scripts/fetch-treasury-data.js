#!/usr/bin/env node
// ABOUTME: Data fetching script that queries blockchain APIs and generates treasury snapshot
// ABOUTME: Run by GitHub Actions daily to update treasury data
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { Alchemy, Network } from 'alchemy-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  addresses: {
    mainSafe: '0x2f61cD8f256eF199cE0cd3094Bdce77F1B7e91f5',
    hotSafe: '0x3d321A75Ca6666A23ca3D68C94f317C0190868DA',
    governanceToken: '0x992f9Bb313368Ac11977b62490a83eeee54D9e1F'
  },
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
  coingeckoApiKey: process.env.COINGECKO_API_KEY || '',
  alchemyApiKey: process.env.ALCHEMY_API_KEY || ''
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
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${config.etherscanApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== '1') {
    console.error('Etherscan response:', JSON.stringify(data, null, 2));
    throw new Error(`Etherscan API error: ${data.message || data.result || 'Unknown error'}`);
  }
  return parseFloat(data.result) / 1e18; // Convert Wei to ETH
}

async function fetchTokenHolders() {
  if (!config.etherscanApiKey) {
    throw new Error('ETHERSCAN_API_KEY required for token holder data');
  }

  // Get total supply
  const supplyUrl = `https://api.etherscan.io/v2/api?chainid=1&module=stats&action=tokensupply&contractaddress=${config.addresses.governanceToken}&apikey=${config.etherscanApiKey}`;
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
  if (!config.alchemyApiKey) {
    console.log('⚠️  ALCHEMY_API_KEY not set. Skipping NFT fetching.');
    console.log('⚠️  Get a free API key at https://www.alchemy.com/');
    return [];
  }

  console.log('Fetching NFTs from Alchemy...');

  const alchemy = new Alchemy({
    apiKey: config.alchemyApiKey,
    network: Network.ETH_MAINNET,
  });

  const nfts = [];

  // Fetch NFTs for main Safe
  console.log('  → Fetching NFTs for Main Safe...');
  const mainNFTs = await alchemy.nft.getNftsForOwner(config.addresses.mainSafe, {
    excludeFilters: ['SPAM'],
  });

  await delay(200);

  // Fetch NFTs for hot Safe
  console.log('  → Fetching NFTs for Hot Safe...');
  const hotNFTs = await alchemy.nft.getNftsForOwner(config.addresses.hotSafe, {
    excludeFilters: ['SPAM'],
  });

  // Group by collection and aggregate quantities
  const collections = new Map();

  for (const nft of [...mainNFTs.ownedNfts, ...hotNFTs.ownedNfts]) {
    const contractAddress = nft.contract.address;
    const collectionName = nft.contract.name || nft.contract.symbol || 'Unknown Collection';

    if (collections.has(contractAddress)) {
      collections.get(contractAddress).quantity += 1;
    } else {
      collections.set(contractAddress, {
        name: collectionName,
        contractAddress: contractAddress,
        quantity: 1,
        floorPrice: 0, // Will be populated in next task
      });
    }
  }

  // Fetch floor prices for each collection
  console.log('  → Fetching floor prices...');
  for (const [contractAddress, collection] of collections.entries()) {
    try {
      const floorPrice = await alchemy.nft.getFloorPrice(contractAddress);
      if (floorPrice && floorPrice.openSea) {
        collection.floorPrice = floorPrice.openSea.floorPrice || 0;
      } else if (floorPrice && floorPrice.looksRare) {
        collection.floorPrice = floorPrice.looksRare.floorPrice || 0;
      }
      await delay(100); // Rate limiting
    } catch (error) {
      console.log(`    ⚠️  Could not fetch floor price for ${collection.name}: ${error.message}`);
      collection.floorPrice = 0;
    }
  }

  // Convert map to array
  for (const collection of collections.values()) {
    nfts.push(collection);
  }

  console.log(`  ✓ Found ${nfts.length} NFT collections`);
  return nfts;
}

function calculateTotal(data) {
  const ethValue = data.ethBalance * data.ethPrice;
  const nftsValue = data.nfts.reduce((sum, nft) => sum + (nft.quantity * nft.floorPrice * data.ethPrice), 0);
  return (ethValue + nftsValue).toFixed(0);
}

main();
