import BN from 'bn.js';
import { keccak256 } from 'ethereum-cryptography/keccak';
import _ from 'lodash';

import { normalizeHex32 } from './lib/util';
import {
  DydxAsset,
  DydxMarket,
  NetworkId,
  SyntheticAsset,
} from './types';

export const ALL_ASSETS = Object.values(DydxAsset);
export const COLLATERAL_ASSET = DydxAsset.USDC;
export const SYNTHETIC_ASSETS = _.without(ALL_ASSETS, COLLATERAL_ASSET) as SyntheticAsset[];

/**
 * Mapping from a dYdX market to the synthetic asset for that market.
 */
export const SYNTHETIC_ASSET_MAP: Record<DydxMarket, SyntheticAsset> = {
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

export const COLLATERAL_ASSET_ADDRESS_BY_NETWORK: Record<NetworkId, string> = {
  [NetworkId.MAINNET]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  [NetworkId.ROPSTEN]: '0x8707a5bf4c2842d46b31a405ba41b858c0f876c4',
};

export const COLLATERAL_ASSET_ID_BY_NETWORK_ID: Record<NetworkId, string> = _.mapValues(
  COLLATERAL_ASSET_ADDRESS_BY_NETWORK,
  (address) => makeCollateralAssetId(address),
);

/**
 * Mapping from a synthetic asset to its asset ID.
 */
export const SYNTHETIC_ASSET_ID_MAP: Record<SyntheticAsset, string> = _.chain(SYNTHETIC_ASSETS)
  .keyBy()
  .mapValues(makeSyntheticAssetId)
  .value() as Record<SyntheticAsset, string>;

/**
 * The smallest unit of the asset in the Starkware system, represented in canonical (human) units.
 */
export const ASSET_QUANTUM_SIZE: Record<DydxAsset, string> = _.mapValues(
  ASSET_RESOLUTION,
  (resolution: number) => `1e-${resolution}`,
);

/**
 * Construct the asset ID (as a 0x-prefixed hex string) for the collateral asset, given the address.
 */
function makeCollateralAssetId(
  tokenAddress: string,
  quantization: number | string = 1,
): string {
  const data = Buffer.concat([
    keccak256(Buffer.from('ERC20Token(address)')).slice(0, 4),
    Buffer.from(normalizeHex32(tokenAddress), 'hex'),
    Buffer.from(normalizeHex32(new BN(quantization).toString(16)), 'hex'),
  ]);
  const result = keccak256(data);
  const resultBN = new BN(result.toString('hex'), 16);
  resultBN.imaskn(250);
  return `0x${normalizeHex32(resultBN.toString(16))}`;
}

/**
 * Construct the asset ID (as a 0x-prefixed hex string) for a given synthetic asset.
 */
function makeSyntheticAssetId(
  asset: SyntheticAsset,
): string {
  const assetIdString = `${asset}-${ASSET_RESOLUTION[asset]}`;
  const assetIdHex = Buffer.from(assetIdString).toString('hex').padEnd(30, '0');
  return `0x${assetIdHex}`;
}
