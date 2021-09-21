import BN from 'bn.js';
import elliptic from 'elliptic';

import { SignatureStruct } from '../../types';
import { starkEc } from '../starkware';
import * as swCrypto from './starkware-crypto';

/**
 * Calculate a Pedersen hash (c++ implementation).
 */
export function pedersenCpp(x: BN, y: BN): BN {
  const xBigInt = BigInt(x.toString(10));
  const yBigInt = BigInt(y.toString(10));
  const result: BigInt = swCrypto.pedersen(xBigInt, yBigInt);
  return new BN(result as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Verify a STARK signature (c++ implementation).
 *
 * IMPORTANT: It is assumed that `key` is already known to be a valid public key.
 */
export function verifySignatureCpp(
  key: elliptic.ec.KeyPair,
  message: BN,
  signature: SignatureStruct,
): boolean {
  const starkKeyBigInt = BigInt(key.getPublic().getX().toString(10));
  const messageBigInt = BigInt(message.toString(10));

  // Note: `signature` is always an (r, s) pair of hex strings without 0x prefix.
  const rBigInt = BigInt(`0x${signature.r}`);

  // Invert s and pass the inverse to the verification function.
  //
  // TODO: Use a newer version of libcrypto_c_exports.so which no longer requires inverting s.
  const w = new BN(signature.s, 16).invm(starkEc.n!);
  const wBigInt = BigInt(w.toString(10));
  return swCrypto.verify(starkKeyBigInt, messageBigInt, rBigInt, wBigInt);
}
