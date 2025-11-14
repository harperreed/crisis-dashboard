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
```

## Deployment

Dashboard deploys automatically to Vercel via GitHub Actions:
- Daily at midnight UTC
- On every push to main
- Manual trigger available

## License

MIT
