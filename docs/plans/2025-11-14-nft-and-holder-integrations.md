# NFT and Token Holder Integrations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Alchemy NFT API and Etherscan token holder endpoints to populate NFT inventory and holder distribution data in the treasury dashboard.

**Architecture:** Add Alchemy SDK for NFT data (both wallet NFTs and floor prices), use existing Etherscan API to fetch top token holders. Extend fetch script with new API calls, add proper error handling and rate limiting.

**Tech Stack:** Alchemy SDK v3, Etherscan API V2, node-fetch

---

## Task 1: Install Alchemy SDK and Add API Key Configuration

**Files:**
- Modify: `scripts/fetch-treasury-data.js:18-20`
- Modify: `.env:2-3`
- Modify: `package.json` (via npm)

**Step 1: Install Alchemy SDK**

Run: `npm install alchemy-sdk --save`
Expected: Package added to package.json dependencies

**Step 2: Add Alchemy API key to .env**

Add to `.env`:
```
ALCHEMY_API_KEY=
```

Note: User will need to get free API key from https://www.alchemy.com/

**Step 3: Update config in fetch script**

Modify `scripts/fetch-treasury-data.js` config object:
```javascript
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
```

**Step 4: Commit**

```bash
git add scripts/fetch-treasury-data.js .env package.json package-lock.json
git commit -m "feat: add Alchemy SDK for NFT integration"
```

---

## Task 2: Implement NFT Fetching with Alchemy

**Files:**
- Modify: `scripts/fetch-treasury-data.js:1-10` (imports)
- Modify: `scripts/fetch-treasury-data.js:125-136` (fetchNFTs function)

**Step 1: Add Alchemy SDK import**

Add at top of `scripts/fetch-treasury-data.js` after existing imports:
```javascript
import { Alchemy, Network } from 'alchemy-sdk';
```

**Step 2: Implement fetchNFTs function**

Replace the fetchNFTs function (lines 125-136) with:
```javascript
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

  // Convert map to array
  for (const collection of collections.values()) {
    nfts.push(collection);
  }

  console.log(`  ✓ Found ${nfts.length} NFT collections`);
  return nfts;
}
```

**Step 3: Run the fetch script**

Run: `npm run fetch-data`
Expected: Either "ALCHEMY_API_KEY not set" warning OR successful NFT fetch with floor prices still at 0

**Step 4: Commit**

```bash
git add scripts/fetch-treasury-data.js
git commit -m "feat: implement NFT fetching with Alchemy SDK"
```

---

## Task 3: Add NFT Floor Price Fetching

**Files:**
- Modify: `scripts/fetch-treasury-data.js:125-180` (within fetchNFTs function)

**Step 1: Add floor price fetching using Alchemy**

Modify the fetchNFTs function to fetch floor prices after aggregating collections. Add this code before the "Convert map to array" comment:

```javascript
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
```

**Step 2: Run the fetch script**

Run: `npm run fetch-data`
Expected: NFTs fetched with floor prices populated (or 0 if unavailable)

**Step 3: Verify output**

Check `public/data/treasury-snapshot.json` - should have populated nfts array with floor prices:
```json
{
  "nfts": [
    {
      "name": "Bored Ape Yacht Club",
      "contractAddress": "0x...",
      "quantity": 2,
      "floorPrice": 30.5
    }
  ]
}
```

**Step 4: Commit**

```bash
git add scripts/fetch-treasury-data.js
git commit -m "feat: add NFT floor price fetching via Alchemy"
```

---

## Task 4: Implement Token Holder Fetching with Etherscan

**Files:**
- Modify: `scripts/fetch-treasury-data.js:99-123` (fetchTokenHolders function)

**Step 1: Research Etherscan token holder endpoints**

Check Etherscan API docs for token holder endpoints. Note: Free tier may not have a direct "get all holders" endpoint. We'll need to use the token supply + holder query approach.

**Step 2: Implement fetchTokenHolders function**

Replace the fetchTokenHolders function (lines 99-123) with:

```javascript
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
```

**Step 3: Run the fetch script**

Run: `npm run fetch-data`
Expected: Token holders fetched and sorted by balance

**Step 4: Verify output**

Check `public/data/treasury-snapshot.json` - should have populated holders array:
```json
{
  "holders": [
    {
      "address": "0x...",
      "balance": 1500000,
      "percentage": 15.5
    }
  ],
  "totalSupply": 10000000
}
```

**Step 5: Commit**

```bash
git add scripts/fetch-treasury-data.js
git commit -m "feat: implement token holder fetching via Etherscan"
```

---

## Task 5: Add Error Handling and Graceful Degradation

**Files:**
- Modify: `scripts/fetch-treasury-data.js:40-52` (main function)

**Step 1: Wrap NFT and holder fetching in try-catch**

Modify the main function to handle failures gracefully:

```javascript
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
```

**Step 2: Run the fetch script**

Run: `npm run fetch-data`
Expected: Script completes even if NFT or holder fetching fails

**Step 3: Commit**

```bash
git add scripts/fetch-treasury-data.js
git commit -m "feat: add error handling and graceful degradation"
```

---

## Task 6: Update GitHub Actions to Include Alchemy API Key

**Files:**
- Modify: `.github/workflows/daily-build.yml:10-13`

**Step 1: Add Alchemy API key to workflow env**

Modify `.github/workflows/daily-build.yml` env section:

```yaml
env:
  ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
  COINGECKO_API_KEY: ${{ secrets.COINGECKO_API_KEY }}
  ALCHEMY_API_KEY: ${{ secrets.ALCHEMY_API_KEY }}
```

**Step 2: Update README with instructions**

Add to `README.md` after Etherscan API key section:

```markdown
3. Add `ALCHEMY_API_KEY` to repository secrets (Settings → Secrets → Actions)
   - Get free API key from https://www.alchemy.com/
   - Create a new app for Ethereum Mainnet
   - Copy the API key
```

**Step 3: Commit**

```bash
git add .github/workflows/daily-build.yml README.md
git commit -m "feat: add Alchemy API key to GitHub Actions"
```

---

## Task 7: Test Full Integration End-to-End

**Files:**
- None (testing only)

**Step 1: Clear cache and fetch fresh data**

Run:
```bash
rm -f public/data/treasury-snapshot.json
npm run fetch-data
```

Expected: Complete treasury snapshot with ETH balance, NFTs, and holders

**Step 2: Verify JSON structure**

Run: `cat public/data/treasury-snapshot.json | head -50`

Expected output structure:
```json
{
  "timestamp": 1731628800000,
  "ethBalance": 28.5,
  "ethPrice": 3400,
  "stablecoins": {},
  "tokens": [],
  "nfts": [
    {
      "name": "Collection Name",
      "contractAddress": "0x...",
      "quantity": 2,
      "floorPrice": 30.5
    }
  ],
  "holders": [
    {
      "address": "0x...",
      "balance": 1500000,
      "percentage": 15.5
    }
  ],
  "totalSupply": 10000000
}
```

**Step 3: Start dev server and verify UI**

Run: `npm run dev`
Open: http://localhost:5173

Verify:
- Total treasury value includes NFT value
- NFT breakdown shows collections with floor prices
- Holders list shows top holders with percentages

**Step 4: Check console for errors**

Expected: No errors in browser console or terminal

**Step 5: No commit needed** (testing only)

---

## Task 8: Add Documentation for API Keys

**Files:**
- Modify: `SETUP.md`

**Step 1: Update SETUP.md with all API key requirements**

Add comprehensive API key section:

```markdown
## API Keys Required

This dashboard requires three API keys:

### 1. Etherscan API Key (Required)
- **Purpose:** Fetch ETH balances and token holder data
- **Get it:** https://etherscan.io/apis
- **Cost:** Free tier (5 calls/second)
- **Setup:** Add to `.env` as `ETHERSCAN_API_KEY=your_key_here`

### 2. Alchemy API Key (Required for NFTs)
- **Purpose:** Fetch NFT inventory and floor prices
- **Get it:** https://www.alchemy.com/
- **Cost:** Free tier (300M compute units/month)
- **Setup:**
  1. Create account at Alchemy
  2. Create new app for "Ethereum Mainnet"
  3. Copy API key
  4. Add to `.env` as `ALCHEMY_API_KEY=your_key_here`

### 3. CoinGecko API Key (Optional)
- **Purpose:** Fetch ETH/USD price
- **Get it:** https://www.coingecko.com/en/api
- **Cost:** Free (rate limited) or Pro ($129/mo)
- **Setup:** Add to `.env` as `COINGECKO_API_KEY=your_key_here`
- **Note:** Works without key, but rate limits are stricter

## Troubleshooting

### "ALCHEMY_API_KEY not set" warning
- NFTs will not be fetched
- Dashboard will show "0 NFT collections"
- Get free API key from https://www.alchemy.com/

### "Failed to fetch token holders" error
- Check Etherscan API key is valid
- Verify you haven't exceeded rate limits (5 calls/second)
- Consider using The Graph for production

### Rate limit errors
- Add delays between API calls (currently 200ms)
- Consider upgrading to paid tiers for production use
```

**Step 2: Commit**

```bash
git add SETUP.md
git commit -m "docs: add comprehensive API key documentation"
```

---

## Task 9: Final Verification and Commit

**Files:**
- All modified files

**Step 1: Run full test**

```bash
rm -rf public/data/treasury-snapshot.json
npm run fetch-data
npm run dev
```

Expected: Dashboard loads with real NFT and holder data

**Step 2: Verify calculations**

In browser console, verify:
- Total treasury value = ETH value + NFT value (quantity × floor price × ETH price)
- Holder percentages sum to ~100%
- Top holder addresses match known addresses

**Step 3: Check for any uncommitted changes**

Run: `git status`
Expected: Working tree clean

**Step 4: Final summary log**

Run: `git log --oneline -10`

Expected commits:
```
docs: add comprehensive API key documentation
feat: add Alchemy API key to GitHub Actions
feat: add error handling and graceful degradation
feat: implement token holder fetching via Etherscan
feat: add NFT floor price fetching via Alchemy
feat: implement NFT fetching with Alchemy SDK
feat: add Alchemy SDK for NFT integration
```

---

## Post-Implementation Notes

**For Doctor Biz:**

1. **Get Alchemy API key:** Visit https://www.alchemy.com/ and create a free account to get an API key for NFT data
2. **Add to GitHub Secrets:** Add `ALCHEMY_API_KEY` to repository secrets for GitHub Actions to work
3. **Test with real data:** Run `npm run fetch-data` after adding API key to see real NFT inventory
4. **The Graph consideration:** For production-grade token holder data, consider implementing The Graph subgraph instead of parsing all transfer events

**Known Limitations:**

- Token holder data built from transfer events may be incomplete if API returns paginated results
- Free Etherscan API has 5 calls/second rate limit
- Alchemy free tier has 300M compute units/month (~300k requests)
- NFT floor prices may be stale or unavailable for illiquid collections

**Future Improvements:**

- Implement The Graph subgraph for comprehensive holder data
- Add caching layer for NFT floor prices (update less frequently)
- Add retry logic with exponential backoff for API failures
- Implement pagination for token transfer events
