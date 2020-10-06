import * as bip39 from 'bip39';
import * as crypto from 'starkware-crypto';

import {
  HEX_RE,
  STARK_DERIVATION_PATH,
} from './constants';
import {
  asSimpleKeyPair,
} from './helpers';
import {
  KeyPair,
} from './types';

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
