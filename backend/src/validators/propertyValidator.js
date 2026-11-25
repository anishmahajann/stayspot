import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schema for creating a new property.
 */
export const createPropertySchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required().messages({
    'string.empty': 'Property title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title cannot exceed 150 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().min(10).required().messages({
    'string.empty': 'Property description is required',
    'string.min': 'Description must be at least 10 characters',
    'any.required': 'Description is required',
  }),
  type: Joi.string()
    .valid('hotel', 'resort', 'villa', 'apartment', 'event-venue')
    .required()
    .messages({
      'any.only': 'Property type must be hotel, resort, villa, apartment, or event-venue',
      'any.required': 'Property type is required',
    }),
  location: Joi.object({
    address: Joi.string().trim().allow('').optional(),
    city: Joi.string().trim().required().messages({
      'string.empty': 'City is required',
      'any.required': 'City is required',
    }),
    state: Joi.string().trim().allow('').optional(),
    country: Joi.string().trim().default('India'),
    coordinates: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array()
        .items(Joi.number())
        .length(2)
        .default([0, 0])
        .messages({
          'array.length': 'Coordinates must be an array of [longitude, latitude]',
        }),
    }).optional(),
  }).required(),
  amenities: Joi.array().items(Joi.string().trim()).default([]),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().allow('').optional(),
      })
    )
    .default([]),
  policies: Joi.object({
    checkInTime: Joi.string().trim().default('14:00'),
    checkOutTime: Joi.string().trim().default('11:00'),
    cancellation: Joi.string()
      .valid('flexible', 'moderate', 'strict')
      .default('moderate'),
    petsAllowed: Joi.boolean().default(false),
    smokingAllowed: Joi.boolean().default(false),
  }).default(),
  basePrice: Joi.number().min(0).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  count: Joi.number().integer().min(1).optional(),
  isActive: Joi.boolean().default(true),
});

/**
 * Validation schema for updating property details.
 */
export const updatePropertySchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).optional(),
  description: Joi.string().trim().min(10).optional(),
  type: Joi.string()
    .valid('hotel', 'resort', 'villa', 'apartment', 'event-venue')
    .optional(),
  location: Joi.object({
    address: Joi.string().trim().allow('').optional(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().allow('').optional(),
    country: Joi.string().trim().optional(),
    coordinates: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2).optional(),
    }).optional(),
  }).optional(),
  amenities: Joi.array().items(Joi.string().trim()).optional(),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().allow('').optional(),
      })
    )
    .optional(),
  policies: Joi.object({
    checkInTime: Joi.string().trim().optional(),
    checkOutTime: Joi.string().trim().optional(),
    cancellation: Joi.string().valid('flexible', 'moderate', 'strict').optional(),
    petsAllowed: Joi.boolean().optional(),
    smokingAllowed: Joi.boolean().optional(),
  }).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

/**
 * Validation schema for creating a room unit or event hall under a property.
 */
export const createUnitSchema = Joi.object({
  propertyId: Joi.string().pattern(objectIdPattern).optional(),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Unit name is required',
    'any.required': 'Unit name is required',
  }),
  description: Joi.string().trim().allow('').optional(),
  capacity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Capacity must be at least 1 guest',
    'any.required': 'Capacity is required',
  }),
  count: Joi.number().integer().min(1).required().messages({
    'number.min': 'Unit count must be at least 1',
    'any.required': 'Unit count is required',
  }),
  basePrice: Joi.number().min(0).required().messages({
    'number.min': 'Base price cannot be negative',
    'any.required': 'Base price is required',
  }),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().allow('').optional(),
      })
    )
    .default([]),
  amenities: Joi.array().items(Joi.string().trim()).default([]),
  isActive: Joi.boolean().default(true),
});

/**
 * Validation schema for blocking dates on a room unit.
 */
export const blockDateSchema = Joi.object({
  unitId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid unit ID format',
    'any.required': 'Unit ID is required',
  }),
  from: Joi.date().iso().required().messages({
    'date.base': 'From date must be a valid date in ISO format',
    'any.required': 'From date is required',
  }),
  to: Joi.date().iso().greater(Joi.ref('from')).required().messages({
    'date.base': 'To date must be a valid date in ISO format',
    'date.greater': 'To date must be strictly after From date',
    'any.required': 'To date is required',
  }),
  reason: Joi.string().trim().max(250).allow('').optional(),
});

/**
 * Validation schema for creating or updating a dynamic pricing rule.
 */
export const pricingRuleSchema = Joi.object({
  unitId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid unit ID format',
    'any.required': 'Unit ID is required',
  }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Rule name is required',
    'any.required': 'Rule name is required',
  }),
  type: Joi.string()
    .valid('seasonal', 'weekend', 'length-of-stay', 'custom')
    .required()
    .messages({
      'any.only': 'Type must be seasonal, weekend, length-of-stay, or custom',
      'any.required': 'Type is required',
    }),
  startDate: Joi.date().iso().allow(null).optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).allow(null).optional(),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  priceOverride: Joi.number().min(0).allow(null).optional(),
  percentageAdjustment: Joi.number().allow(null).optional(),
  minNights: Joi.number().integer().min(1).allow(null).optional(),
  priority: Joi.number().integer().default(0),
  isActive: Joi.boolean().default(true),
});

export default {
  createPropertySchema,
  updatePropertySchema,
  createUnitSchema,
  blockDateSchema,
  pricingRuleSchema,
};
