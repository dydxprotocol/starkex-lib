import {
  InternalRegistration,
} from '../src/types';

// Mock params.
import signatureExample from './data/signature_example.json';
import Registration from '../src/registrations';

const partialRegistration: Partial<InternalRegistration> = {
  ethereumAddress: 'address',
};

describe('Registration', () => {
  describe('sign()', () => {

    it('signs and verifies a registration', () => {
      const registration: InternalRegistration = {
        ...partialRegistration,
        publicKey: signatureExample.keyPair.publicKey,
      } as InternalRegistration;
      const signature: string = Registration.fromInternal(
        registration,
      ).sign(signatureExample.keyPair.privateKey);
      const verification: boolean = Registration.fromInternal(
        registration,
      ).verifySignature(signature);
      expect(verification).toEqual(true);
    });

    it('signs and verifies an registration (even y) ', () => {
      const registration: InternalRegistration = {
        ...partialRegistration,
        publicKey: signatureExample.keyPairEvenY.publicKey,
      } as InternalRegistration;
      const signature: string = Registration.fromInternal(
        registration,
      ).sign(signatureExample.keyPairEvenY.privateKey);
      const verification: boolean = Registration.fromInternal(
        registration,
      ).verifySignature(signature);
      expect(verification).toEqual(true);
    });

    it('signs and cannot verify an registration with another public key', () => {
      const registration: InternalRegistration = {
        ...partialRegistration,
        publicKey: signatureExample.keyPair.publicKey,
      } as InternalRegistration;
      const signature: string = Registration.fromInternal(
        registration,
      ).sign(signatureExample.keyPairEvenY.privateKey);
      const verification: boolean = Registration.fromInternal(
        registration,
      ).verifySignature(signature);
      expect(verification).toEqual(false);
    });
  });
});
