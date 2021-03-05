import BN from 'bn.js';

export const TRANSFER_FEE_ASSET_ID_BN = new BN(0); // Same for conditional transfers.
export const STARK_ORDER_SIGNATURE_EXPIRATION_BUFFER_HOURS = 24 * 7; // Seven days.
export const ORACLE_PRICE_DECIMALS = 18;

export const ORDER_FIELD_BIT_LENGTHS = {
  assetIdSynthetic: 128,
  assetIdCollateral: 250,
  assetIdFee: 250,
  quantumsAmount: 64,
  nonce: 32,
  positionId: 64,
  expirationEpochHours: 32,
};

export const WITHDRAWAL_FIELD_BIT_LENGTHS = {
  assetId: 250,
  positionId: 64,
  nonce: 32,
  quantumsAmount: 64,
  expirationEpochHours: 32,
};

export const TRANSFER_FIELD_BIT_LENGTHS = {
  assetId: 250,
  receiverPublicKey: 251,
  positionId: 64,
  nonce: 32,
  quantumsAmount: 64,
  expirationEpochHours: 32,
};

export const CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS = {
  ...TRANSFER_FIELD_BIT_LENGTHS,
  condition: 250,
};

export const ORACLE_PRICE_FIELD_BIT_LENGTHS = {
  assetName: 128,
  oracleName: 40,
  price: 120,
  timestampEpochSeconds: 32,
};
