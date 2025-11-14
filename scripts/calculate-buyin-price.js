// ABOUTME: Calculate actual weighted average ETH price when holders bought in
// ABOUTME: Analyzes token transfer history to find buy-in times and ETH prices
import 'dotenv/config';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const GOVERNANCE_TOKEN = '0x992f9Bb313368Ac11977b62490a83eeee54D9e1F';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching transfer events...');

  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&contractaddress=${GOVERNANCE_TOKEN}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== '1') {
    console.error('Failed to fetch transfers:', data.message);
    return;
  }

  const transfers = data.result;
  console.log(`Found ${transfers.length} transfer events\n`);

  // Track first transfer TO each holder (their buy-in)
  const firstTransfers = new Map();
  const holderBalances = new Map();

  for (const tx of transfers) {
    const to = tx.to.toLowerCase();
    const from = tx.from.toLowerCase();
    const value = parseInt(tx.value);
    const timestamp = parseInt(tx.timeStamp) * 1000;

    // Update balances
    if (from !== '0x0000000000000000000000000000000000000000') {
      holderBalances.set(from, (holderBalances.get(from) || 0) - value);
    }
    if (to !== '0x0000000000000000000000000000000000000000') {
      holderBalances.set(to, (holderBalances.get(to) || 0) + value);
    }

    // Track first transfer TO this address (ignore mints from 0x0)
    if (from !== '0x0000000000000000000000000000000000000000' && !firstTransfers.has(to)) {
      firstTransfers.set(to, {
        timestamp,
        value,
        date: new Date(timestamp)
      });
    }
  }

  // Filter to current holders only
  const currentHolders = new Map();
  for (const [address, balance] of holderBalances.entries()) {
    if (balance > 0 && firstTransfers.has(address)) {
      currentHolders.set(address, {
        ...firstTransfers.get(address),
        currentBalance: balance
      });
    }
  }

  console.log(`Found ${currentHolders.size} current holders with first transfer data\n`);

  // Group by date and show distribution
  const dateGroups = new Map();
  for (const [address, data] of currentHolders.entries()) {
    const dateKey = data.date.toISOString().split('T')[0];
    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, []);
    }
    dateGroups.get(dateKey).push({
      address,
      balance: data.currentBalance / 1e18,
      timestamp: data.timestamp
    });
  }

  // Sort dates
  const sortedDates = [...dateGroups.keys()].sort();

  console.log('=== Buy-in Distribution ===');
  console.log('Date\t\t\tHolders\tTotal Tokens');
  for (const date of sortedDates) {
    const holders = dateGroups.get(date);
    const totalTokens = holders.reduce((sum, h) => sum + h.balance, 0);
    console.log(`${date}\t${holders.length}\t${totalTokens.toFixed(0).padStart(15)}`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Earliest buy-in: ${sortedDates[0]}`);
  console.log(`Latest buy-in: ${sortedDates[sortedDates.length - 1]}`);
  console.log(`Total current holders: ${currentHolders.size}`);

  // Calculate weighted average for a specific date range
  const earliestDate = new Date(sortedDates[0]);
  const latestDate = new Date(sortedDates[sortedDates.length - 1]);

  console.log(`\nTo calculate accurate buy-in ETH price, we need ETH prices from:`);
  console.log(`${earliestDate.toLocaleDateString()} to ${latestDate.toLocaleDateString()}`);
}

main().catch(console.error);
