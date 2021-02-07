/**
 * Unit tests for signable/oracle-price.ts.
 */

import expect from 'expect';
import _ from 'lodash';

import {
  DydxMarket,
  KeyPair,
  OraclePriceParams,
} from '../../src/types';
import { generateKeyPairUnsafe } from '../../src/keys';
import { mutateHexStringAt } from '../util';

// Module under test.
import { SignableOraclePrice } from '../../src/signable/oracle-price';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '1895a6a77ae14e7987b9cb51329a5adfb17bd8e7c638f92d6892d76e51cebcf',
  privateKey: '178047D3869489C055D7EA54C014FFB834A069C9595186ABE04EA4D1223A03F',
};
const mockOraclePrice: OraclePriceParams = {
  market: DydxMarket.BTC_USD,
  oracleName: 'dYdX',
  humanPrice: '11512.34',
  isoTimestamp: '2020-01-01T00:00:00.000Z',
};
const mockSignature = (
  '020b64c5ead744a9a39bb20cee8193e15958d2f5bc065a3a31a8245d800907ae' +
  '0043e5681d7fd1e0720cc578e3d076ea29dbfe902f30445da8aa74bd112aa710'
);

describe('SignableOraclePrice', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature', async () => {
      const result = await SignableOraclePrice
        .fromPrice(mockOraclePrice)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', async () => {
      // Mutate a single character in r.
      await Promise.all(_.range(1, 4).map(async (i) => {
        const badSignature: string = mutateHexStringAt(mockSignature, i);
        const result = await SignableOraclePrice
          .fromPrice(mockOraclePrice)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }));

      // Mutate a single character in s.
      await Promise.all(_.range(1, 4).map(async (i) => {
        const badSignature: string = mutateHexStringAt(mockSignature, i + 64);
        const result = await SignableOraclePrice
          .fromPrice(mockOraclePrice)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }));
    });
  });

  describe('sign()', () => {

    it('signs an oracle price', async () => {
      const signature = await SignableOraclePrice
        .fromPrice(mockOraclePrice)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the market is different', async () => {
      const oraclePrice: OraclePriceParams = {
        ...mockOraclePrice,
        market: DydxMarket.ETH_USD,
      };
      const signature = await SignableOraclePrice
        .fromPrice(oraclePrice)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the oracle name is different', async () => {
      const oraclePrice: OraclePriceParams = {
        ...mockOraclePrice,
        oracleName: 'Other',
      };
      const signature = await SignableOraclePrice
        .fromPrice(oraclePrice)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the timestamp is different', async () => {
      const oraclePrice: OraclePriceParams = {
        ...mockOraclePrice,
        isoTimestamp: new Date().toISOString(),
      };
      const signature = await SignableOraclePrice
        .fromPrice(oraclePrice)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('throws an error if the oracle name is too long', async () => {
      const oraclePrice: OraclePriceParams = {
        ...mockOraclePrice,
        oracleName: 'Other2',
      };
      expect(
        () => SignableOraclePrice.fromPrice(oraclePrice),
      ).toThrow('Input does not fit in numBits=40 bits');
    });
  });

  it('end-to-end', async () => {
    // Repeat some number of times.
    await Promise.all(_.range(3).map(async () => {
      const keyPair: KeyPair = generateKeyPairUnsafe();
      const signableOraclePrice = SignableOraclePrice.fromPrice(mockOraclePrice);
      const signature = await signableOraclePrice.sign(keyPair.privateKey);

      // Expect to be valid when verifying with the right public key.
      expect(
        await signableOraclePrice.verifySignature(signature, keyPair.publicKey),
      ).toBe(true);

      // Expect to be invalid when verifying with a different public key.
      expect(
        await signableOraclePrice.verifySignature(signature, mockKeyPair.publicKey),
      ).toBe(false);
    }));
  });
});
