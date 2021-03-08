import BN from 'bn.js';

import {
  addOrderExpirationBufferHours,
  getStarkwareAmounts,
  isoTimestampToEpochHours,
  nonceFromClientId,
  getStarkwareLimitFeeAmount,
} from '../helpers';
import { getPedersenHash } from '../lib/crypto';
import {
  decToBn,
  hexToBn,
  intToBn,
} from '../lib/util';
import {
  OrderWithNonce,
  OrderWithNonceAndQuoteAmount,
  OrderWithClientId,
  OrderWithClientIdAndQuoteAmount,
  StarkwareOrder,
  StarkwareOrderType,
  NetworkId,
} from '../types';
import {
  ORDER_FIELD_BIT_LENGTHS,
} from './constants';
import { getCacheablePedersenHash } from './hashes';
import { StarkSignable } from './stark-signable';

const LIMIT_ORDER_WITH_FEES = 3;
const ORDER_PADDING_BITS = 17;

/**
 * Wrapper object to convert an order, and hash, sign, and verify its signature.
 */
export class SignableOrder extends StarkSignable<StarkwareOrder> {

  static fromOrder = SignableOrder.fromOrderWithClientId; // Alias.

  static fromOrderWithClientId(
    order: OrderWithClientId | OrderWithClientIdAndQuoteAmount,
    networkId: NetworkId,
  ): SignableOrder {
    // Make the nonce by hashing the client-provided ID.
    const nonce = nonceFromClientId(order.clientId);
    return SignableOrder.fromOrderWithNonce(
      {
        ...order,
        clientId: undefined,
        nonce,
      },
      networkId,
    );
  }

  static fromOrderWithNonce(
    order: OrderWithNonce | OrderWithNonceAndQuoteAmount,
    networkId: NetworkId,
  ): SignableOrder {
    const nonce = order.nonce;
    const positionId = order.positionId;

    // Within the Starkware system, there is currently only one order type.
    const orderType = StarkwareOrderType.LIMIT_ORDER_WITH_FEES;

    // Need to be careful that the (size, price) -> (amountBuy, amountSell) function is
    // well-defined and applied consistently.
    const {
      quantumsAmountSynthetic,
      quantumsAmountCollateral,
      assetIdSynthetic,
      assetIdCollateral,
      isBuyingSynthetic,
    } = getStarkwareAmounts(order, networkId);

    // The limitFee is a fraction, e.g. 0.01 is a 1% fee. It is always paid in the collateral asset.
    const quantumsAmountFee = getStarkwareLimitFeeAmount(order.limitFee, quantumsAmountCollateral);

    // Convert to a Unix timestamp (in hours) and add buffer to ensure signature is valid on-chain.
    const expirationEpochHours = addOrderExpirationBufferHours(
      isoTimestampToEpochHours(order.expirationIsoTimestamp),
    );

    return new SignableOrder(
      {
        orderType,
        nonce,
        quantumsAmountSynthetic,
        quantumsAmountCollateral,
        quantumsAmountFee,
        assetIdSynthetic,
        assetIdCollateral,
        assetIdFee: assetIdCollateral,
        positionId,
        isBuyingSynthetic,
        expirationEpochHours,
      },
      networkId,
    );
  }

  protected async calculateHash(): Promise<BN> {
    const assetIdSyntheticBn = hexToBn(this.message.assetIdSynthetic);
    const assetIdCollateralBn = hexToBn(this.message.assetIdCollateral);
    const assetIdFeeBn = hexToBn(this.message.assetIdFee);
    const quantumsAmountSyntheticBn = decToBn(this.message.quantumsAmountSynthetic);
    const quantumsAmountCollateralBn = decToBn(this.message.quantumsAmountCollateral);
    const quantumsAmountFeeBn = decToBn(this.message.quantumsAmountFee);
    const nonceBn = decToBn(this.message.nonce);
    const positionIdBn = decToBn(this.message.positionId);
    const expirationEpochHours = intToBn(this.message.expirationEpochHours);

    const [assetIdSellBn, assetIdBuyBn] = this.message.isBuyingSynthetic
      ? [assetIdCollateralBn, assetIdSyntheticBn]
      : [assetIdSyntheticBn, assetIdCollateralBn];
    const [quantumsAmountSellBn, quantumsAmountBuyBn] = this.message.isBuyingSynthetic
      ? [quantumsAmountCollateralBn, quantumsAmountSyntheticBn]
      : [quantumsAmountSyntheticBn, quantumsAmountCollateralBn];

    if (assetIdSyntheticBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.assetIdSynthetic) {
      throw new Error('SignableOrder: assetIdSynthetic exceeds max value');
    }
    if (assetIdCollateralBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.assetIdCollateral) {
      throw new Error('SignableOrder: assetIdCollateral exceeds max value');
    }
    if (assetIdFeeBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.assetIdFee) {
      throw new Error('SignableOrder: assetIdFee exceeds max value');
    }
    if (quantumsAmountSyntheticBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsAmountSynthetic exceeds max value');
    }
    if (quantumsAmountCollateralBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsAmountCollateral exceeds max value');
    }
    if (quantumsAmountFeeBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsAmountFee exceeds max value');
    }
    if (nonceBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableOrder: nonce exceeds max value');
    }
    if (positionIdBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableOrder: positionId exceeds max value');
    }
    if (expirationEpochHours.bitLength() > ORDER_FIELD_BIT_LENGTHS.expirationEpochHours) {
      throw new Error('SignableOrder: expirationEpochHours exceeds max value');
    }

    const orderPart1 = new BN(quantumsAmountSellBn.toString(), 10)
      .iushln(ORDER_FIELD_BIT_LENGTHS.quantumsAmount).iadd(quantumsAmountBuyBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.quantumsAmount).iadd(quantumsAmountFeeBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.nonce).iadd(nonceBn);

    const orderPart2 = new BN(LIMIT_ORDER_WITH_FEES)
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId).iadd(positionIdBn) // Repeat (1/3).
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId).iadd(positionIdBn) // Repeat (2/3).
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId).iadd(positionIdBn) // Repeat (3/3).
      .iushln(ORDER_FIELD_BIT_LENGTHS.expirationEpochHours).iadd(expirationEpochHours)
      .iushln(ORDER_PADDING_BITS);

    const assetsBn = await getCacheablePedersenHash(
      await getCacheablePedersenHash(assetIdSellBn, assetIdBuyBn),
      assetIdFeeBn,
    );
    return getPedersenHash(
      await getPedersenHash(assetsBn, orderPart1),
      orderPart2,
    );
  }

  toStarkware(): StarkwareOrder {
    return this.message;
  }
}
