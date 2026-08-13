require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const { connectRedis } = require('./src/config/redis');
require('./src/utils/eventEmitter'); // registers listeners as a side effect (see file)

const { apiLimiter } = require('./src/middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

const app = express();

// ---- Security middleware (OWASP-adjacent basics) ----
app.use(helmet()); // sets a batch of protective headers (no-sniff, HSTS, etc.)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' })); // body parser, capped to avoid huge-payload abuse
app.use('/api', apiLimiter); // rate limiting on the whole API surface

// Serve uploaded files. In production you'd usually put these in a storage
// bucket (S3/GCS) behind a CDN rather than the app server's own disk.
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));

// ---- Health check (useful for PM2 / load balancers / uptime monitors) ----
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ---- REST routes (MVC "Controller" layer lives inside these) ----
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api', taskRoutes); // exposes /api/teams/:teamId/tasks and /api/tasks/:taskId/...

// ---- 404 + centralized error handler (must be registered last) ----
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Give Redis a bounded amount of time to connect; don't let a missing
    // cache layer block the API from ever starting.
    await Promise.race([
      connectRedis(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), 2000)),
    ]);
  } catch (err) {
    // Don't crash the whole API just because Redis isn't up yet — caching
    // helpers already degrade gracefully (see src/utils/cache.js).
    console.warn('[startup] Redis unavailable, continuing without cache:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[server] TaskFlow API listening on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
