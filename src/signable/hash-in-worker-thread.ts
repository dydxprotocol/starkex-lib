import BN from 'bn.js';

import { pedersen } from '../lib/starkex-resources';
import { HashFunction } from '../types';

/**
 * Make the hashInWorkerThread function by passing in the Node worker_threads function.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function hashInWorkerThread(workerThreadsModule: any) {
  const {
    Worker,
    isMainThread,
    parentPort,
    workerData,
  } = workerThreadsModule;

  let hashFunction: HashFunction = function hashInWorkerThreadInner(_a: BN, _b: BN) {
    throw new Error('Expected hashInWorkerThread() to be called from the main thread');
  };

  if (isMainThread) {
    /**
     * Pedersen hash implementation that runs in a worker thread.
     */
    hashFunction = function hashInWorkerThreadInner(a: BN, b: BN): Promise<BN> {
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
          resolve(new BN(hashResult));
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
    const hashResult = pedersen(new BN(a), new BN(b)).toString();
    parentPort!.postMessage(hashResult);
  }

  return hashFunction;
}
