/**
 * Unit tests for signable/crypto.ts.
 */

import BN from 'bn.js';
import expect from 'expect';

import {
  setGlobalStarkHashImplementation,
  setGlobalStarkSigningImplementation,
  setGlobalStarkVerificationImplementation,
} from '../../../src/lib/crypto/proxies';
import {
  cryptoJs,
} from '../../../src/lib/crypto';
import { PublicKeyStruct, SignatureStruct } from '../../../src/types';

describe('Cryptographic function wrappers for STARK signable objects', () => {

  it('allows setting the hash function implementation', async () => {
    await setGlobalStarkHashImplementation(cryptoJs.pedersen);
  });

  it('allows setting the signing function implementation', async () => {
    await setGlobalStarkSigningImplementation(cryptoJs.sign);
  });

  it('allows setting the verification function implementation', async () => {
    await setGlobalStarkVerificationImplementation(cryptoJs.verify);
  });

  it('throws if invalid hash function provided', async () => {
    await expect(
      setGlobalStarkHashImplementation(
        (a: BN, b: BN) => a.add(b),
      ),
    ).rejects.toThrow('Sanity check failed');
  });

  it('throws if invalid signing function provided', async () => {
    await expect(
      setGlobalStarkSigningImplementation(
        (_key: string, _message: BN) => ({
          r: '0x1',
          s: '0x2',
        }),
      ),
    ).rejects.toThrow('Sanity check failed');
  });

  it('throws if invalid verification function provided (returning false)', async () => {
    await expect(
      setGlobalStarkVerificationImplementation(
        (_key: string | PublicKeyStruct, _message: BN, _signature: SignatureStruct) => false,
      ),
    ).rejects.toThrow('Sanity check failed');
  });

  it('throws if invalid verification function provided (returning true)', async () => {
    await expect(
      setGlobalStarkVerificationImplementation(
        (_key: string | PublicKeyStruct, _message: BN, _signature: SignatureStruct) => true,
      ),
    ).rejects.toThrow('Sanity check failed');
  });
});
