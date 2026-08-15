// ---------------------------------------------------------------
// var / let / const
// ---------------------------------------------------------------
function scopingDemo() {
  var fnScoped = 'I leak out of blocks (function-scoped, hoisted)';
  let blockScoped = 'I only exist inside this block';
  const CONST_VALUE = 'I cannot be reassigned (but object contents can mutate)';

  if (true) {
    var innerVar = 'still visible outside this block';
    let innerLet = 'NOT visible outside this block';
  }
  console.log('var after block:', innerVar); // works — var ignores block scope
  // console.log(innerLet) // ReferenceError if uncommented

  const obj = { mutable: true };
  obj.mutable = false; // allowed — const only locks the binding, not the contents
  console.log({ fnScoped, blockScoped, CONST_VALUE, obj });
}

// ---------------------------------------------------------------
// Data Types (primitives vs reference types)
// ---------------------------------------------------------------
function dataTypesDemo() {
  const types = {
    string: typeof 'hello',
    number: typeof 42,
    bigint: typeof 10n,
    boolean: typeof true,
    undefined: typeof undefined,
    null: typeof null, // famous quirk: this is "object"
    symbol: typeof Symbol('id'),
    object: typeof { a: 1 },
    array: typeof [1, 2, 3], // also "object" — arrays are objects
    function: typeof function () {},
  };
  console.log('Data types:', types);
}

// ---------------------------------------------------------------
// Functions & Callbacks
// ---------------------------------------------------------------
function callbackDemo(done) {
  console.log('[callback] starting a fake async task...');
  setTimeout(() => {
    const result = { ok: true, value: 42 };
    done(null, result); // error-first callback convention
  }, 50);
}

// ---------------------------------------------------------------
// Promises + then/catch/finally
// ---------------------------------------------------------------
function fakeApiCall(id, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error(`fakeApiCall(${id}) failed`));
      else resolve({ id, data: `payload-${id}` });
    }, 100);
  });
}

function promiseChainDemo() {
  return fakeApiCall(1)
    .then((res) => {
      console.log('[then] got', res);
      return fakeApiCall(2); // chaining — each .then returns a new promise
    })
    .then((res) => console.log('[then] got', res))
    .catch((err) => console.error('[catch]', err.message))
    .finally(() => console.log('[finally] chain settled, cleanup here'));
}

// ---------------------------------------------------------------
// Async/Await (syntactic sugar over promises, same semantics)
// ---------------------------------------------------------------
async function asyncAwaitDemo() {
  try {
    const res = await fakeApiCall(3);
    console.log('[async/await] got', res);
  } catch (err) {
    console.error('[async/await] caught:', err.message);
  } finally {
    console.log('[async/await] finally block ran');
  }
}

// ---------------------------------------------------------------
// Sequential vs Concurrent/Parallel execution
// ---------------------------------------------------------------
async function sequentialDemo() {
  console.time('sequential');
  const a = await fakeApiCall('seq-1'); // waits 100ms
  const b = await fakeApiCall('seq-2'); // THEN waits another 100ms
  console.timeEnd('sequential'); // ~200ms total
  return [a, b];
}

async function concurrentDemo() {
  console.time('concurrent');
  const [a, b] = await Promise.all([
    fakeApiCall('con-1'), // both fired
    fakeApiCall('con-2'), // at the same time
  ]);
  console.timeEnd('concurrent'); // ~100ms total, not 200ms
  return [a, b];
}

// ---------------------------------------------------------------
// Promise.all / Promise.allSettled / Promise.race
// ---------------------------------------------------------------
async function promiseCombinatorsDemo() {
  // Promise.all: fails fast — if ANY promise rejects, the whole thing rejects.
  try {
    const all = await Promise.all([fakeApiCall('a1'), fakeApiCall('a2', true)]);
    console.log('[Promise.all] resolved:', all);
  } catch (err) {
    console.error('[Promise.all] rejected because one task failed:', err.message);
  }

  // Promise.allSettled: never short-circuits — always tells you the outcome
  // of every promise, success or failure. Great for "best effort, report all".
  const settled = await Promise.allSettled([fakeApiCall('s1'), fakeApiCall('s2', true)]);
  console.log('[Promise.allSettled]', settled.map((r) => r.status));

  // Promise.race: resolves/rejects as soon as the FIRST promise settles.
  // Common use: request timeout races.
  const fastWin = await Promise.race([
    fakeApiCall('slow-thing').then(() => 'slow-thing won'),
    new Promise((res) => setTimeout(() => res('timeout won'), 20)),
  ]);
  console.log('[Promise.race] winner:', fastWin);
}

// ---------------------------------------------------------------
// Event Loop / Microtasks vs Macrotasks
// ---------------------------------------------------------------
function eventLoopDemo() {
  console.log('1: sync code (call stack)');

  setTimeout(() => console.log('4: setTimeout callback (macrotask)'), 0);

  Promise.resolve().then(() => console.log('3: promise .then (microtask)'));

  queueMicrotask(() => console.log('3b: queueMicrotask (microtask)'));

  console.log('2: sync code (call stack)');

  // Expected order: 1, 2, 3, 3b, 4
  // Why: the call stack drains first (1, 2). Then ALL queued microtasks run
  // before the event loop moves to the next macrotask phase, so both
  // promise callbacks (3, 3b) beat the setTimeout callback (4), even
  // though setTimeout was scheduled first.
}

// ---------------------------------------------------------------
// "API Calls"same fakeApiCall stands in for a real fetch()/axios call.
// In the actual app, src/api/client.js on the frontend does this for real.
// ---------------------------------------------------------------

async function main() {
  console.log('\n=== var/let/const ===');
  scopingDemo();

  console.log('\n=== Data Types ===');
  dataTypesDemo();

  console.log('\n=== Callbacks ===');
  await new Promise((resolve) => callbackDemo((err, res) => {
    console.log('[callback] result:', res);
    resolve();
  }));

  console.log('\n=== Promises then/catch/finally ===');
  await promiseChainDemo();

  console.log('\n=== Async/Await ===');
  await asyncAwaitDemo();

  console.log('\n=== Sequential vs Concurrent ===');
  await sequentialDemo();
  await concurrentDemo();

  console.log('\n=== Promise.all / allSettled / race ===');
  await promiseCombinatorsDemo();

  console.log('\n=== Event Loop / Microtasks vs Macrotasks ===');
  eventLoopDemo();
}

main();
