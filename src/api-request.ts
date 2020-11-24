import nodeCrypto from 'crypto';

import Signable from './signable';
import {
  InternalApiRequest,
} from './types';

/**
 * Wrapper object to hash, sign, or verify an API request.
 */
export default class ApiRequest extends Signable<InternalApiRequest> {

  static fromInternal(
    apiKey: InternalApiRequest,
  ): ApiRequest {
    return new ApiRequest(apiKey);
  }

  protected calculateHash(): string {
    const apiRequest = this.starkwareObject;

    const message = apiRequest.timestamp +
      apiRequest.method +
      apiRequest.requestPath +
      apiRequest.body;
    return nodeCrypto.createHmac('sha256', '').update(message).digest('hex');
  }
}
