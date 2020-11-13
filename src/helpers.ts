/**
 * Helper functions exported by starkex-lib.
 */

import nodeCrypto from 'crypto';

import Big from 'big.js';
import BN from 'bn.js';
import * as crypto from 'starkware-crypto';

import {
  BASE_TOKEN,
  MARGIN_TOKEN,
  ORDER_MAX_VALUES,
  TOKEN_QUANTUM,
} from './constants';
import {
  Asset,
  EcKeyPair,
  EcPublicKey,
  InternalOrder,
  KeyPair,
  OrderSide,
  SignatureStruct,
  StarkwareAmounts,
} from './types';
import {
  bnToHex,
  normalizeHex,
} from './util';

/**
 * Helper for if you want to access additional cryptographic functionality with a private key.
 */
export function asEcKeyPair(
  privateKeyOrKeyPair: string | KeyPair,
): EcKeyPair {
  const privateKey: string = typeof privateKeyOrKeyPair === 'string'
    ? privateKeyOrKeyPair
    : privateKeyOrKeyPair.privateKey;
  return crypto.ec.keyFromPrivate(normalizeHex(privateKey));
}

/**
 * Helper for if you want to access additional cryptographic functionality with a public key.
 *
 * The provided parameter should be the x-coordinate of the public key as a hex string. There are
 * two possible values for the y-coordinate, so `isOdd` is required to choose between the two.
 */
export function asEcKeyPairPublic(
  publicKey: string,
  isOdd: boolean,
): EcKeyPair {
  const prefix = isOdd ? '03' : '02';
  const prefixedPublicKey = `${prefix}${normalizeHex(publicKey)}`;

  // This will get the point from only the x-coordinate via:
  // https://github.com/indutny/elliptic/blob/e71b2d9359c5fe9437fbf46f1f05096de447de57/dist/elliptic.js#L1205
  //
  // See also how Starkware infers the y-coordinate:
  // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L164-L173
  return crypto.ec.keyFromPublic(prefixedPublicKey, 'hex');
}

/**
 * Converts an `elliptic` KeyPair object to a simple object with publicKey & privateKey hex strings.
 *
 * Returns hex strings without 0x prefix.
 */
export function asSimpleKeyPair(
  ecKeyPair: EcKeyPair,
): KeyPair {
  const ecPrivateKey = ecKeyPair.getPrivate();
  if (!ecPrivateKey) {
    throw new Error('asSimpleKeyPair: Key pair has no private key');
  }
  const ecPublicKey = ecKeyPair.getPublic();
  return {
    publicKey: asSimplePublicKey(ecPublicKey),
    privateKey: bnToHex(ecPrivateKey),
  };
}

/**
 * Converts an `elliptic` BasePoint object to a compressed representation: the x-coordinate as hex.
 *
 * Returns a hex string without 0x prefix.
 */
export function asSimplePublicKey(
  ecPublicKey: EcPublicKey,
): string {
  return bnToHex(ecPublicKey.getX());
}

/**
 * Convert an (r, s) signature struct to a string.
 */
export function serializeSignature(
  signature: { r: string, s: string },
): string {
  if (signature.r.length !== 64 || signature.s.length !== 64) {
    throw new Error(
      `Invalid signature struct, expected r and s to be hex strings with length 64: ${signature}`,
    );
  }
  return `${signature.r}${signature.s}`;
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

/**
 * Convert a canonical token amount to an integer amount (in the token's base units).
 * Require the input to be a string, to avoid depending on Big.
 */
export function toQuantum(amount: string, tokenId: Asset): string {
  return new Big(amount).div(TOKEN_QUANTUM[tokenId]).toFixed(0); // should be a whole number
}

/**
 * Convert an integer amount (in the token's base units) to a canonical token amount.
 * Require the input to be a string, to avoid depending on Big.
 */
export function fromQuantum(quantum: string, tokenId: Asset): string {
  return new Big(quantum).mul(TOKEN_QUANTUM[tokenId]).toFixed(); // could be a decimal number.
}

/**
 * Get Starkware order fields, given paramters from an order and/or fill.
 *
 * Must provide either quoteAmount or price.
 */
export function getStarkwareAmounts(
  params: Pick<InternalOrder, 'market' | 'side' | 'size' | 'quoteAmount' | 'price'>,
): StarkwareAmounts {
  const {
    market, side, size, quoteAmount, price,
  } = params;

  // Determine side and assets.
  const isBuyingSynthetic = side === OrderSide.BUY;
  const assetIdSynthetic = BASE_TOKEN[market];
  if (!assetIdSynthetic) {
    throw new Error(`Unknown market ${market}`);
  }
  const assetIdCollateral = MARGIN_TOKEN;

  // Determine amounts.
  const cost = typeof quoteAmount === 'string'
    ? quoteAmount
    : new Big(size).times(price!).toFixed(); // Safe non-null assertion based on InternalOrder type.
  const amountSynthetic = toQuantum(size, assetIdSynthetic);
  const amountCollateral = toQuantum(cost, assetIdCollateral);

  return {
    amountSynthetic,
    amountCollateral,
    assetIdSynthetic,
    assetIdCollateral,
    isBuyingSynthetic,
  };
}

/**
 * Generate a nonce deterministically from an ID set on the order by the client.
 *
 * Does not need to be a cryptographically secure hash.
 */
export function nonceFromClientId(clientId: string): string {
  const nonceHex = nodeCrypto
    .createHmac('sha256', '(insecure)')
    .update(clientId)
    .digest('hex');
  return new BN(nonceHex, 16).mod(ORDER_MAX_VALUES.nonce).toString();
}
