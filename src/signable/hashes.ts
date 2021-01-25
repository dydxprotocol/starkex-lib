/**
 * Helpers related to pedersen hashes.
 */

import BN from 'bn.js';

import {
  ASSET_ID_MAP,
  COLLATERAL_ASSET,
  COLLATERAL_ASSET_ID,
} from '../constants';
import { pedersen } from '../lib/starkex-resources';
import { hexToBn } from '../lib/util';
import { DydxAsset } from '../types';

const CACHE: Record<string, Record<string, BN>> = {};

/**
 * Get a hash with commonly used parameters. The hash will be cached.
 */
export function getCacheableHash(
  left: BN,
  right: BN,
): BN {
  const leftString = left.toString(16);
  const rightString = right.toString(16);
  if (!CACHE[leftString]) {
    CACHE[leftString] = {};
  }
  if (!CACHE[leftString][rightString]) {
    CACHE[leftString][rightString] = pedersen(left, right);
  }
  return CACHE[leftString][rightString];
}

/**
 * Pre-compute commonly used hashes.
 *
 * This function may take a while to run.
 */
export function preComputeHashes(): void {
  const collateralAssetBn = hexToBn(COLLATERAL_ASSET_ID);

  // orders: hash(hash(sell asset, buy asset), fee asset)
  Object.values(DydxAsset).forEach((baseAsset) => {
    if (baseAsset === COLLATERAL_ASSET) {
      return;
    }
    const baseAssetBn = hexToBn(ASSET_ID_MAP[baseAsset]);
    const buyHash = getCacheableHash(collateralAssetBn, baseAssetBn);
    const sellHash = getCacheableHash(baseAssetBn, collateralAssetBn);
    getCacheableHash(buyHash, collateralAssetBn);
    getCacheableHash(sellHash, collateralAssetBn);
  });

  // conditional transfers: hash(transfer asset, fee asset)
  getCacheableHash(collateralAssetBn, collateralAssetBn);
}
