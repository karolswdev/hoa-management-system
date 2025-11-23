require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const path = require('path'); // Required for serving static files if needed later
const db = require('../models'); // Sequelize instance and models
const logger = require('./config/logger');
const { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./config/sentry');
const loggingMiddleware = require('./middlewares/logging.middleware');
const { defaultLimiter } = require('./config/rate-limit');
const { register: metricsRegister } = require('./config/metrics');

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173']; // Development defaults

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminUserRoutes = require('./routes/admin.user.routes');
const adminDocumentRoutes = require('./routes/document.routes'); // For admin document operations
const announcementRoutes = require('./routes/announcement.routes.js');
const eventRoutes = require('./routes/event.routes.js');
const userRoutes = require('./routes/user.routes'); // Routes for user self-management
const discussionRoutes = require('./routes/discussion.routes');
const configRoutes = require('./routes/config.routes'); // Routes for admin config management
const auditRoutes = require('./routes/audit.routes'); // Routes for admin audit log management
const publicDocumentRoutes = require('./routes/public.document.routes'); // For public document access
const boardRoutes = require('./routes/board.routes'); // Routes for board governance

const app = express();

// Initialize Sentry (must be before any other middleware)
initSentry(app);
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Middleware
app.set('trust proxy', 1); // honor Cloudflare/NGINX X-Forwarded-* headers
app.use(cors(corsOptions));
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Logging and metrics middleware
app.use(loggingMiddleware);

// Apply rate limiting to all API routes
app.use('/api', defaultLimiter);

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the HOA Management API!' });
});

// Lightweight health endpoint for load balancers and Compose healthchecks
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Prometheus metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    const metrics = await metricsRegister.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error: error.message });
    res.status(500).end();
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/documents', adminDocumentRoutes); // Admin-specific document routes
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes); // Mount user self-management routes
app.use('/api/discussions', discussionRoutes);
app.use('/api/admin/config', configRoutes); // Mount admin config routes
app.use('/api/admin/audit-logs', auditRoutes); // Mount admin audit log routes
app.use('/api/documents', publicDocumentRoutes); // For public listing/downloading
app.use('/api/board', boardRoutes); // Mount board governance routes

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// Global error handler
app.use((err, req, res, next) => {
  // Log the error
  logger.logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Don't expose internal error details in production
  const errorResponse = {
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred'
      : message,
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  res.status(statusCode).json(errorResponse);
});

const PORT = process.env.PORT || 3001; // Default to 3001 if PORT not in .env

async function startServer() {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Access it at http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Metrics endpoint: http://localhost:${PORT}/api/metrics`);
      logger.info(`Health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database or start server', { error: error.message });
    process.exit(1); // Exit if cannot connect to DB
  }
}

// Only start server if this file is run directly (not when imported as a module)
if (require.main === module) {
  startServer();
}

module.exports = app; // Export for testing or other purposes
