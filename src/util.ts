import BN from 'bn.js';

/**
 * Convert a BN to a 32-byte hex string (no 0x prefix).
 */
export function bnToHex(bn: BN): string {
  return bn.toString('hex').padStart(64, '0');
}
