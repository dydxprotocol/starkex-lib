import BigNumber from 'bignumber.js';
import BN from 'bn.js';

import { TOKEN_DECIMALS } from './constants';
import { Token } from './types';

/**
 * Convert a BN to a 32-byte hex string without 0x prefix.
 */
export function bnToHex(bn: BN): string {
  return normalizeHex(bn.toString(16));
}

/**
 * Normalize to a 32-byte hex string without 0x prefix.
 */
export function normalizeHex(hex: string): string {
  const newHex = hex.replace(/^0x/, '').padStart(64, '0');
  if (newHex.length !== 64) {
    throw new Error('normalizeHex: Hex string is longer than 32 bytes');
  }
  return newHex;
}

/**
 * Convert a token amount to an integer amount in the token's base units.
 *
 * Require the input to be a string, to avoid depending on BigNumber.
 */
export function toBaseUnits(amount: string, tokenId: Token): string {
  return new BigNumber(amount).shiftedBy(TOKEN_DECIMALS[tokenId]).toFixed(0);
}
