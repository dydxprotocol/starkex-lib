import { KeyPair, Order, Signature } from './types';

export { KeyPair, Order, Signature };
export * from './constants';

/**
 * Generate a StarkEx key pair. Only suitable for test and development purposes.
 */
export function generateUnsafeKeyPair(): KeyPair {
  const publicKey = '';
  const privateKey = '';
  return {
    publicKey,
    privateKey,
  };
}

/**
 *
 */
export function verifySignature(
  _order: Order,
  _signature: Signature,
): boolean {
  return false;
}

export function sign(
  _order: Order,
  _keyPair: KeyPair,
): Signature {
  // Validate the input data?
  return { r: '', s: '' };
}
