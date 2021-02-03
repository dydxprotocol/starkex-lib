import BN from 'bn.js';

import { HashFunction } from '../types';

export { SignableApiRequest } from './api-request';
export {
  preComputeHashes,
  setGlobalStarkHashImplementation,
  setGlobalStarkHashImplementationNoSanityCheck,
} from './hashes';
export { SignableOraclePrice } from './oracle-price';
export { SignableOrder } from './order';
export { SignableWithdrawal } from './withdrawal';
export { SignableConditionalTransfer } from './conditional-transfer';

let maybeHashInWorkerThread: HashFunction = (_a: BN, _b: BN) => {
  throw new Error('Cannot use hashInWorkerThread() since worker_threads is not available');
};
try {
  /* eslint-disable @typescript-eslint/no-var-requires,global-require */
  require('worker_threads');
  // If the worker_threads module is available, update maybeHashInWorkerThread.
  maybeHashInWorkerThread = require('./hash-in-worker-thread').hashInWorkerThread;
  /* eslint-enable @typescript-eslint/no-var-requires,global-require */
} catch (error) {
  // eslint: Intentionally empty.
}

export const hashInWorkerThread = maybeHashInWorkerThread;
