import nodeCrypto from 'crypto';

import BN from 'bn.js';

import { hexToBn } from '../lib/util';
import { RegistrationParams } from '../types';
import { StarkSignable } from './stark-signable';

/**
 * Wrapper object to hash, sign, and verify an Ethereum + STARK key registration.
 */
export class SignableRegistration extends StarkSignable<RegistrationParams> {

  public constructor(
    registration: RegistrationParams,
  ) {
    super(registration);
  }

  protected calculateHash(): BN {
    const messageString = (
      this.message.ethereumAddress +
      this.message.starkKey
    );
    const hashHex = nodeCrypto.createHash('sha256').update(messageString).digest('hex');
    return hexToBn(hashHex).iushrn(5); // Remove the last five bits so it fits in 251 bits.
  }
}
