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
ALCHEMY_API_KEY=your_key_here
```

### API Keys

1. Add `ETHERSCAN_API_KEY` to `.env` and repository secrets (Settings → Secrets → Actions)
   - Get free API key from https://etherscan.io/apis

2. Add `COINGECKO_API_KEY` to `.env` and repository secrets (Settings → Secrets → Actions)
   - Get free API key from https://www.coingecko.com/en/api

3. Add `ALCHEMY_API_KEY` to `.env` and repository secrets (Settings → Secrets → Actions)
   - Get free API key from https://www.alchemy.com/
   - Create a new app for Ethereum Mainnet
   - Copy the API key

## Deployment

Dashboard deploys automatically to Vercel via GitHub Actions:
- Daily at midnight UTC
- On every push to main
- Manual trigger available

## License

MIT
