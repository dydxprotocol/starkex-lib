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

export type EcKeyPair = elliptic.ec.KeyPair;
export type EcPublicKey = elliptic.curve.base.BasePoint;
export type EcSignature = elliptic.ec.Signature;

// Key pair, represented as hex strings, no 0x prefix.
export interface KeyPair {
  publicKey: string; // x-coordinate
  privateKey: string;
}

// Signature, represented as hex strings, no 0x prefix.
export interface Signature {
  r: string;
  s: string;
}

export interface Order {
  orderType: OrderType;
  nonce: string;
  publicKey: string;
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
