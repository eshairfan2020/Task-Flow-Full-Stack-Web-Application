/**
 * fork() vs spawn() — both come from Node's `child_process` module and both
 * create a new OS process (not a thread), but for different jobs:
 /**
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
