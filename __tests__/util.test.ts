/**
 * Unit tests for util.ts.
 */

import expect from 'expect';

// Module under test.
import {
  normalizeHex32,
} from '../src/lib/util';

const HEX_32_BYTES_LOWER_NO_PREFIX_RE = /^[0-9a-f]{64}$/;

describe('util', () => {

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
