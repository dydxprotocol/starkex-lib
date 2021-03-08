/**
 * Thin wrapper for calling the Starkware ffi c++ wrapper functions.
 */

import crypto from 'crypto';

import BN from 'bn.js';

import { isValidPublicKey } from '../../helpers';
import {
  HashFunction,
  PublicKeyStruct,
  SignatureStruct,
  SigningFunction,
  VerificationFunction,
} from '../../types';
import { cryptoCpp } from '../starkware';
import {
  ensureHexPrefix,
  normalizeHex32,
} from '../util';

/**
 * Calculate a Pedersen hash (c++ implementation).
 */
export const pedersen: HashFunction = function pedersen(
  a: BN,
  b: BN,
): BN {
  const xBigInt = BigInt(a.toString(10));
  const yBigInt = BigInt(b.toString(10));
  const result: BigInt = cryptoCpp.pedersen(xBigInt, yBigInt);
  return new BN(result.toString(10));
};

/**
 * Generates a STARK signature (c++ implementation).
 */
export const sign: SigningFunction = function sign(
  privateKey: string,
  message: BN,
): SignatureStruct {
  const privateKeyBigInt = BigInt(ensureHexPrefix(privateKey));
  const messageBigInt = BigInt(message.toString(10));
  const kBuffer = crypto.randomBytes(32);
  const kBigInt = BigInt(`0x${kBuffer.toString('hex')}`);
  const signature = cryptoCpp.sign(privateKeyBigInt, messageBigInt, kBigInt);
  return {
    r: normalizeHex32(signature.r.toString(16)),
    s: normalizeHex32(signature.s.toString(16)),
  };
};

/**
 * Verify a STARK signature (c++ implementation).
 *
 * Throws if public key is invalid.
 */
export const verify: VerificationFunction = function verify(
  publicKey: string | PublicKeyStruct,
  message: BN,
  signature: SignatureStruct,
): boolean {
  if (isValidPublicKey(publicKey)) {
    throw new Error('verifySignatureCpp: key is invalid');
  }
  const starkKey = typeof publicKey === 'string'
    ? publicKey
    : publicKey.x;
  const starkKeyBigInt = BigInt(ensureHexPrefix(starkKey));
  const messageBigInt = BigInt(message.toString(10));
  const rBigInt = BigInt(ensureHexPrefix(signature.r));
  const sBigInt = BigInt(ensureHexPrefix(signature.s));
  return cryptoCpp.verify(starkKeyBigInt, messageBigInt, rBigInt, sBigInt);
};
