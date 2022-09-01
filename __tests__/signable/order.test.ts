/**
 * Unit tests for signable/orders.ts.
 */

import Big, { RoundingMode } from 'big.js';
import expect from 'expect';
import _ from 'lodash';

import {
  OrderWithClientId,
  KeyPair,
  StarkwareOrder,
  DydxMarket,
  StarkwareOrderSide,
  OrderWithClientIdAndQuoteAmount,
  OrderWithNonce,
  NetworkId,
} from '../../src/types';
import { generateKeyPairUnsafe } from '../../src/keys';
import { nonceFromClientId } from '../../src/helpers';
import { mutateHexStringAt } from '../util';

// Module under test.
import { SignableOrder } from '../../src/signable/order';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockKeyPairPublicYCoordinate = (
  '211496e5e8ccf71930aebbfb7e815807acbfd0021f17f8b3944a3ed5f06c27'
);
const mockKeyPairEvenY: KeyPair = {
  publicKey: '5c749cd4c44bdc730bc90af9bfbdede9deb2c1c96c05806ce1bc1cb4fed64f7',
  privateKey: '65b7bb244e019b45a521ef990fb8a002f76695d1fc6c1e31911680f2ed78b84',
};
const mockOrder: OrderWithClientId = {
  positionId: '12345',
  humanSize: '145.0005',
  limitFee: '0.125',
  market: DydxMarket.ETH_USD,
  side: StarkwareOrderSide.BUY,
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  humanPrice: '350.00067',
  clientId: 'This is an ID that the client came up with to describe this order',
};
const mockSignature = (
  '07670488d9d2c6ff980ca86e6d05b89414de0f2bfd462a1058fb05add68d034a' +
  '036268ae33e8e21d324e975678f56b66dacb2502a7de1512a46b96fc0e106f79'
);
const mockSignatureEvenY = (
  '0618bcd2a8a027cf407116f88f2fa0d866154ee421cdf8a9deca0fecfda5277b' +
  '03e42fa1d039522fc77c23906253e537cc5b2f392dba6f2dbb35d51cbe37273a'
);

describe('SignableOrder', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature (odd y)', async () => {
      const result = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
      expect(result).toBe(true);
    });

    it('returns true for a valid signature (odd y), with y-coordinate provided', async () => {
      const result = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .verifySignature(mockSignature, mockKeyPair.publicKey, mockKeyPairPublicYCoordinate);
      expect(result).toBe(true);
    });

    it('returns true for a valid signature (even y)', async () => {
      const result = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .verifySignature(mockSignatureEvenY, mockKeyPairEvenY.publicKey);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', async () => {
      // Mutate a single character in r.
      await Promise.all(_.range(2, 4).map(async (i) => {
        const badSignature: string = mutateHexStringAt(mockSignature, i);
        const result = await SignableOrder
          .fromOrder(mockOrder, NetworkId.GOERLI)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }));

      // Mutate a single character in s.
      await Promise.all(_.range(1, 4).map(async (i) => {
        const badSignature: string = mutateHexStringAt(mockSignature, i + 64);
        const result = await SignableOrder
          .fromOrder(mockOrder, NetworkId.GOERLI)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }));
    });

    it('returns false for a invalid signature (odd y), with y-coordinate provided', async () => {
      const badSignature = mutateHexStringAt(mockSignature, 2);
      const result = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .verifySignature(badSignature, mockKeyPair.publicKey, mockKeyPairPublicYCoordinate);
      expect(result).toBe(false);
    });

    it('returns false if the x-coordinate is invalid, when y-coordinate is provided', async () => {
      const badX = mutateHexStringAt(mockKeyPair.publicKey, 20); // Arbitrary offset.
      const result = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .verifySignature(mockSignature, badX, mockKeyPairPublicYCoordinate);
      expect(result).toBe(false);
    });

    it('returns false if the y-coordinate is invalid', async () => {
      const badY = mutateHexStringAt(mockKeyPairPublicYCoordinate, 20); // Arbitrary offset.
      const result = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .verifySignature(mockSignature, mockKeyPair.publicKey, badY);
      expect(result).toBe(false);
    });
  });

  describe('sign()', () => {

    it('signs an order (odd y)', async () => {
      const signature = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('signs an order (even y)', async () => {
      const signature = await SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .sign(mockKeyPairEvenY.privateKey);
      expect(signature).toEqual(mockSignatureEvenY);
    });

    it('signs an order with quoteAmount instead of price', async () => {
      const roundedQuoteAmount = new Big(mockOrder.humanSize)
        .times(mockOrder.humanPrice)
        .round(6, RoundingMode.RoundUp)
        .toFixed();
      const orderWithQuoteAmount: OrderWithClientIdAndQuoteAmount = {
        ...mockOrder,
        humanPrice: undefined,
        humanQuoteAmount: roundedQuoteAmount,
      };
      const signature = await SignableOrder
        .fromOrder(orderWithQuoteAmount, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('signs an order with nonce instead of clientId', async () => {
      const orderWithNonce: OrderWithNonce = {
        ...mockOrder,
        clientId: undefined,
        nonce: nonceFromClientId(mockOrder.clientId),
      };
      const signature = await SignableOrder
        .fromOrderWithNonce(orderWithNonce, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the client ID is different', async () => {
      const order = {
        ...mockOrder,
        clientId: `${mockOrder.clientId}!`,
      };
      const signature = await SignableOrder
        .fromOrder(order, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature for a SELL order', async () => {
      const order = {
        ...mockOrder,
        side: StarkwareOrderSide.SELL,
      };
      const signature = await SignableOrder
        .fromOrder(order, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the position ID is different', async () => {
      const order = {
        ...mockOrder,
        positionId: (Number.parseInt(mockOrder.positionId, 10) + 1).toString(),
      };
      const signature = await SignableOrder
        .fromOrder(order, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });
  });

  describe('toStarkware()', () => {

    it('converts human amounts to quantum amounts and converts expiration to hours', () => {
      const starkwareOrder: StarkwareOrder = SignableOrder
        .fromOrder(mockOrder, NetworkId.GOERLI)
        .toStarkware();
      expect(starkwareOrder.quantumsAmountSynthetic).toBe('145000500000');
      expect(starkwareOrder.quantumsAmountCollateral).toBe('50750272151');
      expect(starkwareOrder.quantumsAmountFee).toBe('6343784019');

      // Order expiration should be rounded up, and should have a buffer added.
      expect(starkwareOrder.expirationEpochHours).toBe(444701);
    });

    it('throws if the market is unknown', () => {
      const order = {
        ...mockOrder,
        market: 'FAKE-MARKET' as DydxMarket,
      };
      expect(
        () => SignableOrder.fromOrder(order, NetworkId.GOERLI).toStarkware(),
      ).toThrow('Unknown market');
    });

    it('correctly handles an expiration close to the start of the hour', () => {
      const order = {
        ...mockOrder,
        expirationIsoTimestamp: '2021-02-24T16:00:00.407Z',
      };
      const starkwareOrder = SignableOrder.fromOrder(order, NetworkId.GOERLI).toStarkware();
      expect(starkwareOrder.expirationEpochHours).toBe(448553);
    });
  });

  it('end-to-end', async () => {
    // Repeat some number of times.
    await Promise.all(_.range(3).map(async () => {
      const keyPair: KeyPair = generateKeyPairUnsafe();
      const signableOrder = SignableOrder.fromOrder(mockOrder, NetworkId.GOERLI);
      const signature = await signableOrder.sign(keyPair.privateKey);

      // Expect to be valid when verifying with the right public key.
      expect(
        await signableOrder.verifySignature(signature, keyPair.publicKey),
      ).toBe(true);

      // Expect to be invalid when verifying with a different public key.
      expect(
        await signableOrder.verifySignature(signature, mockKeyPair.publicKey),
      ).toBe(false);
    }));
  });
});
