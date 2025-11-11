const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'hoa_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'hoa_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'hoa_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active connections gauge
const activeConnections = new promClient.Gauge({
  name: 'hoa_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// Database query duration
const dbQueryDuration = new promClient.Histogram({
  name: 'hoa_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Authentication metrics
const authAttempts = new promClient.Counter({
  name: 'hoa_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'success'],
  registers: [register],
});

// Email sending metrics
const emailsSent = new promClient.Counter({
  name: 'hoa_emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'success'],
  registers: [register],
});

// File upload metrics
const fileUploads = new promClient.Counter({
  name: 'hoa_file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['success', 'file_type'],
  registers: [register],
});

// Error counter
const errors = new promClient.Counter({
  name: 'hoa_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route', 'status_code'],
  registers: [register],
});

// Business metrics

// User registrations
const userRegistrations = new promClient.Counter({
  name: 'hoa_user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['status'],
  registers: [register],
});

// Active users gauge
const activeUsers = new promClient.Gauge({
  name: 'hoa_active_users',
  help: 'Number of active approved users',
  registers: [register],
});

// Announcements created
const announcementsCreated = new promClient.Counter({
  name: 'hoa_announcements_created_total',
  help: 'Total number of announcements created',
  labelNames: ['notify'],
  registers: [register],
});

// Documents uploaded
const documentsUploaded = new promClient.Counter({
  name: 'hoa_documents_uploaded_total',
  help: 'Total number of documents uploaded',
  labelNames: ['category'],
  registers: [register],
});

// Export metrics
module.exports = {
  register,
  metrics: {
    httpRequestDuration,
    httpRequestCounter,
    activeConnections,
    dbQueryDuration,
    authAttempts,
    emailsSent,
    fileUploads,
    errors,
    userRegistrations,
    activeUsers,
    announcementsCreated,
    documentsUploaded,
  },
};
