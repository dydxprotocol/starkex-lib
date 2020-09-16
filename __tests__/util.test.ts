/**
 * Unit tests for util.ts.
 */

// Module under test.
import {
  normalizeHex,
} from '../src/util';

const HEX_64_RE_LOWER_NO_PREFIX = /^[0-9a-f]{64}$/;

describe('util', () => {

  describe('normalizeHex()', () => {

    it('returns a hex string without 0x prefix', () => {
      expect(normalizeHex('0x00').match(HEX_64_RE_LOWER_NO_PREFIX)).not.toBeFalsy();
    });

    it('pads a string to 32 bytes', () => {
      expect(normalizeHex('00')).toEqual(`${'0'.repeat(64)}`);
    });

    it('throws if the hex string is longer than 32 bytes', () => {
      expect(
        () => normalizeHex(`0x${'0'.repeat(65)}`),
      ).toThrow('Hex string is longer than 32 bytes');
    });
  });
});
