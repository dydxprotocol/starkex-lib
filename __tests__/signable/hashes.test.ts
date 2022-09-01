/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * Test caching of pedersen hashes.
 */

import expect from 'expect';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import * as cryptoModule from '../../src/lib/crypto';
import { pedersen } from '../../src/lib/starkware';
import {
  SignableConditionalTransfer as SignableConditionalTransferOrig,
} from '../../src/signable/conditional-transfer';
import * as hashesModule from '../../src/signable/hashes';
import {
  SignableOrder as SignableOrderOrig,
} from '../../src/signable/order';
import {
  SignableTransfer as SignableTransferOrig,
} from '../../src/signable/transfer';
import {
  SignableWithdrawal as SignableWithdrawalOrig,
} from '../../src/signable/withdrawal';
import {
  ConditionalTransferParams,
  DydxMarket,
  NetworkId,
  OrderWithClientId,
  StarkwareOrderSide,
  TransferParams,
  WithdrawalWithClientId,
} from '../../src/types';

proxyquire.noPreserveCache();

// Mocks.
let mockPedersen: sinon.SinonSpy;
let proxyquiredCrypto: typeof cryptoModule;
let proxyquiredHashes: typeof hashesModule;
let mocks: any;

// Mock data.
const mockTransfer: TransferParams = {
  senderPositionId: '12345',
  receiverPositionId: '67890',
  receiverPublicKey: '05135ef87716b0faecec3ba672d145a6daad0aa46437c365d490022115aba674',
  humanAmount: '49.478023',
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  clientId: 'This is an ID that the client came up with to describe this transfer',
};
const mockConditionalTransfer: ConditionalTransferParams = {
  ...mockTransfer,
  factRegistryAddress: '0x12aa12aa12aa12aa12aa12aa12aa12aa12aa12aa',
  fact: '0x12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff12ff',
};
const mockOrder: OrderWithClientId = {
  positionId: '12345',
  humanSize: '145.0005',
  limitFee: '0.125',
  market: DydxMarket.ETH_USD,
  side: StarkwareOrderSide.BUY,
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  humanPrice: '350.00067',
  clientId: 'This is an ID that the client came up with to describe this order',
};
const mockWithdrawal: WithdrawalWithClientId = {
  positionId: '12345',
  humanAmount: '49.478023',
  expirationIsoTimestamp: '2020-09-17T04:15:55.028Z',
  clientId: 'This is an ID that the client came up with to describe this withdrawal',
};

describe('Pedersen hashes', () => {

  beforeEach(() => {
    // Reload the hashes module fresh each time, resetting the cache.
    mockPedersen = sinon.spy(pedersen);
    proxyquiredCrypto = proxyquire('../../src/lib/crypto/proxies', {
      '../starkware': {
        pedersen: mockPedersen,
      },
    });
    proxyquiredHashes = proxyquire('../../src/signable/hashes', {
      '../lib/crypto': proxyquiredCrypto,
    });
    mocks = {
      '../lib/crypto': proxyquiredCrypto,
      './hashes': proxyquiredHashes,
    };
  });

  it('conditional transfer: 5 hashes the first time, and 4 thereafter', async () => {
    const { SignableConditionalTransfer } = (
      proxyquire('../../src/signable/conditional-transfer', mocks)
    );
    await (SignableConditionalTransfer as typeof SignableConditionalTransferOrig).fromTransfer(
      mockConditionalTransfer,
      NetworkId.GOERLI,
    ).getHash();
    expect(mockPedersen.callCount).toBe(5);

    // Expect fewer hashes the second time.
    mockPedersen.resetHistory();
    await (SignableConditionalTransfer as typeof SignableConditionalTransferOrig).fromTransfer(
      mockConditionalTransfer,
      NetworkId.GOERLI,
    ).getHash();
    expect(mockPedersen.callCount).toBe(4);
  });

  it('order: 4 hashes the first time, and 2 thereafter', async () => {
    const { SignableOrder } = proxyquire('../../src/signable/order', mocks);
    await (SignableOrder as typeof SignableOrderOrig).fromOrder(
      mockOrder,
      NetworkId.GOERLI,
    ).getHash();
    expect(mockPedersen.callCount).toBe(4);

    // Expect fewer hashes the second time.
    mockPedersen.resetHistory();
    await (SignableOrder as typeof SignableOrderOrig).fromOrder(
      mockOrder,
      NetworkId.GOERLI,
    ).getHash();
    expect(mockPedersen.callCount).toBe(2);
  });

  it('transfer: 4 hashes the first time, and 3 thereafter', async () => {
    const { SignableTransfer } = (
      proxyquire('../../src/signable/transfer', mocks)
    );
    await (SignableTransfer as typeof SignableTransferOrig).fromTransfer(
      mockTransfer,
      NetworkId.GOERLI,
    ).getHash();
    expect(mockPedersen.callCount).toBe(4);

    // Expect fewer hashes the second time.
    mockPedersen.resetHistory();
    await (SignableTransfer as typeof SignableTransferOrig).fromTransfer(
      mockTransfer,
      NetworkId.GOERLI,
    ).getHash();
    expect(mockPedersen.callCount).toBe(3);
  });

  it('withdrawal: 1 hash the first time, and 1 thereafter', async () => {
    const { SignableWithdrawal } = proxyquire('../../src/signable/withdrawal', mocks);
    await (SignableWithdrawal as typeof SignableWithdrawalOrig).fromWithdrawal(
      mockWithdrawal,
      NetworkId.GOERLI,
    ).getHash();
    expect(mockPedersen.callCount).toBe(1);
  });

  // slowing down rest of test suite and will never be changed
  describe.skip('after pre-computing hashes', () => {

    beforeEach(async () => {
      await proxyquiredHashes.preComputeHashes(NetworkId.GOERLI);
      mockPedersen.resetHistory();
    });

    it('conditional transfer: 4 hashes', async () => {
      const { SignableConditionalTransfer } = (
        proxyquire('../../src/signable/conditional-transfer', mocks)
      );
      await (SignableConditionalTransfer as typeof SignableConditionalTransferOrig).fromTransfer(
        mockConditionalTransfer,
        NetworkId.GOERLI,
      ).getHash();
      expect(mockPedersen.callCount).toBe(4);
    });

    it('order: 2 hashes', async () => {
      const { SignableOrder } = proxyquire('../../src/signable/order', mocks);
      await (SignableOrder as typeof SignableOrderOrig).fromOrder(
        mockOrder,
        NetworkId.GOERLI,
      ).getHash();
      expect(mockPedersen!.callCount).toBe(2);
    });

    it('conditional transfer: 3 hashes', async () => {
      const { SignableTransfer } = (
        proxyquire('../../src/signable/transfer', mocks)
      );
      await (SignableTransfer as typeof SignableTransferOrig).fromTransfer(
        mockTransfer,
        NetworkId.GOERLI,
      ).getHash();
      expect(mockPedersen.callCount).toBe(3);
    });

    it('withdrawal: 1 hash', async () => {
      const { SignableWithdrawal } = proxyquire('../../src/signable/withdrawal', mocks);
      await (SignableWithdrawal as typeof SignableWithdrawalOrig).fromWithdrawal(
        mockWithdrawal,
        NetworkId.GOERLI,
      ).getHash();
      expect(mockPedersen.callCount).toBe(1);
    });
  });
});
