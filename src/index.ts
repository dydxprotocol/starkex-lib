import assert from 'assert';

import * as bip39 from 'bip39';
import BN from 'bn.js';
import * as crypto from 'starkware-crypto';

import {
  HEX_RE,
  MARGIN_TOKEN,
  ORDER_FIELD_LENGTHS,
  ORDER_MAX_VALUES,
  STARK_DERIVATION_PATH,
  TOKEN_STRUCTS,
} from './constants';
import {
  asEcKeyPair,
  asEcKeyPairPublic,
  asSimpleKeyPair,
  deserializeSignature,
  getBuyAndSellAmounts,
  nonceFromClientId,
  serializeSignature,
  toBaseUnits,
} from './helpers';
import {
  EcSignature,
  InternalOrder,
  KeyPair,
  StarkwareOrder,
  OrderType,
} from './types';
import {
  bnToHex,
  normalizeHex,
} from './util';

export { MARGIN_TOKEN } from './constants';
export * from './helpers';
export * from './types';

/**
 * Generate a pseudorandom StarkEx key pair.
 */
export function generateKeyPair(): KeyPair {
  return asSimpleKeyPair(crypto.ec.genKeyPair());
}

/**
 * Generate a StarKex key pair deterministically from a BIP39 seed phrase.
 */
export function generateKeyPairFromMnemonic(
  mnemonic: string,
): KeyPair {
  return asSimpleKeyPair(crypto.getKeyPairFromPath(mnemonic, STARK_DERIVATION_PATH));
}

/**
 * Generate a StarKex key pair deterministically from a random Buffer or string.
 */
export function generateKeyPairFromEntropy(
  entropy: Buffer | string,
): KeyPair {
  const mnemonic = bip39.entropyToMnemonic(entropy);
  return generateKeyPairFromMnemonic(mnemonic);
}

/**
 * Generate a StarKex key pair deterministically from a seed.
 *
 * This can be used during testing and development to generate a deterministic key pair from a
 * low-entropy seed value, which may be a Buffer, hex string, other string, or number.
 */
export function generateKeyPairFromSeedUnsafe(
  seed: Buffer | string | number,
): KeyPair {
  // Convert to string.
  let asString: string;
  switch (typeof seed) {
    case 'string':
      asString = seed;
      break;
    case 'number':
      asString = `0x${seed.toString(16)}`;
      break;
    default:
      asString = `0x${seed.toString('hex')}`;
      break;
  }

  // Convert to hex string without 0x prefix.
  const asHex: string = asString.match(HEX_RE)
    ? asString.slice(2)
    : Buffer.from(asString).toString('hex');

  // Pad and slice to exactly 32 bytes.
  const paddedHex = asHex.padStart(64, '0').slice(0, 64);
  const paddedBuffer = Buffer.from(paddedHex, 'hex');

  return generateKeyPairFromEntropy(paddedBuffer);
}

/**
 * Verify the signature is valid for the order and for the public key mentioned in the order.
 */
export function verifySignature(
  order: InternalOrder,
  signature: string,
): boolean {
  const starkwareOrder = convertToStarkwareOrder(order);
  const orderHash = getStarkwareOrderHash(starkwareOrder);
  const signatureStruct = deserializeSignature(signature);

  // Return true if the signature is valid for either of the two possible y-coordinates.
  //
  // Compare with:
  // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L151
  return (
    asEcKeyPairPublic(starkwareOrder.publicKey, false).verify(orderHash, signatureStruct) ||
    asEcKeyPairPublic(starkwareOrder.publicKey, true).verify(orderHash, signatureStruct)
  );
}

/**
 * Sign an order with the given private key (represented as a hex string).
 */
export function sign(
  order: InternalOrder,
  privateKey: string | KeyPair,
): string {
  const orderHash = getOrderHash(order);
  const ecSignature: EcSignature = asEcKeyPair(privateKey).sign(orderHash);
  return serializeSignature({
    r: bnToHex(ecSignature.r),
    s: bnToHex(ecSignature.s),
  });
}

export function getOrderHash(
  order: InternalOrder,
): string {
  const starkwareOrder = convertToStarkwareOrder(order);
  return getStarkwareOrderHash(starkwareOrder);
}

export function convertToStarkwareOrder(
  order: InternalOrder,
): StarkwareOrder {
  // Within the Starkware system, there is only one order type.
  const orderType = OrderType.LIMIT;

  // Make the nonce by hashing the client-provided ID. Does not need to be a secure hash.
  const nonce = nonceFromClientId(order.clientId);

  // This is the public key x-coordinate as a hex string, without 0x prefix.
  const publicKey = order.starkKey;

  // Need to be careful that the (size, price) -> (amountBuy, amountSell) function is
  // well-defined and applied consistently.
  const {
    amountSell,
    amountBuy,
    tokenIdSell,
    tokenIdBuy,
  } = getBuyAndSellAmounts(order.market, order.side, order.size, order.price);

  // The fee is an amount, not a percentage, and is always denominated in the margin token.
  const amountFee = toBaseUnits(order.limitFee, MARGIN_TOKEN);

  // Represents a subaccount or isolated position.
  const positionId = order.positionId;

  // TODO: How do we get the signed expiration value?
  // Convert to a Unix timestamp (in hours).
  const expirationTimestamp = `${Math.floor(new Date(order.expiresAt).getTime() / 1000 / 3600)}`;

  return {
    orderType,
    nonce,
    publicKey,
    amountSell,
    amountBuy,
    amountFee,
    tokenIdSell,
    tokenIdBuy,
    positionId,
    expirationTimestamp,
  };
}

export function getStarkwareOrderHash(
  order: StarkwareOrder,
): string {
  // TODO:
  // I'm following their existing example but we'll have to update the exact encoding details later.
  const orderTypeBn = new BN('0');
  const nonceBn = new BN(order.nonce);
  const amountSellBn = new BN(order.amountSell);
  const amountBuyBn = new BN(order.amountBuy);
  const amountFeeBn = new BN(order.amountFee);
  const positionIdBn = new BN(order.positionId);
  const expirationTimestampBn = new BN(order.expirationTimestamp);

  // Validate the data is the right size.
  assert(nonceBn.lt(ORDER_MAX_VALUES.nonce));
  assert(amountSellBn.lt(ORDER_MAX_VALUES.amountSell));
  assert(amountBuyBn.lt(ORDER_MAX_VALUES.amountBuy));
  assert(amountFeeBn.lt(ORDER_MAX_VALUES.amountFee));
  assert(positionIdBn.lt(ORDER_MAX_VALUES.positionId));
  assert(expirationTimestampBn.lt(ORDER_MAX_VALUES.expirationTimestamp));

  // Serialize the order as a hex string.
  const serialized = orderTypeBn
    .iushln(ORDER_FIELD_LENGTHS.nonce).iadd(nonceBn)
    .iushln(ORDER_FIELD_LENGTHS.amountSell).iadd(amountSellBn)
    .iushln(ORDER_FIELD_LENGTHS.amountBuy).iadd(amountBuyBn)
    .iushln(ORDER_FIELD_LENGTHS.amountFee).iadd(amountFeeBn)
    .iushln(ORDER_FIELD_LENGTHS.positionId).iadd(positionIdBn)
    .iushln(ORDER_FIELD_LENGTHS.expirationTimestamp).iadd(expirationTimestampBn);
  const serializedHex = normalizeHex(serialized.toString(16));

  return crypto.hashMessage(
    crypto.hashTokenId(TOKEN_STRUCTS[order.tokenIdSell]),
    crypto.hashTokenId(TOKEN_STRUCTS[order.tokenIdBuy]),
    serializedHex,
  );
}
