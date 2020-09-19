/**
 * Unit tests for helpers.
 */

import _ from 'lodash';

import {
  KeyPair,
} from '../src/types';
import { normalizeHex } from '../src/util';

// Module under test.
import {
  asEcKeyPair,
  asEcKeyPairPublic,
  asSimplePublicKey,
  asSimpleKeyPair,
  deserializeSignature,
  serializeSignature,
} from '../src/helpers';

// Mock params.
import signatureExample from './data/signature_example.json';

const paddedKeyPair: KeyPair = _.mapValues(signatureExample.keyPair, normalizeHex);

describe('helpers', () => {

  describe('asEcKeyPair()', () => {

    it('accepts a key pair as argument', () => {
      const ecKeyPair = asEcKeyPair(signatureExample.keyPair);
      expect(asSimpleKeyPair(ecKeyPair)).toEqual(paddedKeyPair);
    });

    it('accepts just a private key as argument', () => {
      const ecKeyPair = asEcKeyPair(signatureExample.keyPair.privateKey);
      expect(asSimpleKeyPair(ecKeyPair)).toEqual(paddedKeyPair);
    });
  });

  describe('asEcKeyPairPublic()', () => {

    it('gets a public key from an x-coordinate (even y)', () => {
      const ecKeyPair = asEcKeyPairPublic(signatureExample.keyPair.publicKey, false);
      expect(asSimplePublicKey(ecKeyPair.getPublic())).toEqual(paddedKeyPair.publicKey);
    });

    it('gets a public key from an x-coordinate (odd y)', () => {
      const ecKeyPair = asEcKeyPairPublic(signatureExample.keyPair.publicKey, true);
      expect(asSimplePublicKey(ecKeyPair.getPublic())).toEqual(paddedKeyPair.publicKey);
    });
  });

  describe('asSimpleKeyPair()', () => {

    it('throws if the elliptic curve key pair has no private key', () => {
      const ecKeyPair = asEcKeyPairPublic(signatureExample.keyPair.publicKey, false);
      expect(() => asSimpleKeyPair(ecKeyPair)).toThrow('Key pair has no private key');
    });
  });

  describe('serializeSignature()', () => {

    it('throws if r has the wrong length', () => {
      const signatureStruct = {
        r: signatureExample.signature.slice(0, 63),
        s: signatureExample.signature.slice(64),
      };
      expect(() => serializeSignature(signatureStruct)).toThrow(
        'Invalid signature struct',
      );
    });

    it('throws if s has the wrong length', () => {
      const signatureStruct = {
        r: signatureExample.signature.slice(0, 64),
        s: signatureExample.signature.slice(65),
      };
      expect(() => serializeSignature(signatureStruct)).toThrow(
        'Invalid signature struct',
      );
    });
  });

  describe('deserializeSignature()', () => {

    it('throws if the serialized signature has the wrong length', () => {
      expect(() => deserializeSignature(signatureExample.signature.slice(1))).toThrow(
        'Invalid serialized signature',
      );
    });
  });
});
