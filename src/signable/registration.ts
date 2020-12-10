import nodeCrypto from 'crypto';

import BN from 'bn.js';

import { hexToBn } from '../lib/util';
import { RegistrationParams } from '../types';
import { Signable } from './signable';

/**
 * Wrapper object to hash, sign, and verify an Ethereum + STARK key registration.
 */
export class SignableRegistration extends Signable<RegistrationParams> {

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
    const hashHex = nodeCrypto.createHmac('sha256', '').update(messageString).digest('hex');
    return hexToBn(hashHex).iushrn(5); // Remove the last five bits.
  }
}
