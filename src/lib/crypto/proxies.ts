/**
 * Wrappers for crypto functions, allowing implementations to be swapped out.
 */

import BN from 'bn.js';
import elliptic from 'elliptic';

import {
  asEcKeyPair,
  asSimpleSignature,
} from '../../helpers';
import {
  HashFunction,
  SignatureStruct,
  SigningFunction,
  VerificationFunction,
} from '../../types';
import {
  pedersen as defaultHash,
  sign as defaultSign,
  verify as defaultVerify,
} from '../starkware';

const TEST_SIGNATURE = {
  r: 'edf3922fdf0c1b98a861a38874120a437e33c08841923317aeb8ec6bad1400',
  s: 'a658327ad247b8e816aadd7758d96450f8d43c691aadf768cadd8784f3b8ef',
};
const TEST_KEY_PAIR = asEcKeyPair('1');

// Global state for all STARK signables.
let globalHashFunction: HashFunction = defaultHash;
let globalSigningFunction: SigningFunction = defaultSign;
let globalVerificationFunction: VerificationFunction = defaultVerify;

/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
export function setGlobalStarkHashImplementationNoSanityCheck(fn: HashFunction): void {
  globalHashFunction = fn;
}

/**
 * Set the signing implementation that will be used for all StarkSignable objects.
 */
export function setGlobalStarkSigningImplementationNoSanityCheck(fn: SigningFunction): void {
  globalSigningFunction = fn;
}

/**
 * Set the signature verification implementation that will be used for all StarkSignable objects.
 */
export function setGlobalStarkVerificationImplementationNoSanityCheck(
  fn: VerificationFunction,
): void {
  globalVerificationFunction = fn;
}

/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
export async function setGlobalStarkHashImplementation(fn: HashFunction): Promise<void> {
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
export async function setGlobalStarkSigningImplementation(fn: SigningFunction): Promise<void> {
  const result = await fn(TEST_KEY_PAIR, new BN(1));
  if (!(
    result.r.eq(new BN(TEST_SIGNATURE.r, 16)) &&
    result.s.eq(new BN(TEST_SIGNATURE.s, 16))
  )) {
    // If the result doesn't match the test signature, it may still be valid, so check with the
    // signature verification function.
    const isValid = globalVerificationFunction(TEST_KEY_PAIR, new BN(1), asSimpleSignature(result));
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!isValid) {
      throw new Error('setGlobalStarkSigningImplementation: Sanity check failed');
    }
  }
  setGlobalStarkSigningImplementationNoSanityCheck(fn);
}

/**
 * Set the signature verification implementation that will be used for all StarkSignable objects.
 */
export async function setGlobalStarkVerificationImplementation(
  fn: VerificationFunction,
): Promise<void> {
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
export async function getPedersenHash(left: BN, right: BN): Promise<BN> {
  return globalHashFunction(left, right);
}

/**
 * Sign a message.
 */
export async function sign(key: elliptic.ec.KeyPair, message: BN): Promise<elliptic.ec.Signature> {
  return globalSigningFunction(key, message);
}

/**
 * Verify a signature.
 */
export async function verify(
  key: elliptic.ec.KeyPair,
  message: BN,
  signature: SignatureStruct,
): Promise<boolean> {
  return globalVerificationFunction(key, message, signature);
}
