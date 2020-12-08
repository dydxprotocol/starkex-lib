export enum StarkwareOrderType {
  LIMIT_ORDER_WITH_FEES = 'LIMIT_ORDER_WITH_FEES',
}

export enum StarkwareOrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

// TODO: De-dup with other definitions.
export enum DydxMarket {
  BTC_USD = 'BTC-USD',
  ETH_USD = 'ETH-USD',
  LINK_USD = 'LINK-USD',
}

export enum DydxAsset {
  USDC = 'USDC',
  BTC = 'BTC',
  ETH = 'ETH',
  LINK = 'LINK',
}

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

// ============ Withdrawal Parameters ============

interface WithdrawalParamsBase {
  positionId: string;
  humanAmount: string;
  expiresAt: string; // ISO timestamp.
}
interface WithClientId {
  clientId: string;
  nonce?: undefined;
}
interface WithNonce {
  clientId?: undefined;
  nonce: string;
}
export type WithdrawalWithClientId = WithdrawalParamsBase & WithClientId;
export type WithdrawalWithNonce = WithdrawalParamsBase & WithNonce;

export interface StarkwareWithdrawal {
  positionId: string;
  quantumsAmount: string;
  nonce: string; // For signature. A base-10 integer.
  expirationTimestamp: string; // For signature. Unix timestamp in seconds.
}

// ============ Order Parameters ============

// The order must specify either quoteAmount or price.
interface OrderParamsBase {
  positionId: string;
  humanSize: string;
  humanLimitFee: string;
  market: DydxMarket;
  side: StarkwareOrderSide;
  expiresAt: string; // ISO timestamp.
}
export interface WithPrice {
  humanPrice: string;
  humanQuoteAmount?: undefined;
}
export interface WithQuoteAmount {
  humanPrice?: undefined;
  humanQuoteAmount: string;
}
export type OrderWithClientId = OrderParamsBase & WithPrice & WithClientId;
export type OrderWithNonce = OrderParamsBase & WithPrice & WithNonce;

// FOR INTERNAL USE. Not recommended for external users.
export type OrderWithClientIdAndQuoteAmount = OrderParamsBase & WithQuoteAmount & WithClientId;
export type OrderWithNonceAndQuoteAmount = OrderParamsBase & WithQuoteAmount & WithNonce;

export interface StarkwareAmounts {
  quantumsAmountSynthetic: string;
  quantumsAmountCollateral: string;
  assetIdSynthetic: string;
  assetIdCollateral: string;
  isBuyingSynthetic: boolean;
}

export interface StarkwareOrder extends StarkwareAmounts {
  orderType: StarkwareOrderType;
  quantumsAmountFee: string;
  assetIdFee: string;
  positionId: string;
  nonce: string; // For signature. A base-10 integer.
  expirationTimestamp: string; // For signature. Unix timestamp in seconds.
}

// ============ API Request Parameters ============

export enum ApiMethod {
  POST = 'POST',
  PUT = 'PUT',
  GET = 'GET',
  DELETE = 'DELETE',
}

export interface ApiRequestParams {
  timestamp: string; // ISO timestamp.
  method: ApiMethod;
  requestPath: string;
  body: string;
}

// ============ Regsistration Parameters ============

export interface RegistrationParams {
  ethereumAddress: string;
  starkKey: string;
}

// ============ Oracle Price Parameters ============

export interface OraclePriceWithAssetName {
  assetName: string;
  oracleName: string;
  price: string;
  timestamp: string; // Unix timestamp in seconds.
}

export interface OraclePriceWithAssetId {
  // Note: This ID is specific to oracle signing and differs from the normal Starkware asset ID.
  signedAssetId: string;
  price: string;
  timestamp: string; // Unix timestamp in seconds.
}
