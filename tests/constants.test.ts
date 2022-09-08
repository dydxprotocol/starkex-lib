/**
 * Unit tests for constants.ts.
 */

import expect from 'expect';

import {
  SYNTHETIC_ASSET_ID_MAP,
  Flash1Asset,
  COLLATERAL_ASSET_ID_BY_NETWORK_ID,
  NetworkId,
} from '../src';

describe('Constants', () => {

  it('generates the expected collateral asset IDs', () => {
    // expect(COLLATERAL_ASSET_ID_BY_NETWORK_ID[NetworkId.MAINNET]).toBe(
    //   '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d',
    // );
    expect(COLLATERAL_ASSET_ID_BY_NETWORK_ID[NetworkId.GOERLI]).toBe(
      '0x00a21edc9d9997b1b1956f542fe95922518a9e28ace11b7b2972a1974bf5971f',
    );
  });

  it('generates the expected synthetic asset IDs', () => {
    expect(SYNTHETIC_ASSET_ID_MAP[Flash1Asset.BTC]).toBe('0x4254432d3130000000000000000000');
    expect(SYNTHETIC_ASSET_ID_MAP[Flash1Asset.ETH]).toBe('0x4554482d3800000000000000000000');
    expect(SYNTHETIC_ASSET_ID_MAP[Flash1Asset.LINK]).toBe('0x4c494e4b2d37000000000000000000');
  });
});
