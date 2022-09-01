/**
 * Unit tests for helpers/assets.
 */

import expect from 'expect';

import {
  SYNTHETIC_ASSET_ID_MAP,
  COLLATERAL_ASSET_ID_BY_NETWORK_ID,
} from '../../src/constants';
import {
  DydxAsset,
  DydxMarket,
  NetworkId,
  StarkwareOrderSide,
} from '../../src/types';

// Module under test.
import {
  fromQuantums,
  getStarkwareAmounts,
  getStarkwareLimitFeeAmount,
  toQuantumsExact,
  toQuantumsRoundDown,
  toQuantumsRoundUp,
} from '../../src/helpers/assets';

describe('assets helpers', () => {

  describe('fromQuantums()', () => {

    it('converts a number of quantums to a human-readable amount', () => {
      expect(
        fromQuantums('1000', DydxAsset.ETH),
      ).toBe('0.000001');
    });

    it('throws if the asset is unknown', () => {
      expect(() => {
        fromQuantums('1000', 'UNKNOWN' as DydxAsset);
      }).toThrow('Unknown asset');
    });
  });

  describe('getStarkwareAmounts()', () => {

    it('converts order params to Starkware order params', () => {
      expect(
        getStarkwareAmounts({
          market: DydxMarket.BTC_USD,
          side: StarkwareOrderSide.SELL,
          humanSize: '250.0000000001',
          humanPrice: '1.23456789',
        }, NetworkId.GOERLI),
      ).toStrictEqual({
        quantumsAmountSynthetic: '2500000000001',
        quantumsAmountCollateral: '308641972',
        assetIdSynthetic: SYNTHETIC_ASSET_ID_MAP[DydxAsset.BTC],
        assetIdCollateral: COLLATERAL_ASSET_ID_BY_NETWORK_ID[NetworkId.GOERLI],
        isBuyingSynthetic: false,
      });
    });

    it('converts order params with a quote amount instead of price', () => {
      expect(
        getStarkwareAmounts({
          market: DydxMarket.BTC_USD,
          side: StarkwareOrderSide.SELL,
          humanSize: '250.0000000001',
          humanQuoteAmount: '308.641972',
        }, NetworkId.GOERLI),
      ).toStrictEqual({
        quantumsAmountSynthetic: '2500000000001',
        quantumsAmountCollateral: '308641972',
        assetIdSynthetic: SYNTHETIC_ASSET_ID_MAP[DydxAsset.BTC],
        assetIdCollateral: COLLATERAL_ASSET_ID_BY_NETWORK_ID[NetworkId.GOERLI],
        isBuyingSynthetic: false,
      });
    });

    it('throws if the order size is not a multiple of the Starkware quantum', () => {
      expect(() => {
        getStarkwareAmounts({
          market: DydxMarket.BTC_USD,
          side: StarkwareOrderSide.SELL,
          humanSize: '250.00000000001',
          humanPrice: '1.23456789',
        }, NetworkId.GOERLI);
      }).toThrow('not a multiple of the quantum size');
    });

    it('throws if the quote amount is given and is not a multiple of the Starkware quantum', () => {
      expect(() => {
        getStarkwareAmounts({
          market: DydxMarket.BTC_USD,
          side: StarkwareOrderSide.SELL,
          humanSize: '250.0000000001',
          humanQuoteAmount: '308.6419721',
        }, NetworkId.GOERLI);
      }).toThrow('not a multiple of the quantum size');
    });
  });

  describe('toQuantumsExact()', () => {

    it('converts a human readable amount to an integer number of quantums', () => {
      expect(
        toQuantumsExact('12.0000003', DydxAsset.LINK),
      ).toBe('120000003');
    });

    it('throws if the amount does not divide evenly by the quantum size', () => {
      expect(() => {
        toQuantumsExact('12.00000031', DydxAsset.LINK);
      }).toThrow('not a multiple of the quantum size');
    });
  });

  describe('toQuantumsRoundDown()', () => {

    it('converts a human readable amount to an integer number of quantums', () => {
      expect(
        toQuantumsRoundDown('12.0000003', DydxAsset.LINK),
      ).toBe('120000003');
    });

    it('rounds down if the amount does not divide evenly by the quantum size', () => {
      expect(
        toQuantumsRoundDown('12.00000031', DydxAsset.LINK),
      ).toBe('120000003');
    });
  });

  describe('toQuantumsRoundUp()', () => {

    it('converts a human readable amount to an integer number of quantums', () => {
      expect(
        toQuantumsRoundUp('12.0000003', DydxAsset.LINK),
      ).toBe('120000003');
    });

    it('rounds up if the amount does not divide evenly by the quantum size', () => {
      expect(
        toQuantumsRoundUp('12.00000031', DydxAsset.LINK),
      ).toBe('120000004');
    });
  });

  describe('getStarkwareLimitFeeAmount()', () => {

    it('converts the order limit fee as expected (edge case)', () => {
      expect(
        getStarkwareLimitFeeAmount(
          '0.000001999999999999999999999999999999999999999999',
          '50750272151',
        ),
      ).toBe('50751');
    });
  });
});
