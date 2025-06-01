const express = require('express');
const router = express.Router();
const { verifyToken: authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const isAdmin = authorizeRoles('admin');
const { createEventSchema, listEventsSchema, adminUpdateEventSchema } = require('../validators/event.validator');
const validate = require('../middlewares/validate.middleware'); // Correct import for validate
const eventController = require('../controllers/event.controller');

// GET / (will be /api/events/ when mounted) - List events
router.get(
  '/',
  authenticateToken,
  validate(listEventsSchema), // Correctly wrap schema
  eventController.listEvents
);

// POST / (will be /api/events/ when mounted) - Create a new event (Admin only)
router.post(
  '/',
  authenticateToken,
  isAdmin,
  validate(createEventSchema), // Correctly wrap schema
  eventController.createEvent
);

// PUT /api/events/:id - Update an existing event (Admin only)
router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  validate(adminUpdateEventSchema), // Correctly wrap schema
  eventController.adminUpdateEvent
);

// DELETE /api/events/:id - Delete an event (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  eventController.adminDeleteEvent
);

module.exports = router;