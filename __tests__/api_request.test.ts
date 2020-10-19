import {
  ApiMethod,
  InternalApiRequest,
} from '../src/types';

// Mock params.
import signatureExample from './data/signature_example.json';
import ApiRequest from '../src/api_request';

const internalApiRequest: Partial<InternalApiRequest> = {
  method: ApiMethod.GET,
  expiresAt: '2020-10-19T20:31:20.000Z',
  body: '',
  requestPath: 'v3/users',
};

describe('ApiRequests', () => {
  describe('sign()', () => {

    it('signs and verifies an apiRequest', () => {
      const apiRequest: InternalApiRequest = {
        ...internalApiRequest,
        starkKey: signatureExample.keyPair.publicKey,
      } as InternalApiRequest;
      const signature: string = ApiRequest.fromInternal(
        apiRequest,
      ).sign(signatureExample.keyPair.privateKey);
      const verification: boolean = ApiRequest.fromInternal(
        apiRequest,
      ).verifySignature(signature);
      expect(verification).toEqual(true);
    });

    it('signs and verifies an apiRequest (even y) ', () => {
      const apiRequest: InternalApiRequest = {
        ...internalApiRequest,
        starkKey: signatureExample.keyPairEvenY.publicKey,
      } as InternalApiRequest;
      const signature: string = ApiRequest.fromInternal(
        apiRequest,
      ).sign(signatureExample.keyPairEvenY.privateKey);
      const verification: boolean = ApiRequest.fromInternal(apiRequest).verifySignature(signature);
      expect(verification).toEqual(true);
    });

    it('signs and cannot verify an apiRequest with another public key', () => {
      const apiRequest: InternalApiRequest = {
        ...internalApiRequest,
        starkKey: signatureExample.keyPair.publicKey,
      } as InternalApiRequest;
      const signature: string = ApiRequest.fromInternal(
        apiRequest,
      ).sign(signatureExample.keyPairEvenY.privateKey);
      const verification: boolean = ApiRequest.fromInternal(apiRequest).verifySignature(signature);
      expect(verification).toEqual(false);
    });
  });
});
