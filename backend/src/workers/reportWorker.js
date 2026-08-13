/**
 * Worker Threads demo.
 * Node is single-threaded for JS execution — a CPU-heavy loop (e.g. crunching
 * a large workload report) would block the event loop and stall every other
 * request. worker_threads runs that work on a separate OS thread instead.
 *
 * Run directly:  node src/workers/reportWorker.js
 */
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function heavyComputation(n) {
  // Deliberately expensive: sum of primes below n — stands in for "generate
  // a big analytics report" or "crunch a large CSV".
  let sum = 0;
  for (let i = 2; i < n; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) { isPrime = false; break; }
    }
    if (isPrime) sum += i;
  }
  return sum;
}

if (isMainThread) {
  console.log('[main] spinning up a worker thread for a heavy computation...');
  console.time('worker-total');

  const worker = new Worker(__filename, { workerData: { n: 200000 } });

  worker.on('message', (result) => {
    console.log('[main] received result from worker:', result);
    console.timeEnd('worker-total');
  });
  worker.on('error', (err) => console.error('[main] worker error:', err));
  worker.on('exit', (code) => console.log(`[main] worker exited with code ${code}`));

  // Proof the main thread was never blocked: this logs immediately,
  // before the worker finishes.
  console.log('[main] main thread is still free to do other work right now');
} else {
  const result = heavyComputation(workerData.n);
  parentPort.postMessage(result);
}
