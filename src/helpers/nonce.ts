import nodeCrypto from 'crypto';

import BN from 'bn.js';

import { hexToBn } from '../lib/util';
import { ORDER_FIELD_BIT_LENGTHS } from '../signable/constants';

const MAX_NONCE = new BN(2).pow(new BN(ORDER_FIELD_BIT_LENGTHS.nonce));

/**
 * Generate a nonce deterministically from an ID set on the order by the client.
 *
 * Does not need to be a cryptographically secure hash.
 */
export function nonceFromClientId(clientId: string): string {
  const nonceHex = nodeCrypto
    .createHmac('sha256', '(insecure)')
    .update(clientId)
    .digest('hex');
  return hexToBn(nonceHex).mod(MAX_NONCE).toString();
}
