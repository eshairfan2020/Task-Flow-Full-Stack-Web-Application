// Child process launched via fork() in forkSpawnDemo.js.
// `process.send` only exists when this file was started with fork()
// (it sets up the IPC channel automatically).
process.on('message', (msg) => {
  console.log('[child] received:', msg);
  process.send({ type: 'pong', payload: 'hello back from child' });
});
