import {
  DydxAsset,
  DydxMarket,
} from './types';

export const COLLATERAL_ASSET = DydxAsset.USDC;

export const ASSET_ID_MAP: Record<DydxAsset, string> = {
  [DydxAsset.USDC]: '0x24d6ea88d53b68601dcf03b3f204cbe829d3689194f823bd6a7f74292c22334',
  [DydxAsset.BTC]: '0x0',
  [DydxAsset.ETH]: '0x1',
  [DydxAsset.LINK]: '0x2',
};
export const COLLATERAL_ASSET_ID = ASSET_ID_MAP[COLLATERAL_ASSET];

export const SYNTHETIC_ASSET_MAP: Record<DydxMarket, DydxAsset> = {
  [DydxMarket.BTC_USD]: DydxAsset.BTC,
  [DydxMarket.ETH_USD]: DydxAsset.ETH,
  [DydxMarket.LINK_USD]: DydxAsset.LINK,
};

// Asset signed by oracle price signers.
export const SIGNED_ASSET_ID_MAP: Record<DydxMarket, string> = {
  [DydxMarket.BTC_USD]: '0x425443555344000000000000000000004d616b6572',
  [DydxMarket.ETH_USD]: '0x455448555344000000000000000000004d616b6572',
  [DydxMarket.LINK_USD]: '0xf2',
};

/**
 * The value of one quantum of the asset in the Starkware system, represented in token base units.
 */
export const ASSET_QUANTIZATION: Record<DydxAsset, number> = {
  [DydxAsset.USDC]: 0x10000000000,
  [DydxAsset.BTC]: 0x2540be400,
  [DydxAsset.ETH]: 0x5f5e100,
  [DydxAsset.LINK]: 0x989680,
};

/**
 * Decimals used by the token in its native representation, determining the size of its base unit.
 *
 * This can be used to convert between “human-readable” units (1 ETH, 1 BTC...) and base units.
 */
export const ASSET_TOKEN_DECIMALS: Record<DydxAsset, number> = {
  [DydxAsset.USDC]: 14, // TODO: Update after Starkware changes the quantization on their end.
  [DydxAsset.BTC]: 8,
  [DydxAsset.ETH]: 18,
  [DydxAsset.LINK]: 18,
};
