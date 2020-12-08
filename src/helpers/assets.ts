/**
 * Helper functions for converting asset IDs and amounts.
 */

import Big from 'big.js';

import {
  ASSET_ID_MAP,
  ASSET_QUANTIZATION,
  ASSET_TOKEN_DECIMALS,
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
 * Convert a base unit synthetic token amount to an integer amount of the token's quantum size.
 *
 * Optionally, throw if the provided value is not a multiple of the quantum size.
 *
 * Example:
 *   Suppose the quantum size in Starkware for synthetic ETH is 10^10 (10 Gwei).
 *   Then toQuantums(10^16), representing 0.01 ETH, will return a value of 10^6.
 */
export function baseAmountToQuantums(
  baseUnitAmount: string,
  asset: DydxAsset,
  assertIntegerResult: boolean = true,
): string {
  const amountBN = new Big(baseUnitAmount);
  const quantumSize = ASSET_QUANTIZATION[asset];
  const remainder = amountBN.mod(quantumSize);
  if (assertIntegerResult && !remainder.eq(0)) {
    throw new Error(
      `toQuantums: Amount ${amountBN} is not a multiple of the quantum size ${quantumSize}`,
    );
  }
  return amountBN.div(quantumSize).toFixed(0);
}

/**
 * Convert a number of quantums to the base unit of the token.
 *
 * Example:
 *   Suppose the quantum size in Starkware for synthetic ETH is 10^10 (10 Gwei).
 *   Then fromQuantums(100), representing 1000 Gwei, will return a value of 10^12.
 */
export function baseAmountFromQuantums(
  quantumAmount: string,
  asset: DydxAsset,
): string {
  return new Big(quantumAmount).mul(ASSET_QUANTIZATION[asset]).toFixed();
}

/**
 * Convert a human-readable token amount to an integer amount of the token's quantum size.
 *
 * Optionally, throw if the provided value is not a multiple of the quantum size.
 *
 * Example:
 *   Suppose the quantum size in Starkware for synthetic ETH is 10^10 (10 Gwei).
 *   Then humanAmountToQuantums(0.01), representing 0.01 ETH, will return a value of 10^6.
 */
export function humanAmountToQuantums(
  humanAmount: string,
  asset: DydxAsset,
  assertIntegerResult: boolean = true,
): string {
  const baseAmount = new Big(humanAmount);
  baseAmount.e += ASSET_TOKEN_DECIMALS[asset]; // Shift by power of 10 to get amount in base units.
  return baseAmountToQuantums(baseAmount.toFixed(), asset, assertIntegerResult);
}

/**
 * Convert a number of quantums to a human-readable token amount.
 *
 * Example:
 *   Suppose the quantum size in Starkware for synthetic ETH is 10^10 (10 Gwei).
 *   Then fromQuantums(100), representing 1000 Gwei, will return a value of 0.000001.
 */
export function humanAmountFromQuantums(
  quantumAmount: string,
  asset: DydxAsset,
): string {
  const baseAmount = new Big(baseAmountFromQuantums(quantumAmount, asset));
  baseAmount.e -= ASSET_TOKEN_DECIMALS[asset]; // Shift by power of 10 to get human readable amount.
  return baseAmount.toFixed();
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
  const quantumsAmountSynthetic = humanAmountToQuantums(humanSize, syntheticAsset);
  const quantumsAmountCollateral = humanAmountToQuantums(humanCost, COLLATERAL_ASSET, false);

  return {
    quantumsAmountSynthetic,
    quantumsAmountCollateral,
    assetIdSynthetic,
    assetIdCollateral: COLLATERAL_ASSET_ID,
    isBuyingSynthetic,
  };
}
