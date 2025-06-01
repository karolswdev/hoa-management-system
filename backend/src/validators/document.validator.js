const Joi = require('joi');

const uploadDocumentSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    'string.base': 'Title must be a string.',
    'string.empty': 'Title is required.',
    'string.min': 'Title is required.',
    'any.required': 'Title is required.'
  }),
  description: Joi.string().trim().allow('').optional().messages({ // Allow empty string for optional description
    'string.base': 'Description must be a string.'
  }),
  is_public: Joi.boolean().required().messages({
    'boolean.base': 'Is Public flag must be a boolean.',
    'any.required': 'Is Public flag is required.'
  })
});

// Schema for when a document is being updated (if needed later)
// const updateDocumentSchema = Joi.object({
//   title: Joi.string().trim().min(1).optional(),
//   description: Joi.string().trim().allow('').optional(),
//   is_public: Joi.boolean().optional(),
//   approved: Joi.boolean().optional() // Admins might also update approval status directly
// });

module.exports = {
  uploadDocumentSchema,
  // updateDocumentSchema,
};