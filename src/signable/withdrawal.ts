import BN from 'bn.js';

import {
  COLLATERAL_ASSET,
  COLLATERAL_ASSET_ID,
} from '../constants';
import {
  isoTimestampToEpochHours,
  nonceFromClientId,
  toQuantumsExact,
} from '../helpers';
import { pedersen } from '../lib/starkex-resources';
import {
  decToBn,
  hexToBn,
  intToBn,
} from '../lib/util';
import {
  StarkwareWithdrawal,
  WithdrawalWithNonce,
  WithdrawalWithClientId,
} from '../types';
import { WITHDRAWAL_FIELD_BIT_LENGTHS } from './constants';
import { StarkSignable } from './stark-signable';

const COLLATERAL_ASSET_ID_BN = hexToBn(COLLATERAL_ASSET_ID);
const WITHDRAWAL_PREFIX = 6;
const WITHDRAWAL_PADDING_BITS = 49;

/**
 * Wrapper object to convert a withdrawal, and hash, sign, and verify its signature.
 */
export class SignableWithdrawal extends StarkSignable<StarkwareWithdrawal> {

  static fromWithdrawal = SignableWithdrawal.fromWithdrawalWithClientId; // Alias.

  static fromWithdrawalWithClientId(
    withdrawal: WithdrawalWithClientId,
  ): SignableWithdrawal {
    // Make the nonce by hashing the client-provided ID.
    const nonce = nonceFromClientId(withdrawal.clientId);
    return SignableWithdrawal.fromWithdrawalWithNonce({
      ...withdrawal,
      clientId: undefined,
      nonce,
    });
  }

  static fromWithdrawalWithNonce(
    withdrawal: WithdrawalWithNonce,
  ): SignableWithdrawal {
    const positionId = withdrawal.positionId;
    const nonce = withdrawal.nonce;

    // The withdrawal asset is always the collateral asset.
    const quantumsAmount = toQuantumsExact(withdrawal.humanAmount, COLLATERAL_ASSET);

    // Convert to a Unix timestamp (in hours).
    const expirationEpochHours = isoTimestampToEpochHours(withdrawal.expirationIsoTimestamp);

    return new SignableWithdrawal({
      positionId,
      nonce,
      quantumsAmount,
      expirationEpochHours,
    });
  }

  protected calculateHash(): BN {
    const positionIdBn = decToBn(this.message.positionId);
    const nonceBn = decToBn(this.message.nonce);
    const quantumsAmountBn = decToBn(this.message.quantumsAmount);
    const expirationEpochSecondsBn = intToBn(this.message.expirationEpochHours);

    if (positionIdBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableOraclePrice: positionId exceeds max value');
    }
    if (nonceBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableOraclePrice: nonce exceeds max value');
    }
    if (quantumsAmountBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOraclePrice: quantumsAmount exceeds max value');
    }
    if (
      expirationEpochSecondsBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.expirationEpochHours
    ) {
      throw new Error('SignableOraclePrice: expirationEpochHours exceeds max value');
    }

    const packedWithdrawalBn = new BN(WITHDRAWAL_PREFIX)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.positionId).iadd(positionIdBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.nonce).iadd(nonceBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.quantumsAmount).iadd(quantumsAmountBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.expirationEpochHours).iadd(expirationEpochSecondsBn)
      .iushln(WITHDRAWAL_PADDING_BITS);

    return pedersen(COLLATERAL_ASSET_ID_BN, packedWithdrawalBn);
  }

  toStarkware(): StarkwareWithdrawal {
    return this.message;
  }
}
