export const ORDER_FIELD_BIT_LENGTHS = {
  assetIdSynthetic: 128,
  assetIdCollateral: 250,
  assetIdFee: 250,
  quantumsAmount: 64,
  nonce: 32,
  positionId: 64,
  expirationTimestamp: 32,
};

export const WITHDRAWAL_FIELD_BIT_LENGTHS = {
  assetId: 250,
  positionId: 64,
  nonce: 32,
  quantumsAmount: 64,
  expirationTimestamp: 32,
};

export const ORACLE_PRICE_FIELD_BIT_LENGTHS = {
  assetName: 128,
  oracleName: 40,
  price: 120,
  timestamp: 32,
};
