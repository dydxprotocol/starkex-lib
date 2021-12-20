/**
 * Helper functions for converting keys and signatures between formats.
 */

import elliptic from 'elliptic';

import BigNumber from 'bignumber.js';
import AES from 'crypto-js/aes';
import CryptoJS from 'crypto-js';

import _ from 'lodash';

import { starkEc } from '../lib/starkware';
import {
  bnToHex32,
  normalizeHex32,
} from '../lib/util';

import {
  KeyPair,
  KeyPairWithYCoordinate,
  NetworkId,
  SignatureStruct,
  StarkwareOrderSide,
} from '../types';

import {
  keyPairFromData,
} from '../keys';

import {
  stripHexPrefix,
} from '../lib/util';

import { StarkSignable, SignableOrder, SignableWithdrawal, SignableConditionalTransfer } from '../signable';

import {
  OrderWithClientId,
  DydxMarket,
  DydxMarketInfo
} from '../types';

var utils = require('web3-utils');

/**
 * Helper for if you want to access additional cryptographic functionality with a private key.
 *
 * Accepts a private key or key pair as hex strings (with or without 0x prefix).
 */
export function asEcKeyPair(
  privateKeyOrKeyPair: string | KeyPair,
): elliptic.ec.KeyPair {
  const privateKey: string = typeof privateKeyOrKeyPair === 'string'
    ? privateKeyOrKeyPair
    : privateKeyOrKeyPair.privateKey;
  return starkEc.keyFromPrivate(normalizeHex32(privateKey));
}

/**
 * Helper for if you want to access additional cryptographic functionality with a public key.
 *
 * The provided parameter should be the x-coordinate of the public key, or an (x, y) pair.
 * If given as an x-coordinate, then `yCoordinateIsOdd` is required.
 */
export function asEcKeyPairPublic(
  publicKey: string | { x: string; y: string },
  yCoordinateIsOdd: boolean | null = null,
): elliptic.ec.KeyPair {
  if (typeof publicKey !== 'string') {
    if (typeof publicKey.x !== 'string' || typeof publicKey.y !== 'string') {
      throw new Error('asEcKeyPairPublic: Public key must be a string or (x, y) pair');
    }
    return starkEc.keyFromPublic({
      x: normalizeHex32(publicKey.x),
      y: normalizeHex32(publicKey.y),
    });
  }

  if (yCoordinateIsOdd === null) {
    throw new Error(
      'asEcKeyPairPublic: Key was not given as an (x, y) pair, so yCoordinateIsOdd is required',
    );
  }

  const prefix = yCoordinateIsOdd ? '03' : '02';
  const prefixedPublicKey = `${prefix}${normalizeHex32(publicKey)}`;

  // This will get the point from only the x-coordinate via:
  // https://github.com/indutny/elliptic/blob/e71b2d9359c5fe9437fbf46f1f05096de447de57/dist/elliptic.js#L1205
  //
  // See also how Starkware infers the y-coordinate:
  // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L164-L173
  return starkEc.keyFromPublic(prefixedPublicKey, 'hex');
}

/**
 * Converts an `elliptic` KeyPair object to a simple object with publicKey & privateKey hex strings.
 *
 * Returns keys as 32-byte hex strings without 0x prefix.
 */
export function asSimpleKeyPair(
  ecKeyPair: elliptic.ec.KeyPair,
): KeyPairWithYCoordinate {
  const ecPrivateKey = ecKeyPair.getPrivate();
  if (_.isNil(ecPrivateKey)) {
    throw new Error('asSimpleKeyPair: Key pair has no private key');
  }
  const ecPublicKey = ecKeyPair.getPublic();
  return {
    publicKey: bnToHex32(ecPublicKey.getX()),
    publicKeyYCoordinate: bnToHex32(ecPublicKey.getY()),
    privateKey: bnToHex32(ecPrivateKey),
  };
}

/**
 * Converts an `elliptic` Signature object to a simple object with r & s hex strings.
 *
 * Returns r and s as 32-byte hex strings without 0x prefix.
 */
export function asSimpleSignature(
  ecSignature: elliptic.ec.Signature,
): SignatureStruct {
  return {
    r: bnToHex32(ecSignature.r),
    s: bnToHex32(ecSignature.s),
  };
}

/**
 * Converts an `elliptic` BasePoint object to a compressed representation: the x-coordinate as hex.
 *
 * Returns a 32-byte hex string without 0x prefix.
 */
export function asSimplePublicKey(
  ecPublicKey: elliptic.curve.base.BasePoint,
): string {
  return bnToHex32(ecPublicKey.getX());
}

/**
 * Check whether the string or (x, y) pair is a valid public key.
 *
 * Will not throw, always returns a boolean.
 */
export function isValidPublicKey(
  publicKey: string | { x: string; y: string },
): boolean {
  try {
    const ecPublicKey = asEcKeyPairPublic(
      publicKey,
      false, // Should not affect the result.
    );
    if (!ecPublicKey.validate().result) {
      return false;
    }

    // Return false for out-of-range values and non-hex strings.
    const expectedX = (publicKey as { x: string }).x || (publicKey as string);
    const resultX = ecPublicKey.getPublic().getX().toString(16);
    if (normalizeHex32(resultX) !== normalizeHex32(expectedX)) {
      return false;
    }

    return true;
  } catch (error) {
    // Just catch everything. Public keys which throw include 0 and (2^251 + 1).
    return false;
  }
}

/**
 * Convert an (r, s) signature struct to a string.
 */
export function serializeSignature(
  signature: { r: string, s: string },
): string {
  return `${normalizeHex32(signature.r)}${normalizeHex32(signature.s)}`;
}

/**
 * Convert a serialized signature to an (r, s) struct.
 */
export function deserializeSignature(
  signature: string,
): SignatureStruct {
  if (signature.length !== 128) {
    throw new Error(
      `Invalid serialized signature, expected a hex string with length 128: ${signature}`,
    );
  }
  return {
    r: signature.slice(0, 64),
    s: signature.slice(64),
  };
}

const ASSET_ID_MASK = new BigNumber(2).pow(250);

export type BigNumberable = BigNumber | string | number;

export function soliditySha3(
  ...input: any
): string {
  const result = utils.soliditySha3(...input);
  if (!result) {
    return 'soliditySha3 produced null output';
  }
  return result;
}

export class StarkHelper {
  /**
   * Derivce public key from private key.
   * This is wrapped in a class to make it work in native
   */

  public publicKeyAndYCoordiante(
    privateKey: string,
  ): String[] {
    const keyPair = asSimpleKeyPair(asEcKeyPair(privateKey));
    return [keyPair.publicKey, keyPair.publicKeyYCoordinate];
  }

  public privateKeyFromSignature(signature: string): String[] {
    const keyPair = keyPairFromData(Buffer.from(stripHexPrefix(signature), 'hex'));
    return [keyPair.privateKey, keyPair.publicKey, keyPair.publicKeyYCoordinate];
  }

  public signWithdrawal(positionId: string, humanAmount: string,
    expirationIsoTimestamp: string, clientId: string, privateKey: string,
    networkId: string): string {
    const _networkId: NetworkId = (networkId === '1') ? NetworkId.MAINNET : NetworkId.ROPSTEN;
    const withdrawal = {
      positionId,
      humanAmount,
      expirationIsoTimestamp,
      clientId,
    };

    const signable = SignableWithdrawal.fromWithdrawalWithClientId(withdrawal, _networkId);
    return signable.signSync(privateKey);
  }

  public signFastWithdrawal(senderPositionId: string,
    receiverPositionId: string, receiverPublicKey: string, humanAmount: string,
    expirationIsoTimestamp: string, clientId: string, factRegistryAddress: string,
    fact: string, privateKey: string, networkId: string): string {
    const _networkId: NetworkId = (networkId === '1') ? NetworkId.MAINNET : NetworkId.ROPSTEN;
    const transfer = {
      senderPositionId,
      receiverPositionId,
      receiverPublicKey,
      humanAmount,
      expirationIsoTimestamp,
      clientId,
      factRegistryAddress,
      fact,
    };

    const signable = SignableConditionalTransfer.fromTransfer(transfer, _networkId);
    return signable.signSync(privateKey);
  }

  public sign(positionId: string, humanSize: string, limitFee: string,
    market: string, side: string,
    expirationIsoTimestamp: string, humanPrice: string, clientId: string,
    privateKey: string, networkId: string): string {
    const _networkId: NetworkId = (networkId === '1') ? NetworkId.MAINNET : NetworkId.ROPSTEN;
    const _side:StarkwareOrderSide = (side === 'BUY') ? StarkwareOrderSide.BUY : StarkwareOrderSide.SELL;
    const _market = market as DydxMarket;
    const order = {
      positionId,
      humanSize,
      limitFee,
      market: _market,
      side: _side,
      expirationIsoTimestamp,
      humanPrice,
      clientId,
    };

    const signable = SignableOrder.fromOrderWithClientId(order, _networkId);
    return signable.signSync(privateKey);
  }

  public signWithResolution(positionId: string, humanSize: string, limitFee: string,
    market: string, resolution: number, side: string,
    expirationIsoTimestamp: string, humanPrice: string, clientId: string,
    privateKey: string, networkId: string): string {
    const _networkId: NetworkId = (networkId === '1') ? NetworkId.MAINNET : NetworkId.ROPSTEN;
    const _side:StarkwareOrderSide = (side === 'BUY') ? StarkwareOrderSide.BUY : StarkwareOrderSide.SELL;
    const _marketInfo = {
      market,
      resolution,
    };
    const order = {
      positionId,
      humanSize,
      limitFee,
      market: _marketInfo,
      side: _side,
      expirationIsoTimestamp,
      humanPrice,
      clientId,
    };

    const signable = SignableOrder.fromOrderWithClientId(order, _networkId);
    return signable.signSync(privateKey);
  }

  public signPayload(payload: any, privateKey: string, networkId: string): string {
    const positionId = payload.positionId;
    const clientId = payload.clientId;
    if (positionId  && clientId && privateKey && networkId) {
      const expirationIsoTimestamp = payload.expiresAt;
      const humanSize = payload.size;
      const limitFee = payload.limitFee;
      const market = payload.market;
      const side = payload.side;
      const humanPrice = payload.price;
      if (humanSize && limitFee && market && side && humanPrice && expirationIsoTimestamp) {
        return this.sign(positionId, humanSize, limitFee, market,
          side, expirationIsoTimestamp, humanPrice, clientId, privateKey, networkId);
      } else {
        const humanAmount = payload.amount;
        const expirationIsoTimestamp = payload.expiration;
        if (humanAmount && expirationIsoTimestamp) {
          return this.signWithdrawal(positionId, humanAmount,
            expirationIsoTimestamp, clientId, privateKey, networkId);
        } else {
          return 'fail';
        }
      }
    } else {
      return 'fail';
    }
  }

  public getAssetId(
    tokenAddress: string,
    quantization: BigNumberable = 1,
  ): string {
    const tokenHash: string = soliditySha3('ERC20Token(address)').substr(0, 10);
    const resultBytes = soliditySha3(
      { type: 'bytes4', value: tokenHash },
      { type: 'uint256', value: tokenAddress },
      { type: 'uint256', value: new BigNumber(quantization).toFixed(0) },
    );
    const resultBN = new BigNumber(resultBytes, 16);
    const result = resultBN.mod(ASSET_ID_MASK);
    return `0x${result.toString(16).padStart(64, '0')}`;
  }

  public aesDecrypt(
    text: string,
    password: string,
  ): string {
    const descrypted = AES.decrypt(text, password);
    return descrypted.toString(CryptoJS.enc.Utf8);
  }
}
