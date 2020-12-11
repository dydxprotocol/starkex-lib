/**
 * Helper functions for converting asset IDs and amounts.
 */

import Big from 'big.js';

import {
  ASSET_ID_MAP,
  ASSET_QUANTUM_SIZE,
  COLLATERAL_ASSET,
  COLLATERAL_ASSET_ID,
  SYNTHETIC_ASSET_MAP,
} from '../constants';
import {
  WithPrice,
  WithQuoteAmount,
  DydxAsset,
  StarkwareOrderSide,
  StarkwareAmounts,
  DydxMarket,
} from '../types';

/**
 * Convert a human-readable asset amount to an integer amount of the asset's quantum size.
 *
 * Optionally, throw if the provided value is not a multiple of the quantum size.
 *
 * Example:
 *   Suppose the quantum size in Starkware for synthetic ETH is 10^12 (1000 Gwei).
 *   Then humanAmountToQuantums(0.01), representing 0.01 ETH, will return a value of 10,000.
 */
export function toQuantums(
  humanAmount: string,
  asset: DydxAsset,
  assertIntegerResult: boolean = true,
): string {
  const amountBig = new Big(humanAmount);
  const quantumSize = ASSET_QUANTUM_SIZE[asset];
  const remainder = amountBig.mod(quantumSize);
  if (assertIntegerResult && !remainder.eq(0)) {
    throw new Error(
      `toQuantums: Amount ${humanAmount} is not a multiple of the quantum size ${quantumSize}`,
    );
  }
  return amountBig.div(quantumSize).toFixed(0);
}

/**
 * Convert a number of quantums to a human-readable asset amount.
 *
 * Example:
 *   Suppose the quantum size in Starkware for synthetic ETH is 10^12 (1000 Gwei).
 *   Then fromQuantums(100), representing 100,000 Gwei, will return a value of 0.0001.
 */
export function fromQuantums(
  quantumAmount: string,
  asset: DydxAsset,
): string {
  return new Big(quantumAmount).mul(ASSET_QUANTUM_SIZE[asset]).toFixed();
}

/**
 * Get Starkware order fields, given paramters from an order and/or fill.
 *
 * Must provide either quoteAmount or price.
 */
export function getStarkwareAmounts(
  params: {
    market: DydxMarket,
    side: StarkwareOrderSide,
    humanSize: string,
  } & (WithPrice | WithQuoteAmount),
): StarkwareAmounts {
  const {
    market, side, humanSize, humanQuoteAmount, humanPrice,
  } = params;

  // Determine side and assets.
  const isBuyingSynthetic = side === StarkwareOrderSide.BUY;
  const syntheticAsset = SYNTHETIC_ASSET_MAP[market];
  const assetIdSynthetic = ASSET_ID_MAP[syntheticAsset];
  if (!assetIdSynthetic) {
    throw new Error(`Unknown market ${market}`);
  }

  // Determine amounts.
  const humanCost = typeof humanQuoteAmount === 'string'
    ? humanQuoteAmount
    : new Big(humanSize).times(humanPrice!).toFixed(); // Non-null assertion safe based on types.
  const quantumsAmountSynthetic = toQuantums(humanSize, syntheticAsset);
  const quantumsAmountCollateral = toQuantums(humanCost, COLLATERAL_ASSET, false);

  return {
    quantumsAmountSynthetic,
    quantumsAmountCollateral,
    assetIdSynthetic,
    assetIdCollateral: COLLATERAL_ASSET_ID,
    isBuyingSynthetic,
  };
}
