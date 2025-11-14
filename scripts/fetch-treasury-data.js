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

    console.log('✅ Fetching ERC-20 tokens...');
    try {
      const tokensData = await fetchERC20Tokens();
      data.tokens = tokensData.tokens;
      data.stablecoins = tokensData.stablecoins;
    } catch (error) {
      console.error('⚠️  Failed to fetch ERC-20 tokens:', error.message);
      console.log('⚠️  Continuing with empty token list');
      data.tokens = [];
      data.stablecoins = {};
    }

    console.log('✅ Fetching token holders...');
    try {
      const holdersData = await fetchTokenHolders();
      data.holders = holdersData.holders;
      data.totalSupply = holdersData.totalSupply;
    } catch (error) {
      console.error('⚠️  Failed to fetch token holders:', error.message);
      console.log('⚠️  Continuing with empty holder list');
      data.holders = [];
      data.totalSupply = 0;
    }

    console.log('✅ Fetching NFTs...');
    try {
      data.nfts = await fetchNFTs();
    } catch (error) {
      console.error('⚠️  Failed to fetch NFTs:', error.message);
      console.log('⚠️  Continuing with empty NFT list');
      data.nfts = [];
    }

    // Save to public/data/
    const outputDir = path.join(__dirname, '../public/data');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'treasury-snapshot.json');
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    console.log(`✅ Treasury data saved to ${outputPath}`);
    console.log(`📊 Total treasury value: $${calculateTotal(data)}`);
    console.log(`📊 NFT collections: ${data.nfts.length}`);
    console.log(`📊 Token holders: ${data.holders.length}`);

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

async function fetchTokenPrices(contractAddresses) {
  if (contractAddresses.length === 0) return {};

  try {
    // CoinGecko's free API allows up to 30 contract addresses per request
    // Split into batches if needed
    const batchSize = 30;
    const batches = [];

    for (let i = 0; i < contractAddresses.length; i += batchSize) {
      batches.push(contractAddresses.slice(i, i + batchSize));
    }

    const allPrices = {};

    for (const batch of batches) {
      const addresses = batch.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd`;

      const headers = {};
      if (config.coingeckoApiKey) {
        headers['x-cg-demo-api-key'] = config.coingeckoApiKey;
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      Object.assign(allPrices, data);

      // Rate limiting for free tier
      if (batches.length > 1) {
        await delay(1000); // 1 second between batches for free tier
      }
    }

    return allPrices;
  } catch (error) {
    console.log(`    ⚠️  Failed to fetch token prices from CoinGecko: ${error.message}`);
    return {};
  }
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

async function fetchERC20Tokens() {
  if (!config.alchemyApiKey) {
    console.log('⚠️  ALCHEMY_API_KEY not set. Skipping ERC-20 token fetching.');
    return { tokens: [], stablecoins: {} };
  }

  const alchemy = new Alchemy({
    apiKey: config.alchemyApiKey,
    network: Network.ETH_MAINNET,
  });

  console.log('  → Fetching ERC-20 tokens for both Safes...');

  // Fetch tokens for both Safe wallets
  const mainTokens = await alchemy.core.getTokenBalances(config.addresses.mainSafe);
  await delay(200);
  const hotTokens = await alchemy.core.getTokenBalances(config.addresses.hotSafe);

  // Combine and deduplicate token addresses
  const allTokenBalances = new Map();

  for (const token of mainTokens.tokenBalances) {
    if (token.tokenBalance && token.tokenBalance !== '0') {
      const balance = parseInt(token.tokenBalance);
      allTokenBalances.set(token.contractAddress.toLowerCase(), balance);
    }
  }

  for (const token of hotTokens.tokenBalances) {
    if (token.tokenBalance && token.tokenBalance !== '0') {
      const address = token.contractAddress.toLowerCase();
      const balance = parseInt(token.tokenBalance);
      const existing = allTokenBalances.get(address) || 0;
      allTokenBalances.set(address, existing + balance);
    }
  }

  // Known stablecoin addresses
  const stablecoinAddresses = {
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',  // 6 decimals
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',  // 6 decimals
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',   // 18 decimals
  };

  const tokens = [];
  const stablecoins = {};

  console.log(`  → Found ${allTokenBalances.size} unique ERC-20 tokens`);
  console.log('  → Fetching token metadata...');

  for (const [address, rawBalance] of allTokenBalances.entries()) {
    try {
      // Get token metadata
      const metadata = await alchemy.core.getTokenMetadata(address);
      await delay(100);

      const decimals = metadata.decimals || 18;
      const balance = rawBalance / Math.pow(10, decimals);
      const symbol = metadata.symbol || 'UNKNOWN';
      const name = metadata.name || 'Unknown Token';

      // Check if it's a stablecoin
      if (stablecoinAddresses[address]) {
        stablecoins[stablecoinAddresses[address]] = balance;
      } else {
        tokens.push({
          symbol,
          name,
          balance,
          price: 0, // Will be populated by price fetching
          contractAddress: address
        });
      }
    } catch (error) {
      console.log(`    ⚠️  Could not fetch metadata for ${address}: ${error.message}`);
    }
  }

  console.log(`  ✓ Found ${Object.keys(stablecoins).length} stablecoins and ${tokens.length} other tokens`);

  // Fetch prices for non-stablecoin tokens
  if (tokens.length > 0) {
    console.log('  → Fetching token prices from CoinGecko...');
    const prices = await fetchTokenPrices(tokens.map(t => t.contractAddress));

    // Update token prices
    for (const token of tokens) {
      const priceData = prices[token.contractAddress.toLowerCase()];
      if (priceData && priceData.usd) {
        token.price = priceData.usd;
      }
    }

    const tokensWithPrices = tokens.filter(t => t.price > 0).length;
    console.log(`  ✓ Found prices for ${tokensWithPrices}/${tokens.length} tokens`);
  }

  return { tokens, stablecoins };
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

  // Etherscan's free API doesn't have a direct "top holders" endpoint
  // We need to use token transfer events or The Graph for comprehensive holder data
  // For now, return a placeholder that calculates from transfer events

  console.log('  → Fetching token transfer events to build holder list...');
  console.log('  ⚠️  Note: This is a simplified approach. Production should use The Graph.');

  // Get recent transfer events (last 10000 blocks or use pagination)
  const transferUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&contractaddress=${config.addresses.governanceToken}&startblock=0&endblock=99999999&sort=asc&apikey=${config.etherscanApiKey}`;
  const transferResponse = await fetch(transferUrl);
  const transferData = await transferResponse.json();

  if (transferData.status !== '1') {
    console.log('  ⚠️  Could not fetch transfer events:', transferData.message);
    return { holders: [], totalSupply };
  }

  // Build holder balances from transfer events
  const balances = new Map();

  for (const tx of transferData.result) {
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();
    const value = parseInt(tx.value);

    // Subtract from sender (unless it's a mint from 0x0)
    if (from !== '0x0000000000000000000000000000000000000000') {
      balances.set(from, (balances.get(from) || 0) - value);
    }

    // Add to receiver (unless it's a burn to 0x0)
    if (to !== '0x0000000000000000000000000000000000000000') {
      balances.set(to, (balances.get(to) || 0) + value);
    }
  }

  // Convert to array and filter out zero/negative balances
  const holders = Array.from(balances.entries())
    .filter(([_, balance]) => balance > 0)
    .map(([address, balance]) => ({
      address,
      balance: balance / 1e18, // Convert from Wei to token units
      percentage: (balance / totalSupply) * 100
    }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 100); // Top 100 holders

  console.log(`  ✓ Found ${holders.length} token holders`);

  return {
    holders,
    totalSupply: totalSupply / 1e18
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

  // Group by collection and store individual tokens
  const collections = new Map();

  for (const nft of [...mainNFTs.ownedNfts, ...hotNFTs.ownedNfts]) {
    const contractAddress = nft.contract.address;
    const collectionName = nft.contract.name || nft.contract.symbol || 'Unknown Collection';
    const tokenId = nft.tokenId;

    if (collections.has(contractAddress)) {
      collections.get(contractAddress).tokens.push(tokenId);
    } else {
      collections.set(contractAddress, {
        name: collectionName,
        contractAddress: contractAddress,
        tokens: [tokenId],
        floorPrice: 0, // Populated by floor price fetching loop below
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
  const nftsValue = data.nfts.reduce((sum, nft) => sum + (nft.tokens.length * nft.floorPrice * data.ethPrice), 0);
  return (ethValue + nftsValue).toFixed(0);
}

main();
