const express = require('express');
const router = express.Router();
const { verifyToken: authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const isAdmin = authorizeRoles('admin');
const {
  listCalendarEntriesSchema,
  createCalendarEntrySchema,
  updateCalendarEntrySchema,
  createExceptionSchema,
} = require('../validators/calendarEntry.validator');
const validate = require('../middlewares/validate.middleware');
const calendarEntryController = require('../controllers/calendarEntry.controller');

// GET /api/calendar-entries — list all entries (admin)
router.get(
  '/',
  authenticateToken,
  isAdmin,
  validate(listCalendarEntriesSchema),
  calendarEntryController.listEntries
);

// GET /api/calendar-entries/:id — single entry (admin)
router.get(
  '/:id',
  authenticateToken,
  isAdmin,
  calendarEntryController.getEntry
);

// GET /api/calendar-entries/:id/occurrences — next occurrences preview (admin)
router.get(
  '/:id/occurrences',
  authenticateToken,
  isAdmin,
  calendarEntryController.getNextOccurrences
);

// POST /api/calendar-entries — create entry (admin)
router.post(
  '/',
  authenticateToken,
  isAdmin,
  validate(createCalendarEntrySchema),
  calendarEntryController.createEntry
);

// PUT /api/calendar-entries/:id — update entry (admin)
router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  validate(updateCalendarEntrySchema),
  calendarEntryController.updateEntry
);

// DELETE /api/calendar-entries/:id — delete entry (admin)
router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  calendarEntryController.deleteEntry
);

// POST /api/calendar-entries/:id/exceptions — add exception (admin)
router.post(
  '/:id/exceptions',
  authenticateToken,
  isAdmin,
  validate(createExceptionSchema),
  calendarEntryController.addException
);

// DELETE /api/calendar-entries/exceptions/:exceptionId — remove exception (admin)
router.delete(
  '/exceptions/:exceptionId',
  authenticateToken,
  isAdmin,
  calendarEntryController.removeException
);

module.exports = router;
