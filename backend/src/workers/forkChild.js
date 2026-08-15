process.on('message', (msg) => {
  console.log('[child] received:', msg);
  process.send({ type: 'pong', payload: 'hello back from child' });
});
