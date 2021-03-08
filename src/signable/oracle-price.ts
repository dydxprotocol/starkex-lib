import Big from 'big.js';
import BN from 'bn.js';

import {
  getSignedAssetId,
  getSignedAssetName,
  isoTimestampToEpochSeconds,
} from '../helpers';
import { getPedersenHash } from '../lib/crypto';
import {
  decToBn,
  hexToBn,
  intToBn,
} from '../lib/util';
import {
  NetworkId,
  OraclePriceWithAssetName,
  OraclePriceWithMarket,
  StarkwareOraclePrice,
} from '../types';
import {
  ORACLE_PRICE_DECIMALS,
  ORACLE_PRICE_FIELD_BIT_LENGTHS,
} from './constants';
import { StarkSignable } from './stark-signable';

/**
 * Wrapper object to hash, sign, and verify an oracle price.
 */
export class SignableOraclePrice extends StarkSignable<StarkwareOraclePrice> {

  static fromPriceWithMarket(
    params: OraclePriceWithMarket,
    networkId: NetworkId,
  ): SignableOraclePrice {
    if (typeof params.market !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: market must be a string');
    }
    const assetName = getSignedAssetName(params.market);
    return SignableOraclePrice.fromPriceWithAssetName(
      {
        ...params,
        assetName,
      },
      networkId,
    );
  }

  static fromPriceWithAssetName(
    params: OraclePriceWithAssetName,
    networkId: NetworkId,
  ): SignableOraclePrice {
    if (typeof params.assetName !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: assetName must be a string');
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

    const signedAssetId = getSignedAssetId(params.assetName, params.oracleName);

    const signedPrice = new Big(params.humanPrice);
    signedPrice.e += ORACLE_PRICE_DECIMALS;

    if (!signedPrice.mod(1).eq(0)) {
      throw new Error(
        'SignableOraclePrice.fromPrice: humanPrice can have at most 18 decimals of precision',
      );
    }

    const expirationEpochSeconds = isoTimestampToEpochSeconds(params.isoTimestamp);

    return new SignableOraclePrice(
      {
        signedAssetId,
        signedPrice: signedPrice.toFixed(0),
        expirationEpochSeconds,
      },
      networkId,
    );
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
