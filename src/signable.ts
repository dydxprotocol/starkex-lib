import {
  asEcKeyPair,
  asEcKeyPairPublic,
  deserializeSignature,
  serializeSignature,
} from './helpers';
import {
  KeyPair,
  StarkwareSignable,
} from './types';
import {
  bnToHex,
} from './util';

/**
 * A Starkware signable object.
 */
export default abstract class Signable<S extends StarkwareSignable> {
  protected readonly starkwareObject: S;
  private _hash: string | null = null;

  constructor(starkwareObject: S) {
    this.starkwareObject = starkwareObject;
  }

  get hash(): string {
    if (this._hash === null) {
      this._hash = this.calculateHash();
    }
    return this._hash;
  }

  /**
   * Sign the object with the given private key, represented as a hex string or hex string pair.
   */
  sign(
    privateKey: string | KeyPair,
  ): string {
    const ecSignature = asEcKeyPair(privateKey).sign(this.hash);
    return serializeSignature({
      r: bnToHex(ecSignature.r),
      s: bnToHex(ecSignature.s),
    });
  }

  /**
   * Verify the signature is valid for the public key specified in the object.
   */
  verifySignature(
    signature: string,
  ): boolean {
    const signatureStruct = deserializeSignature(signature);

    // Return true if the signature is valid for either of the two possible y-coordinates.
    //
    // Compare with:
    // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L151
    return (
      asEcKeyPairPublic(this.starkwareObject.publicKey, false).verify(this.hash, signatureStruct) ||
      asEcKeyPairPublic(this.starkwareObject.publicKey, true).verify(this.hash, signatureStruct)
    );
  }

  /**
   * Return the Starkware object.
   */
  toStarkware(): S {
    return this.starkwareObject;
  }

  /**
   * Calculate the object hash.
   */
  protected abstract calculateHash(): string;
}
