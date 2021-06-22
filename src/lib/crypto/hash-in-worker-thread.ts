import BN from 'bn.js';
import _ from 'lodash';

import { HashFunction } from '../../types';
import { pedersen } from '../starkware';

/* eslint-disable */
let Worker: any;
let isMainThread: any;
let parentPort: any;
let workerData: any;
try {
  ({
    Worker,
    isMainThread,
    parentPort,
    workerData,
  } = require('worker_threads'));
} catch {
  throw new Error('Cannot use hashInWorkerThread() since worker_threads is not available');
}
/* eslint-enable */

let hashFunction: HashFunction = function hashInWorkerThread(_a: BN, _b: BN) {
  throw new Error('Expected hashInWorkerThread() to be called from the main thread');
};

if (!_.isNil(isMainThread)) {
  /**
   * Pedersen hash implementation that runs in a worker thread.
   */
  hashFunction = function hashInWorkerThread(a: BN, b: BN): Promise<BN> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        __filename, {
          workerData: {
            a: a.toString(),
            b: b.toString(),
          },
        },
      );
      worker.on('message', (hashResult: string) => {
        resolve(new BN(hashResult, 10));
      });
      worker.on('error', reject);
      worker.on('exit', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  };
} else {
  const { a, b }: { a: string, b: string } = workerData;
  const hashResult = pedersen(new BN(a, 10), new BN(b, 10)).toString();
  parentPort!.postMessage(hashResult);
}

export const hashInWorkerThread = hashFunction;
