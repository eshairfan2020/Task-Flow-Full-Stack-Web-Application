// Cache-aside pattern: check Redis first; on a miss, run the DB query,
// store the result with a TTL, then return it. Cuts repeated-read load
// off MySQL for hot endpoints like "list tasks for a team".
const { redisClient } = require('../config/redis');

const DEFAULT_TTL_SECONDS = 30;

async function getOrSetCache(key, ttl, fetcher) {
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return { data: JSON.parse(cached), fromCache: true };
    }
  } catch (err) {
    // If Redis is down, don't fail the request — just skip the cache.
    console.warn('[cache] read failed, falling back to DB:', err.message);
  }

  const fresh = await fetcher();

  try {
    await redisClient.setEx(key, ttl ?? DEFAULT_TTL_SECONDS, JSON.stringify(fresh));
  } catch (err) {
    console.warn('[cache] write failed:', err.message);
  }

  return { data: fresh, fromCache: false };
}

async function invalidate(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) await redisClient.del(keys);
  } catch (err) {
    console.warn('[cache] invalidate failed:', err.message);
  }
}

module.exports = { getOrSetCache, invalidate };
