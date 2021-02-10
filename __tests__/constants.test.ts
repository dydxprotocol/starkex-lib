/**
 * Unit tests for constants.ts.
 */

import expect from 'expect';

import {
  ASSET_ID_MAP,
  DydxAsset,
} from '../src';

describe('Constants', () => {

  it('generates the expected asset IDs', () => {
    expect(ASSET_ID_MAP[DydxAsset.USDC]).toBe(
      '0x02c04d8b650f44092278a7cb1e1028c82025dff622db96c934b611b84cc8de5a',
    );
    expect(ASSET_ID_MAP[DydxAsset.BTC]).toBe('0x4254432d3130000000000000000000');
    expect(ASSET_ID_MAP[DydxAsset.ETH]).toBe('0x4554482d3900000000000000000000');
    expect(ASSET_ID_MAP[DydxAsset.LINK]).toBe('0x4c494e4b2d37000000000000000000');
  });
});
