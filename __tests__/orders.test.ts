/**
 * Unit tests for orders.ts.
 *
 * TODO: These tests run really slow since some crypto functions, e.g. crypto.ec.keyFromPublic(),
 * run very slowly during tests. They seem to run quickly outside of tests. I haven't figured out
 * why this is, but could have to do with how Jest handles module loading.
 */

import Big from 'big.js';
import _ from 'lodash';

import {
  InternalOrder,
  KeyPair,
  OrderSide,
  PerpetualMarket,
  StarkwareOrder,
} from '../src/types';
import { generateKeyPair } from '../src/keys';
import { normalizeHex } from '../src/util';

// Module under test.
import Order from '../src/order';

// Mock params.
import signatureExample from './data/signature_example.json';

const paddedKeyPair: KeyPair = _.mapValues(signatureExample.keyPair, normalizeHex);

describe('Orders', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature (even y)', () => {
      const order: InternalOrder = {
        ...(signatureExample.order as InternalOrder),
        starkKey: signatureExample.keyPairEvenY.publicKey,
      };
      const result = Order.fromInternal(order).verifySignature(signatureExample.signatureEvenY);
      expect(result).toBe(true);
    });

    it('returns true for a valid signature (odd y)', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const signature: string = signatureExample.signature;
      const result = Order.fromInternal(order).verifySignature(signature);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const signature: string = signatureExample.signature;

      // Mutate a single character in r.
      for (let i = 0; i < 3; i++) {
        const badSignature: string = mutateHexStringAt(signature, i);
        const result = Order.fromInternal(order).verifySignature(badSignature);
        expect(result).toBe(false);
      }

      // Mutate a single character in s.
      for (let i = 0; i < 3; i++) {
        const badSignature: string = mutateHexStringAt(signature, i + 64);
        const result = Order.fromInternal(order).verifySignature(badSignature);
        expect(result).toBe(false);
      }
    });
  });

  describe('sign()', () => {

    it('signs an order', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const privateKey: string = signatureExample.keyPair.privateKey;
      const expectedSignature: string = signatureExample.signature;
      const signature: string = Order.fromInternal(order).sign(privateKey);
      expect(signature).toEqual(expectedSignature);
    });

    it('signs an order (even y)', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const privateKey: string = signatureExample.keyPairEvenY.privateKey;
      const expectedSignature: string = signatureExample.signatureEvenY;
      const signature: string = Order.fromInternal(order).sign(privateKey);
      expect(signature).toEqual(expectedSignature);
    });

    it('signs an order with quoteAmount instead of price', () => {
      const originalOrder = signatureExample.order as InternalOrder;
      const order: InternalOrder = {
        ...originalOrder,
        quoteAmount: new Big(originalOrder.size).times(originalOrder.price!).toFixed(),
        price: undefined,
      };
      const privateKey: string = signatureExample.keyPair.privateKey;
      const expectedSignature: string = signatureExample.signature;
      const signature: string = Order.fromInternal(order).sign(privateKey);
      expect(signature).toEqual(expectedSignature);
    });

    it('generates a different signature when the client ID is different', () => {
      const privateKey: string = signatureExample.keyPair.privateKey;
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const newOrder = {
        ...order,
        clientId: `${order.clientId}!`,
      };
      const newSignature = Order.fromInternal(newOrder).sign(privateKey);
      expect(newSignature).not.toEqual(paddedKeyPair);
    });

    it('generates a different signature for a SELL order', () => {
      const privateKey: string = signatureExample.keyPair.privateKey;
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const newOrder = {
        ...order,
        side: OrderSide.SELL,
      };
      const newSignature = Order.fromInternal(newOrder).sign(privateKey);
      expect(newSignature).not.toEqual(paddedKeyPair);
    });

    it('generates a different signature when the account ID is different', () => {
      const privateKey: string = signatureExample.keyPair.privateKey;
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const newOrder: InternalOrder = {
        ...order,
        positionId: (Number.parseInt(order.positionId, 10) + 1).toString(),
      };
      const newSignature = Order.fromInternal(newOrder).sign(privateKey);
      expect(newSignature).not.toEqual(paddedKeyPair);
    });
  });

  describe('toStarkware()', () => {

    it('applies token decimals', () => {
      const order: InternalOrder = signatureExample.order as InternalOrder;
      const starkwareOrder: StarkwareOrder = Order.fromInternal(order).toStarkware();
      expect(starkwareOrder.amountSynthetic).toEqual('14500050000');
      expect(starkwareOrder.amountCollateral).toEqual('50750272150');
      expect(starkwareOrder.amountFee).toEqual('123456000');
    });

    it('throws if the market is unknown', () => {
      const order: InternalOrder = {
        ...(signatureExample.order as InternalOrder),
        market: 'FAKE-MARKET' as PerpetualMarket,
      };
      expect(() => Order.fromInternal(order).toStarkware()).toThrow('Unknown market');
    });
  });

  it('end-to-end', () => {
    const internalOrder: InternalOrder = signatureExample.order as InternalOrder;

    // Repeat a few times.
    let failed = false;
    for (let i = 0; i < 1; i++) {
      const keyPair: KeyPair = generateKeyPair();

      // Expect to be invalid since private key should not match the order public key.
      const order = Order.fromInternal(internalOrder);
      const invalidSignature: string = order.sign(keyPair.privateKey);
      if (order.verifySignature(invalidSignature)) {
        /* eslint-disable-next-line no-console */
        console.log(
          `Expected invalid with pair: ${JSON.stringify(keyPair)} ` +
          `and signature ${JSON.stringify(invalidSignature)}`,
        );
        failed = true;
      }

      // Expect to be valid after updating the public key in the order.
      const newOrder = Order.fromInternal({
        ...internalOrder,
        starkKey: keyPair.publicKey,
      });
      const validSignature: string = newOrder.sign(keyPair.privateKey);
      if (!newOrder.verifySignature(validSignature)) {
        /* eslint-disable-next-line no-console */
        console.log(
          `Expected valid with pair: ${JSON.stringify(keyPair)} ` +
          `and signature ${JSON.stringify(validSignature)}`,
        );
        failed = true;
      }
    }
    expect(failed).toBe(false);
  });
});

/**
 * Return a new hex string which is different from the original hex string at the specified index.
 */
function mutateHexStringAt(s: string, i: number): string {
  const newChar = ((Number.parseInt(s[i], 16) + 1) % 16).toString(16);
  const newString = `${s.slice(0, i)}${newChar}${s.slice(i + 1)}`;
  return newString;
}
