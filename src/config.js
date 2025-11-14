// ABOUTME: Application configuration constants for addresses and rates
// ABOUTME: Central location for all blockchain addresses and buy-in calculations

export const ADDRESSES = {
  mainSafe: '0x2f61cD8f256eF199cE0cd3094Bdce77F1B7e91f5',
  hotSafe: '0x3d321A75Ca6666A23ca3D68C94f317C0190868DA',
  governanceToken: '0x992f9Bb313368Ac11977b62490a83eeee54D9e1F'
};

export const BUY_IN_RATE = 1_000_000; // tokens per 1 ETH
export const BUY_IN_ETH_PRICE = 2600; // Actual ETH price in June 2021 when most holders bought in

export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export const API_ENDPOINTS = {
  etherscan: 'https://api.etherscan.io/api',
  opensea: 'https://api.opensea.io/api/v2',
  coingecko: 'https://api.coingecko.com/api/v3'
};
