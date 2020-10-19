import nodeCrypto from 'crypto';

import Signable from './signable';
import {
  InternalApiRequest,
  StarkwareApiRequest,
} from './types';

/**
 * Wrapper object to convert, hash, sign, or verify the signature of an api-key.
 */
export default class ApiRequest extends Signable<StarkwareApiRequest> {

  static fromInternal(
    apiKey: InternalApiRequest,
  ): ApiRequest {

    const timestamp = `${Math.floor(new Date(apiKey.expiresAt).getTime() / 3600000)}`;

    return new ApiRequest({
      method: apiKey.method,
      expiresAt: timestamp,
      body: apiKey.body,
      requestPath: apiKey.requestPath,
      publicKey: apiKey.starkKey,
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
