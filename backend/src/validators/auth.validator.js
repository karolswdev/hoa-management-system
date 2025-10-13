const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    'string.base': 'Name must be a string.',
    'string.empty': 'Name is required.',
    'string.min': 'Name is required.',
    'any.required': 'Name is required.'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.empty': 'Email is required.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).*$'))
    .required()
    .messages({
      'string.base': 'Password must be a string.',
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 8 characters long.',
      'string.pattern.base': 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      'any.required': 'Password is required.'
    }),
  // Accept Turnstile fields but strip them before service layer
  captchaToken: Joi.string().optional().strip(),
  'cf-turnstile-response': Joi.string().optional().strip()
  // passwordConfirmation: Joi.string().valid(Joi.ref('password')).required().messages({
  //   'any.only': 'Password confirmation must match password.',
  //   'any.required': 'Password confirmation is required.'
  // })
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.empty': 'Email is required.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().required().messages({
    'string.base': 'Password must be a string.',
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.empty': 'Email is required.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().allow('').messages({
    'string.base': 'Token must be a string.'
  }),
  newPassword: Joi.string().allow('')
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).*$'))
    .messages({
      'string.base': 'New password must be a string.',
      'string.min': 'New password must be at least 8 characters long.',
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character.'
    })
})
.custom((value, helpers) => {
  const { token, newPassword } = value;
  const tokenIsEffectivelyMissing = token === undefined || token === '';
  const newPasswordIsEffectivelyMissing = newPassword === undefined || newPassword === '';

  if (tokenIsEffectivelyMissing && newPasswordIsEffectivelyMissing) {
    return helpers.error('custom.bothMissing');
  }
  if (tokenIsEffectivelyMissing) {
    return helpers.error('custom.tokenMissing');
  }
  if (newPasswordIsEffectivelyMissing) {
    return helpers.error('custom.newPasswordMissing');
  }
  return value;
})
.messages({
  'custom.bothMissing': 'Token and newPassword are required.',
  'custom.tokenMissing': 'Token is required.',
  'custom.newPasswordMissing': 'New password is required.'
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
