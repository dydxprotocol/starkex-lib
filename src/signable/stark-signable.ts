import BN from 'bn.js';

import {
  asEcKeyPair,
  asEcKeyPairPublic,
  deserializeSignature,
  serializeSignature,
} from '../helpers';
import { starkEc } from '../lib/starkex-resources/crypto';
import { bnToHex32 } from '../lib/util';
import { KeyPair } from '../types';
import {
  sign,
  verify,
} from './crypto';

/**
 * Base class for a STARK key signable message.
 */
export abstract class StarkSignable<T> {

  public readonly message: T;

  private _hashBN: BN | null = null;

  public constructor(
    message: T,
  ) {
    this.message = message;
  }

  /**
   * Return the message hash as a hex string, no 0x prefix.
   */
  async getHash(): Promise<string> {
    return (await this.getHashBN()).toString(16);
  }

  async getHashBN(): Promise<BN> {
    if (this._hashBN === null) {
      this._hashBN = await this.calculateHash();
    }
    return this._hashBN;
  }

  /**
   * Sign the message with the given private key, represented as a hex string or hex string pair.
   */
  async sign(
    privateKey: string | KeyPair,
  ): Promise<string> {
    const hashBN = await this.getHashBN();
    const ecSignature = await sign(asEcKeyPair(privateKey), hashBN);
    return serializeSignature({
      r: bnToHex32(ecSignature.r),
      s: bnToHex32(ecSignature.s),
    });
  }

  /**
   * Verify the signature is valid for a given public key.
   */
  async verifySignature(
    signature: string,
    publicKey: string,
    publicKeyYCoordinate: string | null = null,
  ): Promise<boolean> {
    const signatureStruct = deserializeSignature(signature);

    // If y-coordinate is available, save time by using it, instead of having to infer it.
    if (publicKeyYCoordinate) {
      const ecPublicKey = starkEc.keyFromPublic({ x: publicKey, y: publicKeyYCoordinate });
      return verify(ecPublicKey, await this.getHashBN(), signatureStruct);
    }

    // Return true if the signature is valid for either of the two possible y-coordinates.
    //
    // Compare with:
    // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L151
    const isValidWithEvenY = await verify(
      asEcKeyPairPublic(publicKey, false),
      await this.getHashBN(),
      signatureStruct,
    );
    return (
      isValidWithEvenY ||
      verify(asEcKeyPairPublic(publicKey, true), await this.getHashBN(), signatureStruct)
    );
  }

  /**
   * Calculate the message hash.
   */
  protected abstract calculateHash(): Promise<BN>;
}
