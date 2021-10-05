/**
 * Helpers related to pedersen hashes.
 */

import BN from 'bn.js';

import {
  COLLATERAL_ASSET_ID_BY_NETWORK_ID,
  SYNTHETIC_ASSET_ID_MAP,
  SYNTHETIC_ASSETS,
} from '../constants';
import { getPedersenHash } from '../lib/crypto';
import { hexToBn } from '../lib/util';
import { NetworkId } from '../types';
import { TRANSFER_FEE_ASSET_ID_BN } from './constants';

// Global state for all STARK signables.
const CACHE: Record<string, Record<string, BN>> = {};

/**
 * Calculate a pedersen hash with commonly used parameters. The hash will be cached.
 */
export async function getCacheablePedersenHash(left: BN, right: BN): Promise<BN> {
  const leftString = left.toString(16);
  const rightString = right.toString(16);
  if (CACHE[leftString] === undefined) {
    CACHE[leftString] = {};
  }
  if (CACHE[leftString][rightString] === undefined) {
    CACHE[leftString][rightString] = await getPedersenHash(left, right);
  }
  return CACHE[leftString][rightString];
}

/**
 * Pre-compute commonly used hashes.
 *
 * This function may take a while to run.
 */
export async function preComputeHashes(
  networkId: NetworkId,
): Promise<void> {
  const collateralAssetBn = hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID[networkId]);

  await Promise.all([
    // Orders: hash(hash(sell asset, buy asset), fee asset)
    Promise.all(SYNTHETIC_ASSETS.map(async (baseAsset) => {
      const baseAssetBn = hexToBn(SYNTHETIC_ASSET_ID_MAP[baseAsset]);
      const [buyHash, sellHash] = await Promise.all([
        getCacheablePedersenHash(collateralAssetBn, baseAssetBn),
        getCacheablePedersenHash(baseAssetBn, collateralAssetBn),
      ]);
      await Promise.all([
        getCacheablePedersenHash(buyHash, collateralAssetBn),
        getCacheablePedersenHash(sellHash, collateralAssetBn),
      ]);
    })),

    // Transfers and conditional transfers: hash(transfer asset, fee asset)
    getCacheablePedersenHash(collateralAssetBn, TRANSFER_FEE_ASSET_ID_BN),
  ]);
}
