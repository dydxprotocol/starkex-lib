import {
  HEX_64_RE,
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
      expect(keyPair.publicKey.x).toMatch(HEX_64_RE);
      expect(keyPair.publicKey.y).toMatch(HEX_64_RE);
      expect(keyPair.privateKey).toMatch(HEX_64_RE);
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
});

/**
 * Return a new hex string which is different from the original hex string at the specified index.
 */
function mutateHexStringAt(s: string, i: number): string {
  const newChar = ((Number.parseInt(s[i], 16) + 1) % 16).toString(16);
  const newString = `${s.slice(0, i)}${newChar}${s.slice(i + 1)}`;
  return newString;
}
