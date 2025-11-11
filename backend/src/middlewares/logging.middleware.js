const logger = require('../config/logger');
const { metrics } = require('../config/metrics');

/**
 * Middleware to log HTTP requests and track metrics
 */
function loggingMiddleware(req, res, next) {
  const startTime = Date.now();

  // Increment active connections
  metrics.activeConnections.inc();

  // Log the incoming request
  logger.logRequest(req);

  // Capture the original end function
  const originalEnd = res.end;

  // Override the end function to log response
  res.end = function (...args) {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode;

    // Record metrics
    metrics.httpRequestDuration.labels(req.method, route, statusCode).observe(duration);
    metrics.httpRequestCounter.labels(req.method, route, statusCode).inc();
    metrics.activeConnections.dec();

    // Track errors
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      metrics.errors.labels(errorType, route, statusCode).inc();
    }

    // Log the response
    logger.http('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${duration.toFixed(3)}s`,
      userId: req.user?.id,
    });

    // Call the original end function
    originalEnd.apply(res, args);
  };

  next();
}

module.exports = loggingMiddleware;
