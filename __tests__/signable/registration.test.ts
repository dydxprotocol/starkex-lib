/**
 * Unit tests for signable/registration.ts.
 */

import {
  RegistrationParams,
} from '../../src/types';
import { generateKeyPair } from '../../src/keys';

// Module under test.
import { SignableRegistration } from '../../src/signable/registration';

const mockRegistration: RegistrationParams = {
  ethereumAddress: 'mock-address',
  starkKey: 'mock-stark-public-key',
};

describe('SignableRegistration', () => {

  it('signs and verifies a signature', () => {
    const keyPair = generateKeyPair();
    const signable = new SignableRegistration(mockRegistration);
    const signature = signable.sign(keyPair.privateKey);
    const isValid = signable.verifySignature(signature, keyPair.publicKey);
    expect(isValid).toBe(true);
  });

  it('signs and fails verification with the wrong public key', () => {
    const keyPair = generateKeyPair();
    const signable = new SignableRegistration(mockRegistration);
    const signature = signable.sign(keyPair.privateKey);
    const isValid = signable.verifySignature(signature, generateKeyPair().publicKey);
    expect(isValid).toBe(false);
  });
});
