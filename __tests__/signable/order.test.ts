/**
 * Unit tests for signable/orders.ts.
 */

import Big from 'big.js';

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
import { mutateHexStringAt } from './util';

// Module under test.
import { SignableOrder } from '../../src/signable/order';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockKeyPairEvenY: KeyPair = {
  publicKey: '5c749cd4c44bdc730bc90af9bfbdede9deb2c1c96c05806ce1bc1cb4fed64f7',
  privateKey: '65b7bb244e019b45a521ef990fb8a002f76695d1fc6c1e31911680f2ed78b84',
};
const mockOrder: OrderWithClientId = {
  positionId: '12345',
  humanSize: '145.0005',
  humanLimitFee: '0.03298534883328', // Quantum * 3
  market: DydxMarket.ETH_USD,
  side: StarkwareOrderSide.BUY,
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  humanPrice: '350.00067',
  clientId: 'This is an ID that the client came up with to describe this order',
};
const mockSignature = (
  '00b757588b4974d79ca7c12cfa00a18723bbda09bd78a7d60ca6a21c3da0e7be' +
  '005fb899543d7d7b0b20b33d4b74279ed6f58715cd70e33b8f3df8f7bc63992c'
);
const mockSignatureEvenY = (
  '04477e54814f5b5885ebeb64de58b1c1e69d627d8877dc5528146fa59d0263dc' +
  '05b814ef5c766c5693def9b9eb4229ec31bf93058bbd64be7a1d3c9a968acef2'
);

describe('SignableOrder', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature (odd y)', () => {
      const result = SignableOrder
        .fromOrder(mockOrder)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
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
      const orderWithQuoteAmount: OrderWithClientIdAndQuoteAmount = {
        ...mockOrder,
        humanPrice: undefined,
        humanQuoteAmount: new Big(mockOrder.humanSize).times(mockOrder.humanPrice).toFixed(),
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

    it('converts human amounts to quantum amounts', () => {
      const starkwareOrder: StarkwareOrder = SignableOrder
        .fromOrder(mockOrder)
        .toStarkware();
      expect(starkwareOrder.quantumsAmountSynthetic).toEqual('1450005000000');
      expect(starkwareOrder.quantumsAmountCollateral).toEqual('4615710');
      expect(starkwareOrder.quantumsAmountFee).toEqual('3');
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
    for (let i = 0; i < 1; i++) {
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
