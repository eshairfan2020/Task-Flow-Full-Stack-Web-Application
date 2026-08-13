/**
 * fork() vs spawn() — both come from Node's `child_process` module and both
 * create a new OS process (not a thread), but for different jobs:
 *
 * - spawn(): runs any external command (git, ffmpeg, a shell script) and
 *   streams stdout/stderr back. No Node-specific channel.
 * - fork(): a special case of spawn() specifically for running another
 *   NODE.JS script as a child process, with a built-in IPC channel so the
 *   parent and child can .send() messages to each other like an EventEmitter.
 *
 * Run directly: node src/workers/forkSpawnDemo.js
 */
const { spawn, fork } = require('child_process');
const path = require('path');

// ---- spawn(): shell out to a plain OS command ----
function spawnDemo() {
  console.log('[spawn] running `node -v` as a child process...');
  const child = spawn('node', ['-v']);

  child.stdout.on('data', (data) => console.log('[spawn stdout]', data.toString().trim()));
  child.stderr.on('data', (data) => console.error('[spawn stderr]', data.toString()));
  child.on('close', (code) => console.log(`[spawn] child exited with code ${code}`));
}

// ---- fork(): run another Node script with an IPC channel ----
function forkDemo() {
  const childPath = path.join(__dirname, 'forkChild.js');
  console.log('[fork] launching forkChild.js as a child Node process...');
  const child = fork(childPath);

  child.on('message', (msg) => console.log('[fork] message from child:', msg));
  child.send({ type: 'ping', payload: 'hello from parent' });

  setTimeout(() => child.kill(), 500);
}

spawnDemo();
forkDemo();
