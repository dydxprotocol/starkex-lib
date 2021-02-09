import BN from 'bn.js';
import { keccak256 } from 'ethereum-cryptography/keccak';

/**
 * Match a hex string with no hex prefix (and at least one character).
 */
const HEX_RE = /^[0-9a-fA-F]+$/;

/**
 * Match a base-10 integer.
 */
const DEC_RE = /^[0-9]+$/;

const BIT_MASK_250 = new BN('3FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 16);

/**
 * Convert a BN to a 32-byte hex string without 0x prefix.
 */
export function bnToHex32(bn: BN): string {
  return normalizeHex32(bn.toString(16));
}

/**
 * Normalize to a lowercase 32-byte hex string without 0x prefix.
 */
export function normalizeHex32(hex: string): string {
  const paddedHex = stripHexPrefix(hex).toLowerCase().padStart(64, '0');
  if (paddedHex.length !== 64) {
    throw new Error('normalizeHex32: Input does not fit in 32 bytes');
  }
  return paddedHex;
}

/**
 * Generate a random Buffer.
 */
export function randomBuffer(numBytes: number): Buffer {
  const bytes = [];
  for (let i = 0; i < numBytes; i++) {
    bytes[i] = Math.floor(Math.random() * 0xff);
  }
  return Buffer.from(bytes);
}

/**
 * Create a "condition" Buffer (for a conditional transfer) from a factRegistry address and a fact.
 */
export function factToCondition(
  factRegistryAddress: string,
  fact: string,
): string {
  // Get Buffer equivalent of encode.packed(factRegistryAddress, fact).
  const combinedHex: string = `${factRegistryAddress}${normalizeHex32(fact)}`;
  const combinedBuffer: Buffer = Buffer.from(stripHexPrefix(combinedHex), 'hex');

  // Hash the data, mask by 250 bits, and return the hex string equivalent.
  const hashedData: Buffer = keccak256(combinedBuffer);
  const hashBN = hexToBn(hashedData.toString('hex'));
  const maskedHashBN = hashBN.and(BIT_MASK_250);
  return maskedHashBN.toString(16);
}

// ============ Creating BNs ============

/**
 * Convert a hex string with optional 0x prefix to a BN.
 */
export function hexToBn(hex: string): BN {
  return new BN(stripHexPrefix(hex), 16);
}

/**
 * Convert a decimal string to a BN.
 */
export function decToBn(dec: string): BN {
  if (!dec.match(DEC_RE)) {
    throw new Error('decToBn: Input is not a base-10 integer');
  }
  return new BN(dec, 10);
}

/**
 * Convert an integer number to a BN.
 */
export function intToBn(int: number): BN {
  if (!Number.isInteger(int)) {
    throw new Error('intToBn: Input is not an integer');
  }
  return new BN(int, 10);
}

/**
 * Convert a string to a BN equal to the left-aligned UTF-8 representation with a fixed bit length.
 *
 * The specified numBits is expected to be a multiple of four.
 */
export function utf8ToBn(
  s: string,
  numBits: number,
): BN {
  if (numBits % 4 !== 0) {
    throw new Error(`utf8ToBN: numBits=${numBits} is not a multiple of four`);
  }
  const buffer = Buffer.from(s);
  const hex = buffer.toString('hex');
  const paddedHex = hex.padEnd(numBits / 4, '0');
  if (paddedHex.length !== numBits / 4) {
    throw new Error(`utf8ToBN: Input does not fit in numBits=${numBits} bits`);
  }
  return new BN(paddedHex, 16);
}

// ============ Helper Functions ============

function stripHexPrefix(hex: string): string {
  const hexNoPrefix = hex.replace(/^0x/, '');
  if (!hexNoPrefix.match(HEX_RE)) {
    throw new Error('stripHexPrefix: Input is not a hex string');
  }
  return hexNoPrefix;
}
