# DAO Treasury Dashboard Design

**Date:** November 14, 2025
**Purpose:** Show DAO members treasury value and their share to re-engage disengaged holders

## Problem Statement

The DAO launched in 2021. Four years later, complexity has grown and engagement has dropped. Members cannot see treasury value or their share. This dashboard makes treasury transparent and accessible.

## Core Requirements

1. Show total treasury value
2. Show each holder's share of the value
3. Show value at time of buy-in
4. Toggle display between ETH and USD

## Technical Decisions

### Architecture

Client-side single page app. No backend. Static files hosted on Vercel.

**Why:** Treasury data changes slowly (daily at most). A static site with build-time data fetching eliminates API rate limits for visitors, loads instantly, and costs nothing to run.

**Data strategy:**
- GitHub Actions fetches data daily at midnight UTC
- Builds static JSON snapshot and deploys to Vercel
- Visitors load pre-built data instantly
- Optional: Users who connect wallets can fetch live data

### Technology Stack

- **Svelte 4** - Minimal boilerplate, reactive by default, compiles to tiny bundle
- **Vite 5** - Fast build tool
- **Tailwind CSS** - Utility-first, keeps styling minimal
- **Ethers.js** - Web3 library for blockchain data

### Data Sources

#### Blockchain Data (Etherscan API - free tier)
- Wallet balances: Main Safe (0x2f61cD8f256eF199cE0cd3094Bdce77F1B7e91f5)
- Wallet balances: Hot Safe (0x3d321A75Ca6666A23ca3D68C94f317C0190868DA)
- Token holders: Governance token (0x992f9Bb313368Ac11977b62490a83eeee54D9e1F)
- API keys stored in GitHub Secrets

#### NFT Data (OpenSea API - keyless endpoints)
- NFT inventory in both Safes
- Floor prices for all collections
- Fallback to Reservoir API if rate-limited

#### Price Data (CoinGecko - free tier)
- Current ETH/USD price
- Historical ETH prices for buy-in calculations

**Rate limit strategy:**
- Build script runs at midnight, not on user visits
- Sequential requests with 200ms delays
- Cache aggressively in localStorage (24 hours)
- Show "Last updated X hours ago" timestamp

## User Interface

### Layout (Clean & Minimal)

Single page, mobile responsive:

**Header**
- Title: "DAO Treasury Dashboard"
- Currency toggle (Ξ/💵)
- Refresh button
- Last updated timestamp

**Total Treasury Value**
- Large display: $X,XXX,XXX or Ξ XXX
- Breakdown:
  - ETH/Stablecoins: $XXX,XXX
  - ERC-20 Tokens: $XXX,XXX (top 5 listed)
  - NFTs: $XXX,XXX (X total)

**NFT Details**
- Sorted by value (quantity × floor price)
- Top 3-5 collections shown separately
- Remaining grouped as "Other NFTs"
- Format: "Collection Name: 3 @ Ξ12 = $36,000"

**Your Share (if wallet connected)**
- Token balance: XXX,XXX tokens (X.XX%)
- Current value: $XX,XXX or Ξ XX
- Value at buy-in: $XX,XXX
- Change: +X% or -X%

**Top Holders Table**
- Shows top 10
- Columns: Address | Tokens | % | Share Value

### Wallet Connection

Optional. Users who connect see:
- Their row highlighted in holders table
- "Your Share" section with personalized data
- Option to fetch live data instead of daily snapshot

## Calculations

### Total Treasury Value

```
Total = ETH + Stablecoins + ERC-20s + NFTs

Where:
  ETH = (mainSafe.balance + hotSafe.balance) × ETH/USD
  Stablecoins = USDC + USDT + DAI
  ERC-20s = Σ(balance × price) for each token
  NFTs = Σ(quantity × floor price) for each collection
```

### Per-Holder Share

```
totalSupply = governance token total supply
holderBalance = tokens held by address

Share % = (holderBalance / totalSupply) × 100
Share Value = Total Treasury × (holderBalance / totalSupply)
```

### Buy-In Value

**Buy-in rate:** 1 ETH per 1,000,000 tokens

```
ETH paid = holderTokens / 1,000,000
Buy-in USD = ETH paid × (ETH/USD price at mint date)

Note: Use average mint date or query token transfer events for exact dates
```

### NFT Valuation

- Query OpenSea for collection floor price
- Calculate: quantity held × floor price
- Sort by total value descending
- Show top 3-5 separately, group rest as "Other"
- If floor unavailable: show count only, mark "Price unknown"

## Error Handling

### Loading States
- Show skeleton UI (gray boxes)
- Display "Fetching treasury data..."
- Load progressively: ETH → Tokens → NFTs
- Each section appears as data arrives

### Graceful Degradation
- If Etherscan fails → "Unable to fetch wallet balances"
- If OpenSea fails → Show NFT count without prices
- If CoinGecko fails → Use last cached price with timestamp
- If all fail → Show cached data with warning banner

### User Messages
- ✅ "Data updated 2 minutes ago"
- ⚠️ "Using cached data from 3 hours ago"
- ⚠️ "NFT floor prices unavailable. Showing count only."
- ⚠️ "API limit reached. Try again in 5 minutes."

### Offline Detection
- "No internet connection. Showing cached data."
- Timeout after 10 seconds → "API request timed out. Try again."

## File Structure

```
crisis-dashboard/
├── .github/
│   └── workflows/
│       └── daily-build.yml          # Midnight UTC data fetch + deploy
├── scripts/
│   └── fetch-treasury-data.js       # Node.js data fetcher
├── public/
│   └── data/
│       └── treasury-snapshot.json   # Pre-fetched data
├── src/
│   ├── App.svelte                   # Main component
│   ├── lib/
│   │   ├── api/
│   │   │   ├── etherscan.js
│   │   │   ├── opensea.js
│   │   │   ├── coingecko.js
│   │   │   └── web3.js
│   │   ├── stores/
│   │   │   ├── treasury.js          # Svelte store
│   │   │   ├── currency.js          # ETH/USD toggle
│   │   │   └── cache.js             # localStorage
│   │   ├── utils/
│   │   │   ├── calculations.js
│   │   │   └── formatters.js
│   │   └── components/
│   │       ├── TreasuryTotal.svelte
│   │       ├── Breakdown.svelte
│   │       ├── YourShare.svelte
│   │       └── HoldersList.svelte
│   ├── config.js                    # Constants (addresses, rates)
│   ├── main.js
│   └── app.css
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Constants (config.js)

```javascript
export const ADDRESSES = {
  mainSafe: '0x2f61cD8f256eF199cE0cd3094Bdce77F1B7e91f5',
  hotSafe: '0x3d321A75Ca6666A23ca3D68C94f317C0190868DA',
  governanceToken: '0x992f9Bb313368Ac11977b62490a83eeee54D9e1F'
};

export const BUY_IN_RATE = 1_000_000; // tokens per 1 ETH
export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

## Deployment

### Hosting (Vercel)
- Connect GitHub repository
- Auto-deploys on push to main
- Environment variables for API keys
- Free tier sufficient

### GitHub Actions
```yaml
# .github/workflows/daily-build.yml
name: Daily Treasury Update
on:
  schedule:
    - cron: '0 0 * * *'  # Midnight UTC
  workflow_dispatch:      # Manual trigger

env:
  ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
  COINGECKO_API_KEY: ${{ secrets.COINGECKO_API_KEY }}
```

## Testing Strategy

Manual testing for v1:
- Load dashboard → verify numbers look sane
- Toggle ETH/USD → verify updates correctly
- Refresh button → verify fetches new data
- Connect wallet → verify highlights address
- Mobile view → verify readable on phone

Add automated tests later if complexity grows.

## Implementation Phases

### Phase 1: Core Dashboard
1. Set up Svelte + Vite project
2. Create config with addresses
3. Build data fetching script
4. Create static treasury snapshot
5. Build UI components
6. Implement calculations
7. Add currency toggle

### Phase 2: Automation
1. Create GitHub Actions workflow
2. Add environment variables
3. Test daily build
4. Deploy to Vercel

### Phase 3: Polish
1. Add wallet connection
2. Implement error handling
3. Add loading states
4. Mobile responsive styling
5. Test on multiple devices

## Edge Cases

- **Tokens with no liquidity** → Show "No price data"
- **NFTs with zero floor** → Flag as "Illiquid"
- **Safe has pending transactions** → Ignore, show settled state only
- **Multiple mints at different dates** → Use average or query transfers for exact dates

## Success Criteria

Dashboard succeeds when:
1. Any DAO member can visit and see current treasury value
2. Any member can see their share and change since buy-in
3. Data loads instantly (< 100ms)
4. Daily updates happen automatically
5. Mobile-friendly and accessible
