/**
 * Global Error Handler Middleware
 * 
 * Catches and formats errors for consistent API responses
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
