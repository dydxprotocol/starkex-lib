/**
 * Unit tests for util.ts.
 */

import expect from 'expect';

// Module under test.
import {
  factToCondition,
  normalizeHex32,
} from '../src/lib/util';

const HEX_32_BYTES_LOWER_NO_PREFIX_RE = /^[0-9a-f]{64}$/;

describe('util', () => {

  describe('factToCondition()', () => {

    it('succeeds', () => {
      expect(factToCondition(
        '0xe4a295420b58a4a7aa5c98920d6e8a0ef875b17a',
        '0xcf9492ae0554c642b57f5d9cabee36fb512dd6b6629bdc51e60efb3118b8c2d8',
      )).toEqual(
        '4d794792504b063843afdf759534f5ed510a3ca52e7baba2e999e02349dd24',
      );
    });
  });

  describe('normalizeHex32()', () => {

    it('returns a 64-character hex string without 0x prefix', () => {
      expect(normalizeHex32('0x00').match(HEX_32_BYTES_LOWER_NO_PREFIX_RE)).not.toBeFalsy();
    });

    it('pads a string to 32 bytes', () => {
      expect(normalizeHex32('00')).toEqual(`${'0'.repeat(64)}`);
    });

    it('throws if the hex string is longer than 32 bytes', () => {
      expect(
        () => normalizeHex32(`0x${'0'.repeat(65)}`),
      ).toThrow('Input does not fit in 32 bytes');
    });
  });
});
