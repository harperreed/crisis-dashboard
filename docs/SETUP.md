# Setup Guide

## Prerequisites

- Node.js 20+
- npm or yarn
- Vercel account
- API keys (Etherscan, CoinGecko)

## Local Development

1. Clone repository
2. Copy `.env.example` to `.env`
3. Add your API keys to `.env`
4. Run `npm install`
5. Run `npm run fetch-data` to generate initial data
6. Run `npm run dev` to start dev server

## GitHub Secrets

Add these secrets to your GitHub repository:

- `ETHERSCAN_API_KEY` - From https://etherscan.io/apis
- `COINGECKO_API_KEY` - From https://www.coingecko.com/en/api
- `VERCEL_TOKEN` - From Vercel account settings
- `VERCEL_ORG_ID` - From Vercel project settings
- `VERCEL_PROJECT_ID` - From Vercel project settings

## Vercel Setup

1. Create new project on Vercel
2. Connect GitHub repository
3. Framework preset: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Copy project ID and org ID to GitHub secrets

## Testing Deployment

Manually trigger GitHub Actions workflow to test:
1. Go to Actions tab
2. Select "Daily Treasury Update"
3. Click "Run workflow"
