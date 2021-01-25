/**
 * Unit tests for helpers/crypto.
 */

import expect from 'expect';

import { KeyPair, KeyPairWithYCoordinate } from '../../src/types';

// Module under test.
import {
  asEcKeyPair,
  asEcKeyPairPublic,
  asSimplePublicKey,
  asSimpleKeyPair,
  deserializeSignature,
  isValidPublicKey,
  serializeSignature,
} from '../../src/helpers/crypto';
import { generateKeyPairUnsafe, keyPairFromData } from '../../src/keys';
import { mutateHexStringAt } from '../util';

// Mock params.
const mockKeyPair: KeyPairWithYCoordinate = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  publicKeyYCoordinate: '211496e5e8ccf71930aebbfb7e815807acbfd0021f17f8b3944a3ed5f06c27',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockPaddedKeyPair: KeyPairWithYCoordinate = {
  publicKey: `0${mockKeyPair.publicKey}`,
  publicKeyYCoordinate: `00${mockKeyPair.publicKeyYCoordinate}`,
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

  describe('isValidPublicKey()', () => {

    it('returns true for valid x-coordinates', () => {
      expect(isValidPublicKey('1')).toBe(true);
      expect(isValidPublicKey('A')).toBe(true);
      expect(isValidPublicKey(
        '0800000000000000000000000000000000000000000000000000000000000000',
      )).toBe(true);
      expect(isValidPublicKey(mockKeyPair.publicKey)).toBe(true);

      // Okay with 0x prefix.
      expect(isValidPublicKey(`0x${mockKeyPair.publicKey}`)).toBe(true);

      // Repeat some number of times.
      for (let i = 0; i < 25; i++) {
        // Random key pair.
        expect(isValidPublicKey(generateKeyPairUnsafe().publicKey)).toBe(true);

        // Key pair from fixed seed.
        expect(isValidPublicKey(keyPairFromData(Buffer.from([i])).publicKey)).toBe(true);
      }
    });

    it('returns false for invalid x-coordinates', () => {
      expect(isValidPublicKey('0')).toBe(false);
      expect(isValidPublicKey('C')).toBe(false);
      expect(isValidPublicKey(
        '8000000000000000000000000000000000000000000000000000000000000001',
      )).toBe(false);

      // Not a hex string.
      expect(isValidPublicKey('asdf')).toBe(false);

      // Out of range.
      expect(isValidPublicKey(
        '8000000000000000000000000000000000000000000000000000000000000000',
      )).toBe(false);
      expect(isValidPublicKey(
        '800000000000000000000000000000000000000000000000000000000000abcd',
      )).toBe(false);
    });

    it('returns true for valid (x, y) pairs', () => {
      expect(isValidPublicKey({
        x: mockKeyPair.publicKey,
        y: mockKeyPair.publicKeyYCoordinate,
      })).toBe(true);

      // Okay with 0x prefix.
      expect(isValidPublicKey({
        x: `0x${mockKeyPair.publicKey}`,
        y: `0x${mockKeyPair.publicKeyYCoordinate}`,
      })).toBe(true);

      // The other valid y-coordinate. Note that this pair does not match mockKeyPair.privateKey.
      expect(isValidPublicKey({
        x: mockKeyPair.publicKey,
        y: '7deeb691a173319e6cf514404817ea7f853402ffde0e8074c6bb5c12a0f93da',
      })).toBe(true);

      // Repeat some number of times.
      for (let i = 0; i < 25; i++) {
        // Random key pair.
        const randomKeyPair = generateKeyPairUnsafe();
        expect(isValidPublicKey({
          x: randomKeyPair.publicKey,
          y: randomKeyPair.publicKeyYCoordinate,
        })).toBe(true);

        // Key pair from fixed seed.
        const deterministicKeyPair = keyPairFromData(Buffer.from([i]));
        expect(isValidPublicKey({
          x: deterministicKeyPair.publicKey,
          y: deterministicKeyPair.publicKeyYCoordinate,
        })).toBe(true);
      }
    });

    it('returns false for invalid (x, y) pairs', () => {
      expect(isValidPublicKey({
        x: mutateHexStringAt(mockKeyPair.publicKey, 0),
        y: mockKeyPair.publicKeyYCoordinate,
      })).toBe(false);
      expect(isValidPublicKey({
        x: mutateHexStringAt(mockKeyPair.publicKey, 62),
        y: mockKeyPair.publicKeyYCoordinate,
      })).toBe(false);
      expect(isValidPublicKey({
        x: mockKeyPair.publicKey,
        y: mutateHexStringAt(mockKeyPair.publicKeyYCoordinate, 0),
      })).toBe(false);
      expect(isValidPublicKey({
        x: mockKeyPair.publicKey,
        y: mutateHexStringAt(mockKeyPair.publicKeyYCoordinate, 62),
      })).toBe(false);

      // Repeat some number of times.
      for (let i = 0; i < 25; i++) {
        // Random key pair.
        const randomKeyPair = generateKeyPairUnsafe();
        expect(isValidPublicKey({
          x: mutateHexStringAt(randomKeyPair.publicKey, Math.floor(Math.random() * 62)),
          y: randomKeyPair.publicKeyYCoordinate,
        })).toBe(false);
        expect(isValidPublicKey({
          x: randomKeyPair.publicKey,
          y: mutateHexStringAt(randomKeyPair.publicKeyYCoordinate, Math.floor(Math.random() * 62)),
        })).toBe(false);
      }
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
