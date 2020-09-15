import assert from 'assert';

import * as bip39 from 'bip39';
import BN from 'bn.js';
import * as encUtils from 'enc-utils';
import * as crypto from 'starkware-crypto';

import {
  HEX_RE,
  ORDER_FIELD_LENGTHS,
  ORDER_MAX_VALUES,
  STARK_DERIVATION_PATH,
  TOKEN_STRUCTS,
} from './constants';
import {
  EcKeyPair,
  EcPublicKey,
  EcSignature,
  KeyPair,
  Order,
  Signature,
  PublicKey,
} from './types';
import { bnToHex } from './util';

export * from './constants';
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
  order: Order,
  signature: Signature,
): boolean {
  const key = asEcKeyPairPublic(order.publicKey);
  const orderHash = getOrderHash(order);
  return key.verify(orderHash, signature);
}

/**
 * Sign an order with the given private key (represented as a hex string).
 */
export function sign(
  order: Order,
  privateKey: string | KeyPair,
): Signature {
  const orderHash = getOrderHash(order);
  const ecSignature: EcSignature = asEcKeyPair(privateKey).sign(orderHash);
  return {
    r: bnToHex(ecSignature.r),
    s: bnToHex(ecSignature.s),
  };
}

export function getOrderHash(
  order: Order,
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
    .iushln(ORDER_FIELD_LENGTHS.amountBuy)
    .iadd(amountBuyBn)
    .iushln(ORDER_FIELD_LENGTHS.amountFee)
    .iadd(amountFeeBn)
    .iushln(ORDER_FIELD_LENGTHS.positionId)
    .iadd(positionIdBn)
    .iushln(ORDER_FIELD_LENGTHS.expirationTimestamp)
    .iadd(expirationTimestampBn);
  const serializedHex = encUtils.sanitizeHex(serialized.toString(16));

  return crypto.hashMessage(
    crypto.hashTokenId(TOKEN_STRUCTS[order.tokenIdSell]),
    crypto.hashTokenId(TOKEN_STRUCTS[order.tokenIdBuy]),
    serializedHex,
  );
}

/**
 * Helper for if you want to access additional cryptographic functionality with a private key.
 */
export function asEcKeyPair(
  privateKeyOrKeyPair: string | KeyPair,
): EcKeyPair {
  const privateKey: string = typeof privateKeyOrKeyPair === 'string'
    ? privateKeyOrKeyPair
    : privateKeyOrKeyPair.privateKey;
  return crypto.ec.keyFromPrivate(encUtils.removeHexPrefix(privateKey));
}

/**
 * Helper for if you want to access additional cryptographic functionality with a public key.
 */
export function asEcKeyPairPublic(
  publicKeyOrKeyPair: PublicKey | KeyPair,
): EcKeyPair {
  const publicKey: PublicKey = ('publicKey' in publicKeyOrKeyPair)
    ? publicKeyOrKeyPair.publicKey
    : publicKeyOrKeyPair;
  const x = encUtils.removeHexPrefix(publicKey.x);
  const y = encUtils.removeHexPrefix(publicKey.y);
  return crypto.ec.keyFromPublic({ x, y });
}

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

export function asSimplePublicKey(
  ecPublicKey: EcPublicKey,
): PublicKey {
  return {
    x: bnToHex(ecPublicKey.getX()),
    y: bnToHex(ecPublicKey.getY()),
  };
}
