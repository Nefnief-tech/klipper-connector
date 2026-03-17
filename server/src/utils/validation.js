import Joi from 'joi'

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required()
})

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
})

export const printerSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  hostUrl: Joi.string().uri().required(),
  port: Joi.number().integer().min(1).max(65535).default(80),
  path: Joi.string().pattern(/^\//).required(),
  description: Joi.string().allow('').max(500)
})

export const updatePrinterSchema = Joi.object({
  name: Joi.string().min(1).max(50),
  hostUrl: Joi.string().uri(),
  port: Joi.number().integer().min(1).max(65535),
  path: Joi.string().pattern(/^\//),
  description: Joi.string().allow('').max(500),
  status: Joi.string().valid('active', 'inactive')
})
