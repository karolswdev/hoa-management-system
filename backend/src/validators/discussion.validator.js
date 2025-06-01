const Joi = require('joi');

const createThreadSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  content: Joi.string().min(1).required(),
});

const createReplySchema = Joi.object({
  content: Joi.string().min(1).required(),
});

const listThreadsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = {
  createThreadSchema,
  createReplySchema,
  listThreadsSchema,
};