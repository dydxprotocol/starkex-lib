import {
  HEX_63_RE,
  KeyPair,
  Order,
  Signature,
  generateUnsafeKeyPair,
  sign,
  verifySignature,
} from '../src';

import signatureExample from './data/signature_example.json';

describe('starkex-lib', () => {

  describe('generateUnsafeKeyPair()', () => {

    it('generates a pseudorandom key pair', () => {
      const keyPair: KeyPair = generateUnsafeKeyPair();
      expect(keyPair.publicKey).toMatch(HEX_63_RE);
      expect(keyPair.privateKey).toMatch(HEX_63_RE);
    });
  });

  describe('verifySignature()', () => {

    it('returns true for a valid signature', () => {
      const order: Order = signatureExample.order;
      const signature: Signature = signatureExample.signature;
      const result = verifySignature(order, signature);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      const order: Order = signatureExample.order;
      const signature: Signature = signatureExample.signature;

      // Mutate a single character in r.
      for (let i = 0; i < 63; i++) {
        const badSignature = {
          r: mutateHexStringAt(signature.r, i + 2),
          s: signature.s,
        };
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }

      // Mutate a single character in s.
      for (let i = 0; i < 63; i++) {
        const badSignature = {
          r: signature.r,
          s: mutateHexStringAt(signature.s, i + 2),
        };
        const result = verifySignature(order, badSignature);
        expect(result).toBe(false);
      }
    });
  });

  describe('sign()', () => {

    it('signs an order', () => {
      const keyPair: KeyPair = signatureExample.keyPair;
      const order: Order = signatureExample.order;
      const expectedSignature: Signature = signatureExample.signature;

      const signature: Signature = sign(order, keyPair);
      expect(signature).toEqual(expectedSignature);
    });
  });

  describe('end-to-end', () => {
    const order: Order = signatureExample.order;

    // Repeat several times.
    let failed = false;
    for (let i = 0; i < 10; i++) {
      const keyPair: KeyPair = generateUnsafeKeyPair();
      const signature: Signature = sign(order, keyPair);
      const isValid: boolean = verifySignature(order, signature);
      if (!isValid) {
        /* eslint-disable-next-line no-console */
        console.log(`Failed with key pair: ${keyPair} and signature ${signature}`);
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
