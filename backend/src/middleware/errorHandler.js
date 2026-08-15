// Express recognizes error middleware by its 4-argument signature (err, req, res, next).
// Every controller below calls next(err) on failure instead of handling the
// response itself this is what keeps error formatting in ONE place.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV !== 'production' && !isServerError ? {} : {}),
  });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
