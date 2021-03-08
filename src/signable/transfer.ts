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
  hexToBn,
  intToBn,
} from '../lib/util';
import {
  TransferParams,
  NetworkId,
  StarkwareTransfer,
} from '../types';
import {
  TRANSFER_FEE_ASSET_ID_BN,
  TRANSFER_FIELD_BIT_LENGTHS,
} from './constants';
import { getCacheablePedersenHash } from './hashes';
import { StarkSignable } from './stark-signable';

// Note: Fees are not supported for transfers.
const MAX_AMOUNT_FEE_BN = new BN(0);

const TRANSFER_PREFIX = 4;
const TRANSFER_PADDING_BITS = 81;

/**
 * Wrapper object to convert a transfer, and hash, sign, and verify its signature.
 */
export class SignableTransfer extends StarkSignable<StarkwareTransfer> {

  static fromTransfer(
    transfer: TransferParams,
    networkId: NetworkId,
  ): SignableTransfer {
    const nonce = nonceFromClientId(transfer.clientId);

    // The transfer asset is always the collateral asset.
    const quantumsAmount = toQuantumsExact(transfer.humanAmount, COLLATERAL_ASSET);

    // Convert to a Unix timestamp (in hours).
    const expirationEpochHours = isoTimestampToEpochHours(transfer.expirationIsoTimestamp);

    return new SignableTransfer(
      {
        senderPositionId: transfer.senderPositionId,
        receiverPositionId: transfer.receiverPositionId,
        receiverPublicKey: transfer.receiverPublicKey,
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
    const quantumsAmountBn = decToBn(this.message.quantumsAmount);
    const nonceBn = decToBn(this.message.nonce);
    const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours);

    if (senderPositionIdBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableOraclePrice: senderPositionId exceeds max value');
    }
    if (
      receiverPositionIdBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.positionId
    ) {
      throw new Error('SignableOraclePrice: receiverPositionId exceeds max value');
    }
    if (
      receiverPublicKeyBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.receiverPublicKey
    ) {
      throw new Error('SignableOraclePrice: receiverPublicKey exceeds max value');
    }
    if (quantumsAmountBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOraclePrice: quantumsAmount exceeds max value');
    }
    if (nonceBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableOraclePrice: nonce exceeds max value');
    }
    if (
      expirationEpochHoursBn.bitLength() >
      TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours
    ) {
      throw new Error('SignableOraclePrice: expirationEpochHours exceeds max value');
    }

    // The transfer asset is always the collateral asset.
    // Fees are not supported for transfers.
    const assetIds = await getCacheablePedersenHash(
      hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID[this.networkId]),
      TRANSFER_FEE_ASSET_ID_BN,
    );

    const transferPart1 = await getPedersenHash(
      assetIds,
      receiverPublicKeyBn,
    );
    // Note: Use toString() to avoid mutating senderPositionIdBn.
    const transferPart2 = new BN(senderPositionIdBn.toString(), 10)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.positionId).iadd(receiverPositionIdBn)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.positionId).iadd(senderPositionIdBn)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.nonce).iadd(nonceBn);
    const transferPart3 = new BN(TRANSFER_PREFIX)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount).iadd(quantumsAmountBn)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount).iadd(MAX_AMOUNT_FEE_BN)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours).iadd(
        expirationEpochHoursBn,
      )
      .iushln(TRANSFER_PADDING_BITS);

    return getPedersenHash(
      await getPedersenHash(
        transferPart1,
        transferPart2,
      ),
      transferPart3,
    );
  }

  toStarkware(): StarkwareTransfer {
    return this.message;
  }
}
