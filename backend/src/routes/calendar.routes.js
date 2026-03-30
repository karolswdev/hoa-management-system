const express = require('express');
const router = express.Router();
const { verifyToken: authenticateToken } = require('../middlewares/auth.middleware');
const { calendarQuerySchema } = require('../validators/calendarEntry.validator');
const validate = require('../middlewares/validate.middleware');
const calendarController = require('../controllers/calendar.controller');

// GET /api/calendar — aggregate calendar view (authenticated members)
router.get(
  '/',
  authenticateToken,
  validate(calendarQuerySchema),
  calendarController.getCalendarItems
);

module.exports = router;
