const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only initializes if SENTRY_DSN is configured in environment variables
 */
function initSentry(app) {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.log('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',

    // Performance Monitoring
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : 0.1, // Capture 10% of transactions

    // Profiling
    profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
      : 0.1, // Profile 10% of transactions

    integrations: [
      // Enable HTTP integration
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express integration
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      new ProfilingIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events if in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED_IN_DEV) {
        return null;
      }

      // Remove sensitive data from request
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser errors that sometimes appear in SSR
      'Non-Error promise rejection captured',
      'Non-Error exception captured',
      // Network errors
      'NetworkError',
      'Network request failed',
    ],
  });

  console.log(`Sentry initialized for ${process.env.NODE_ENV} environment`);
}

/**
 * Middleware to capture Sentry request data
 */
function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Middleware to trace Sentry transactions
 */
function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Middleware to capture Sentry errors
 * Should be added after all routes but before other error handlers
 */
function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code 500 or higher
      return !error.statusCode || error.statusCode >= 500;
    },
  });
}

/**
 * Manually capture an exception
 */
function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually capture a message
 */
function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
function setUserContext(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUserContext,
};
