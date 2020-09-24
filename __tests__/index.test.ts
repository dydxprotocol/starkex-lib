/**
 * Unit tests for starkex-lib.
 *
 * Note that some of the crypto functions, including crypto.ec.keyFromPublic(), run very slowly
 * during tests. However, they seem to run quickly outside of tests. I haven't figured out why this
 * is, but could have to do with how Jest handles module loading.
 */

import _ from 'lodash';

import {
  InternalOrder,
  KeyPair,
  OrderSide,
  PerpetualMarket,
  StarkwareOrder,
} from '../src/types';
import { normalizeHex } from '../src/util';

// Module under test.
import {
  convertToStarkwareOrder,
  generateKeyPair,
  generateKeyPairFromEntropy,
  generateKeyPairFromMnemonic,
  generateKeyPairFromSeedUnsafe,
  sign,
  verifySignature,
} from '../src';

// Mock params.
import signatureExample from './data/signature_example.json';

const HEX_64_RE_LOWER_NO_PREFIX = /^[0-9a-f]{64}$/;
const UNSAFE_MNEMONIC = (
  'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
);

const paddedKeyPair: KeyPair = _.mapValues(signatureExample.keyPair, normalizeHex);

describe('starkex-lib', () => {

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

  describe('verifySignature()', () => {

    it('returns true for a valid signature (even y)', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const publicKey = signatureExample.keyPairEvenY.publicKey;
      const newOrder: InternalOrder = {
        ...order,
        starkKey: publicKey,
      };
      const expectedSignature: string = signatureExample.signatureEvenY;
      const result = verifySignature(newOrder, expectedSignature);
      expect(result).toBe(true);
    });

    it('returns true for a valid signature (odd y)', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const signature: string = signatureExample.signature;
      const result = verifySignature(order, signature);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const signature: string = signatureExample.signature;

      // Mutate a single character in r.
      for (let i = 0; i < 3; i++) {
        const badSignature: string = mutateHexStringAt(signature, i);
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }

      // Mutate a single character in s.
      for (let i = 0; i < 3; i++) {
        const badSignature: string = mutateHexStringAt(signature, i + 64);
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }
    });
  });

  describe('sign()', () => {

    it('signs an order', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const privateKey: string = signatureExample.keyPair.privateKey;
      const expectedSignature: string = signatureExample.signature;
      const signature: string = sign(order, privateKey);
      expect(signature).toEqual(expectedSignature);
    });

    it('generates a different signature when the client ID is different', () => {
      const privateKey: string = signatureExample.keyPair.privateKey;
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const newOrder = {
        ...order,
        clientId: `${order.clientId}!`,
      };
      const newSignature = sign(newOrder, privateKey);
      expect(newSignature).not.toEqual(paddedKeyPair);
    });

    it('generates a different signature for a SELL order', () => {
      const privateKey: string = signatureExample.keyPair.privateKey;
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const newOrder = {
        ...order,
        side: OrderSide.SELL,
      };
      const newSignature = sign(newOrder, privateKey);
      expect(newSignature).not.toEqual(paddedKeyPair);
    });

    it('generates a different signature when the account ID is different', () => {
      const privateKey: string = signatureExample.keyPair.privateKey;
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const newOrder: InternalOrder = {
        ...order,
        positionId: (Number.parseInt(order.positionId, 10) + 1).toString(),
      };
      const newSignature = sign(newOrder, privateKey);
      expect(newSignature).not.toEqual(paddedKeyPair);
    });
  });

  describe('convertToStarkwareOrder()', () => {

    it('applies token decimals', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const starkwareOrder: StarkwareOrder = convertToStarkwareOrder(order);
      expect(starkwareOrder.amountBuy).toEqual('14500050000');
      expect(starkwareOrder.amountSell).toEqual('50750272150');
      expect(starkwareOrder.amountFee).toEqual('123456000');
    });

    it('throws if the market is unknown', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const newOrder: InternalOrder = {
        ...order,
        market: 'FAKE-MARKET' as PerpetualMarket,
      };
      expect(() => convertToStarkwareOrder(newOrder)).toThrow('Unknown market');
    });
  });

  it('end-to-end', () => {
    const order: InternalOrder = signatureExample.order as InternalOrder;

    // Repeat a few times.
    let failed = false;
    for (let i = 0; i < 1; i++) {
      const keyPair: KeyPair = generateKeyPair();

      // Should be invalid signing the original, since private key doesn't match public key.
      const invalidSignature: string = sign(order, keyPair.privateKey);
      const invalidIsValid = verifySignature(order, invalidSignature);
      if (invalidIsValid) {
        /* eslint-disable-next-line no-console */
        console.log(
          `Expected invalid with pair: ${JSON.stringify(keyPair)} ` +
          `and signature ${JSON.stringify(invalidSignature)}`,
        );
        failed = true;
      }

      const newOrder: InternalOrder = {
        ...order,
        starkKey: keyPair.publicKey,
      };
      const validSignature: string = sign(newOrder, keyPair.privateKey);
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
