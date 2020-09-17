import BN from 'bn.js';
import _ from 'lodash';

import {
  PerpetualMarket,
  StarkwareOrder,
  Token,
  TokenStruct,
} from './types';

export const HEX_RE = /^0x[0-9a-fA-F]$/;

// As derived in starkware-crypto with layer='starkex' and application='starkexdvf'.
export const STARK_DERIVATION_PATH = 'm/2645\'/579218131\'/1393043894\'/0\'/0\'/0';

export const BASE_TOKEN: Record<PerpetualMarket, Token> = {
  [PerpetualMarket.PBTC_USDC]: Token.BTC,
  [PerpetualMarket.WETH_PUSD]: Token.ETH,
  [PerpetualMarket.PLINK_USDC]: Token.LINK,
};

// TODO: Update to correct values.
export const ORDER_FIELD_LENGTHS: { [K in keyof StarkwareOrder]: number } = {
  orderType: 1,
  nonce: 16,
  publicKey: 63,
  amountSell: 42,
  amountBuy: 42,
  amountFee: 38,
  tokenIdSell: 0,
  tokenIdBuy: 0,
  positionId: 32,
  expirationTimestamp: 22,
};
// TODO: Derive from ORDER_FIELD_LENGTHS.
export const ORDER_MAX_VALUES: { [K in keyof StarkwareOrder]: BN } = _.mapValues(
  ORDER_FIELD_LENGTHS,
  (numBits: number) => {
    return new BN(2).pow(new BN(numBits));
  },
);

export const MARGIN_TOKEN = Token.USDC;

// TODO: Update.
export const TOKEN_DECIMALS: Record<Token, number> = {
  [Token.ETH]: 6,
  [Token.BTC]: 6,
  [Token.LINK]: 6,
  [Token.USDC]: 6,
  [Token.USDT]: 6,
};

// TODO: Use the starkware-types structure for tokens for now.
// Need to get rid of this or adapt later.
export const TOKEN_STRUCTS: Record<Token, TokenStruct> = {
  [Token.ETH]: { type: 'ETH', data: { quantum: '1' } },
  [Token.BTC]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  [Token.LINK]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  [Token.USDC]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  [Token.USDT]: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
};
