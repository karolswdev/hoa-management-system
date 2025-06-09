const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Name cannot be empty.',
    'any.required': 'Name is required.',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).*$'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long.',
      'string.pattern.base': 'New password must include uppercase, lowercase, number, and special character.',
      'any.required': 'New password is required.',
    }),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};