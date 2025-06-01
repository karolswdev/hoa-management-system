const Joi = require('joi');

const updateUserStatusSchema = Joi.object({
  status: Joi.string().trim().valid('approved', 'pending', 'rejected').required().messages({
    'string.base': 'Status must be a string.',
    'string.empty': 'Status is required.',
    'any.only': 'Status must be one of [approved, pending, rejected].',
    'any.required': 'Status is required.'
  })
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().trim().valid('admin', 'member').required().messages({
    'string.base': 'Role must be a string.',
    'string.empty': 'Role is required.',
    'any.only': 'Role must be one of [admin, member].',
    'any.required': 'Role is required.'
  })
});

const changePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,}$'))
    .required()
    .messages({
      'string.base': 'New password must be a string.',
      'string.empty': 'New password is required.',
      'string.min': 'New password must be at least 8 characters long.',
      'string.pattern.base': 'New password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      'any.required': 'New password is required.'
    })
});

module.exports = {
  updateUserStatusSchema,
  updateUserRoleSchema,
  changePasswordSchema, // Added for User Story 7, will be used later
};