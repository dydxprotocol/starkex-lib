/**
 * Other helper functions for converting data for Starkware.
 */

import nodeCrypto from 'crypto';

import BN from 'bn.js';

import { hexToBn } from '../lib/util';
import {
  ORDER_FIELD_BIT_LENGTHS,
  STARK_SIGNATURE_EXPIRATION_BUFFER_HOURS,
} from '../signable/constants';

const MAX_NONCE = new BN(2).pow(new BN(ORDER_FIELD_BIT_LENGTHS.nonce));
const ONE_SECOND_MS = 1000;
const ONE_HOUR_MS = 60 * 60 * ONE_SECOND_MS;

/**
 * Generate a nonce deterministically from an arbitrary string provided by a client.
 */
export function nonceFromClientId(clientId: string): string {
  const nonceHex = nodeCrypto.createHash('sha256').update(clientId).digest('hex');
  return hexToBn(nonceHex).mod(MAX_NONCE).toString();
}

/**
 * Convert an ISO timestamp to an epoch timestamp in seconds, rounding down.
 */
export function isoTimestampToEpochSeconds(isoTimestamp: string): number {
  return Math.floor(new Date(isoTimestamp).getTime() / ONE_SECOND_MS);
}

/**
 * Convert an ISO timestamp to an epoch timestamp in hours, rounding up.
 */
export function isoTimestampToEpochHours(isoTimestamp: string): number {
  return Math.ceil(new Date(isoTimestamp).getTime() / ONE_HOUR_MS);
}

/**
 * Add expiration buffer to ensure an order signature is valid when it arrives on-chain.
 */
export function addOrderExpirationBufferHours(expirationEpochHours: number): number {
  return expirationEpochHours + STARK_SIGNATURE_EXPIRATION_BUFFER_HOURS;
}
