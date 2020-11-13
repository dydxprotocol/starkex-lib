import assert from 'assert';

import BN from 'bn.js';
import * as crypto from 'starkware-crypto';

import {
  MARGIN_TOKEN,
  ORDER_FIELD_BIT_LENGTHS,
  ORDER_MAX_VALUES,
  TOKEN_STRUCTS,
} from './constants';
import {
  getStarkwareAmounts,
  nonceFromClientId,
  toQuantum,
} from './helpers';
import Signable from './signable';
import {
  InternalOrder,
  StarkwareOrder,
  OrderType,
} from './types';
import {
  normalizeHex,
} from './util';

/**
 * Wrapper object to convert, hash, sign, or verify the signature of an order.
 */
export default class Order extends Signable<StarkwareOrder> {

  static fromInternal(
    order: InternalOrder,
  ): Order {
    // Within the Starkware system, there is only one order type.
    const orderType = OrderType.LIMIT;

    // Make the nonce by hashing the client-provided ID. Does not need to be a secure hash.
    const nonce = nonceFromClientId(order.clientId);

    // This is the public key x-coordinate as a hex string, without 0x prefix.
    const publicKey = order.starkKey;

    // Need to be careful that the (size, price) -> (amountBuy, amountSell) function is
    // well-defined and applied consistently.
    const {
      amountSynthetic,
      amountCollateral,
      assetIdSynthetic,
      assetIdCollateral,
      isBuyingSynthetic,
    } = getStarkwareAmounts(order);

    // The fee is an amount, not a percentage, and is always denominated in the margin token.
    const amountFee = toQuantum(order.limitFee, MARGIN_TOKEN);

    // Represents a subaccount or isolated position.
    const positionId = order.positionId;

    // TODO: How do we get the signed expiration value?
    // Convert to a Unix timestamp (in hours).
    const expirationTimestamp = `${Math.floor(new Date(order.expiresAt).getTime() / 3600000)}`;

    return new Order({
      orderType,
      nonce,
      publicKey,
      amountSynthetic,
      amountCollateral,
      amountFee,
      assetIdSynthetic,
      assetIdCollateral,
      positionId,
      isBuyingSynthetic,
      expirationTimestamp,
    });
  }

  protected calculateHash(): string {
    const order = this.starkwareObject;

    // TODO:
    // I'm following their existing example but we'll have to update the encoding details later.
    const orderTypeBn = new BN('0');
    const nonceBn = new BN(order.nonce);
    const amountSyntheticBn = new BN(order.amountSynthetic);
    const amountCollateralBn = new BN(order.amountCollateral);
    const amountFeeBn = new BN(order.amountFee);
    const positionIdBn = new BN(order.positionId);
    const isBuyingSyntheticBn = order.isBuyingSynthetic ? new BN('1') : new BN('0');
    const expirationTimestampBn = new BN(order.expirationTimestamp);

    // Validate the data is the right size.
    assert(nonceBn.lt(ORDER_MAX_VALUES.nonce));
    assert(amountSyntheticBn.lt(ORDER_MAX_VALUES.amountSynthetic));
    assert(amountCollateralBn.lt(ORDER_MAX_VALUES.amountCollateral));
    assert(amountFeeBn.lt(ORDER_MAX_VALUES.amountFee));
    assert(positionIdBn.lt(ORDER_MAX_VALUES.positionId));
    assert(isBuyingSyntheticBn.lt(ORDER_MAX_VALUES.isBuyingSynthetic));
    assert(expirationTimestampBn.lt(ORDER_MAX_VALUES.expirationTimestamp));

    // Serialize the order as a hex string.
    const serialized = orderTypeBn
      .iushln(ORDER_FIELD_BIT_LENGTHS.nonce).iadd(nonceBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.amountSynthetic).iadd(amountSyntheticBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.amountCollateral).iadd(amountCollateralBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.amountFee).iadd(amountFeeBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId).iadd(positionIdBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.isBuyingSynthetic).iadd(isBuyingSyntheticBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.expirationTimestamp).iadd(expirationTimestampBn);
    const serializedHex = normalizeHex(serialized.toString(16));

    return crypto.hashMessage(
      crypto.hashTokenId(TOKEN_STRUCTS[order.assetIdSynthetic]),
      crypto.hashTokenId(TOKEN_STRUCTS[order.assetIdCollateral]),
      serializedHex,
    );
  }
}
