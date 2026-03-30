const Joi = require('joi');

const VALID_CATEGORIES = [
  'trash', 'recycling', 'yard_waste', 'meeting', 'dues',
  'community', 'holiday', 'other'
];

const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

const calendarQuerySchema = Joi.object({
  start: Joi.date().iso().required().messages({
    'any.required': 'Start date is required',
  }),
  end: Joi.date().iso().required().messages({
    'any.required': 'End date is required',
  }),
  categories: Joi.string().optional(), // comma-separated
});

const listCalendarEntriesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().valid(...VALID_CATEGORIES).optional(),
  sortBy: Joi.string().valid('title', 'category', 'created_at', 'start_date').optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
});

const createCalendarEntrySchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  category: Joi.string().valid(...VALID_CATEGORIES).required(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(null).optional(),
  all_day: Joi.boolean().optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().allow(null).optional(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null).optional(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null).optional(),
  is_recurring: Joi.boolean().optional(),
  frequency: Joi.when('is_recurring', {
    is: true,
    then: Joi.string().valid(...VALID_FREQUENCIES).required(),
    otherwise: Joi.string().valid(...VALID_FREQUENCIES).allow(null).optional(),
  }),
  day_of_week: Joi.number().integer().min(0).max(6).allow(null).optional(),
  week_of_month: Joi.number().integer().min(-1).max(5).allow(null).optional(),
  month_of_year: Joi.number().integer().min(1).max(12).allow(null).optional(),
  day_of_month: Joi.number().integer().min(1).max(31).allow(null).optional(),
  recurrence_end: Joi.date().iso().allow(null).optional(),
  seasonal_start: Joi.number().integer().min(1).max(12).allow(null).optional(),
  seasonal_end: Joi.number().integer().min(1).max(12).allow(null).optional(),
});

const updateCalendarEntrySchema = Joi.object({
  id: Joi.number().integer().required(),
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  category: Joi.string().valid(...VALID_CATEGORIES).optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(null).optional(),
  all_day: Joi.boolean().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().allow(null).optional(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null).optional(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null).optional(),
  is_recurring: Joi.boolean().optional(),
  frequency: Joi.string().valid(...VALID_FREQUENCIES).allow(null).optional(),
  day_of_week: Joi.number().integer().min(0).max(6).allow(null).optional(),
  week_of_month: Joi.number().integer().min(-1).max(5).allow(null).optional(),
  month_of_year: Joi.number().integer().min(1).max(12).allow(null).optional(),
  day_of_month: Joi.number().integer().min(1).max(31).allow(null).optional(),
  recurrence_end: Joi.date().iso().allow(null).optional(),
  seasonal_start: Joi.number().integer().min(1).max(12).allow(null).optional(),
  seasonal_end: Joi.number().integer().min(1).max(12).allow(null).optional(),
});

const createExceptionSchema = Joi.object({
  id: Joi.number().integer().required(), // entry id from params
  exception_date: Joi.date().iso().required(),
  is_cancelled: Joi.boolean().optional(),
  override_date: Joi.date().iso().allow(null).optional(),
  override_title: Joi.string().max(255).allow('', null).optional(),
  override_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null).optional(),
  note: Joi.string().max(500).allow('', null).optional(),
});

module.exports = {
  calendarQuerySchema,
  listCalendarEntriesSchema,
  createCalendarEntrySchema,
  updateCalendarEntrySchema,
  createExceptionSchema,
};
