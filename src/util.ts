import BN from 'bn.js';

/**
 * Convert a BN to a 32-byte hex string without 0x prefix.
 */
export function bnToHex(bn: BN): string {
  return normalizeHex(bn.toString(16));
}

/**
 * Normalize to a 32-byte hex string without 0x prefix.
 */
export function normalizeHex(hex: string): string {
  const newHex = hex.replace(/^0x/, '').padStart(64, '0');
  if (newHex.length !== 64) {
    throw new Error('normalizeHex: Hex string is longer than 32 bytes');
  }
  return newHex;
}
