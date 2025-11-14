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
