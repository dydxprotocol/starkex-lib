import BN from 'bn.js';

import {
  COLLATERAL_ASSET,
  COLLATERAL_ASSET_ID_BY_NETWORK_ID,
} from '../constants';
import {
  isoTimestampToEpochHours,
  nonceFromClientId,
  toQuantumsExact,
} from '../helpers';
import { getPedersenHash } from '../lib/crypto';
import {
  decToBn,
  factToCondition,
  hexToBn,
  intToBn,
} from '../lib/util';
import {
  ConditionalTransferParams,
  NetworkId,
  StarkwareConditionalTransfer,
} from '../types';
import {
  TRANSFER_FEE_ASSET_ID_BN,
  CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS,
} from './constants';
import { getCacheablePedersenHash } from './hashes';
import { StarkSignable } from './stark-signable';

// Note: Fees are not supported for conditional transfers.
const MAX_AMOUNT_FEE_BN = new BN(0);

const CONDITIONAL_TRANSFER_PREFIX = 5;
const CONDITIONAL_TRANSFER_PADDING_BITS = 81;

/**
 * Wrapper object to convert a conditional transfer, and hash, sign, and verify its signature.
 */
export class SignableConditionalTransfer extends StarkSignable<StarkwareConditionalTransfer> {

  static fromTransfer(
    transfer: ConditionalTransferParams,
    networkId: NetworkId,
  ): SignableConditionalTransfer {
    const nonce = nonceFromClientId(transfer.clientId);

    // The transfer asset is always the collateral asset.
    const quantumsAmount = toQuantumsExact(transfer.humanAmount, COLLATERAL_ASSET);

    // Convert to a Unix timestamp (in hours).
    const expirationEpochHours = isoTimestampToEpochHours(transfer.expirationIsoTimestamp);

    return new SignableConditionalTransfer(
      {
        senderPositionId: transfer.senderPositionId,
        receiverPositionId: transfer.receiverPositionId,
        receiverPublicKey: transfer.receiverPublicKey,
        condition: factToCondition(transfer.factRegistryAddress, transfer.fact),
        quantumsAmount,
        nonce,
        expirationEpochHours,
      },
      networkId,
    );
  }

  protected async calculateHash(): Promise<BN> {
    const senderPositionIdBn = decToBn(this.message.senderPositionId);
    const receiverPositionIdBn = decToBn(this.message.receiverPositionId);
    const receiverPublicKeyBn = hexToBn(this.message.receiverPublicKey);
    const conditionBn = hexToBn(this.message.condition);
    const quantumsAmountBn = decToBn(this.message.quantumsAmount);
    const nonceBn = decToBn(this.message.nonce);
    const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours);

    if (senderPositionIdBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableOraclePrice: senderPositionId exceeds max value');
    }
    if (
      receiverPositionIdBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId
    ) {
      throw new Error('SignableOraclePrice: receiverPositionId exceeds max value');
    }
    if (
      receiverPublicKeyBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.receiverPublicKey
    ) {
      throw new Error('SignableOraclePrice: receiverPublicKey exceeds max value');
    }
    if (conditionBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.condition) {
      throw new Error('SignableOraclePrice: condition exceeds max value');
    }
    if (quantumsAmountBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOraclePrice: quantumsAmount exceeds max value');
    }
    if (nonceBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableOraclePrice: nonce exceeds max value');
    }
    if (
      expirationEpochHoursBn.bitLength() >
      CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours
    ) {
      throw new Error('SignableOraclePrice: expirationEpochHours exceeds max value');
    }

    // The transfer asset is always the collateral asset.
    // Fees are not supported for conditional transfers.
    const assetIds = await getCacheablePedersenHash(
      hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID[this.networkId]),
      TRANSFER_FEE_ASSET_ID_BN,
    );

    const transferPart1 = await getPedersenHash(
      await getPedersenHash(
        assetIds,
        receiverPublicKeyBn,
      ),
      conditionBn,
    );
    // Note: Use toString() to avoid mutating senderPositionIdBn.
    const transferPart2 = new BN(senderPositionIdBn.toString(), 10)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId).iadd(receiverPositionIdBn)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId).iadd(senderPositionIdBn)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.nonce).iadd(nonceBn);
    const transferPart3 = new BN(CONDITIONAL_TRANSFER_PREFIX)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount).iadd(quantumsAmountBn)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount).iadd(MAX_AMOUNT_FEE_BN)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours).iadd(
        expirationEpochHoursBn,
      )
      .iushln(CONDITIONAL_TRANSFER_PADDING_BITS);

    return getPedersenHash(
      await getPedersenHash(
        transferPart1,
        transferPart2,
      ),
      transferPart3,
    );
  }

  toStarkware(): StarkwareConditionalTransfer {
    return this.message;
  }
}
