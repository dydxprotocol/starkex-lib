import BN from 'bn.js';

import { isoTimestampToEpochSeconds } from '../helpers';
import { pedersen } from '../lib/starkex-resources/crypto';
import { decToBn, hexToBn, utf8ToBn } from '../lib/util';
import {
  OraclePriceWithAssetName,
  OraclePriceWithAssetId,
} from '../types';
import { ORACLE_PRICE_FIELD_BIT_LENGTHS } from './constants';
import { StarkSignable } from './stark-signable';

/**
 * Wrapper object to hash, sign, and verify an oracle price.
 */
export class SignableOraclePrice extends StarkSignable<OraclePriceWithAssetId> {

  static fromPrice = SignableOraclePrice.fromPriceWithAssetName; // Alias.

  static fromPriceWithAssetName(
    params: OraclePriceWithAssetName,
  ): SignableOraclePrice {
    const assetNameBn = utf8ToBn(params.assetName, ORACLE_PRICE_FIELD_BIT_LENGTHS.assetName);
    const oracleNameBn = utf8ToBn(params.oracleName, ORACLE_PRICE_FIELD_BIT_LENGTHS.oracleName);

    const signedAssetId = assetNameBn
      .iushln(ORACLE_PRICE_FIELD_BIT_LENGTHS.oracleName)
      .iadd(oracleNameBn);

    return new SignableOraclePrice({
      signedAssetId: signedAssetId.toString(16),
      price: params.price,
      isoTimestamp: params.isoTimestamp,
    });
  }

  static fromPriceWithAssetId(
    params: OraclePriceWithAssetId,
  ): SignableOraclePrice {
    return new SignableOraclePrice(params);
  }

  protected calculateHash(): BN {
    const priceBn = decToBn(this.message.price);
    const timestampEpochSecondsBn = decToBn(isoTimestampToEpochSeconds(this.message.isoTimestamp));
    const signedAssetId = hexToBn(this.message.signedAssetId);

    if (priceBn.bitLength() > ORACLE_PRICE_FIELD_BIT_LENGTHS.price) {
      throw new Error('SignableOraclePrice: price exceeds max value');
    }
    if (
      timestampEpochSecondsBn.bitLength() > ORACLE_PRICE_FIELD_BIT_LENGTHS.timestampEpochSeconds
    ) {
      throw new Error('SignableOraclePrice: timestampEpochSeconds exceeds max value');
    }

    const priceAndTimestamp = priceBn
      .iushln(ORACLE_PRICE_FIELD_BIT_LENGTHS.timestampEpochSeconds)
      .iadd(timestampEpochSecondsBn);

    return pedersen(signedAssetId, priceAndTimestamp);
  }
}
