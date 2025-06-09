const Joi = require('joi');

const updateConfigSchema = Joi.object({
  // From req.body
  value: Joi.string().trim().min(1).required().messages({
    'string.base': 'Value must be a string.',
    'string.empty': 'Value cannot be empty.',
    'string.min': 'Value cannot be empty.',
    'any.required': 'Value is required.',
  }),
  // From req.params
  key: Joi.string().required(),
});

module.exports = {
  updateConfigSchema,
};