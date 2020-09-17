import BN from 'bn.js';

import {
  PerpetualMarket,
  StarkwareOrder,
  Token,
  TokenStruct,
} from './types';

export const HEX_RE = /^0x[0-9a-fA-F]$/;
export const TWO_POW_63_BN = new BN('8000000000000000', 16);

// As derived in starkware-crypto with layer='starkex' and application='starkexdvf'.
export const STARK_DERIVATION_PATH = 'm/2645\'/579218131\'/1393043894\'/0\'/0\'/0';

export const BASE_TOKEN: Record<PerpetualMarket, Token> = {
  [PerpetualMarket.PBTC_USDC]: Token.BTC,
  [PerpetualMarket.WETH_PUSD]: Token.ETH,
  [PerpetualMarket.PLINK_USDC]: Token.LINK,
}

// TODO: Update to correct values.
export const ORDER_FIELD_LENGTHS: { [K in keyof StarkwareOrder]: number } = {
  orderType: 63,
  nonce: 31,
  publicKey: 63,
  amountSell: 63,
  amountBuy: 63,
  amountFee: 63,
  tokenIdSell: 63,
  tokenIdBuy: 63,
  positionId: 63,
  expirationTimestamp: 22,
};
// TODO: Derive from ORDER_FIELD_LENGTHS.
export const ORDER_MAX_VALUES: { [K in keyof StarkwareOrder]: BN } = {
  orderType: TWO_POW_63_BN,
  nonce: TWO_POW_63_BN,
  publicKey: TWO_POW_63_BN,
  amountSell: TWO_POW_63_BN,
  amountBuy: TWO_POW_63_BN,
  amountFee: TWO_POW_63_BN,
  tokenIdSell: TWO_POW_63_BN,
  tokenIdBuy: TWO_POW_63_BN,
  positionId: TWO_POW_63_BN,
  expirationTimestamp: TWO_POW_63_BN,
};

// TODO: Use the starkware-types structure for tokens for now.
// Need to get rid of this or adapt later.
export const TOKEN_STRUCTS: Record<Token, TokenStruct> = {
  ETH: { type: 'ETH', data: { quantum: '1' } },
  BTC: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  LINK: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  USDC: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
  USDT: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0x0000000000000000000000000000000000000000',
    },
  },
};
