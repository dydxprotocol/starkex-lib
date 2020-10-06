/**
 * Unit tests for keys.ts.
 */

import {
  KeyPair,
} from '../src/types';

// Module under test.
import {
  generateKeyPair,
  generateKeyPairFromEntropy,
  generateKeyPairFromMnemonic,
  generateKeyPairFromSeedUnsafe,
} from '../src/keys';

const HEX_64_RE_LOWER_NO_PREFIX = /^[0-9a-f]{64}$/;
const UNSAFE_MNEMONIC = (
  'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
);

describe('Key generation functions', () => {

  describe('generateKeyPair()', () => {

    it('generates a key pair', () => {
      const keyPair: KeyPair = generateKeyPair();
      expect(keyPair.publicKey).toMatch(HEX_64_RE_LOWER_NO_PREFIX);
      expect(keyPair.privateKey).toMatch(HEX_64_RE_LOWER_NO_PREFIX);
    });

    it('generates different key pairs', () => {
      expect(
        generateKeyPair(),
      ).not.toEqual(
        generateKeyPair(),
      );
    });
  });

  describe('generateKeyPairFromMnemonic()', () => {

    it('generates a key pair deterministically from a mnemonic', () => {
      const keyPair: KeyPair = generateKeyPairFromMnemonic(UNSAFE_MNEMONIC);
      const keyPair2: KeyPair = generateKeyPairFromMnemonic(UNSAFE_MNEMONIC);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates different key pairs', () => {
      expect(
        generateKeyPairFromMnemonic(UNSAFE_MNEMONIC),
      ).not.toEqual(
        generateKeyPairFromMnemonic(''),
      );
    });
  });

  describe('generateKeyPairFromEntropy()', () => {

    it('generates a key pair deterministically from 16 bytes', () => {
      const entropy = randomBuffer(16);
      const keyPair: KeyPair = generateKeyPairFromEntropy(entropy);
      const keyPair2: KeyPair = generateKeyPairFromEntropy(entropy);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates a key pair deterministically from 32 bytes', () => {
      const entropy = randomBuffer(32);
      const keyPair: KeyPair = generateKeyPairFromEntropy(entropy);
      const keyPair2: KeyPair = generateKeyPairFromEntropy(entropy);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates different key pairs', () => {
      expect(
        generateKeyPairFromEntropy(randomBuffer(16)),
      ).not.toEqual(
        generateKeyPairFromEntropy(randomBuffer(16)),
      );
    });
  });

  describe('generateKeyPairFromSeedUnsafe()', () => {

    it('generates a key pair deterministically from a Buffer', () => {
      const seed = Buffer.from('mock-seed');
      const keyPair: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      const keyPair2: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates a key pair deterministically from a hex string', () => {
      const seed = '0x1234';
      const keyPair: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      const keyPair2: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates a key pair deterministically from an arbitrary string', () => {
      const seed = 'mock-seed';
      const keyPair: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      const keyPair2: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates a key pair deterministically from a number', () => {
      const seed = 1234;
      const keyPair: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      const keyPair2: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates a key pair using at most 32 bytes from the seed', () => {
      const seed = (
        'This is a very long seed phrase with more bytes than are used by the generation function.'
      );
      const seed2 = `${seed} (unused portion of the seed)`;
      const keyPair: KeyPair = generateKeyPairFromSeedUnsafe(seed);
      const keyPair2: KeyPair = generateKeyPairFromSeedUnsafe(seed2);
      expect(keyPair).toEqual(keyPair2);
    });

    it('generates different key pairs from Buffers', () => {
      expect(
        generateKeyPairFromSeedUnsafe(Buffer.from('1')),
      ).not.toEqual(
        generateKeyPairFromSeedUnsafe(Buffer.from('2')),
      );
    });

    it('generates different key pairs from hex strings', () => {
      expect(
        generateKeyPairFromSeedUnsafe('0x1'),
      ).not.toEqual(
        generateKeyPairFromSeedUnsafe('0x2'),
      );
    });

    it('generates different key pairs from arbitrary strings', () => {
      expect(
        generateKeyPairFromSeedUnsafe('1'),
      ).not.toEqual(
        generateKeyPairFromSeedUnsafe('2'),
      );
    });

    it('generates different key pairs from numbers', () => {
      expect(
        generateKeyPairFromSeedUnsafe(1),
      ).not.toEqual(
        generateKeyPairFromSeedUnsafe(2),
      );
    });
  });
});

/**
 * Generate a random Buffer.
 */
function randomBuffer(numBytes: number): Buffer {
  const bytes = [];
  for (let i = 0; i < numBytes; i++) {
    bytes[i] = Math.floor(Math.random() * 0xff);
  }
  return Buffer.from(bytes);
}
