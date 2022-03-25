import { DydxAsset, DydxMarket } from '../src/types';
import { ASSET_RESOLUTION, SYNTHETIC_ASSET_MAP } from '../src/constants';
import expect from 'expect';

describe('DydxMarket', () => {
  const cases = Object.entries(DydxMarket); // returns[[ 'BTC_USD', 'BTC-USD' ], ...]
  const edgeCases = [DydxMarket.ONEINCH_USD]; // handle non-matching left-hand component
  it('correctly maps enum values', () => {
    cases.filter(([_, v]) => !edgeCases.includes(v)).forEach(([k, v]) => {
      const enumKeyParts = k.split('_');
      const enumValParts = v.split('-');
      expect(enumKeyParts).toEqual(enumValParts);
      expect(enumKeyParts.length).toBe(2);
      expect(enumValParts.length).toBe(2);
    });
  });

  it('correctly maps enum values of edge cases', () => {
    cases.filter(([_, v]) => edgeCases.includes(v)).forEach(([k, v]) => {
      const enumKeyParts = k.split('_');
      const enumValParts = v.split('-');
      expect(enumKeyParts.slice(1)).toEqual(enumValParts.slice(1));
      expect(enumKeyParts.length).toBe(2);
      expect(enumValParts.length).toBe(2);
    });
  });

});

describe('SYNTHETIC_ASSET_MAP', () => {
  it('contains all assets in DydxMarket', () => {
    expect(Object.keys(SYNTHETIC_ASSET_MAP)).toEqual(Object.values(DydxMarket));
  });

  it('contains all markets in TOTAL_CORE_MARKETS_ARRAY', () => {
    const assets = Object.keys(ASSET_RESOLUTION);
    expect(Object.values(SYNTHETIC_ASSET_MAP).every((x) => assets.includes(x))).toBeTruthy();
  });

  it('contains all assets in DydxAsset', () => {
    const assets = Object.values(DydxAsset).filter((x) => x !== DydxAsset.USDC);
    expect(Object.values(SYNTHETIC_ASSET_MAP)).toEqual(assets);
  });
});
