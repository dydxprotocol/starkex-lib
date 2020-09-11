import BN from 'bn.js';

import { Order, Token, TokenStruct } from './types';

export const HEX_63_RE = /^0x[a-f]{63}$/;
export const TWO_POW_63_BN = new BN('8000000000000000', 16);

// TODO: Update to correct values.
export const ORDER_FIELD_LENGTHS: { [K in keyof Order]: number } = {
  orderType: 63,
  nonce: 63,
  publicKey: 63,
  amountSell: 63,
  amountBuy: 63,
  amountFee: 63,
  tokenIdSell: 63,
  tokenIdBuy: 63,
  positionId: 63,
  expirationTimestamp: 63,
};
// TODO: Derive from ORDER_FIELD_LENGTHS.
export const ORDER_MAX_VALUES: { [K in keyof Order]: BN } = {
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

// TODO: Use the starkware-types structure for tokens for now. Might get rid of this or adapt later.
export const TOKEN_STRUCTS: Record<Token, TokenStruct> = {
  ETH: { type: 'ETH', data: { quantum: '1' } },
  USDC: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
  },
  USDT: {
    type: 'ERC20',
    data: {
      quantum: '1', tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
  },
};
