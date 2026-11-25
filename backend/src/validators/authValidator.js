import Joi from 'joi';
import { AppError } from '../middleware/errorHandler.js';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  phone: Joi.string().trim().allow('').optional(),
  role: Joi.string().valid('guest', 'owner').default('guest'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().trim().allow('').optional(),
  avatar: Joi.string().allow('').optional(),
}).min(1);

/**
 * Validation middleware factory
 * @param {Joi.ObjectSchema} schema 
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message).join('. ');
      return next(new AppError(errorMessages, 400));
    }

    req[source] = value;
    next();
  };
};

export default { registerSchema, loginSchema, updateProfileSchema, validate };
