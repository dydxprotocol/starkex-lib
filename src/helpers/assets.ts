/**
 * Helper functions for converting asset IDs and amounts.
 */

import Big, { RoundingMode } from 'big.js';

import {
  ASSET_QUANTUM_SIZE,
  COLLATERAL_ASSET,
  COLLATERAL_ASSET_ID_BY_NETWORK_ID,
  SYNTHETIC_ASSET_ID_MAP,
  SYNTHETIC_ASSET_MAP,
} from '../constants';
import {
  WithPrice,
  WithQuoteAmount,
  DydxAsset,
  StarkwareOrderSide,
  StarkwareAmounts,
  DydxMarket,
  NetworkId,
} from '../types';

/**
 * Convert a human-readable asset amount to an integer amount of the asset's quantum size.
 *
 * If the provided value is not a multiple of the quantum size, throw an error.
 */
export function toQuantumsExact(
  humanAmount: string,
  asset: DydxAsset,
): string {
  return toQuantumsHelper(humanAmount, asset, RoundingMode.RoundDown, true);
}

/**
 * Convert a human-readable asset amount to an integer amount of the asset's quantum size.
 *
 * If the provided value is not a multiple of the quantum size, round down.
 */
export function toQuantumsRoundDown(
  humanAmount: string,
  asset: DydxAsset,
): string {
  return toQuantumsHelper(humanAmount, asset, RoundingMode.RoundDown, false);
}

/**
 * Convert a human-readable asset amount to an integer amount of the asset's quantum size.
 *
 * If the provided value is not a multiple of the quantum size, round up.
 */
export function toQuantumsRoundUp(
  humanAmount: string,
  asset: DydxAsset,
): string {
  return toQuantumsHelper(humanAmount, asset, RoundingMode.RoundUp, false);
}

function toQuantumsHelper(
  humanAmount: string,
  asset: DydxAsset,
  rm: RoundingMode,
  assertIntegerResult: boolean,
): string {
  const amountBig = new Big(humanAmount);
  const quantumSize = ASSET_QUANTUM_SIZE[asset];
  const remainder = amountBig.mod(quantumSize);
  if (assertIntegerResult && !remainder.eq(0)) {
    throw new Error(
      `toQuantums: Amount ${humanAmount} is not a multiple of the quantum size ${quantumSize}`,
    );
  }
  return amountBig.div(quantumSize).round(0, rm).toFixed(0);
}

/**
 * Convert a number of quantums to a human-readable asset amount.
 *
 * Example:
 *   Suppose the quantum size in Starkware for synthetic ETH is 10^10 (10 Gwei).
 *   Then fromQuantums(1000, DydxAsset.ETH), representing 10,000 Gwei, returns a value of 0.00001.
 */
export function fromQuantums(
  quantumAmount: string,
  asset: DydxAsset,
): string {
  const quantumSize = ASSET_QUANTUM_SIZE[asset];
  if (!quantumSize) {
    throw new Error(`Unknown asset ${asset}`);
  }
  return new Big(quantumAmount).mul(quantumSize).toFixed();
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
  networkId: NetworkId,
): StarkwareAmounts {
  const {
    market, side, humanSize, humanQuoteAmount, humanPrice,
  } = params;

  // Determine side and assets.
  const isBuyingSynthetic = side === StarkwareOrderSide.BUY;
  const syntheticAsset = SYNTHETIC_ASSET_MAP[market];
  const assetIdSynthetic = SYNTHETIC_ASSET_ID_MAP[syntheticAsset];
  if (!assetIdSynthetic) {
    throw new Error(`Unknown market ${market}`);
  }

  // Convert the synthetic amount to Starkware quantums.
  const quantumsAmountSynthetic = toQuantumsExact(humanSize, syntheticAsset);

  // Get the human-readable collateral asset amount (a.k.a. "quote amount").
  const humanAmountCollateral = typeof humanQuoteAmount === 'string'
    ? humanQuoteAmount
    : new Big(humanSize).times(humanPrice!).toFixed(); // Non-null assertion safe based on types.

  // If quoteAmount was specified, don't allow rounding.
  // Otherwise, round differently depending on the order side.
  let toQuantumsFnForCost = toQuantumsExact;
  if (typeof humanQuoteAmount !== 'string') {
    toQuantumsFnForCost = isBuyingSynthetic
      ? toQuantumsRoundUp
      : toQuantumsRoundDown;
  }
  const quantumsAmountCollateral = toQuantumsFnForCost(humanAmountCollateral, COLLATERAL_ASSET);

  return {
    quantumsAmountSynthetic,
    quantumsAmountCollateral,
    assetIdSynthetic,
    assetIdCollateral: COLLATERAL_ASSET_ID_BY_NETWORK_ID[networkId],
    isBuyingSynthetic,
  };
}

/**
 * Convert a limit fee fraction for an order into a collateral quantums amount.
 */
export function getStarkwareLimitFeeAmount(
  limitFee: string,
  quantumsAmountCollateral: string,
): string {
  // Constrain the limit fee to six decimals of precision. The final fee amount must be rounded up.
  return new Big(limitFee)
    .round(6, RoundingMode.RoundDown)
    .times(quantumsAmountCollateral)
    .round(0, RoundingMode.RoundUp)
    .toFixed(0);
}
