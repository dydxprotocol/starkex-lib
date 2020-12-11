/**
 * Unit tests for signable/api-request.ts.
 */

import {
  ApiMethod,
  ApiRequestParams,
} from '../../src/types';
import { generateKeyPair } from '../../src/keys';

// Module under test.
import { SignableApiRequest } from '../../src/signable/api-request';

const mockApiRequest: ApiRequestParams = {
  isoTimestamp: '2020-10-19T20:31:20.000Z',
  method: ApiMethod.GET,
  requestPath: 'v3/users',
  body: '',
};

describe('SignableApiRequest', () => {

  it('signs and verifies a signature', () => {
    const keyPair = generateKeyPair();
    const signable = new SignableApiRequest(mockApiRequest);
    const signature = signable.sign(keyPair.privateKey);
    const isValid = signable.verifySignature(signature, keyPair.publicKey);
    expect(isValid).toBe(true);
  });

  it('signs and fails verification with the wrong public key', () => {
    const keyPair = generateKeyPair();
    const signable = new SignableApiRequest(mockApiRequest);
    const signature = signable.sign(keyPair.privateKey);
    const isValid = signable.verifySignature(signature, generateKeyPair().publicKey);
    expect(isValid).toBe(false);
  });
});
