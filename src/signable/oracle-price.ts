import Big, { RoundingMode } from 'big.js';
import BN from 'bn.js';

import {
  getSignedAssetId,
  isoTimestampToEpochSeconds,
} from '../helpers';
import {
  decToBn,
  hexToBn,
  intToBn,
} from '../lib/util';
import {
  OraclePriceParams,
  StarkwareOraclePrice,
} from '../types';
import {
  ORACLE_PRICE_DECIMALS,
  ORACLE_PRICE_FIELD_BIT_LENGTHS,
} from './constants';
import { getPedersenHash } from './hashes';
import { StarkSignable } from './stark-signable';

/**
 * Wrapper object to hash, sign, and verify an oracle price.
 */
export class SignableOraclePrice extends StarkSignable<StarkwareOraclePrice> {

  static fromPrice(
    params: OraclePriceParams,
  ): SignableOraclePrice {
    if (typeof params.market !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: market must be a string');
    }
    if (typeof params.oracleName !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: oracleName must be a string');
    }
    if (typeof params.humanPrice !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: humanPrice must be a string');
    }
    if (typeof params.isoTimestamp !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: isoTimestamp must be a string');
    }

    const signedAssetId = getSignedAssetId(params.market, params.oracleName);

    const signedPrice = new Big(params.humanPrice);
    signedPrice.e += ORACLE_PRICE_DECIMALS;

    const expirationEpochSeconds = isoTimestampToEpochSeconds(params.isoTimestamp);

    return new SignableOraclePrice({
      signedAssetId,
      signedPrice: signedPrice.round(RoundingMode.RoundHalfEven).toFixed(0),
      expirationEpochSeconds,
    });
  }

  protected async calculateHash(): Promise<BN> {
    const priceBn = decToBn(this.message.signedPrice);
    const timestampEpochSecondsBn = intToBn(this.message.expirationEpochSeconds);
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

    return getPedersenHash(signedAssetId, priceAndTimestamp);
  }
}
