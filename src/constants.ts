import {
  DydxAsset,
  DydxMarket,
} from './types';

export const COLLATERAL_ASSET = DydxAsset.USDC;

export const ASSET_ID_MAP: Record<DydxAsset, string> = {
  [DydxAsset.USDC]: '0x02c04d8b650f44092278a7cb1e1028c82025dff622db96c934b611b84cc8de5a',
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
 * The smallest unit of the asset in the Starkware system, represented in canonical (human) units.
 */
export const ASSET_QUANTUM_SIZE: Record<DydxAsset, string> = {
  [DydxAsset.USDC]: '1e-6',
  [DydxAsset.BTC]: '1e-10',
  [DydxAsset.ETH]: '1e-8',
  [DydxAsset.LINK]: '1e-7',
};
