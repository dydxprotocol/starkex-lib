export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export interface Order {
  orderType: string;
  nonce: string;
  publicKey: string;
  amountSell: string;
  amountBuy: string;
  amountFee: string;
  tokenIdSell: string;
  tokenIdBuy: string;
  positionId: string;
  expirationTimestamp: string;
}

export interface Signature {
  r: string;
  s: string;
}
