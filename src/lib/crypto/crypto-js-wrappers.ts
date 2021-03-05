/**
 * Thin wrapper for calling the Starkware JS crypto functions.
 */

import BN from 'bn.js';

import {
  asEcKeyPair,
  asEcKeyPairPublic,
  asSimpleSignature,
} from '../../helpers';
import {
  HashFunction,
  PublicKeyStruct,
  SignatureStruct,
  SigningFunction,
  VerificationFunction,
} from '../../types';
import { cryptoJs } from '../starkware';

export const pedersen: HashFunction = function pedersen(
  a: BN,
  b: BN,
): BN {
  return cryptoJs.pedersen(a, b);
};

export const sign: SigningFunction = function sign(
  privateKey: string,
  message: BN,
): SignatureStruct {
  const ecKeyPair = asEcKeyPair(privateKey);
  const ecSignature = cryptoJs.sign(ecKeyPair, message);
  return asSimpleSignature(ecSignature);
};

export const verify: VerificationFunction = function verify(
  publicKey: string | PublicKeyStruct,
  message: BN,
  signature: SignatureStruct,
): boolean {
  // If y-coordinate is available, save time by using it, instead of having to infer it.
  if (typeof publicKey !== 'string') {
    const ecPublicKey = asEcKeyPairPublic(publicKey);
    return cryptoJs.verify(ecPublicKey, message, signature);
  }

  // Return true if the signature is valid for either of the two possible y-coordinates.
  //
  // Compare with:
  // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L151
  return (
    cryptoJs.verify(asEcKeyPairPublic(publicKey, false), message, signature) ||
    cryptoJs.verify(asEcKeyPairPublic(publicKey, true), message, signature)
  );
};
