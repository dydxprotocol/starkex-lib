import { keccak256 } from 'ethereum-cryptography/keccak';

import {
  asEcKeyPair,
  asSimpleKeyPair,
} from './helpers';
import {
  hexToBn,
  randomBuffer,
} from './lib/util';
import { KeyPairWithYCoordinate } from './types';

/**
 * Generate a pseudorandom StarkEx key pair. NOT FOR USE IN PRODUCTION.
 */
export function generateKeyPairUnsafe(): KeyPairWithYCoordinate {
  return keyPairFromData(randomBuffer(32));
}

/**
 * Generate a STARK key pair deterministically from a Buffer.
 */
export function keyPairFromData(data: Buffer): KeyPairWithYCoordinate {
  if (data.length === 0) {
    throw new Error('keyPairFromData: Empty buffer');
  }
  const hashedData = keccak256(data);
  const hashBN = hexToBn(hashedData.toString('hex'));
  const privateKey = hashBN.iushrn(5).toString('hex'); // Remove the last five bits.
  return asSimpleKeyPair(asEcKeyPair(privateKey));
}
