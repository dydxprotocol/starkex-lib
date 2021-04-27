import BN from 'bn.js';
import elliptic from 'elliptic';

export enum NetworkId {
  MAINNET = 1,
  ROPSTEN = 3,
}

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
  AAVE_USD = 'AAVE-USD',
  UNI_USD = 'UNI-USD',
  SUSHI_USD = 'SUSHI-USD',
  SOL_USD = 'SOL-USD',
  YFI_USD = 'YFI-USD',
  ONEINCH_USD = '1INCH-USD',
  AVAX_USD = 'AVAX-USD',
  SNX_USD = 'SNX-USD',
  CRV_USD = 'CRV-USD',
  UMA_USD = 'UMA-USD',
  DOT_USD = 'DOT-USD',
  DOGE_USD = 'DOGE-USD',
}

export enum DydxAsset {
  USDC = 'USDC',
  BTC = 'BTC',
  ETH = 'ETH',
  LINK = 'LINK',
  AAVE = 'AAVE',
  UNI = 'UNI',
  SUSHI = 'SUSHI',
  SOL = 'SOL',
  YFI = 'YFI',
  ONEINCH = '1INCH',
  AVAX = 'AVAX',
  SNX = 'SNX',
  CRV = 'CRV',
  UMA = 'UMA',
  DOT = 'DOT',
  DOGE = 'DOGE',
}

export type SyntheticAsset = Exclude<DydxAsset, DydxAsset.USDC>;

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
export type SigningFunction =
  (key: elliptic.ec.KeyPair, message: BN) => elliptic.ec.Signature | Promise<elliptic.ec.Signature>;
export type VerificationFunction =
  (key: elliptic.ec.KeyPair, message: BN, signature: SignatureStruct) => boolean | Promise<boolean>;

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

// ============ Transfer and Conditional Transfer Parameters ============

export interface TransferParams {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  humanAmount: string;
  clientId: string;
  expirationIsoTimestamp: string;
}

export interface ConditionalTransferParams extends TransferParams {
  factRegistryAddress: string;
  fact: string;
}

export interface StarkwareTransfer {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  quantumsAmount: string;
  nonce: string; // For signature. A base-10 integer.
  expirationEpochHours: number;
}

export interface StarkwareConditionalTransfer extends StarkwareTransfer{
  condition: string;
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
