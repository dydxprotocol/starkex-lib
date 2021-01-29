/**
 * Unit tests for signable/api-request.ts.
 */

import expect from 'expect';

import {
  ApiMethod,
  ApiRequestParams,
  KeyPair,
} from '../../src/types';
import { generateKeyPairUnsafe } from '../../src/keys';

// Module under test.
import { SignableApiRequest } from '../../src/signable/api-request';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockApiRequest: ApiRequestParams = {
  isoTimestamp: '2020-10-19T20:31:20.000Z',
  method: ApiMethod.GET,
  requestPath: 'v3/users',
  body: '',
};
const mockSignature = (
  '04940eee8f6d42c16cff2f5fd4e796aa194172076344e9ccf918b2bcccc97064' +
  '068c11003b1ad010c5d0c6c9e8fe36d296fcac4c01cdaf3b455f8f6fee62784a'
);

describe('SignableApiRequest', () => {

  it('produces the expected signature', async () => {
    const signable = new SignableApiRequest(mockApiRequest);
    const signature = await signable.sign(mockKeyPair.privateKey);
    expect(signature).toBe(mockSignature);
  });

  it('verifies a signature', async () => {
    const signable = new SignableApiRequest(mockApiRequest);
    const isValid = await signable.verifySignature(mockSignature, mockKeyPair.publicKey);
    expect(isValid).toBe(true);
  });

  it('signs and fails verification with the wrong public key', async () => {
    const keyPair = generateKeyPairUnsafe();
    const signable = new SignableApiRequest(mockApiRequest);
    const signature = await signable.sign(keyPair.privateKey);
    const isValid = await signable.verifySignature(signature, generateKeyPairUnsafe().publicKey);
    expect(isValid).toBe(false);
  });
});
