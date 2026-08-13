// Redis client — used for caching GET /tasks responses (see cache.js)
// and could equally back rate-limiting or session storage.
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    // Cap reconnect attempts so a missing Redis instance can't hang the
    // whole app forever — cache.js already degrades gracefully without it.
    reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 100, 1000)),
  },
});

redisClient.on('error', (err) => console.error('[redis] client error:', err.message));

let connected = false;
async function connectRedis() {
  if (connected) return redisClient;
  await redisClient.connect();
  connected = true;
  console.log('[redis] connected');
  return redisClient;
}

module.exports = { redisClient, connectRedis };
