import _ from 'lodash';

import {
  KeyPair,
  Order,
  Signature,
  asEcKeyPair,
  asEcKeyPairPublic,
  asSimpleKeyPair,
  asSimplePublicKey,
  generateKeyPair,
  generateKeyPairFromEntropy,
  generateKeyPairFromMnemonic,
  generateKeyPairFromSeedUnsafe,
  sign,
  verifySignature,
} from '../src';

import signatureExample from './data/signature_example.json';

const HEX_64_RE_LOWER_NO_PREFIX = /^[0-9a-f]{64}$/;
const UNSAFE_MNEMONIC = (
  'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
);

const paddedKeyPair: KeyPair = {
  publicKey: {
    x: signatureExample.keyPair.publicKey.x.padStart(64, '0'),
    y: signatureExample.keyPair.publicKey.y.padStart(64, '0'),
  },
  privateKey: signatureExample.keyPair.privateKey.padStart(64, '0'),
};

describe('starkex-lib', () => {

  describe('generateKeyPair()', () => {

    it('generates a key pair', () => {
      const keyPair: KeyPair = generateKeyPair();
      expect(keyPair.publicKey.x).toMatch(HEX_64_RE_LOWER_NO_PREFIX);
      expect(keyPair.publicKey.y).toMatch(HEX_64_RE_LOWER_NO_PREFIX);
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

  describe('verifySignature()', () => {

    it('returns true for a valid signature', () => {
      const order: Order = signatureExample.order as Order;
      const signature: Signature = signatureExample.signature;
      const result = verifySignature(order, signature);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      const order: Order = signatureExample.order as Order;
      const signature: Signature = signatureExample.signature;

      // Mutate a single character in r.
      for (let i = 0; i < 3; i++) {
        const badSignature: Signature = {
          r: mutateHexStringAt(signature.r, i),
          s: signature.s,
        };
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }

      // Mutate a single character in s.
      for (let i = 0; i < 3; i++) {
        const badSignature: Signature = {
          r: signature.r,
          s: mutateHexStringAt(signature.s, i),
        };
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }
    });
  });

  describe('sign()', () => {

    it('signs an order', () => {
      const privateKey: string = signatureExample.keyPair.privateKey;

      const order: Order = signatureExample.order as Order;
      const expectedSignature: Signature = signatureExample.signature;

      const signature: Signature = sign(order, privateKey);
      expect(signature).toEqual(expectedSignature);
    });
  });

  it('end-to-end', () => {
    const order: Order = signatureExample.order as Order;

    // Repeat a few times.
    let failed = false;
    for (let i = 0; i < 3; i++) {
      const keyPair: KeyPair = generateKeyPair();

      // Should be invalid signing the original, since private key doesn't match public key.
      const invalidSignature: Signature = sign(order, keyPair.privateKey);
      const invalidIsValid = verifySignature(order, invalidSignature);
      if (invalidIsValid) {
        /* eslint-disable-next-line no-console */
        console.log(
          `Expected invalid with pair: ${JSON.stringify(keyPair)} ` +
          `and signature ${JSON.stringify(invalidSignature)}`,
        );
        failed = true;
      }

      const newOrder = {
        ...order,
        publicKey: keyPair.publicKey,
      };
      const validSignature: Signature = sign(newOrder, keyPair.privateKey);
      const isValid = verifySignature(newOrder, validSignature);
      if (!isValid) {
        /* eslint-disable-next-line no-console */
        console.log(
          `Expected valid with pair: ${JSON.stringify(keyPair)} ` +
          `and signature ${JSON.stringify(validSignature)}`,
        );
        failed = true;
      }
    }
    expect(failed).toBe(false);
  });

  describe('asEcKeyPair()', () => {

    it('accepts a key pair as argument', () => {
      const ecKeyPair = asEcKeyPair(signatureExample.keyPair);
      expect(asSimpleKeyPair(ecKeyPair)).toEqual(paddedKeyPair);
    });

    it('accepts just a public key as argument', () => {
      const ecKeyPair = asEcKeyPair(signatureExample.keyPair.privateKey);
      expect(asSimpleKeyPair(ecKeyPair)).toEqual(paddedKeyPair);
    });
  });

  describe('asEcKeyPairPublic()', () => {

    it('accepts a key pair as argument', () => {
      const ecKeyPair = asEcKeyPairPublic(signatureExample.keyPair);
      expect(asSimplePublicKey(ecKeyPair.getPublic())).toEqual(paddedKeyPair.publicKey);
    });

    it('accepts just a public key as argument', () => {
      const ecKeyPair = asEcKeyPairPublic(signatureExample.keyPair.publicKey);
      expect(asSimplePublicKey(ecKeyPair.getPublic())).toEqual(paddedKeyPair.publicKey);
    });
  });
});

/**
 * Return a new hex string which is different from the original hex string at the specified index.
 */
function mutateHexStringAt(s: string, i: number): string {
  const newChar = ((Number.parseInt(s[i], 16) + 1) % 16).toString(16);
  const newString = `${s.slice(0, i)}${newChar}${s.slice(i + 1)}`;
  return newString;
}

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
