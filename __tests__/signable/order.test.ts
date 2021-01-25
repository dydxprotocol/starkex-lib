/**
 * Unit tests for signable/orders.ts.
 */

import Big, { RoundingMode } from 'big.js';
import expect from 'expect';

import {
  OrderWithClientId,
  KeyPair,
  StarkwareOrder,
  DydxMarket,
  StarkwareOrderSide,
  OrderWithClientIdAndQuoteAmount,
  OrderWithNonce,
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
  '0398287472161cba0e6386ff0b2f25f39ba37c646b7bbadace80eee6b8e7157d' +
  '01ba924272e1e42b3211b96bbbe012e7e8101e1b3e5b83ea90d161ad11fcced4'
);
const mockSignatureEvenY = (
  '05cf391a69386f53693344bada2e0d245879f3c6a98971498b2862ff2f359c49' +
  '0737deea7e201eaa86c8d6eeb2c1ca3ce89ac248b3fe1a6182301aa72d6e8e4f'
);

describe('SignableOrder', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature (odd y)', () => {
      const result = SignableOrder
        .fromOrder(mockOrder)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
      expect(result).toBe(true);
    });

    it('returns true for a valid signature (odd y), with y-coordinate provided', () => {
      const result = SignableOrder
        .fromOrder(mockOrder)
        .verifySignature(mockSignature, mockKeyPair.publicKey, mockKeyPairPublicYCoordinate);
      expect(result).toBe(true);
    });

    it('returns true for a valid signature (even y)', () => {
      const result = SignableOrder
        .fromOrder(mockOrder)
        .verifySignature(mockSignatureEvenY, mockKeyPairEvenY.publicKey);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      // Mutate a single character in r.
      for (let i = 0; i < 3; i++) {
        const badSignature: string = mutateHexStringAt(mockSignature, i);
        const result = SignableOrder
          .fromOrder(mockOrder)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }

      // Mutate a single character in s.
      for (let i = 0; i < 3; i++) {
        const badSignature: string = mutateHexStringAt(mockSignature, i + 64);
        const result = SignableOrder
          .fromOrder(mockOrder)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }
    });

    it('returns false for a invalid signature (odd y), with y-coordinate provided', () => {
      const badSignature = mutateHexStringAt(mockSignature, 0);
      const result = SignableOrder
        .fromOrder(mockOrder)
        .verifySignature(badSignature, mockKeyPair.publicKey, mockKeyPairPublicYCoordinate);
      expect(result).toBe(false);
    });

    it('returns false if the x-coordinate is invalid, when y-coordinate is provided', () => {
      const badX = mutateHexStringAt(mockKeyPair.publicKey, 20); // Arbitrary offset.
      const result = SignableOrder
        .fromOrder(mockOrder)
        .verifySignature(mockSignature, badX, mockKeyPairPublicYCoordinate);
      expect(result).toBe(false);
    });

    it('returns false if the y-coordinate is invalid', () => {
      const badY = mutateHexStringAt(mockKeyPairPublicYCoordinate, 20); // Arbitrary offset.
      const result = SignableOrder
        .fromOrder(mockOrder)
        .verifySignature(mockSignature, mockKeyPair.publicKey, badY);
      expect(result).toBe(false);
    });
  });

  describe('sign()', () => {

    it('signs an order (odd y)', () => {
      const signature = SignableOrder
        .fromOrder(mockOrder)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('signs an order (even y)', () => {
      const signature = SignableOrder
        .fromOrder(mockOrder)
        .sign(mockKeyPairEvenY.privateKey);
      expect(signature).toEqual(mockSignatureEvenY);
    });

    it('signs an order with quoteAmount instead of price', () => {
      const roundedQuoteAmount = new Big(mockOrder.humanSize)
        .times(mockOrder.humanPrice)
        .round(6, RoundingMode.RoundUp)
        .toFixed();
      const orderWithQuoteAmount: OrderWithClientIdAndQuoteAmount = {
        ...mockOrder,
        humanPrice: undefined,
        humanQuoteAmount: roundedQuoteAmount,
      };
      const signature = SignableOrder
        .fromOrder(orderWithQuoteAmount)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('signs an order with nonce instead of clientId', () => {
      const orderWithNonce: OrderWithNonce = {
        ...mockOrder,
        clientId: undefined,
        nonce: nonceFromClientId(mockOrder.clientId),
      };
      const signature = SignableOrder
        .fromOrderWithNonce(orderWithNonce)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the client ID is different', () => {
      const order = {
        ...mockOrder,
        clientId: `${mockOrder.clientId}!`,
      };
      const signature = SignableOrder
        .fromOrder(order)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature for a SELL order', () => {
      const order = {
        ...mockOrder,
        side: StarkwareOrderSide.SELL,
      };
      const signature = SignableOrder
        .fromOrder(order)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the position ID is different', () => {
      const order = {
        ...mockOrder,
        positionId: (Number.parseInt(mockOrder.positionId, 10) + 1).toString(),
      };
      const signature = SignableOrder
        .fromOrder(order)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });
  });

  describe('toStarkware()', () => {

    it('converts human amounts to quantum amounts and converts expiration to hours', () => {
      const starkwareOrder: StarkwareOrder = SignableOrder
        .fromOrder(mockOrder)
        .toStarkware();
      expect(starkwareOrder.quantumsAmountSynthetic).toBe('14500050000');
      expect(starkwareOrder.quantumsAmountCollateral).toBe('50750272151');
      expect(starkwareOrder.quantumsAmountFee).toBe('6343784019');

      // Order expiration should be rounded up, and should have a buffer added.
      expect(starkwareOrder.expirationEpochHours).toBe(444581);
    });

    it('throws if the market is unknown', () => {
      const order = {
        ...mockOrder,
        market: 'FAKE-MARKET' as DydxMarket,
      };
      expect(
        () => SignableOrder.fromOrder(order).toStarkware(),
      ).toThrow('Unknown market');
    });
  });

  it('end-to-end', () => {
    // Repeat some number of times.
    for (let i = 0; i < 3; i++) {
      const keyPair: KeyPair = generateKeyPairUnsafe();
      const signableOrder = SignableOrder.fromOrder(mockOrder);
      const signature = signableOrder.sign(keyPair.privateKey);

      // Expect to be valid when verifying with the right public key.
      expect(
        signableOrder.verifySignature(signature, keyPair.publicKey),
      ).toBe(true);

      // Expect to be invalid when verifying with a different public key.
      expect(
        signableOrder.verifySignature(signature, mockKeyPair.publicKey),
      ).toBe(false);
    }
  });
});
