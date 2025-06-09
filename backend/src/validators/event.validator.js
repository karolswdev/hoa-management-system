// backend/src/validators/event.validator.js

const Joi = require('joi');

const listEventsSchema = Joi.object({
  status: Joi.string().valid('upcoming', 'past').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  sortBy: Joi.string().valid('event_date', 'title', 'created_at').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).required(),
  event_date: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Event date must be in the future.'
  }),
  location: Joi.string().max(255).required(),
});

const adminUpdateEventSchema = Joi.object({
  // From path
  id: Joi.number().integer().required(),
  // From body
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  location: Joi.string().optional(),
}).with('start_date', 'end_date') // If one is present, the other should be too for validation
  .and('start_date', 'end_date') // if you want to enforce both if one is provided
  .custom((value, helpers) => {
    if (value.start_date && value.end_date && value.end_date <= value.start_date) {
      return helpers.message('End date must be after start date.');
    }
    return value;
  });

module.exports = {
  listEventsSchema,
  createEventSchema,
  adminUpdateEventSchema,
};