const Joi = require('joi');

const getAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

module.exports = {
  getAuditLogsSchema,
};