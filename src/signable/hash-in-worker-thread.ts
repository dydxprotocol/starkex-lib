import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from 'worker_threads';

import BN from 'bn.js';

import { pedersen } from '../lib/starkex-resources';
import { HashFunction } from '../types';

let hashFunction: HashFunction = function hashInWorkerThread(_a: BN, _b: BN) {
  throw new Error('Expected hashInWorkerThread() to be called from the main thread');
};

if (isMainThread) {
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
      worker.on('message', (hashResult) => {
        resolve(new BN(hashResult));
      });
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  };
} else {
  const { a, b }: { a: string, b: string } = workerData;
  const hashResult = pedersen(new BN(a), new BN(b)).toString();
  parentPort!.postMessage(hashResult);
}
export const hashInWorkerThread = hashFunction;
