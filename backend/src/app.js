require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path'); // Required for serving static files if needed later
const db = require('../models'); // Sequelize instance and models

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
// Public document routes will be separate, e.g., publicDocumentRoutes

const app = express();

// Middleware
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the HOA Management API!' });
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
// app.use('/api/documents', publicDocumentRoutes); // For public listing/downloading

// Global error handler (optional, can be more sophisticated)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ message });
});

const PORT = process.env.PORT || 3001; // Default to 3001 if PORT not in .env

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    // await db.sequelize.sync(); // { alter: true } or { force: true } during dev if needed
    // console.log('All models were synchronized successfully.'); // Uncomment if using sync

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
      console.log(`Access it at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    process.exit(1); // Exit if cannot connect to DB
  }
}

// Only start server if this file is run directly (not when imported as a module)
if (require.main === module) {
  startServer();
}

module.exports = app; // Export for testing or other purposes