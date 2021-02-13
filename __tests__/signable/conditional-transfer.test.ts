/**
 * Unit tests for signable/conditional-transfer.ts.
 */

import expect from 'expect';
import _ from 'lodash';

import {
  KeyPair,
  StarkwareConditionalTransfer,
  ConditionalTransferParams,
  NetworkId,
} from '../../src/types';
import { generateKeyPairUnsafe } from '../../src/keys';
import { mutateHexStringAt } from '../util';

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
  factRegistryAddress: '0x12aa12aa12aa12aa12aa12aa12aa12aa12aa12aa',
  fact: '0x12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff',
};
const mockSignature = (
  '04814c5d3501863134108802cab5d12df4b959654332103b837252549d24e9a6' +
  '06bc01225e9f1690b08b63de2a3b179fb2927d4564b3440bbb0da4c37caf597e'
);

describe('SignableConditionalTransfer', () => {

  describe('verifySignature()', () => {

    it('returns true for a valid signature', async () => {
      const result = await SignableConditionalTransfer.fromTransfer(mockParams, NetworkId.ROPSTEN)
        .verifySignature(mockSignature, mockKeyPair.publicKey);
      expect(result).toBe(true);
    });

    it('returns false for an invalid signature', async () => {
      // Mutate a single character in r.
      const badSignatureR: string = mutateHexStringAt(mockSignature, 1);
      const result1 = await SignableConditionalTransfer.fromTransfer(mockParams, NetworkId.ROPSTEN)
        .verifySignature(badSignatureR, mockKeyPair.publicKey);
      expect(result1).toBe(false);

      // Mutate a single character in s.
      const badSignatureS: string = mutateHexStringAt(mockSignature, 65);
      const result2 = await SignableConditionalTransfer.fromTransfer(mockParams, NetworkId.ROPSTEN)
        .verifySignature(badSignatureS, mockKeyPair.publicKey);
      expect(result2).toBe(false);
    });
  });

  describe('sign()', () => {

    it('signs a transfer', async () => {
      const signature = await SignableConditionalTransfer.fromTransfer(
        mockParams,
        NetworkId.ROPSTEN,
      ).sign(mockKeyPair.privateKey);
      expect(signature).toEqual(mockSignature);
    });

    it('generates a different signature when the client ID is different', async () => {
      const transfer = {
        ...mockParams,
        clientId: `${mockParams.clientId}!`,
      };
      const signature = await SignableConditionalTransfer.fromTransfer(transfer, NetworkId.ROPSTEN)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });

    it('generates a different signature when the receiver position ID is different', async () => {
      const transfer = {
        ...mockParams,
        receiverPositionId: (Number.parseInt(mockParams.receiverPositionId, 10) + 1).toString(),
      };
      const signature = await SignableConditionalTransfer.fromTransfer(transfer, NetworkId.ROPSTEN)
        .sign(mockKeyPair.privateKey);
      expect(signature).not.toEqual(mockSignature);
    });
  });

  describe('toStarkware()', () => {

    it('converts human amounts to quantum amounts and converts expiration to hours', async () => {
      const starkwareConditionalTransfer: StarkwareConditionalTransfer = (
        SignableConditionalTransfer.fromTransfer(mockParams, NetworkId.ROPSTEN).toStarkware()
      );
      expect(starkwareConditionalTransfer.quantumsAmount).toEqual('49478023');
      expect(starkwareConditionalTransfer.expirationEpochHours).toBe(444533);
    });
  });

  it('end-to-end', async () => {
    // Repeat some number of times.
    await Promise.all(_.range(3).map(async () => {
      const keyPair: KeyPair = generateKeyPairUnsafe();
      const signable = SignableConditionalTransfer.fromTransfer(mockParams, NetworkId.ROPSTEN);
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
