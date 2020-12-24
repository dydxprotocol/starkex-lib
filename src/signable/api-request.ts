import nodeCrypto from 'crypto';

import BN from 'bn.js';

import { hexToBn } from '../lib/util';
import { ApiRequestParams } from '../types';
import { Signable } from './signable';

/**
 * Wrapper object to hash, sign, and verify an API request.
 */
export class SignableApiRequest extends Signable<ApiRequestParams> {

  public constructor(
    apiRequest: ApiRequestParams,
  ) {
    super(apiRequest);
  }

  protected calculateHash(): BN {
    const messageString = (
      this.message.isoTimestamp +
      this.message.method +
      this.message.requestPath +
      this.message.body
    );
    const hashHex = nodeCrypto.createHash('sha256').update(messageString).digest('hex');
    return hexToBn(hashHex).iushrn(5); // Remove the last five bits so it fits in 251 bits.
  }
}
