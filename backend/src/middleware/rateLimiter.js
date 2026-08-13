// Rate Limiting protects against brute force + basic abuse.
// Two limiters: a loose one for the whole API, a strict one just for
// /auth/login where credential-stuffing / brute force attempts happen.
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                 // 300 requests / IP / window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,                   // only 5 login attempts / IP / window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in a few minutes.' },
});

module.exports = { apiLimiter, loginLimiter };
