/**
 * Unit tests for keys.ts.
 */

import expect from 'expect';

import {
  KeyPair,
} from '../src/types';
import { randomBuffer } from '../src/lib/util';

// Module under test.
import {
  generateKeyPairUnsafe,
  keyPairFromData,
} from '../src/keys';

const HEX_32_BYTES_LOWER_NO_PREFIX_RE = /^[0-9a-f]{64}$/;

describe('Key generation functions', () => {

  describe('generateKeyPair()', () => {

    it('generates a key pair', () => {
      const keyPair: KeyPair = generateKeyPairUnsafe();
      expect(keyPair.publicKey).toMatch(HEX_32_BYTES_LOWER_NO_PREFIX_RE);
      expect(keyPair.privateKey).toMatch(HEX_32_BYTES_LOWER_NO_PREFIX_RE);
    });

    it('generates different key pairs', () => {
      expect(
        generateKeyPairUnsafe(),
      ).not.toEqual(
        generateKeyPairUnsafe(),
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

    it('generates the expected key pairs', () => {
      // Make sure that the mapping from buffer to key pair doesn't change unexpectedly.
      expect(keyPairFromData(Buffer.from('0'))).toEqual({
        publicKey: '069a33d37101d7089b606f92e4b41553c237a474ad9d6f62eeb6708415f98f4d',
        publicKeyYCoordinate: '0717e78b98a53888aa7685b91137fa01b9336ce7d25f874dbfb8d752c6ac610d',
        privateKey: '002242959533856f2a03f3c7d9431e28ef4fe5cb2a15038c37f1d76d35dc508b',
      });
      expect(keyPairFromData(Buffer.from('a'))).toEqual({
        publicKey: '01b831960e94e1825a1f88a02906662d84696fed516304bd1523ae8ba354affb',
        publicKeyYCoordinate: '078a856dfe1ee326ba0446a1c134bf148a76d73523dae91876bae923405b87eb',
        privateKey: '01d61128b46faa109512e0e00fe9adf5ff52047ed61718eeeb7c0525dfcd2f8e',
      });
      expect(keyPairFromData(Buffer.from(
        'really long input data for key generation with the keyPairFromData() function',
      ))).toEqual({
        publicKey: '0179decc2752db9934392f19d74a13e3068f285caf55e9563c8ee881f022aaa2',
        publicKeyYCoordinate: '018fe7e4e4ca452cf45ee74b34f736e547bad2a6a60eba41384401a523d67a7e',
        privateKey: '007c4946831bde597b73f1d5721af9c67731eafeb75c1b8e92ac457a61819a29',
      });
    });
  });
});
