/**
 * Unit tests for signable/oracle-price.ts.
 */

import expect from 'expect';
import _ from 'lodash';

import {
  KeyPair,
  OraclePriceWithAssetId,
  OraclePriceWithAssetName,
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
const mockOraclePrice: OraclePriceWithAssetName = {
  assetName: 'BTCUSD',
  oracleName: 'Maker',
  isoTimestamp: '2020-01-01T00:00:00.000Z',
  price: '11512340000000000000000',
};
const mockSignedAssetId = '425443555344000000000000000000004d616b6572';
const mockSignature = (
  '06a7a118a6fa508c4f0eb77ea0efbc8d48a64d4a570d93f5c61cd886877cb920' +
  '06de9006a7bbf610d583d514951c98d15b1a0f6c78846986491d2c8ca049fd55'
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
      await Promise.all(_.range(3).map(async (i) => {
        const badSignature: string = mutateHexStringAt(mockSignature, i);
        const result = await SignableOraclePrice
          .fromPrice(mockOraclePrice)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }));

      // Mutate a single character in s.
      await Promise.all(_.range(3).map(async (i) => {
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

    it('signs an oracle price with asset ID instead of asset name and oracle name', async () => {
      const oraclePriceWithAssetId: OraclePriceWithAssetId = {
        ...mockOraclePrice,
        signedAssetId: mockSignedAssetId,
      };
      const signature = await SignableOraclePrice
        .fromPriceWithAssetId(oraclePriceWithAssetId)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the asset ID is different', async () => {
      const oraclePrice: OraclePriceWithAssetId = {
        ...mockOraclePrice,
        signedAssetId: `${mockSignedAssetId}0`,
      };
      const signature = await SignableOraclePrice
        .fromPriceWithAssetId(oraclePrice)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the timestamp is different', async () => {
      const oraclePrice: OraclePriceWithAssetName = {
        ...mockOraclePrice,
        isoTimestamp: new Date().toISOString(),
      };
      const signature = await SignableOraclePrice
        .fromPrice(oraclePrice)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
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
