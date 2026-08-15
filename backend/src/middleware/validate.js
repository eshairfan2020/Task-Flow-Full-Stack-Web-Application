// Small hand-rolled validator (no extra dependency) + XSS sanitization.
// SQL Injection defense lives in the models (parameterized queries), NOT here
// sanitizing strings is not a substitute for parameterized queries.
const xss = require('xss');

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
}

function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => req.body[f] === undefined || req.body[f] === '');
    if (missing.length) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    }
    next();
  };
}

module.exports = { sanitizeBody, requireFields };
