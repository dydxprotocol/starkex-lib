import BN from 'bn.js';
import * as crypto from 'starkware-crypto';

import {
  HEX_63_RE,
  KeyPair,
  Order,
  Signature,
  generateKeyPair,
  sign,
  verifySignature,
} from '../src';

import signatureExample from './data/signature_example.json';

describe('starkex-lib', () => {

  describe('generateKeyPair()', () => {

    it('generates a key pair', () => {
      const keyPair: KeyPair = generateKeyPair();
      expect(keyPair.getPublic()).toMatch(HEX_63_RE);
      expect(keyPair.getPrivate()).toMatch(HEX_63_RE);
    });
  });

  describe('verifySignature()', () => {

    it('returns true for a valid signature', () => {
      const order: Order = signatureExample.order as Order;
      const signature = new Signature(signatureExample.signature);
      const result = verifySignature(order, signature);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      const order: Order = signatureExample.order as Order;
      const signature = new Signature(signatureExample.signature);

      // Mutate a single character in r.
      for (let i = 0; i < 63; i++) {
        const badSignature = new Signature({
          r: mutateBnAt(signature.r, i + 2),
          s: signature.s,
        });
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }

      // Mutate a single character in s.
      for (let i = 0; i < 63; i++) {
        const badSignature = new Signature({
          r: signature.r,
          s: mutateBnAt(signature.s, i + 2),
        });
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }
    });
  });

  describe('sign()', () => {

    it('signs an order', () => {
      const keyPair = crypto.ec.keyFromPrivate(signatureExample.keyPair.privateKey);

      const order: Order = signatureExample.order as Order;
      const expectedSignature = new Signature(signatureExample.signature);

      const signature: Signature = sign(order, keyPair);
      expect(signature).toEqual(expectedSignature);
    });
  });

  describe('end-to-end', () => {
    const order: Order = signatureExample.order as Order;

    // Repeat several times.
    let failed = false;
    for (let i = 0; i < 10; i++) {
      const keyPair: KeyPair = generateKeyPair();

      // Should be invalid signing the original order.
      const invalidSignature: Signature = sign(order, keyPair);
      const invalidIsValid = verifySignature(order, invalidSignature);
      if (invalidIsValid) {
        /* eslint-disable-next-line no-console */
        console.log(`Expected invalid with pair: ${keyPair} and signature ${invalidSignature}`);
        failed = true;
      }

      const publicKey = keyPair.getPublic();
      const newOrder = {
        ...order,
        publicKey: {
          x: publicKey.getX().toString('hex'),
          y: publicKey.getY().toString('hex'),
        },
      };
      const validSignature: Signature = sign(newOrder, keyPair);
      const isValid = verifySignature(order, validSignature);
      if (!isValid) {
        /* eslint-disable-next-line no-console */
        console.log(`Expected valid with pair: ${keyPair} and signature ${validSignature}`);
        failed = true;
      }
    }
    expect(failed).toBe(false);
  });
});

/**
 * Return a new BN modified by one character in the hex representation at the specified index.
 */
function mutateBnAt(bn: BN, i: number): BN {
  const hex = bn.toString('hex');
  const newChar = ((Number.parseInt(hex[i], 16) + 1) % 16).toString(16);
  const newHex = `${hex.slice(0, i)}${newChar}${hex.slice(i + 1)}`;
  return new BN(newHex, 'hex');
}
