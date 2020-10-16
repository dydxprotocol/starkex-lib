import Big from 'big.js';
import BN from 'bn.js';
import _ from 'lodash';

import {
  Asset,
  PerpetualMarket,
  StarkwareApiKey,
  StarkwareOrder,
  StarkwareWithdrawal,
  TokenStruct,
} from './types';

export const HEX_RE = /^0x[0-9a-fA-F]$/;

// As derived in starkware-crypto with layer='starkex' and application='starkexdvf'.
export const STARK_DERIVATION_PATH = 'm/2645\'/579218131\'/1393043894\'/0\'/0\'/0';

export const BASE_TOKEN: Record<PerpetualMarket, Asset> = {
  [PerpetualMarket.BTC_USD]: Asset.BTC,
  [PerpetualMarket.ETH_USD]: Asset.ETH,
  [PerpetualMarket.LINK_USD]: Asset.LINK,
};

export const ORDER_FIELD_BIT_LENGTHS: { [K in keyof StarkwareOrder]: number } = {
  orderType: 1,
  nonce: 16,
  publicKey: 63,
  amountSynthetic: 42,
  amountCollateral: 42,
  amountFee: 38,
  assetIdSynthetic: 0,
  assetIdCollateral: 0,
  positionId: 32,
  isBuyingSynthetic: 1,
  expirationTimestamp: 22,
};

export const ORDER_MAX_VALUES: { [K in keyof StarkwareOrder]: BN } = _.mapValues(
  ORDER_FIELD_BIT_LENGTHS,
  (numBits: number) => {
    return new BN(2).pow(new BN(numBits));
  },
);

export const WITHDRAWAL_FIELD_BIT_LENGTHS: { [K in keyof StarkwareWithdrawal]: number } = {
  nonce: 16,
  publicKey: 63,
  amount: 42,
  positionId: 32,
  expirationTimestamp: 22,
};

export const WITHDRAWAL_MAX_VALUES: { [K in keyof StarkwareWithdrawal]: BN } = _.mapValues(
  WITHDRAWAL_FIELD_BIT_LENGTHS,
  (numBits: number) => {
    return new BN(2).pow(new BN(numBits));
  },
);

export const API_KEY_FIELD_BIT_LENGTHS: { [K in keyof StarkwareApiKey]: number } = {
  nonce: 16,
  method: 16,
  publicKey: 63,
  body: 42,
  requestPath: 32,
  timestamp: 22,
};

export const API_KEY_MAX_VALUES: { [K in keyof StarkwareApiKey]: BN } = _.mapValues(
  API_KEY_FIELD_BIT_LENGTHS,
  (numBits: number) => {
    return new BN(2).pow(new BN(numBits));
  },
);

export const MARGIN_TOKEN = Asset.USDC;

// TODO: Update.
export const TOKEN_QUANTUM: Record<Asset, Big> = {
  [Asset.ETH]: new Big('1e-8'),
  [Asset.BTC]: new Big('1e-10'),
  [Asset.LINK]: new Big('1e-7'),
  [Asset.USDC]: new Big('1e-6'),
  [Asset.USDT]: new Big('1e-6'),
};

// TODO: Use the starkware-types structure for tokens for now.
// Need to get rid of this or adapt later.
export const TOKEN_STRUCTS: Record<Asset, TokenStruct> = {
  [Asset.ETH]: { type: 'ETH', data: { quantum: '1' } },
  [Asset.BTC]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  [Asset.LINK]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  [Asset.USDC]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  [Asset.USDT]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
};
