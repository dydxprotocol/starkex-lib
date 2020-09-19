/**
 * Helper functions exported by starkex-lib.
 */

import nodeCrypto from 'crypto';

import BigNumber from 'bignumber.js';

import { ORDER_MAX_VALUES, TOKEN_DECIMALS } from './constants';
import { Token } from './types';


/**
 * Convert a token amount to an integer amount in the token's base units.
 *
 * Require the input to be a string, to avoid depending on BigNumber.
 */
export function toBaseUnits(amount: string, tokenId: Token): string {
  return new BigNumber(amount).shiftedBy(TOKEN_DECIMALS[tokenId]).toFixed(0);
}

/**
 * Generate a nonce deterministically from an ID set on the order by the client.
 */
export function nonceFromClientId(clientId: string): string {
  const nonceHex = nodeCrypto
    .createHmac('sha256', '(insecure)')
    .update(clientId)
    .digest('hex');
  return new BN(nonceHex, 16).mod(ORDER_MAX_VALUES.nonce).toString();
}
