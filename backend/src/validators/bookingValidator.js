import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schema for temporary booking holds / reservation checkout initiation.
 */
export const holdSchema = Joi.object({
  unitId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid RoomUnit ID format',
    'any.required': 'Unit ID is required',
  }),
  checkIn: Joi.date().iso().required().messages({
    'date.base': 'Check-in must be a valid date in ISO format',
    'any.required': 'Check-in date is required',
  }),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required().messages({
    'date.base': 'Check-out must be a valid date in ISO format',
    'date.greater': 'Check-out date must be strictly after check-in date',
    'any.required': 'Check-out date is required',
  }),
  guests: Joi.number().integer().min(1).required().messages({
    'number.base': 'Number of guests must be a number',
    'number.min': 'Number of guests must be at least 1',
    'any.required': 'Number of guests is required',
  }),
});

/**
 * Validation schema for cancelling an existing booking.
 */
export const cancelSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': 'Cancellation reason cannot exceed 500 characters',
  }),
});

export default { holdSchema, cancelSchema };
