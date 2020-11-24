import * as elliptic from 'elliptic';
import starkwareTypes from 'starkware-types';

export enum OrderType {
  LIMIT = 'LIMIT_ORDER_WITH_FEES',
}

// TODO: De-dup with the definition in stacks.
export enum PerpetualMarket {
  BTC_USD = 'BTC-USD',
  ETH_USD = 'ETH-USD',
  LINK_USD = 'LINK-USD',
}

export enum Asset {
  BTC = 'BTC',
  ETH = 'ETH',
  LINK = 'LINK',
  USDC = 'USDC',
  USDT = 'USDT',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
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
export interface SignatureStruct {
  r: string;
  s: string;
}

export interface InternalWithdrawal {
  clientId: string;
  starkKey: string;
  positionId: string;
  debitAmount: string;
  expiresAt: string;
}

// The order must specify either quoteAmount or price.
interface InternalOrderBase {
  starkKey: string,
  positionId: string,
  size: string,
  limitFee: string,
  market: PerpetualMarket,
  side: OrderSide,
  expiresAt: string,
}
interface WithPrice {
  price: string,
  quoteAmount?: undefined,
}
interface WithQuoteAmount {
  price?: undefined,
  quoteAmount: string,
}
interface WithClientId {
  clientId: string,
  nonce?: undefined,
}
interface WithNonce {
  clientId?: undefined,
  nonce: string,
}
export type InternalOrderWithPriceAndClientId = InternalOrderBase & WithPrice & WithClientId;
export type InternalOrderWithQuoteAmountAndClientId = (
  InternalOrderBase & WithQuoteAmount & WithClientId
);
export type InternalOrderWithPriceAndNonce = InternalOrderBase & WithPrice & WithNonce;
export type InternalOrderWithQuoteAmountAndNonce = InternalOrderBase & WithQuoteAmount & WithNonce;
export type InternalOrder = (
  InternalOrderWithPriceAndClientId |
  InternalOrderWithQuoteAmountAndClientId |
  InternalOrderWithPriceAndNonce |
  InternalOrderWithQuoteAmountAndNonce
);

export enum ApiMethod {
  POST = 'POST',
  PUT = 'PUT',
  GET = 'GET',
  DELETE = 'DELETE',
}

export interface InternalApiRequest {
  publicKey: string,
  timestamp: string,
  method: ApiMethod,
  requestPath: string,
  body: string,
}

export interface InternalRegistration {
  ethereumAddress: string,
  publicKey: string,
}

export interface StarkwareSignable {
  publicKey: string;
}

export interface StarkwareWithdrawal extends StarkwareSignable {
  positionId: string;
  amount: string;
  nonce: string; // For signature.
  expirationTimestamp: string; // For signature.
}

export interface StarkwareAmounts {
  amountSynthetic: string;
  amountCollateral: string;
  assetIdSynthetic: Asset;
  assetIdCollateral: Asset;
  isBuyingSynthetic: boolean;
}

export interface StarkwareOrder extends StarkwareAmounts, StarkwareSignable {
  orderType: OrderType;
  amountFee: string;
  positionId: string;
  nonce: string; // For signature.
  expirationTimestamp: string; // For signature.
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
