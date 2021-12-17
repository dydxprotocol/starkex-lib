/////////////////////////////////////////////////////////////////////////////////
// Copyright 2019 StarkWare Industries Ltd.                                    //
//                                                                             //
// Licensed under the Apache License, Version 2.0 (the "License").             //
// You may not use this file except in compliance with the License.            //
// You may obtain a copy of the License at                                     //
//                                                                             //
// https://www.starkware.co/open-source-license/                               //
//                                                                             //
// Unless required by applicable law or agreed to in writing,                  //
// software distributed under the License is distributed on an "AS IS" BASIS,  //
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.    //
// See the License for the specific language governing permissions             //
// and limitations under the License.                                          //
/////////////////////////////////////////////////////////////////////////////////

// Modified by dYdX:
// - convert to TypeScript
// - throw instead of chai assert
// - other superficial updates
// - get library path locally
// - return dummy proxy if the library fails to load

import * as BigIntBuffer from 'bigint-buffer';

const CRYPTO_CPP_LIB = 'libcrypto_c_exports';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let libcrypto: any = new Proxy({}, {
  get() {
    throw new Error(
      'Crypto c++ library not found or not supported on this platform',
    );
  },
});

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const ffi = require('ffi-napi');

  libcrypto = ffi.Library(
    `${__dirname}/${CRYPTO_CPP_LIB}`,
    {
      Hash: ['int', ['string', 'string', 'string']],
      Verify: ['bool', ['string', 'string', 'string', 'string']],
      Sign: ['int', ['string', 'string', 'string', 'string']],
      GetPublicKey: ['int', ['string', 'string']],
    },
  );
} catch {
  // eslint: Intentionally empty.
}

/**
 * Computes the Starkware version of the Pedersen hash of x and y.
 * Full specification of the hash function can be found here:
 *  https://starkware.co/starkex/docs/signatures.html#pedersen-hash-function
 */
export function pedersen(x: bigint, y: bigint): bigint {
  const xBuf = BigIntBuffer.toBufferLE(x, 32);
  const yBuf = BigIntBuffer.toBufferLE(y, 32);
  const resBuf = Buffer.alloc(1024);
  const res = libcrypto.Hash(xBuf, yBuf, resBuf);
  if (res !== 0) {
    throw new Error(`libcrypto.Hash: ${resBuf.toString()}`);
  }
  return BigIntBuffer.toBigIntLE(resBuf);
}

/**
 * Verifies ECDSA signature of a given hash message with a given public key.
 * Returns true if publicKey signs the message.
 * NOTE: This function assumes that the publicKey is on the curve.
 */
export function verify(
  starkKey: bigint,
  message: bigint,
  r: bigint,
  s: bigint,
): boolean {
  const starkKeyBuf = BigIntBuffer.toBufferLE(starkKey, 32);
  const messageBuf = BigIntBuffer.toBufferLE(message, 32);
  const rBuf = BigIntBuffer.toBufferLE(r, 32);
  const sBuf = BigIntBuffer.toBufferLE(s, 32);
  return libcrypto.Verify(starkKeyBuf, messageBuf, rBuf, sBuf);
}

/**
 * Signs message hash z with the provided privateKey, with randomness k.
 * NOTE: k should be a strong cryptographical random, and not repeat.
 */
export function sign(
  privateKey: bigint,
  message: bigint,
  k: bigint,
): {
  r: bigint,
  s: bigint,
} {
  const privateKeyBuf = BigIntBuffer.toBufferLE(privateKey, 32);
  const messageBuf = BigIntBuffer.toBufferLE(message, 32);
  const kBuf = BigIntBuffer.toBufferLE(k, 32);
  const resBuf = Buffer.alloc(1024);
  const res = libcrypto.Sign(privateKeyBuf, messageBuf, kBuf, resBuf);
  if (res !== 0) {
    throw new Error(`libcrypto.Sign: ${resBuf.toString()}`);
  }
  const r = BigIntBuffer.toBigIntLE(resBuf.slice(0, 32));
  const s = BigIntBuffer.toBigIntLE(resBuf.slice(32, 64));
  return { r, s };
}

/**
 * Deduces the public key given a private key.
 * The x coordinate of the public key is also known as the partial public key,
 * and used in StarkEx to identify the user.
 */
export function getPublicKey(privateKey: bigint): bigint {
  const privateKeyBuf = BigIntBuffer.toBufferLE(privateKey, 32);
  const resBuf = Buffer.alloc(1024);
  const res = libcrypto.GetPublicKey(privateKeyBuf, resBuf);
  if (res !== 0) {
    throw new Error(`libcrypto.GetPublicKey: ${resBuf.toString()}`);
  }
  return BigIntBuffer.toBigIntLE(resBuf);
}
