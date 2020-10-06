import assert from 'assert';

import BN from 'bn.js';

import {
  MARGIN_TOKEN,
  WITHDRAWAL_FIELD_BIT_LENGTHS,
  WITHDRAWAL_MAX_VALUES,
} from './constants';
import {
  nonceFromClientId,
  toQuantum,
} from './helpers';
import Signable from './signable';
import {
  InternalWithdrawal,
  StarkwareWithdrawal,
} from './types';
import {
  normalizeHex,
} from './util';

/**
 * Wrapper object to convert, hash, sign, or verify the signature of a withdrawal.
 */
export default class Withdrawal extends Signable<StarkwareWithdrawal> {

  static fromInternal(
    withdrawal: InternalWithdrawal,
  ): Withdrawal {
    // Make the nonce by hashing the client-provided ID. Does not need to be a secure hash.
    const nonce = nonceFromClientId(withdrawal.clientId);

    // This is the public key x-coordinate as a hex string, without 0x prefix.
    const publicKey = withdrawal.starkKey;

    // The debit amount is always denominated in the margin token.
    const amount = toQuantum(withdrawal.debitAmount, MARGIN_TOKEN);

    // Represents a subaccount or isolated position.
    const positionId = withdrawal.positionId;

    // Convert to a Unix timestamp (in hours).
    const expirationTimestamp = `${Math.floor(new Date(withdrawal.expiresAt).getTime() / 3600000)}`;

    return new Withdrawal({
      nonce,
      publicKey,
      amount,
      positionId,
      expirationTimestamp,
    });
  }

  protected calculateHash(): string {
    const withdrawal = this.starkwareObject;

    // TODO:
    // I'm following their existing example but we'll have to update the encoding details later.
    const nonceBn = new BN(withdrawal.nonce);
    const amountFeeBn = new BN(withdrawal.amount);
    const positionIdBn = new BN(withdrawal.positionId);
    const expirationTimestampBn = new BN(withdrawal.expirationTimestamp);

    // Validate the data is the right size.
    assert(nonceBn.lt(WITHDRAWAL_MAX_VALUES.nonce));
    assert(amountFeeBn.lt(WITHDRAWAL_MAX_VALUES.amount));
    assert(positionIdBn.lt(WITHDRAWAL_MAX_VALUES.positionId));
    assert(expirationTimestampBn.lt(WITHDRAWAL_MAX_VALUES.expirationTimestamp));

    // Serialize the withdrawal as a hex string.
    const serialized = nonceBn
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.amount).iadd(amountFeeBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.positionId).iadd(positionIdBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.expirationTimestamp).iadd(expirationTimestampBn);
    return normalizeHex(serialized.toString(16));
  }
}
