const { query, body, validationResult } = require('express-validator');

const listEventsSchema = [
  query('status')
    .optional()
    .isIn(['upcoming', 'past'])
    .withMessage('Invalid status value. Allowed: upcoming, past.'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }) // Max 50 as recommended
    .withMessage('Limit must be a positive integer (1-50).')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['event_date', 'title', 'created_at'])
    .withMessage('Invalid sortBy value. Allowed: event_date, title, created_at.'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sortOrder value. Allowed: asc, desc.'),
];

const adminUpdateEventSchema = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string.')
    .trim(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string.')
    .trim(),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date.')
    .toDate(),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date.')
    .toDate(),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string.')
    .trim(),
];

const createEventSchema = [
  body('title')
    .isString()
    .withMessage('Title must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters.'),
  body('description')
    .isString()
    .withMessage('Description must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long.'),
  body('event_date')
    .isISO8601()
    .withMessage('Event date must be a valid ISO8601 date.')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error('Event date must be in the future.');
      }
      return true;
    })
    .toDate(),
  body('location')
    .isString()
    .withMessage('Location must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Location is required.')
    .isLength({ max: 255 })
    .withMessage('Location must be at most 255 characters.'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ param: err.param, message: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

module.exports = {
  listEventsSchema,
  adminUpdateEventSchema,
  createEventSchema,
  validate,
};