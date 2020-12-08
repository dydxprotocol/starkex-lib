/**
 * Unit tests for keys.ts.
 */

import {
  KeyPair,
} from '../src/types';
import { randomBuffer } from '../src/lib/util';

// Module under test.
import {
  generateKeyPair,
  keyPairFromData,
} from '../src/keys';

const HEX_32_BYTES_LOWER_NO_PREFIX_RE = /^[0-9a-f]{64}$/;

describe('Key generation functions', () => {

  describe('generateKeyPair()', () => {

    it('generates a key pair', () => {
      const keyPair: KeyPair = generateKeyPair();
      expect(keyPair.publicKey).toMatch(HEX_32_BYTES_LOWER_NO_PREFIX_RE);
      expect(keyPair.privateKey).toMatch(HEX_32_BYTES_LOWER_NO_PREFIX_RE);
    });

    it('generates different key pairs', () => {
      expect(
        generateKeyPair(),
      ).not.toEqual(
        generateKeyPair(),
      );
    });
  });

  describe('keyPairFromData()', () => {

    it('generates a key pair deterministically from buffer input', () => {
      const entropy = randomBuffer(32);
      expect(keyPairFromData(entropy)).toEqual(keyPairFromData(entropy));
    });

    it('generates different key pairs from short data', () => {
      expect(keyPairFromData(Buffer.from([0]))).not.toEqual(keyPairFromData(Buffer.from([1])));
      expect(keyPairFromData(Buffer.from([0]))).not.toEqual(keyPairFromData(Buffer.from([2])));
      expect(keyPairFromData(Buffer.from([0]))).not.toEqual(keyPairFromData(Buffer.from([3])));
    });

    it('generates different key pairs from long data', () => {
      const entropy = randomBuffer(200);
      const entropy2 = Buffer.from(entropy);
      entropy2[31] = (entropy[31] + 1) % 0x100;
      expect(keyPairFromData(entropy)).toEqual(keyPairFromData(entropy));
      expect(keyPairFromData(entropy)).not.toEqual(keyPairFromData(entropy2));
    });

    it('throws if provided an empty buffer', () => {
      expect(() => keyPairFromData(Buffer.from([]))).toThrow('Empty buffer');
    });
  });
});
