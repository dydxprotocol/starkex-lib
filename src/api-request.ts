import nodeCrypto from 'crypto';

import Signable from './signable';
import {
  InternalApiRequest,
} from './types';

/**
 * Wrapper object to convert, hash, sign, or verify the signature of an api-key.
 */
export default class ApiRequest extends Signable<InternalApiRequest> {

  static fromInternal(
    apiKey: InternalApiRequest,
  ): ApiRequest {
    return new ApiRequest({
      method: apiKey.method,
      expiresAt: apiKey.expiresAt,
      body: apiKey.body,
      requestPath: apiKey.requestPath,
      publicKey: apiKey.publicKey,
    });
  }

  protected calculateHash(): string {
    const apiRequest = this.starkwareObject;

    const message = apiRequest.expiresAt +
      apiRequest.method +
      apiRequest.requestPath +
      apiRequest.body;
    return nodeCrypto.createHmac('sha256', '').update(message).digest('hex');
  }
}
