/**
 * Unit tests for signable/crypto.ts.
 */

import BN from 'bn.js';
import elliptic from 'elliptic';
import expect from 'expect';

import {
  setGlobalStarkHashImplementation,
  setGlobalStarkSigningImplementation,
  setGlobalStarkVerificationImplementation,
} from '../../../src/lib/crypto/proxies';
import {
  pedersen,
  sign,
  verify,
} from '../../../src/lib/starkware';
import { SignatureStruct } from '../../../src/types';

describe('Cryptographic function wrappers for STARK signable objects', () => {

  it('allows setting the hash function implementation', async () => {
    await setGlobalStarkHashImplementation(pedersen);
  });

  it('allows setting the signing function implementation', async () => {
    await setGlobalStarkSigningImplementation(sign);
  });

  it('allows setting the verification function implementation', async () => {
    await setGlobalStarkVerificationImplementation(verify);
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
        (_key: elliptic.ec.KeyPair, _message: BN) => ({
          r: new BN(1),
          s: new BN(2),
        }) as elliptic.ec.Signature,
      ),
    ).rejects.toThrow('Sanity check failed');
  });

  it('throws if invalid verification function provided (returning false)', async () => {
    await expect(
      setGlobalStarkVerificationImplementation(
        (_key: elliptic.ec.KeyPair, _message: BN, _signature: SignatureStruct) => false,
      ),
    ).rejects.toThrow('Sanity check failed');
  });

  it('throws if invalid verification function provided (returning true)', async () => {
    await expect(
      setGlobalStarkVerificationImplementation(
        (_key: elliptic.ec.KeyPair, _message: BN, _signature: SignatureStruct) => true,
      ),
    ).rejects.toThrow('Sanity check failed');
  });
});
