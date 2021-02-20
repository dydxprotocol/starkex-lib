/**
 * Unit tests for helpers/misc.
 */

import expect from 'expect';

// Module under test.
import {
  factToCondition,
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

  describe('factToCondition()', () => {

    it('produces the expected condition', () => {
      expect(factToCondition(
        '0xe4a295420b58a4a7aa5c98920d6e8a0ef875b17a',
        '0xcf9492ae0554c642b57f5d9cabee36fb512dd6b6629bdc51e60efb3118b8c2d8',
      )).toEqual(
        '4d794792504b063843afdf759534f5ed510a3ca52e7baba2e999e02349dd24',
      );
    });
  });
});
