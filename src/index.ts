import assert from 'assert';

import BN from 'bn.js';
import * as encUtils from 'enc-utils';
import * as crypto from 'starkware-crypto';

import { ORDER_FIELD_LENGTHS, ORDER_MAX_VALUES, TOKEN_STRUCTS } from './constants';
import {
  EcKeyPair,
  EcSignature,
  KeyPair,
  Order,
  Signature,
} from './types';
import { bnToHex } from './util';

export * from './constants';
export * from './types';

/**
 * Generate a StarkEx key pair. Represent as a simplified object.
 */
export function generateKeyPair(): KeyPair {
  const ecKeyPair: EcKeyPair = crypto.ec.genKeyPair();
  const ecPublicKey = ecKeyPair.getPublic();
  return {
    publicKey: {
      x: bnToHex(ecPublicKey.getX()),
      y: bnToHex(ecPublicKey.getY()),
    },
    privateKey: bnToHex(ecKeyPair.getPrivate()),
  };
}

/**
 * Verify the signature is valid for the order and for the public key mentioned in the order.
 */
export function verifySignature(
  order: Order,
  signature: Signature,
): boolean {
  const key = crypto.ec.keyFromPublic(order.publicKey, 'hex');
  const orderHash = getOrderHash(order);
  return key.verify(orderHash, signature);
}

/**
 * Sign an order with the given private key (represented as a hex string).
 */
export function sign(
  order: Order,
  privateKey: string,
): Signature {
  const orderHash = getOrderHash(order);
  const keyPair = crypto.ec.keyFromPrivate(encUtils.removeHexPrefix(privateKey));
  const ecSignature: EcSignature = keyPair.sign(orderHash);
  return {
    r: bnToHex(ecSignature.r),
    s: bnToHex(ecSignature.s),
  };
}

export function getOrderHash(
  order: Order,
): string {
  // TODO:
  // I'm following their existing example but we'll have to update the exact encoding details later.
  const orderTypeBn = new BN('0');
  const nonceBn = new BN(order.nonce);
  const amountSellBn = new BN(order.amountSell);
  const amountBuyBn = new BN(order.amountBuy);
  const amountFeeBn = new BN(order.amountFee);
  const positionIdBn = new BN(order.positionId);
  const expirationTimestampBn = new BN(order.expirationTimestamp);

  // Validate the data is the right size.
  assert(nonceBn.lt(ORDER_MAX_VALUES.nonce));
  assert(amountSellBn.lt(ORDER_MAX_VALUES.amountSell));
  assert(amountBuyBn.lt(ORDER_MAX_VALUES.amountBuy));
  assert(amountFeeBn.lt(ORDER_MAX_VALUES.amountFee));
  assert(positionIdBn.lt(ORDER_MAX_VALUES.positionId));
  assert(expirationTimestampBn.lt(ORDER_MAX_VALUES.expirationTimestamp));

  // Serialize the order as a hex string.
  let serialized = orderTypeBn;
  serialized = serialized.ushln(ORDER_FIELD_LENGTHS.nonce).add(nonceBn);
  serialized = serialized.ushln(ORDER_FIELD_LENGTHS.amountSell).add(amountSellBn);
  serialized = serialized.ushln(ORDER_FIELD_LENGTHS.amountBuy).add(amountBuyBn);
  serialized = serialized.ushln(ORDER_FIELD_LENGTHS.amountFee).add(amountFeeBn);
  serialized = serialized.ushln(ORDER_FIELD_LENGTHS.positionId).add(positionIdBn);
  serialized = serialized.ushln(ORDER_FIELD_LENGTHS.expirationTimestamp).add(expirationTimestampBn);
  const serializedHex = encUtils.sanitizeHex(serialized.toString(16));

  return crypto.hashMessage(
    crypto.hashTokenId(TOKEN_STRUCTS[order.tokenIdSell]),
    crypto.hashTokenId(TOKEN_STRUCTS[order.tokenIdBuy]),
    serializedHex,
  );
}
