/**
 * Unit tests for signable/conditional-transfer.ts.
 */

import expect from 'expect';

import {
  KeyPair,
  StarkwareConditionalTransfer,
  ConditionalTransferParams,
} from '../../src/types';
import { generateKeyPairUnsafe } from '../../src/keys';
import { mutateHexStringAt } from './util';

// Module under test.
import { SignableConditionalTransfer } from '../../src/signable/conditional-transfer';

// Mock params.
const mockKeyPair: KeyPair = {
  publicKey: '3b865a18323b8d147a12c556bfb1d502516c325b1477a23ba6c77af31f020fd',
  privateKey: '58c7d5a90b1776bde86ebac077e053ed85b0f7164f53b080304a531947f46e3',
};
const mockParams: ConditionalTransferParams = {
  senderPositionId: '12345',
  receiverPositionId: '67890',
  receiverPublicKey: '05135ef87716b0faecec3ba672d145a6daad0aa46437c365d490022115aba674',
  humanAmount: '49.478023',
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  clientId: 'This is an ID that the client came up with to describe this transfer',
  condition: Buffer.from('mock-condition'),
};
const mockSignature = (
  '014dedad7bd42da36e81ce627e55be508a4afe019700dd478ea8134b3549d327' +
  '0571d1dcbab6f25f4d2f3af054f359773289266c69df91c9608882f0a9b201d8'
);

describe('SignableConditionalTransfer', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature', () => {
      const result = new SignableConditionalTransfer(mockParams)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      // Mutate a single character in r.
      const badSignatureR: string = mutateHexStringAt(mockSignature, 0);
      const result1 = new SignableConditionalTransfer(mockParams)
        .verifySignature(badSignatureR, mockKeyPair.publicKey);
      expect(result1).toBe(false);

      // Mutate a single character in s.
      const badSignatureS: string = mutateHexStringAt(mockSignature, 64);
      const result2 = new SignableConditionalTransfer(mockParams)
        .verifySignature(badSignatureS, mockKeyPair.publicKey);
      expect(result2).toBe(false);
    });
  });

  describe('sign()', () => {

    it('signs a transfer', () => {
      const signature = new SignableConditionalTransfer(mockParams)
        .sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the client ID is different', () => {
      const transfer = {
        ...mockParams,
        clientId: `${mockParams.clientId}!`,
      };
      const signature = new SignableConditionalTransfer(transfer)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the receiver position ID is different', () => {
      const transfer = {
        ...mockParams,
        receiverPositionId: (Number.parseInt(mockParams.receiverPositionId, 10) + 1).toString(),
      };
      const signature = new SignableConditionalTransfer(transfer)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });
  });

  describe('toStarkware()', () => {

    it('converts human amounts to quantum amounts', () => {
      const starkwareConditionalTransfer: StarkwareConditionalTransfer = (
        new SignableConditionalTransfer(mockParams).toStarkware()
      );
      expect(starkwareConditionalTransfer.quantumsAmount).toEqual('49478023');
    });
  });

  it('end-to-end', () => {
    const keyPair: KeyPair = generateKeyPairUnsafe();
    const signable = new SignableConditionalTransfer(mockParams);
    const signature = signable.sign(keyPair.privateKey);

    // Expect to be valid when verifying with the right public key.
    expect(
      signable.verifySignature(signature, keyPair.publicKey),
    ).toBe(true);

    // Expect to be invalid when verifying with a different public key.
    expect(
      signable.verifySignature(signature, mockKeyPair.publicKey),
    ).toBe(false);
  });
});
