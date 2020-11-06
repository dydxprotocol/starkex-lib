import nodeCrypto from 'crypto';

import Signable from './signable';
import { InternalRegistration } from './types';

/**
 * Wrapper object to convert, hash, sign, or verify the signature of a registration.
 */
export default class Registration extends Signable<InternalRegistration> {

  static fromInternal(
    internalRegistration: InternalRegistration,
  ): Registration {
    return new Registration(internalRegistration);
  }

  protected calculateHash(): string {
    const registration = this.starkwareObject;

    const message = registration.ethereumAddress + registration.publicKey;
    return nodeCrypto.createHmac('sha256', '').update(message).digest('hex');
  }
}
