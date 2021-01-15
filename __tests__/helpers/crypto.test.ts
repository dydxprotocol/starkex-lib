/**
 * Unit tests for helpers/crypto.
 */

import expect from 'expect';

import { KeyPair } from '../../src/types';

// Module under test.
import {
  asEcKeyPair,
  asEcKeyPairPublic,
  asSimplePublicKey,
  asSimpleKeyPair,
  deserializeSignature,
  serializeSignature,
} from '../../src/helpers/crypto';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockPaddedKeyPair: KeyPair = {
  publicKey: `0${mockKeyPair.publicKey}`,
  privateKey: `0${mockKeyPair.privateKey}`,
};
const mockKeyPairEvenY: KeyPair = {
  publicKey: '5c749cd4c44bdc730bc90af9bfbdede9deb2c1c96c05806ce1bc1cb4fed64f7',
  privateKey: '65b7bb244e019b45a521ef990fb8a002f76695d1fc6c1e31911680f2ed78b84',
};
const mockPaddedKeyPairEvenY: KeyPair = {
  publicKey: `0${mockKeyPairEvenY.publicKey}`,
  privateKey: `0${mockKeyPairEvenY.privateKey}`,
};
const mockSignature = (
  '05db91adf6745822767cb846f6a3a79a52c1f3434ac0e9196a36b4084753e972' +
  '0469298bdf292a304af14f5043f0902b30ba927488ccc221fe8925740c40edbf'
);

describe('crypto helpers', () => {

  describe('asEcKeyPair()', () => {

    it('accepts an unpadded key pair as argument', () => {
      const ecKeyPair = asEcKeyPair(mockKeyPair);
      expect(asSimpleKeyPair(ecKeyPair)).toEqual(mockPaddedKeyPair);
    });

    it('accepts a padded key pair as argument', () => {
      const ecKeyPair = asEcKeyPair(mockPaddedKeyPair);
      expect(asSimpleKeyPair(ecKeyPair)).toEqual(mockPaddedKeyPair);
    });

    it('accepts a private key as argument', () => {
      const ecKeyPair = asEcKeyPair(mockKeyPair.privateKey);
      expect(asSimpleKeyPair(ecKeyPair)).toEqual(mockPaddedKeyPair);
    });
  });

  describe('asEcKeyPairPublic()', () => {

    it('gets a public key from an x-coordinate (even y)', () => {
      const ecKeyPair = asEcKeyPairPublic(mockKeyPair.publicKey, false);
      expect(asSimplePublicKey(ecKeyPair.getPublic())).toEqual(mockPaddedKeyPair.publicKey);
    });

    it('gets a public key from an x-coordinate (odd y)', () => {
      const ecKeyPair = asEcKeyPairPublic(mockKeyPairEvenY.publicKey, true);
      expect(asSimplePublicKey(ecKeyPair.getPublic())).toEqual(mockPaddedKeyPairEvenY.publicKey);
    });
  });

  describe('asSimpleKeyPair()', () => {

    it('throws if the elliptic curve key pair has no private key', () => {
      const ecKeyPair = asEcKeyPairPublic(mockKeyPair.publicKey, false);
      expect(() => asSimpleKeyPair(ecKeyPair)).toThrow('Key pair has no private key');
    });
  });

  describe('serializeSignature()', () => {

    it('pads r', () => {
      const signatureStruct = {
        r: mockSignature.slice(1, 64),
        s: mockSignature.slice(64),
      };
      expect(serializeSignature(signatureStruct)).toBe(mockSignature);
    });

    it('pads s', () => {
      const signatureStruct = {
        r: mockSignature.slice(0, 64),
        s: mockSignature.slice(65),
      };
      expect(serializeSignature(signatureStruct)).toBe(mockSignature);
    });
  });

  describe('deserializeSignature()', () => {

    it('throws if the serialized signature has the wrong length', () => {
      expect(() => deserializeSignature(mockSignature.slice(1))).toThrow(
        'Invalid serialized signature',
      );
    });
  });
});
