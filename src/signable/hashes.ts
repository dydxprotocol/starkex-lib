/**
 * Helpers related to pedersen hashes.
 */

import BN from 'bn.js';

import {
  ASSET_ID_MAP,
  COLLATERAL_ASSET,
  COLLATERAL_ASSET_ID,
} from '../constants';
import { hexToBn } from '../lib/util';
import { DydxAsset } from '../types';
import { getPedersenHash } from './crypto';

// Global state for all STARK signables.
const CACHE: Record<string, Record<string, BN>> = {};

/**
 * Calculate a pedersen hash with commonly used parameters. The hash will be cached.
 */
export async function getCacheablePedersenHash(left: BN, right: BN): Promise<BN> {
  const leftString = left.toString(16);
  const rightString = right.toString(16);
  if (!CACHE[leftString]) {
    CACHE[leftString] = {};
  }
  if (!CACHE[leftString][rightString]) {
    CACHE[leftString][rightString] = await getPedersenHash(left, right);
  }
  return CACHE[leftString][rightString];
}

/**
 * Pre-compute commonly used hashes.
 *
 * This function may take a while to run.
 */
export async function preComputeHashes(): Promise<void> {
  const collateralAssetBn = hexToBn(COLLATERAL_ASSET_ID);

  await Promise.all([
    // Orders: hash(hash(sell asset, buy asset), fee asset)
    Promise.all(Object.values(DydxAsset).map(async (baseAsset) => {
      if (baseAsset === COLLATERAL_ASSET) {
        return;
      }
      const baseAssetBn = hexToBn(ASSET_ID_MAP[baseAsset]);
      const [buyHash, sellHash] = await Promise.all([
        getCacheablePedersenHash(collateralAssetBn, baseAssetBn),
        getCacheablePedersenHash(baseAssetBn, collateralAssetBn),
      ]);
      await Promise.all([
        getCacheablePedersenHash(buyHash, collateralAssetBn),
        getCacheablePedersenHash(sellHash, collateralAssetBn),
      ]);
    })),

    // Conditional transfers: hash(transfer asset, fee asset)
    getCacheablePedersenHash(collateralAssetBn, collateralAssetBn),
  ]);
}
