/**
 * Unit tests for helpers/misc.
 */

import expect from 'expect';

// Module under test.
import {
  nonceFromClientId,
} from '../../src/helpers/misc';

describe('misc helpers', () => {

  describe('nonceFromClientId()', () => {

    it('produces the expected nonces', () => {
      expect(nonceFromClientId('')).toBe('2018687061');
      expect(nonceFromClientId('1')).toBe('3079101259');
      expect(nonceFromClientId('a')).toBe('2951628987');
      expect(nonceFromClientId(
        'A really long client ID used to identify an order or withdrawal',
      )).toBe('2913863714');
      expect(nonceFromClientId(
        'A really long client ID used to identify an order or withdrawal!',
      )).toBe('230317226');
    });
  });
});
