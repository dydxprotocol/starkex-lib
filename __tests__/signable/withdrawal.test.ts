/**
 * Unit tests for signable/withdrawal.ts.
 */

import expect from 'expect';
import _ from 'lodash';

import {
  KeyPair,
  NetworkId,
  StarkwareWithdrawal,
  WithdrawalWithClientId,
  WithdrawalWithNonce,
} from '../../src/types';
import { generateKeyPairUnsafe } from '../../src/keys';
import { nonceFromClientId } from '../../src/helpers';
import { mutateHexStringAt } from '../util';

// Module under test.
import { SignableWithdrawal } from '../../src/signable/withdrawal';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockWithdrawal: WithdrawalWithClientId = {
  positionId: '12345',
  humanAmount: '49.478023',
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  clientId: 'This is an ID that the client came up with to describe this withdrawal',
};
const mockSignature = (
  '05e48c33f8205a5359c95f1bd7385c1c1f587e338a514298c07634c0b6c952ba' +
  '0687d6980502a5d7fa84ef6fdc00104db22c43c7fb83e88ca84f19faa9ee3de1'
);

describe('SignableWithdrawal', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature', async () => {
      const result = await SignableWithdrawal
        .fromWithdrawal(mockWithdrawal, NetworkId.ROPSTEN)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', async () => {
      // Mutate a single character in r.
      await Promise.all(_.range(1, 4).map(async (i) => {
        const badSignature: string = mutateHexStringAt(mockSignature, i);
        const result = await SignableWithdrawal
          .fromWithdrawal(mockWithdrawal, NetworkId.ROPSTEN)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }));

      // Mutate a single character in s.
      await Promise.all(_.range(1, 4).map(async (i) => {
        const badSignature: string = mutateHexStringAt(mockSignature, i + 64);
        const result = await SignableWithdrawal
          .fromWithdrawal(mockWithdrawal, NetworkId.ROPSTEN)
          .verifySignature(badSignature, mockKeyPair.publicKey);
        expect(result).toBe(false);
      }));
    });
  });

  describe('sign()', () => {

    it('signs a withdrawal', async () => {
      const signature = await SignableWithdrawal
        .fromWithdrawal(mockWithdrawal, NetworkId.ROPSTEN)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('signs a withdrawal with nonce instead of clientId', async () => {
      const withdrawalWithNonce: WithdrawalWithNonce = {
        ...mockWithdrawal,
        clientId: undefined,
        nonce: nonceFromClientId(mockWithdrawal.clientId),
      };
      const signature = await SignableWithdrawal
        .fromWithdrawalWithNonce(withdrawalWithNonce, NetworkId.ROPSTEN)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the client ID is different', async () => {
      const withdrawal = {
        ...mockWithdrawal,
        clientId: `${mockWithdrawal.clientId}!`,
      };
      const signature = await SignableWithdrawal
        .fromWithdrawal(withdrawal, NetworkId.ROPSTEN)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the position ID is different', async () => {
      const withdrawal = {
        ...mockWithdrawal,
        positionId: (Number.parseInt(mockWithdrawal.positionId, 10) + 1).toString(),
      };
      const signature = await SignableWithdrawal
        .fromWithdrawal(withdrawal, NetworkId.ROPSTEN)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });
  });

  describe('toStarkware()', () => {

    it('converts human amounts to quantum amounts and converts expiration to hours', () => {
      const starkwareWithdrawal: StarkwareWithdrawal = SignableWithdrawal
        .fromWithdrawal(mockWithdrawal, NetworkId.ROPSTEN)
        .toStarkware();
      expect(starkwareWithdrawal.quantumsAmount).toBe('49478023');
      expect(starkwareWithdrawal.expirationEpochHours).toBe(444533);
    });
  });

  it('end-to-end', async () => {
    // Repeat some number of times.
    await Promise.all(_.range(3).map(async () => {
      const keyPair: KeyPair = generateKeyPairUnsafe();
      const signableWithdrawal = SignableWithdrawal.fromWithdrawal(
        mockWithdrawal,
        NetworkId.ROPSTEN,
      );
      const signature = await signableWithdrawal.sign(keyPair.privateKey);

      // Expect to be valid when verifying with the right public key.
      expect(
        await signableWithdrawal.verifySignature(signature, keyPair.publicKey),
      ).toBe(true);

      // Expect to be invalid when verifying with a different public key.
      expect(
        await signableWithdrawal.verifySignature(signature, mockKeyPair.publicKey),
      ).toBe(false);
    }));
  });
});
