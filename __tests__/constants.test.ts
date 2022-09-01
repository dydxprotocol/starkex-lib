/**
 * Unit tests for constants.ts.
 */

import expect from 'expect';

import {
  SYNTHETIC_ASSET_ID_MAP,
  DydxAsset,
  COLLATERAL_ASSET_ID_BY_NETWORK_ID,
  NetworkId,
} from '../src';

describe('Constants', () => {

  it('generates the expected collateral asset IDs', () => {
    expect(COLLATERAL_ASSET_ID_BY_NETWORK_ID[NetworkId.MAINNET]).toBe(
      '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d',
    );
    expect(COLLATERAL_ASSET_ID_BY_NETWORK_ID[NetworkId.GOERLI]).toBe(
      '0x03bda2b4764039f2df44a00a9cf1d1569a83f95406a983ce4beb95791c376008',
    );
    expect(COLLATERAL_ASSET_ID_BY_NETWORK_ID[NetworkId.ROPSTEN]).toBe(
      '0x02c04d8b650f44092278a7cb1e1028c82025dff622db96c934b611b84cc8de5a',
    );
  });

  it('generates the expected synthetic asset IDs', () => {
    expect(SYNTHETIC_ASSET_ID_MAP[DydxAsset.BTC]).toBe('0x4254432d3130000000000000000000');
    expect(SYNTHETIC_ASSET_ID_MAP[DydxAsset.ETH]).toBe('0x4554482d3900000000000000000000');
    expect(SYNTHETIC_ASSET_ID_MAP[DydxAsset.LINK]).toBe('0x4c494e4b2d37000000000000000000');
  });
});
