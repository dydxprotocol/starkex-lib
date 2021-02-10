import _ from 'lodash';

import {
  DydxAsset,
  DydxMarket,
  SyntheticAsset,
} from './types';

export const ALL_ASSETS = Object.values(DydxAsset);
export const COLLATERAL_ASSET = DydxAsset.USDC;
export const SYNTHETIC_ASSETS = _.without(ALL_ASSETS, COLLATERAL_ASSET) as SyntheticAsset[];

/**
 * Mapping from a dYdX market to the synthetic asset for that market.
 */
export const SYNTHETIC_ASSET_MAP: Record<DydxMarket, DydxAsset> = {
  [DydxMarket.BTC_USD]: DydxAsset.BTC,
  [DydxMarket.ETH_USD]: DydxAsset.ETH,
  [DydxMarket.LINK_USD]: DydxAsset.LINK,
};

/**
 * The resolution represents the number of decimals of precision used in the Starkware system.
 *
 * For example, a resolution of 9 for ETH means that 1e-9 ETH = 1 Gwei is the smallest unit.
 */
export const ASSET_RESOLUTION: Record<DydxAsset, number> = {
  [DydxAsset.USDC]: 6,
  [DydxAsset.BTC]: 10,
  [DydxAsset.ETH]: 9,
  [DydxAsset.LINK]: 7,
};

// TODO: The collateral asset ID depends on the network.
export const COLLATERAL_ASSET_ID = (
  '0x02c04d8b650f44092278a7cb1e1028c82025dff622db96c934b611b84cc8de5a'
);

/**
 * Mapping from a synthetic asset to its asset ID.
 */
export const SYNTHETIC_ASSET_ID_MAP: Record<SyntheticAsset, string> = _.chain(SYNTHETIC_ASSETS)
  .keyBy()
  .mapValues(makeSyntheticAssetId)
  .value() as Record<SyntheticAsset, string>;

/**
* Mapping from an asset to its asset ID.
*/
export const ASSET_ID_MAP: Record<DydxAsset, string> = {
  [COLLATERAL_ASSET]: COLLATERAL_ASSET_ID,
  ...SYNTHETIC_ASSET_ID_MAP,
};

/**
 * The smallest unit of the asset in the Starkware system, represented in canonical (human) units.
 */
export const ASSET_QUANTUM_SIZE: Record<DydxAsset, string> = _.mapValues(
  ASSET_RESOLUTION,
  (resolution: number) => `1e-${resolution}`,
);

/**
 * Construct the asset ID (as a 0x-prefixed hex string) for a given asset.
 */
function makeSyntheticAssetId(
  asset: SyntheticAsset,
): string {
  const assetIdString = `${asset}-${ASSET_RESOLUTION[asset]}`;
  const assetIdHex = Buffer.from(assetIdString).toString('hex').padEnd(30, '0');
  return `0x${assetIdHex}`;
}
