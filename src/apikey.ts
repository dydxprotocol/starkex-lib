import assert from 'assert';

import BN from 'bn.js';

import {
  API_KEY_FIELD_BIT_LENGTHS,
  API_KEY_MAX_VALUES,
} from './constants';
import { nonceFromClientId } from './helpers';
import Signable from './signable';
import {
  InternalApiKey,
  StarkwareApiKey,
} from './types';
import {
  normalizeHex,
} from './util';

/**
 * Wrapper object to convert, hash, sign, or verify the signature of an api-key.
 */
export default class ApiKey extends Signable<StarkwareApiKey> {

  static fromInternal(
    apiKey: InternalApiKey,
  ): ApiKey {

    const timestamp = `${Math.floor(new Date(apiKey.timestamp).getTime() / 3600000)}`;

    return new ApiKey({
      nonce: nonceFromClientId(Math.random.toString()),
      method: apiKey.method,
      timestamp,
      body: apiKey.body,
      requestPath: apiKey.requestPath,
      publicKey: apiKey.starkKey,
    });
  }

  protected calculateHash(): string {
    const apiKey = this.starkwareObject;

    // TODO:
    // I'm following their existing example but we'll have to update the encoding details later.
    const method = new BN(apiKey.method);
    const timestamp = new BN(apiKey.timestamp);
    const body = new BN(apiKey.body);
    const requestPath = new BN(apiKey.requestPath);

    // Validate the data is the right size.
    assert(method.lt(API_KEY_MAX_VALUES.method));
    assert(timestamp.lt(API_KEY_MAX_VALUES.timestamp));
    assert(body.lt(API_KEY_MAX_VALUES.body));
    assert(requestPath.lt(API_KEY_MAX_VALUES.requestPath));

    // Serialize the api-key as a hex string.
    const serialized = new BN(apiKey.nonce)
      .iushln(API_KEY_FIELD_BIT_LENGTHS.timestamp).iadd(timestamp)
      .iushln(API_KEY_FIELD_BIT_LENGTHS.method).iadd(method)
      .iushln(API_KEY_FIELD_BIT_LENGTHS.requestPath).iadd(requestPath)
      .iushln(API_KEY_FIELD_BIT_LENGTHS.body).iadd(body);
    return normalizeHex(serialized.toString(16));
  }
}
