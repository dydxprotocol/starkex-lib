import BN from 'bn.js';

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
  publicKey: string; // Required x-coordinate.
  publicKeyYCoordinate?: string; // Optional y-coordinate.
  privateKey: string;
}

export interface KeyPairWithYCoordinate extends KeyPair {
  publicKeyYCoordinate: string;
}

// Signature, represented as hex strings, no 0x prefix.
export interface SignatureStruct {
  r: string;
  s: string;
}

export type HashFunction = (a: BN, b: BN) => BN | Promise<BN>;

// ============ Withdrawal Parameters ============

interface WithdrawalParamsBase {
  positionId: string;
  humanAmount: string;
  expirationIsoTimestamp: string;
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
  expirationEpochHours: number;
}

// ============ Conditional Transfer Parameters ============

export interface ConditionalTransferParams {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  factRegistryAddress: string;
  fact: string;
  humanAmount: string;
  clientId: string;
  expirationIsoTimestamp: string;
}

export interface StarkwareConditionalTransfer {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  condition: string;
  quantumsAmount: string;
  nonce: string; // For signature. A base-10 integer.
  expirationEpochHours: number;
}

// ============ Order Parameters ============

// The order must specify either quoteAmount or price.
interface OrderParamsBase {
  positionId: string;
  humanSize: string;
  limitFee: string; // Max fee fraction, e.g. 0.01 is a max 1% fee.
  market: DydxMarket;
  side: StarkwareOrderSide;
  expirationIsoTimestamp: string;
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
  expirationEpochHours: number;
}

// ============ API Request Parameters ============

export enum ApiMethod {
  POST = 'POST',
  PUT = 'PUT',
  GET = 'GET',
  DELETE = 'DELETE',
}

export interface ApiRequestParams {
  isoTimestamp: string;
  method: ApiMethod;
  requestPath: string;
  body: string;
}

// ============ Oracle Price Parameters ============

export interface OraclePriceWithAssetName {
  assetName: string;
  oracleName: string;
  humanPrice: string;
  isoTimestamp: string;
}

export interface OraclePriceWithMarket {
  market: DydxMarket;
  oracleName: string;
  humanPrice: string;
  isoTimestamp: string;
}

export interface StarkwareOraclePrice {
  // Note: This ID is specific to oracle signing and differs from the normal Starkware asset ID.
  signedAssetId: string;
  signedPrice: string; // Fixed point with 18 decimals.
  expirationEpochSeconds: number;
}
