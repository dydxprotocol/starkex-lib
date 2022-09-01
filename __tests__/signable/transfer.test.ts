/**
 * Unit tests for signable/transfer.ts.
 */

import expect from 'expect';
import _ from 'lodash';

import {
  KeyPair,
  StarkwareTransfer,
  TransferParams,
  NetworkId,
} from '../../src/types';
import { generateKeyPairUnsafe } from '../../src/keys';
import { mutateHexStringAt } from '../util';

// Module under test.
import { SignableTransfer } from '../../src/signable/transfer';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockParams: TransferParams = {
  senderPositionId: '12345',
  receiverPositionId: '67890',
  receiverPublicKey: '05135ef87716b0faecec3ba672d145a6daad0aa46437c365d490022115aba674',
  humanAmount: '49.478023',
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  clientId: 'This is an ID that the client came up with to describe this transfer',
};
const mockSignature = (
  '07a64843a0fb9bd455696139f6230d3152d9df2e863d54587f1f8bdbb07eb032' +
  '0699b82593aa2e02915694ffc39c1001e81337b8fcc73f5b91f73ce5146c50bd'
);

describe('SignableTransfer', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature', async () => {
      const result = await SignableTransfer.fromTransfer(mockParams, NetworkId.GOERLI)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', async () => {
      // Mutate a single character in r.
      const badSignatureR: string = mutateHexStringAt(mockSignature, 2);
      const result1 = await SignableTransfer.fromTransfer(mockParams, NetworkId.GOERLI)
        .verifySignature(badSignatureR, mockKeyPair.publicKey);
      expect(result1).toBe(false);

      // Mutate a single character in s.
      const badSignatureS: string = mutateHexStringAt(mockSignature, 65);
      const result2 = await SignableTransfer.fromTransfer(mockParams, NetworkId.GOERLI)
        .verifySignature(badSignatureS, mockKeyPair.publicKey);
      expect(result2).toBe(false);
    });
  });

  describe('sign()', () => {

    it('signs a transfer', async () => {
      const signature = await SignableTransfer.fromTransfer(
        mockParams,
        NetworkId.GOERLI,
      ).sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the client ID is different', async () => {
      const transfer = {
        ...mockParams,
        clientId: `${mockParams.clientId}!`,
      };
      const signature = await SignableTransfer.fromTransfer(transfer, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the receiver position ID is different', async () => {
      const transfer = {
        ...mockParams,
        receiverPositionId: (Number.parseInt(mockParams.receiverPositionId, 10) + 1).toString(),
      };
      const signature = await SignableTransfer.fromTransfer(transfer, NetworkId.GOERLI)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });
  });

  describe('toStarkware()', () => {

    it('converts human amounts to quantum amounts and converts expiration to hours', () => {
      const starkwareTransfer: StarkwareTransfer = (
        SignableTransfer.fromTransfer(mockParams, NetworkId.GOERLI).toStarkware()
      );
      expect(starkwareTransfer.quantumsAmount).toEqual('49478023');
      expect(starkwareTransfer.expirationEpochHours).toBe(444533);
    });
  });

  it('end-to-end', async () => {
    // Repeat some number of times.
    await Promise.all(_.range(3).map(async () => {
      const keyPair: KeyPair = generateKeyPairUnsafe();
      const signable = SignableTransfer.fromTransfer(mockParams, NetworkId.GOERLI);
      const signature = await signable.sign(keyPair.privateKey);

      // Expect to be valid when verifying with the right public key.
      expect(
        await signable.verifySignature(signature, keyPair.publicKey),
      ).toBe(true);

      // Expect to be invalid when verifying with a different public key.
      expect(
        await signable.verifySignature(signature, mockKeyPair.publicKey),
      ).toBe(false);
    }));
  });
});
