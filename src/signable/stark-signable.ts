import BN from 'bn.js';

import { COLLATERAL_ASSET_ID_BY_NETWORK_ID } from '../constants';
import {
  deserializeSignature,
  serializeSignature,
} from '../helpers';
import {
  sign,
  verify,
} from '../lib/crypto';
import {
  KeyPair,
  NetworkId,
} from '../types';

/**
 * Base class for a STARK key signable message.
 */
export abstract class StarkSignable<T> {

  public readonly message: T;
  public readonly networkId: NetworkId;

  private _hashBN: BN | null = null;

  public constructor(
    message: T,
    networkId: NetworkId,
  ) {
    this.message = message;
    this.networkId = networkId;

    // Sanity check.
    if (!COLLATERAL_ASSET_ID_BY_NETWORK_ID[networkId]) {
      throw new Error(`Unknown network ID or unknown collateral asset for network: ${networkId}`);
    }
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
    const key: string = typeof privateKey === 'string' ? privateKey : privateKey.privateKey;
    return serializeSignature(await sign(key, hashBN));
  }

  /**
   * Verify the signature is valid for a given public key.
   */
  async verifySignature(
    signature: string,
    publicKey: string,
    publicKeyYCoordinate: string | null = null,
  ): Promise<boolean> {
    const key = publicKeyYCoordinate === null
      ? publicKey
      : { x: publicKey, y: publicKeyYCoordinate };
    const hashBN = await this.getHashBN();
    const signatureStruct = deserializeSignature(signature);
    return verify(key, hashBN, signatureStruct);
  }

  /**
   * Calculate the message hash.
   */
  protected abstract calculateHash(): Promise<BN>;
}
