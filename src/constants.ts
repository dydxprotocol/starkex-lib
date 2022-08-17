import BN from 'bn.js';
import { keccak256 } from 'ethereum-cryptography/keccak';
import _ from 'lodash';

import { normalizeHex32 } from './lib/util';
import {
  Flash1Asset,
  Flash1Market,
  NetworkId,
  SyntheticAsset,
} from './types';

export const ALL_ASSETS = Object.values(Flash1Asset);
export const COLLATERAL_ASSET = Flash1Asset.USDC;
export const SYNTHETIC_ASSETS = _.without(ALL_ASSETS, COLLATERAL_ASSET) as SyntheticAsset[];

/**
 * Mapping from a dYdX market to the synthetic asset for that market.
 */
export const SYNTHETIC_ASSET_MAP: Record<Flash1Market, SyntheticAsset> = {
  [Flash1Market.BTC_USD]: Flash1Asset.BTC,
  [Flash1Market.ETH_USD]: Flash1Asset.ETH,

  /*
      The following markets are not available yet
  */
  // [Flash1Market.SOL_USD]: Flash1Asset.SOL,
  // [Flash1Market.AVAX_USD]: Flash1Asset.AVAX,
  // [Flash1Market.DOT_USD]: Flash1Asset.DOT,
  // [Flash1Market.DOGE_USD]: Flash1Asset.DOGE,
  // [Flash1Market.ADA_USD]: Flash1Asset.ADA,
  // [Flash1Market.BCH_USD]: Flash1Asset.BCH,
  // [Flash1Market.TRX_USD]: Flash1Asset.TRX,
  // [Flash1Market.ONEINCH_USD]: Flash1Asset.ONEINCH,
  // [Flash1Market.LINK_USD]: Flash1Asset.LINK,
  // [Flash1Market.AAVE_USD]: Flash1Asset.AAVE,
  // [Flash1Market.UNI_USD]: Flash1Asset.UNI,
  // [Flash1Market.SUSHI_USD]: Flash1Asset.SUSHI,
  // [Flash1Market.YFI_USD]: Flash1Asset.YFI,
  // [Flash1Market.ONEINCH_USD]: Flash1Asset.ONEINCH,
  // [Flash1Market.SNX_USD]: Flash1Asset.SNX,
  // [Flash1Market.CRV_USD]: Flash1Asset.CRV,
  // [Flash1Market.UMA_USD]: Flash1Asset.UMA,
  // [Flash1Market.MATIC_USD]: Flash1Asset.MATIC,
  // [Flash1Market.MKR_USD]: Flash1Asset.MKR,
  // [Flash1Market.FIL_USD]: Flash1Asset.FIL,
  // [Flash1Market.ATOM_USD]: Flash1Asset.ATOM,
  // [Flash1Market.COMP_USD]: Flash1Asset.COMP,
  // [Flash1Market.LTC_USD]: Flash1Asset.LTC,
  // [Flash1Market.EOS_USD]: Flash1Asset.EOS,
  // [Flash1Market.ALGO_USD]: Flash1Asset.ALGO,
  // [Flash1Market.ZRX_USD]: Flash1Asset.ZRX,
  // [Flash1Market.XMR_USD]: Flash1Asset.XMR,
  // [Flash1Market.ZEC_USD]: Flash1Asset.ZEC,
  // [Flash1Market.ENJ_USD]: Flash1Asset.ENJ,
  // [Flash1Market.ETC_USD]: Flash1Asset.ETC,
  // [Flash1Market.XLM_USD]: Flash1Asset.XLM,
  // [Flash1Market.XTZ_USD]: Flash1Asset.XTZ,
  // [Flash1Market.HNT_USD]: Flash1Asset.HNT,
  // [Flash1Market.ICP_USD]: Flash1Asset.ICP,
  // [Flash1Market.RUNE_USD]: Flash1Asset.RUNE,
  // [Flash1Market.LUNA_USD]: Flash1Asset.LUNA,
  // [Flash1Market.NEAR_USD]: Flash1Asset.NEAR,
  // [Flash1Market.AR_USD]: Flash1Asset.AR,
  // [Flash1Market.FLOW_USD]: Flash1Asset.FLOW,
  // [Flash1Market.PERP_USD]: Flash1Asset.PERP,
  // [Flash1Market.REN_USD]: Flash1Asset.REN,
  // [Flash1Market.CELO_USD]: Flash1Asset.CELO,
  // [Flash1Market.KSM_USD]: Flash1Asset.KSM,
  // [Flash1Market.BAL_USD]: Flash1Asset.BAL,
  // [Flash1Market.BNT_USD]: Flash1Asset.BNT,
  // [Flash1Market.MIR_USD]: Flash1Asset.MIR,
  // [Flash1Market.SRM_USD]: Flash1Asset.SRM,
  // [Flash1Market.LON_USD]: Flash1Asset.LON,
  // [Flash1Market.DODO_USD]: Flash1Asset.DODO,
  // [Flash1Market.ALPHA_USD]: Flash1Asset.ALPHA,
  // [Flash1Market.WNXM_USD]: Flash1Asset.WNXM,
  // [Flash1Market.XCH_USD]: Flash1Asset.XCH,
};

/**
 * The resolution represents the number of decimals of precision used in the Starkware system.
 *
 * For example, a resolution of 9 for ETH means that 1e-9 ETH = 1 Gwei is the smallest unit.
 */
export const ASSET_RESOLUTION: Record<Flash1Asset, number> = {
  [Flash1Asset.USDC]: 6,
  [Flash1Asset.BTC]: 10,
  [Flash1Asset.ETH]: 9,

  /*
      The following markets are not available yet
  */
  // [Flash1Asset.SOL]: 7,
  // [Flash1Asset.AVAX]: 7,
  // [Flash1Asset.DOT]: 7,
  // [Flash1Asset.DOGE]: 5,
  // [Flash1Asset.ADA]: 6,
  // [Flash1Asset.BCH]: 8,
  // [Flash1Asset.TRX]: 4,
  // [Flash1Asset.LINK]: 7,
  // [Flash1Asset.ONEINCH]: 7,
  // [Flash1Asset.LINK]: 7,
  // [Flash1Asset.AAVE]: 8,
  // [Flash1Asset.UNI]: 7,
  // [Flash1Asset.SUSHI]: 7,
  // [Flash1Asset.YFI]: 10,
  // [Flash1Asset.ONEINCH]: 7,
  // [Flash1Asset.SNX]: 7,
  // [Flash1Asset.CRV]: 6,
  // [Flash1Asset.UMA]: 7,
  // [Flash1Asset.MATIC]: 6,
  // [Flash1Asset.MKR]: 9,
  // [Flash1Asset.FIL]: 7,
  // [Flash1Asset.ATOM]: 7,
  // [Flash1Asset.COMP]: 8,
  // [Flash1Asset.LTC]: 8,
  // [Flash1Asset.EOS]: 6,
  // [Flash1Asset.ALGO]: 6,
  // [Flash1Asset.ZRX]: 6,
  // [Flash1Asset.XMR]: 8,
  // [Flash1Asset.ZEC]: 8,
  // [Flash1Asset.ENJ]: 6,
  // [Flash1Asset.ETC]: 7,
  // [Flash1Asset.XLM]: 5,
  // [Flash1Asset.XTZ]: 6,
  // [Flash1Asset.HNT]: 7,
  // [Flash1Asset.ICP]: 7,
  // [Flash1Asset.RUNE]: 6,
  // [Flash1Asset.LUNA]: 6,
  // [Flash1Asset.NEAR]: 6,
  // [Flash1Asset.AR]: 7,
  // [Flash1Asset.FLOW]: 7,
  // [Flash1Asset.PERP]: 6,
  // [Flash1Asset.REN]: 5,
  // [Flash1Asset.CELO]: 6,
  // [Flash1Asset.KSM]: 8,
  // [Flash1Asset.BAL]: 7,
  // [Flash1Asset.BNT]: 6,
  // [Flash1Asset.MIR]: 6,
  // [Flash1Asset.SRM]: 6,
  // [Flash1Asset.LON]: 6,
  // [Flash1Asset.DODO]: 6,
  // [Flash1Asset.ALPHA]: 5,
  // [Flash1Asset.WNXM]: 7,
  // [Flash1Asset.XCH]: 8,
};

export const COLLATERAL_ASSET_ADDRESS_BY_NETWORK: Record<NetworkId, string> = {
  [NetworkId.MAINNET]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // TODO: change when we know what it is
  [NetworkId.GOERLI]: '0xd44BB808bfE43095dBb94c83077766382D63952a',
  [NetworkId.ROPSTEN]: '0x8707a5bf4c2842d46b31a405ba41b858c0f876c4', // TODO: remove
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

SYNTHETIC_ASSET_ID_MAP[Flash1Asset.BTC] = '0x4254432d3130000000000000000000';
/**
 * The smallest unit of the asset in the Starkware system, represented in canonical (human) units.
 */
export const ASSET_QUANTUM_SIZE: Record<Flash1Asset, string> = _.mapValues(
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
