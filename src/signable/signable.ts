import BN from 'bn.js';

import {
  asEcKeyPair,
  asEcKeyPairPublic,
  deserializeSignature,
  serializeSignature,
} from '../helpers';
import {
  sign,
  verify,
} from '../lib/starkex-resources/crypto';
import { bnToHex32 } from '../lib/util';
import { KeyPair } from '../types';

/**
 * Base class for a Starkware signable message.
 */
export abstract class Signable<T> {
  protected readonly message: T;

  private _hashBN: BN | null = null;

  protected constructor(
    message: T,
  ) {
    this.message = message;
  }

  get hash(): string {
    return this.hashBN.toString(16);
  }

  get hashBN(): BN {
    if (this._hashBN === null) {
      this._hashBN = this.calculateHash();
    }
    return this._hashBN;
  }

  /**
   * Sign the message with the given private key, represented as a hex string or hex string pair.
   */
  sign(
    privateKey: string | KeyPair,
  ): string {
    const ecSignature = sign(asEcKeyPair(privateKey), this.hashBN);
    return serializeSignature({
      r: bnToHex32(ecSignature.r),
      s: bnToHex32(ecSignature.s),
    });
  }

  /**
   * Verify the signature is valid for a given public key.
   */
  verifySignature(
    signature: string,
    publicKey: string,
  ): boolean {
    const signatureStruct = deserializeSignature(signature);

    // Return true if the signature is valid for either of the two possible y-coordinates.
    //
    // Compare with:
    // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L151
    return (
      verify(asEcKeyPairPublic(publicKey, false), this.hashBN, signatureStruct) ||
      verify(asEcKeyPairPublic(publicKey, true), this.hashBN, signatureStruct)
    );
  }

  /**
   * Calculate the message hash.
   */
  protected abstract calculateHash(): BN;
}
