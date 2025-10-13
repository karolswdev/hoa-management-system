const Joi = require('joi');

const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().max(255).required().messages({
    'string.base': 'Title must be a string.',
    'string.empty': 'Title is required.',
    'string.max': 'Title cannot exceed 255 characters.',
    'any.required': 'Title is required.'
  }),
  content: Joi.string().trim().required().messages({
    'string.base': 'Content must be a string.',
    'string.empty': 'Content is required.',
    'any.required': 'Content is required.'
  }),
  expiresAt: Joi.date().iso().greater('now').optional().messages({
    'date.base': 'Expiration date must be a valid date.',
    'date.format': 'Expiration date must be in ISO 8601 format.',
    'date.greater': 'Expiration date must be in the future.'
  }),
  notify: Joi.boolean().optional(),
});

const updateAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional().messages({
    'string.base': 'Title must be a string.',
    'string.min': 'Title must not be empty if provided.',
    'string.max': 'Title cannot exceed 255 characters.'
  }),
  content: Joi.string().trim().min(1).optional().messages({
    'string.base': 'Content must be a string.',
    'string.min': 'Content must not be empty if provided.'
  }),
  expires_at: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'expires_at must be a valid date or null.',
    'date.format': 'expires_at must be a valid ISO 8601 date or null.'
  }),
  notify: Joi.boolean().optional(),
}).or('title', 'content', 'expires_at').messages({
  'object.missing': 'At least one field (title, content, or expires_at) must be provided for update.'
});

const listAnnouncementsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number.',
    'number.integer': 'Page must be an integer.',
    'number.min': 'Page must be at least 1.'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number.',
    'number.integer': 'Limit must be an integer.',
    'number.min': 'Limit must be at least 1.',
    'number.max': 'Limit must be between 1 and 100.'
  }),
  sortOrder: Joi.string().valid('asc', 'desc').optional().messages({
    'string.base': 'Sort order must be a string.',
    'any.only': 'Sort order must be one of "asc" or "desc".'
  }),
  status: Joi.string().valid('active').optional().messages({
    'string.base': 'Status must be a string.',
    'any.only': 'Status must be "active" if provided.'
  }),
  sortBy: Joi.string().valid('created_at').optional().messages({
    'string.base': 'Sort by must be a string.',
    'any.only': 'Sort by must be "created_at" if provided.'
  })
});

module.exports = {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  listAnnouncementsSchema,
};
