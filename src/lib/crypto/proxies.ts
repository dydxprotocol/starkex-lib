/**
 * Wrappers for crypto functions, allowing implementations to be swapped out.
 */

import BN from 'bn.js';

import {
  asEcKeyPair,
  asSimpleKeyPair,
} from '../../helpers';
import {
  HashFunction,
  PublicKeyStruct,
  SignatureStruct,
  SigningFunction,
  VerificationFunction,
} from '../../types';
import * as cryptoJs from './crypto-js-wrappers';

const TEST_SIGNATURE = {
  r: 'edf3922fdf0c1b98a861a38874120a437e33c08841923317aeb8ec6bad1400',
  s: 'a658327ad247b8e816aadd7758d96450f8d43c691aadf768cadd8784f3b8ef',
};
const TEST_KEY_PAIR = asSimpleKeyPair(asEcKeyPair('1')).privateKey;

// Global state for all STARK signables.
let globalHashFunction: HashFunction = cryptoJs.pedersen;
let globalSigningFunction: SigningFunction = cryptoJs.sign;
let globalVerificationFunction: VerificationFunction = cryptoJs.verify;

/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
export function setGlobalStarkHashImplementationNoSanityCheck(fn: HashFunction) {
  globalHashFunction = fn;
}

/**
 * Set the signing implementation that will be used for all StarkSignable objects.
 */
export function setGlobalStarkSigningImplementationNoSanityCheck(fn: SigningFunction) {
  globalSigningFunction = fn;
}

/**
 * Set the signature verification implementation that will be used for all StarkSignable objects.
 */
export function setGlobalStarkVerificationImplementationNoSanityCheck(fn: VerificationFunction) {
  globalVerificationFunction = fn;
}

/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
export async function setGlobalStarkHashImplementation(fn: HashFunction) {
  const result = await fn(new BN(0), new BN(1));
  if (!result.eq(
    new BN('2001140082530619239661729809084578298299223810202097622761632384561112390979'),
  )) {
    throw new Error('setGlobalStarkHashImplementation: Sanity check failed');
  }
  setGlobalStarkHashImplementationNoSanityCheck(fn);
}

/**
 * Set the signing implementation that will be used for all StarkSignable objects.
 */
export async function setGlobalStarkSigningImplementation(fn: SigningFunction) {
  const result = await fn(TEST_KEY_PAIR, new BN(1));
  if (result.r !== TEST_SIGNATURE.r && result.s !== TEST_SIGNATURE.s) {
    // If the result doesn't match the test signature, it may still be valid, so check with the
    // signature verification function.
    const isValid = globalVerificationFunction(TEST_KEY_PAIR, new BN(1), result);
    if (!isValid) {
      throw new Error('setGlobalStarkSigningImplementation: Sanity check failed');
    }
  }
  setGlobalStarkSigningImplementationNoSanityCheck(fn);
}

/**
 * Set the signature verification implementation that will be used for all StarkSignable objects.
 */
export async function setGlobalStarkVerificationImplementation(fn: VerificationFunction) {
  const isValid = await fn(TEST_KEY_PAIR, new BN(1), TEST_SIGNATURE);
  if (!isValid) {
    throw new Error('setGlobalStarkVerificationImplementation: Sanity check failed');
  }
  const isValid2 = await fn(TEST_KEY_PAIR, new BN(2), TEST_SIGNATURE);
  if (isValid2) {
    throw new Error('setGlobalStarkVerificationImplementation: Sanity check failed');
  }
  setGlobalStarkVerificationImplementationNoSanityCheck(fn);
}

/**
 * Calculate a pedersen hash.
 */
export const pedersen: HashFunction = async function pedersen(
  a: BN,
  b: BN,
): Promise<BN> {
  return globalHashFunction(a, b);
};

/**
 * Sign a message.
 */
export const sign: SigningFunction = async function sign(
  privateKey: string,
  message: BN,
): Promise<SignatureStruct> {
  return globalSigningFunction(privateKey, message);
};

/**
 * Verify a signature.
 */
export const verify: VerificationFunction = async function verify(
  key: string | PublicKeyStruct,
  message: BN,
  signature: SignatureStruct,
): Promise<boolean> {
  return globalVerificationFunction(key, message, signature);
};
