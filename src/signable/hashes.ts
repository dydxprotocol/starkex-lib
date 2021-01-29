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
import { DydxAsset, HashFunction } from '../types';

const SANITY_CHECK_EXPECTED_RESULT = new BN(
  '2001140082530619239661729809084578298299223810202097622761632384561112390979',
);

// Global state for all STARK signables.
const CACHE: Record<string, Record<string, BN>> = {};
let globalHashFunction: HashFunction = pedersen;

/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
export function setGlobalStarkHashImplementationNoSanityCheck(hashFunction: HashFunction) {
  globalHashFunction = hashFunction;
}

/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
export async function setGlobalStarkHashImplementation(hashFunction: HashFunction) {
  const result = await hashFunction(new BN(0), new BN(1));
  if (!result.eq(SANITY_CHECK_EXPECTED_RESULT)) {
    throw new Error('setGlobalStarkHashImplementation: Sanity check failed');
  }
  setGlobalStarkHashImplementationNoSanityCheck(hashFunction);
}

/**
 * Calculate a pedersen hash.
 */
export async function getPedersenHash(left: BN, right: BN): Promise<BN> {
  return globalHashFunction(left, right);
}

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
    CACHE[leftString][rightString] = await globalHashFunction(left, right);
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
