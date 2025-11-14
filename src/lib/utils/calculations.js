// ABOUTME: Treasury value and share calculation functions
// ABOUTME: Implements core business logic for value computations

import { BUY_IN_RATE } from '../../config.js';

/**
 * Calculate holder's share percentage
 */
export function calculateSharePercent(holderBalance, totalSupply) {
  if (!totalSupply || totalSupply === 0) return 0;
  return (holderBalance / totalSupply) * 100;
}

/**
 * Calculate holder's share value
 */
export function calculateShareValue(holderBalance, totalSupply, treasuryValue) {
  if (!totalSupply || totalSupply === 0) return 0;
  return treasuryValue * (holderBalance / totalSupply);
}

/**
 * Calculate ETH paid at buy-in
 */
export function calculateBuyInETH(tokenBalance) {
  return tokenBalance / BUY_IN_RATE;
}

/**
 * Calculate USD value at buy-in
 */
export function calculateBuyInUSD(tokenBalance, ethPriceAtBuyIn) {
  const ethPaid = calculateBuyInETH(tokenBalance);
  return ethPaid * ethPriceAtBuyIn;
}

/**
 * Calculate change percentage
 */
export function calculateChangePercent(currentValue, buyInValue) {
  if (!buyInValue || buyInValue === 0) return 0;
  return ((currentValue - buyInValue) / buyInValue) * 100;
}

/**
 * Calculate total NFT collection value
 */
export function calculateNFTCollectionValue(quantity, floorPrice) {
  return quantity * floorPrice;
}

/**
 * Sum array of values
 */
export function sum(values) {
  return values.reduce((acc, val) => acc + val, 0);
}
