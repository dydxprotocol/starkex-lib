import * as elliptic from 'elliptic';
import starkwareTypes from 'starkware-types';

export enum OrderType {
  LIMIT = 'LIMIT',
}

export enum Token {
  ETH = 'ETH',
  USDC = 'USDC',
  USDT = 'USDT',
}

// Re-export the classes.
export type KeyPair = elliptic.ec.KeyPair;
// export const KeyPair = elliptic.ec.KeyPair;
export type Signature = elliptic.ec.Signature;
export const Signature = elliptic.ec.Signature;

export interface Order {
  orderType: OrderType;
  nonce: string;
  publicKey: { x: string, y: string };
  amountSell: string;
  amountBuy: string;
  amountFee: string;
  tokenIdSell: Token;
  tokenIdBuy: Token;
  positionId: string;
  expirationTimestamp: string;
}

// Improve on the starkware-types token types.
export interface EthToken extends starkwareTypes.Token {
  type: 'ETH',
  data: starkwareTypes.ETHTokenData,
}
export interface Erc20Token extends starkwareTypes.Token {
  type: 'ERC20',
  data: starkwareTypes.ERC20TokenData,
}
export type TokenStruct = EthToken | Erc20Token;
