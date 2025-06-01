const Joi = require('joi');

const updateConfigSchema = {
  body: Joi.object().keys({
    value: Joi.string().min(1).required(),
  }),
  params: Joi.object().keys({
    key: Joi.string().required(),
  }),
};

module.exports = {
  updateConfigSchema,
};