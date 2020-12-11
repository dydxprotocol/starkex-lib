/**
 * Other helper functions for converting data for Starkware.
 */

import nodeCrypto from 'crypto';

import BN from 'bn.js';

import { hexToBn } from '../lib/util';
import { ORDER_FIELD_BIT_LENGTHS } from '../signable/constants';

const MAX_NONCE = new BN(2).pow(new BN(ORDER_FIELD_BIT_LENGTHS.nonce));

/**
 * Generate a nonce deterministically from an arbitrary string provided by a client.
 */
export function nonceFromClientId(clientId: string): string {
  const nonceHex = nodeCrypto.createHmac('sha256', '').update(clientId).digest('hex');
  return hexToBn(nonceHex).mod(MAX_NONCE).toString();
}

export function isoTimestampToEpochSeconds(isoTimestamp: string): string {
  return `${Math.floor(new Date(isoTimestamp).getTime() / 1000)}`;
}
