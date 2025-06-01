const Joi = require('joi');
const ApiError = require('../utils/ApiError'); // Assuming ApiError utility

const validate = (schema) => (req, res, next) => {
  const validSchema = Joi.compile(schema);
  const object = {};
  if (req.method === 'GET' || req.method === 'DELETE') {
    Object.assign(object, req.params, req.query);
  } else { // POST, PUT, PATCH
    Object.assign(object, req.params, req.query, req.body);
  }

  const { value, error } = validSchema.validate(object, {
    abortEarly: false, // return all errors
    allowUnknown: true, // allow properties not defined in schema
    stripUnknown: true, // remove properties not defined in schema
  });

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(400, errorMessage));
  }
  Object.assign(req, value); // Assign validated (and potentially transformed) data back to req
  return next();
};

module.exports = validate;